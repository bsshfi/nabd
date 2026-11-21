/* نَبْض | NABD — التطبيق (١): الدخول، المحادثات، الصوت والصور والرسم، النبضة
   الإعدادات والأجهزة والنسخ الاحتياطي في admin.js */
var A = (function () {
  'use strict';
  var API = CONFIG.API.replace(/\/$/, '');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var app = document.getElementById('app');
  var S = {
    acct: null, prof: { name: '', members: {}, order: [] }, rev: 0, roles: [], fam: {}, dev: { members: [], trusted: [] },
    me: null, view: '', chat: null, nudges: {}, nudgeShown: {}, acks: [], evAcks: [], busy: 0, reg: null
  };

  /* ---------- أدوات ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rid(n) { var a = crypto.getRandomValues(new Uint8Array(n || 12)); return NB.b64e(a).slice(0, Math.ceil((n || 12) * 4 / 3)); }
  function plat() { var ua = navigator.userAgent; return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /android/i.test(ua) ? 'android' : 'desktop'; }
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  /* المظهر: تلقائي · فاتح · داكن (لكل جهاز) */
  function theme() { try { return localStorage.getItem('nabd-theme') || 'auto'; } catch (e) { return 'auto'; } }
  function applyTheme() {
    var t = theme(), d = t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = d ? 'dark' : 'light';
    applySky();
  }
  /* 3.0: ما فيه ألوان سماء؛ أعلى الشاشة (تحت الساعة) لونه ثابت في الفاتح والداكن عشان شريط الآيفون يطابقه دايماً */
  // 3.1: أعلى الشاشة = لون خلفية الصفحة نفسها (بدون هيدر ملوّن)، فشريط الآيفون يطابقها دايماً
  function applySky() {
    var root = document.documentElement; delete root.dataset.sky;
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = root.dataset.theme === 'dark' ? '#14121D' : '#FAF7FE';
  }
  function setTheme(t) { try { localStorage.setItem('nabd-theme', t); } catch (e) {} applyTheme(); }
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme); } catch (e) {}
  applyTheme();
  function toast(t, ms) {
    var el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, ms || 2600);
  }
  var LOC = 'ar-SA-u-ca-gregory';
  function fmtDate(t) { return new Date(t).toLocaleDateString(LOC, { day: 'numeric', month: 'long', year: 'numeric' }); }
  function fmtTime(t) { return new Date(t).toLocaleTimeString(LOC, { hour: 'numeric', minute: '2-digit' }); }
  function fmtDay(t) {
    var d = new Date(t), n = new Date(), y = new Date(Date.now() - 864e5);
    if (d.toDateString() === n.toDateString()) return 'اليوم';
    if (d.toDateString() === y.toDateString()) return 'أمس';
    return d.toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function ago(t) {
    var s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 90) return 'الآن';
    if (s < 3600) return 'قبل ' + Math.round(s / 60) + ' دقيقة';
    if (s < 86400) { var h = Math.round(s / 3600); return h === 1 ? 'قبل ساعة' : h === 2 ? 'قبل ساعتين' : 'قبل ' + h + ' ساعات'; }
    var d = Math.round(s / 86400); return d === 1 ? 'أمس' : d === 2 ? 'قبل يومين' : 'قبل ' + d + ' أيام';
  }
  function num(n) { return Number(n).toLocaleString('ar-SA'); }

  /* أيقونات خطية */
  var IC = {
    back: '<path d="M9 6l6 6-6 6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>', home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>', send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    cam: '<path d="M3 8h3l2-3h8l2 3h3v12H3z"/><circle cx="12" cy="13" r="4"/>', pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/>',
    pulse: '<path d="M2 12h4l2-5 4 10 3-7 2 2h5"/>', swap: '<path d="M16 3l4 4-4 4"/><path d="M20 7H8"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h12"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    eraser: '<path d="M20 20H8l-5-5 10-10 8 8-6 7"/><path d="M7 11l7 7"/>', text: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3"/><path d="M16 7l3 3"/><path d="M18 5l2 2"/>', down: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/>',
    up: '<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 3h16"/>', refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>', check: '<path d="M4 12l5 5L20 6"/>', share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', play: '', image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-8 7"/>'
  };
  function ic(n, extra) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"' + (extra ? ' ' + extra : '') + '>' + IC[n] + '</svg>'; }
  var PLAY = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z" fill="currentColor"/></svg>';
  var PAUSE = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h4v16H7zM14 4h4v16h-4z" fill="currentColor"/></svg>';
  var LOGO = '<svg class="logo" viewBox="0 0 100 100" role="img" aria-label="نَبْض"><rect width="100" height="100" rx="22" fill="#3C5BD6"/><rect x="14" y="14" width="52" height="38" rx="14" fill="#fff"/><path d="M24 49l-5 13 15-11z" fill="#fff"/><circle cx="27" cy="30" r="4" fill="#2F6FDB"/><circle cx="39" cy="30" r="4" fill="#A13D8F"/><circle cx="51" cy="30" r="4" fill="#23854D"/><rect x="40" y="38" width="46" height="32" rx="13" fill="#F5B62A"/><path d="M74 67l8 10-15-7z" fill="#F5B62A"/><path d="M63 62c-7-5-10-8-10-11.5a4.5 4.5 0 0 1 10-2.3 4.5 4.5 0 0 1 10 2.3C73 54 70 57 63 62z" fill="#D4552B"/><rect x="30" y="81" width="40" height="11" rx="5.5" fill="#F26B1D"/><text x="50" y="88.6" text-anchor="middle" font-family="IBM Plex Sans Arabic,Arial" font-size="6.2" font-weight="700" fill="#fff" letter-spacing=".4">WAMD ARC</text></svg>';

  /* ---------- السيرفر ---------- */
  function api(path, body, opt) {
    opt = opt || {};
    var h = { };
    if (S.acct && S.acct.token) h.Authorization = 'Bearer ' + S.acct.token;
    var init = { method: body === undefined && !opt.raw ? 'GET' : 'POST', headers: h };
    if (opt.raw) { init.body = opt.raw; h['Content-Type'] = 'text/plain'; }
    else if (body !== undefined) { init.body = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    // مهلة: طلب علّق (مثلاً بعد ما رجع التطبيق من الخلفية) ما يأخّر الجديد
    var ac = window.AbortController ? new AbortController() : null, tm = null;
    if (ac) { init.signal = ac.signal; tm = setTimeout(function () { ac.abort(); }, opt.timeout || (opt.raw ? 60000 : 12000)); }
    return fetch(API + path, init).then(function (r) {
      if (tm) clearTimeout(tm);
      if (opt.text) return r.ok ? r.text() : Promise.reject({ status: r.status });
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { j.status = r.status; throw j; } return j; });
    }, function () { if (tm) clearTimeout(tm); throw { error: 'network' }; });
  }

  /* ---------- الأفراد والصلاحيات ---------- */
  function role(id) { for (var i = 0; i < S.roles.length; i++) if (S.roles[i].id === id) return S.roles[i]; return null; }
  function member(id) { return (S.prof.members || {})[id] || null; }
  function nm(id) { var m = member(id); return m ? m.name : 'أحد العائلة'; }
  function fem(id) { var m = member(id); return !!(m && m.g === 'f'); }
  function live() {
    var ord = (S.prof.order || []).concat(Object.keys(S.prof.members || {}));
    var seen = {}, out = [];
    ord.forEach(function (id) { if (seen[id]) return; seen[id] = 1; var r = role(id); if (member(id) && (!r || !r.removed)) out.push(id); });
    return out;
  }
  function isParent(id) { var r = role(id), m = member(id); return (r ? r.kind : m && m.kind) === 'parent'; }
  function isOwner(id) { return !!id && S.fam.owner === id; }
  function isAdmin(id) { var r = role(id); return !!(r && r.admin && S.dev.trusted.indexOf(id) >= 0); }
  function needsPin(id) { var r = role(id); return isParent(id) || (r && r.admin) || isOwner(id); }
  function deviceHasAdmin() { return S.dev.trusted.some(function (id) { var r = role(id); return r && r.admin; }); }
  function colorOf(id) { var m = member(id); if (m && m.c) return m.c; var i = live().indexOf(id); return MEMBER_COLORS[(i < 0 ? 0 : i) % MEMBER_COLORS.length]; }

  function av(id, size, extra) {
    var m = member(id) || {}, s = size || 48, a = m.av || {};
    var st = 'width:' + s + 'px;height:' + s + 'px;';
    if (a.photo) return '<span class="av" style="' + st + '"' + (extra || '') + '><img src="' + esc(a.photo) + '" alt=""></span>';
    if (a.e) return '<span class="av" style="' + st + 'background:' + esc(a.bg || '#FFE3B3') + ';font-size:' + Math.round(s * .56) + 'px;line-height:1;font-family:\'Apple Color Emoji\',\'Segoe UI Emoji\',\'Noto Color Emoji\',sans-serif"' + (extra || '') + '>' + esc(a.e) + '</span>';
    if (a.ch && window.CH) return '<span class="av" style="' + st + 'background:' + esc(a.bg || '#DCEBFA') + '"' + (extra || '') + '>' + CH.svg(a.ch) + '</span>';
    if (a.a && AVATARS[a.a]) return '<span class="av" style="' + st + 'background:' + esc(a.bg || AVATARS[a.a].bg) + '"' + (extra || '') + '><svg viewBox="0 0 64 64" aria-hidden="true">' + AVATARS[a.a].s + '</svg></span>';
    return '<span class="av" style="' + st + 'background:' + colorOf(id) + ';font-size:' + Math.round(s * .46) + 'px"' + (extra || '') + '>' + esc((m.name || '؟').trim().charAt(0)) + '</span>';
  }

  /* ---------- المحادثات ---------- */
  function pairId(a, b) { return a < b ? 'p:' + a + ':' + b : 'p:' + b + ':' + a; }
  function chatMembers(chat) { if (chat === 'g') return live(); return NB.chatParts(chat) || []; }
  function chatsFor(me) {
    var list = ['g'];
    live().forEach(function (id) {
      if (id === me) return;
      if (isParent(me) || isParent(id) || linked(me, id)) list.push(pairId(me, id));
    });
    return list;
  }
  function linked(a, b) { var k = a < b ? a + ':' + b : b + ':' + a; return (S.fam.links || []).indexOf(k) >= 0; }
  function otherOf(chat) { var p = NB.chatParts(chat); return p ? (p[0] === S.me ? p[1] : p[0]) : null; }
  function grp() { var g = S.prof.group || {}; return { name: g.name || 'العائلة', e: g.e || '', c: g.c || '#6E3FD9' }; }
  function grpIcon(size, radius) {
    var g = grp();
    return '<span class="homeic" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + radius + 'px;background:' + (radius > 20 ? 'rgba(255,255,255,.18)' : g.c) + '">' +
      (g.e ? '<span style="font-size:' + Math.round(size * .55) + 'px;line-height:1">' + esc(g.e) + '</span>' : '<svg class="ic" viewBox="0 0 24 24" style="width:' + Math.round(size * .52) + 'px;height:' + Math.round(size * .52) + 'px;stroke:#fff">' + IC.home + '</svg>') + '</span>';
  }
  function chatTitle(chat) { return chat === 'g' ? grp().name : nm(otherOf(chat)); }

  /* ---------- التشفير: كود العائلة ---------- */
  var ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function normCode(s) {
    s = String(s || '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.indexOf('NABD') === 0) s = s.slice(4);
    return s.replace(/O/g, '0').replace(/I/g, '1');
  }
  function newCode() { var a = crypto.getRandomValues(new Uint8Array(8)), s = ''; for (var i = 0; i < 8; i++) s += ALPH[a[i] % 32]; return 'NABD-' + s.slice(0, 4) + '-' + s.slice(4); }
  function prettyCode(n) { return 'NABD-' + n.slice(0, 4) + '-' + n.slice(4, 8); }
  function sha256hex(s) { return crypto.subtle.digest('SHA-256', NB.te.encode(s)).then(function (h) { return Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }); }
  function codeKey(norm, salt) {
    return crypto.subtle.importKey('raw', NB.te.encode('nabd:' + norm), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function wrapKey(code, rawKey) {
    var norm = normCode(code), salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return Promise.all([codeKey(norm, salt), sha256hex('nabd-code:' + norm)]).then(function (r) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, r[0], rawKey).then(function (ct) {
        var out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12);
        return { code_id: r[1], wrapped: NB.b64e(out), salt: NB.b64e(salt) };
      });
    });
  }
  function unwrapKey(code, wrapped, salt) {
    var a = NB.b64d(wrapped);
    return codeKey(normCode(code), NB.b64d(salt)).then(function (k) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: a.subarray(0, 12) }, k, a.subarray(12));
    }).then(function (raw) { return NB.b64e(new Uint8Array(raw)); });
  }

  /* ---------- الحالة المحفوظة ---------- */
  function saveDev() { return NB.kv.set('dev', S.dev); }
  function loadFamily() {
    return api('/family').then(function (f) {
      S.roles = f.roles || []; S.fam = { created: f.created, owner: f.owner, auto_del: f.auto_del, update_req: f.update_req, links: f.links || [] };
      S.dev = { members: f.dev.members || [], trusted: f.dev.trusted || [] };
      S.reminder = !!f.dev.reminder;
      return NB.decJSON(f.blob).then(function (p) {
        S.prof = p; S.rev = f.rev;
        return Promise.all([NB.kv.set('profile', { rev: f.rev, data: p }), NB.kv.set('roles', S.roles), NB.kv.set('fam', S.fam), saveDev()]);
      });
    });
  }
  function saveProfile(extra, apply, retried) {
    extra = extra || {};
    if (apply) apply();
    var rev = S.rev + 1;
    return NB.encJSON(S.prof).then(function (blob) {
      return api('/profile', { member: S.me, blob: blob, rev: rev, add: extra.add || [], remove: extra.remove || [] });
    }).then(function () {
      S.rev = rev; return NB.kv.set('profile', { rev: rev, data: S.prof });
    }).then(function () { return refreshRoles(); }).catch(function (e) {
      if (e && e.error === 'stale') return loadFamily().then(function () {
        if (apply && !retried) return saveProfile(extra, apply, true);
        throw { error: 'stale' };
      });
      throw e;
    });
  }
  /* تعديل صورتي (واسمي للوالدين) من الرئيسية أو الإعدادات */
  function editMe() {
    var me = S.me, m = member(me); if (!m) return;
    var adminMe = isAdmin(me), parentMe = isParent(me) && S.dev.trusted.indexOf(me) >= 0;
    memberForm(Object.assign({ id: me }, m), function (d) {
      var before = JSON.stringify(S.prof.members[me]);
      saveProfile({}, function () {
        var cur = S.prof.members[me] || m;
        S.prof.members[me] = Object.assign({}, cur, { av: d.av, name: (adminMe || parentMe) ? d.name : cur.name, g: adminMe ? d.g : cur.g, bd: adminMe ? d.bd : cur.bd });
      }).then(function () { toast('انحفظ ✓'); if (S.view === 'home') home(); else if (A.settings && S.view === 'settings') A.settings(); }, function (e) {
        S.prof.members[me] = JSON.parse(before);
        toast(e && e.error === 'network' ? 'ما فيه اتصال بالإنترنت' : 'ما قدرنا نحفظ، جرّب مرة ثانية');
      });
    }, { lockKind: true, avatarOnly: !adminMe, lockName: !(adminMe || parentMe) });
  }
  function refreshRoles() { return api('/sync', syncBody()).then(applySync); }

  /* ================= الشاشات ================= */
  function show(html, cls) {
    stopAudio(); applySky();
    app.innerHTML = '<section class="screen ' + (cls || '') + '">' + html + '</section>';
    window.scrollTo(0, 0);
    return app.firstChild;
  }
  /* زر يستجيب من أول لمسة: آيفون أحياناً ما يرسل click إذا تغيّر شي في الصفحة لحظة اللمس
     (مثل وصول علامات القراءة بعد إرسال رسمة)، فنسمع لرفع الإصبع نفسه */
  function fastTap(el, fn) {
    if (!el) return;
    var sx = 0, sy = 0, on = false, last = 0;
    el.addEventListener('touchstart', function (e) { var t = e.touches[0]; on = e.touches.length === 1; sx = t.clientX; sy = t.clientY; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (!on) return; on = false;
      var t = e.changedTouches[0];
      if (Math.abs(t.clientX - sx) + Math.abs(t.clientY - sy) > 14) return;
      e.preventDefault(); last = Date.now(); fn(e);   // نمنع الـclick المتأخر عشان ما يضغط على الشاشة الجديدة
    }, { passive: false });
    el.addEventListener('touchcancel', function () { on = false; });
    el.onclick = function (e) { if (Date.now() - last < 900) return; fn(e); };
  }
  function sheet(html) {
    var el = document.createElement('div'); el.className = 'sheet';
    el.innerHTML = '<div role="dialog" aria-modal="true">' + html + '</div>';
    el.addEventListener('click', function (e) { if (e.target === el && !el.dataset.lock) el.remove(); });
    document.body.appendChild(el);
    return el;
  }
  function closeSheets() { document.querySelectorAll('.sheet').forEach(function (s) { s.remove(); }); }

  /* ----- الترحيب ----- */
  function welcome(err) {
    S.view = 'welcome';
    var pendingFile = !!S.restoreFile;
    var el = show(
      '<div class="col center" style="margin-top:24px">' + LOGO +
      '<h1 style="font-size:30px;margin-top:6px">أهلاً بك في نَبْض</h1><p class="muted" style="margin:0">ارجع لعائلتك أو ابدأ عائلة جديدة</p></div>' +
      (pendingFile ? '<div class="notice blue">' + ic('file') + '<span>اخترت نسخة <b>' + esc(S.restoreFile.name) + '</b>. اكتب كود العائلة عشان نرجّعها.</span></div>' : '') +
      '<form class="card col" id="joinF" style="gap:12px;outline:3px solid var(--accent)"><b style="font-size:18px">عندي كود العائلة</b>' +
      '<label class="field"><span>اكتب الكود اللي عند الأب أو الأم</span><input class="inp code" id="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="NABD-XXXX-XXXX" inputmode="text"></label>' +
      '<button class="btn block" id="joinB">رجّعني للعائلة</button><div class="err" id="jerr">' + esc(err || '') + '</div><span class="tiny muted" style="text-align:center;margin-top:-8px">بعدها تختار مين أنت من الأفراد</span></form>' +
      '<div class="card row"><span style="color:var(--brand)">' + ic('up') + '</span><span class="grow col" style="gap:0"><b style="font-size:15px">عندك نسخة كاملة؟</b><span class="tiny muted">ترجع رسائلك وصورك من ملف على جهازك</span></span>' +
      '<label class="btn sm" style="background:var(--brand-soft);color:var(--brand-ink)">اختر ملف<input type="file" id="bfile" accept=".nabd,.json,application/json" hidden></label></div>' +
      installTip() +
      '<div class="col center" style="margin-top:auto;gap:8px"><span class="small muted">أول مرة تستخدم نَبْض؟</span><button class="btn line" id="newF">أنشئ عائلة جديدة</button></div>'
    );
    var hc = /[#&]j=([A-Za-z0-9-]+)/.exec(location.hash);
    if (hc) $('#code').value = hc[1];
    $('#joinF').onsubmit = function (e) { e.preventDefault(); join($('#code').value); };
    $('#newF').onclick = createFlow;
    $('#bfile').onchange = function () { var f = this.files[0]; if (f) { S.restoreFile = f; welcome(); } };
    bindInstall(el);
  }
  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; var b = $('#instB'); if (b) b.hidden = false; });
  function installTip() {
    if (standalone()) return '';
    var ios = plat() === 'ios';
    return '<div class="notice warm">' + ic('bell') + '<span class="grow">' + (ios
      ? 'عشان توصلك التنبيهات: اضغط زر المشاركة <b>⬆︎</b> ثم <b>«إضافة إلى الشاشة الرئيسية»</b>، وافتح نَبْض من الأيقونة.'
      : 'ثبّت نَبْض على الشاشة الرئيسية عشان توصلك التنبيهات حتى والتطبيق مقفل.') +
      '</span>' + (ios ? '' : '<button class="btn sm orange" id="instB"' + (deferredInstall ? '' : ' hidden') + '>ثبّت</button>') + '</div>';
  }
  function bindInstall(el) {
    var b = $('#instB', el);
    if (b) b.onclick = function () { if (!deferredInstall) return; deferredInstall.prompt(); deferredInstall.userChoice.then(function () { deferredInstall = null; b.hidden = true; }); };
  }

  /* ----- الانضمام بالكود ----- */
  function join(code) {
    var norm = normCode(code);
    if (norm.length !== 8) { $('#jerr').textContent = 'الكود ٨ حروف وأرقام بعد NABD'; return; }
    var b = $('#joinB'); b.disabled = true; b.innerHTML = '<span class="spin"></span>';
    sha256hex('nabd-code:' + norm).then(function (cid) {
      return api('/join', { code_id: cid, dev: { plat: plat(), ver: CONFIG.VERSION, tz: -new Date().getTimezoneOffset() } });
    }).then(function (j) {
      return unwrapKey(norm, j.wrapped, j.salt).then(function (key) {
        S.acct = { fam: j.fam, dev: j.dev, token: j.token, key: key, code: prettyCode(norm), created: j.created };
        return NB.kv.set('acct', S.acct);
      }).then(function () {
        S.roles = j.roles; S.fam = { created: j.created, owner: j.owner, auto_del: j.auto_del, update_req: j.update_req, links: j.links || [] };
        S.dev = { members: [], trusted: [] };
        return NB.decJSON(j.blob).then(function (p) { S.prof = p; S.rev = j.rev; });
      }).then(function () {
        return Promise.all([NB.kv.set('profile', { rev: S.rev, data: S.prof }), NB.kv.set('roles', S.roles), NB.kv.set('fam', S.fam), saveDev()]);
      });
    }).then(function () {
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
      history.replaceState(null, '', location.pathname);
      if (S.restoreFile) return A.importBackup(S.restoreFile).then(function (n) { S.restoreFile = null; toast('رجّعنا ' + num(n) + ' رسالة من النسخة ✓', 3500); });
    }).then(function () { picker(true); startLoop(); }).catch(function (e) {
      b.disabled = false; b.textContent = 'رجّعني للعائلة';
      $('#jerr').textContent = e && e.status === 404 ? 'الكود غير صحيح. تأكد منه من جوال الأب أو الأم.' : e && e.status === 429 ? 'محاولات كثيرة، جرّب بعد ' + (e.wait || 15) + ' دقيقة.' : e && e.error === 'network' ? 'ما فيه اتصال بالإنترنت.' : 'ما قدرنا نكمل، جرّب مرة ثانية.';
    });
  }

  /* ----- إنشاء عائلة جديدة ----- */
  var draft = null;
  function createFlow() {
    draft = { fam: '', me: { id: rid(9), name: 'بابا', kind: 'parent', g: 'm', av: charAv('parent', 'm') }, list: [] };
    createStep1();
  }
  function createStep1() {
    S.view = 'create';
    show('<div class="row"><button class="icb" id="bk" aria-label="رجوع">' + ic('back') + '</button><h2 class="grow" style="font-size:24px">عائلة جديدة</h2><span class="pill">١ من ٢</span></div>' +
      '<div class="card col" style="gap:14px">' +
      '<label class="field"><span>اسم العائلة</span><input class="inp" id="fn" maxlength="30" placeholder="مثلاً: آل باسل" value="' + esc(draft.fam) + '"></label>' +
      '<label class="field"><span>اسمك في التطبيق</span><input class="inp" id="mn" maxlength="20" value="' + esc(draft.me.name) + '"></label>' +
      '<div class="field"><span>أنت</span><div class="chips"><button class="chip' + (draft.me.g === 'm' ? ' on' : '') + '" data-g="m">الأب</button><button class="chip' + (draft.me.g === 'f' ? ' on' : '') + '" data-g="f">الأم</button></div></div>' +
      '</div><div class="notice blue">' + ic('shield') + '<span>أنت <b>مدير المجموعة الدائم</b>. تقدر تعطي الإشراف لغيرك وتشيله، وما أحد يقدر يشيله منك.</span></div>' +
      '<div class="err" id="e1"></div><button class="btn block" id="nx" style="margin-top:auto">التالي</button>');
    $('#bk').onclick = function () { welcome(); };
    document.querySelectorAll('[data-g]').forEach(function (b) {
      b.onclick = function () {
        draft.me.g = b.dataset.g;
        var n = $('#mn'); if (n.value === 'بابا' || n.value === 'ماما' || !n.value) n.value = draft.me.g === 'f' ? 'ماما' : 'بابا';
        draft.me.av = charAv('parent', draft.me.g);
        document.querySelectorAll('[data-g]').forEach(function (x) { x.classList.toggle('on', x === b); });
      };
    });
    $('#nx').onclick = function () {
      draft.fam = $('#fn').value.trim(); draft.me.name = $('#mn').value.trim();
      if (!draft.fam) return ($('#e1').textContent = 'اكتب اسم العائلة');
      if (!draft.me.name) return ($('#e1').textContent = 'اكتب اسمك');
      if (!draft.list.length) draft.list.push({ id: rid(9), name: draft.me.g === 'f' ? 'بابا' : 'ماما', kind: 'parent', g: draft.me.g === 'f' ? 'm' : 'f', av: charAv('parent', draft.me.g === 'f' ? 'm' : 'f') });
      createStep2();
    };
  }
  function tmpProfileWith(list) {
    var p = { name: draft.fam, members: {}, order: [] };
    [draft.me].concat(list).forEach(function (m) { p.members[m.id] = { name: m.name, kind: m.kind, g: m.g, av: m.av, bd: m.bd || '' }; p.order.push(m.id); });
    return p;
  }
  function createStep2() {
    var keep = S.prof; S.prof = tmpProfileWith(draft.list);
    var rows = draft.list.map(function (m, i) {
      return '<div>' + av(m.id, 44) + '<span class="grow col" style="gap:0"><b>' + esc(m.name) + '</b><span class="tiny muted">' + kindLabel(m) + '</span></span><button class="icb flat" data-rm="' + i + '" aria-label="حذف ' + esc(m.name) + '">' + ic('trash') + '</button></div>';
    }).join('');
    show('<div class="row"><button class="icb" id="bk" aria-label="رجوع">' + ic('back') + '</button><h2 class="grow" style="font-size:24px">أفراد العائلة</h2><span class="pill">٢ من ٢</span></div>' +
      '<div class="list"><div>' + av(draft.me.id, 44) + '<span class="grow col" style="gap:0"><b>' + esc(draft.me.name) + '</b><span class="tiny muted">مدير المجموعة</span></span><span class="pill">أنت</span></div>' + rows + '</div>' +
      '<button class="btn ghost block" id="add">' + ic('plus') + ' أضف فرد</button>' +
      '<p class="small muted" style="margin:0 6px">الأطفال يتكلمون مع الأب والأم فقط، وكل العائلة مع بعض في محادثة «العائلة». تقدر تضيف وتعدّل بعدين من الإعدادات.</p>' +
      '<div class="err" id="e2"></div><button class="btn block" id="go" style="margin-top:auto">أنشئ العائلة</button>');
    S.prof = keep;
    $('#bk').onclick = createStep1;
    document.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { draft.list.splice(+b.dataset.rm, 1); createStep2(); }; });
    $('#add').onclick = function () { memberForm(null, function (m) { draft.list.push(m); createStep2(); }); };
    $('#go').onclick = function () { setPin('اختر رمز سري من ٤ أرقام لحسابك', function (pin) { createFamily(pin); }); };
  }
  function charAv(kind, g) { var p = CH.presetFor(kind, g); return { ch: JSON.parse(JSON.stringify(p.ch)), bg: p.bg }; }
  function kindLabel(m) { return m.kind === 'parent' ? (m.g === 'f' ? 'أم' : 'أب') : (m.g === 'f' ? 'بنت' : 'ولد'); }

  /* نموذج فرد (إضافة أو تعديل): النوع، والصورة الرمزية (شخصيات · حيوانات · إيموجي) */
  function memberForm(m, done, opts) {
    opts = opts || {};
    var d = m ? JSON.parse(JSON.stringify(m)) : { id: rid(9), name: '', kind: null, g: null, av: null };
    var touched = !!m;
    var types = [['parent', 'm', 'أب'], ['parent', 'f', 'أم'], ['child', 'm', 'ولد'], ['child', 'f', 'بنت']];
    if (opts.lockKind) types = types.filter(function (t) { return t[0] === d.kind; });
    if (!d.av) { var p0 = CH.presetFor(d.kind || 'child', d.g || 'm'); d.av = { ch: JSON.parse(JSON.stringify(p0.ch)), bg: p0.bg }; }
    var tab = d.av.e ? 'emoji' : d.av.a ? 'draw' : 'char';
    var keep = S.prof;
    var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">' + (m ? 'تعديل ' + esc(m.name) : 'فرد جديد') + '</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      '<div class="row pvbar" style="gap:14px"><span id="pv"></span><label class="field grow"><span>الاسم</span><input class="inp" id="nn" maxlength="20" value="' + esc(d.name) + '" placeholder="مثلاً: يارا"' + (opts.lockName ? ' readonly style="opacity:.6"' : '') + '></label></div>' +
      '<div class="field"' + (opts.avatarOnly ? ' hidden' : '') + '><span>' + (opts.lockKind ? (d.kind === 'parent' ? 'أب أو أم' : 'ولد أو بنت') : 'النوع') + '</span><div class="chips" style="display:grid;grid-template-columns:repeat(' + types.length + ',minmax(0,1fr))">' + types.map(function (t) { return '<button class="chip' + (d.kind === t[0] && d.g === t[1] ? ' on' : '') + '" data-t="' + t[0] + '|' + t[1] + '">' + t[2] + '</button>'; }).join('') + '</div></div>' +
      (opts.avatarOnly ? '' : '<label class="field"><span>تاريخ الميلاد 🎂 (اختياري)</span><input class="inp" type="date" id="bd" value="' + esc(d.bd || '') + '" max="' + new Date().toISOString().slice(0, 10) + '" style="direction:ltr;text-align:right"></label>') +
      '<div class="field"><span>الصورة الرمزية</span><div class="seg"><button data-tab="char">شخصيات</button><button data-tab="draw">حيوانات</button><button data-tab="emoji">إيموجي</button></div></div>' +
      '<div id="avbox"></div><div class="err" id="me"></div><button class="btn block" id="ok">' + (m ? 'حفظ' : 'إضافة') + '</button>');
    function paintPv() { S.prof = { members: {} }; S.prof.members[d.id] = d; $('#pv', sh).innerHTML = av(d.id, 84); S.prof = keep; }
    function colors() { return '<div class="chb"><h4>الخلفية</h4><div class="chrow">' + AV_BGS.concat(['#FFFFFF', '#1B2333']).map(function (c) { return '<button class="sw' + (d.av && d.av.bg === c ? ' on' : '') + '" data-bg="' + c + '" aria-label="لون" style="background:' + c + '"></button>'; }).join('') + '</div></div>'; }
    function chThumb(patch, label, key) {
      var c = Object.assign({}, d.av.ch, patch), on = Object.keys(patch).every(function (k) { return (d.av.ch[k] == null ? '' : String(d.av.ch[k])) === String(patch[k]); });
      return '<button data-chp=\'' + esc(JSON.stringify(patch)) + '\' class="' + (on ? 'on' : '') + '"><span class="av" style="width:58px;height:58px;background:' + esc(d.av.bg || '#DCEBFA') + '">' + CH.svg(c) + '</span>' + label + '</button>';
    }
    function swatches(key, list) { return '<div class="chrow">' + list.map(function (c, i) { return '<button class="sw' + ((d.av.ch[key] | 0) === i ? ' on' : '') + '" data-chp=\'{"' + key + '":' + i + '}\' aria-label="لون" style="background:' + c + '"></button>'; }).join('') + '</div>'; }
    function row(title, html) { return '<div class="chb"><h4>' + title + '</h4>' + html + '</div>'; }
    function charTab() {
      var c = d.av.ch, hw = c.hw || 'none', covered = hw === 'shmagh' || hw === 'ghutra' || hw === 'hijab';
      var h = row('جاهزة', '<div class="chrow">' + CH.PRESETS.map(function (p, i) { if (d.g && p.g !== d.g) return ''; return '<button data-pre="' + i + '"><span class="av" style="width:58px;height:58px;background:' + p.bg + '">' + CH.svg(p.ch) + '</span>' + p.n + '</button>'; }).join('') + '</div>');
      h += row('البشرة', swatches('s', CH.SKIN));
      var gm = d.g === 'm', gf = d.g === 'f';
      var only = function (keys, boy, girl) { return keys.filter(function (k) { return !(gm && girl.indexOf(k) >= 0) && !(gf && boy.indexOf(k) >= 0); }); };
      h += row('غطاء الراس', '<div class="chrow">' + only(Object.keys(CH.HEADS), ['shmagh', 'ghutra', 'taqiya'], ['hijab', 'bow']).map(function (k) { return chThumb({ hw: k }, CH.HEADS[k]); }).join('') + '</div>');
      if (hw === 'hijab') h += row('لون الحجاب', swatches('wc', CH.HIJABC));
      if (hw === 'cap' || hw === 'bow') h += row(hw === 'cap' ? 'لون الكاب' : 'لون الفيونكة', swatches('wc', CH.CLOTH.slice(0, 8)));
      if (!covered) h += row('الشعر', '<div class="chrow">' + Object.keys(CH.HAIRS).map(function (k) { return chThumb({ h: k }, CH.HAIRS[k]); }).join('') + '</div>');
      if (!covered || (c.b | 0)) h += row('لون الشعر', swatches('hc', CH.HAIRC));
      h += row('اللبس', '<div class="chrow">' + only(Object.keys(CH.OUTFITS), ['thobe'], ['dress', 'trad', 'abaya']).map(function (k) { return chThumb({ o: k }, CH.OUTFITS[k]); }).join('') + '</div>');
      if (['tee', 'dress', 'hoodie'].indexOf(c.o) >= 0) h += row('لون اللبس', swatches('oc', CH.CLOTH));
      h += row('الوجه', '<div class="chrow">' + Object.keys(CH.FACES).map(function (k) { return chThumb({ e: k }, CH.FACES[k]); }).join('') + '</div>');
      if (d.g !== 'f') h += row('اللحية والشنب', '<div class="chrow">' + Object.keys(CH.BEARDS).map(function (k) { return chThumb({ b: +k }, CH.BEARDS[k]); }).join('') + '</div>');
      h += row('نظارة', '<div class="chrow">' + Object.keys(CH.GLASSES).map(function (k) { return chThumb({ gl: +k }, CH.GLASSES[k]); }).join('') + '</div>');
      return h + colors();
    }
    function paintTab() {
      sh.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
      var box = $('#avbox', sh), h = '';
      if (tab === 'char') { if (!d.av.ch) { var p0 = CH.presetFor(d.kind || 'child', d.g || 'm'); d.av = { ch: JSON.parse(JSON.stringify(p0.ch)), bg: d.av.bg || p0.bg }; paintPv(); } h = charTab(); }
      else if (tab === 'draw') h = '<div class="avgrid">' + Object.keys(AVATARS).map(function (k) {
        return '<button data-a="' + k + '" class="' + (d.av && d.av.a === k ? 'on' : '') + '" aria-label="' + AVATARS[k].n + '"><span class="av" style="width:60px;height:60px;background:' + (d.av && d.av.a === k && d.av.bg ? d.av.bg : AVATARS[k].bg) + '"><svg viewBox="0 0 64 64">' + AVATARS[k].s + '</svg></span></button>';
      }).join('') + '</div>' + colors();
      else h = '<div class="avgrid" style="grid-template-columns:repeat(6,minmax(0,1fr));gap:8px">' + AV_EMOJI.map(function (e, i) {
        return '<button data-e="' + i + '" class="' + (d.av && d.av.e === e ? 'on' : '') + '" style="width:48px;height:48px;font-size:28px;line-height:1;background:var(--card);box-shadow:0 1px 0 var(--line)">' + e + '</button>';
      }).join('') + '</div>' + colors();
      // نحافظ على مكان التمرير الأفقي لكل صف
      var sc = [].map.call(box.querySelectorAll('.chrow'), function (r) { return r.scrollLeft; });
      box.innerHTML = h;
      box.querySelectorAll('.chrow').forEach(function (r, i) { if (sc[i]) r.scrollLeft = sc[i]; });
      function set(fn) { return function () { touched = true; fn.call(this); paintTab(); paintPv(); }; }
      box.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = set(function () { d.av = { a: b.dataset.a, bg: AVATARS[b.dataset.a].bg }; }); });
      box.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = set(function () { d.av = { e: AV_EMOJI[+b.dataset.e], bg: (d.av && d.av.bg) || AV_BGS[0] }; }); });
      box.querySelectorAll('[data-bg]').forEach(function (b) { b.onclick = set(function () { d.av.bg = b.dataset.bg; }); });
      box.querySelectorAll('[data-pre]').forEach(function (b) { b.onclick = set(function () { var p = CH.PRESETS[+b.dataset.pre]; d.av = { ch: JSON.parse(JSON.stringify(p.ch)), bg: p.bg }; }); });
      box.querySelectorAll('[data-chp]').forEach(function (b) { b.onclick = set(function () { Object.assign(d.av.ch, JSON.parse(b.dataset.chp)); }); });
    }
    $('#x', sh).onclick = function () { sh.remove(); };
    sh.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () {
      var t = b.dataset.t.split('|'); d.kind = t[0]; d.g = t[1]; sh.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('on', x === b); });
      if (!touched) { var p = CH.presetFor(d.kind, d.g); d.av = { ch: JSON.parse(JSON.stringify(p.ch)), bg: p.bg }; tab = 'char'; paintPv(); }
      paintTab();
    }; });
    sh.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { tab = b.dataset.tab; paintTab(); }; });
    $('#nn', sh).oninput = function () { d.name = this.value; paintPv(); };
    $('#ok', sh).onclick = function () {
      d.name = $('#nn', sh).value.trim();
      if ($('#bd', sh)) d.bd = $('#bd', sh).value || '';
      if (!d.name) return ($('#me', sh).textContent = 'اكتب الاسم');
      if (!d.kind || !d.g) return ($('#me', sh).textContent = 'اختر ' + (opts.lockKind ? 'النوع' : 'أب أو أم أو ولد أو بنت'));
      sh.remove(); done(d);
    };
    paintTab(); paintPv();
    setTimeout(function () { if (!m) $('#nn', sh).focus(); }, 250);
  }

  function createFamily(pin) {
    var b = $('#go'); b.disabled = true; b.innerHTML = '<span class="spin"></span> نجهّز عائلتك…';
    var raw = crypto.getRandomValues(new Uint8Array(32)), code = newCode();
    var keyB64 = NB.b64e(raw);
    S.acct = { key: keyB64 };
    var prof = tmpProfileWith(draft.list); prof.created = Date.now();
    NB.kv.set('acct', S.acct).then(function () {
      return Promise.all([wrapKey(code, raw), NB.encJSON(prof)]);
    }).then(function (r) {
      return api('/family/create', {
        code_id: r[0].code_id, wrapped: r[0].wrapped, salt: r[0].salt, blob: r[1],
        owner: { id: draft.me.id, pin: pin },
        members: draft.list.map(function (m) { return { id: m.id, kind: m.kind }; }),
        dev: { plat: plat(), ver: CONFIG.VERSION, tz: -new Date().getTimezoneOffset() }
      });
    }).then(function (j) {
      S.acct = { fam: j.fam, dev: j.dev, token: j.token, key: keyB64, code: code, created: j.created };
      S.prof = prof; S.rev = 1; S.me = draft.me.id;
      S.fam = { created: j.created, owner: draft.me.id, auto_del: 30, update_req: 0 };
      S.roles = [{ id: draft.me.id, kind: 'parent', admin: true, pin: true }].concat(draft.list.map(function (m) { return { id: m.id, kind: m.kind, admin: false, pin: false }; }));
      S.dev = { members: [draft.me.id], trusted: [draft.me.id] };
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
      return Promise.all([NB.kv.set('acct', S.acct), NB.kv.set('profile', { rev: 1, data: prof }), NB.kv.set('roles', S.roles), NB.kv.set('fam', S.fam), saveDev(), NB.kv.set('me', S.me)]);
    }).then(function () {
      draft = null; startLoop(); showCode(true);
    }).catch(function (e) {
      NB.kv.del('acct'); S.acct = null;
      b.disabled = false; b.textContent = 'أنشئ العائلة';
      $('#e2').textContent = e && e.error === 'network' ? 'ما فيه اتصال بالإنترنت.' : 'ما قدرنا ننشئ العائلة، جرّب مرة ثانية.';
    });
  }
  function showCode(first) {
    S.view = 'code';
    show('<div class="col center" style="margin-top:20px">' + LOGO + '<h1 style="font-size:28px">جاهزة عائلة ' + esc(S.prof.name) + ' 🎉</h1></div>' +
      '<div class="card col" style="gap:12px"><div class="row"><span style="color:var(--accent-ink)">' + ic('key') + '</span><b class="grow" style="font-size:17px">كود العائلة</b></div>' +
      '<div class="inp code" style="height:auto;padding:16px;border-style:dashed;font-size:26px">' + esc(S.acct.code) + '</div>' +
      '<div class="row"><button class="btn sm block" id="cp">' + ic('copy') + ' نسخ</button><button class="btn sm ghost block" id="sh">' + ic('share') + ' مشاركة</button></div>' +
      '<span class="small muted">اكتبه على تابلت الأطفال وجوال الأم عشان ينضمون. وإذا انحذف التطبيق من أي جهاز، هذا الكود يرجّعه للعائلة. احفظه في مكان آمن.</span></div>' +
      '<button class="btn block" id="go" style="margin-top:auto">' + (first ? 'يلا نبدأ' : 'تم') + '</button>');
    $('#cp').onclick = function () { copy(S.acct.code); };
    $('#sh').onclick = function () { shareCode(); };
    $('#go').onclick = function () { home(); askNotif(); };
  }
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('انتسخ ✓'); }, function () { toast(t, 5000); }); }
  function shareCode() {
    var t = 'انضم لعائلة ' + S.prof.name + ' في نَبْض 💙\nالكود: ' + S.acct.code + '\n' + CONFIG.SITE + '/#j=' + S.acct.code;
    if (navigator.share) navigator.share({ title: 'نَبْض', text: t }).catch(function () {}); else copy(t);
  }

  /* ----- الرمز السري ----- */
  function pinPad(title, sub, onDone, opts) {
    opts = opts || {};
    var v = '';
    var sh = sheet('<div class="col center" style="gap:6px">' + (opts.who ? av(opts.who, 72) : '') + '<h2 style="font-size:22px">' + esc(title) + '</h2><span class="small muted" id="ps">' + esc(sub || '') + '</span></div>' +
      '<div class="dots" id="dots"><i></i><i></i><i></i><i></i></div><div class="err" id="pe"></div>' +
      '<div class="pinpad" style="direction:ltr">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button data-k="' + n + '">' + n + '</button>'; }).join('') +
      '<button data-k="x" aria-label="إلغاء" style="font-size:16px">إلغاء</button><button data-k="0">0</button><button data-k="b" aria-label="مسح">⌫</button></div>');
    var dots = $('#dots', sh);
    function paint() { dots.querySelectorAll('i').forEach(function (d, i) { d.classList.toggle('on', i < v.length); }); }
    var api2 = {
      fail: function (msg) { v = ''; paint(); $('#pe', sh).textContent = msg || ''; dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake'); },
      close: function () { sh.remove(); }, el: sh,
      sub: function (t) { $('#ps', sh).textContent = t; }
    };
    sh.querySelectorAll('[data-k]').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.k;
        if (k === 'x') { sh.remove(); if (opts.onCancel) opts.onCancel(); return; }
        if (k === 'b') { v = v.slice(0, -1); paint(); return; }
        if (v.length >= 4) return;
        v += k; paint();
        if (v.length === 4) setTimeout(function () { var p = v; onDone(p, api2); }, 120);
      };
    });
    return api2;
  }
  function setPin(title, done) {
    var first = null;
    pinPad(title, 'ما يعرفه إلا أنت', function (p, pad) {
      if (!first) { first = p; pad.fail(''); pad.sub('اكتبه مرة ثانية للتأكيد'); return; }
      if (p !== first) { first = null; pad.fail('ما تطابق، اكتبه من جديد'); pad.sub('ما يعرفه إلا أنت'); return; }
      pad.close(); done(p);
    });
  }

  /* ----- رمز وليّ الأمر ----- */
  function parentGate(fn, why) {
    if (isParent(S.me) && S.dev.trusted.indexOf(S.me) >= 0) return fn();
    pinPad('رمز وليّ الأمر', why || 'هذا الخيار يحتاج رمز الأب أو الأم', function (p, pad) {
      api('/pin/check', { pin: p }).then(function () { pad.close(); fn(); }, function (e) {
        if (e && e.error === 'bad_pin') pad.fail('رمز غلط' + (e.left > 0 ? ' · باقي ' + num(e.left) + ' محاولات' : ''));
        else if (e && e.error === 'locked') { pad.close(); toast('انقفل مؤقتاً، جرّب بعد ' + num(e.wait) + ' دقائق', 4000); }
        else pad.fail('ما فيه اتصال');
      });
    });
  }

  /* ----- مين معنا؟ ----- */
  function picker(all) {
    S.view = 'picker';
    var ids = live(), onDev = S.dev.members.filter(function (id) { return ids.indexOf(id) >= 0; });
    var list = all || !onDev.length ? ids : onDev;
    var el = show('<div class="col center" style="gap:8px;margin-top:20px">' + LOGO.replace('class="logo"', 'class="logo" style="width:84px;height:84px"') +
      '<h1 style="font-size:34px;margin-top:8px">نَبْض</h1><p class="muted" style="margin:0">مين معنا اليوم؟</p></div>' +
      '<div class="who">' + list.map(function (id) {
        return '<button data-id="' + id + '">' + av(id, 72) + '<b>' + esc(nm(id)) + (needsPin(id) ? '<span class="soft">' + ic('lock', 'style="width:14px;height:14px"') + '</span>' : '') + '</b></button>';
      }).join('') + '</div>' +
      (list.length < ids.length ? '<button class="btn line" id="more">شخص آخر يستخدم هذا الجهاز</button>' : '') +
      '<div class="col center" style="margin-top:auto;gap:2px"><p class="small muted" style="margin:0">هذا الجهاز مربوط بعائلة <b style="color:var(--ink)">' + esc(S.prof.name) + '</b> <span class="soft tiny">· منذ ' + fmtDate(S.fam.created || S.acct.created) + '</span></p><p class="tiny soft" style="margin:0">ما فيه أحد من خارج العائلة يقدر يدخل</p></div>');
    el.querySelectorAll('[data-id]').forEach(function (b) { b.onclick = function () { pick(b.dataset.id); }; });
    if ($('#more')) $('#more').onclick = function () {
      var hasParent = S.dev.trusted.some(function (x) { return isParent(x); });
      if (hasParent || !S.dev.members.length) picker(true); else parentGate(function () { picker(true); }, 'إضافة شخص لهذا الجهاز تحتاج رمز الأب أو الأم');
    };
  }
  function pick(id) {
    var useIt = function (pin, pad, adminPin) {
      return api('/use', { member: id, pin: pin, admin_pin: adminPin }).then(function (r) {
        if (pad) pad.close();
        S.dev.members = r.members; S.dev.trusted = r.trusted; S.me = id;
        return Promise.all([saveDev(), NB.kv.set('me', id)]).then(function () { home(); syncNow(); if (!localStorage.getItem('nabd-asked')) askNotif(); });
      });
    };
    if (S.dev.trusted.indexOf(id) >= 0 && S.dev.members.indexOf(id) >= 0) {
      if (!needsPin(id)) { S.me = id; NB.kv.set('me', id); home(); return; }
      // الأب والأم: نطلب الرمز كل مرة يتبدّل الشخص على جهاز مشترك
      if (S.dev.members.length === 1) { S.me = id; NB.kv.set('me', id); home(); return; }
    }
    if (!needsPin(id)) return useIt(undefined).catch(netErr);
    var r = role(id);
    if (r && !r.pin) {
      return setPin('اختر رمز سري لـ' + nm(id), function (p) {
        useIt(p).catch(function (e) {
          if (!e || e.error !== 'need_admin') return lockErr(e) || netErr(e);
          // أول مرة لهذا الحساب على جهاز جديد: المدير يأكّد برمزه
          pinPad('رمز المدير', 'أول مرة لـ' + nm(id) + ' على هذا الجهاز — يحتاج تأكيد المدير', function (a, pad) {
            useIt(p, pad, a).catch(function (e2) {
              if (e2 && e2.error === 'bad_admin_pin') pad.fail('رمز غلط' + (e2.left > 0 ? ' · باقي ' + num(e2.left) + ' محاولات' : ''));
              else if (e2 && e2.error === 'locked') { pad.close(); lockErr(e2); }
              else pad.fail('ما فيه اتصال');
            });
          });
        });
      });
    }
    pinPad('الرمز السري', nm(id), function (p, pad) {
      useIt(p, pad).catch(function (e) {
        if (e && e.error === 'bad_pin') pad.fail('رمز غلط' + (e.left > 0 ? ' · باقي ' + num(e.left) + ' محاولات' : ''));
        else if (e && e.error === 'locked') { pad.close(); toast('انقفل مؤقتاً، جرّب بعد ' + num(e.wait) + ' دقائق', 4000); }
        else { pad.fail('ما فيه اتصال'); }
      });
    }, { who: id });
  }
  function lockErr(e) { if (e && e.error === 'locked') { toast('انقفل مؤقتاً، جرّب بعد ' + num(e.wait) + ' دقائق', 4000); return true; } return false; }
  function netErr(e) { toast(e && e.error === 'network' ? 'ما فيه اتصال بالإنترنت' : 'صار خطأ، جرّب مرة ثانية'); }

  /* ----- الرئيسية ----- */
  function greet() { var h = new Date().getHours(); return h < 12 ? 'صباح الخير' : 'مساء الخير'; }

  /* ----- رسالة النوم: تسجّلها الحين وتوصل وقت النوم ----- */
  function bedSheet() {
    var at = function (h, mi) { var d = new Date(); d.setHours(h, mi, 0, 0); if (d.getTime() < Date.now() + 120e3) d.setDate(d.getDate() + 1); return d.getTime(); };
    var q = S.fam.quiet || {}, opts = [[20, 0], [20, 30], [21, 0], [21, 30]];
    if (q.on && q.from) { var hm = String(q.from).split(':'), h = +hm[0], mi = +(hm[1] || 0) - 10; if (mi < 0) { mi += 60; h = (h + 23) % 24; } opts.unshift([h, mi]); }
    var seen = {}; opts = opts.filter(function (o) { var k = o.join(':'); if (seen[k]) return false; seen[k] = 1; return true; }).map(function (o) { return at(o[0], o[1]); });
    var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">🌙 رسالة النوم</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      '<p class="small muted" style="margin:0">سجّل الحين (قصة قصيرة، دعاء، «تصبح على خير»)، وتوصل ' + esc(chatTitle(S.chat)) + ' بالوقت اللي تختاره' + (q.on ? '، قبل وضع النوم عشان يوصله التنبيه' : '') + '.</p>' +
      '<div class="col" style="gap:8px">' + opts.map(function (t, i) { return '<button class="btn line block" data-o="' + i + '" style="justify-content:space-between"><span>🌙 ' + fmtTime(t) + '</span><span class="small muted">' + fmtDay(t) + '</span></button>'; }).join('') + '</div>');
    $('#x', sh).onclick = function () { sh.remove(); };
    sh.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { sh.remove(); startRec({ bed: opts[+b.dataset.o] }); }; });
  }

  /* ----- ركن الكتابة للأطفال: إيموجي كبيرة مقسّمة + مساعدة إملاء خفيفة ----- */
  var EMO = [['😀', 'وجوه', '😀😃😄😁😆😂🤣😊😍🥰😘😋😜🤪😎🤩🥳😴🤔🤗😮😢😭😡🥺😇🤭🙄'], ['❤️', 'حب', '❤️🧡💛💚💙💜🩷🤍💕💖💗💓💞💝🫶🤗😘🥰🌹💐'],
    ['🐱', 'حيوانات', '🐱🐶🐰🐻🐼🦁🐯🐵🐸🐔🐧🐦🦄🐴🐪🐫🐑🐟🐠🐬🐳🦋🐝🐞🐢🦖'], ['🍕', 'أكل', '🍕🍔🍟🌭🍿🍩🍪🎂🍰🧁🍦🍫🍬🍭🍎🍉🍓🍌🍇🥝🍊🥤🧃☕🍽️'],
    ['⚽', 'لعب', '⚽🏀🏈🎾🏐🎮🕹️🧸🪀🪁🎨🖍️✏️📚🎒🏆🥇🎁🎈🎉🚲🛴🚗🚀✈️'], ['🌙', 'طبيعة', '🌙⭐🌟✨☀️🌤️⛅🌧️⛈️❄️🌈🌊🌸🌺🌻🌷🌳🌴🌵🍀🏝️🏜️⛰️🔥💧']];
  function emojiSheet(t, sync) {
    var tab = 0;
    var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">😊 اختر إيموجي</h2><button class="btn sm" id="x">تم</button></div>' +
      '<div class="chips" style="display:flex;gap:6px;overflow-x:auto;flex-wrap:nowrap">' + EMO.map(function (c, i) { return '<button class="chip' + (i ? '' : ' on') + '" data-t="' + i + '" style="flex:none;font-size:15px">' + c[0] + ' ' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div class="emogrid" id="eg"></div><div class="txt" id="epv" style="min-height:48px;font-size:22px;padding:10px 16px">' + esc(t.value) + '</div>');
    function paint() {
      var list = Array.from(new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(EMO[tab][2])).map(function (x) { return x.segment; });
      $('#eg', sh).innerHTML = list.map(function (e) { return '<button data-e="' + e + '">' + e + '</button>'; }).join('');
      sh.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { t.value += b.dataset.e; $('#epv', sh).textContent = t.value; sync(); if (navigator.vibrate) navigator.vibrate(8); }; });
    }
    sh.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { tab = +b.dataset.t; sh.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }; });
    $('#x', sh).onclick = function () { sh.remove(); };
    try { paint(); } catch (e) { $('#eg', sh).innerHTML = Array.from(EMO[0][2]).map(function (e) { return '<button>' + e + '</button>'; }).join(''); }
  }
  var SPELL = [[/(^|\s)(ان ?شا ?الله|انشاءالله|انشالله|إنشاء ?الله|انشاء ?الله)(?=\s|$|[.!؟?])/, 'إن شاء الله'], [/(^|\s)(ما ?شا ?الله|ماشاءالله|مشالله|ماشالله)(?=\s|$|[.!؟?])/, 'ما شاء الله'],
    [/(^|\s)(الحمدلله|الحمدالله|الحمد الله)(?=\s|$|[.!؟?])/, 'الحمد لله'], [/(^|\s)(لاكن)(?=\s|$)/, 'لكن'], [/(^|\s)(هاذا)(?=\s|$)/, 'هذا'], [/(^|\s)(هاذي)(?=\s|$)/, 'هذي'], [/(^|\s)(هاذه)(?=\s|$)/, 'هذه'],
    [/(^|\s)(اشتقتلك)(?=\s|$)/, 'اشتقت لك'], [/(^|\s)(جزاكالله)(?=\s|$)/, 'جزاك الله'], [/(^|\s)(ظروري)(?=\s|$)/, 'ضروري'], [/(^|\s)(الضهر)(?=\s|$)/, 'الظهر'],
    [/(^|\s)(ممتاذ)(?=\s|$)/, 'ممتاز'], [/(^|\s)(شكرن|شكرأ)(?=\s|$)/, 'شكراً'], [/(^|\s)(صباحالخير)(?=\s|$)/, 'صباح الخير'], [/(^|\s)(مساءالخير|مسائالخير)(?=\s|$)/, 'مساء الخير'],
    [/(^|\s)(تصبحعلىخير|تصبحين ?على ?خير)(?=\s|$)/, 'تصبح على خير'], [/(^|\s)(اللة)(?=\s|$)/, 'الله'], [/(^|\s)(ليه ?ش)(?=\s|$)/, 'ليش'], [/(^|\s)(إنتا|انتا)(?=\s|$)/, 'أنت']];
  function spellCheck(t) {
    var box = $('#spell'); if (!box) return;
    var v = t.value, hit = null;
    for (var i = 0; i < SPELL.length && !hit; i++) { var mm = SPELL[i][0].exec(v); if (mm && mm[2] !== SPELL[i][1]) hit = { re: SPELL[i][0], w: mm[2], fix: SPELL[i][1] }; }
    if (!hit) { box.hidden = true; return; }
    box.hidden = false; box.innerHTML = '<span class="grow">✏️ تقصد «' + esc(hit.fix) + '»؟</span><button id="spY">إيه</button>';
    $('#spY').onclick = function () { t.value = t.value.replace(hit.re, function (a, sp) { return sp + hit.fix; }); box.hidden = true; t.dispatchEvent(new Event('input')); t.focus(); };
  }

  /* ----- معرض النجوم: الرسومات والصور اللي أخذت ⭐ (ما تنمسح) ----- */
  function hasStar(m) { return !!(m.re && Object.keys(m.re).some(function (k) { return m.re[k] === '⭐'; })); }
  function starGallery() {
    S.view = 'stars';
    var el = show('<div class="row"><span class="fd grow" style="font-size:26px;font-weight:800">⭐ معرض النجوم</span></div>' +
      '<p class="small" style="margin:-6px 4px 0;color:#fff;text-shadow:0 1px 6px rgba(40,60,90,.25)">كل رسمة أو صورة أخذت نجمة تنحفظ هنا للأبد، حتى لو انمسحت المحادثة.</p><div id="sgal"></div>' + tabBar('stars'), 'v2');
    var urls = [];
    Promise.all(chatsFor(S.me).map(function (c) { return NB.msgs.chat(c); })).then(function (ls) {
      if (S.view !== 'stars') return;
      var all = [].concat.apply([], ls).filter(function (m) { return (m.k === 'draw' || m.k === 'photo' || m.k === 'sticker') && hasStar(m) && NB.media(m); }).sort(function (a, b) { return b.t - a.t; });
      var box = $('#sgal'); if (!box) return;
      if (!all.length) { box.innerHTML = '<div class="card col center" style="gap:8px;padding:40px 16px;text-align:center"><span style="font-size:54px">⭐</span><b>لسى ما فيه نجوم</b><span class="small muted">اضغط مطوّل على أي رسمة وعطها ⭐، وتنضاف هنا.</span></div>'; return; }
      box.innerHTML = '<div class="gal">' + all.map(function (m, i) {
        var u = URL.createObjectURL(NB.media(m)); urls.push(u);
        var n = Object.keys(m.re).filter(function (k) { return m.re[k] === '⭐'; }).length;
        return '<button data-i="' + i + '" class="' + (m.k === 'sticker' ? 'stkc' : '') + '"><img src="' + u + '" alt="" loading="lazy"' + (m.fr > 1 ? ' style="object-position:0 50%"' : '') + '><em>' + (n > 1 ? '⭐'.repeat(Math.min(3, n)) : '⭐') + '</em><span>' + av(m.s, 24) + esc(nm(m.s)) + '</span></button>';
      }).join('') + '</div>';
      box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { viewMedia(all[+b.dataset.i], b.querySelector('img').src); }; });
    });
  }

  /* ----- سلسلة الأيام 🔥: كم يوم ورا بعض فيه تواصل ----- */
  function streakOf(ms) {
    var days = {}; ms.forEach(function (m) { var d = new Date(m.t); days[d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()] = 1; });
    var d = new Date(), key = function () { return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }, n = 0;
    if (!days[key()]) d.setDate(d.getDate() - 1);
    while (days[key()]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ----- أعياد الميلاد 🎂 ----- */
  function bdInfo(id) {
    var m = member(id); if (!m || !m.bd) return null;
    var p = String(m.bd).split('-'), mo = +p[1] - 1, da = +p[2]; if (isNaN(mo) || !da) return null;
    var now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()), nx = new Date(now.getFullYear(), mo, da);
    if (nx < t0) nx.setFullYear(now.getFullYear() + 1);
    var age = +p[0] ? nx.getFullYear() - +p[0] : 0;
    return { days: Math.round((nx - t0) / 864e5), age: age };
  }
  function bdayCard() {
    var ids = live(), today = ids.filter(function (id) { var b = bdInfo(id); return b && b.days === 0; });
    if (today.length) {
      var id = today[0], b = bdInfo(id), mine = id === S.me, f = fem(id);
      var chat = mine ? null : (chatsFor(S.me).indexOf(pairId(S.me, id)) >= 0 ? pairId(S.me, id) : 'g');
      return '<div class="gl2 bday2" style="--cc:' + colorOf(id) + '"><span class="big">🎂</span><span class="grow col" style="gap:0">' +
        (mine ? '<b>كل عام وأنت' + (f ? 'ِ' : '') + ' بخير يا ' + esc(nm(id)) + '! 🎉</b><small>' + (b.age ? 'صار عمرك ' + b.age + ' 🎈' : 'يومك سعيد 🎈') + '</small>' :
          '<b>اليوم عيد ميلاد ' + esc(nm(id)) + '!</b><small>' + (b.age ? 'صار' + (f ? 'ت' : '') + ' ' + b.age + ' سنين 🎈' : 'لا تنسى' + ' تهنئته' + (f ? 'ا' : '') + ' 🎈') + '</small>') + '</span>' +
        (mine ? '' : '<button class="btn" data-bdc="' + esc(chat) + '" data-bdn="' + esc(id) + '">🎉 هنّ' + (f ? 'ئها' : 'ئه') + '</button>') + '</div>';
    }
    var soon = ids.map(function (id) { return { id: id, b: bdInfo(id) }; }).filter(function (x) { return x.b && x.b.days > 0 && x.b.days <= 7; }).sort(function (a, b) { return a.b.days - b.b.days; })[0];
    if (soon) return '<div class="gl2 bday2" style="padding:10px 14px"><span class="big" style="font-size:28px">🎈</span><span class="grow"><b style="font-size:15px">عيد ميلاد ' + esc(nm(soon.id)) + '</b> <small>' + (soon.b.days === 1 ? 'بكرة' : 'بعد ' + soon.b.days + ' أيام') + '</small></span></div>';
    return '';
  }

  /* ===================== «نبي» والمهام =====================
     كل تغيير = حدث مشفّر (ev) في قروب العائلة، وكل جهاز يبني الحالة من الأحداث.
     الموافقة والرفض والشراء وإعطاء المهام وتأكيدها للأب والأم بس. وكل شي يختفي بعد يوم */
  var DAY = 864e5;
  function parentsIds() { return live().filter(function (id) { return isParent(id); }); }
  function evNote(e, from) {
    var f = fem(from), n = nm(from);
    if (e.t === 'buy') {
      if (e.a === 'add') return isParent(from) ? null : [n + ' ' + (f ? 'تبي' : 'يبي') + ': ' + e.name, parentsIds()];
      if (e.a === 'ok') return ['✅ ' + n + ' ' + (f ? 'وافقت' : 'وافق') + ' على: ' + e.name, [e.by]];
      if (e.a === 'no') return ['❌ ' + n + ' ما ' + (f ? 'وافقت' : 'وافق') + ' على: ' + e.name, [e.by]];
      return null;
    }
    if (e.t === 'rw') {
      var rn = (e.e ? e.e + ' ' : '') + e.n;
      if (e.a === 'req') return ['🎁 ' + n + ' ' + (f ? 'تبي' : 'يبي') + ' مكافأة: ' + rn + ' (' + e.c + ' ⭐)', parentsIds()];
      if (e.a === 'ok') return ['🎉 ' + n + ' ' + (f ? 'وافقت' : 'وافق') + ' على مكافأتك: ' + rn, [e.who]];
      if (e.a === 'no') return ['⏳ ' + n + ' ' + (f ? 'أجّلت' : 'أجّل') + ' مكافأتك: ' + rn, [e.who]];
      return null;
    }
    if (e.t === 'task') {
      if (e.a === 'new') return ['📌 مهمة من ' + n + ': ' + e.text, e.to];
      if (e.a === 'done') return ['🙌 ' + n + ' ' + (f ? 'خلّصت' : 'خلّص') + ': ' + e.text, parentsIds()];
      if (e.a === 'ok') return ['⭐ +' + e.st + ' ' + (e.st === 1 ? 'نجمة' : 'نجوم') + ' على: ' + e.text, [e.who]];
    }
    return null;
  }
  function sendEv(e) {
    var note = evNote(e, S.me) || ['', []];
    var m = { id: rid(12), chat: 'g', s: S.me, k: 'ev', t: Date.now(), st: {}, r: [S.me], out: 1, text: JSON.stringify(e), nt: note[0], to: (note[1] || []).filter(function (x) { return x && x !== S.me; }) };
    return NB.msgs.put(m).then(function () { refreshView(); return upload(m); });
  }
  function evState() {
    return NB.msgs.all().then(function (all) {
      var now = Date.now(), m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
      var buy = {}, tasks = {}, stars = {}, rw = {}, spent = {};
      all.filter(function (m) { return m.k === 'ev' && m.t > now - 32 * DAY; }).sort(function (a, b) { return a.t - b.t; }).forEach(function (m) {
        var e; try { e = JSON.parse(m.text); } catch (x) { return; }
        var par = isParent(m.s);
        if (e.t === 'buy') {
          var b = buy[e.id];
          if (e.a === 'add') { if (!b) buy[e.id] = { id: e.id, name: String(e.name || '').slice(0, 60), by: m.s, t: m.t, st: par ? 'ok' : 'req' }; }
          else if (b && par && /^(ok|no|got)$/.test(e.a)) { b.st = e.a; b.who = m.s; b.at = m.t; }
          else if (b && e.a === 'del' && (par || b.by === m.s)) delete buy[e.id];
        } else if (e.t === 'task') {
          var k = tasks[e.id];
          if (e.a === 'new' && par && !k) tasks[e.id] = { id: e.id, text: String(e.text || '').slice(0, 80), by: m.s, t: m.t, to: e.to || [], st: Math.max(1, Math.min(3, e.st | 0)), done: {}, ok: {} };
          else if (k && e.a === 'done' && k.to.indexOf(m.s) >= 0) k.done[m.s] = m.t;
          else if (k && e.a === 'undo' && k.to.indexOf(m.s) >= 0 && !k.ok[m.s]) delete k.done[m.s];
          else if (k && e.a === 'ok' && par && k.done[e.who] && !k.ok[e.who]) { k.ok[e.who] = m.t; if (m.t >= +m0) stars[e.who] = (stars[e.who] || 0) + k.st; }
          else if (k && e.a === 'del' && par) delete tasks[e.id];
        } else if (e.t === 'rw') {
          var r = rw[e.id];
          if (e.a === 'req' && !par && !r) rw[e.id] = { id: e.id, who: m.s, n: String(e.n || '').slice(0, 40), e: String(e.e || '').slice(0, 8), c: Math.max(1, e.c | 0), t: m.t, st: 'req' };
          else if (r && par && r.st === 'req' && /^(ok|no)$/.test(e.a)) { r.st = e.a; r.by = m.s; r.at = m.t; if (e.a === 'ok' && r.t >= +m0) spent[r.who] = (spent[r.who] || 0) + r.c; }
        }
      });
      var vals = function (o) { return Object.keys(o).map(function (x) { return o[x]; }); };
      return {
        buy: vals(buy).filter(function (b) { return b.t > now - DAY; }).sort(function (a, b) { return b.t - a.t; }),
        tasks: vals(tasks).filter(function (k) { return k.t > now - DAY; }).sort(function (a, b) { return b.t - a.t; }),
        stars: stars, spent: spent,
        rw: vals(rw).filter(function (r) { return r.t >= +m0 || r.st === 'req'; }).sort(function (a, b) { return b.t - a.t; })
      };
    });
  }
  function evAlert(list) {
    var mine = list.filter(function (m) { return m.s !== S.me; });
    if (!mine.length) return;
    if (S.view === 'buy' || S.view === 'tasks' || S.view === 'rewards' || S.view === 'home') refreshView();
    var hit = null;
    mine.forEach(function (m) { var e; try { e = JSON.parse(m.text); } catch (x) { return; } var n = evNote(e, m.s); if (n && (n[1] || []).some(function (id) { return S.dev.members.indexOf(id) >= 0; })) hit = [n[0], e.t]; });
    if (!hit || document.visibilityState !== 'visible') return;
    ding(true);
    var old = document.querySelector('.inbanner'); if (old) old.remove();
    var b = document.createElement('button'); b.className = 'inbanner';
    b.innerHTML = '<span style="font-size:30px">' + (hit[1] === 'task' ? '✅' : hit[1] === 'rw' ? '🎁' : '🛒') + '</span><span class="grow col" style="gap:0;text-align:start;min-width:0"><b>' + (hit[1] === 'task' ? 'مهامي' : hit[1] === 'rw' ? 'المكافآت' : 'نبي من البقالة') + '</b><span class="small muted">' + esc(hit[0]) + '</span></span>';
    b.onclick = function () { b.remove(); if (hit[1] === 'task') tasksScreen(); else if (hit[1] === 'rw') rewardsScreen(); else buyScreen(); };
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 6000);
  }
  function whenAgo(t) { var d = (Date.now() - t) / 6e4; return d < 1 ? 'الحين' : d < 60 ? 'قبل ' + Math.round(d) + ' د' : 'قبل ' + Math.round(d / 60) + ' س'; }

  /* ---- 🛒 نبي ---- */
  var BUYQ = ['🥛 حليب', '🍞 خبز', '🥚 بيض', '🧃 عصير', '💧 ماء', '🍎 تفاح', '🍌 موز', '🧀 جبن', '🍪 بسكويت', '🍫 شوكولاتة', '🍦 آيسكريم', '🥤 لبن'];
  function buyScreen() {
    if (!S.me) return home();
    S.view = 'buy';
    var p = isParent(S.me);
    var el = show('<div class="row"><button class="icb" id="bk" aria-label="رجوع">' + ic('back') + '</button><span class="fd grow" style="font-size:25px;font-weight:800">🛒 نبي من البقالة</span></div>' +
      '<p class="small muted" style="margin:-4px 2px 0">' + (p ? 'العيال يطلبون من البقالة وأنت توافق أو ترفض. اللي توافق عليه ينضاف للقائمة، ولما تجيبه حط عليه ✓.' : 'اكتب وش تبي من البقالة، ولما يوافق بابا أو ماما ينضاف للقائمة.') + ' كل شي يختفي بعد يوم.</p>' +
      '<div class="card col" style="gap:10px;padding:12px"><div class="row" style="gap:8px"><input class="inp grow" id="bi" maxlength="60" placeholder="وش ' + (fem(S.me) ? 'تبين' : 'تبي') + '؟ مثلاً: حليب"><button class="btn" id="ba" style="flex:none;padding:0 18px">' + (p ? 'أضف' : 'اطلب') + '</button></div>' +
      '<div class="bq">' + BUYQ.map(function (q) { return '<button data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div>' +
      '<div id="bl" class="col" style="gap:12px"></div>', 'sub');
    fastTap($('#bk', el), function () { home(); });
    var add = function (name) {
      name = (name || '').trim(); if (!name) return;
      sendEv({ t: 'buy', a: 'add', id: rid(8), name: name.slice(0, 60) }); $('#bi').value = '';
      toast(p ? 'انضاف للقائمة ✓' : 'وصل طلبك لبابا وماما 👍');
    };
    $('#ba', el).onclick = function () { add($('#bi').value); };
    $('#bi', el).onkeydown = function (e) { if (e.key === 'Enter') add(this.value); };
    el.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { add(b.dataset.q); }; });
    renderBuy();
  }
  function renderBuy() {
    var box = $('#bl'); if (!box || S.view !== 'buy') return;
    var p = isParent(S.me);
    evState().then(function (E) {
      var req = E.buy.filter(function (b) { return b.st === 'req'; }), ok = E.buy.filter(function (b) { return b.st === 'ok'; }), got = E.buy.filter(function (b) { return b.st === 'got'; }), no = E.buy.filter(function (b) { return b.st === 'no' && (p || b.by === S.me); });
      var who = function (b) { return '<span class="bwho">' + av(b.by, 22) + esc(nm(b.by)) + ' · ' + whenAgo(b.t) + '</span>'; };
      var del = function (b) { return p || b.by === S.me ? '<button class="bdel" data-del="' + b.id + '" aria-label="حذف">✕</button>' : ''; };
      var h = '';
      if (req.length) h += '<span class="label">⏳ ' + (p ? 'تنتظر موافقتك' : 'تنتظر الموافقة') + '</span><div class="list blist">' + req.map(function (b) {
        return '<div><span class="grow col" style="gap:2px"><b>' + esc(b.name) + '</b>' + who(b) + '</span>' + (p ? '<button class="bok" data-ok="' + b.id + '" aria-label="موافق">✓</button><button class="bno" data-no="' + b.id + '" aria-label="رفض">✕</button>' : del(b)) + '</div>';
      }).join('') + '</div>';
      h += '<span class="label">🛒 القائمة</span>' + (ok.length ? '<div class="list blist">' + ok.map(function (b) {
        return '<div>' + (p ? '<button class="bchk" data-got="' + b.id + '" aria-label="انجاب"></button>' : '<span class="bchk"></span>') + '<span class="grow col" style="gap:2px"><b>' + esc(b.name) + '</b>' + who(b) + '</span>' + del(b) + '</div>';
      }).join('') + '</div>' : '<div class="card small muted" style="text-align:center;padding:16px">القائمة فاضية</div>');
      if (got.length) h += '<span class="label">✅ انجابت</span><div class="list blist">' + got.map(function (b) {
        return '<div class="bgot"><span class="bchk on">✓</span><span class="grow col" style="gap:2px"><b>' + esc(b.name) + '</b>' + who(b) + '</span></div>';
      }).join('') + '</div>';
      if (no.length) h += '<span class="label">ما انوافق عليها</span><div class="list blist">' + no.map(function (b) {
        return '<div class="bno2"><span class="grow col" style="gap:2px"><b>' + esc(b.name) + '</b>' + who(b) + '</span>' + del(b) + '</div>';
      }).join('') + '</div>';
      box.innerHTML = h;
      var find = function (id) { return E.buy.filter(function (b) { return b.id === id; })[0]; };
      box.querySelectorAll('[data-ok]').forEach(function (x) { x.onclick = function () { var b = find(x.dataset.ok); sendEv({ t: 'buy', a: 'ok', id: b.id, name: b.name, by: b.by }); }; });
      box.querySelectorAll('[data-no]').forEach(function (x) { x.onclick = function () { var b = find(x.dataset.no); sendEv({ t: 'buy', a: 'no', id: b.id, name: b.name, by: b.by }); }; });
      box.querySelectorAll('[data-got]').forEach(function (x) { x.onclick = function () { var b = find(x.dataset.got); x.classList.add('on'); x.textContent = '✓'; if (navigator.vibrate) navigator.vibrate(10); sendEv({ t: 'buy', a: 'got', id: b.id, name: b.name, by: b.by }); }; });
      box.querySelectorAll('[data-del]').forEach(function (x) { x.onclick = function () { var b = find(x.dataset.del); sendEv({ t: 'buy', a: 'del', id: b.id, name: b.name }); }; });
    });
  }

  /* ---- 🎁 مكافآت النجوم ----
     الأب/الأم يحددون المكافآت (تنحفظ مع بيانات العائلة). الطفل يجمع نجوم الشهر (⭐ على رسايله ورسماته + نجوم المهام)
     ولما تكفي يطلب المكافأة، والأب/الأم يوافقون — والنجوم تنخصم. كل شهر يبدأ من جديد */
  var RWQ = [['🍦', 'آيسكريم', 10], ['📺', 'فيلم مع العائلة', 12], ['🎮', 'ساعة ألعاب', 15], ['🍕', 'بيتزا', 25], ['🏞️', 'طلعة', 30], ['🧸', 'لعبة جديدة', 40]];
  function rewards() { return (S.prof.rw || []).slice().sort(function (a, b) { return a.c - b.c; }); }
  /* نجوم الشهر لفرد: ⭐ على رسايله (من اللي عندي على الجهاز) + نجوم المهام − اللي صرفها */
  function starBal(id) {
    return Promise.all([NB.msgs.all(), evState()]).then(function (r) {
      var m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
      var msg = 0;
      r[0].forEach(function (m) { if (m.s === id && m.t >= +m0 && m.re && m.k !== 'react' && m.k !== 'ev') Object.keys(m.re).forEach(function (k) { if (m.re[k] === '⭐') msg++; }); });
      var E = r[1], earned = msg + (E.stars[id] || 0), spent = E.spent[id] || 0;
      return { earned: earned, spent: spent, bal: Math.max(0, earned - spent), E: E };
    });
  }
  function rewardsScreen() {
    if (!S.me) return home();
    S.view = 'rewards';
    var p = isParent(S.me), canEdit = p && S.dev.trusted.indexOf(S.me) >= 0;
    var el = show('<div class="row"><button class="icb" id="bk" aria-label="رجوع">' + ic('back') + '</button><span class="fd grow" style="font-size:25px;font-weight:800">🎁 المكافآت</span></div>' +
      '<div id="rwl" class="col" style="gap:12px"></div>', 'sub');
    fastTap($('#bk', el), function () { home(); });
    renderRewards();
  }
  function renderRewards() {
    var box = $('#rwl'); if (!box || S.view !== 'rewards') return;
    var p = isParent(S.me), canEdit = p && S.dev.trusted.indexOf(S.me) >= 0, list = rewards();
    starBal(S.me).then(function (B) {
      if (S.view !== 'rewards') return;
      var E = B.E, html = '';
      if (!p) {
        var mine = E.rw.filter(function (r) { return r.who === S.me; });
        var pend = mine.filter(function (r) { return r.st === 'req'; });
        html += '<div class="rwbal"><img src="icons/3d/star.png" alt=""><span class="col" style="gap:0"><b>' + B.bal + '</b><small>' + (B.bal === 1 ? 'نجمة' : 'نجوم') + ' عندك هالشهر</small></span></div>';
        if (!list.length) html += '<div class="card col center" style="gap:6px;padding:26px 16px;text-align:center"><span style="font-size:44px">🎁</span><b>لسى ما فيه مكافآت</b><span class="small muted">قول لبابا أو ماما يضيفون مكافآت</span></div>';
        html += list.map(function (w) {
          var pct = Math.min(100, Math.round(B.bal / w.c * 100)), ok = B.bal >= w.c, wait = pend.some(function (r) { return r.n === w.n; });
          return '<div class="card rwc' + (ok ? ' can' : '') + '"><span class="rwe">' + esc(w.e) + '</span><span class="grow col" style="gap:4px;min-width:0"><b>' + esc(w.n) + '</b>' +
            '<span class="rwbar"><i style="width:' + pct + '%"></i></span><small class="muted">' + (ok ? 'تقدر تاخذها! 🎉' : 'باقي ' + (w.c - B.bal) + ' ⭐') + '</small></span>' +
            '<span class="col center" style="gap:6px"><span class="rwcost">' + w.c + ' ⭐</span>' + (wait ? '<span class="tchip">⏳ تنتظر</span>' : ok ? '<button class="btn sm" data-want="' + esc(w.id) + '">أبيها!</button>' : '') + '</span></div>';
        }).join('');
        var done = mine.filter(function (r) { return r.st !== 'req'; });
        if (done.length) html += '<span class="label">هالشهر</span>' + done.map(function (r) { return '<div class="card row" style="gap:10px;padding:10px 14px"><span style="font-size:26px">' + esc(r.e) + '</span><span class="grow">' + esc(r.n) + '</span>' + (r.st === 'ok' ? '<span class="tchip tok">🎉 وافق' + (fem(r.by) ? 'ت' : '') + ' ' + esc(nm(r.by)) + '</span>' : '<span class="tchip">⏳ بعدين</span>') + '</div>'; }).join('');
      } else {
        var req = E.rw.filter(function (r) { return r.st === 'req'; });
        if (req.length) html += '<span class="label">⏳ طلبات تنتظرك</span>' + req.map(function (r) {
          return '<div class="card row" style="gap:10px;padding:12px 14px">' + av(r.who, 40) + '<span class="grow col" style="gap:0;min-width:0"><b>' + esc(nm(r.who)) + ' ' + (fem(r.who) ? 'تبي' : 'يبي') + ' ' + esc(r.e) + ' ' + esc(r.n) + '</b><small class="muted">' + r.c + ' ⭐ · ' + whenAgo(r.t) + '</small></span>' +
            (canEdit ? '<button class="bok" data-rok="' + r.id + '" aria-label="موافق">✓</button><button class="bno" data-rno="' + r.id + '" aria-label="بعدين">✕</button>' : '') + '</div>';
        }).join('');
        // نجوم كل طفل
        var kids = live().filter(function (id) { return !isParent(id); });
        html += '<span class="label">⭐ نجوم العيال هالشهر</span><div class="card col" style="gap:8px;padding:12px 14px" id="kst">' + kids.map(function (id) { return '<div class="row" style="gap:10px">' + av(id, 32) + '<span class="grow">' + esc(nm(id)) + '</span><b class="kb" data-kb="' + id + '">…</b></div>'; }).join('') + '</div>';
        html += '<span class="label">🎁 المكافآت</span>' + (list.length ? list.map(function (w) { return '<div class="card row" style="gap:10px;padding:10px 14px"><span style="font-size:28px">' + esc(w.e) + '</span><span class="grow">' + esc(w.n) + '</span><span class="rwcost">' + w.c + ' ⭐</span>' + (canEdit ? '<button class="bdel" data-rdel="' + esc(w.id) + '" aria-label="حذف">✕</button>' : '') + '</div>'; }).join('') : '<div class="card small muted" style="padding:14px;text-align:center">ما فيه مكافآت — أضف أول وحدة 👇</div>');
        if (canEdit) html += '<div class="card col" style="gap:10px;padding:12px"><b>أضف مكافأة</b><div class="bq">' + RWQ.map(function (q, i) { return '<button data-rq="' + i + '">' + q[0] + ' ' + q[1] + ' · ' + q[2] + '⭐</button>'; }).join('') + '</div>' +
          '<div class="row" style="gap:8px"><input class="inp" id="rwe" maxlength="4" placeholder="🎁" style="width:58px;text-align:center;flex:none"><input class="inp" id="rwn" maxlength="40" placeholder="اسم المكافأة"><input class="inp" id="rwc" type="number" inputmode="numeric" min="1" max="500" placeholder="⭐" style="width:76px;flex:none"></div>' +
          '<button class="btn block" id="rwadd">أضف</button></div>';
      }
      box.innerHTML = html;
      if (p) live().filter(function (id) { return !isParent(id); }).forEach(function (id) { starBal(id).then(function (b) { var x = box.querySelector('[data-kb="' + id + '"]'); if (x) x.textContent = b.bal + ' ⭐'; }); });
      var byId = function (id) { return list.filter(function (w) { return w.id === id; })[0]; };
      box.querySelectorAll('[data-want]').forEach(function (b) { b.onclick = function () { var w = byId(b.dataset.want); if (!w) return; sendEv({ t: 'rw', a: 'req', id: rid(8), n: w.n, e: w.e, c: w.c }); if (navigator.vibrate) navigator.vibrate(15); toast('وصل طلبك لبابا وماما 🎁'); }; });
      var fr = function (id) { return E.rw.filter(function (r) { return r.id === id; })[0]; };
      box.querySelectorAll('[data-rok]').forEach(function (b) { b.onclick = function () { var r = fr(b.dataset.rok); sendEv({ t: 'rw', a: 'ok', id: r.id, who: r.who, n: r.n, e: r.e, c: r.c }); toast('🎉 وافقت'); }; });
      box.querySelectorAll('[data-rno]').forEach(function (b) { b.onclick = function () { var r = fr(b.dataset.rno); sendEv({ t: 'rw', a: 'no', id: r.id, who: r.who, n: r.n, e: r.e, c: r.c }); }; });
      var save = function (fn) { return saveProfile({}, function () { S.prof.rw = (S.prof.rw || []).slice(); fn(S.prof.rw); }).then(function () { renderRewards(); }, function () { toast('ما قدرنا نحفظ'); }); };
      box.querySelectorAll('[data-rdel]').forEach(function (b) { b.onclick = function () { if (!confirm('تحذف المكافأة؟')) return; save(function (a) { for (var i = a.length - 1; i >= 0; i--) if (a[i].id === b.dataset.rdel) a.splice(i, 1); }); }; });
      box.querySelectorAll('[data-rq]').forEach(function (b) { b.onclick = function () { var q = RWQ[+b.dataset.rq]; $('#rwe').value = q[0]; $('#rwn').value = q[1]; $('#rwc').value = q[2]; }; });
      if ($('#rwadd')) $('#rwadd').onclick = function () {
        var n = $('#rwn').value.trim(), c = parseInt($('#rwc').value, 10), e = $('#rwe').value.trim() || '🎁';
        if (!n) return toast('اكتب اسم المكافأة'); if (!(c > 0)) return toast('كم نجمة تحتاج؟');
        if ((S.prof.rw || []).length >= 12) return toast('أقصى شي ١٢ مكافأة');
        save(function (a) { a.push({ id: rid(6), n: n.slice(0, 40), e: e.slice(0, 8), c: Math.min(500, c) }); }).then(function () { toast('انضافت 🎁'); });
      };
    });
  }
  /* ---- ✅ المهام ---- */
  var TASKQ = ['🧹 نظّفوا الغرفة', '📚 ذاكروا', '✏️ حلّوا الواجب', '🕌 صلّوا', '🛏️ رتّبوا السرير', '🧸 رتّبوا الألعاب', '📖 اقرأوا قصة', '🦷 فرّشوا أسنانكم'];
  function tasksScreen() {
    if (!S.me) return home();
    S.view = 'tasks';
    var p = isParent(S.me), kids = live().filter(function (id) { return !isParent(id); });
    var st = { to: kids.slice(), stars: 1 };
    var el = show('<div class="row"><button class="icb" id="bk" aria-label="رجوع">' + ic('back') + '</button><span class="fd grow" style="font-size:25px;font-weight:800">✅ مهامي</span></div>' +
      (p ? '<div class="card col" style="gap:10px;padding:12px"><b style="font-size:16px">مهمة جديدة</b>' +
        '<div class="bq">' + TASKQ.map(function (q) { return '<button data-tq="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
        '<input class="inp" id="ti" maxlength="80" placeholder="أو اكتب مهمة من عندك">' +
        '<div class="tkids">' + kids.map(function (id) { return '<button class="on" data-k="' + id + '">' + av(id, 30) + '<span>' + esc(nm(id)) + '</span></button>'; }).join('') + '</div>' +
        '<div class="seg" id="tst">' + [1, 2, 3].map(function (n) { return '<button data-n="' + n + '" class="' + (n === 1 ? 'on' : '') + '">' + '⭐'.repeat(n) + '</button>'; }).join('') + '</div>' +
        '<button class="btn block" id="tgo">أرسل المهمة</button></div>' : '<p class="small muted" style="margin:-4px 2px 0">خلّص مهامك واضغط «خلّصت»، ولما يأكّد بابا أو ماما تاخذ نجومك ⭐</p>') +
      '<div id="tl" class="col" style="gap:12px"></div>', 'sub');
    fastTap($('#bk', el), function () { home(); });
    if (p) {
      el.querySelectorAll('[data-tq]').forEach(function (b) { b.onclick = function () { $('#ti').value = b.dataset.tq; }; });
      el.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { b.classList.toggle('on'); st.to = [].map.call(el.querySelectorAll('[data-k].on'), function (x) { return x.dataset.k; }); }; });
      el.querySelectorAll('[data-n]').forEach(function (b) { b.onclick = function () { st.stars = +b.dataset.n; el.querySelectorAll('[data-n]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
      $('#tgo', el).onclick = function () {
        var t = $('#ti').value.trim();
        if (!t) return toast('اختر مهمة أو اكتبها');
        if (!st.to.length) return toast('اختر مين يسويها');
        sendEv({ t: 'task', a: 'new', id: rid(8), text: t.slice(0, 80), to: st.to, st: st.stars }); $('#ti').value = '';
        toast('انرسلت المهمة 📌');
      };
    }
    renderTasks();
  }
  function renderTasks() {
    var box = $('#tl'); if (!box || S.view !== 'tasks') return;
    var p = isParent(S.me);
    evState().then(function (E) {
      var list = p ? E.tasks : E.tasks.filter(function (k) { return k.to.indexOf(S.me) >= 0; });
      if (!list.length) { box.innerHTML = '<div class="card col center" style="gap:6px;padding:28px 16px;text-align:center"><span style="font-size:44px">' + (p ? '📌' : '🎉') + '</span><b>' + (p ? 'ما فيه مهام اليوم' : 'ما عندك مهام') + '</b></div>'; return; }
      box.innerHTML = list.map(function (k) {
        var stars = '<span class="tstar">' + '⭐'.repeat(k.st) + '</span>';
        if (!p) {
          var ok = k.ok[S.me], done = k.done[S.me];
          return '<div class="card tcard' + (ok ? ' tok' : '') + '"><div class="row" style="gap:8px"><b class="grow" style="font-size:18px">' + esc(k.text) + '</b>' + stars + '</div>' +
            '<span class="small muted">من ' + esc(nm(k.by)) + ' · ' + whenAgo(k.t) + '</span>' +
            (ok ? '<div class="tdone">⭐ +' + k.st + ' — أحسنت!</div>' : done ? '<div class="twait">⏳ تنتظر تأكيد ' + esc(nm(k.by)) + ' <button class="linkb" data-undo="' + k.id + '">تراجع</button></div>' : '<button class="btn block" data-done="' + k.id + '">خلّصت ✓</button>') + '</div>';
        }
        return '<div class="card tcard"><div class="row" style="gap:8px"><b class="grow" style="font-size:18px">' + esc(k.text) + '</b>' + stars + '<button class="bdel" data-tdel="' + k.id + '" aria-label="حذف">✕</button></div>' +
          '<div class="col" style="gap:6px">' + k.to.map(function (id) {
            var s2 = k.ok[id] ? '<span class="tchip tok">⭐ +' + k.st + '</span>' : k.done[id] ? '<button class="btn sm" data-tok="' + k.id + '" data-who="' + id + '">' + (fem(id) ? 'خلّصت' : 'خلّص') + ' — أكّد ⭐</button>' : '<span class="tchip">لسى</span>';
            return '<div class="row" style="gap:8px">' + av(id, 30) + '<span class="grow">' + esc(nm(id)) + '</span>' + s2 + '</div>';
          }).join('') + '</div></div>';
      }).join('');
      var find = function (id) { return E.tasks.filter(function (k) { return k.id === id; })[0]; };
      box.querySelectorAll('[data-done]').forEach(function (x) { x.onclick = function () { var k = find(x.dataset.done); sendEv({ t: 'task', a: 'done', id: k.id, text: k.text }); if (navigator.vibrate) navigator.vibrate(15); toast('برافو! وصل لـ' + nm(k.by) + ' 👏'); }; });
      box.querySelectorAll('[data-undo]').forEach(function (x) { x.onclick = function () { var k = find(x.dataset.undo); sendEv({ t: 'task', a: 'undo', id: k.id, text: k.text }); }; });
      box.querySelectorAll('[data-tok]').forEach(function (x) { x.onclick = function () { var k = find(x.dataset.tok); sendEv({ t: 'task', a: 'ok', id: k.id, text: k.text, who: x.dataset.who, st: k.st }); }; });
      box.querySelectorAll('[data-tdel]').forEach(function (x) { x.onclick = function () { var k = find(x.dataset.tdel); if (confirm('تحذف المهمة؟')) sendEv({ t: 'task', a: 'del', id: k.id, text: k.text }); }; });
      // احتفال للطفل أول ما تتأكّد مهمته
      if (!p) list.forEach(function (k) {
        if (!k.ok[S.me]) return;
        var key = 'nabd-tcel:' + S.me + ':' + k.id;
        try { if (!localStorage.getItem(key)) { localStorage.setItem(key, 1); starBurst('⭐ +' + k.st + ' — ' + k.text); } } catch (e) {}
      });
    });
  }
  /* ===== الواجهة 2.0 — نفس هوية سهم وفلق وسراج: سماء تذوب في الرمل، ألواح زجاجية، برتقالي واحد ===== */
  var CHEV = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>';
  /* صورة العائلة فوق الرئيسية: تتركّب تلقائياً من شخصيات الأفراد (الأب والأم ورا، والعيال قدّام بطول أعمارهم)،
     أو صورة يرفعها الأب/الأم من إعدادات القروب */
  /* خلفيات صورة العائلة (يختارها ولي الأمر) */
  var FPBG = {
    '': { n: 'بنفسجي', sw: 'linear-gradient(180deg,#F4EFFE,#E6DBFC)' },
    garden: { n: 'حديقة', sw: 'linear-gradient(180deg,#CFE8FF 55%,#8CCB5E 55%)', s: '<defs><linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE2FF"/><stop offset="1" stop-color="#EAF6FF"/></linearGradient></defs><rect width="380" height="200" fill="url(#fg1)"/><circle cx="330" cy="42" r="20" fill="#FFD45C"/><g fill="#fff" opacity=".9"><ellipse cx="70" cy="40" rx="28" ry="10"/><ellipse cx="92" cy="34" rx="18" ry="10"/><ellipse cx="230" cy="58" rx="24" ry="8"/></g><path d="M0 132 Q90 100 190 126 T380 118 V200 H0Z" fill="#A6D875"/><path d="M0 156 Q110 128 230 150 T380 144 V200 H0Z" fill="#7FC255"/>' },
    night: { n: 'ليل', sw: 'linear-gradient(180deg,#1E1B4B,#4338CA)', s: '<defs><linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1B4B"/><stop offset="1" stop-color="#4C3FC4"/></linearGradient></defs><rect width="380" height="200" fill="url(#fg2)"/><path d="M332 26a20 20 0 1 0 14 34a16 16 0 1 1 -14 -34z" fill="#FFE59A"/><g fill="#fff"><circle cx="40" cy="30" r="1.8"/><circle cx="96" cy="58" r="1.4"/><circle cx="150" cy="22" r="1.6"/><circle cx="210" cy="46" r="1.2"/><circle cx="262" cy="18" r="1.6"/><circle cx="292" cy="80" r="1.3"/><circle cx="24" cy="92" r="1.2"/></g><path d="M0 160 Q190 136 380 160 V200 H0Z" fill="#2A2470"/>' },
    sea: { n: 'بحر', sw: 'linear-gradient(180deg,#BDE3FF 45%,#4FB3E8 45% 75%,#F3DDB0 75%)', s: '<rect width="380" height="200" fill="#C7E8FF"/><circle cx="60" cy="44" r="18" fill="#FFD45C"/><g fill="#fff" opacity=".9"><ellipse cx="280" cy="36" rx="30" ry="10"/><ellipse cx="300" cy="30" rx="18" ry="9"/></g><rect y="96" width="380" height="60" fill="#4FB3E8"/><path d="M0 108 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/><path d="M0 150 Q190 132 380 150 V200 H0Z" fill="#F3DDB0"/>' },
    desert: { n: 'برّ', sw: 'linear-gradient(180deg,#FFE7C2 55%,#E8AE5E 55%)', s: '<defs><linearGradient id="fg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A0"/><stop offset="1" stop-color="#FFF0D6"/></linearGradient></defs><rect width="380" height="200" fill="url(#fg3)"/><circle cx="300" cy="56" r="26" fill="#FFB547" opacity=".9"/><path d="M0 128 Q120 92 240 126 T380 112 V200 H0Z" fill="#F2C27B"/><path d="M0 158 Q150 126 300 152 T380 150 V200 H0Z" fill="#E3A552"/>' },
    home: { n: 'البيت', sw: 'linear-gradient(180deg,#F8E9D8 60%,#D9B98F 60%)', s: '<rect width="380" height="200" fill="#F8E9D8"/><rect x="40" y="24" width="64" height="74" rx="32" fill="#CFE8FF" stroke="#E2C7A6" stroke-width="6"/><path d="M72 24 V98 M40 64 H104" stroke="#E2C7A6" stroke-width="4"/><rect x="286" y="30" width="56" height="44" rx="6" fill="#FFF7EC" stroke="#D9B98F" stroke-width="5"/><circle cx="314" cy="52" r="10" fill="#F4A8B8"/><rect y="150" width="380" height="50" fill="#D9B98F"/><rect y="146" width="380" height="8" fill="#C9A57A"/>' }
  };
  /* أشكال جاهزة لإضافة أحد مو في التطبيق (جد، جدة، بيبي…) */
  var FPX = [
    { n: 'جد', k: 'p', ch: { s: 1, h: 'short', hc: 5, hw: 'shmagh', o: 'thobe', e: 'smile', b: 3 } },
    { n: 'جد بغترة', k: 'p', ch: { s: 2, h: 'short', hc: 5, hw: 'ghutra', o: 'thobe', e: 'calm', b: 3, gl: 1 } },
    { n: 'جدة', k: 'p', ch: { s: 1, h: 'long', hc: 5, hw: 'hijab', wc: 1, o: 'abaya', e: 'smile', gl: 1 } },
    { n: 'جدة بأبيض', k: 'p', ch: { s: 2, h: 'long', hc: 5, hw: 'hijab', wc: 0, o: 'trad', e: 'smile' } },
    { n: 'عم / خال', k: 'p', ch: { s: 1, h: 'short', hc: 0, hw: 'shmagh', o: 'thobe', e: 'grin', b: 2 } },
    { n: 'عمة / خالة', k: 'p', ch: { s: 1, h: 'long', hc: 0, hw: 'hijab', wc: 4, o: 'trad', e: 'grin' } },
    { n: 'بيبي ولد', k: 'c', age: 1, ch: { s: 1, h: 'short', hc: 2, hw: 'none', o: 'tee', oc: 6, e: 'laugh' } },
    { n: 'بيبي بنت', k: 'c', age: 1, ch: { s: 1, h: 'pigtails', hc: 2, hw: 'bow', wc: 5, o: 'dress', oc: 5, e: 'laugh' } }
  ];
  /* صورة العائلة فوق الرئيسية: تتركّب تلقائياً من شخصيات الأفراد (الأب والأم ورا، والعيال قدّام بطول أعمارهم).
     ولي الأمر يقدر يختار خلفية، ويخفي أحد، ويضيف أحد مو في التطبيق (جد، جدة، بيبي) أو حيوان أليف — أو يرفع صورة حقيقية */
  function famPortrait(gIn, wIn) {
    var g = gIn || S.prof.group || {};
    if (g.ph) return '<div class="fp4 ph"><img src="' + esc(g.ph) + '" alt="صورة العائلة"></div>';
    var hide = g.hide || [], add = g.add || [];
    var ids = live().filter(function (id) { return hide.indexOf(id) < 0; });
    var P = [], K = [], pets = [];
    ids.forEach(function (id) { var m = member(id) || {}, a = m.av || {}, bi = bdInfo(id); (isParent(id) ? P : K).push({ id: id, g: m.g, a: a, age: bi && bi.age ? bi.age : 9, par: isParent(id) }); });
    add.forEach(function (x) { if (x.k === 'pet') pets.push(x); else (x.k === 'p' ? P : K).push({ a: { ch: x.ch }, age: x.age || (x.k === 'p' ? 40 : 9), par: x.k === 'p' }); });
    P.sort(function (a, b) { return (a.g === 'f') - (b.g === 'f'); });
    K.sort(function (a, b) { return b.age - a.age; });
    if (K.length > 1) { var mid = [], k2 = K.slice(); while (k2.length) { mid.push(k2.shift()); if (k2.length) mid.unshift(k2.shift()); } K = mid; }
    if (!P.length && !K.length && !pets.length) return '';
    var W = wIn || Math.max(260, Math.min(360, (window.innerWidth || 390) - 40)), H = Math.round(W * .47);
    var u = H / 172;   // كل المقاسات نسبةً للارتفاع
    var bg = FPBG[g.bg] && g.bg ? FPBG[g.bg] : null;
    var fig = function (f, sz, x, bottom, z) {
      var a = f.a || {}, inner;
      if (f.pet) inner = '<svg viewBox="0 0 64 64" aria-hidden="true">' + (AVATARS[f.pet] || AVATARS.cat).s + '</svg>';
      else if (a.ch && window.CH) inner = CH.svg(a.ch);
      else if (!a.photo && !a.e && !a.a && window.CH) inner = CH.svg(CH.presetFor(f.par ? 'parent' : 'child', f.g).ch);
      else inner = '<span class="fphd">' + av(f.id, Math.round(sz * .56)) + '</span>';
      return '<span class="fpf' + (f.pet ? ' pet' : '') + '" style="width:' + sz + 'px;height:' + sz + 'px;left:' + Math.round(x - sz / 2) + 'px;bottom:' + bottom + 'px;z-index:' + z + '">' + inner + '</span>';
    };
    var kSize = function (f) { var a = f.age; return (a < 3 ? 76 : a < 6 ? 86 : a < 9 ? 94 : a < 12 ? 102 : 110) * u; };
    var widthOf = function (sz, step) { var w = sz[0] || 0; for (var i = 1; i < sz.length; i++) w += (sz[i - 1] + sz[i]) / 2 * step; return w; };
    var pS = P.map(function () { return 122 * u; }), kS = K.map(kSize), pet = 64 * u;
    var kW = widthOf(kS, .7) + pets.length * pet * .8;
    var k = Math.min(bg ? .88 : 1, (W - (bg ? 24 : 0)) / Math.max(widthOf(pS, .66), kW, 1));
    var out = '', place = function (list, sz, step, bottom, z0, shift) {
      var tot = widthOf(sz.map(function (v) { return v * k; }), step) - (sz[0] || 0) * k;
      var x = W / 2 - tot / 2 + (shift || 0);
      list.forEach(function (f, i) { if (i) x += (sz[i - 1] + sz[i]) / 2 * step * k; out += fig(f, Math.round(sz[i] * k), x, bottom, z0 + (i === Math.floor(list.length / 2) ? 2 : 1)); });
      return [W / 2 - tot / 2 + (shift || 0), x];
    };
    place(P, pS, .66, K.length ? Math.round(46 * u) : 0, 1);
    var ends = place(K, kS, .7, Math.round(-6 * u), 4);
    // الحيوانات الأليفة على الأطراف قدّام
    pets.forEach(function (x, i) {
      var left = i % 2 === 0, n = Math.floor(i / 2), sz = Math.round(pet * k);
      var cx = K.length ? (left ? ends[0] - (kS[0] || 0) * k * .42 - sz * (.38 + n * .7) : ends[1] + (kS[kS.length - 1] || 0) * k * .42 + sz * (.38 + n * .7)) : W / 2 + (left ? -1 : 1) * sz * (.6 + n);
      cx = Math.max(sz / 2 + 4, Math.min(W - sz / 2 - 4, cx));
      out += fig({ pet: x.a }, sz, cx, Math.round(4 * u), 8);
    });
    var deco = bg ? '' : '<img class="fpd d1" src="icons/3d/yheart.png" alt=""><img class="fpd d2" src="icons/3d/heart.png" alt=""><img class="fpd d3" src="icons/3d/sparkles.png" alt="">';
    return '<div class="fp4' + (bg ? ' scn' : '') + '" style="width:' + W + 'px;height:' + H + 'px">' + (bg ? '<svg class="fpbg" viewBox="0 0 380 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + bg.s + '</svg>' : '') + deco + out + '</div>';
  }
  var PULSE = '<svg class="pulse2" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 27C7 20.5 3.5 16.4 3.5 11.6A6.6 6.6 0 0 1 16 8.4a6.6 6.6 0 0 1 12.5 3.2c0 1.2-.2 2.3-.7 3.4"/><path d="M14 17h3l2-4 3 8 2-4h5"/></svg>';
  var TABI = {
    home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5"/>',
    album: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17 5-4.5 4 3.5 2.5-2 4.5 3.5"/>',
    stars: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    me: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20c1.2-4 4.2-6 7.5-6s6.3 2 7.5 6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  function tabBar(on) {
    var t = [['home', 'الرئيسية'], ['album', 'الألبوم'], ['stars', 'النجوم'], ['me', 'شخصيتي'], ['gear', 'الإعدادات']];
    return '<nav class="tabs2">' + t.map(function (x) { return '<button data-tab="' + x[0] + '"' + (x[0] === on ? ' class="on" aria-current="page"' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TABI[x[0]] + '</svg>' + x[1] + '</button>'; }).join('') + '</nav>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.tabs2 [data-tab]'); if (!b) return;
    var t = b.dataset.tab;
    if (b.classList.contains('on') && t !== 'me') return;
    if (t === 'home') home(); else if (t === 'album') album(); else if (t === 'stars') starGallery(); else if (t === 'me') editMe(); else if (t === 'gear') A.settings();
  });
  function home() {
    if (!S.me || live().indexOf(S.me) < 0 || S.dev.members.indexOf(S.me) < 0) return picker();
    S.view = 'home'; S.chat = null;
    var el = show(
      '<div class="hband"><header class="hero4"><div class="h4brand"><div class="bw2"><h1 class="logo2">نَبْض</h1>' + PULSE + '</div><div class="h4tag">مع عائلتي دائماً</div><div class="ptitle2">' + greet() + ' يا ' + esc(nm(S.me)) + ' 👋</div></div>' +
      '<div class="h4fam">' + famPortrait() + '</div>' +
      '<button class="mebig" id="sw" aria-label="غيّر الشخص">' + av(S.me, 58) + ((bdInfo(S.me) || {}).days === 0 ? '<span class="cake">🎂</span>' : '<span class="swb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></span>') + '</button></header>' +
      '<div class="chips2"><button class="chip2" id="starC"><img class="i3" src="icons/3d/star.png" alt=""><span>نجوم هالشهر</span></button>' +
      '<button class="chip2" id="rwC"><span style="font-size:19px">🎁</span><span>المكافآت</span></button></div></div>' +
      '<div id="bdc"></div>' +
      '<div class="fx3"><button class="fxt gl2 t-or" id="drawBig"><span class="fxi"><img src="icons/3d/palette.png" alt=""></span><b>ارسم للعائلة</b><small>فُرش وتلوين</small><span class="fxg">' + CHEV + '</span></button>' +
      '<button class="fxt gl2 t-bl" id="buyB"><span class="fxi"><img src="icons/3d/cart.png" alt=""></span><b>نبي من البقالة</b><small id="buyN">اطلب من البقالة</small><span class="fxg">' + CHEV + '</span><span class="fxn" id="buyC" hidden></span></button>' +
      '<button class="fxt gl2 t-gr" id="taskB"><span class="fxi"><img src="icons/3d/check.png" alt=""></span><b>مهامي</b><small id="taskN">مهام اليوم</small><span class="fxg">' + CHEV + '</span><span class="fxn" id="taskC" hidden></span></button></div>' +
      '<div id="wk"></div>' +
      '<div class="col" id="chats" style="gap:10px"></div><div id="hn"></div>' + tabBar('home'), 'v2 hm');
    $('#sw', el).onclick = function () { picker(); };
    // ولي الأمر: يضغط على صورة العائلة ويعدّلها
    if (isParent(S.me) && S.dev.trusted.indexOf(S.me) >= 0 && A.portraitSheet) { var hf = $('.h4fam', el); hf.classList.add('ed'); hf.onclick = function () { A.portraitSheet(); }; }
    $('#drawBig', el).onclick = function () { openChat('g', 'draw'); };
    $('#buyB', el).onclick = buyScreen; $('#taskB', el).onclick = tasksScreen;
    $('#starC', el).onclick = rewardsScreen; $('#rwC', el).onclick = rewardsScreen;
    var bc = bdayCard(); $('#bdc', el).outerHTML = bc || '';
    el.querySelectorAll('[data-bdc]').forEach(function (b) { b.onclick = function () { var id = b.dataset.bdn; S.chat = b.dataset.bdc; sendMsg('text', { text: 'كل عام و' + (fem(id) ? 'أنتِ' : 'أنت') + ' بخير يا ' + nm(id) + ' 🎂🎉' }); toast('انرسلت التهنئة 🎉'); }; });
    if ((bdInfo(S.me) || {}).days === 0) { var k = 'nabd-bd:' + S.me + ':' + new Date().getFullYear(); try { if (!localStorage.getItem(k)) { localStorage.setItem(k, 1); setTimeout(function () { starBurst('🎂 كل عام وأنت بخير يا ' + nm(S.me) + '!'); }, 600); } } catch (e) {} }
    renderChats(); renderHomeNotice();
  }
  function renderChats() {
    var box = $('#chats'); if (!box || S.view !== 'home') return;
    var chats = chatsFor(S.me);
    Promise.all(chats.map(function (c) { return NB.msgs.chat(c); })).then(function (lists) {
      var day0 = new Date(); day0.setHours(0, 0, 0, 0);
      var today = 0;
      var items = chats.map(function (c, i) {
        var ms = lists[i] || [], last = ms[ms.length - 1];
        today += ms.filter(function (m) { return m.t >= +day0; }).length;
        var unread = ms.filter(function (m) { return m.s !== S.me && (m.r || []).indexOf(S.me) < 0; }).length;
        return { c: c, last: last, unread: unread, t: last ? last.t : 0, fire: streakOf(ms) };
      });
      setBadge(items.reduce(function (n, it) { return n + it.unread; }, 0));
      var fireT = function (it) { return it.fire >= 2 ? '<span class="fire2" title="أيام تواصل ورا بعض">🔥' + it.fire + '</span>' : ''; };
      // نجوم هالشهر: كم ⭐ جتني على رسايلي
      var m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0); var stars = 0;
      lists.forEach(function (ms) { ms.forEach(function (m) { if (m.s === S.me && m.t >= +m0 && m.re) Object.keys(m.re).forEach(function (k) { if (m.re[k] === '⭐') stars++; }); }); });
      var sc = $('#starC');
      evState().then(function (E) {
        if (S.view !== 'home') return;
        var p = isParent(S.me), ts = E.stars[S.me] || 0;
        var st2 = stars + ts; if (sc) sc.innerHTML = '<img class="i3" src="icons/3d/star.png" alt=""><b>' + st2 + '</b><span>' + (st2 === 1 ? 'نجمة' : 'نجوم') + ' هالشهر</span>';
        var nb = p ? E.buy.filter(function (b) { return b.st === 'req'; }).length : E.buy.filter(function (b) { return b.st === 'ok'; }).length;
        var nt = p ? E.tasks.reduce(function (n, k) { return n + Object.keys(k.done).filter(function (w) { return !k.ok[w]; }).length; }, 0) : E.tasks.filter(function (k) { return k.to.indexOf(S.me) >= 0 && !k.done[S.me]; }).length;
        var bc = $('#buyC'), tc2 = $('#taskC');
        if (bc) { bc.hidden = !nb; bc.textContent = nb; }
        if (tc2) { tc2.hidden = !nt; tc2.textContent = nt; }
        var bn = $('#buyN'), tn = $('#taskN');
        if (bn) bn.textContent = p ? (nb ? nb + ' تنتظرك' : E.buy.length ? E.buy.filter(function (b) { return b.st === 'ok'; }).length + ' بالقائمة' : 'طلبات العيال') : 'اطلب اللي تبي';
        if (tn) tn.textContent = p ? (nt ? nt + ' تنتظرك' : E.tasks.length ? E.tasks.length + ' اليوم' : 'أعطهم مهام') : (nt ? 'باقي ' + nt : E.tasks.some(function (k) { return k.to.indexOf(S.me) >= 0; }) ? 'خلّصتها 👏' : 'ما فيه مهام');
      });
      if (sc) sc.innerHTML = '<img class="i3" src="icons/3d/star.png" alt=""><b>' + stars + '</b><span>' + (stars === 1 ? 'نجمة' : 'نجوم') + ' هالشهر</span>';
      // شريحة المكافآت: للطفل كم باقي للمكافأة الجاية، وللأب/الأم الطلبات اللي تنتظر
      var rc = $('#rwC'), rl = rewards();
      if (rc) starBal(S.me).then(function (B) {
        if (S.view !== 'home') return;
        var txt;
        if (isParent(S.me)) { var nreq = B.E.rw.filter(function (r) { return r.st === 'req'; }).length; txt = nreq ? '<span style="font-size:19px">🎁</span><b>' + nreq + '</b><span>' + (nreq === 1 ? 'طلب مكافأة' : 'طلبات مكافآت') + '</span>' : '<span style="font-size:19px">🎁</span><span>المكافآت</span>'; rc.classList.toggle('hot', !!nreq); }
        else if (!rl.length) txt = '<span style="font-size:19px">🎁</span><span>المكافآت</span>';
        else {
          var nx = rl.filter(function (w) { return w.c > B.bal; })[0], can = rl.filter(function (w) { return w.c <= B.bal; }).pop();
          txt = can ? '<span style="font-size:19px">' + esc(can.e) + '</span><span>تقدر تاخذ ' + esc(can.n) + '!</span>' : '<span style="font-size:19px">' + esc(nx.e) + '</span><span>باقي <b>' + (nx.c - B.bal) + '</b> ⭐ لـ' + esc(nx.n) + '</span>';
          rc.classList.toggle('hot', !!can);
        }
        rc.innerHTML = txt;
      });
      // رسّام الأسبوع: الرسمة اللي أخذت أكثر ⭐ في آخر ٧ أيام
      var wk = $('#wk');
      if (wk) {
        var w7 = Date.now() - 7 * 864e5, best = null, bestN = 0;
        lists.forEach(function (ms) { ms.forEach(function (m) {
          if (m.k !== 'draw' || m.t < w7 || !m.re || !NB.mediaSize(m)) return;
          var n = Object.keys(m.re).filter(function (k) { return m.re[k] === '⭐'; }).length;
          if (n > bestN || (n === bestN && n && m.t > best.t)) { best = m; bestN = n; }
        }); });
        if (best && wk.dataset.id === best.id + ':' + bestN) {}
        else if (best) {
          if (wk._u) URL.revokeObjectURL(wk._u);
          var u = wk._u = URL.createObjectURL(NB.media(best)); wk.dataset.id = best.id + ':' + bestN;
          wk.innerHTML = '<button class="wk4" id="wkB"><span class="wkimg">' + (best.fr > 1 ? animHTML(best, u, 'width:100%;height:100%', true) : '<img src="' + u + '" alt="رسمة ' + esc(nm(best.s)) + '">') + '</span><span class="grow col" style="gap:2px;min-width:0;text-align:start"><small class="lbl2">👑 رسّام الأسبوع</small><span class="row" style="gap:8px">' + av(best.s, 30) + '<b class="wkn">' + esc(nm(best.s)) + '</b></span><span class="wks">' + '⭐'.repeat(Math.min(5, bestN)) + (bestN > 5 ? ' ×' + bestN : '') + '</span></span><span class="go4">' + CHEV + '</span></button>';
          var bc0 = best.chat; $('#wkB').onclick = function () { openChat(bc0); };
        } else { wk.innerHTML = ''; wk.dataset.id = ''; }
      }
      var g = items.shift();
      items.sort(function (a, b) { return b.t - a.t; });
      var kid = !isParent(S.me);
      var quick = function (c) { return kid ? '<div class="quick2"><button data-q="voice" data-qc="' + esc(c) + '">🎤 صوت</button><button data-q="draw" data-qc="' + esc(c) + '">🎨 ارسم</button><button data-q="photo" data-qc="' + esc(c) + '">📷 صورة</button></div>' : ''; };
      var meta = function (it, light) { return '<span class="meta2">' + (it.last ? '<span class="when2">' + whenShort(it.last.t) + '</span>' : '') + (it.unread ? '<span class="badge2" aria-label="' + num(it.unread) + ' رسالة جديدة">' + it.unread + '</span>' : it.last && it.last.s === S.me ? tickSvg(it.last, light) : '') + '</span>'; };
      // بطاقة العائلة الكبيرة (مثل بطاقة الصلاة القادمة في فلق)
      var fam = live();
      var hero = '<div class="hero2 hero4c gl2' + (g.unread ? ' hot2' : '') + '"><button class="herob" data-c="g">' +
        '<span class="grow col" style="gap:2px;min-width:0"><small class="lbl2">محادثة العائلة</small><span class="hn2">' + esc(grp().name) + (grp().e ? ' <span class="ge4">' + esc(grp().e) + '</span>' : ' <img class="ge4" src="icons/3d/heart.png" alt="">') + fireT(g) + '</span>' +
        '<span class="pv2' + (g.unread ? ' un' : '') + '">' + (g.last ? previewOf(g.last) : 'ابدأوا السوالف 👋') + '</span></span>' +
        '<span class="house4"><img src="icons/3d/house.png" alt=""></span>' + meta(g) + '<span class="go4">' + CHEV + '</span></button>' +
        '<div class="faces2">' + fam.slice(0, 7).map(function (id) { return '<span style="--cc:' + colorOf(id) + '">' + av(id, 36) + '</span>'; }).join('') + (fam.length > 7 ? '<span class="more2">+' + (fam.length - 7) + '</span>' : '') +
        '<small class="cnt4"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="9" cy="8" r="3.4"/><circle cx="17" cy="9" r="2.6"/><path d="M2.5 19c.4-3.6 3.2-5.6 6.5-5.6s6.1 2 6.5 5.6zM15.6 13.6c2.9-.3 5.5 1.3 5.9 4.9h-4.6c-.2-1.9-.6-3.5-1.3-4.9z"/></svg>' + fam.length + ' في العائلة</small></div>' + '</div>';
      var rows = items.map(function (it) {
        var o = otherOf(it.c), col = colorOf(o);
        return '<div class="row2 gl2' + (it.unread ? ' hot2' : '') + '" style="--cc:' + col + '"><button class="rowb" data-c="' + esc(it.c) + '"><span class="ring2">' + av(o, 50) + '</span>' +
          '<span class="grow col" style="gap:1px;min-width:0"><span class="nm2">' + esc(nm(o)) + fireT(it) + '</span><span class="pv2' + (it.unread ? ' un' : '') + '">' + (it.last ? previewOf(it.last) : 'ابدأ السوالف 👋') + '</span></span>' + meta(it) + '</button>' + quick(it.c) + '</div>';
      }).join('');
      box.innerHTML = hero + (rows ? '<div class="shead2"><h2><img class="i3" src="icons/3d/chat.png" alt="">المحادثات</h2><button id="alL"><img class="i3" src="icons/3d/album.png" alt="">الألبوم <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button></div>' + rows : '');
      var al = $('#alL'); if (al) al.onclick = album;
      box.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { openChat(b.dataset.c); }; });
      box.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { openChat(b.dataset.qc, b.dataset.q); }; });
    });
  }
  function whenShort(t) {
    var d = Date.now() - t;
    if (d < 60e3) return 'الحين';
    if (d < 36e5) return 'قبل ' + num(Math.floor(d / 60e3)) + ' د';
    if (new Date(t).toDateString() === new Date().toDateString()) return fmtTime(t);
    if (d < 7 * 864e5) return new Date(t).toLocaleDateString(LOC, { weekday: 'long' });
    return new Date(t).toLocaleDateString(LOC, { day: 'numeric', month: 'short' });
  }
  function shade(hex, f) {
    var n = parseInt(String(hex).slice(1), 16); if (isNaN(n)) return hex;
    var c = function (v) { return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); };
    return '#' + ((1 << 24) + (c(n >> 16) << 16) + (c((n >> 8) & 255) << 8) + c(n & 255)).toString(16).slice(1);
  }
  function previewOf(m) {
    var who = m.s === S.me ? 'أنت: ' : (m.chat === 'g' ? esc(nm(m.s)) + ': ' : '');
    if (m.k === 'text') return who + esc((m.text || '').slice(0, 60));
    return who + NB.KIND[m.k];
  }
  function renderHomeNotice() {
    var box = $('#hn'); if (!box) return;
    notifState().then(function (st) {
      if (S.view !== 'home') return;
      if (st === 'on') box.innerHTML = '<div class="notice warm">' + ic('bell') + '<span>التنبيهات شغالة، توصلك رسائل العائلة حتى وأنت ' + (isParent(S.me) ? 'مشغول' : (fem(S.me) ? 'تلعبين' : 'تلعب')) + '</span></div>';
      else if (st === 'ios-install') box.innerHTML = installTip();
      else if (st === 'denied') box.innerHTML = '<div class="notice red">' + ic('bell') + '<span>التنبيهات مقفلة لنَبْض. افتح إعدادات المتصفح ← الإشعارات ← اسمح لـ nabd.wamdarc.com</span></div>';
      else if (st === 'unsupported') box.innerHTML = '';
      else { box.innerHTML = '<div class="notice warm">' + ic('bell') + '<span class="grow">فعّل التنبيهات عشان توصلك الرسائل والنبضة</span><button class="btn sm orange" id="nb">فعّل</button></div>'; $('#nb').onclick = function () { enableNotif().then(renderHomeNotice); }; }
    });
  }

  /* ================= المحادثة ================= */
  var urls = [];
  function openChat(chat, mode) {
    if (chatsFor(S.me).indexOf(chat) < 0) return home();
    stopAudio();
    S.view = 'chat'; S.chat = chat;
    Object.keys(urlCache).forEach(function (k) { URL.revokeObjectURL(urlCache[k]); }); urlCache = {};
    var o = otherOf(chat), canNudge = o && (isParent(S.me) || isAdmin(S.me)) && S.dev.trusted.indexOf(S.me) >= 0;
    app.innerHTML = '<section class="chat" data-wp="' + wallOf(chat) + '" style="--wc:' + (chat === 'g' ? grp().c : colorOf(o)) + '">' +
      '<div class="chathead"><button class="icb flat" id="bk" aria-label="رجوع">' + ic('back') + '</button>' +
      (chat === 'g' ? grpIcon(46, 16) : '<span class="ring sm">' + av(o, 44) + '</span>') +
      '<span class="grow col" style="gap:0;min-width:0"><span class="row" style="gap:8px;align-items:baseline"><span class="t">' + esc(chatTitle(chat)) + '</span>' + (chat === 'g' ? '<span class="tiny soft">منذ ' + fmtDate(S.fam.created || S.acct.created) + '</span>' : '') + '</span>' +
      '<span class="tiny muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (chat === 'g' ? live().map(nm).map(esc).join('، ') : kindLabel(member(o) || {})) + '</span></span>' +
      '<button class="icb flat" id="wpB" aria-label="خلفية المحادثة" style="font-size:20px">🎨</button>' +
      (canNudge ? '<button class="btn sm orange" id="nudgeB" aria-label="أرسل نبضة لـ' + esc(nm(o)) + '">' + ic('pulse') + ' نبضة</button>' : '') + '</div>' +
      '<div class="msgs" id="msgs"></div><div class="compose" id="comp"></div></section>';
    fastTap($('#bk'), function () { if (S.view === 'chat') home(); });
    $('#wpB').onclick = function () { wallSheet(chat); };
    if (canNudge) $('#nudgeB').onclick = function () { sendNudge(o); };
    composer();
    renderMsgs(true);
    if (mode === 'voice') setTimeout(startRec, 300);
    else if (mode === 'text') setTimeout(function () { $('#txt') && $('#txt').focus(); }, 300);
    else if (mode === 'photo') setTimeout(pickPhoto, 300);
    else if (mode === 'draw') drawScreen();
  }
  /* خلفية لكل محادثة (لكل شخص على جهازه) */
  var WALLS = [['dots', 'نقاط'], ['hearts', 'قلوب'], ['stars', 'نجوم'], ['clouds', 'غيوم'], ['flowers', 'ورود'], ['plain', 'سادة']];
  function wallOf(chat) { try { return localStorage.getItem('nabd-wp:' + S.me + ':' + chat) || 'dots'; } catch (e) { return 'dots'; } }
  function wallSheet(chat) {
    var cur = wallOf(chat), col = chat === 'g' ? grp().c : colorOf(otherOf(chat));
    var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">🎨 خلفية المحادثة</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      '<p class="small muted" style="margin:0">لونها من لون ' + esc(chatTitle(chat)) + '، وتتغيّر عندك بس.</p>' +
      '<div class="wpgrid">' + WALLS.map(function (w) { return '<button class="chat' + (w[0] === cur ? ' on' : '') + '" data-wp="' + w[0] + '" style="--wc:' + col + ';height:96px;display:flex"><i></i><span style="position:relative">' + w[1] + '</span></button>'; }).join('') + '</div>');
    $('#x', sh).onclick = function () { sh.remove(); };
    sh.querySelectorAll('[data-wp]').forEach(function (b) { b.onclick = function () {
      try { localStorage.setItem('nabd-wp:' + S.me + ':' + chat, b.dataset.wp); } catch (e) {}
      var c = $('section.chat'); if (c) c.dataset.wp = b.dataset.wp; sh.remove();
    }; });
  }
  function renderMsgs(scroll) {
    var box = $('#msgs'); if (!box || S.view !== 'chat') return;
    var chat = S.chat;
    NB.msgs.chat(chat).then(function (ms) {
      if (S.chat !== chat || S.view !== 'chat') return;
      var atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120, fromBottom = box.scrollHeight - box.scrollTop;
      var html = '', lastDay = '';
      ms.forEach(function (m) {
        var d = new Date(m.t).toDateString();
        if (d !== lastDay) { html += '<span class="day">' + fmtDay(m.t) + '</span>'; lastDay = d; }
        html += msgHTML(m);
      });
      if (!ms.length) html = '<div class="col center" style="margin:auto;gap:6px;color:var(--muted)">' + (chat === 'g' ? '<span style="font-size:44px">' + (grp().e || '👨‍👩‍👧‍👦') + '</span><b>' + esc(grp().name) + '</b><span class="small">ابدأوا السوالف 👋</span>' : av(otherOf(chat), 80) + '<b>' + esc(nm(otherOf(chat))) + '</b><span class="small">ابدأ السوالف 👋</span>') + '</div>';
      html += nudgeCardHTML();
      var stick = scroll || atBottom;
      // نفس المحتوى؟ ما نعيد بناء القائمة (إعادة البناء وقت اللمس تضيّع الضغطات في الآيفون)
      if (box._h === html && box.childElementCount) { markRead(ms); return; }
      box._h = html;
      box.innerHTML = html;
      bindMsgs(box, ms);
      var settle = function () { if (stick) box.scrollTop = box.scrollHeight; else box.scrollTop = box.scrollHeight - fromBottom; };
      settle();
      box.querySelectorAll('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', settle, { once: true }); });
      requestAnimationFrame(settle);
      markRead(ms);
      starCheck(ms);
    });
  }
  /* نجمة ⭐ على رسالتي/رسمتي ما شفت احتفالها بعد ← احتفال مرة وحدة */
  function starCheck(ms) {
    if (document.visibilityState !== 'visible') return;
    var hit = null;
    ms.forEach(function (m) {
      if (m.s !== S.me || !m.re) return;
      Object.keys(m.re).forEach(function (g) {
        if (g === S.me || m.re[g] !== '⭐' || (m.cel || {})[g]) return;
        m.cel = m.cel || {}; m.cel[g] = 1; NB.msgs.put(m); hit = { g: g, m: m };
      });
    });
    if (hit) { ding(false); starBurst(nm(hit.g) + ' ' + (fem(hit.g) ? 'عطتك' : 'عطاك') + ' نجمة على ' + (hit.m.k === 'draw' ? 'رسمتك' : hit.m.k === 'photo' ? 'صورتك' : 'رسالتك') + '! 🎉'); }
  }
  function tickSvg(m) {
    if (m.out) return '<svg class="tick" viewBox="0 0 24 24" stroke="#8A93A6" aria-label="ما انرسلت بعد"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';
    var rec = chatMembers(m.chat).filter(function (x) { return x !== m.s; }), st = m.st || {};
    var all = rec.length > 0 && rec.every(function (x) { return (st[x] || 0) >= 2; }), any = rec.some(function (x) { return (st[x] || 0) >= 1; });
    if (!any && !all) return '<svg class="tick" viewBox="0 0 24 24" stroke="#8A93A6" aria-label="انرسلت"><path d="M4 12l5 5L20 6"/></svg>';
    return '<svg class="tick" viewBox="0 0 24 24" stroke="' + (all ? 'var(--accent)' : '#8A93A6') + '" aria-label="' + (all ? 'شافوها' : 'وصلت') + '"><path d="M2 12l5 5L18 6"/><path d="M9 17l1 1L22 6"/></svg>';
  }
  var urlCache = {};
  function mediaUrl(m) {
    if (urlCache[m.id]) return urlCache[m.id];
    var mb = NB.media(m); if (!mb) return '';
    return (urlCache[m.id] = URL.createObjectURL(mb));
  }
  /* 🎞️ رسمة متحركة: الشريط داخل إطار، ونحرّكه لقطة لقطة */
  function animHTML(m, u, style, noView) {
    return '<div class="anim" style="' + style + ';aspect-ratio:' + m.w + '/' + m.h + '"' + (noView ? '' : ' data-view="' + m.id + '"') + ' role="img" aria-label="رسمة متحركة"><img src="' + u + '" alt="" style="width:' + (m.fr * 100) + '%;animation-duration:' + (m.fr * .4).toFixed(2) + 's;animation-timing-function:steps(' + m.fr + ')"></div>';
  }
  function msgHTML(m) {
    var mine = m.s === S.me, group = m.chat === 'g';
    var body = '';
    if (m.k === 'text' && m.lv) body = '<div class="bub lvinv"><span style="font-size:30px">👥🎨</span><b>' + esc(m.text || '') + '</b>' + (Date.now() - m.t < 3 * 36e5 ? '<button class="cmb" data-lv="' + esc(m.lv) + '" data-lvc="' + esc(m.chat) + '">' + (mine ? 'ارجع للرسم' : 'انضم للرسم') + '</button>' : '<small>انتهت الجلسة</small>') + '</div>';
    else if (m.k === 'text') { var en = emojiOnly(m.text); body = en ? '<div class="bub emo" style="font-size:' + (en <= 3 ? 52 : en <= 6 ? 40 : 32) + 'px">' + esc(m.text.trim()) + '</div>' : '<div class="bub">' + esc(m.text || '') + '</div>'; }
    else if (m.k === 'sticker') { var su = mediaUrl(m); body = '<div class="stkmsg">' + (su ? '<img src="' + su + '" data-view="' + m.id + '" alt="ملصق">' : '') + '</div>'; }
    else if (m.k === 'photo' || m.k === 'draw') {
      var u = mediaUrl(m);
      var bw = m.w ? Math.round(Math.min(240, 240 * Math.min(1, (m.w / m.h) / 0.75))) : 0;
      if (u && m.fr > 1) body = '<div class="bub media">' + animHTML(m, u, 'width:' + (bw || 240) + 'px;max-width:62vw') + '</div>';
      else body = '<div class="bub media">' + (u ? '<img src="' + u + '" data-view="' + m.id + '" alt="' + (m.k === 'draw' ? 'رسمة' : 'صورة') + '" style="' + (m.w ? 'width:' + bw + 'px;max-width:62vw;height:auto;max-height:none;aspect-ratio:' + m.w + '/' + m.h : '') + '">' : '<span class="small muted" style="padding:20px;display:block">جاري التحميل…</span>') + '</div>';
      // 🤝 رسمة مشتركة: مين رسم فيها + زر «كمّلها»
      if (m.k === 'draw' && m.cm && m.cm.length && u) body += '<div class="cmrow">' + m.cm.slice(-5).map(function (id) { return av(id, 22); }).join('') + '<span>' + (m.cm.length > 1 ? '🤝 رسمة مشتركة' : '🤝 تنتظر أحد يكمّلها') + '</span>' + (mine ? '' : '<button class="cmb" data-cm="' + m.id + '">🖍️ كمّلها</button>') + '</div>';
    } else if (m.k === 'voice') {
      var wf = m.wf || [], played = (m.st || {});
      body = '<div class="bub">' + (m.bed ? '<div class="bedtag">🌙 رسالة النوم' + (mine ? '' : ' من ' + esc(nm(m.s))) + '</div>' : '') + '<div class="voice" data-voice="' + m.id + '"><button class="pl" aria-label="تشغيل الرسالة الصوتية" style="color:' + (mine ? 'var(--accent)' : '#fff') + '">' + PLAY + '</button>' +
        '<span class="wave">' + (wf.length ? wf : new Array(28).fill(.4)).map(function (v) { return '<i style="height:' + Math.max(4, Math.round(v * 28)) + 'px"></i>'; }).join('') + '</span><span class="dur">' + fmtDur(m.dur || 0) + '</span></div></div>';
    }
    var sched = m.sched && m.out;
    var meta = '<span class="meta">' + (sched ? '⏰ تنرسل ' + fmtDay(m.sched) + ' ' + fmtTime(m.sched) : fmtTime(m.t) + (mine ? ' ' + tickSvg(m, group) + voiceNote(m) : '')) + '</span>';
    var re = m.re ? Object.keys(m.re) : [];
    if (re.length) {
      var cnt = {}; re.forEach(function (k) { cnt[m.re[k]] = (cnt[m.re[k]] || 0) + 1; });
      var cmi = body.indexOf('<div class="cmrow">'), tail = cmi >= 0 ? body.slice(cmi) : ''; if (cmi >= 0) body = body.slice(0, cmi);
      body = body.slice(0, -6) + '<span class="reacts" title="' + esc(re.map(function (k) { return nm(k) + ' ' + m.re[k]; }).join('، ')) + '">' + Object.keys(cnt).map(function (e) { return e + (cnt[e] > 1 ? '<i>' + num(cnt[e]) + '</i>' : ''); }).join('') + '</span></div>' + tail;
    }
    return '<div class="m' + (mine ? ' me' : '') + (sched ? ' sched' : '') + '" data-id="' + m.id + '"' + (mine ? '' : ' style="--sc:' + colorOf(m.s) + '"') + '>' + (!mine && group ? av(m.s, 32) : '') +
      '<div class="col" style="gap:0;align-items:' + (mine ? 'flex-end' : 'flex-start') + ';min-width:0">' + (!mine && group ? '<span class="who2" style="color:' + colorOf(m.s) + '">' + esc(nm(m.s)) + '</span>' : '') + (m.cap ? '<span class="cap">' + esc(m.cap) + '</span>' : '') + body + meta + '</div></div>';
  }
  /* رسالة كلها إيموجي (بدون كتابة) ← عددها، وإلا 0 */
  var EMO_RE = null;
  try { EMO_RE = new RegExp('^(?:\\p{Extended_Pictographic}|\\p{Emoji_Component}|\\p{Emoji_Modifier}|\\u200d|\\ufe0f|\\s)+$', 'u'); } catch (e) {}
  function emojiOnly(t) {
    t = (t || '').trim();
    if (!t || !EMO_RE || !EMO_RE.test(t) || /^[\d\s#*]+$/.test(t)) return 0;
    var n = 0;
    try { var sg = new Intl.Segmenter('ar', { granularity: 'grapheme' }); for (var x of sg.segment(t.replace(/\s+/g, ''))) n++; } catch (e) { n = Array.from(t.replace(/\s+/g, '')).length; }
    return n <= 12 ? n : 0;
  }
  function voiceNote(m) {
    if (m.k !== 'voice' || m.out) return '';
    var rec = chatMembers(m.chat).filter(function (x) { return x !== m.s; }), st = m.st || {};
    if (rec.length && rec.every(function (x) { return st[x] >= 3; })) return ' · انسمعت';
    if (rec.some(function (x) { return st[x] >= 1; })) return ' · وصلت' + (rec.some(function (x) { return st[x] >= 3; }) ? '' : '، ما انسمعت');
    return '';
  }
  function fmtDur(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function bindMsgs(box, ms) {
    var byId = {}; ms.forEach(function (m) { byId[m.id] = m; });
    box.querySelectorAll('[data-lv]').forEach(function (b) {
      b.onclick = function () { S.chat = b.dataset.lvc; drawScreen({ live: b.dataset.lv }); };
    });
    box.querySelectorAll('[data-cm]').forEach(function (b) {
      b.onclick = function () { var m = byId[b.dataset.cm]; if (m) completeDraw(m); };
    });
    box.querySelectorAll('[data-view]').forEach(function (img) {
      img.onclick = function () { var m = byId[img.dataset.view]; if (m) viewMedia(m, img.src); };
    });
    box.querySelectorAll('[data-voice]').forEach(function (el) { $('.pl', el).onclick = function () { playVoice(byId[el.dataset.voice], el); }; });
    var nc = $('#nstop', box); if (nc) nc.onclick = function () { stopNudge(nc.dataset.id); };
    // ضغطة مطوّلة على الرسالة: تفاعل ❤️ ⭐ … (أو إلغاء المجدولة)
    box.querySelectorAll('.m[data-id]').forEach(function (row) {
      var t = null, sx = 0, sy = 0, fired = false;
      var target = row.querySelector('.bub,.stkmsg') || row;
      target.addEventListener('pointerdown', function (e) { fired = false; sx = e.clientX; sy = e.clientY; t = setTimeout(function () { fired = true; msgMenu(byId[row.dataset.id], target); }, 450); });
      target.addEventListener('pointermove', function (e) { if (t && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) { clearTimeout(t); t = null; } });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { target.addEventListener(ev, function () { clearTimeout(t); t = null; }); });
      target.addEventListener('click', function (e) { if (fired) { e.stopPropagation(); e.preventDefault(); fired = false; } }, true);
      if (row.classList.contains('sched')) target.addEventListener('click', function () { msgMenu(byId[row.dataset.id], target); });
    });
  }
  var REACTS = ['❤️', '😂', '👍', '😮', '😢', '⭐', '🙏'];
  function msgMenu(m, anchor) {
    if (!m) return;
    if (navigator.vibrate) navigator.vibrate(20);
    if (m.sched && m.out) {
      var sh = sheet('<div class="col center" style="gap:8px;text-align:center"><span style="font-size:44px">⏰</span><h2 style="font-size:22px">رسالة مجدولة</h2><p class="muted" style="margin:0">تنرسل ' + fmtDay(m.sched) + ' الساعة ' + fmtTime(m.sched) + '</p></div>' +
        '<button class="btn block" id="sc" style="background:var(--danger)">إلغاء الرسالة</button><button class="btn line block" id="sk">خلّها</button>');
      $('#sk', sh).onclick = function () { sh.remove(); };
      $('#sc', sh).onclick = function () { sh.remove(); api('/sched/cancel', { id: m.id }).then(function () { return NB.msgs.del(m.id); }).then(function () { toast('انلغت ✓'); renderMsgs(); }).catch(netErr); };
      return;
    }
    if (m.out) return;
    var old = document.querySelector('.reactbar'); if (old) old.remove();
    var mine = (m.re || {})[S.me];
    var bar = document.createElement('div'); bar.className = 'reactbar';
    bar.innerHTML = REACTS.map(function (e) { return '<button data-r="' + e + '"' + (mine === e ? ' class="on"' : '') + '>' + e + '</button>'; }).join('');
    document.body.appendChild(bar);
    var r = anchor.getBoundingClientRect(), bw = bar.offsetWidth;
    bar.style.top = Math.max(8, r.top - 62) + 'px';
    bar.style.left = Math.min(window.innerWidth - bw - 8, Math.max(8, r.left + r.width / 2 - bw / 2)) + 'px';
    var close = function () { bar.remove(); document.removeEventListener('pointerdown', outside, true); };
    var outside = function (e) { if (!bar.contains(e.target)) close(); };
    setTimeout(function () { document.addEventListener('pointerdown', outside, true); }, 50);
    bar.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { close(); sendReact(m, b.dataset.r === mine ? '' : b.dataset.r); }; });
  }
  function sendReact(m, e) {
    m.re = m.re || {}; var prev = m.re[S.me];
    if (e) m.re[S.me] = e; else delete m.re[S.me];
    NB.msgs.put(m).then(function () { renderMsgs(); });
    var id = rid(12);
    NB.enc(pack({ re: m.id, e: e }, null)).then(function (b) {
      return api('/send?member=' + encodeURIComponent(S.me) + '&chat=' + encodeURIComponent(m.chat) + '&id=' + id + '&kind=react', null, { raw: b });
    }).then(function () {
      return NB.msgs.put({ id: id, chat: m.chat, s: S.me, k: 'react', t: Date.now(), re: m.id, e: e, st: {}, r: [S.me] });
    }).catch(function () { if (prev) m.re[S.me] = prev; else delete m.re[S.me]; NB.msgs.put(m).then(function () { renderMsgs(); }); toast('ما وصل التفاعل، جرّب مرة ثانية'); });
  }

  /* ----- قراءة وتأكيد ----- */
  function markRead(ms) {
    if (document.visibilityState !== 'visible') return;
    var items = [];
    ms.forEach(function (m) {
      if (m.s === S.me || (m.r || []).indexOf(S.me) >= 0) return;
      m.r = (m.r || []).concat([S.me]); items.push({ id: m.id, chat: m.chat, s: m.s });
      NB.msgs.put(m);
    });
    if (items.length) {
      api('/rcpt', { member: S.me, s: 2, items: items }).catch(function () {});
      NB.kv.get('badge').then(function (n) { setBadge((n || 0) - items.length); });
    }
    if (ms.length) { closeChatNotifs(ms[0].chat); closeReadNotifs(); }
  }
  /* رقم الأيقونة + نشيل إشعارات المحادثة اللي انقرت (أندرويد يعدّ الإشعارات الموجودة) */
  function setBadge(n) { NB.badge(n); }
  function closeChatNotifs(chat) {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      return Promise.all([reg.getNotifications({ tag: 'chat-' + chat }), reg.getNotifications({ tag: 'react-' + chat })]);
    }).then(function (ls) { ls[0].concat(ls[1]).forEach(function (x) { x.close(); }); }).catch(function () {});
  }
  function closeReadNotifs() {
    if (!('serviceWorker' in navigator) || !S.me) return;
    navigator.serviceWorker.ready.then(function (reg) { return reg.getNotifications(); }).then(function (l) {
      l.forEach(function (x) {
        var d = x.data || {};
        // الإشعار العام ("عندك جديد") وإشعار "وقّف النبضة" والتذكير: ما لها داعي بعد ما انفتح التطبيق
        if (!d.t || d.t === 'ns' || x.tag === 'nabd') { x.close(); return; }
        if (d.t !== 'm') return;
        NB.msgs.chat(d.chat).then(function (ms) {
          var left = ms.some(function (m) { return S.dev.members.indexOf(m.s) < 0 && !(m.r || []).some(function (r) { return S.dev.members.indexOf(r) >= 0; }); });
          if (!left) x.close();
        });
      });
    }).catch(function () {});
  }

  /* ----- الصوت ----- */
  /* تشغيل الرسائل الصوتية بعنصر <audio> العادي (الأثبت على الآيفون ولا يلخبط إذن الميكروفون).
     ما نلمس navigator.audioSession أبداً، ونوقف الصوت وننظف مشغّل شاشة القفل إذا طلع من المحادثة أو راح التطبيق للخلفية */
  var audio = null, audioEl = null, audioTimer = null, audioUrl = null;
  function clearNowPlaying(a) {
    try { a.onended = a.onerror = a.onpause = null; a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {}
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none';
        ['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack', 'stop'].forEach(function (k) { try { navigator.mediaSession.setActionHandler(k, null); } catch (e) {} });
      }
    } catch (e) {}
  }
  function stopAudio() {
    if (audio) { clearNowPlaying(audio); try { audio.remove(); } catch (e) {} audio = null; }
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    if (audioTimer) clearInterval(audioTimer); audioTimer = null;
    if (audioEl) { $('.pl', audioEl).innerHTML = PLAY; audioEl.querySelectorAll('.wave i').forEach(function (i) { i.classList.remove('on'); }); var dd = $('.dur', audioEl); if (dd && audioEl.dataset.d) dd.textContent = audioEl.dataset.d; audioEl = null; }
  }
  // ننهي أي صوت إذا طلع من المحادثة أو راح التطبيق للخلفية
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') stopAudio(); });
  window.addEventListener('pagehide', stopAudio);
  function playVoice(m, el) {
    if (!m || !NB.media(m)) return;
    if (audioEl === el) { stopAudio(); return; }
    stopAudio();
    audioEl = el; el.dataset.d = $('.dur', el).textContent;
    $('.pl', el).innerHTML = PAUSE;
    var bars = el.querySelectorAll('.wave i');
    var tick = function (cur, d) {
      var k = Math.floor(cur / (d || 1) * bars.length);
      bars.forEach(function (b, i) { b.classList.toggle('on', i <= k); });
      $('.dur', el).textContent = fmtDur(cur);
    };
    var a = new Audio(); audio = a;
    a.setAttribute('playsinline', ''); a.preload = 'auto';
    audioUrl = URL.createObjectURL(NB.media(m)); a.src = audioUrl;
    a.onended = function () { if (audio === a) stopAudio(); };
    a.onerror = function () { if (audio === a) { stopAudio(); toast('ما قدرنا نشغّل الرسالة على هذا الجهاز'); } };
    a.play().catch(function () {
      // أحياناً يرفض أول مرة وهو يحمّل — نحاول مرة ثانية بعد ما يجهز
      if (audio !== a) return;
      a.oncanplay = function () { a.oncanplay = null; if (audio === a) a.play().catch(function () { if (audio === a) stopAudio(); }); };
      try { a.load(); } catch (e) {}
    });
    audioTimer = setInterval(function () { if (audio === a) tick(a.currentTime, a.duration && isFinite(a.duration) ? a.duration : (m.dur || 1)); }, 120);
    if (m.s !== S.me && !(m.heard || []).some(function (x) { return x === S.me; })) {
      m.heard = (m.heard || []).concat([S.me]); NB.msgs.put(m);
      api('/rcpt', { member: S.me, s: 3, items: [{ id: m.id, chat: m.chat, s: m.s }] }).catch(function () {});
    }
  }

  /* ----- الكتابة والإرسال ----- */
  function composer() {
    var c = $('#comp'); if (!c) return;
    var canSched = isParent(S.me);
    var QR = isParent(S.me) ? ['❤️', 'شاطر 👏', 'أحبك 💕', 'تعال 🏃', 'الأكل جاهز 🍽️', 'نام بدري 🌙', 'أنا جاي 🚗', 'شكراً 🙏'] : ['❤️', '😂', 'تم 👍', 'أحبك 💕', 'جاي 🏃', 'وينك؟', 'اشتقت لك 🥺', 'تصبح على خير 🌙'];
    c.innerHTML = '<div class="qr" id="qr">' + QR.map(function (q) { return '<button data-qr="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
      '<div class="tools"><button class="dr" id="drB">' + ic('pen') + ' رسم</button><button class="ph" id="phB">' + ic('cam') + ' صورة</button>' +
      (canSched ? (S.chat !== 'g' && !isParent(otherOf(S.chat)) ? '<button class="bd" id="bdB">🌙 رسالة النوم</button>' : '') : '<button class="em" id="emB">😊 إيموجي</button>') + '</div>' +
      '<div class="spell" id="spell" hidden></div>' +
      '<div class="sendrow"><label class="sr" for="txt">اكتب رسالة</label><textarea class="txt" id="txt" rows="1" placeholder="اكتب هنا…" maxlength="4000"></textarea>' +
      (canSched ? '<button class="icb flat" id="schB" aria-label="جدولة الرسالة" hidden style="font-size:22px">⏰</button>' : '') +
      '<button class="mic" id="mic" aria-label="سجّل رسالة صوتية">' + ic('mic') + '</button></div><input type="file" id="pf" accept="image/*" hidden>';
    var t = $('#txt'), mic = $('#mic');
    var sync = function () {
      t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight) + 'px';
      var has = t.value.trim().length > 0;
      mic.innerHTML = has ? ic('send', 'style="transform:scaleX(-1)"') : ic('mic');
      mic.setAttribute('aria-label', has ? 'إرسال' : 'سجّل رسالة صوتية');
      var sb = $('#schB'); if (sb) sb.hidden = !has;
      var qr = $('#qr'); if (qr) qr.hidden = has;
    };
    t.oninput = function () { sync(); if (!canSched) spellCheck(t); };
    t.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey && plat() === 'desktop') { e.preventDefault(); mic.click(); } };
    mic.onclick = function () {
      var v = t.value.trim();
      if (v) { t.value = ''; sync(); sendMsg('text', { text: v }); if (plat() === 'desktop') t.focus(); else { t.blur(); setTimeout(function () { var b = $('#msgs'); if (b) b.scrollTop = b.scrollHeight; }, 350); } }
      else startRec();
    };
    c.querySelectorAll('[data-qr]').forEach(function (b) { b.onclick = function () { if (navigator.vibrate) navigator.vibrate(15); sendMsg('text', { text: b.dataset.qr }); }; });
    $('#drB').onclick = drawScreen;
    var sb = $('#schB'); if (sb) sb.onclick = function () { var v = t.value.trim(); if (v) schedSheet(function (at) { t.value = ''; sync(); sendMsg('text', { text: v, at: at }); toast('⏰ تنرسل ' + fmtDay(at) + ' ' + fmtTime(at), 3000); }); };
    $('#phB').onclick = pickPhoto;
    if ($('#bdB')) $('#bdB').onclick = bedSheet;
    if ($('#emB')) $('#emB').onclick = function () { emojiSheet(t, sync); };
    $('#pf').onchange = function () { var f = this.files[0]; this.value = ''; if (f) photoPreview(f); };
  }
  function busy() { return S.view === 'draw' || !!rec || ($('#txt') && $('#txt').value.trim()); }

  /* ----- جدولة رسالة (للأب والأم) ----- */
  function schedSheet(done) {
    var at = function (dayAdd, h, mi) { var d = new Date(); d.setDate(d.getDate() + dayAdd); d.setHours(h, mi, 0, 0); return d.getTime(); };
    var now = Date.now(), opts = [['بعد ساعة', now + 36e5]];
    var tonight = at(0, 21, 0); if (tonight > now + 6e5) opts.push(['الليلة ٩ مساءً', tonight]);
    opts.push(['بكرة الصبح ٦:٣٠', at(1, 6, 30)], ['بكرة ٧ الصبح', at(1, 7, 0)], ['بكرة الظهر ١٢', at(1, 12, 0)]);
    var pad = function (n) { return ('0' + n).slice(-2); }, d0 = new Date(now + 36e5);
    var def = d0.getFullYear() + '-' + pad(d0.getMonth() + 1) + '-' + pad(d0.getDate()) + 'T' + pad(d0.getHours()) + ':' + pad(d0.getMinutes());
    var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">⏰ متى تنرسل؟</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      '<p class="small muted" style="margin:0">مفيدة إذا كنت مسافر أو مشغول: الرسالة توصلهم بوقتها حتى لو جوالك مقفل.</p>' +
      '<div class="col" style="gap:8px">' + opts.map(function (o, i) { return '<button class="btn line block" data-o="' + i + '" style="justify-content:space-between"><span>' + o[0] + '</span><span class="small muted">' + fmtDay(o[1]) + ' ' + fmtTime(o[1]) + '</span></button>'; }).join('') + '</div>' +
      '<label class="field"><span>وقت ثاني</span><input class="inp" type="datetime-local" id="dt" value="' + def + '" style="direction:ltr"></label><button class="btn block" id="go">جدول الرسالة</button>');
    $('#x', sh).onclick = function () { sh.remove(); };
    sh.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { sh.remove(); done(opts[+b.dataset.o][1]); }; });
    $('#go', sh).onclick = function () { var v = new Date($('#dt', sh).value).getTime(); if (!v || v < Date.now() + 60e3) return toast('اختر وقت بعد دقيقة على الأقل'); sh.remove(); done(v); };
  }

  /* ----- ملصقات العائلة: شخصية كل فرد مع عبارة ----- */
  /* ----- ألبوم العائلة: كل الصور والرسومات ----- */
  function album() {
    S.view = 'album';
    var el = show('<div class="row"><span class="fd grow" style="font-size:26px;font-weight:800">🖼️ ألبوم العائلة</span></div>' +
      '<div class="chips" id="af" style="display:flex;gap:8px"><button class="chip on" data-f="all">الكل</button><button class="chip" data-f="photo">صور</button><button class="chip" data-f="draw">رسومات</button></div><div id="ag" class="col" style="gap:14px"></div>' + tabBar('album'), 'v2');
    var urls = [], f = 'all';
    function paint() {
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
      Promise.all(chatsFor(S.me).map(function (c) { return NB.msgs.chat(c); })).then(function (ls) {
        if (S.view !== 'album') return;
        var all = [].concat.apply([], ls).filter(function (m) { return (m.k === 'photo' || m.k === 'draw' || m.k === 'sticker') && NB.media(m) && (f === 'all' || m.k === f); }).sort(function (a, b) { return b.t - a.t; });
        var box = $('#ag'); if (!box) return;
        if (!all.length) { box.innerHTML = '<div class="col center muted" style="gap:6px;padding:60px 0"><span style="font-size:48px">🖼️</span><span>لسى ما فيه صور هنا</span></div>'; return; }
        var html = '', last = '';
        all.forEach(function (m, i) {
          var mo = new Date(m.t).toLocaleDateString(LOC, { month: 'long', year: 'numeric' });
          if (mo !== last) { html += (last ? '</div>' : '') + '<b class="small muted">' + mo + '</b><div class="agrid">'; last = mo; }
          var u = URL.createObjectURL(NB.media(m)); urls.push(u);
          html += '<button data-i="' + i + '" class="' + (m.k === 'sticker' ? 'stkc' : '') + '"><img src="' + u + '" alt="" loading="lazy"' + (m.fr > 1 ? ' style="object-position:0 50%"' : '') + '><span>' + av(m.s, 22) + '</span></button>';
        });
        box.innerHTML = html + '</div>';
        box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { viewMedia(all[+b.dataset.i], b.querySelector('img').src); }; });
      });
    }
    el.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { f = b.dataset.f; el.querySelectorAll('[data-f]').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }; });
    paint();
  }
  /* كمّل رسمة: تفتح الرسمة كورقة، واللي يرسله يصير ردّ عليها — والرسمة المشتركة تكمل سلسلتها */
  function completeDraw(m, src) {
    var u = src || mediaUrl(m); if (!u) return;
    var im = new Image(); im.onload = function () { S.chat = m.chat; drawScreen({ base: im, rp: m.id, cap: '🖍️ ' + (fem(S.me) ? 'كمّلت' : 'كمّل') + ' رسمة ' + nm(m.s), cmw: m.cm ? m.cm.slice() : [m.s] }); }; im.src = u;
  }
  function viewMedia(m, src) {
    var v = document.createElement('div'); v.className = 'viewer';
    var canDraw = m.k === 'draw' && chatsFor(S.me).indexOf(m.chat) >= 0;
    v.innerHTML = (m.fr > 1 ? animHTML(m, src, 'width:min(92vw,520px)', true) : '<img src="' + src + '" alt="">') + '<div class="vbar" style="flex-direction:column;align-items:stretch"><span class="small" style="color:#fff">' + esc(nm(m.s)) + ' · ' + fmtDay(m.t) + ' ' + fmtTime(m.t) + '</span><div class="vbtns">' +
      (canDraw && !(m.fr > 1) ? '<button class="btn sm" id="vd">🖍️ كمّل الرسمة</button>' : '') + '<button class="btn sm" id="vs">حفظ</button></div></div>';
    v.onclick = function (e) { if (!e.target.closest('button')) v.remove(); };
    if ($('#vd', v)) $('#vd', v).onclick = function () {
      v.remove(); completeDraw(m, src);
    };
    document.body.appendChild(v);
    $('#vs', v).onclick = function () {
      var ext = (m.mime || 'image/jpeg').split('/')[1].replace('jpeg', 'jpg'), file = new File([NB.media(m)], 'nabd-' + m.id + '.' + ext, { type: m.mime || 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && plat() !== 'desktop') navigator.share({ files: [file] }).catch(function () {});
      else { var a = document.createElement('a'); a.href = src; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); }
    };
  }

  /* صيغة الرسالة: [طول الرأس ٤ بايت][رأس JSON][البيانات] ← تشفير */
  function pack(head, bytes) {
    var h = NB.te.encode(JSON.stringify(head)), out = new Uint8Array(4 + h.length + (bytes ? bytes.length : 0));
    new DataView(out.buffer).setUint32(0, h.length); out.set(h, 4); if (bytes) out.set(bytes, 4 + h.length);
    return out;
  }
  var XTRA = ['ch', 'rp', 'cap', 'bed', 'cm', 'fr', 'lv'];
  function sendMsg(kind, o, blob) {
    var m = { id: rid(12), chat: S.chat, s: S.me, k: kind, t: o.at || Date.now(), st: {}, r: [S.me], out: 1 };
    if (o.at) m.sched = o.at;
    var head = {};
    if (kind === 'text') { m.text = o.text; head.text = o.text; }
    else { m.mime = blob.type; ['dur', 'wf', 'w', 'h'].forEach(function (k) { if (o[k] != null) m[k] = o[k]; }); }
    XTRA.forEach(function (k) { if (o[k] != null) m[k] = o[k]; });
    return (blob ? blob.arrayBuffer().then(function (b) { m.buf = b; }) : Promise.resolve()).then(function () { return NB.msgs.put(m); }).then(function () { renderMsgs(true); return upload(m); });
  }
  function upload(m) {
    var mb = NB.media(m), bytesP = mb ? mb.arrayBuffer().then(function (b) { return new Uint8Array(b); }) : Promise.resolve(null);
    var head = m.k === 'text' || m.k === 'ev' ? { text: m.text } : { mime: m.mime, dur: m.dur, wf: m.wf, w: m.w, h: m.h };
    XTRA.forEach(function (k) { if (m[k] != null) head[k] = m[k]; });
    return bytesP.then(function (bytes) {
      return Promise.all([NB.enc(pack(head, bytes)), m.k === 'text' ? NB.encJSON({ x: m.text.slice(0, 80) }) : m.k === 'ev' && m.nt ? NB.encJSON({ x: m.nt.slice(0, 120) }) : Promise.resolve('')]);
    }).then(function (r) {
      if (r[0].length > 1950000) throw { error: 'toolarge' };
      var q = '?member=' + encodeURIComponent(m.s) + '&chat=' + encodeURIComponent(m.chat) + '&id=' + m.id + '&kind=' + m.k + (r[1] ? '&prev=' + r[1] : '') + (m.sched ? '&at=' + m.sched : '') + (m.k === 'ev' && m.to && m.to.length ? '&to=' + m.to.join(',') : '');
      return api('/send' + q, null, { raw: r[0] });
    }).then(function (j) {
      // المجدولة: تبقى "⏰" عندنا لين يجي وقتها
      if (j && j.sched) { m.out = 2; return NB.msgs.put(m); }
      delete m.out; delete m.err; delete m.sched; return NB.msgs.put(m);
    }).then(function () { if (S.view === 'chat') renderMsgs(); else refreshView(); })
      .catch(function (e) {
        if (e && (e.error === 'toolarge' || e.status === 413)) { NB.msgs.del(m.id); toast('الملف كبير، جرّب أقصر أو أصغر'); renderMsgs(); }
        else if (e && e.status === 403) { NB.msgs.del(m.id); toast('ما تقدر ترسل في هذي المحادثة'); renderMsgs(); }
      });
  }
  function retryOutbox() {
    return NB.msgs.all().then(function (all) {
      // المجدولة اللي جا وقتها تصير رسالة عادية؛ واللي لسى ما انرسلت للسيرفر (out=1) نعيد إرسالها
      all.filter(function (m) { return m.out === 2 && m.sched <= Date.now(); }).forEach(function (m) { delete m.out; delete m.sched; NB.msgs.put(m); });
      var out = all.filter(function (m) { return m.out === 1 || m.out === true; });
      return out.reduce(function (p, m) { return p.then(function () { return upload(m); }); }, Promise.resolve());
    });
  }

  /* الميكروفون: أندرويد يسأل كل مرة إذا اختاروا "هذه المرة فقط" — ننبّههم يختارون "أثناء استخدام التطبيق" */
  function micTip() {
    var seen = 0; try { seen = +localStorage.getItem('nabd-mic') || 0; } catch (e) {}
    try { localStorage.setItem('nabd-mic', seen + 1); } catch (e) {}
    if (!seen || !navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: 'microphone' }).then(function (p) {
      if (p.state !== 'prompt') return;
      toast(plat() === 'ios' ? 'آيفون يسأل عن الميكروفون مرة كل ما ينفتح نَبْض من جديد — اضغط "سماح"' : 'اختر "أثناء استخدام التطبيق" عشان ما يسألك كل مرة 🎤', 5000);
    }).catch(function () {});
  }
  /* ----- تسجيل الصوت ----- */
  var rec = null;
  function startRec(opt) {
    opt = opt && !opt.target ? opt : {};
    if (rec) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast('التسجيل غير مدعوم على هذا الجهاز');
    // نشغّل محلّل الصوت هنا (داخل ضغطة الزر) عشان الآيفون ما يبدأه موقوف
    var ac = null;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (e) { ac = null; }
    micTip();
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (stream) {
      var types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
      var type = ''; for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported(types[i])) { type = types[i]; break; }
      var mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 });
      var chunks = [], peaks = [], t0 = Date.now(), an, buf, fx = 'none';
      try { if (ac.resume) ac.resume(); an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an); buf = new Uint8Array(an.fftSize); } catch (e) {}
      rec = { mr: mr, stream: stream, cancel: false };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (tr) { tr.stop(); });
        clearInterval(rec.tick); clearInterval(rec.samp);
        var cancel = rec.cancel, dur = (Date.now() - t0) / 1000; rec = null; composer();
        if (cancel || dur < 0.7) { try { ac && ac.close(); } catch (e) {} return; }
        var blob = new Blob(chunks, { type: (mr.mimeType || type || 'audio/webm').split(';')[0] });
        // مؤثر صوتي (سنجاب/عملاق/روبوت) ← ملف جديد
        (fx !== 'none' ? voiceFx(blob, ac, fx).then(function (b2) { if (b2) blob = b2; else toast('ما قدرنا نطبّق المؤثر، انرسل بصوتك العادي'); }) : Promise.resolve()).then(function () {
        // شكل الموجة من التسجيل نفسه (أدق)، ونتأكد إن فيه صوت فعلاً
        return analyze(blob, ac); }).then(function (r) {
          try { ac && ac.close(); } catch (e) {}
          var wf = r ? r.wf : shrink(peaks, 32);
          var send = function () {
            sendMsg('voice', { dur: Math.round(r && r.dur ? r.dur : dur), wf: wf, bed: opt.bed ? 1 : null, at: opt.bed || null }, blob);
            if (opt.bed) toast('🌙 توصل ' + fmtDay(opt.bed) + ' الساعة ' + fmtTime(opt.bed), 3500);
          };
          if (r && r.silent) silentSheet(send); else send();
        });
      };
      mr.start(250);
      var c = $('#comp');
      c.innerHTML = '<div class="fxrow"><span class="fxl">🎭 غيّر صوتك:</span>' + FX.map(function (f) { return '<button data-fx="' + f[0] + '"' + (f[0] === fx ? ' class="on"' : '') + '>' + f[1] + '</button>'; }).join('') + '</div><div class="recbar"><button class="icb flat" id="rx" aria-label="إلغاء التسجيل" style="color:var(--danger)">' + ic('trash') + '</button>' +
        '<span class="recdot"></span><span class="fd" id="rt" style="font-size:22px;font-weight:700;font-variant-numeric:tabular-nums">0:00</span><span class="grow small muted">' + (opt.bed ? '🌙 رسالة النوم · ' + fmtTime(opt.bed) : isParent(S.me) ? 'يسجّل…' : 'تكلّم الحين…') + '</span>' +
        '<button class="mic" id="rs" aria-label="إرسال التسجيل">' + ic('send', 'style="transform:scaleX(-1)"') + '</button></div>';
      c.querySelectorAll('[data-fx]').forEach(function (b) { b.onclick = function () { fx = b.dataset.fx; c.querySelectorAll('[data-fx]').forEach(function (x) { x.classList.toggle('on', x === b); }); if (fx !== 'none' && (Date.now() - t0) / 1000 > 45) toast('المؤثر يشتغل على أول ٤٥ ثانية'); }; });
      $('#rx').onclick = function () { rec.cancel = true; mr.stop(); };
      $('#rs').onclick = function () { mr.stop(); };
      rec.tick = setInterval(function () { var s = (Date.now() - t0) / 1000; var el = $('#rt'); if (el) el.textContent = fmtDur(s); if (s >= 120) mr.stop(); }, 250);
      rec.samp = setInterval(function () {
        if (!an) return; an.getByteTimeDomainData(buf); var mx = 0;
        for (var i = 0; i < buf.length; i++) mx = Math.max(mx, Math.abs(buf[i] - 128));
        peaks.push(Math.min(1, mx / 64));
      }, 100);
    }).catch(function () { toast('اسمح لنَبْض باستخدام الميكروفون من إعدادات المتصفح', 4000); });
  }
  var FX = [['none', '🙂 عادي'], ['chip', '🐿️ سنجاب'], ['giant', '🐻 عملاق'], ['robot', '🤖 روبوت']];
  /* المؤثرات: نعيد تشغيل الصوت بسرعة/طبقة مختلفة (أو تموّج روبوت) ونحفظه WAV صغير */
  function voiceFx(blob, ac, fx) {
    return blob.arrayBuffer().then(function (ab) {
      return new Promise(function (res, rej) { var ctx = ac || new (window.AudioContext || window.webkitAudioContext)(); var p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
    }).then(function (src) {
      var rate = fx === 'chip' ? 1.55 : fx === 'giant' ? 0.7 : 1, SR = 16000;
      var secs = Math.min(src.duration, 45), len = Math.ceil(secs / rate * SR);
      var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, oc = new OC(1, len, SR);
      var n = oc.createBufferSource(); n.buffer = src; n.playbackRate.value = rate;
      var out = oc.destination;
      if (fx === 'robot') {
        var g = oc.createGain(); g.gain.value = 0; var osc = oc.createOscillator(); osc.frequency.value = 55; osc.type = 'square';
        var depth = oc.createGain(); depth.gain.value = 1; osc.connect(depth); depth.connect(g.gain); n.connect(g); g.connect(out); osc.start(0);
      } else n.connect(out);
      n.start(0, 0, secs);
      return new Promise(function (res) { var p = oc.startRendering(); if (p && p.then) p.then(res); else oc.oncomplete = function (e) { res(e.renderedBuffer); }; });
    }).then(function (buf) {
      var d = buf.getChannelData(0), mx = 0; for (var i = 0; i < d.length; i++) mx = Math.max(mx, Math.abs(d[i]));
      var k = mx > 0 ? Math.min(4, 0.95 / mx) : 1;   // نعلّي الصوت شوي
      var ab = new ArrayBuffer(44 + d.length * 2), v = new DataView(ab), w = function (o, t) { for (var j = 0; j < t.length; j++) v.setUint8(o + j, t.charCodeAt(j)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, d.length * 2, true);
      for (var x = 0; x < d.length; x++) v.setInt16(44 + x * 2, Math.max(-1, Math.min(1, d[x] * k)) * 32767, true);
      return new Blob([ab], { type: 'audio/wav' });
    }).catch(function () { return null; });
  }
  function analyze(blob, ac) {
    return blob.arrayBuffer().then(function (ab) {
      return new Promise(function (res, rej) {
        var ctx = ac || new (window.AudioContext || window.webkitAudioContext)();
        var p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej);
      });
    }).then(function (audio) {
      var d = audio.getChannelData(0), n = 32, step = Math.max(1, Math.floor(d.length / n)), out = [], mx = 0;
      for (var i = 0; i < n; i++) {
        var pk = 0, s = i * step, e = Math.min(d.length, s + step);
        for (var j = s; j < e; j += 16) { var v = Math.abs(d[j]); if (v > pk) pk = v; }
        out.push(pk); if (pk > mx) mx = pk;
      }
      return { silent: mx < 0.012, dur: audio.duration, wf: out.map(function (v) { return Math.round(Math.max(.15, v / (mx || 1)) * 100) / 100; }) };
    }).catch(function () { return null; });
  }
  function silentSheet(send) {
    var sh = sheet('<div class="col center" style="gap:10px;text-align:center"><span style="font-size:48px">🎤</span><h2 style="font-size:22px">التسجيل طلع بدون صوت</h2>' +
      '<p class="muted" style="margin:0;line-height:1.7">يمكن الميكروفون مقفل أو مستخدَم في تطبيق ثاني. تأكد إن زر الميكروفون في إعدادات الجهاز السريعة شغّال، وجرّب مرة ثانية.</p></div>' +
      '<button class="btn block" id="sr">سجّل من جديد</button><button class="btn line block" id="ss">أرسله كذا</button>');
    $('#sr', sh).onclick = function () { sh.remove(); startRec(); };
    $('#ss', sh).onclick = function () { sh.remove(); send(); };
  }
  function shrink(a, n) {
    if (!a.length) return [];
    var out = []; for (var i = 0; i < n; i++) { var s = Math.floor(i * a.length / n), e = Math.max(s + 1, Math.floor((i + 1) * a.length / n)), mx = 0; for (var j = s; j < e; j++) mx = Math.max(mx, a[j] || 0); out.push(mx); }
    var top = Math.max.apply(null, out) || 1;
    return out.map(function (v) { return Math.round(Math.max(.15, v / top) * 100) / 100; });
  }

  /* ----- الصور ----- */
  function pickPhoto() { var f = $('#pf'); if (f) f.click(); }
  function compress(file, maxSide, maxBytes) {
    return new Promise(function (res, rej) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(u);
        var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, maxSide / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        var q = .82;
        (function go() {
          c.toBlob(function (b) {
            if (!b) return rej();
            if (b.size > maxBytes && q > .45) { q -= .12; return go(); }
            if (b.size > maxBytes && c.width > 640) { var c2 = document.createElement('canvas'); c2.width = Math.round(c.width * .75); c2.height = Math.round(c.height * .75); c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height); c = c2; q = .75; return go(); }
            res({ blob: b, w: c.width, h: c.height });
          }, 'image/jpeg', q);
        })();
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(); };
      img.src = u;
    });
  }
  function photoPreview(file) {
    compress(file, 1600, 900000).then(function (r) {
      var u = URL.createObjectURL(r.blob);
      var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">إرسال صورة لـ' + esc(chatTitle(S.chat)) + '</h2></div>' +
        '<img src="' + u + '" alt="" style="width:100%;max-height:60vh;object-fit:contain;border-radius:18px;background:#fff">' +
        '<div class="row"><button class="btn line block" id="pc">إلغاء</button><button class="btn block" id="ps">' + ic('send', 'style="transform:scaleX(-1)"') + ' إرسال</button></div>');
      $('#pc', sh).onclick = function () { URL.revokeObjectURL(u); sh.remove(); };
      $('#ps', sh).onclick = function () { URL.revokeObjectURL(u); sh.remove(); sendMsg('photo', { w: r.w, h: r.h }, r.blob); };
    }).catch(function () { toast('ما قدرنا نفتح الصورة'); });
  }

  /* صورة الشخص (للملصقات والرسم): شخصية/حيوان/إيموجي/صورة ← صورة مربعة */
  var avImgCache = {};
  function avatarImage(id, px) {
    var m = member(id) || {}, a = m.av || {}, key = id + ':' + JSON.stringify(a) + ':' + px;
    if (avImgCache[key]) return avImgCache[key];
    return (avImgCache[key] = new Promise(function (res) {
      var c = document.createElement('canvas'); c.width = c.height = px; var x = c.getContext('2d');
      x.beginPath(); x.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2); x.closePath(); x.fillStyle = a.bg || colorOf(id); x.fill(); x.save(); x.clip();
      var done = function () { x.restore(); res(c); };
      var src = null;
      if (a.ch) src = CH.svg(a.ch, true);
      else if (a.a && AVATARS[a.a]) src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' + AVATARS[a.a].s + '</svg>';
      if (src || a.photo) {
        var im = new Image(); im.onload = function () { x.drawImage(im, 0, 0, px, px); done(); }; im.onerror = done;
        im.src = a.photo || 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
      } else {
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
        x.font = Math.round(px * (a.e ? .58 : .46)) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        x.fillText(a.e || (m.name || '؟').trim().charAt(0), px / 2, px / 2 + px * .04); done();
      }
    }));
  }

  /* الرسم صار في draw.js */
  function drawScreen(opt) { DR.screen(opt && !opt.target ? opt : {}); }

  /* ================= النبضة ================= */
  function sendNudge(to) {
    api('/nudge', { member: S.me, to: to }).then(function (r) {
      S.nudges[r.id] = { id: r.id, to: to, state: 'sent', n: 1, at: Date.now(), devs: r.devices };
      if (!r.devices) toast(nm(to) + ' ما عنده جهاز مربوط بعد', 3500);
      if (navigator.vibrate) navigator.vibrate(60);
      renderMsgs(true);
    }).catch(netErr);
  }
  function stopNudge(id) {
    api('/nudge/state', { id: id, state: 'stop' }).then(function () { if (S.nudges[id]) S.nudges[id].state = 'stopped'; renderMsgs(); }).catch(netErr);
  }
  function nudgeCardHTML() {
    var o = otherOf(S.chat); if (!o) return '';
    var list = Object.keys(S.nudges).map(function (k) { return S.nudges[k]; }).filter(function (n) { return n.to === o && Date.now() - n.at < 5 * 60e3; });
    var n = list[list.length - 1]; if (!n || n.state === 'stopped') return '';
    var done = n.state === 'seen', exp = n.state === 'expired';
    var f = fem(o);
    var st = done ? '✓ ' + (f ? 'شافتها' : 'شافها') + ' وفتح' + (f ? 'ت' : '') + ' نَبْض' : exp ? (f ? 'ما فتحت' : 'ما فتح') + ' بعد، جرّب مرة ثانية بعدين' : n.state === 'delivered' ? (f ? 'وصلت لجهازها' : 'وصلت لجهازه') + ' · بانتظار ما ' + (f ? 'تفتح' : 'يفتح') + '…' : 'نرسلها…';
    return '<div class="nudgecard"><div class="row"><span class="av" style="width:42px;height:42px;background:var(--orange)"><svg class="ic" viewBox="0 0 24 24" style="stroke:#fff">' + IC.pulse + '</svg></span>' +
      '<span class="grow col" style="gap:0"><b>أرسلت نبضة لـ' + esc(nm(o)) + '</b><span class="tiny">' + fmtTime(n.at) + (done || exp ? '' : ' · تتكرر كل دقيقة') + '</span></span></div>' +
      '<div class="prog">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n.n ? 'on' : '') + '"></i>'; }).join('') + '<span class="tiny" style="margin-inline-start:6px">' + num(Math.min(n.n, 3)) + ' من ٣</span></div>' +
      '<span class="small">' + st + '</span>' + (done || exp ? '' : '<button class="btn sm line" id="nstop" data-id="' + n.id + '" style="color:var(--orange-ink)">إيقاف النبضة</button>') + '</div>';
  }
  /* النبضة عند الطفل */
  var nudgeOn = null, beatTimer = null, actx = null;
  function showNudge(d) {
    if (S.nudgeShown[d.id] || S.dev.members.indexOf(d.to) < 0) return;
    if (nudgeOn && nudgeOn.id === d.id) return;
    closeNudge(true);
    nudgeOn = d;
    api('/nudge/state', { id: d.id, state: 'delivered' }).catch(function () {});
    var f = fem(d.f), many = S.dev.members.length > 1 && S.me !== d.to;
    var el = document.createElement('section'); el.className = 'nudgein'; el.setAttribute('role', 'alertdialog');
    el.innerHTML = '<span class="small row" style="color:#D8DEFA;gap:6px">' + ic('pulse', 'style="stroke:#F9A66C;width:18px"') + ' نبضة من نَبْض</span>' +
      '<div class="rings"><i></i><i></i><span class="core">' + av(d.f, 120) + '</span></div>' +
      '<div class="col center" style="gap:6px;text-align:center"><h1 style="font-size:40px;font-weight:800">' + esc(nm(d.f)) + ' ' + (many ? (f ? 'تنادي ' : 'ينادي ') + esc(nm(d.to)) : (f ? 'تناديك' : 'يناديك')) + '</h1>' +
      '<p style="margin:0;color:#D8DEFA">' + (f ? 'تنتظر' : 'ينتظر') + ' ردّك</p></div>' +
      '<button class="btn" id="nl" hidden style="background:#fff;color:#2B3FA8;border-radius:99px">' + PLAY + ' اسمع الرسالة</button>' +
      '<div class="col" style="width:100%;margin-top:auto;gap:10px"><span class="small center" style="color:#D8DEFA;text-align:center">رد على ' + esc(nm(d.f)) + '</span>' +
      '<div class="reply4"><button data-r="voice">' + ic('mic', 'style="width:28px;height:28px"') + 'صوت</button><button data-r="text">' + ic('text', 'style="width:28px;height:28px"') + 'كتابة</button><button data-r="photo">' + ic('cam', 'style="width:28px;height:28px"') + 'صورة</button><button data-r="draw">' + ic('pen', 'style="width:28px;height:28px"') + 'رسم</button></div>' +
      '<button id="nlater" style="color:#FFD9C2;padding:12px;font-size:15px">بعدين</button></div>';
    document.body.appendChild(el);
    var chat = pairId(d.f, d.to);
    NB.msgs.chat(chat).then(function (ms) {
      var lastV = ms.filter(function (m) { return m.s === d.f && m.k === 'voice' && NB.mediaSize(m); }).pop();
      if (lastV && Date.now() - lastV.t < 30 * 60e3) {
        var b = $('#nl', el); b.hidden = false; b.innerHTML = PLAY + ' اسمع الرسالة · ' + fmtDur(lastV.dur || 0);
        b.onclick = function () { stopBeat(); var a = new Audio(URL.createObjectURL(NB.media(lastV))); a.onended = function () { clearNowPlaying(a); }; a.play().catch(function () {}); seenNudge(); };
      }
    });
    el.querySelectorAll('[data-r]').forEach(function (b) {
      b.onclick = function () {
        var mode = b.dataset.r; seenNudge(); closeNudge();
        var go = function () { openChat(chat, mode); };
        if (S.me !== d.to) { S.me = d.to; NB.kv.set('me', d.to); }
        go();
      };
    });
    $('#nlater', el).onclick = function () { seenNudge(); closeNudge(); };
    startBeat();
  }
  function clearNudgeNotif(id) {
    try { if (S.reg && S.reg.getNotifications) S.reg.getNotifications({ tag: 'nudge-' + id }).then(function (l) { l.forEach(function (x) { x.close(); }); }); } catch (e) {}
  }
  function seenNudge() { if (!nudgeOn) return; S.nudgeShown[nudgeOn.id] = 1; clearNudgeNotif(nudgeOn.id); api('/nudge/state', { id: nudgeOn.id, state: 'seen' }).catch(function () {}); }
  function closeNudge(keep) {
    stopBeat();
    var el = document.querySelector('.nudgein'); if (el) el.remove();
    if (nudgeOn && !keep) S.nudgeShown[nudgeOn.id] = 1;
    nudgeOn = null;
  }
  function startBeat() {
    stopBeat();
    var k = 0;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume && actx.resume(); } catch (e) {}
    var beat = function () {
      if (navigator.vibrate) navigator.vibrate([180, 120, 260]);
      if (actx) [0, .22].forEach(function (off, i) {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + off;
        o.type = 'sine'; o.frequency.value = i ? 520 : 660; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .18);
        o.start(t); o.stop(t + .2);
      });
      if (++k > 25) stopBeat();
    };
    beat(); beatTimer = setInterval(beat, 1300);
  }
  function stopBeat() { if (beatTimer) clearInterval(beatTimer); beatTimer = null; if (navigator.vibrate) navigator.vibrate(0); }

  /* ================= المزامنة ================= */
  var loopT = null, syncing = false, again = false;
  function syncBody() {
    var ack = S.acks.splice(0), evAck = S.evAcks.splice(0);
    return { ver: CONFIG.VERSION, plat: plat(), notif: notifPerm(), tz: -new Date().getTimezoneOffset(), ack: ack, evAck: evAck };
  }
  function applySync(r) {
    S.roles = r.roles || S.roles; S.fam = r.fam || S.fam;
    if (r.dev) { S.dev.members = r.dev.members; S.dev.trusted = r.dev.trusted; }
    NB.kv.set('roles', S.roles); NB.kv.set('fam', S.fam); saveDev();
    return r;
  }
  var syncAt = 0;
  function syncNow() {
    // مزامنة علّقت أكثر من ٤ ثواني (رجعنا من الخلفية مثلاً)؟ نبدأ وحدة جديدة بدل ما ننتظر
    if (syncing && Date.now() - syncAt < 4000) { again = true; return; }
    doSync();
  }
  function doSync() {
    if (!S.acct || !S.acct.token) return;
    syncing = true; syncAt = Date.now();
    var gen = syncAt, changed = false, needFam = false, fresh = [];
    var body = syncBody();
    api('/sync', body).then(function (r) {
      applySync(r);
      if (r.fam && r.fam.rev > S.rev) needFam = true;
      // الرسائل الجديدة: اللي عندنا (وصلت مع الإشعار) نأكّدها على طول، والباقي نجيبه مع بعض
      var meta = function (m) { return { id: m.id, chat: m.chat, s: m.sender, k: m.kind, t: m.created }; };
      var got = function (rec) { if (rec) { changed = true; fresh.push(rec); } };
      var one = function (m) {
        return (m.inline ? Promise.resolve(m.inline) : api('/m/' + m.id, undefined, { text: true, timeout: 30000 }))
          .then(function (b) { return NB.ingest(meta(m), b); }).then(got)
          .then(function () { S.acks.push(m.id); }, function (e) { if (e && e.status === 404) S.acks.push(m.id); });
      };
      return Promise.all(r.msgs.map(function (m) { return NB.msgs.get(m.id).then(function (old) { return old ? (S.acks.push(m.id), null) : m; }); })).then(function (list) {
        list = list.filter(Boolean);
        var quick = list.filter(function (m) { return m.inline; }), slow = list.filter(function (m) { return !m.inline; });
        return Promise.all(quick.map(one)).then(function () {
          if (changed && gen === syncAt) refreshView();          // الكتابة تظهر فوراً
          // الصور والصوت: ٤ مع بعض
          var i = 0;
          function worker() { if (i >= slow.length) return Promise.resolve(); var m = slow[i++]; return one(m).then(worker); }
          return Promise.all([worker(), worker(), worker(), worker()]);
        });
      }).then(function () { return handleEvents(r.evs || []); }).then(function (c2) { changed = changed || c2; return r; });
    }).then(function () {
      if (needFam) return loadFamily().then(function () { changed = true; });
    }).then(function () {
      if (changed) refreshView();
      var rx = fresh.filter(function (m) { return m.k === 'react'; }), ev = fresh.filter(function (m) { return m.k === 'ev'; });
      if (fresh.length > rx.length + ev.length) inAppAlert(fresh.filter(function (m) { return m.k !== 'react' && m.k !== 'ev'; }));
      reactAlert(rx); evAlert(ev);
      if (S.view === 'home' && !S.me) home();
    }).catch(function (e) {
      if (e && e.status === 401) return lostDevice();
      S.acks = body.ack.concat(S.acks); S.evAcks = body.evAck.concat(S.evAcks);
    }).then(function () {
      if (gen !== syncAt) return;              // بدأت مزامنة أحدث
      syncing = false;
      if (again || S.acks.length || S.evAcks.length) { again = false; setTimeout(doSync, 300); }
    });
  }
  function refreshView() {
    if (S.view === 'chat') renderMsgs(); else if (S.view === 'home') renderChats();
    else if (S.view === 'buy') renderBuy(); else if (S.view === 'tasks') renderTasks(); else if (S.view === 'rewards') renderRewards();
    else if (S.view === 'picker') picker();
    if (A.onSync) A.onSync();
  }
  function handleEvents(evs) {
    var changed = false;
    // نبضات انتهت (وقّفها الأب أو انشافت) ما نعرضها
    var ended = {};
    evs.forEach(function (e) { if (e.t === 'nudge_state' && e.d && /stopped|seen|expired/.test(e.d.state)) ended[e.d.id] = 1; });
    return evs.reduce(function (p, e) {
      return p.then(function () {
        S.evAcks.push(e.id);
        var d = e.d || {};
        if (e.t === 'rcpt') {
          return Promise.all((d.ids || []).map(function (id) {
            return NB.msgs.get(id).then(function (m) {
              if (!m) return;
              m.st = m.st || {};
              (d.m || []).forEach(function (x) { m.st[x] = Math.max(m.st[x] || 0, d.s); });
              changed = true; return NB.msgs.put(m);
            });
          }));
        }
        if (e.t === 'settings') { if (d.auto_del != null) S.fam.auto_del = d.auto_del; if (d.links) S.fam.links = d.links; if (d.quiet) S.fam.quiet = d.quiet; changed = true; return autoDelete(); }
        if (e.t === 'update') { checkUpdate(); return; }
        if (e.t === 'wipe') return wipe(d.m).then(function (n) { if (n) { changed = true; if (d.m === S.me) toast('انحذفت المحادثات من هذا الجهاز'); } });
        if (e.t === 'nudge') { if (!ended[d.id] && Date.now() - (d.at || e.at) < 10 * 60e3) showNudge(d); return; }
        if (e.t === 'nudge_state') {
          if (S.nudges[d.id] || S.dev.members.indexOf(d.f) >= 0) {
            var n = S.nudges[d.id] || (S.nudges[d.id] = { id: d.id, to: d.to, at: e.at });
            if (n.state !== 'seen' && n.state !== 'stopped') n.state = d.state;
            n.n = Math.max(n.n || 1, d.n || 1); changed = true;
            if (d.state === 'seen' && S.chat === pairId(d.f, d.to) && navigator.vibrate) navigator.vibrate(80);
          }
          if (nudgeOn && nudgeOn.id === d.id && d.state === 'stopped') { closeNudge(); toast(nm(d.f) + (fem(d.f) ? ' وقّفت' : ' وقّف') + ' النبضة'); }
          if (d.state === 'stopped') { S.nudgeShown[d.id] = 1; clearNudgeNotif(d.id); }
          return;
        }
        if (e.t === 'profile' || e.t === 'roles') { changed = true; return loadFamily(); }
      });
    }, Promise.resolve()).then(function () { return changed; });
  }
  /* رسالة جديدة والتطبيق مفتوح: صوت واهتزاز وشريط واضح */
  function ding(strong) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.resume) actx.resume();
      [0, .14].forEach(function (off, i) {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + off;
        o.type = 'sine'; o.frequency.value = i ? 1046 : 784; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(strong ? .4 : .18, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
        o.start(t); o.stop(t + .25);
      });
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate(strong ? [200, 80, 200] : 60);
  }
  /* أحد تفاعل على رسالتي: ⭐ تشجيع يطلع بشكل واضح */
  function reactAlert(list) {
    list.forEach(function (r) {
      if (!r.e || r.s === S.me || document.visibilityState !== 'visible') return;
      NB.msgs.get(r.re).then(function (t) {
        if (!t || S.dev.members.indexOf(t.s) < 0) return;
        if (r.e === '⭐') {
          // الاحتفال: إذا هو بالمحادثة نحتفل الحين، وإلا يطلع أول ما يفتحها
          if (S.view === 'chat' && S.chat === t.chat) { t.cel = t.cel || {}; if (!t.cel[r.s]) { t.cel[r.s] = 1; NB.msgs.put(t); ding(false); starBurst(nm(r.s) + ' ' + (fem(r.s) ? 'عطتك' : 'عطاك') + ' نجمة على ' + (t.k === 'draw' ? 'رسمتك' : t.k === 'photo' ? 'صورتك' : 'رسالتك') + '! 🎉'); } }
          else toast('⭐ ' + nm(r.s) + ' ' + (fem(r.s) ? 'عطتك' : 'عطاك') + ' نجمة! افتح المحادثة', 3500);
        }
        else toast(nm(r.s) + ' ' + r.e + ' على ' + (t.k === 'draw' ? 'رسمتك' : t.k === 'photo' ? 'صورتك' : 'رسالتك'), 3000);
      });
    });
  }
  function starBurst(text) {
    var o = document.createElement('div'); o.className = 'starburst';
    o.innerHTML = '<div class="sb-star">⭐</div><b>' + esc(text) + '</b>' + new Array(14).join('<i>✨</i>');
    o.onclick = function () { o.remove(); };
    document.body.appendChild(o); setTimeout(function () { o.remove(); }, 3600);
  }
  function inAppAlert(list) {
    var mine = list.filter(function (m) { return m.s !== S.me && S.dev.members.some(function (x) { return x !== m.s && chatMembers(m.chat).indexOf(x) >= 0; }); });
    if (!mine.length || document.visibilityState !== 'visible') return;
    var m = mine[mine.length - 1], here = S.view === 'chat' && S.chat === m.chat;
    ding(!here);
    if (here) return;
    var old = document.querySelector('.inbanner'); if (old) old.remove();
    var b = document.createElement('button'); b.className = 'inbanner';
    b.innerHTML = av(m.s, 44) + '<span class="grow col" style="gap:0;text-align:start;min-width:0"><b>' + esc(nm(m.s)) + (m.chat === 'g' ? ' · ' + esc(grp().name) : '') + '</b><span class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (m.k === 'text' ? esc((m.text || '').slice(0, 70)) : NB.KIND[m.k]) + '</span></span>';
    b.onclick = function () { b.remove(); var parts = NB.chatParts(m.chat) || []; if (S.me && chatsFor(S.me).indexOf(m.chat) >= 0) openChat(m.chat); else { var w = parts.filter(function (x) { return S.dev.members.indexOf(x) >= 0 && !needsPin(x); })[0]; if (w) { S.me = w; NB.kv.set('me', w); openChat(m.chat); } } };
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 6000);
  }
  function wipe(m) {
    if (!m || S.dev.members.indexOf(m) < 0) return Promise.resolve(0);
    return NB.msgs.all().then(function (all) {
      var del = all.filter(function (x) { return x.chat === 'g' || (NB.chatParts(x.chat) || []).indexOf(m) >= 0; });
      return Promise.all(del.map(function (x) { return NB.msgs.del(x.id); })).then(function () { return del.length; });
    });
  }
  function autoDelete() {
    var days = S.fam.auto_del;
    if (!days || deviceHasAdmin()) return Promise.resolve(0);
    var cut = Date.now() - days * 864e5;
    return NB.msgs.all().then(function (all) {
      var old = all.filter(function (m) { return m.t < cut && !m.out && !((m.k === 'draw' || m.k === 'photo' || m.k === 'sticker') && hasStar(m)) && !(m.k === 'ev' && m.t > Date.now() - 32 * 864e5); });
      return Promise.all(old.map(function (m) { return NB.msgs.del(m.id); })).then(function () { return old.length; });
    });
  }
  function startLoop() {
    if (loopT) return;
    var tick = function () {
      if (document.visibilityState === 'visible' && S.acct && S.acct.token) syncNow();
      loopT = setTimeout(tick, S.view === 'chat' ? 3000 : 5000);
    };
    tick();
    retryOutbox();
    setInterval(function () { if (document.visibilityState === 'visible') retryOutbox(); }, 30000);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { syncNow(); if (S.view === 'chat') renderMsgs(); else if (S.view === 'home') renderChats(); closeReadNotifs(); checkUpdate(); }
  });
  function lostDevice() {
    // الجهاز انشال من العائلة (أو انحذف)
    S.acct = null; NB.kv.del('acct'); NB.kv.del('me');
    toast('هذا الجهاز انشال من العائلة. ادخل بكود العائلة من جديد.', 5000);
    welcome();
  }

  /* ================= الإشعارات ================= */
  function notifPerm() { if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'; return Notification.permission; }
  function notifState() {
    var p = notifPerm();
    if (p === 'unsupported') return Promise.resolve(plat() === 'ios' && !standalone() ? 'ios-install' : 'unsupported');
    if (p === 'denied') return Promise.resolve('denied');
    if (p !== 'granted') return Promise.resolve('off');
    return navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (s) { return s ? 'on' : 'off'; }, function () { return 'off'; });
  }
  function enableNotif() {
    try { localStorage.setItem('nabd-asked', '1'); } catch (e) {}
    if (notifPerm() === 'unsupported') { toast(plat() === 'ios' ? 'أضف نَبْض للشاشة الرئيسية أول' : 'الإشعارات غير مدعومة هنا'); return Promise.resolve(); }
    return Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { toast('ما انسمح بالتنبيهات'); return; }
      return subscribe(true).then(function () { toast('تم ✓ التنبيهات شغالة'); });
    });
  }
  function subscribe(force) {
    if (notifPerm() !== 'granted' || !S.acct || !S.acct.token) return Promise.resolve();
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription().then(function (s) {
        return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: NB.b64d(CONFIG.VAPID) });
      });
    }).then(function (s) {
      return NB.kv.get('endpoint2').then(function (old) {
        if (!force && old === s.endpoint) return;
        var j = s.toJSON ? s.toJSON() : {};
        return api('/sub', { endpoint: s.endpoint, keys: j.keys || {} }).then(function () { return NB.kv.set('endpoint2', s.endpoint); });
      });
    }).catch(function () {});
  }
  function askNotif() {
    if (notifPerm() !== 'default') return;
    try { if (localStorage.getItem('nabd-asked')) return; } catch (e) {}
    var sh = sheet('<div class="col center" style="gap:10px;text-align:center"><span class="av" style="width:72px;height:72px;background:#FFF4E5;color:#9A4A00">' + ic('bell', 'style="width:36px;height:36px"') + '</span>' +
      '<h2 style="font-size:24px">نخلّي التنبيهات توصلك؟</h2><p class="muted" style="margin:0">عشان تعرف أول ما توصلك رسالة أو نبضة، حتى والتطبيق مقفل' + (isParent(S.me) ? '' : ' وأنت تلعب') + '.</p></div>' +
      '<button class="btn block" id="ny">إيه، فعّلها</button><button class="btn line block" id="nn">بعدين</button>');
    $('#ny', sh).onclick = function () { sh.remove(); enableNotif().then(renderHomeNotice); };
    $('#nn', sh).onclick = function () { try { localStorage.setItem('nabd-asked', '1'); } catch (e) {} sh.remove(); };
  }

  /* ================= التحديث التلقائي ================= */
  var reloading = false, wantReload = false, lastCheck = 0;
  function checkUpdate(force) {
    if (!S.reg) return Promise.resolve(false);
    if (!force && Date.now() - lastCheck < 60e3) return Promise.resolve(false);
    lastCheck = Date.now();
    return S.reg.update().then(function () { return !!(S.reg.installing || S.reg.waiting); }, function () { return false; });
  }
  function doReload() {
    if (reloading) return;
    if (busy()) { wantReload = true; return; }
    try { var last = +sessionStorage.getItem('nabd-reload') || 0; if (Date.now() - last < 15000) return; sessionStorage.setItem('nabd-reload', Date.now()); } catch (e) {}
    reloading = true; location.reload();
  }
  setInterval(function () { if (wantReload && !busy()) doReload(); }, 4000);
  setInterval(function () { if (document.visibilityState === 'visible') checkUpdate(); }, 10 * 60e3);

  /* منع التكبير: الضغط مرتين وقرصة الإصبعين (آيفون يتجاهل user-scalable أحياناً) */
  /* التطبيق بالطول فقط: أندرويد يثبّت الاتجاه، والآيفون (ما يسمح بالتثبيت) تطلع له شاشة "لف الجهاز" */
  // الجوال بالطول فقط · التابلت والآيباد يلفّون عادي
  function isTablet() { return Math.min(screen.width, screen.height) >= 600; }
  function lockPortrait() {
    if (isTablet() || plat() === 'desktop') return;
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(function () {}); } catch (e) {}
  }
  function checkTurn() {
    // اتجاه الجهاز نفسه (مو حجم الشاشة، عشان الكيبورد ما يخدعنا)
    var t = screen.orientation && screen.orientation.type;
    var land = plat() !== 'desktop' && !isTablet() && (t ? /landscape/.test(t) : Math.abs(window.orientation || 0) === 90);
    var el = document.getElementById('turn');
    if (land && !el) {
      el = document.createElement('div'); el.id = 'turn';
      el.innerHTML = '<div style="font-size:64px;line-height:1;transform:rotate(-90deg)">📱</div><b style="font-size:22px;font-family:var(--fd)">نَبْض يشتغل بالطول</b><span class="muted">لفّ الجهاز عشان تكمل</span>';
      document.body.appendChild(el);
    } else if (!land && el) el.remove();
  }
  lockPortrait();
  window.addEventListener('resize', checkTurn);
  window.addEventListener('orientationchange', function () { setTimeout(checkTurn, 200); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') lockPortrait(); });
  setTimeout(checkTurn, 0);
  document.addEventListener('contextmenu', function (e) { if (!e.target.closest('input,textarea')) e.preventDefault(); });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });

  /* ================= شاشة التثبيت (إجبارية مثل سهم) ================= */
  function installWall() {
    S.view = 'install';
    var ua = navigator.userAgent, ios = plat() === 'ios';
    var inSafari = ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line|WhatsApp|Snapchat/i.test(ua);
    var inChromeIOS = ios && /CriOS|EdgiOS/.test(ua);
    var SH = '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
    var PL = '<svg class="ic" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
    var DT = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
    var APPI = '<img src="icons/icon-192.png" width="26" height="26" style="border-radius:7px" alt="">';
    var st = function (n, i, t) { return '<div class="row" style="gap:12px;font-size:16px;line-height:1.5"><span class="av" style="width:30px;height:30px;background:var(--brand);font-size:15px;font-family:var(--fb)">' + n + '</span>' + (i ? '<span class="av" style="width:36px;height:36px;border-radius:10px;background:var(--bg);color:#0a84ff">' + i + '</span>' : '') + '<span class="grow">' + t + '</span></div>'; };
    var steps;
    if (inChromeIOS) steps = st('١', SH, 'اضغط زر <b>المشاركة</b> فوق جنب شريط العنوان') + st('٢', PL, 'اختر <b>إضافة إلى الشاشة الرئيسية</b> ثم <b>إضافة</b>') + st('٣', APPI, 'افتح <b>نَبْض</b> من الشاشة الرئيسية');
    else if (ios && !inSafari) steps = st('١', '', 'افتح هذا الرابط في <b>سفاري</b>، التطبيق اللي أنت فيه ما يسمح بالإضافة للشاشة الرئيسية') + st('٢', SH, 'في سفاري اضغط زر <b>المشاركة</b>') + st('٣', PL, 'اختر <b>إضافة إلى الشاشة الرئيسية</b>');
    else if (ios) steps = st('١', SH, 'اضغط زر <b>المشاركة</b> تحت في سفاري') + st('٢', PL, 'اختر <b>إضافة إلى الشاشة الرئيسية</b> ثم <b>إضافة</b>') + st('٣', APPI, 'افتح <b>نَبْض</b> من الشاشة الرئيسية');
    else steps = st('١', DT, 'افتح قائمة المتصفح <b>⋮</b>') + st('٢', PL, 'اختر <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b>') + st('٣', APPI, 'افتح <b>نَبْض</b> من الشاشة الرئيسية');
    var hc = /[#&]j=([A-Za-z0-9-]+)/.exec(location.hash), code = hc ? prettyCode(normCode(hc[1])) : '';
    var el = show('<div class="col center" style="gap:8px;margin-top:12px;text-align:center">' + LOGO.replace('class="logo"', 'class="logo" style="width:84px;height:84px"') +
      '<h1 style="font-size:26px;margin-top:6px">أضف نَبْض إلى الشاشة الرئيسية</h1>' +
      '<p class="muted" style="margin:0;line-height:1.7">نَبْض يشتغل كتطبيق من الشاشة الرئيسية، وكذا بس توصلك التنبيهات والنبضة حتى والتطبيق مقفل.</p></div>' +
      '<div class="card col" style="gap:14px">' + steps + '</div>' +
      (code ? '<div class="card col" style="gap:10px"><span class="small muted">انسخ كود العائلة قبل، وبتحتاجه داخل التطبيق:</span><div class="inp code" style="height:auto;padding:12px;border-style:dashed">' + esc(code) + '</div><button class="btn sm ghost" id="cpc">' + ic('copy') + ' نسخ الكود</button></div>' : '') +
      '<button class="btn block brand" id="instNow"' + (deferredInstall ? '' : ' hidden') + '>ثبّت نَبْض الآن</button>' +
      (ios && inSafari ? '<div style="text-align:center;font-size:30px;animation:beat 1.4s ease-in-out infinite;margin-top:auto">⬇️</div>' : ''));
    if ($('#cpc', el)) $('#cpc', el).onclick = function () { copy(code); };
    $('#instNow', el).onclick = function () {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      deferredInstall.userChoice.then(function () { deferredInstall = null; $('#instNow').hidden = true; });
    };
    window.addEventListener('beforeinstallprompt', function () { var b = $('#instNow'); if (b) b.hidden = false; });
  }

  /* ================= التشغيل ================= */
  function boot() {
    if (!standalone() && !/[?&]browser\b/.test(location.search)) {
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
      return installWall();
    }
    if ('serviceWorker' in navigator) {
      var hadCtl = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').then(function (reg) { S.reg = reg; }).catch(function () {});
      navigator.serviceWorker.addEventListener('controllerchange', function () { if (hadCtl) doReload(); hadCtl = true; });
      navigator.serviceWorker.addEventListener('message', function (e) {
        var d = e.data || {};
        if (d.type === 'push') { refreshView(); syncNow(); }
        if (d.type === 'fresh' && d.ids && d.ids.length) {
          Promise.all(d.ids.map(function (id) { return NB.msgs.get(id); })).then(function (l) {
            l = l.filter(Boolean); refreshView();
            var rx = l.filter(function (m) { return m.k === 'react'; }), ev = l.filter(function (m) { return m.k === 'ev'; });
            if (l.length > rx.length + ev.length) inAppAlert(l.filter(function (m) { return m.k !== 'react' && m.k !== 'ev'; }));
            reactAlert(rx); evAlert(ev);
          });
        }
        if (d.type === 'open') route(d.hash);
      });
    }
    Promise.all(['acct', 'profile', 'roles', 'fam', 'dev', 'me'].map(function (k) { return NB.kv.get(k).catch(function () { return null; }); })).then(function (v) {
      S.acct = v[0];
      if (!S.acct || !S.acct.token) return welcome();
      if (v[1]) { S.prof = v[1].data; S.rev = v[1].rev; }
      S.roles = v[2] || []; S.fam = v[3] || {}; S.dev = v[4] || { members: [], trusted: [] }; S.me = v[5];
      if (S.me && S.dev.members.indexOf(S.me) < 0) S.me = null;
      if (!route(location.hash)) home();
      startLoop();
      loadFamily().then(function () { refreshView(); if (S.view === 'home') home(); autoDelete(); }).catch(function (e) { if (e && e.status === 401) lostDevice(); });
      subscribe(false);
    });
  }
  function route(hash) {
    hash = hash || '';
    if (!S.acct || !S.acct.token) return false;
    var m;
    if ((m = /nudge=([^&]+)&f=([^&]+)&to=([^&]+)/.exec(hash))) {
      history.replaceState(null, '', location.pathname);
      home(); showNudge({ id: m[1], f: m[2], to: m[3] }); return true;
    }
    if (/^#?(buy|tasks|rewards)$/.test(hash)) { history.replaceState(null, '', location.pathname); if (S.me) { if (/buy/.test(hash)) buyScreen(); else if (/rewards/.test(hash)) rewardsScreen(); else tasksScreen(); return true; } }
    if ((m = /chat=([^&]+)/.exec(hash))) {
      history.replaceState(null, '', location.pathname);
      var c = decodeURIComponent(m[1]);
      if (S.me && chatsFor(S.me).indexOf(c) >= 0) { openChat(c); return true; }
      var parts = NB.chatParts(c) || [];
      var who = parts.filter(function (x) { return S.dev.members.indexOf(x) >= 0; })[0];
      if (who && !needsPin(who)) { S.me = who; NB.kv.set('me', who); openChat(c); return true; }
      home(); return true;
    }
    if (/backup/.test(hash)) { history.replaceState(null, '', location.pathname); if (S.me) { home(); A.backup && A.backup(); return true; } }
    return false;
  }

  return {
    S: S, $: $, esc: esc, rid: rid, api: api, ic: ic, IC: IC, av: av, nm: nm, fem: fem, live: live, role: role, member: member, toast: toast, sheet: sheet, show: show,
    fmtDate: fmtDate, fmtTime: fmtTime, ago: ago, num: num, plat: plat, isParent: isParent, isOwner: isOwner, isAdmin: isAdmin, kindLabel: kindLabel,
    memberForm: memberForm, saveProfile: saveProfile, loadFamily: loadFamily, home: home, picker: picker, welcome: welcome, pinPad: pinPad, setPin: setPin,
    copy: copy, shareCode: shareCode, editMe: editMe, parentGate: parentGate, theme: theme, setTheme: setTheme, grp: grp, grpIcon: grpIcon, famPortrait: famPortrait, FPBG: FPBG, FPX: FPX, showCode: showCode, wrapKey: wrapKey, newCode: newCode, normCode: normCode, enableNotif: enableNotif, notifState: notifState, notifPerm: notifPerm,
    checkUpdate: checkUpdate, doReload: doReload, pack: pack, unpack: NB.unpack, syncNow: syncNow, refreshRoles: refreshRoles, deviceHasAdmin: deviceHasAdmin, colorOf: colorOf,
    sendMsg: sendMsg, sendReact: sendReact, starBurst: starBurst, liveOk: !!window.WebSocket, rewardsScreen: rewardsScreen, openChat: openChat, chatTitle: chatTitle, avatarImage: avatarImage, analyze: analyze, fmtDur: fmtDur,
    standalone: standalone, plat: plat,
    installPrompt: function () { if (!deferredInstall) return Promise.resolve(false); deferredInstall.prompt(); return deferredInstall.userChoice.then(function (c) { deferredInstall = null; return c && c.outcome === 'accepted'; }, function () { return false; }); },
    canInstall: function () { return !!deferredInstall; },
    tabBar: tabBar, starGallery: starGallery,
    lostDevice: lostDevice, installTip: installTip, LOGO: LOGO, PLAY: PLAY, boot: boot, standalone: standalone, compress: compress, closeSheets: closeSheets
  };
})();
