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
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = d ? '#0E1218' : '#F4F7FC';
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
  function grp() { var g = S.prof.group || {}; return { name: g.name || 'العائلة', e: g.e || '', c: g.c || '#0F8B8D' }; }
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
        S.prof.members[me] = Object.assign({}, cur, { av: d.av, name: (adminMe || parentMe) ? d.name : cur.name, g: adminMe ? d.g : cur.g });
      }).then(function () { toast('انحفظ ✓'); if (S.view === 'home') home(); else if (A.settings && S.view === 'settings') A.settings(); }, function (e) {
        S.prof.members[me] = JSON.parse(before);
        toast(e && e.error === 'network' ? 'ما فيه اتصال بالإنترنت' : 'ما قدرنا نحفظ، جرّب مرة ثانية');
      });
    }, { lockKind: true, avatarOnly: !adminMe, lockName: !(adminMe || parentMe) });
  }
  function refreshRoles() { return api('/sync', syncBody()).then(applySync); }

  /* ================= الشاشات ================= */
  function show(html, cls) {
    stopAudio();
    app.innerHTML = '<section class="screen ' + (cls || '') + '">' + html + '</section>';
    window.scrollTo(0, 0);
    return app.firstChild;
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
    [draft.me].concat(list).forEach(function (m) { p.members[m.id] = { name: m.name, kind: m.kind, g: m.g, av: m.av }; p.order.push(m.id); });
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
    var useIt = function (pin, pad) {
      return api('/use', { member: id, pin: pin }).then(function (r) {
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
      return setPin('اختر رمز سري لـ' + nm(id), function (p) { useIt(p).catch(netErr); });
    }
    pinPad('الرمز السري', nm(id), function (p, pad) {
      useIt(p, pad).catch(function (e) {
        if (e && e.error === 'bad_pin') pad.fail('رمز غلط' + (e.left > 0 ? ' · باقي ' + num(e.left) + ' محاولات' : ''));
        else if (e && e.error === 'locked') { pad.close(); toast('انقفل مؤقتاً، جرّب بعد ' + num(e.wait) + ' دقائق', 4000); }
        else { pad.fail('ما فيه اتصال'); }
      });
    }, { who: id });
  }
  function netErr(e) { toast(e && e.error === 'network' ? 'ما فيه اتصال بالإنترنت' : 'صار خطأ، جرّب مرة ثانية'); }

  /* ----- الرئيسية ----- */
  function greet() { var h = new Date().getHours(); return h < 12 ? 'صباح الخير' : 'مساء الخير'; }
  function home() {
    if (!S.me || live().indexOf(S.me) < 0 || S.dev.members.indexOf(S.me) < 0) return picker();
    S.view = 'home'; S.chat = null;
    var el = show('<div class="row"><button id="meB" class="row grow" style="gap:10px;text-align:start" aria-label="تغيير صورتي">' + av(S.me, 52) + '<span class="grow col" style="gap:0"><span class="small muted">' + greet() + '</span><span class="fd" style="font-size:26px;font-weight:800;line-height:1.1">' + esc(nm(S.me)) + '</span></span></button>' +
      '<button class="icb" id="alB" aria-label="ألبوم العائلة" style="font-size:22px">🖼️</button><button class="icb" id="sw" aria-label="تبديل الشخص">' + ic('swap') + '</button><button class="icb" id="st" aria-label="الإعدادات">' + ic('gear') + '</button></div>' +
      '<div class="col" id="chats" style="gap:12px"></div><div id="hn" style="margin-top:auto"></div>');
    $('#sw', el).onclick = function () { picker(); };
    $('#alB', el).onclick = album;
    $('#meB', el).onclick = editMe;
    $('#st', el).onclick = function () { A.settings(); };
    renderChats(); renderHomeNotice();
  }
  function renderChats() {
    var box = $('#chats'); if (!box || S.view !== 'home') return;
    var chats = chatsFor(S.me);
    Promise.all(chats.map(function (c) { return NB.msgs.chat(c); })).then(function (lists) {
      var items = chats.map(function (c, i) {
        var ms = lists[i] || [], last = ms[ms.length - 1];
        var unread = ms.filter(function (m) { return m.s !== S.me && (m.r || []).indexOf(S.me) < 0; }).length;
        return { c: c, last: last, unread: unread, t: last ? last.t : 0 };
      });
      setBadge(items.reduce(function (n, it) { return n + it.unread; }, 0));
      var g = items.shift();
      items.sort(function (a, b) { return b.t - a.t; });
      items.unshift(g);
      var kid = !isParent(S.me);
      box.innerHTML = items.map(function (it) {
        var fam = it.c === 'g', o = otherOf(it.c), col = fam ? grp().c : colorOf(o);
        var pv = it.last ? previewOf(it.last) : (fam ? 'ابدأوا السوالف 👋' : 'ابدأ السوالف 👋');
        return '<div class="cardwrap' + (it.unread ? ' hot' : '') + '" style="--cc:' + col + '"><button class="chatcard' + (fam ? ' fam' : '') + '" data-c="' + esc(it.c) + '"' + (fam ? ' style="background:linear-gradient(135deg,' + col + ',' + shade(col, -.28) + ')"' : '') + '>' +
          (fam ? grpIcon(62, 22) : '<span class="ring">' + av(o, 58) + '</span>') +
          '<span class="grow col" style="gap:3px"><span class="row" style="gap:8px;align-items:baseline;flex-wrap:wrap"><span class="nm">' + (fam ? esc(grp().name) : esc(nm(o))) + '</span>' +
          (fam ? '<span class="tiny" style="color:#D2EFEF">منذ ' + fmtDate(S.fam.created || S.acct.created) + '</span>' : '') + '</span>' +
          '<span class="pv"' + (it.unread ? ' style="font-weight:700;color:' + (fam ? '#fff' : 'var(--ink)') + '"' : '') + '>' + pv + '</span></span>' +
          '<span class="col" style="gap:6px;align-items:flex-end">' + (it.last ? '<span class="tiny when">' + whenShort(it.last.t) + '</span>' : '') +
          (it.unread ? '<span class="badge" aria-label="' + num(it.unread) + ' رسالة جديدة">' + num(it.unread) + '</span>' : it.last && it.last.s === S.me ? tickSvg(it.last, fam) : '') + '</span></button>' +
          // للأطفال: أزرار سريعة (صوت، رسم) بضغطة وحدة
          (kid ? '<div class="quick"><button data-q="voice" data-qc="' + esc(it.c) + '">🎤 صوت</button><button data-q="draw" data-qc="' + esc(it.c) + '">🎨 ارسم</button><button data-q="sticker" data-qc="' + esc(it.c) + '">🧸 ملصق</button></div>' : '') + '</div>';
      }).join('');
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
    app.innerHTML = '<section class="chat" style="--wc:' + (chat === 'g' ? grp().c : colorOf(o)) + '">' +
      '<div class="chathead"><button class="icb flat" id="bk" aria-label="رجوع">' + ic('back') + '</button>' +
      (chat === 'g' ? grpIcon(46, 16) : '<span class="ring sm">' + av(o, 44) + '</span>') +
      '<span class="grow col" style="gap:0;min-width:0"><span class="row" style="gap:8px;align-items:baseline"><span class="t">' + esc(chatTitle(chat)) + '</span>' + (chat === 'g' ? '<span class="tiny soft">منذ ' + fmtDate(S.fam.created || S.acct.created) + '</span>' : '') + '</span>' +
      '<span class="tiny muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (chat === 'g' ? live().map(nm).map(esc).join('، ') : kindLabel(member(o) || {})) + '</span></span>' +
      (canNudge ? '<button class="btn sm orange" id="nudgeB" aria-label="أرسل نبضة لـ' + esc(nm(o)) + '">' + ic('pulse') + ' نبضة</button>' : '') + '</div>' +
      '<div class="msgs" id="msgs"></div><div class="compose" id="comp"></div></section>';
    $('#bk').onclick = function () { home(); };
    if (canNudge) $('#nudgeB').onclick = function () { sendNudge(o); };
    composer();
    renderMsgs(true);
    if (mode === 'voice') setTimeout(startRec, 300);
    else if (mode === 'text') setTimeout(function () { $('#txt') && $('#txt').focus(); }, 300);
    else if (mode === 'photo') setTimeout(pickPhoto, 300);
    else if (mode === 'draw') drawScreen();
    else if (mode === 'sticker') setTimeout(stickerSheet, 200);
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
  function msgHTML(m) {
    var mine = m.s === S.me, group = m.chat === 'g';
    var body = '';
    if (m.k === 'text') { var en = emojiOnly(m.text); body = en ? '<div class="bub emo" style="font-size:' + (en <= 3 ? 52 : en <= 6 ? 40 : 32) + 'px">' + esc(m.text.trim()) + '</div>' : '<div class="bub">' + esc(m.text || '') + '</div>'; }
    else if (m.k === 'sticker') { var su = mediaUrl(m); body = '<div class="stkmsg">' + (su ? '<img src="' + su + '" data-view="' + m.id + '" alt="ملصق">' : '') + '</div>'; }
    else if (m.k === 'photo' || m.k === 'draw') {
      var u = mediaUrl(m);
      body = '<div class="bub media">' + (u ? '<img src="' + u + '" data-view="' + m.id + '" alt="' + (m.k === 'draw' ? 'رسمة' : 'صورة') + '" style="' + (m.w ? 'width:' + Math.round(Math.min(240, 240 * Math.min(1, (m.w / m.h) / 0.75))) + 'px;max-width:62vw;height:auto;max-height:none;aspect-ratio:' + m.w + '/' + m.h : '') + '">' : '<span class="small muted" style="padding:20px;display:block">جاري التحميل…</span>') + '</div>';
    } else if (m.k === 'voice') {
      var wf = m.wf || [], played = (m.st || {});
      body = '<div class="bub"><div class="voice" data-voice="' + m.id + '"><button class="pl" aria-label="تشغيل الرسالة الصوتية" style="color:' + (mine ? 'var(--accent)' : '#fff') + '">' + PLAY + '</button>' +
        '<span class="wave">' + (wf.length ? wf : new Array(28).fill(.4)).map(function (v) { return '<i style="height:' + Math.max(4, Math.round(v * 28)) + 'px"></i>'; }).join('') + '</span><span class="dur">' + fmtDur(m.dur || 0) + '</span></div></div>';
    }
    var sched = m.sched && m.out;
    var meta = '<span class="meta">' + (sched ? '⏰ تنرسل ' + fmtDay(m.sched) + ' ' + fmtTime(m.sched) : fmtTime(m.t) + (mine ? ' ' + tickSvg(m, group) + voiceNote(m) : '')) + '</span>';
    var re = m.re ? Object.keys(m.re) : [];
    if (re.length) {
      var cnt = {}; re.forEach(function (k) { cnt[m.re[k]] = (cnt[m.re[k]] || 0) + 1; });
      body = body.slice(0, -6) + '<span class="reacts" title="' + esc(re.map(function (k) { return nm(k) + ' ' + m.re[k]; }).join('، ')) + '">' + Object.keys(cnt).map(function (e) { return e + (cnt[e] > 1 ? '<i>' + num(cnt[e]) + '</i>' : ''); }).join('') + '</span></div>';
    }
    return '<div class="m' + (mine ? ' me' : '') + (sched ? ' sched' : '') + '" data-id="' + m.id + '"' + (mine ? '' : ' style="--sc:' + colorOf(m.s) + '"') + '>' + (!mine && group ? av(m.s, 32) : '') +
      '<div class="col" style="gap:0;align-items:' + (mine ? 'flex-end' : 'flex-start') + ';min-width:0">' + (!mine && group ? '<span class="who2" style="color:' + colorOf(m.s) + '">' + esc(nm(m.s)) + '</span>' : '') + body + meta + '</div></div>';
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
  /* تشغيل الرسائل الصوتية بـ Web Audio: ما يطلع مشغّل في شاشة القفل ولا يبقى شغّال بالخلفية.
     إذا ما قدر الجهاز يفك الصيغة نرجع لعنصر <audio> وننظفه كامل بعد ما يخلص */
  var audio = null, audioEl = null, audioTimer = null, vctx = null, vsrc = null;
  function clearNowPlaying(a) {
    try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {}
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none';
        ['play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack', 'stop'].forEach(function (k) { try { navigator.mediaSession.setActionHandler(k, null); } catch (e) {} });
      }
    } catch (e) {}
  }
  function stopAudio() {
    if (audio) { clearNowPlaying(audio); audio = null; }
    if (vsrc) { try { vsrc.onended = null; vsrc.stop(); } catch (e) {} vsrc = null; }
    if (vctx) { var c = vctx; vctx = null; try { c.close(); } catch (e) {} }
    try { if (navigator.audioSession) navigator.audioSession.type = 'auto'; } catch (e) {}
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
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = AC ? new AC() : null;
    vctx = ctx;
    // آيفون: نوع "تشغيل" عشان يطلع الصوت حتى لو زر الصامت شغّال
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    if (ctx && ctx.resume) ctx.resume();
    var html5 = function () {
      if (audioEl !== el) return;
      if (ctx) { try { ctx.close(); } catch (e) {} if (vctx === ctx) vctx = null; }
      var u = URL.createObjectURL(NB.media(m));
      audio = new Audio(u);
      audio.onended = function () { stopAudio(); URL.revokeObjectURL(u); };
      audio.onerror = function () { stopAudio(); toast('ما قدرنا نشغّل الرسالة على هذا الجهاز'); };
      audio.play().catch(function () { stopAudio(); });
      audioTimer = setInterval(function () { if (audio) tick(audio.currentTime, audio.duration && isFinite(audio.duration) ? audio.duration : (m.dur || 1)); }, 120);
    };
    if (!ctx) return html5();
    NB.media(m).arrayBuffer().then(function (ab) {
      return new Promise(function (res, rej) { var p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
    }).then(function (buf) {
      if (audioEl !== el || vctx !== ctx) return;
      var src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
      var t0 = ctx.currentTime; vsrc = src;
      src.onended = function () { if (vsrc === src) stopAudio(); };
      src.start(0);
      audioTimer = setInterval(function () { if (vctx === ctx) tick(Math.min(buf.duration, ctx.currentTime - t0), buf.duration); }, 120);
    }).catch(html5);
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
      '<div class="tools"><button class="dr" id="drB">' + ic('pen') + ' رسم</button><button class="st" id="stB"><span style="font-size:20px;line-height:1">🧸</span> ملصق</button><button class="ph" id="phB">' + ic('cam') + ' صورة</button></div>' +
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
    t.oninput = sync;
    t.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey && plat() === 'desktop') { e.preventDefault(); mic.click(); } };
    mic.onclick = function () {
      var v = t.value.trim();
      if (v) { t.value = ''; sync(); sendMsg('text', { text: v }); if (plat() === 'desktop') t.focus(); else { t.blur(); setTimeout(function () { var b = $('#msgs'); if (b) b.scrollTop = b.scrollHeight; }, 350); } }
      else startRec();
    };
    c.querySelectorAll('[data-qr]').forEach(function (b) { b.onclick = function () { if (navigator.vibrate) navigator.vibrate(15); sendMsg('text', { text: b.dataset.qr }); }; });
    $('#drB').onclick = drawScreen;
    $('#stB').onclick = stickerSheet;
    var sb = $('#schB'); if (sb) sb.onclick = function () { var v = t.value.trim(); if (v) schedSheet(function (at) { t.value = ''; sync(); sendMsg('text', { text: v, at: at }); toast('⏰ تنرسل ' + fmtDay(at) + ' ' + fmtTime(at), 3000); }); };
    $('#phB').onclick = pickPhoto;
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
  var STK_SAY = [['laugh', 'ههههه 😂'], ['grin', 'أحبك ❤️'], ['smile', 'تم 👍'], ['wink', 'اشتقت لك'], ['calm', 'تصبح على خير 🌙'], ['grin', 'برافو ⭐'], ['smile', 'وينك؟'], ['laugh', 'يا سلام!']];
  function stickerCanvas(id, say, px) {
    var m = member(id) || {}, a = m.av || {};
    var tmp = a.ch ? { members: {} } : null;
    var pid = id;
    if (a.ch) { var cp = JSON.parse(JSON.stringify(m)); cp.av = { ch: Object.assign({}, a.ch, { e: say[0] }), bg: a.bg }; pid = id + '~' + say[0]; tmp = cp; }
    var getImg = tmp ? (function () { var keep = (S.prof.members || {})[pid]; S.prof.members[pid] = tmp; var pr = avatarImage(pid, Math.round(px * .78)); if (!keep) delete S.prof.members[pid]; return pr; })() : avatarImage(id, Math.round(px * .78));
    return getImg.then(function (img) {
      var c = document.createElement('canvas'); c.width = c.height = px; var x = c.getContext('2d'), r = px * .78;
      x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = px * .03; x.shadowOffsetY = px * .01;
      x.fillStyle = '#fff'; x.beginPath(); x.arc(px / 2, r / 2 + px * .02, r / 2 + px * .025, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0; x.shadowOffsetY = 0;
      x.drawImage(img, (px - r) / 2, px * .02, r, r);
      var fs = Math.round(px * .125); x.font = '800 ' + fs + 'px "IBM Plex Sans Arabic","Segoe UI","Noto Sans Arabic",sans-serif'; x.direction = 'rtl';
      var tw = Math.min(px * .96, x.measureText(say[1]).width + px * .1), bx = (px - tw) / 2, by = px * .78, bh = fs * 1.6;
      x.fillStyle = '#fff'; x.strokeStyle = '#1B2333'; x.lineWidth = px * .012;
      if (x.roundRect) { x.beginPath(); x.roundRect(bx, by, tw, bh, bh / 2); x.fill(); x.stroke(); } else { x.fillRect(bx, by, tw, bh); x.strokeRect(bx, by, tw, bh); }
      x.fillStyle = '#1B2333'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(say[1], px / 2, by + bh / 2 + 1);
      return c;
    });
  }
  function stickerSheet() {
    var chat = S.chat, who = [S.me].concat(live().filter(function (x) { return x !== S.me; }));
    var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">🧸 ملصقات العائلة</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      '<div class="chips" id="sw2" style="display:flex;gap:8px;overflow-x:auto;flex-wrap:nowrap">' + who.map(function (id, i) { return '<button class="chip' + (i ? '' : ' on') + '" data-w="' + id + '" style="flex:none;gap:6px;display:flex;align-items:center">' + av(id, 26) + esc(nm(id)) + '</button>'; }).join('') + '</div>' +
      '<div id="sg" class="stkgrid"></div>');
    $('#x', sh).onclick = function () { sh.remove(); };
    function paint(id) {
      var g = $('#sg', sh); g.innerHTML = STK_SAY.map(function (s2, i) { return '<button data-i="' + i + '" aria-label="' + esc(s2[1]) + '"><span class="spin"></span></button>'; }).join('');
      STK_SAY.forEach(function (s2, i) {
        stickerCanvas(id, s2, 240).then(function (c) {
          var b = g.querySelector('[data-i="' + i + '"]'); if (!b) return;
          b.innerHTML = ''; c.style.width = '100%'; c.style.height = 'auto'; b.appendChild(c);
          b.onclick = function () {
            sh.remove();
            stickerCanvas(id, s2, 360).then(function (big) { big.toBlob(function (bl) { S.chat = chat; sendMsg('sticker', { w: 360, h: 360 }, bl); }, 'image/png'); });
          };
        });
      });
    }
    sh.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () { sh.querySelectorAll('[data-w]').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(b.dataset.w); }; });
    paint(who[0]);
  }

  /* ----- ألبوم العائلة: كل الصور والرسومات ----- */
  function album() {
    S.view = 'album';
    var el = show('<div class="row"><button class="icb" id="ab" aria-label="رجوع">' + ic('back') + '</button><span class="fd grow" style="font-size:24px;font-weight:800">🖼️ ألبوم العائلة</span></div>' +
      '<div class="chips" id="af" style="display:flex;gap:8px"><button class="chip on" data-f="all">الكل</button><button class="chip" data-f="photo">صور</button><button class="chip" data-f="draw">رسومات</button><button class="chip" data-f="sticker">ملصقات</button></div><div id="ag" class="col" style="gap:14px"></div>', '');
    $('#ab', el).onclick = function () { home(); };
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
          html += '<button data-i="' + i + '" class="' + (m.k === 'sticker' ? 'stkc' : '') + '"><img src="' + u + '" alt="" loading="lazy"><span>' + av(m.s, 22) + '</span></button>';
        });
        box.innerHTML = html + '</div>';
        box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { viewMedia(all[+b.dataset.i], b.querySelector('img').src); }; });
      });
    }
    el.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { f = b.dataset.f; el.querySelectorAll('[data-f]').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }; });
    paint();
  }
  function viewMedia(m, src) {
    var v = document.createElement('div'); v.className = 'viewer';
    v.innerHTML = '<img src="' + src + '" alt=""><div class="vbar"><span class="small" style="color:#fff">' + esc(nm(m.s)) + ' · ' + fmtDay(m.t) + ' ' + fmtTime(m.t) + '</span><button class="btn sm" id="vs">حفظ</button></div>';
    v.onclick = function (e) { if (e.target.id !== 'vs') v.remove(); };
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
  function sendMsg(kind, o, blob) {
    var m = { id: rid(12), chat: S.chat, s: S.me, k: kind, t: o.at || Date.now(), st: {}, r: [S.me], out: 1 };
    if (o.at) m.sched = o.at;
    var head = {};
    if (kind === 'text') { m.text = o.text; head.text = o.text; }
    else { m.mime = blob.type; ['dur', 'wf', 'w', 'h'].forEach(function (k) { if (o[k] != null) m[k] = o[k]; }); }
    return (blob ? blob.arrayBuffer().then(function (b) { m.buf = b; }) : Promise.resolve()).then(function () { return NB.msgs.put(m); }).then(function () { renderMsgs(true); return upload(m); });
  }
  function upload(m) {
    var mb = NB.media(m), bytesP = mb ? mb.arrayBuffer().then(function (b) { return new Uint8Array(b); }) : Promise.resolve(null);
    var head = m.k === 'text' ? { text: m.text } : { mime: m.mime, dur: m.dur, wf: m.wf, w: m.w, h: m.h };
    return bytesP.then(function (bytes) {
      return Promise.all([NB.enc(pack(head, bytes)), m.k === 'text' ? NB.encJSON({ x: m.text.slice(0, 80) }) : Promise.resolve('')]);
    }).then(function (r) {
      if (r[0].length > 1950000) throw { error: 'toolarge' };
      var q = '?member=' + encodeURIComponent(m.s) + '&chat=' + encodeURIComponent(m.chat) + '&id=' + m.id + '&kind=' + m.k + (r[1] ? '&prev=' + r[1] : '') + (m.sched ? '&at=' + m.sched : '');
      return api('/send' + q, null, { raw: r[0] });
    }).then(function (j) {
      // المجدولة: تبقى "⏰" عندنا لين يجي وقتها
      if (j && j.sched) { m.out = 2; return NB.msgs.put(m); }
      delete m.out; delete m.err; delete m.sched; return NB.msgs.put(m);
    }).then(function () { if (S.view === 'chat') renderMsgs(); else renderChats(); })
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
  function startRec() {
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
          var send = function () { sendMsg('voice', { dur: Math.round(r && r.dur ? r.dur : dur), wf: wf }, blob); };
          if (r && r.silent) silentSheet(send); else send();
        });
      };
      mr.start(250);
      var c = $('#comp');
      c.innerHTML = '<div class="fxrow"><span class="fxl">🎭 غيّر صوتك:</span>' + FX.map(function (f) { return '<button data-fx="' + f[0] + '"' + (f[0] === fx ? ' class="on"' : '') + '>' + f[1] + '</button>'; }).join('') + '</div><div class="recbar"><button class="icb flat" id="rx" aria-label="إلغاء التسجيل" style="color:var(--danger)">' + ic('trash') + '</button>' +
        '<span class="recdot"></span><span class="fd" id="rt" style="font-size:22px;font-weight:700;font-variant-numeric:tabular-nums">0:00</span><span class="grow small muted">' + (isParent(S.me) ? 'يسجّل…' : 'تكلّم الحين…') + '</span>' +
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

  /* ----- الرسم ----- */
  var COLORS = ['#1B2333', '#D4552B', '#F5B62A', '#23854D', '#2F6FDB', '#A13D8F', '#F28AB2', '#8A5A3C', '#FFFFFF', '#3FC1C9', '#8BD346', '#FF8A3D', '#9AD3F5', '#FFD6E7'];
  var CN = ['أسود', 'أحمر', 'أصفر', 'أخضر', 'أزرق', 'بنفسجي', 'وردي', 'بني', 'أبيض', 'تركوازي', 'ليموني', 'برتقالي', 'سماوي', 'وردي فاتح'];
  var BGS = ['#FFFFFF', '#FFF4C7', '#FAD9E6', '#DCEBFA', '#D6F0E0', '#E6E0FA', '#FFE0D6', '#BDE7FF', '#1B2333', '#2B3FA8', '#0F8B8D', '#F5B62A'];
  var STICKERS = ['⭐', '❤️', '🌈', '🦄', '🐱', '🐶', '🦋', '🌸', '🌻', '☀️', '🌙', '✨', '🎈', '🎁', '👑', '🍦', '🍭', '🍉', '⚽', '🚗', '🚀', '🏠', '🐠', '🦁', '🐰', '😀', '😍', '😎', '🥳', '💖', '🌟', '🎀'];
  /* صفحات تلوين (خطوط فقط، 100×100) — الطفل يلوّنها بالسطل أو القلم */
  var PAGES = {
    house: { n: 'بيت', p: ['M25 50h50v38h-50z', 'M18 52L50 22L82 52z', 'M64 31h7v12h-7z', 'M44 66h12v22h-12z', 'M30 58h10v10h-10z', 'M60 58h10v10h-10z', 'M90 16a8 8 0 1 0-16 0a8 8 0 1 0 16 0z', 'M4 88H96', 'M12 88V76a5 5 0 0 1 10 0V88'] },
    flower: { n: 'وردة', p: ['M73.0 38.0a8 8 0 1 0-16 0a8 8 0 1 0 16 0z','M68.6 48.6a8 8 0 1 0-16 0a8 8 0 1 0 16 0z','M58.0 53.0a8 8 0 1 0-16 0a8 8 0 1 0 16 0z','M47.4 48.6a8 8 0 1 0-16 0a8 8 0 1 0 16 0z','M43.0 38.0a8 8 0 1 0-16 0a8 8 0 1 0 16 0z','M47.4 27.4a8 8 0 1 0-16 0a8 8 0 1 0 16 0z','M58.0 23.0a8 8 0 1 0-16 0a8 8 0 1 0 16 0z','M68.6 27.4a8 8 0 1 0-16 0a8 8 0 1 0 16 0z', 'M58 38a8 8 0 1 0-16 0a8 8 0 1 0 16 0z', 'M50 62V86', 'M50 74C42 64 32 66 30 70C36 78 44 78 50 74z', 'M50 72C58 62 68 64 70 68C64 76 56 76 50 72z', 'M36 86h28l-4 10h-20z'] },
    fish: { n: 'سمكة', p: ['M17 50a28 17 0 1 0 56 0a28 17 0 1 0-56 0z', 'M72 50L92 34V66z', 'M31 46a3 3 0 1 0-6 0a3 3 0 1 0 6 0z', 'M40 34Q50 22 60 35', 'M50 34Q44 50 50 66', 'M60 37Q55 50 60 63', 'M14 30a3 3 0 1 0-6 0a3 3 0 1 0 6 0z', 'M22 20a2.5 2.5 0 1 0-5 0a2.5 2.5 0 1 0 5 0z', 'M4 84Q14 78 24 84T44 84T64 84T84 84T100 84'] },
    car: { n: 'سيارة', p: ['M10 66L10 54L22 50L33 36L65 36L76 50L90 54L90 66z', 'M37 40L32 50H48V40z', 'M52 40V50H70L62 40z', 'M39 68a9 9 0 1 0-18 0a9 9 0 1 0 18 0z', 'M79 68a9 9 0 1 0-18 0a9 9 0 1 0 18 0z', 'M33 68a3 3 0 1 0-6 0a3 3 0 1 0 6 0z', 'M73 68a3 3 0 1 0-6 0a3 3 0 1 0 6 0z', 'M86 56h4v4h-4z', 'M2 80H98'] },
    butterfly: { n: 'فراشة', p: ['M46.5 52a3.5 20 0 1 0 7 0a3.5 20 0 1 0-7 0z', 'M47 44C30 16 8 22 13 40C17 53 34 54 47 50z', 'M53 44C70 16 92 22 87 40C83 53 66 54 53 50z', 'M47 56C34 58 20 70 27 81C34 89 46 76 47 64z', 'M53 56C66 58 80 70 73 81C66 89 54 76 53 64z', 'M48 33Q42 22 37 19', 'M52 33Q58 22 63 19', 'M33 35a5 5 0 1 0-10 0a5 5 0 1 0 10 0z', 'M77 35a5 5 0 1 0-10 0a5 5 0 1 0 10 0z', 'M37 70a3.5 3.5 0 1 0-7 0a3.5 3.5 0 1 0 7 0z', 'M70 70a3.5 3.5 0 1 0-7 0a3.5 3.5 0 1 0 7 0z'] },
    cat: { n: 'قطة', p: ['M22 56a28 24 0 1 0 56 0a28 24 0 1 0-56 0z', 'M27 43L25 17L44 33', 'M73 43L75 17L56 33', 'M44 52a4 5 0 1 0-8 0a4 5 0 1 0 8 0z', 'M64 52a4 5 0 1 0-8 0a4 5 0 1 0 8 0z', 'M46 61h8l-4 4z', 'M50 65q-4 6-9 3M50 65q4 6 9 3', 'M30 60H12M30 64L14 70M70 60H88M70 64L86 70'] },
    rocket: { n: 'صاروخ', p: ['M50 8C63 21 65 40 62 66H38C35 40 37 21 50 8z', 'M57 36a7 7 0 1 0-14 0a7 7 0 1 0 14 0z', 'M38 50L24 70L38 66z', 'M62 50L76 70L62 66z', 'M42 66L50 88L58 66z', 'M38 56H62', 'M16 20l2 4 4 1-4 1-2 4-2-4-4-1 4-1z', 'M84 34l2 4 4 1-4 1-2 4-2-4-4-1 4-1z', 'M80 80l2 4 4 1-4 1-2 4-2-4-4-1 4-1z'] },
    camel: { n: 'جمل', p: ['M18 58C18 48 26 44 32 44C36 32 46 32 50 42C54 34 62 34 64 44C70 46 74 42 75 36L77 24C78 19 86 19 88 24L91 30L86 32L83 31L80 50C80 58 76 62 70 62H24C20 62 18 60 18 58z', 'M26 62h5v24h-5z', 'M36 62h5v24h-5z', 'M60 62h5v24h-5z', 'M69 62h5v24h-5z', 'M86 26a1.4 1.4 0 1 0-2.8 0a1.4 1.4 0 1 0 2.8 0z', 'M18 54Q10 58 13 68', 'M2 90Q25 84 50 90T98 90', 'M20 20a7 7 0 1 0-14 0a7 7 0 1 0 14 0z'] }
  };

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

  /* الرسم: قلم، قوس قزح، نيون، تعبئة، ملصقات (وصور العائلة)، الخلفية، صفحات تلوين، ممحاة — وكل شي يتراجع */
  function drawScreen() {
    var chat = S.chat; S.view = 'draw';
    var ops = [], cur = null, color = COLORS[1], size = 10, tool = 'pen', sticker = STICKERS[0], page = null, snap = null;
    var TOOLS = [['pen', '✏️', 'قلم'], ['rainbow', '🌈', 'قوس قزح'], ['glow', '💡', 'نيون'], ['fill', '🪣', 'تعبئة'], ['sticker', '⭐', 'ملصقات'], ['bg', '🎨', 'الخلفية'], ['page', '🖍️', 'تلوين'], ['erase', '🧽', 'ممحاة']];
    var fam = live(), famImgs = {};
    fam.forEach(function (id) { avatarImage(id, 240).then(function (c) { famImgs[id] = c; }); });
    var el = show('<div class="row"><button class="icb" id="dx" aria-label="إلغاء">' + ic('close') + '</button><span class="fd grow" style="font-size:23px;font-weight:800">ارسم لـ' + esc(chatTitle(chat)) + '</span>' +
      '<button class="icb" id="du" aria-label="تراجع">' + ic('undo') + '</button></div>' +
      '<div class="drawwrap" id="dw"><canvas id="cv"></canvas></div>' +
      '<div class="card col" style="gap:10px;padding:12px">' +
      '<div class="dtools">' + TOOLS.map(function (t) { return '<button data-tool="' + t[0] + '"' + (t[0] === tool ? ' class="on"' : '') + '><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</div>' +
      '<div id="dctx"></div>' +
      '<div class="row sizes"><button data-s="4" aria-label="صغير"><span class="dot8" style="width:6px;height:6px;background:var(--ink)"></span></button><button data-s="10" class="on" aria-label="وسط"><span class="dot8" style="width:12px;height:12px;background:var(--ink)"></span></button><button data-s="22" aria-label="كبير"><span class="dot8" style="width:20px;height:20px;background:var(--ink)"></span></button>' +
      '<button class="btn grow" id="ds">إرسال ' + ic('send', 'style="transform:scaleX(-1)"') + '</button></div></div>', '');
    el.style.height = '100dvh';
    var cv = $('#cv'), wrap = $('#dw'), ctx = cv.getContext('2d', { willReadFrequently: true }), dpr = Math.min(2, window.devicePixelRatio || 1);
    function bgColor() { for (var i = ops.length - 1; i >= 0; i--) if (ops[i].t === 'bg') return ops[i].c; return '#FFFFFF'; }
    function curPage() { for (var i = ops.length - 1; i >= 0; i--) if (ops[i].t === 'pg') return ops[i].k; return null; }
    function fit() { var r = wrap.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; redraw(); }
    function seg(s, from) {
      ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = s.w * dpr; ctx.shadowBlur = 0;
      var P = s.p, X = function (p) { return p[0] * cv.width; }, Y = function (p) { return p[1] * cv.height; };
      if (s.rb) {
        for (var i = Math.max(1, from || 1); i < P.length; i++) { ctx.strokeStyle = 'hsl(' + ((s.h + i * 7) % 360) + ',90%,55%)'; ctx.beginPath(); ctx.moveTo(X(P[i - 1]), Y(P[i - 1])); ctx.lineTo(X(P[i]), Y(P[i])); ctx.stroke(); }
        if (P.length === 1) { ctx.strokeStyle = 'hsl(' + s.h + ',90%,55%)'; ctx.beginPath(); ctx.moveTo(X(P[0]), Y(P[0])); ctx.lineTo(X(P[0]) + .1, Y(P[0])); ctx.stroke(); }
        return;
      }
      ctx.strokeStyle = s.e ? bgColor() : s.c;
      if (s.g) { ctx.shadowColor = s.c; ctx.shadowBlur = 14 * dpr; }
      var st = Math.max(0, (from || 0) - 1);
      ctx.beginPath(); for (var j = st; j < P.length; j++) { if (j === st) ctx.moveTo(X(P[j]), Y(P[j])); else ctx.lineTo(X(P[j]), Y(P[j])); }
      if (P.length - st === 1) ctx.lineTo(X(P[st]) + .1, Y(P[st]));
      ctx.stroke();
      if (s.g) { ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1.5, s.w * .35) * dpr; ctx.stroke(); }
    }
    function stamp(o) {
      var px = o.z * cv.width; ctx.shadowBlur = 0;
      if (o.av) { var im = famImgs[o.av]; if (im) ctx.drawImage(im, o.x * cv.width - px / 2, o.y * cv.height - px / 2, px, px); return; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = px + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.fillText(o.ch, o.x * cv.width, o.y * cv.height);
    }
    function pageLines(k) {
      var pg = PAGES[k]; if (!pg) return;
      var sc = Math.min(cv.width, cv.height) / 100 * .92, ox = (cv.width - 100 * sc) / 2, oy = (cv.height - 100 * sc) / 2;
      ctx.save(); ctx.shadowBlur = 0; ctx.translate(ox, oy); ctx.scale(sc, sc);
      ctx.lineWidth = 1.6; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#1B2333';
      pg.p.forEach(function (d) { try { ctx.stroke(new Path2D(d)); } catch (e) {} });
      ctx.restore();
    }
    /* التعبئة: نلوّن المنطقة المقفلة (مثل السطل) */
    function flood(o) {
      var W = cv.width, H = cv.height, x0 = Math.floor(o.x * W), y0 = Math.floor(o.y * H);
      if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return;
      var img = ctx.getImageData(0, 0, W, H), d = new Uint32Array(img.data.buffer);
      var seed = d[y0 * W + x0], sr = seed & 255, sg = (seed >> 8) & 255, sb = (seed >> 16) & 255;
      var n = parseInt(o.c.slice(1), 16), fill = (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16);
      if (fill === seed) return;
      var tol = 90, seen = new Uint8Array(W * H);
      var same = function (i) { var v = d[i]; return Math.abs((v & 255) - sr) + Math.abs(((v >> 8) & 255) - sg) + Math.abs(((v >> 16) & 255) - sb) <= tol; };
      var stack = [x0, y0];
      while (stack.length) {
        var y = stack.pop(), x = stack.pop(), i = y * W + x;
        while (x >= 0 && !seen[i] && same(i)) { x--; i--; }
        x++; i++;
        var up = false, dn = false;
        while (x < W && !seen[i] && same(i)) {
          d[i] = fill; seen[i] = 1;
          if (y > 0) { var iu = i - W; if (!seen[iu] && same(iu)) { if (!up) { stack.push(x, y - 1); up = true; } } else up = false; }
          if (y < H - 1) { var id = i + W; if (!seen[id] && same(id)) { if (!dn) { stack.push(x, y + 1); dn = true; } } else dn = false; }
          x++; i++;
        }
      }
      // نوسّع اللون بكسل وحد عشان ما يبقى خط أبيض عند الحواف
      for (var k = 0; k < d.length; k++) if (seen[k]) {
        if (k % W && !seen[k - 1]) d[k - 1] = fill;
        if ((k + 1) % W && !seen[k + 1]) d[k + 1] = fill;
      }
      ctx.putImageData(img, 0, 0);
    }
    function redraw(skip) {
      var pk = curPage();
      ctx.shadowBlur = 0; ctx.fillStyle = bgColor(); ctx.fillRect(0, 0, cv.width, cv.height);
      if (pk) pageLines(pk);
      ops.forEach(function (o) { if (o === skip) return; if (o.t === 's') seg(o); else if (o.t === 'f') flood(o); });
      if (pk) pageLines(pk);
      // الملصقات فوق خطوط صفحة التلوين
      ops.forEach(function (o) { if (o !== skip && o.t === 'st') stamp(o); });
    }
    // نصوّر الرسمة قبل الحركة، وأثناء السحب نرسم فوق الصورة بس (أسرع)
    function takeSnap() { snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; redraw(cur); snap.getContext('2d').drawImage(cv, 0, 0); }
    function fromSnap() { ctx.shadowBlur = 0; ctx.drawImage(snap, 0, 0); if (cur.t === 'st') stamp(cur); else seg(cur); var pk = curPage(); if (pk) pageLines(pk); }
    function pt(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
    cv.onpointerdown = function (e) {
      cv.setPointerCapture(e.pointerId); var p = pt(e);
      if (tool === 'bg' || tool === 'page') return;
      if (tool === 'fill') { var o = { t: 'f', x: p[0], y: p[1], c: color }; ops.push(o); flood(o); var pk = curPage(); if (pk) pageLines(pk); if (navigator.vibrate) navigator.vibrate(15); return; }
      if (tool === 'sticker') {
        var z = (size === 4 ? 40 : size === 10 ? 70 : 120) / cv.getBoundingClientRect().width;
        cur = /^av:/.test(sticker) ? { t: 'st', av: sticker.slice(3), x: p[0], y: p[1], z: z * 1.15 } : { t: 'st', ch: sticker, x: p[0], y: p[1], z: z };
        ops.push(cur); takeSnap(); fromSnap(); if (navigator.vibrate) navigator.vibrate(15); return;
      }
      cur = { t: 's', c: color, w: tool === 'erase' ? Math.max(24, size * 2) : size, e: tool === 'erase', rb: tool === 'rainbow', g: tool === 'glow', h: Math.floor(Math.random() * 360), p: [p] };
      ops.push(cur);
      if (cur.g) { takeSnap(); fromSnap(); } else seg(cur);
    };
    cv.onpointermove = function (e) {
      if (!cur) return; var p = pt(e);
      if (cur.t === 'st') { cur.x = p[0]; cur.y = p[1]; fromSnap(); return; }
      cur.p.push(p); if (cur.g) fromSnap(); else seg(cur, cur.p.length - 1);
    };
    cv.onpointerup = cv.onpointercancel = function () { if (cur && curPage() && !cur.g && cur.t !== 'st') pageLines(curPage()); cur = null; snap = null; };
    function colorRow() { return '<div class="drow">' + COLORS.map(function (c, i) { return '<button class="sw' + (c === color ? ' on' : '') + '" data-c="' + c + '" aria-label="' + CN[i] + '" style="background:' + c + '"></button>'; }).join('') + '</div>'; }
    function paintCtx() {
      var box = $('#dctx'), h;
      if (tool === 'sticker') h = '<div class="drow">' + fam.map(function (id) { return '<button class="stk' + (sticker === 'av:' + id ? ' on' : '') + '" data-stk="av:' + id + '">' + av(id, 36) + '</button>'; }).join('') + STICKERS.map(function (x) { return '<button class="stk' + (x === sticker ? ' on' : '') + '" data-stk="' + x + '">' + x + '</button>'; }).join('') + '</div><span class="tiny muted" style="display:block;margin-top:4px">اضغط على الرسمة تحط الملصق، واسحب تحرّكه · فيه صور العائلة بعد!</span>';
      else if (tool === 'bg') h = '<div class="drow">' + BGS.map(function (c) { return '<button class="sw' + (c === bgColor() ? ' on' : '') + '" data-bgc="' + c + '" aria-label="لون الخلفية" style="background:' + c + '"></button>'; }).join('') + '</div><span class="tiny muted" style="display:block;margin-top:4px">اختر لون وتتلوّن الخلفية كاملة (رسمتك تبقى فوقها)</span>';
      else if (tool === 'page') h = '<div class="drow">' + Object.keys(PAGES).map(function (k) { return '<button class="pgb' + (curPage() === k ? ' on' : '') + '" data-pg="' + k + '"><svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + PAGES[k].p.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g></svg>' + PAGES[k].n + '</button>'; }).join('') + '</div><span class="tiny muted" style="display:block;margin-top:4px">اختر صفحة، وبعدين لوّنها بـ 🪣 التعبئة أو بالقلم</span>';
      else if (tool === 'rainbow') h = '<span class="small muted" style="display:block;padding:10px 4px">🌈 ارسم وتطلع الألوان لحالها!</span>';
      else if (tool === 'erase') h = '<span class="small muted" style="display:block;padding:10px 4px">🧽 امسح بإصبعك · الحجم من تحت</span>';
      else h = colorRow() + (tool === 'fill' ? '<span class="tiny muted" style="display:block;margin-top:4px">اضغط داخل أي شكل يتلوّن كله 🪣</span>' : '');
      box.innerHTML = h;
      box.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { color = b.dataset.c; paintCtx(); }; });
      box.querySelectorAll('[data-stk]').forEach(function (b) { b.onclick = function () { sticker = b.dataset.stk; paintCtx(); }; });
      box.querySelectorAll('[data-bgc]').forEach(function (b) { b.onclick = function () { if (b.dataset.bgc !== bgColor()) { ops.push({ t: 'bg', c: b.dataset.bgc }); redraw(); } paintCtx(); }; });
      box.querySelectorAll('[data-pg]').forEach(function (b) { b.onclick = function () {
        var k = b.dataset.pg, go = function () { ops.push({ t: 'pg', k: k }); redraw(); setTool('fill'); };
        if (ops.some(function (o) { return o.t === 's' || o.t === 'st' || o.t === 'f'; }) && curPage() !== k) { if (!confirm('نبدأ صفحة جديدة؟ الرسمة الحالية بتنمسح')) return; ops = []; }
        go();
      }; });
    }
    function setTool(t) { tool = t; el.querySelectorAll('[data-tool]').forEach(function (x) { x.classList.toggle('on', x.dataset.tool === t); }); paintCtx(); }
    el.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { setTool(b.dataset.tool); }; });
    el.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { size = +b.dataset.s; el.querySelectorAll('[data-s]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#du').onclick = function () { ops.pop(); redraw(); paintCtx(); };
    $('#dx').onclick = function () { if (ops.length && !confirm('تلغي الرسمة؟')) return; openChat(chat); };
    $('#ds').onclick = function () {
      if (!ops.length) return toast('ارسم شي أول 🎨');
      var k = Math.min(1, 1080 / Math.max(cv.width, cv.height)), c2 = document.createElement('canvas');
      c2.width = Math.round(cv.width * k); c2.height = Math.round(cv.height * k); c2.getContext('2d').drawImage(cv, 0, 0, c2.width, c2.height);
      c2.toBlob(function (b) { S.chat = chat; openChat(chat); sendMsg('draw', { w: c2.width, h: c2.height }, b); }, 'image/jpeg', .88);
    };
    window.addEventListener('resize', function rs() { if (S.view !== 'draw') return window.removeEventListener('resize', rs); fit(); });
    paintCtx();
    setTimeout(fit, 30);
  }

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
      var rx = fresh.filter(function (m) { return m.k === 'react'; });
      if (fresh.length > rx.length) inAppAlert(fresh.filter(function (m) { return m.k !== 'react'; }));
      reactAlert(rx);
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
      var old = all.filter(function (m) { return m.t < cut && !m.out; });
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
            var rx = l.filter(function (m) { return m.k === 'react'; });
            if (l.length > rx.length) inAppAlert(l.filter(function (m) { return m.k !== 'react'; }));
            reactAlert(rx);
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
    copy: copy, shareCode: shareCode, editMe: editMe, parentGate: parentGate, theme: theme, setTheme: setTheme, grp: grp, grpIcon: grpIcon, showCode: showCode, wrapKey: wrapKey, newCode: newCode, normCode: normCode, enableNotif: enableNotif, notifState: notifState, notifPerm: notifPerm,
    checkUpdate: checkUpdate, doReload: doReload, pack: pack, unpack: NB.unpack, syncNow: syncNow, refreshRoles: refreshRoles, deviceHasAdmin: deviceHasAdmin, colorOf: colorOf,
    lostDevice: lostDevice, installTip: installTip, LOGO: LOGO, PLAY: PLAY, boot: boot, standalone: standalone, compress: compress, closeSheets: closeSheets
  };
})();
