/* نَبْض | NABD — يشغّل التطبيق بدون إنترنت، ويحدّثه تلقائيًا، ويعرض الإشعارات والنبضة
   مع كل تحديث: غيّر CACHE هنا و VERSION في config.js و ?v= في index.html */
importScripts('config.js', 'core.js');
const CACHE = 'nabd-v2.0.2';
const FILES = ['./', 'index.html', 'config.js', 'core.js', 'chars.js', 'avatars.js', 'app.js', 'draw.js', 'admin.js', 'manifest.webmanifest', 'wamd-stats.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/badge-96.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('message', (e) => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (CONFIG.API && req.url.startsWith(CONFIG.API)) return;            // السيرفر: بدون كاش
  if (url.origin === location.origin) {
    // ملفات التطبيق: من الكاش فوراً (فتح سريع حتى لو النت ضعيف)، ونحدّث الكاش من الإنترنت بالخلفية.
    // التحديثات توصل لأن sw.js نفسه يتغير مع كل نسخة (CACHE جديد) ويحمّل الملفات من جديد.
    const net = fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok && url.pathname.indexOf('/sw.js') < 0) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    });
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.catch(() => caches.match(req, { ignoreSearch: true }).then((h2) => h2 || caches.match('index.html')));
    }));
    return;
  }
  // الخطوط: من الكاش أولًا
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});

/* ---------- الإشعارات ---------- */
const isIOS = /iphone|ipad|ipod|macintosh/i.test(self.navigator.userAgent || '') && !/android/i.test(self.navigator.userAgent || '');

/* نجيب محتوى الرسالة ونحفظه على الجهاز وقت وصول الإشعار، عشان يكون جاهز أول ما يفتح التطبيق */
async function prefetch(items, acct) {
  const ids = [];
  await Promise.all(items.filter((it) => it.t === 'm' && it.id).map(async (it) => {
    try {
      let body = it.b;
      if (!body && acct && acct.token) {
        const r = await fetch(CONFIG.API + '/m/' + it.id, { headers: { Authorization: 'Bearer ' + acct.token }, cache: 'no-store' });
        if (r.ok) body = await r.text();
      }
      const isNew = body && await NB.ingest({ id: it.id, chat: it.chat, s: it.s, k: it.k, t: it.at }, body);
      if (isNew) ids.push(it.id);
    } catch (e) {}
  }));
  return ids;
}

async function onPush(data) {
  let items = [];
  const acct = await NB.kv.get('acct').catch(() => null);
  if (data) {
    // المحتوى وصل مع الإشعار نفسه (أسرع)
    items = [data];
    if (data.t === 'n' && acct && acct.token) fetch(CONFIG.API + '/nudge/state', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + acct.token }, body: JSON.stringify({ id: data.id, state: 'delivered' }) }).catch(() => {});
  } else try {
    if (acct && acct.token) {
      const r = await fetch(CONFIG.API + '/pending', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + acct.token }, body: '{}' });
      items = (await r.json()).items || [];
    }
  } catch (e) {}
  // رقم الأيقونة أول شي (قبل الإشعار): آيفون يوقف الـ SW بسرعة بعد ما يطلع الإشعار
  const nNew = items.filter((it) => it.t === 'm' && it.k !== 'react').length;
  if (nNew) { try { const n = (await NB.kv.get('badge').catch(() => 0)) || 0; await NB.badge(n + nNew); } catch (e) {} }
  const prof = await NB.profile().catch(() => ({ members: {} }));
  const dev = (await NB.kv.get('dev').catch(() => null)) || { members: [] };
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const visible = wins.some((c) => c.visibilityState === 'visible');
  wins.forEach((c) => c.postMessage({ type: 'push', items }));

  if (!items.length) {
    // لازم نعرض إشعار مع كل push (شرط المتصفحات)
    if (visible && !isIOS) return;
    return self.registration.showNotification('نَبْض', { body: 'عندك جديد في نَبْض', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', lang: 'ar', dir: 'rtl', tag: 'nabd' });
  }
  const shown = [prefetch(items, acct).then((ids) => self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => l.forEach((c) => c.postMessage({ type: 'fresh', ids })))).catch(() => {})];
  for (const it of items.slice(-4)) {
    let title = 'نَبْض', body = '', opt = { icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', lang: 'ar', dir: 'rtl', data: it };
    if (it.t === 'm') {
      if (visible && !isIOS) continue;
      const from = NB.nameOf(prof, it.s);
      const parts = NB.chatParts(it.chat);
      if (!parts) title = from + ' · ' + ((prof.group && prof.group.name) || 'العائلة');
      else {
        const to = parts.find((x) => x !== it.s);
        title = (dev.members || []).length > 1 && to ? from + ' ← ' + NB.nameOf(prof, to) : from;
      }
      body = NB.KIND[it.k] || 'رسالة';
      if (it.k === 'text' && it.p) { try { body = (await NB.decJSON(it.p)).x || body; } catch (e) {} }
      if (it.k === 'react') {
        let e = '';
        try { e = NB.unpack(await NB.dec(it.b)).head.e || ''; } catch (x) {}
        if (!e) continue;
        const fem = ((prof.members || {})[it.s] || {}).g === 'f';
        body = e === '⭐' ? (fem ? 'عطتك' : 'عطاك') + ' نجمة ⭐ على رسالتك' : (fem ? 'تفاعلت ' : 'تفاعل ') + e + ' على رسالتك';
        Object.assign(opt, { tag: 'react-' + it.chat, renotify: true, timestamp: Date.now() });
        shown.push(self.registration.showNotification(from, Object.assign(opt, { body })));
        continue;
      }
      Object.assign(opt, { tag: 'chat-' + it.chat, renotify: true, silent: false, vibrate: [300, 120, 300], requireInteraction: !isIOS, timestamp: Date.now() });
    } else if (it.t === 'n') {
      const from = NB.nameOf(prof, it.f);
      const many = (dev.members || []).length > 1;
      const fem = ((prof.members || {})[it.f] || {}).g === 'f';
      title = '💓 ' + from + ' ' + (many ? (fem ? 'تنادي ' : 'ينادي ') + NB.nameOf(prof, it.to) : (fem ? 'تناديك' : 'يناديك'));
      body = 'افتح نَبْض ورد ' + (fem ? 'عليها' : 'عليه') + ' بصوت أو كتابة أو صورة أو رسمة';
      Object.assign(opt, { tag: 'nudge-' + it.id, renotify: true, requireInteraction: true, vibrate: [600, 200, 600, 200, 900], silent: false });
    } else if (it.t === 'ns') {
      // النبضة انوقفت: نستبدل الإشعار بإشعار هادي ونشيله بعد ثواني
      const from = NB.nameOf(prof, it.f), fem = ((prof.members || {})[it.f] || {}).g === 'f';
      const old = await self.registration.getNotifications({ tag: 'nudge-' + it.id });
      old.forEach((x) => x.close());
      shown.push(self.registration.showNotification('نَبْض', { body: from + (fem ? ' وقّفت' : ' وقّف') + ' النبضة', tag: 'nudge-' + it.id, silent: true, renotify: false, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', lang: 'ar', dir: 'rtl', data: it })
        .then(() => new Promise((r) => setTimeout(r, 4000)))
        .then(() => self.registration.getNotifications({ tag: 'nudge-' + it.id }))
        .then((l) => l.forEach((x) => x.close())));
      continue;
    } else if (it.t === 'b') {
      title = '💾 وقت النسخة الاحتياطية';
      body = 'احفظ نسخة كاملة من رسائل العائلة وصورها على جهازك';
      opt.tag = 'backup';
    } else if (it.t === 'x') {
      title = it.title || 'نَبْض'; body = it.body || ''; opt.tag = 'bcast-' + Date.now();
    } else continue;
    shown.push(self.registration.showNotification(title, Object.assign(opt, { body })));
  }
  if (shown.length < 2 && !(visible && !isIOS)) shown.push(self.registration.showNotification('نَبْض', { body: 'عندك جديد في نَبْض', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'nabd' }));
  await Promise.all(shown);
}
self.addEventListener('push', (e) => { let d = null; try { d = e.data ? e.data.json() : null; } catch (x) {} e.waitUntil(onPush(d)); });

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const it = e.notification.data || {};
  let q = '';
  if (it.t === 'n') q = '#nudge=' + it.id + '&f=' + it.f + '&to=' + it.to;
  else if (it.t === 'm') q = '#chat=' + encodeURIComponent(it.chat);
  else if (it.t === 'b') q = '#backup';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if ('focus' in c) { c.postMessage({ type: 'open', hash: q }); return c.focus(); }
    }
    return self.clients.openWindow('./' + q);
  }));
});
