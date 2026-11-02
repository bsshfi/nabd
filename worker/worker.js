/* نَبْض | NABD — السيرفر (Cloudflare Worker + D1)
   صندوق بريد مؤقت للعائلة:
   - كل المحتوى (الأسماء، الرسائل، الصور، الصوت، الرسومات) يتشفّر على الجهاز بمفتاح العائلة، والسيرفر ما يقدر يقراه.
   - الرسالة تنحذف من السيرفر أول ما توصل لكل الأجهزة، وبحد أقصى ٣ أيام.
   - الصلاحيات: منشئ المجموعة مدير دائم، ويعطي ويشيل الإشراف، والمشرفين ما يقدرون يشيلونه.
   - الإشعارات (Web Push بدون محتوى): الجهاز يسحب التفاصيل من /pending ويكتب النص بنفسه.
   - الإدارة من admin.wamdarc.com (نفس ADMIN_KEY حق siraj-api و push-wamdarc).
   الربط المطلوب: قاعدة D1 باسم DB. مفاتيح VAPID محفوظة في جدول config (أو كمتغيرات VAPID_PUBLIC/VAPID_PRIVATE).
   ADMIN_KEY اختياري: إذا ما انضاف، السيرفر يتحقق من المفتاح عن طريق siraj-api. */

const ORIGINS = ['https://nabd.wamdarc.com', 'https://admin.wamdarc.com', 'https://bsshfi.github.io'];
const SIRAJ_API = 'https://siraj-api.bsshfi.workers.dev';
const TTL = 3 * 864e5;              // أقصى مدة للرسالة في السيرفر
const MAX_MEDIA = 1950000;          // base64 (أقل من حد صف D1)
const MAX_PROFILE = 600000;
const ONLINE_MS = 90e3;
const NUDGE_MAX = 3;

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get('Origin') || '';
    const allow = ORIGINS.includes(origin) || /^https?:\/\/([a-z0-9-]+\.)?wamdarc\.com$/.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : ORIGINS[0];
    const cors = {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Admin-Key',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

    try {
      await ensureSchema(env);
      const url = new URL(req.url);
      const p = url.pathname.replace(/\/+$/, '');
      const now = Date.now();
      const q = url.searchParams;

      if (p === '' || p === '/health') return json({ ok: true, app: 'nabd', service: 'nabd-api' });
      if (p === '/vapid') return json({ key: (await vapid(env)).pub });

      /* ===== لوحة الإدارة (admin.wamdarc.com) ===== */
      if (p === '/stats' && req.method === 'GET') {
        if (!(await isAdmin(req, env))) return json({ error: 'unauthorized' }, 401);
        return json(await stats(env, now));
      }
      if (p === '/broadcast' && req.method === 'POST') {
        if (!(await isAdmin(req, env))) return json({ error: 'unauthorized' }, 401);
        const b = await req.json().catch(() => ({}));
        const src = b.ar || b;
        const title = String(src.title || '').trim().slice(0, 80), text = String(src.body || '').trim().slice(0, 300);
        if (!title) return json({ error: 'missing' }, 400);
        const rows = (await env.DB.prepare('SELECT id, endpoint, p256dh, auth, pending FROM devices WHERE endpoint IS NOT NULL').all()).results || [];
        await env.DB.prepare('INSERT INTO bcast (created, title, body, total) VALUES (?,?,?,?)').bind(now, title, text, rows.length).run();
        ctx.waitUntil(push(env, rows, { t: 'x', title, body: text }));
        return json({ ok: true, sent: rows.length });
      }

      /* ===== إحصائيات ومض آرك (لكل التطبيقات، قاعدة STATS) ===== */
      if (p === '/wamd/hit' && req.method === 'POST') {
        if (!env.STATS) return json({ ok: false, error: 'no-stats-db' });
        const b = await req.json().catch(() => ({}));
        return json(await wamdHit(env, b));
      }
      if ((p === '/wamd/log' || p === '/wamd/backup') && req.method === 'GET') {
        if (!(await isAdmin(req, env))) return json({ error: 'unauthorized' }, 401);
        if (p === '/wamd/log') return json(await wamdLog(env, parseInt(q.get('before'), 10) || 0, parseInt(q.get('limit'), 10) || 30));
        return json(await wamdBackup(env));
      }
      if (p === '/wamd/analytics' && req.method === 'GET') {
        if (!(await isAdmin(req, env))) return json({ error: 'unauthorized' }, 401);
        if (!env.STATS) return json({ error: 'no-stats-db' }, 503);
        return json(await wamdAnalytics(env, parseInt(q.get('days'), 10)));
      }

      /* ===== إنشاء عائلة ===== */
      if (p === '/family/create' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const { code_id, wrapped, salt, blob, owner, members, dev } = b;
        if (!okHex(code_id, 64) || !okB64(wrapped, 400) || !okB64(salt, 100) || !okB64(blob, MAX_PROFILE) || !owner || !okId(owner.id) || !okPin(owner.pin) || !Array.isArray(members) || members.length > 20) return json({ error: 'bad' }, 400);
        if (await env.DB.prepare('SELECT 1 FROM families WHERE code_id=?').bind(code_id).first()) return json({ error: 'exists' }, 409);
        const fam = rid(16), devId = rid(12), secret = rid(24);
        const stmts = [
          env.DB.prepare('INSERT INTO families (id, code_id, wrapped, salt, blob, rev, created, owner, auto_del, update_req, active) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
            .bind(fam, code_id, wrapped, salt, blob, 1, now, owner.id, 30, 0, now),
          env.DB.prepare('INSERT INTO members (id, fam, kind, admin, pin, created, removed) VALUES (?,?,?,?,?,?,0)').bind(owner.id, fam, 'parent', 1, await pinHash(fam, owner.id, owner.pin), now)
        ];
        for (const m of members) {
          if (!okId(m.id) || m.id === owner.id) continue;
          stmts.push(env.DB.prepare('INSERT INTO members (id, fam, kind, admin, pin, created, removed) VALUES (?,?,?,0,NULL,?,0)').bind(m.id, fam, m.kind === 'parent' ? 'parent' : 'child', now));
        }
        stmts.push(newDevice(env, fam, devId, await sha('tok:' + secret), dev, [owner.id], [owner.id], now));
        await env.DB.batch(stmts);
        await count(env, 'families', 1);
        return json({ ok: true, fam, dev: devId, token: devId + '.' + secret, created: now });
      }

      /* ===== الانضمام أو الرجوع بكود العائلة ===== */
      if (p === '/join' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const ipk = await sha('ip:' + (req.headers.get('CF-Connecting-IP') || 'local'));
        const lim = await env.DB.prepare('SELECT n, until FROM jfail WHERE ip=?').bind(ipk).first();
        if (lim && lim.until > now) return json({ error: 'slow', wait: Math.ceil((lim.until - now) / 60000) }, 429);
        const f = okHex(b.code_id, 64) ? await env.DB.prepare('SELECT * FROM families WHERE code_id=?').bind(b.code_id).first() : null;
        if (!f) {
          const n = (lim && lim.until > now - 36e5 ? lim.n : 0) + 1;
          await env.DB.prepare('INSERT INTO jfail (ip, n, until) VALUES (?,?,?) ON CONFLICT(ip) DO UPDATE SET n=excluded.n, until=excluded.until')
            .bind(ipk, n, n >= 8 ? now + 15 * 60e3 : now).run();
          return json({ error: 'notfound' }, 404);
        }
        const devId = rid(12), secret = rid(24);
        await newDevice(env, f.id, devId, await sha('tok:' + secret), b.dev, [], [], now).run();
        return json({ ok: true, fam: f.id, dev: devId, token: devId + '.' + secret, wrapped: f.wrapped, salt: f.salt, ...(await famView(env, f)) });
      }

      /* ===== من هنا: طلبات الأجهزة (توكن) ===== */
      const D = await authDevice(req, env);
      if (!D) return json({ error: 'auth' }, 401);
      const [F, M] = await Promise.all([env.DB.prepare('SELECT * FROM families WHERE id=?').bind(D.fam).first(), members(env, D.fam)]);
      if (!F) return json({ error: 'auth' }, 401);
      const byId = Object.fromEntries(M.map((m) => [m.id, m]));
      const devMembers = jarr(D.members), devTrusted = jarr(D.trusted);
      // العضو اللي يتصرف الحين (لازم يكون مضاف لهذا الجهاز)
      const actor = (id) => (id && byId[id] && !byId[id].removed && devMembers.includes(id)) ? byId[id] : null;
      const actorAdmin = (id) => { const a = actor(id); return a && (a.admin || a.id === F.owner) && devTrusted.includes(id) ? a : null; };

      if (p === '/family' && req.method === 'GET') {
        return json({ ok: true, wrapped: F.wrapped, salt: F.salt, ...(await famView(env, F)), dev: { id: D.id, members: devMembers, trusted: devTrusted, reminder: D.reminder } });
      }

      /* --- اختيار شخص على هذا الجهاز --- */
      if (p === '/use' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const m = byId[b.member];
        if (!m || m.removed) return json({ error: 'nomember' }, 404);
        const needsPin = m.kind === 'parent' || m.admin || m.id === F.owner;
        if (needsPin) {
          if (D.pin_lock > now) return json({ error: 'locked', wait: Math.ceil((D.pin_lock - now) / 60000) }, 429);
          if (!okPin(b.pin)) return json({ error: m.pin ? 'need_pin' : 'set_pin' }, 403);
          if (!m.pin) {
            await env.DB.prepare('UPDATE members SET pin=? WHERE id=?').bind(await pinHash(F.id, m.id, b.pin), m.id).run();
          } else if (await pinHash(F.id, m.id, b.pin) !== m.pin) {
            const fails = (D.pin_fail || 0) + 1;
            await env.DB.prepare('UPDATE devices SET pin_fail=?, pin_lock=? WHERE id=?').bind(fails >= 5 ? 0 : fails, fails >= 5 ? now + 10 * 60e3 : 0, D.id).run();
            return json({ error: 'bad_pin', left: 5 - fails }, 403);
          }
        }
        const mem = uniq([...devMembers, m.id]), tr = uniq([...devTrusted, m.id]);
        await env.DB.prepare('UPDATE devices SET members=?, trusted=?, pin_fail=0 WHERE id=?').bind(JSON.stringify(mem), JSON.stringify(tr), D.id).run();
        return json({ ok: true, members: mem, trusted: tr });
      }
      if (p === '/unuse' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const mem = devMembers.filter((x) => x !== b.member), tr = devTrusted.filter((x) => x !== b.member);
        await env.DB.prepare('UPDATE devices SET members=?, trusted=? WHERE id=?').bind(JSON.stringify(mem), JSON.stringify(tr), D.id).run();
        return json({ ok: true, members: mem });
      }
      if (p === '/pin/check' && req.method === 'POST') {
        // رمز وليّ الأمر لفتح خيارات محمية على جهاز الأطفال (أي أب أو أم أو مشرف)
        const b = await req.json().catch(() => ({}));
        if (D.pin_lock > now) return json({ error: 'locked', wait: Math.ceil((D.pin_lock - now) / 60000) }, 429);
        if (!okPin(b.pin)) return json({ error: 'bad' }, 400);
        const cands = M.filter((m) => !m.removed && m.pin && (m.kind === 'parent' || m.admin || m.id === F.owner));
        for (const m of cands) if (await pinHash(F.id, m.id, b.pin) === m.pin) {
          await env.DB.prepare('UPDATE devices SET pin_fail=0 WHERE id=?').bind(D.id).run();
          return json({ ok: true, member: m.id });
        }
        const fails = (D.pin_fail || 0) + 1;
        await env.DB.prepare('UPDATE devices SET pin_fail=?, pin_lock=? WHERE id=?').bind(fails >= 5 ? 0 : fails, fails >= 5 ? now + 10 * 60e3 : 0, D.id).run();
        return json({ error: 'bad_pin', left: 5 - fails }, 403);
      }
      if (p === '/pin' && req.method === 'POST') {
        // تغيير رمزي (من جهاز موثوق) أو المالك يصفّر رمز غيره
        const b = await req.json().catch(() => ({}));
        const a = actor(b.member);
        if (!a || !devTrusted.includes(a.id)) return json({ error: 'forbidden' }, 403);
        if (b.target && b.target !== a.id) {
          if (a.id !== F.owner || !byId[b.target]) return json({ error: 'forbidden' }, 403);
          await env.DB.prepare('UPDATE members SET pin=NULL WHERE id=?').bind(b.target).run();
          return json({ ok: true });
        }
        if (!okPin(b.pin)) return json({ error: 'bad' }, 400);
        await env.DB.prepare('UPDATE members SET pin=? WHERE id=?').bind(await pinHash(F.id, a.id, b.pin), a.id).run();
        return json({ ok: true });
      }

      /* --- بيانات العائلة المشفّرة (الأسماء والصور الرمزية) --- */
      if (p === '/profile' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        // المشرف يعدّل الكل · أي فرد يعدّل صورته (والأب/الأم اسمهم) من جهازه، بدون إضافة أو حذف أفراد
        const isAdm = !!actorAdmin(b.member), self = actor(b.member);
        if (!isAdm && !(self && devTrusted.includes(self.id))) return json({ error: 'forbidden' }, 403);
        if (!isAdm && ((b.add && b.add.length) || (b.remove && b.remove.length))) return json({ error: 'forbidden' }, 403);
        if (!okB64(b.blob, MAX_PROFILE) || !Number.isInteger(b.rev)) return json({ error: 'bad' }, 400);
        if (b.rev <= F.rev) return json({ error: 'stale', rev: F.rev }, 409);
        const stmts = [env.DB.prepare('UPDATE families SET blob=?, rev=? WHERE id=?').bind(b.blob, b.rev, F.id)];
        for (const m of (Array.isArray(b.add) ? b.add : []).slice(0, 10)) {
          if (!okId(m.id) || byId[m.id]) continue;
          stmts.push(env.DB.prepare('INSERT INTO members (id, fam, kind, admin, pin, created, removed) VALUES (?,?,?,0,NULL,?,0)').bind(m.id, F.id, m.kind === 'parent' ? 'parent' : 'child', now));
        }
        for (const id of (Array.isArray(b.remove) ? b.remove : []).slice(0, 10)) {
          if (!byId[id] || id === F.owner) continue;
          stmts.push(env.DB.prepare('UPDATE members SET removed=1, admin=0 WHERE id=?').bind(id));
        }
        await env.DB.batch(stmts);
        await event(env, (await famDevices(env, F.id)).filter((d) => d.id !== D.id).map((d) => d.id), 'profile', { rev: b.rev }, now);
        return json({ ok: true, rev: b.rev });
      }

      /* --- الإشراف: المالك فقط يعطي ويشيل --- */
      if (p === '/admin/role' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const a = actorAdmin(b.member);
        if (!a || a.id !== F.owner) return json({ error: 'owner_only' }, 403);
        if (!byId[b.target] || b.target === F.owner) return json({ error: 'bad' }, 400);
        await env.DB.prepare('UPDATE members SET admin=? WHERE id=?').bind(b.on ? 1 : 0, b.target).run();
        await event(env, (await famDevices(env, F.id)).map((d) => d.id), 'roles', {}, now);
        return json({ ok: true });
      }

      /* --- الأجهزة: الحالة والتحديث والحذف --- */
      if (p === '/admin/devices' && req.method === 'GET') {
        if (!actorAdmin(q.get('member'))) return json({ error: 'forbidden' }, 403);
        const ds = (await env.DB.prepare('SELECT id, members, endpoint, last_seen, ver, plat, notif, created FROM devices WHERE fam=?').bind(F.id).all()).results || [];
        return json({
          now, owner: F.owner, auto_del: F.auto_del, update_req: F.update_req, online_ms: ONLINE_MS,
          members: M.map((m) => ({ id: m.id, kind: m.kind, admin: !!m.admin || m.id === F.owner, owner: m.id === F.owner, pin: !!m.pin, removed: !!m.removed })),
          devices: ds.map((d) => ({ id: d.id, me: d.id === D.id, members: jarr(d.members), last: d.last_seen, ver: d.ver, plat: d.plat, notif: d.notif, push: !!d.endpoint, created: d.created }))
        });
      }
      if (p === '/admin/settings' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!actorAdmin(b.member)) return json({ error: 'forbidden' }, 403);
        const days = [0, 7, 30, 90].includes(b.auto_del) ? b.auto_del : 30;
        await env.DB.prepare('UPDATE families SET auto_del=? WHERE id=?').bind(days, F.id).run();
        await event(env, (await famDevices(env, F.id)).map((d) => d.id), 'settings', { auto_del: days }, now);
        return json({ ok: true, auto_del: days });
      }
      if (p === '/admin/links' && req.method === 'POST') {
        // مين يكلّم مين: السماح بمحادثة خاصة بين طفلين
        const b = await req.json().catch(() => ({}));
        if (!actorAdmin(b.member)) return json({ error: 'forbidden' }, 403);
        const x = byId[b.a], y = byId[b.b];
        if (!x || !y || x.id === y.id || x.kind === 'parent' || y.kind === 'parent') return json({ error: 'bad' }, 400);
        const key = x.id < y.id ? x.id + ':' + y.id : y.id + ':' + x.id;
        const links = jarr(F.links).filter((k) => k !== key);
        if (b.on) links.push(key);
        await env.DB.prepare('UPDATE families SET links=? WHERE id=?').bind(JSON.stringify(links), F.id).run();
        await event(env, (await famDevices(env, F.id)).map((d) => d.id), 'settings', { auto_del: F.auto_del, links }, now);
        return json({ ok: true, links });
      }
      if (p === '/admin/update' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!actorAdmin(b.member)) return json({ error: 'forbidden' }, 403);
        await env.DB.prepare('UPDATE families SET update_req=? WHERE id=?').bind(now, F.id).run();
        await event(env, (await famDevices(env, F.id)).filter((d) => d.id !== D.id).map((d) => d.id), 'update', { ver: String(b.ver || '').slice(0, 12) }, now);
        return json({ ok: true });
      }
      if (p === '/admin/wipe' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const a = actorAdmin(b.member);
        if (!a || !byId[b.target]) return json({ error: 'forbidden' }, 403);
        if (b.target === F.owner && a.id !== F.owner) return json({ error: 'owner_protected' }, 403);
        if (byId[b.target].admin && b.target !== a.id && a.id !== F.owner) return json({ error: 'admin_protected' }, 403);
        const ds = (await famDevices(env, F.id)).filter((d) => jarr(d.members).includes(b.target));
        await event(env, ds.map((d) => d.id), 'wipe', { m: b.target, by: a.id }, now);
        return json({ ok: true, devices: ds.length });
      }
      if (p === '/admin/device/remove' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const a = actorAdmin(b.member);
        const t = a && await env.DB.prepare('SELECT * FROM devices WHERE id=? AND fam=?').bind(b.dev, F.id).first();
        if (!t) return json({ error: 'forbidden' }, 403);
        if (jarr(t.members).includes(F.owner) && a.id !== F.owner) return json({ error: 'owner_protected' }, 403);
        await env.DB.batch([env.DB.prepare('DELETE FROM devices WHERE id=?').bind(t.id), env.DB.prepare('DELETE FROM box WHERE dev=?').bind(t.id), env.DB.prepare('DELETE FROM ev WHERE dev=?').bind(t.id)]);
        return json({ ok: true });
      }
      if (p === '/code' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (!actorAdmin(b.member)) return json({ error: 'forbidden' }, 403);
        if (!okHex(b.code_id, 64) || !okB64(b.wrapped, 400) || !okB64(b.salt, 100)) return json({ error: 'bad' }, 400);
        if (await env.DB.prepare('SELECT 1 FROM families WHERE code_id=?').bind(b.code_id).first()) return json({ error: 'exists' }, 409);
        await env.DB.prepare('UPDATE families SET code_id=?, wrapped=?, salt=? WHERE id=?').bind(b.code_id, b.wrapped, b.salt, F.id).run();
        return json({ ok: true });
      }

      /* --- إرسال رسالة (المحتوى مشفّر base64 في جسم الطلب) --- */
      if (p === '/send' && req.method === 'POST') {
        const a = actor(q.get('member'));
        const chat = q.get('chat') || '', id = q.get('id') || '', kind = q.get('kind') || '', prev = q.get('prev') || '';
        if (!a) return json({ error: 'forbidden' }, 403);
        if (!okId(id) || !['text', 'voice', 'photo', 'draw'].includes(kind) || (prev && !okB64(prev, 900))) return json({ error: 'bad' }, 400);
        const parts = chatMembers(chat, M, F);
        if (!parts || !parts.includes(a.id)) return json({ error: 'badchat' }, 400);
        const body = await req.text();
        if (!body || body.length > MAX_MEDIA || !/^[A-Za-z0-9_-]+$/.test(body.slice(0, 64))) return json({ error: 'toolarge' }, 413);
        const targets = (await famDevices(env, F.id)).filter((d) => d.id !== D.id && jarr(d.members).some((m) => parts.includes(m)));
        const stmts = [env.DB.prepare('INSERT OR IGNORE INTO msgs (id, fam, chat, sender, sdev, kind, body, prev, size, created) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .bind(id, F.id, chat, a.id, D.id, kind, body, prev || null, body.length, now)];
        for (const t of targets) stmts.push(env.DB.prepare('INSERT OR IGNORE INTO box (dev, msg, created) VALUES (?,?,?)').bind(t.id, id, now));
        stmts.push(env.DB.prepare('UPDATE families SET active=? WHERE id=?').bind(now, F.id));
        await env.DB.batch(stmts);
        ctx.waitUntil(push(env, targets.filter((t) => t.endpoint), { t: 'm', id, chat, s: a.id, k: kind, p: prev || '' }));
        ctx.waitUntil((async () => {
          if (!targets.length) await env.DB.prepare('DELETE FROM msgs WHERE id=?').bind(id).run();
          await count(env, 'msg_' + kind, 1);
        })());
        return json({ ok: true, created: now, to: targets.length });
      }
      /* --- تنزيل محتوى رسالة --- */
      let mm;
      if ((mm = p.match(/^\/m\/([A-Za-z0-9_-]{8,40})$/)) && req.method === 'GET') {
        const inBox = await env.DB.prepare('SELECT 1 FROM box WHERE dev=? AND msg=?').bind(D.id, mm[1]).first();
        if (!inBox) return json({ error: 'gone' }, 404);
        const r = await env.DB.prepare('SELECT body FROM msgs WHERE id=?').bind(mm[1]).first();
        if (!r) return json({ error: 'gone' }, 404);
        return new Response(r.body, { headers: { ...cors, 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
      }

      /* --- المزامنة: الجهاز يستلم الجديد ويأكّد اللي وصله --- */
      if (p === '/sync' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const ver = String(b.ver || '').slice(0, 16), plat = ['ios', 'android', 'desktop'].includes(b.plat) ? b.plat : 'other';
        const notif = ['granted', 'denied', 'default', 'unsupported'].includes(b.notif) ? b.notif : null;
        const stmts = [env.DB.prepare('UPDATE devices SET last_seen=?, ver=?, plat=?, notif=COALESCE(?, notif), tz=? WHERE id=?')
          .bind(now, ver, plat, notif, Number.isInteger(b.tz) ? b.tz : 180, D.id)];
        // تأكيد الاستلام ← "وصلت" للمرسل، وحذف الرسالة من السيرفر إذا وصلت للكل
        const ack = (Array.isArray(b.ack) ? b.ack : []).filter(okId).slice(0, 100);
        if (ack.length) {
          const ph = ack.map(() => '?').join(',');
          const got = (await env.DB.prepare(`SELECT m.id, m.chat, m.sender FROM box b JOIN msgs m ON m.id=b.msg WHERE b.dev=? AND b.msg IN (${ph})`).bind(D.id, ...ack).all()).results || [];
          stmts.push(env.DB.prepare(`DELETE FROM box WHERE dev=? AND msg IN (${ph})`).bind(D.id, ...ack));
          await env.DB.batch(stmts.splice(0));
          // "وصلت" ← لأجهزة المرسل فقط
          const groups = {};
          for (const g of got) {
            const who = devMembers.filter((x) => x !== g.sender && (chatMembers(g.chat, M, F) || []).includes(x));
            if (!who.length) continue;
            const k = g.sender + '|' + who.join(',');
            (groups[k] = groups[k] || { sender: g.sender, who, ids: [] }).ids.push(g.id);
          }
          const all = Object.values(groups).length ? await famDevices(env, F.id) : [];
          for (const k in groups) {
            const gr = groups[k];
            await event(env, all.filter((d) => d.id !== D.id && jarr(d.members).includes(gr.sender)).map((d) => d.id), 'rcpt', { ids: gr.ids, m: gr.who, s: 1 }, now);
          }
          await env.DB.prepare(`DELETE FROM msgs WHERE id IN (${ph}) AND NOT EXISTS (SELECT 1 FROM box WHERE box.msg=msgs.id)`).bind(...ack).run();
        }
        const evAck = (Array.isArray(b.evAck) ? b.evAck : []).filter(Number.isInteger).slice(0, 200);
        if (evAck.length) stmts.push(env.DB.prepare(`DELETE FROM ev WHERE dev=? AND id IN (${evAck.map(() => '?').join(',')})`).bind(D.id, ...evAck));
        if (stmts.length) await env.DB.batch(stmts);
        const msgs = (await env.DB.prepare(`SELECT m.id, m.chat, m.sender, m.kind, m.prev, m.size, m.created, CASE WHEN m.size <= 6000 THEN m.body END AS inline
          FROM box b JOIN msgs m ON m.id=b.msg WHERE b.dev=? ORDER BY m.created LIMIT 40`).bind(D.id).all()).results || [];
        const evs = (await env.DB.prepare('SELECT id, t, d, created FROM ev WHERE dev=? ORDER BY id LIMIT 100').bind(D.id).all()).results || [];
        return json({
          ok: true, now, msgs, evs: evs.map((e) => ({ id: e.id, t: e.t, d: JSON.parse(e.d || '{}'), at: e.created })),
          fam: { rev: F.rev, auto_del: F.auto_del, update_req: F.update_req, owner: F.owner, created: F.created, links: jarr(F.links) },
          roles: M.map((m) => ({ id: m.id, kind: m.kind, admin: !!m.admin || m.id === F.owner, removed: !!m.removed, pin: !!m.pin })),
          dev: { members: devMembers, trusted: devTrusted }
        });
      }

      /* --- شافها / سمعها --- */
      if (p === '/rcpt' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const a = actor(b.member);
        if (!a || !Array.isArray(b.items)) return json({ error: 'bad' }, 400);
        const byChat = {};
        for (const it of b.items.slice(0, 100)) {
          if (!okId(it.id) || !byId[it.s] || !chatMembers(it.chat, M, F)) continue;
          (byChat[it.s] = byChat[it.s] || []).push(it.id);
        }
        const ds = await famDevices(env, F.id);
        for (const sender in byChat) {
          await event(env, ds.filter((d) => d.id !== D.id && jarr(d.members).includes(sender)).map((d) => d.id), 'rcpt', { ids: byChat[sender], m: [a.id], s: b.s === 3 ? 3 : 2 }, now);
        }
        return json({ ok: true });
      }

      /* --- النبضة --- */
      if (p === '/nudge' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        const a = actor(b.member), to = byId[b.to];
        if (!a || !devTrusted.includes(a.id) || !(a.kind === 'parent' || a.admin || a.id === F.owner)) return json({ error: 'parents_only' }, 403);
        if (!to || to.removed || to.id === a.id) return json({ error: 'bad' }, 400);
        await env.DB.prepare("UPDATE nudges SET state='stopped' WHERE fam=? AND src=? AND dst=? AND state IN ('sent','delivered')").bind(F.id, a.id, to.id).run();
        const id = rid(10);
        await env.DB.prepare("INSERT INTO nudges (id, fam, src, dst, sdev, created, last, n, state) VALUES (?,?,?,?,?,?,?,1,'sent')").bind(id, F.id, a.id, to.id, D.id, now, now).run();
        const ds = (await famDevices(env, F.id)).filter((d) => d.id !== D.id && jarr(d.members).includes(to.id));
        await event(env, ds.map((d) => d.id), 'nudge', { id, f: a.id, to: to.id, n: 1, at: now }, now);
        await count(env, 'nudges', 1);
        ctx.waitUntil(push(env, ds.filter((d) => d.endpoint), { t: 'n', id, f: a.id, to: to.id, n: 1 }));
        return json({ ok: true, id, devices: ds.length, max: NUDGE_MAX });
      }
      if (p === '/nudge/state' && req.method === 'POST') {
        // stop (من المرسل) أو seen (الطفل فتح)
        const b = await req.json().catch(() => ({}));
        const n = await env.DB.prepare('SELECT * FROM nudges WHERE id=? AND fam=?').bind(b.id, F.id).first();
        if (!n) return json({ error: 'notfound' }, 404);
        const st = b.state === 'seen' ? 'seen' : b.state === 'delivered' ? 'delivered' : 'stopped';
        if (n.state === 'seen' || n.state === 'stopped') return json({ ok: true, state: n.state });
        if (st === 'delivered' && n.state !== 'sent') return json({ ok: true, state: n.state });
        await env.DB.prepare('UPDATE nudges SET state=? WHERE id=?').bind(st, n.id).run();
        const ds = await famDevices(env, F.id);
        const tell = ds.filter((d) => d.id !== D.id && (jarr(d.members).includes(n.src) || (st !== 'delivered' && jarr(d.members).includes(n.dst))));
        await event(env, tell.map((d) => d.id), 'nudge_state', { id: n.id, state: st, n: n.n, f: n.src, to: n.dst }, now);
        // الأب وقّف النبضة ← نوقّف الإشعار على أجهزة الطفل فوراً (حتى لو التطبيق مقفل)
        if (st === 'stopped') ctx.waitUntil(push(env, ds.filter((d) => d.endpoint && d.id !== D.id && jarr(d.members).includes(n.dst)), { t: 'ns', id: n.id, f: n.src, to: n.dst }));
        return json({ ok: true, state: st });
      }

      /* --- الإشعارات --- */
      if (p === '/sub' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        if (b.off) { await env.DB.prepare('UPDATE devices SET endpoint=NULL WHERE id=?').bind(D.id).run(); return json({ ok: true }); }
        if (typeof b.endpoint !== 'string' || !/^https:\/\//.test(b.endpoint) || b.endpoint.length > 1000) return json({ error: 'bad' }, 400);
        const k = b.keys || {};
        await env.DB.prepare("UPDATE devices SET endpoint=?, p256dh=?, auth=?, notif='granted' WHERE id=?")
          .bind(b.endpoint, okB64(k.p256dh, 120) ? k.p256dh : null, okB64(k.auth, 40) ? k.auth : null, D.id).run();
        return json({ ok: true });
      }
      if (p === '/pending' && req.method === 'POST') {
        const row = await env.DB.prepare('SELECT pending FROM devices WHERE id=?').bind(D.id).first();
        await env.DB.prepare('UPDATE devices SET pending=NULL WHERE id=?').bind(D.id).run();
        const items = row && row.pending ? JSON.parse(row.pending) : [];
        // وصول النبضة للجهاز ← "وصلت" عند الأب
        for (const it of items) if (it.t === 'n') ctx.waitUntil(env.DB.prepare("UPDATE nudges SET state='delivered' WHERE id=? AND state='sent'").bind(it.id).run());
        return json({ items });
      }
      if (p === '/reminder' && req.method === 'POST') {
        const b = await req.json().catch(() => ({}));
        await env.DB.prepare('UPDATE devices SET reminder=? WHERE id=?').bind(b.on ? 1 : 0, D.id).run();
        return json({ ok: true });
      }
      if (p === '/leave' && req.method === 'POST') {
        await env.DB.batch([env.DB.prepare('DELETE FROM devices WHERE id=?').bind(D.id), env.DB.prepare('DELETE FROM box WHERE dev=?').bind(D.id), env.DB.prepare('DELETE FROM ev WHERE dev=?').bind(D.id)]);
        return json({ ok: true });
      }

      return json({ error: 'notfound' }, 404);
    } catch (e) {
      return json({ error: 'server', detail: String(e && e.message || e) }, 500);
    }
  },

  /* كل دقيقة: تكرار النبضة، تذكير النسخ الأسبوعي، وتنظيف السيرفر */
  async scheduled(event, env, ctx) {
    await ensureSchema(env);
    const now = Date.now();
    // النبضة تتكرر كل دقيقة لين يفتح الطفل أو يوقفها الأب (٣ مرات)
    const due = (await env.DB.prepare("SELECT * FROM nudges WHERE state IN ('sent','delivered') AND last < ? AND created > ?").bind(now - 50e3, now - 10 * 60e3).all()).results || [];
    for (const n of due) {
      if (n.n >= NUDGE_MAX) { await env.DB.prepare("UPDATE nudges SET state='expired' WHERE id=?").bind(n.id).run(); await tellExpired(env, n, now); continue; }
      await env.DB.prepare('UPDATE nudges SET n=n+1, last=? WHERE id=?').bind(now, n.id).run();
      const ds = (await famDevices(env, n.fam)).filter((d) => d.id !== n.sdev && jarr(d.members).includes(n.dst));
      await event(env, ds.map((d) => d.id), 'nudge', { id: n.id, f: n.src, to: n.dst, n: n.n + 1, at: n.created }, now);
      const sdevs = (await famDevices(env, n.fam)).filter((d) => jarr(d.members).includes(n.src));
      await event(env, sdevs.map((d) => d.id), 'nudge_state', { id: n.id, state: n.state, n: n.n + 1, f: n.src, to: n.dst }, now);
      ctx.waitUntil(push(env, ds.filter((d) => d.endpoint), { t: 'n', id: n.id, f: n.src, to: n.dst, n: n.n + 1 }));
    }
    // تذكير النسخ الاحتياطي: كل جمعة ٨ مساءً بتوقيت الجهاز
    const rem = (await env.DB.prepare('SELECT id, endpoint, p256dh, auth, pending, tz, last_rem FROM devices WHERE reminder=1 AND endpoint IS NOT NULL').all()).results || [];
    const remDue = [];
    for (const r of rem) {
      const local = new Date(now + (r.tz || 180) * 60000);
      const day = local.toISOString().slice(0, 10);
      if (local.getUTCDay() === 5 && local.getUTCHours() === 20 && local.getUTCMinutes() < 5 && r.last_rem !== day) { r._day = day; remDue.push(r); }
    }
    for (const r of remDue) await env.DB.prepare('UPDATE devices SET last_rem=? WHERE id=?').bind(r._day, r.id).run();
    if (remDue.length) ctx.waitUntil(push(env, remDue, { t: 'b' }));
    // التنظيف: الرسائل أقدم من ٣ أيام تنحذف حتى لو ما وصلت
    if (new Date(now).getUTCMinutes() % 10 === 0) {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM box WHERE created < ?').bind(now - TTL),
        env.DB.prepare('DELETE FROM msgs WHERE created < ?').bind(now - TTL),
        env.DB.prepare('DELETE FROM msgs WHERE NOT EXISTS (SELECT 1 FROM box WHERE box.msg=msgs.id) AND created < ?').bind(now - 60e3),
        env.DB.prepare('DELETE FROM ev WHERE created < ?').bind(now - TTL),
        env.DB.prepare('DELETE FROM nudges WHERE created < ?').bind(now - TTL),
        env.DB.prepare('DELETE FROM jfail WHERE until < ?').bind(now - 864e5)
      ]);
    }
  }
};

async function tellExpired(env, n, now) {
  const ds = (await famDevices(env, n.fam)).filter((d) => jarr(d.members).includes(n.src) || jarr(d.members).includes(n.dst));
  await event(env, ds.map((d) => d.id), 'nudge_state', { id: n.id, state: 'expired', n: n.n, f: n.src, to: n.dst }, now);
}

/* ---------- الجداول (تنشأ تلقائيًا) ---------- */
let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare('CREATE TABLE IF NOT EXISTS config (k TEXT PRIMARY KEY, v TEXT NOT NULL)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS families (id TEXT PRIMARY KEY, code_id TEXT UNIQUE NOT NULL, wrapped TEXT NOT NULL, salt TEXT NOT NULL, blob TEXT NOT NULL, rev INTEGER NOT NULL, created INTEGER NOT NULL, owner TEXT NOT NULL, auto_del INTEGER DEFAULT 30, update_req INTEGER DEFAULT 0, active INTEGER)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, fam TEXT NOT NULL, kind TEXT NOT NULL, admin INTEGER DEFAULT 0, pin TEXT, created INTEGER, removed INTEGER DEFAULT 0)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS members_fam ON members (fam)'),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, fam TEXT NOT NULL, tok TEXT NOT NULL, members TEXT DEFAULT '[]', trusted TEXT DEFAULT '[]', created INTEGER, last_seen INTEGER, ver TEXT, plat TEXT, notif TEXT, endpoint TEXT, pending TEXT, tz INTEGER DEFAULT 180, reminder INTEGER DEFAULT 0, last_rem TEXT, pin_fail INTEGER DEFAULT 0, pin_lock INTEGER DEFAULT 0)"),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS devices_fam ON devices (fam)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS msgs (id TEXT PRIMARY KEY, fam TEXT NOT NULL, chat TEXT NOT NULL, sender TEXT NOT NULL, sdev TEXT, kind TEXT NOT NULL, body TEXT NOT NULL, prev TEXT, size INTEGER, created INTEGER NOT NULL)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS box (dev TEXT NOT NULL, msg TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (dev, msg))'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS box_msg ON box (msg)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS ev (id INTEGER PRIMARY KEY AUTOINCREMENT, dev TEXT NOT NULL, t TEXT NOT NULL, d TEXT, created INTEGER NOT NULL)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS ev_dev ON ev (dev)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS nudges (id TEXT PRIMARY KEY, fam TEXT, src TEXT, dst TEXT, sdev TEXT, created INTEGER, last INTEGER, n INTEGER, state TEXT)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS jfail (ip TEXT PRIMARY KEY, n INTEGER, until INTEGER)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS daily (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (day, k))'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS bcast (n INTEGER PRIMARY KEY AUTOINCREMENT, created INTEGER, title TEXT, body TEXT, total INTEGER)')
  ]);
  for (const sql of ["ALTER TABLE families ADD COLUMN links TEXT DEFAULT '[]'", 'ALTER TABLE devices ADD COLUMN p256dh TEXT', 'ALTER TABLE devices ADD COLUMN auth TEXT']) {
    try { await env.DB.prepare(sql).run(); } catch (e) {}
  }
  schemaReady = true;
}

/* ---------- مساعدات ---------- */
const okId = (x) => typeof x === 'string' && /^[A-Za-z0-9_-]{6,40}$/.test(x);
const okHex = (x, n) => typeof x === 'string' && x.length === n && /^[a-f0-9]+$/.test(x);
const okB64 = (x, max) => typeof x === 'string' && x.length > 0 && x.length <= max && /^[A-Za-z0-9_-]+$/.test(x);
const okPin = (x) => typeof x === 'string' && /^\d{4}$/.test(x);
const jarr = (s) => { try { const a = JSON.parse(s || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
const uniq = (a) => [...new Set(a)];
function rid(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64uEnc(a).slice(0, Math.ceil(n * 4 / 3)); }

function newDevice(env, fam, id, tok, dev, members, trusted, now) {
  dev = dev || {};
  return env.DB.prepare('INSERT INTO devices (id, fam, tok, members, trusted, created, last_seen, ver, plat, tz) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(id, fam, tok, JSON.stringify(members), JSON.stringify(trusted), now, now, String(dev.ver || '').slice(0, 16), ['ios', 'android', 'desktop'].includes(dev.plat) ? dev.plat : 'other', Number.isInteger(dev.tz) ? dev.tz : 180);
}
async function authDevice(req, env) {
  const h = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const [id, secret] = h.split('.');
  if (!id || !secret || id.length > 20 || secret.length > 40) return null;
  const d = await env.DB.prepare('SELECT * FROM devices WHERE id=?').bind(id).first();
  if (!d) return null;
  const want = await sha('tok:' + secret);
  if (d.tok === want) return d;
  return null;
}
async function members(env, fam) { return (await env.DB.prepare('SELECT * FROM members WHERE fam=?').bind(fam).all()).results || []; }
async function famDevices(env, fam) { return (await env.DB.prepare('SELECT id, members, endpoint, p256dh, auth, pending, last_seen FROM devices WHERE fam=?').bind(fam).all()).results || []; }
async function famView(env, f) {
  const M = await members(env, f.id);
  return {
    blob: f.blob, rev: f.rev, created: f.created, owner: f.owner, auto_del: f.auto_del, update_req: f.update_req, links: jarr(f.links),
    roles: M.map((m) => ({ id: m.id, kind: m.kind, admin: !!m.admin || m.id === f.owner, removed: !!m.removed, pin: !!m.pin }))
  };
}
/* المحادثات: g = العائلة كلها · p:أ:ب = خاصة (لازم يكون فيها أب أو أم؛ ما فيه محادثة بين طفلين) */
function chatMembers(chat, M, F) {
  const live = M.filter((m) => !m.removed);
  if (chat === 'g') return live.map((m) => m.id);
  const m = /^p:([A-Za-z0-9_-]{6,40}):([A-Za-z0-9_-]{6,40})$/.exec(chat || '');
  if (!m || m[1] >= m[2]) return null;
  const a = live.find((x) => x.id === m[1]), b = live.find((x) => x.id === m[2]);
  if (!a || !b) return null;
  // بين طفلين: فقط إذا سمح المدير (مين يكلّم مين)
  if (a.kind !== 'parent' && b.kind !== 'parent' && !jarr(F && F.links).includes(a.id + ':' + b.id)) return null;
  return [a.id, b.id];
}
async function event(env, devs, t, d, now) {
  if (!devs.length) return;
  const s = JSON.stringify(d);
  await env.DB.batch(devs.map((id) => env.DB.prepare('INSERT INTO ev (dev, t, d, created) VALUES (?,?,?,?)').bind(id, t, s, now)));
}
async function count(env, k, n) {
  const day = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10);
  await env.DB.prepare('INSERT INTO daily (day, k, n) VALUES (?,?,?) ON CONFLICT(day, k) DO UPDATE SET n=n+excluded.n').bind(day, k, n).run();
}
async function pinHash(fam, member, pin) { return sha('pin:' + fam + ':' + member + ':' + pin); }

/* ---------- إحصائيات لوحة الإدارة (بدون أي محتوى أو أسماء) ---------- */
async function stats(env, now) {
  const day = new Date(now + 3 * 36e5).toISOString().slice(0, 10);
  const one = async (sql, ...a) => (await env.DB.prepare(sql).bind(...a).first()) || {};
  const f = await one('SELECT COUNT(*) n, SUM(active > ?) week FROM families', now - 7 * 864e5);
  const m = await one("SELECT COUNT(*) n, SUM(kind='parent') parents, SUM(kind='child') kids, SUM(admin) admins FROM members WHERE removed=0");
  const d = await one('SELECT COUNT(*) n, SUM(last_seen > ?) online, SUM(last_seen > ?) today, SUM(last_seen > ?) week, SUM(endpoint IS NOT NULL) subs FROM devices', now - ONLINE_MS, now - 864e5, now - 7 * 864e5);
  const q = await one('SELECT COUNT(*) n, COALESCE(SUM(size),0) bytes FROM msgs');
  const vers = (await env.DB.prepare('SELECT ver, COUNT(*) n FROM devices GROUP BY ver ORDER BY n DESC LIMIT 5').all()).results || [];
  const plats = (await env.DB.prepare('SELECT plat, COUNT(*) n FROM devices GROUP BY plat').all()).results || [];
  const series = (await env.DB.prepare('SELECT day, k, n FROM daily WHERE day >= ? ORDER BY day').bind(new Date(now + 3 * 36e5 - 29 * 864e5).toISOString().slice(0, 10)).all()).results || [];
  const todayK = {}; series.filter((r) => r.day === day).forEach((r) => (todayK[r.k] = r.n));
  const hist = (await env.DB.prepare('SELECT created, title, body, total FROM bcast ORDER BY n DESC LIMIT 8').all()).results || [];
  return {
    now, families: f.n || 0, activeFamiliesWeek: f.week || 0,
    members: m.n || 0, parents: m.parents || 0, kids: m.kids || 0, admins: m.admins || 0,
    devices: d.n || 0, online: d.online || 0, activeToday: d.today || 0, activeWeek: d.week || 0, subs: d.subs || 0,
    queued: q.n || 0, queuedBytes: q.bytes || 0,
    today: { text: todayK.msg_text || 0, voice: todayK.msg_voice || 0, photo: todayK.msg_photo || 0, draw: todayK.msg_draw || 0, nudges: todayK.nudges || 0 },
    versions: vers, plats, series, history: hist
  };
}

/* ---------- مفتاح الإدارة ---------- */
const normKey = (k) => String(k || '').replace(/[٠-٩]/g, (x) => '٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/\s+/g, '');
const adminOk = new Map();
async function isAdmin(req, env) {
  let k = req.headers.get('X-Admin-Key') || (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  try { k = decodeURIComponent(k); } catch (e) {}
  const a = normKey(k);
  if (!a) return false;
  if (env.ADMIN_KEY) {
    const b = normKey(env.ADMIN_KEY);
    if (a.length !== b.length) return false;
    let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }
  // بدون ADMIN_KEY هنا: نتأكد من المفتاح عند siraj-api (نفس المفتاح لكل خوادم ومض آرك)
  const h = await sha('adm:' + a), hit = adminOk.get(h);
  if (hit && hit > Date.now()) return true;
  try {
    // Cloudflare يمنع خادم يكلّم خادم ثاني على workers.dev بنفس الحساب بـ fetch العادي، فنستخدم الربط المباشر SIRAJ
    const init = { headers: { Authorization: 'Bearer ' + encodeURIComponent(a) } };
    const r = env.SIRAJ ? await env.SIRAJ.fetch('https://siraj-api/stats', init) : await fetch(SIRAJ_API + '/stats', init);
    if (r.ok) { adminOk.set(h, Date.now() + 10 * 60e3); return true; }
  } catch (e) {}
  return false;
}

/* ---------- الإشعارات (بدون محتوى: الجهاز يسحب التفاصيل من /pending) ---------- */
let vapidCache = null;
async function vapid(env) {
  if (vapidCache) return vapidCache;
  if (env.VAPID_PUBLIC && env.VAPID_PRIVATE) return (vapidCache = { pub: env.VAPID_PUBLIC, priv: env.VAPID_PRIVATE });
  const rows = (await env.DB.prepare("SELECT k, v FROM config WHERE k IN ('vapid_public','vapid_private')").all()).results || [];
  const c = Object.fromEntries(rows.map((r) => [r.k, r.v]));
  if (!c.vapid_public || !c.vapid_private) return { pub: '', priv: '' };
  return (vapidCache = { pub: c.vapid_public, priv: c.vapid_private });
}
async function push(env, rows, item) {
  if (!rows.length) return;
  const v = await vapid(env);
  // الأجهزة القديمة (بدون مفاتيح): نحفظ التفاصيل في pending ويسحبها الجهاز
  const old = rows.filter((r) => !(r.p256dh && r.auth));
  for (const r of old) {
    let q = [];
    try { q = r.pending ? JSON.parse(r.pending) : []; } catch (e) {}
    q.push(item);
    await env.DB.prepare('UPDATE devices SET pending=? WHERE id=?').bind(JSON.stringify(q.slice(-15)), r.id).run();
  }
  if (!v.priv) return;
  const body = new TextEncoder().encode(JSON.stringify(item));
  await Promise.all(rows.map(async (r) => {
    try {
      const aud = new URL(r.endpoint).origin;
      const jwt = await vapidJWT(v, aud);
      const h = { Authorization: `vapid t=${jwt}, k=${v.pub}`, TTL: item.t === 'n' ? '600' : '86400', Urgency: 'high' };
      let payload = null;
      if (r.p256dh && r.auth) {
        payload = await encryptPush(body, r.p256dh, r.auth);
        h['Content-Encoding'] = 'aes128gcm'; h['Content-Type'] = 'application/octet-stream';
      } else h['Content-Length'] = '0';
      const res = await fetch(r.endpoint, { method: 'POST', headers: h, body: payload });
      if ([401, 403, 404, 410].includes(res.status)) await env.DB.prepare('UPDATE devices SET endpoint=NULL WHERE id=?').bind(r.id).run();
    } catch (e) {}
  }));
}
/* تشفير محتوى الإشعار (Web Push, aes128gcm) */
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
const cat = (...a) => { const n = a.reduce((t, x) => t + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
async function encryptPush(plain, p256dh, authB64) {
  const ua = b64uDec(p256dh), auth = b64uDec(authB64), te = new TextEncoder();
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const as = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, kp.privateKey, 256));
  const prkKey = await hmac(auth, shared);
  const ikm = (await hmac(prkKey, cat(te.encode('WebPush: info\0'), ua, as, new Uint8Array([1])))).slice(0, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(te.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(te.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(plain, new Uint8Array([2]))));
  const head = new Uint8Array(21 + as.length); head.set(salt); new DataView(head.buffer).setUint32(16, 4096); head[20] = as.length; head.set(as, 21);
  return cat(head, ct);
}
const jwtCache = {};
async function vapidJWT(v, aud) {
  const c = jwtCache[aud];
  if (c && c.exp > Date.now()) return c.t;
  const pub = b64uDec(v.pub);
  const jwk = { kty: 'EC', crv: 'P-256', x: b64uEnc(pub.slice(1, 33)), y: b64uEnc(pub.slice(33, 65)), d: v.priv, ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const enc = (o) => b64uEnc(new TextEncoder().encode(JSON.stringify(o)));
  const data = enc({ typ: 'JWT', alg: 'ES256' }) + '.' + enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:hello@wamdarc.com' });
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(data));
  const t = data + '.' + b64uEnc(new Uint8Array(sig));
  jwtCache[aud] = { t, exp: Date.now() + 10 * 3600e3 };
  return t;
}
async function sha(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function b64uEnc(bytes) { let s = ''; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64uDec(str) { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)); return Uint8Array.from(s, (c) => c.charCodeAt(0)); }

/* ---------- إحصائيات ومض آرك (لكل التطبيقات) ----------
   تقرأ وتكتب جداول الإحصائيات في قاعدة falaq (الربط STATS)، وهي نفس الجداول اللي يكتب فيها push-wamdarc.
   - POST /wamd/hit        عدّاد مجهول من التطبيقات (نَبْض يرسل هنا)
   - GET  /wamd/analytics  لوحة الإدارة (يحتاج مفتاح الإدارة) ?days=7|30|90 */
const W_APPS = /^[a-z]{2,16}$/;
const W_ONLINE = 150e3;
const W_DAY = 864e5;
const wDay = (t) => new Date(t + 3 * 36e5).toISOString().slice(0, 10);   // اليوم بتوقيت الرياض
let wReady = false;
async function wInit(env) {
  if (wReady) return;
  await env.STATS.batch([
    env.STATS.prepare('CREATE TABLE IF NOT EXISTS devices (app TEXT NOT NULL, dev TEXT NOT NULL, first INTEGER, last INTEGER, inst INTEGER DEFAULT 0, plat TEXT, ver TEXT, lang TEXT, opens INTEGER DEFAULT 0, PRIMARY KEY (app, dev))'),
    env.STATS.prepare('CREATE TABLE IF NOT EXISTS days (day TEXT NOT NULL, app TEXT NOT NULL, dev TEXT NOT NULL, opens INTEGER DEFAULT 0, PRIMARY KEY (day, app, dev))'),
    env.STATS.prepare('CREATE TABLE IF NOT EXISTS pages (day TEXT NOT NULL, path TEXT NOT NULL, n INTEGER DEFAULT 0, PRIMARY KEY (day, path))')
  ]);
  wReady = true;
}
async function wamdHit(env, b) {
  const app = String(b.app || ''), dev = String(b.dev || '');
  if (!W_APPS.test(app) || !/^[a-z0-9]{8,32}$/.test(dev)) return { ok: false };
  await wInit(env);
  const now = Date.now(), day = wDay(now), open = b.ev === 'open' ? 1 : 0, inst = b.inst ? 1 : 0;
  const plat = ['ios', 'android', 'desktop'].includes(b.plat) ? b.plat : 'other';
  const ver = String(b.ver || '').slice(0, 12), lang = b.lang === 'en' ? 'en' : 'ar';
  const st = [env.STATS.prepare("INSERT INTO devices (app, dev, first, last, inst, plat, ver, lang, opens) VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?7, ?8) ON CONFLICT(app, dev) DO UPDATE SET last = ?3, inst = MAX(inst, ?4), plat = ?5, ver = CASE WHEN ?6 <> '' THEN ?6 ELSE ver END, lang = ?7, opens = opens + ?8")
    .bind(app, dev, now, inst, plat, ver, lang, open)];
  if (open) st.push(env.STATS.prepare('INSERT INTO days (day, app, dev, opens) VALUES (?, ?, ?, 1) ON CONFLICT(day, app, dev) DO UPDATE SET opens = opens + 1').bind(day, app, dev));
  await env.STATS.batch(st);
  return { ok: true };
}
async function wamdAnalytics(env, days) {
  await wInit(env);
  const R = [7, 30, 90].includes(days) ? days : 30;
  const now = Date.now(), today = wDay(now), d = (n) => wDay(now - n * W_DAY);
  const from = d(R - 1), prevFrom = d(2 * R - 1), prevTo = d(R);
  const q = (sql, ...a) => env.STATS.prepare(sql).bind(...a).all().then((r) => r.results || []).catch(() => []);
  const startToday = Date.parse(today + 'T00:00:00+03:00');
  const [totals, active, prev, ret, plat, ver, langs, series, fresh, pages, recent, subs, dow] = await Promise.all([
    q('SELECT app, COUNT(*) total, SUM(inst) inst, SUM(last >= ?) online, SUM(first >= ?) new_today, SUM(opens) opens, SUM(last < ?) dormant FROM devices GROUP BY app', now - W_ONLINE, startToday, now - 14 * W_DAY),
    q('SELECT app, COUNT(DISTINCT CASE WHEN day = ? THEN dev END) today, COUNT(DISTINCT CASE WHEN day >= ? THEN dev END) d7, COUNT(DISTINCT dev) rng, SUM(opens) opens FROM days WHERE day >= ? GROUP BY app', today, d(6), from),
    q('SELECT app, COUNT(DISTINCT dev) rng, SUM(opens) opens FROM days WHERE day >= ? AND day <= ? GROUP BY app', prevFrom, prevTo),
    q('SELECT app, SUM(c >= 2) back, COUNT(*) n, AVG(c) avg_days FROM (SELECT app, dev, COUNT(*) c FROM days WHERE day >= ? GROUP BY app, dev) GROUP BY app', from),
    q('SELECT app, plat, COUNT(*) n, SUM(inst) inst FROM devices GROUP BY app, plat'),
    q("SELECT app, ver, COUNT(*) n FROM devices WHERE ver <> '' AND last >= ? GROUP BY app, ver ORDER BY n DESC", now - 30 * W_DAY),
    q('SELECT app, lang, COUNT(*) n FROM devices GROUP BY app, lang'),
    q('SELECT day, app, COUNT(*) n, SUM(opens) opens FROM days WHERE day >= ? GROUP BY day, app ORDER BY day', from),
    q('SELECT app, first FROM devices WHERE first >= ?', now - R * W_DAY),
    q('SELECT path, SUM(n) n FROM pages WHERE day >= ? GROUP BY path ORDER BY n DESC LIMIT 15', from),
    q('SELECT app, plat, inst, ver, lang, first, last, opens FROM devices ORDER BY last DESC LIMIT 60'),
    q('SELECT app, COUNT(*) n FROM subs GROUP BY app'),
    q("SELECT app, CAST(strftime('%w', day) AS INTEGER) w, COUNT(*) n FROM days WHERE day >= ? GROUP BY app, w", from)
  ]);
  const newByDay = {};
  fresh.forEach((r) => { const k = wDay(r.first) + '|' + r.app; newByDay[k] = (newByDay[k] || 0) + 1; });
  return { now, today, days: R, from, online_ms: W_ONLINE, totals, active, prev, ret, plat, ver, langs, series, newByDay, pages, recent, subs, dow };
}

/* ---------- سجل الرسائل الكامل والنسخة الاحتياطية (لوحة الإدارة) ----------
   - GET /wamd/log?before=<ms>&limit=30   كل الرسائل العامة اللي انرسلت من اللوحة (فلق/سهم/خطى + سِراج + نَبْض)
   - GET /wamd/backup                      نسخة JSON لكل السجلات والإحصائيات (بدون اشتراكات الإشعارات ولا أي محتوى عائلي) */
async function wamdLog(env, before, limit) {
  limit = Math.max(1, Math.min(200, limit));
  const b = before > 0 ? before : 9e15;
  const safe = (pr) => pr.then((r) => r.results || []).catch(() => []);
  const [push, siraj, nabd] = await Promise.all([
    env.STATS ? safe(env.STATS.prepare('SELECT created, apps, body, total FROM messages WHERE created < ? ORDER BY created DESC LIMIT ?').bind(b, limit).all()) : [],
    env.SIRAJDB ? safe(env.SIRAJDB.prepare('SELECT created, title, body, total FROM messages WHERE created < ? ORDER BY created DESC LIMIT ?').bind(b, limit).all()) : [],
    safe(env.DB.prepare('SELECT created, title, body, total FROM bcast WHERE created < ? ORDER BY created DESC LIMIT ?').bind(b, limit).all())
  ]);
  const out = [];
  push.forEach((m) => { let j = {}; try { j = JSON.parse(m.body); } catch (e) {} out.push({ t: m.created, apps: String(m.apps || '').split(',').filter(Boolean), title: (j.ar || {}).title || '', body: (j.ar || {}).body || '', en: j.en && j.en.title !== (j.ar || {}).title ? j.en : null, kind: j.kind || 'news', total: m.total }); });
  siraj.forEach((m) => out.push({ t: m.created, apps: ['siraj'], title: m.title || '', body: m.body || '', total: m.total }));
  nabd.forEach((m) => out.push({ t: m.created, apps: ['nabd'], title: m.title || '', body: m.body || '', total: m.total }));
  out.sort((x, y) => y.t - x.t);
  const items = out.slice(0, limit);
  const counts = {};
  const cnt = async (db, sql) => { try { return ((await db.prepare(sql).first()) || {}).n || 0; } catch (e) { return 0; } };
  counts.push = env.STATS ? await cnt(env.STATS, 'SELECT COUNT(*) n FROM messages') : 0;
  counts.siraj = env.SIRAJDB ? await cnt(env.SIRAJDB, 'SELECT COUNT(*) n FROM messages') : 0;
  counts.nabd = await cnt(env.DB, 'SELECT COUNT(*) n FROM bcast');
  return { items, more: out.length > limit || items.length === limit, next: items.length ? items[items.length - 1].t : 0, counts };
}
async function wamdBackup(env) {
  const all = (db, sql) => db ? db.prepare(sql).all().then((r) => r.results || []).catch(() => []) : Promise.resolve([]);
  const [devices, days, pages, pushMsgs, sirajMsgs, nabdMsgs, nabdDaily] = await Promise.all([
    all(env.STATS, 'SELECT * FROM devices'),
    all(env.STATS, 'SELECT * FROM days ORDER BY day'),
    all(env.STATS, 'SELECT * FROM pages ORDER BY day'),
    all(env.STATS, 'SELECT created, apps, body, total FROM messages ORDER BY created'),
    all(env.SIRAJDB, 'SELECT created, title, body, total FROM messages ORDER BY created'),
    all(env.DB, 'SELECT created, title, body, total FROM bcast ORDER BY created'),
    all(env.DB, 'SELECT day, k, n FROM daily ORDER BY day')
  ]);
  return {
    kind: 'wamdarc-admin-backup', version: 1, created: Date.now(),
    stats: { devices, days, pages },
    messages: { push: pushMsgs, siraj: sirajMsgs, nabd: nabdMsgs },
    nabd: { daily: nabdDaily }
  };
}
