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
    return fetch(API + path, init).then(function (r) {
      if (opt.text) return r.ok ? r.text() : Promise.reject({ status: r.status });
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { j.status = r.status; throw j; } return j; });
    }, function () { throw { error: 'network' }; });
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
      if (isParent(me) || isParent(id)) list.push(pairId(me, id));
    });
    return list;
  }
  function otherOf(chat) { var p = NB.chatParts(chat); return p ? (p[0] === S.me ? p[1] : p[0]) : null; }
  function chatTitle(chat) { return chat === 'g' ? 'العائلة' : nm(otherOf(chat)); }

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
      S.roles = f.roles || []; S.fam = { created: f.created, owner: f.owner, auto_del: f.auto_del, update_req: f.update_req };
      S.dev = { members: f.dev.members || [], trusted: f.dev.trusted || [] };
      S.reminder = !!f.dev.reminder;
      return NB.decJSON(f.blob).then(function (p) {
        S.prof = p; S.rev = f.rev;
        return Promise.all([NB.kv.set('profile', { rev: f.rev, data: p }), NB.kv.set('roles', S.roles), NB.kv.set('fam', S.fam), saveDev()]);
      });
    });
  }
  function saveProfile(extra) {
    extra = extra || {};
    var rev = S.rev + 1;
    return NB.encJSON(S.prof).then(function (blob) {
      return api('/profile', { member: S.me, blob: blob, rev: rev, add: extra.add || [], remove: extra.remove || [] });
    }).then(function () {
      S.rev = rev; return NB.kv.set('profile', { rev: rev, data: S.prof });
    }).then(function () { return refreshRoles(); }).catch(function (e) {
      if (e && e.error === 'stale') return loadFamily().then(function () { throw { error: 'stale' }; });
      throw e;
    });
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
        S.roles = j.roles; S.fam = { created: j.created, owner: j.owner, auto_del: j.auto_del, update_req: j.update_req };
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
    draft = { fam: '', me: { id: rid(9), name: 'بابا', kind: 'parent', g: 'm', av: { a: 'bear', bg: '#EADBCB' } }, list: [] };
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
        draft.me.av = draft.me.g === 'f' ? { a: 'rabbit', bg: '#FAD9E6' } : { a: 'bear', bg: '#EADBCB' };
        document.querySelectorAll('[data-g]').forEach(function (x) { x.classList.toggle('on', x === b); });
      };
    });
    $('#nx').onclick = function () {
      draft.fam = $('#fn').value.trim(); draft.me.name = $('#mn').value.trim();
      if (!draft.fam) return ($('#e1').textContent = 'اكتب اسم العائلة');
      if (!draft.me.name) return ($('#e1').textContent = 'اكتب اسمك');
      if (!draft.list.length) draft.list.push({ id: rid(9), name: draft.me.g === 'f' ? 'بابا' : 'ماما', kind: 'parent', g: draft.me.g === 'f' ? 'm' : 'f', av: draft.me.g === 'f' ? { a: 'bear', bg: '#EADBCB' } : { a: 'rabbit', bg: '#FAD9E6' } });
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
  function kindLabel(m) { return m.kind === 'parent' ? (m.g === 'f' ? 'أم' : 'أب') : (m.g === 'f' ? 'بنت' : 'ولد'); }

  /* نموذج فرد (إضافة أو تعديل) */
  function memberForm(m, done, opts) {
    opts = opts || {};
    var d = m ? JSON.parse(JSON.stringify(m)) : { id: rid(9), name: '', kind: 'child', g: 'f', av: { a: 'cat', bg: '#FFE3B3' } };
    var types = [['parent', 'm', 'أب'], ['parent', 'f', 'أم'], ['child', 'f', 'بنت'], ['child', 'm', 'ولد']];
    var keys = Object.keys(AVATARS);
    var sh = sheet('<div class="row"><h2 class="grow" style="font-size:22px">' + (m ? 'تعديل ' + esc(m.name) : 'فرد جديد') + '</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      '<label class="field"><span>الاسم</span><input class="inp" id="nn" maxlength="20" value="' + esc(d.name) + '" placeholder="مثلاً: يارا"></label>' +
      (opts.lockKind ? '' : '<div class="field"><span>النوع</span><div class="chips">' + types.map(function (t, i) { return '<button class="chip' + (d.kind === t[0] && d.g === t[1] ? ' on' : '') + '" data-t="' + i + '">' + t[2] + '</button>'; }).join('') + '</div></div>') +
      '<div class="field"><span>الصورة الرمزية</span><div class="avgrid">' + keys.map(function (k) {
        return '<button data-a="' + k + '" class="' + (d.av && d.av.a === k ? 'on' : '') + '" aria-label="' + AVATARS[k].n + '"><span class="av" style="width:64px;height:64px;background:' + AVATARS[k].bg + '"><svg viewBox="0 0 64 64">' + AVATARS[k].s + '</svg></span></button>';
      }).join('') + '</div></div><div class="err" id="me"></div><button class="btn block" id="ok">' + (m ? 'حفظ' : 'إضافة') + '</button>');
    $('#x', sh).onclick = function () { sh.remove(); };
    sh.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { var t = types[+b.dataset.t]; d.kind = t[0]; d.g = t[1]; sh.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    sh.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { d.av = { a: b.dataset.a, bg: AVATARS[b.dataset.a].bg }; sh.querySelectorAll('[data-a]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#ok', sh).onclick = function () {
      d.name = $('#nn', sh).value.trim();
      if (!d.name) return ($('#me', sh).textContent = 'اكتب الاسم');
      sh.remove(); done(d);
    };
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
    if ($('#more')) $('#more').onclick = function () { picker(true); };
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
    var el = show('<div class="row">' + av(S.me, 52) + '<div class="grow col" style="gap:0"><span class="small muted">' + greet() + '</span><span class="fd" style="font-size:26px;font-weight:800;line-height:1.1">' + esc(nm(S.me)) + '</span></div>' +
      '<button class="icb" id="sw" aria-label="تبديل الشخص">' + ic('swap') + '</button><button class="icb" id="st" aria-label="الإعدادات">' + ic('gear') + '</button></div>' +
      '<div class="col" id="chats" style="gap:12px"></div><div id="hn" style="margin-top:auto"></div>');
    $('#sw', el).onclick = function () { picker(); };
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
      var g = items.shift();
      items.sort(function (a, b) { return b.t - a.t; });
      items.unshift(g);
      box.innerHTML = items.map(function (it) {
        var fam = it.c === 'g', o = otherOf(it.c);
        var pv = it.last ? previewOf(it.last) : (fam ? 'ابدأوا السوالف 👋' : 'ابدأ السوالف 👋');
        return '<button class="chatcard' + (fam ? ' fam' : '') + '" data-c="' + esc(it.c) + '">' +
          (fam ? '<span class="homeic"><svg class="ic" viewBox="0 0 24 24" style="width:32px;height:32px;stroke:#fff">' + IC.home + '</svg></span>' : av(o, 62)) +
          '<span class="grow col" style="gap:3px"><span class="row" style="gap:8px;align-items:baseline"><span class="nm">' + (fam ? 'العائلة' : esc(nm(o))) + '</span>' +
          (fam ? '<span class="tiny" style="color:#D2EFEF">منذ ' + fmtDate(S.fam.created || S.acct.created) + '</span>' : '') + '</span>' +
          '<span class="pv">' + pv + '</span></span>' +
          (it.unread ? '<span class="badge">' + num(it.unread) + '</span>' : it.last && it.last.s === S.me ? tickSvg(it.last, fam) : '') + '</button>';
      }).join('');
      box.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { openChat(b.dataset.c); }; });
    });
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
    S.view = 'chat'; S.chat = chat;
    urls.forEach(URL.revokeObjectURL); urls = [];
    var o = otherOf(chat), canNudge = o && (isParent(S.me) || isAdmin(S.me)) && S.dev.trusted.indexOf(S.me) >= 0;
    app.innerHTML = '<section class="chat">' +
      '<div class="chathead"><button class="icb flat" id="bk" aria-label="رجوع">' + ic('back') + '</button>' +
      (chat === 'g' ? '<span class="homeic" style="width:46px;height:46px;border-radius:16px;background:var(--accent)"><svg class="ic" viewBox="0 0 24 24" style="stroke:#fff;width:26px;height:26px">' + IC.home + '</svg></span>' : av(o, 46)) +
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
  }
  function renderMsgs(scroll) {
    var box = $('#msgs'); if (!box || S.view !== 'chat') return;
    var chat = S.chat;
    NB.msgs.chat(chat).then(function (ms) {
      if (S.chat !== chat || S.view !== 'chat') return;
      var atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      urls.forEach(URL.revokeObjectURL); urls = [];
      var html = '', lastDay = '';
      ms.forEach(function (m) {
        var d = new Date(m.t).toDateString();
        if (d !== lastDay) { html += '<span class="day">' + fmtDay(m.t) + '</span>'; lastDay = d; }
        html += msgHTML(m);
      });
      if (!ms.length) html = '<div class="col center" style="margin:auto;gap:6px;color:var(--muted)">' + (chat === 'g' ? '<b>محادثة العائلة كلها</b><span class="small">ابدأوا السوالف 👋</span>' : av(otherOf(chat), 80) + '<b>' + esc(nm(otherOf(chat))) + '</b><span class="small">ابدأ السوالف 👋</span>') + '</div>';
      html += nudgeCardHTML();
      box.innerHTML = html;
      bindMsgs(box, ms);
      if (scroll || atBottom) box.scrollTop = box.scrollHeight;
      markRead(ms);
    });
  }
  function tickSvg(m) {
    if (m.out) return '<svg class="tick" viewBox="0 0 24 24" stroke="#8A93A6" aria-label="ما انرسلت بعد"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';
    var rec = chatMembers(m.chat).filter(function (x) { return x !== m.s; }), st = m.st || {};
    var all = rec.length > 0 && rec.every(function (x) { return (st[x] || 0) >= 2; }), any = rec.some(function (x) { return (st[x] || 0) >= 1; });
    if (!any && !all) return '<svg class="tick" viewBox="0 0 24 24" stroke="#8A93A6" aria-label="انرسلت"><path d="M4 12l5 5L20 6"/></svg>';
    return '<svg class="tick" viewBox="0 0 24 24" stroke="' + (all ? 'var(--accent)' : '#8A93A6') + '" aria-label="' + (all ? 'شافوها' : 'وصلت') + '"><path d="M2 12l5 5L18 6"/><path d="M9 17l1 1L22 6"/></svg>';
  }
  function msgHTML(m) {
    var mine = m.s === S.me, group = m.chat === 'g';
    var body = '';
    if (m.k === 'text') body = '<div class="bub">' + esc(m.text || '') + '</div>';
    else if (m.k === 'photo' || m.k === 'draw') {
      var u = m.blob ? URL.createObjectURL(m.blob) : ''; if (u) urls.push(u);
      body = '<div class="bub media">' + (u ? '<img src="' + u + '" data-view="' + m.id + '" alt="' + (m.k === 'draw' ? 'رسمة' : 'صورة') + '" style="' + (m.w ? 'aspect-ratio:' + m.w + '/' + m.h : '') + '">' : '<span class="small muted" style="padding:20px;display:block">جاري التحميل…</span>') + '</div>';
    } else if (m.k === 'voice') {
      var wf = m.wf || [], played = (m.st || {});
      body = '<div class="bub"><div class="voice" data-voice="' + m.id + '"><button class="pl" aria-label="تشغيل الرسالة الصوتية" style="color:' + (mine ? 'var(--accent)' : '#fff') + '">' + PLAY + '</button>' +
        '<span class="wave">' + (wf.length ? wf : new Array(28).fill(.4)).map(function (v) { return '<i style="height:' + Math.max(4, Math.round(v * 28)) + 'px"></i>'; }).join('') + '</span><span class="dur">' + fmtDur(m.dur || 0) + '</span></div></div>';
    }
    var meta = '<span class="meta">' + fmtTime(m.t) + (mine ? ' ' + tickSvg(m, group) + voiceNote(m) : '') + '</span>';
    return '<div class="m' + (mine ? ' me' : '') + '" data-id="' + m.id + '">' + (!mine && group ? av(m.s, 32) : '') +
      '<div class="col" style="gap:0;align-items:' + (mine ? 'flex-end' : 'flex-start') + ';min-width:0">' + (!mine && group ? '<span class="who2" style="color:' + colorOf(m.s) + '">' + esc(nm(m.s)) + '</span>' : '') + body + meta + '</div></div>';
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
      img.onclick = function () {
        var v = document.createElement('div'); v.className = 'viewer'; v.innerHTML = '<img src="' + img.src + '" alt="">';
        v.onclick = function () { v.remove(); }; document.body.appendChild(v);
      };
    });
    box.querySelectorAll('[data-voice]').forEach(function (el) { $('.pl', el).onclick = function () { playVoice(byId[el.dataset.voice], el); }; });
    var nc = $('#nstop', box); if (nc) nc.onclick = function () { stopNudge(nc.dataset.id); };
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
    if (items.length) api('/rcpt', { member: S.me, s: 2, items: items }).catch(function () {});
  }

  /* ----- الصوت ----- */
  var audio = null, audioEl = null, audioTimer = null;
  function stopAudio() {
    if (audio) { audio.pause(); audio = null; }
    if (audioTimer) clearInterval(audioTimer);
    if (audioEl) { $('.pl', audioEl).innerHTML = PLAY; audioEl.querySelectorAll('.wave i').forEach(function (i) { i.classList.remove('on'); }); audioEl = null; }
  }
  function playVoice(m, el) {
    if (!m || !m.blob) return;
    if (audioEl === el) { stopAudio(); return; }
    stopAudio();
    var u = URL.createObjectURL(m.blob);
    audio = new Audio(u); audioEl = el;
    $('.pl', el).innerHTML = PAUSE;
    var bars = el.querySelectorAll('.wave i');
    audio.onended = function () { URL.revokeObjectURL(u); stopAudio(); };
    audio.onerror = function () { stopAudio(); toast('ما قدرنا نشغّل الرسالة على هذا الجهاز'); };
    audio.play().catch(function () { stopAudio(); });
    audioTimer = setInterval(function () {
      if (!audio) return;
      var d = audio.duration && isFinite(audio.duration) ? audio.duration : (m.dur || 1);
      var k = Math.floor(audio.currentTime / d * bars.length);
      bars.forEach(function (b, i) { b.classList.toggle('on', i <= k); });
      $('.dur', el).textContent = fmtDur(audio.currentTime);
    }, 120);
    if (m.s !== S.me && !(m.heard || []).some(function (x) { return x === S.me; })) {
      m.heard = (m.heard || []).concat([S.me]); NB.msgs.put(m);
      api('/rcpt', { member: S.me, s: 3, items: [{ id: m.id, chat: m.chat, s: m.s }] }).catch(function () {});
    }
  }

  /* ----- الكتابة والإرسال ----- */
  function composer() {
    var c = $('#comp'); if (!c) return;
    c.innerHTML = '<div class="tools"><button class="dr" id="drB">' + ic('pen') + ' رسم</button><button class="ph" id="phB">' + ic('cam') + ' صورة</button></div>' +
      '<div class="sendrow"><label class="sr" for="txt">اكتب رسالة</label><textarea class="txt" id="txt" rows="1" placeholder="اكتب هنا…" maxlength="4000"></textarea>' +
      '<button class="mic" id="mic" aria-label="سجّل رسالة صوتية">' + ic('mic') + '</button></div><input type="file" id="pf" accept="image/*" hidden>';
    var t = $('#txt'), mic = $('#mic');
    var sync = function () {
      t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight) + 'px';
      var has = t.value.trim().length > 0;
      mic.innerHTML = has ? ic('send', 'style="transform:scaleX(-1)"') : ic('mic');
      mic.setAttribute('aria-label', has ? 'إرسال' : 'سجّل رسالة صوتية');
    };
    t.oninput = sync;
    t.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey && plat() === 'desktop') { e.preventDefault(); mic.click(); } };
    mic.onclick = function () {
      var v = t.value.trim();
      if (v) { t.value = ''; sync(); sendMsg('text', { text: v }); t.focus(); }
      else startRec();
    };
    $('#drB').onclick = drawScreen;
    $('#phB').onclick = pickPhoto;
    $('#pf').onchange = function () { var f = this.files[0]; this.value = ''; if (f) photoPreview(f); };
  }
  function busy() { return S.view === 'draw' || !!rec || ($('#txt') && $('#txt').value.trim()); }

  /* صيغة الرسالة: [طول الرأس ٤ بايت][رأس JSON][البيانات] ← تشفير */
  function pack(head, bytes) {
    var h = NB.te.encode(JSON.stringify(head)), out = new Uint8Array(4 + h.length + (bytes ? bytes.length : 0));
    new DataView(out.buffer).setUint32(0, h.length); out.set(h, 4); if (bytes) out.set(bytes, 4 + h.length);
    return out;
  }
  function unpack(u8) {
    var n = new DataView(u8.buffer, u8.byteOffset).getUint32(0);
    return { head: JSON.parse(NB.td.decode(u8.subarray(4, 4 + n))), data: u8.subarray(4 + n) };
  }
  function sendMsg(kind, o, blob) {
    var m = { id: rid(12), chat: S.chat, s: S.me, k: kind, t: Date.now(), st: {}, r: [S.me], out: 1 };
    var head = {};
    if (kind === 'text') { m.text = o.text; head.text = o.text; }
    else { m.blob = blob; m.mime = blob.type; head.mime = blob.type; ['dur', 'wf', 'w', 'h'].forEach(function (k) { if (o[k] != null) { m[k] = o[k]; head[k] = o[k]; } }); }
    return NB.msgs.put(m).then(function () { renderMsgs(true); return upload(m); });
  }
  function upload(m) {
    var bytesP = m.blob ? m.blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }) : Promise.resolve(null);
    var head = m.k === 'text' ? { text: m.text } : { mime: m.mime, dur: m.dur, wf: m.wf, w: m.w, h: m.h };
    return bytesP.then(function (bytes) {
      return Promise.all([NB.enc(pack(head, bytes)), m.k === 'text' ? NB.encJSON({ x: m.text.slice(0, 80) }) : Promise.resolve('')]);
    }).then(function (r) {
      if (r[0].length > 1950000) throw { error: 'toolarge' };
      var q = '?member=' + encodeURIComponent(m.s) + '&chat=' + encodeURIComponent(m.chat) + '&id=' + m.id + '&kind=' + m.k + (r[1] ? '&prev=' + r[1] : '');
      return api('/send' + q, null, { raw: r[0] });
    }).then(function () {
      delete m.out; delete m.err; return NB.msgs.put(m);
    }).then(function () { if (S.view === 'chat') renderMsgs(); else renderChats(); })
      .catch(function (e) {
        if (e && (e.error === 'toolarge' || e.status === 413)) { NB.msgs.del(m.id); toast('الملف كبير، جرّب أقصر أو أصغر'); renderMsgs(); }
        else if (e && e.status === 403) { NB.msgs.del(m.id); toast('ما تقدر ترسل في هذي المحادثة'); renderMsgs(); }
      });
  }
  function retryOutbox() {
    return NB.msgs.all().then(function (all) {
      var out = all.filter(function (m) { return m.out; });
      return out.reduce(function (p, m) { return p.then(function () { return upload(m); }); }, Promise.resolve());
    });
  }

  /* ----- تسجيل الصوت ----- */
  var rec = null;
  function startRec() {
    if (rec) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast('التسجيل غير مدعوم على هذا الجهاز');
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (stream) {
      var types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
      var type = ''; for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported(types[i])) { type = types[i]; break; }
      var mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 });
      var chunks = [], peaks = [], t0 = Date.now(), ac, an, buf;
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an); buf = new Uint8Array(an.fftSize); } catch (e) {}
      rec = { mr: mr, stream: stream, cancel: false };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (tr) { tr.stop(); });
        try { ac && ac.close(); } catch (e) {}
        clearInterval(rec.tick); clearInterval(rec.samp);
        var cancel = rec.cancel, dur = (Date.now() - t0) / 1000; rec = null; composer();
        if (cancel || dur < 0.7) return;
        var blob = new Blob(chunks, { type: (mr.mimeType || type || 'audio/webm').split(';')[0] });
        sendMsg('voice', { dur: Math.round(dur), wf: shrink(peaks, 32) }, blob);
      };
      mr.start(250);
      var c = $('#comp');
      c.innerHTML = '<div class="recbar"><button class="icb flat" id="rx" aria-label="إلغاء التسجيل" style="color:var(--danger)">' + ic('trash') + '</button>' +
        '<span class="recdot"></span><span class="fd" id="rt" style="font-size:22px;font-weight:700;font-variant-numeric:tabular-nums">0:00</span><span class="grow small muted">' + (isParent(S.me) ? 'يسجّل…' : 'تكلّم الحين…') + '</span>' +
        '<button class="mic" id="rs" aria-label="إرسال التسجيل">' + ic('send', 'style="transform:scaleX(-1)"') + '</button></div>';
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
  var COLORS = ['#1B2333', '#D4552B', '#F5B62A', '#23854D', '#2F6FDB', '#A13D8F', '#F28AB2', '#8A5A3C'];
  var CN = ['أسود', 'أحمر', 'أصفر', 'أخضر', 'أزرق', 'بنفسجي', 'وردي', 'بني'];
  function drawScreen() {
    var chat = S.chat; S.view = 'draw';
    var strokes = [], cur = null, color = COLORS[1], size = 10, erase = false;
    var el = show('<div class="row"><button class="icb" id="dx" aria-label="إلغاء">' + ic('close') + '</button><span class="fd grow" style="font-size:23px;font-weight:800">ارسم لـ' + esc(chatTitle(chat)) + '</span>' +
      '<button class="icb" id="du" aria-label="تراجع">' + ic('undo') + '</button></div>' +
      '<div class="drawwrap" id="dw"><canvas id="cv"></canvas></div>' +
      '<div class="card col" style="gap:12px;padding:14px"><div class="colors">' + COLORS.map(function (c, i) { return '<button data-c="' + c + '" aria-label="' + CN[i] + '" style="background:' + c + '"' + (i === 1 ? ' class="on"' : '') + '></button>'; }).join('') + '</div>' +
      '<div class="row sizes"><button data-s="4" aria-label="قلم رفيع"><span class="dot8" style="width:6px;height:6px;background:var(--ink)"></span></button><button data-s="10" class="on" aria-label="قلم وسط"><span class="dot8" style="width:12px;height:12px;background:var(--ink)"></span></button><button data-s="22" aria-label="قلم عريض"><span class="dot8" style="width:20px;height:20px;background:var(--ink)"></span></button>' +
      '<button id="er" aria-label="ممحاة">' + ic('eraser') + '</button><button class="btn grow" id="ds">إرسال ' + ic('send', 'style="transform:scaleX(-1)"') + '</button></div></div>', '');
    el.style.height = '100dvh';
    var cv = $('#cv'), wrap = $('#dw'), ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    function fit() { var r = wrap.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; redraw(); }
    function line(s) {
      ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = s.e ? '#fff' : s.c; ctx.lineWidth = s.w * dpr;
      ctx.beginPath(); s.p.forEach(function (p, i) { var x = p[0] * cv.width, y = p[1] * cv.height; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      if (s.p.length === 1) ctx.lineTo(s.p[0][0] * cv.width + .1, s.p[0][1] * cv.height);
      ctx.stroke();
    }
    function redraw() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); strokes.forEach(line); }
    function pt(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
    cv.onpointerdown = function (e) { cv.setPointerCapture(e.pointerId); cur = { c: color, w: erase ? 28 : size, e: erase, p: [pt(e)] }; strokes.push(cur); line(cur); };
    cv.onpointermove = function (e) { if (!cur) return; cur.p.push(pt(e)); var n = cur.p.length; line({ c: cur.c, w: cur.w, e: cur.e, p: cur.p.slice(n - 2) }); };
    cv.onpointerup = cv.onpointercancel = function () { cur = null; };
    el.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { color = b.dataset.c; erase = false; el.querySelectorAll('[data-c]').forEach(function (x) { x.classList.toggle('on', x === b); }); $('#er').classList.remove('on'); }; });
    el.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { size = +b.dataset.s; erase = false; el.querySelectorAll('[data-s]').forEach(function (x) { x.classList.toggle('on', x === b); }); $('#er').classList.remove('on'); }; });
    $('#er').onclick = function () { erase = !erase; this.classList.toggle('on', erase); };
    $('#du').onclick = function () { strokes.pop(); redraw(); };
    $('#dx').onclick = function () { if (strokes.length && !confirm('تلغي الرسمة؟')) return; openChat(chat); };
    $('#ds').onclick = function () {
      if (!strokes.length) return toast('ارسم شي أول 🎨');
      var k = Math.min(1, 1080 / Math.max(cv.width, cv.height)), c2 = document.createElement('canvas');
      c2.width = Math.round(cv.width * k); c2.height = Math.round(cv.height * k); c2.getContext('2d').drawImage(cv, 0, 0, c2.width, c2.height);
      c2.toBlob(function (b) { S.chat = chat; openChat(chat); sendMsg('draw', { w: c2.width, h: c2.height }, b); }, 'image/jpeg', .88);
    };
    window.addEventListener('resize', function rs() { if (S.view !== 'draw') return window.removeEventListener('resize', rs); fit(); });
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
      var lastV = ms.filter(function (m) { return m.s === d.f && m.k === 'voice' && m.blob; }).pop();
      if (lastV && Date.now() - lastV.t < 30 * 60e3) {
        var b = $('#nl', el); b.hidden = false; b.innerHTML = PLAY + ' اسمع الرسالة · ' + fmtDur(lastV.dur || 0);
        b.onclick = function () { stopBeat(); var a = new Audio(URL.createObjectURL(lastV.blob)); a.play().catch(function () {}); seenNudge(); };
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
  function seenNudge() { if (!nudgeOn) return; S.nudgeShown[nudgeOn.id] = 1; api('/nudge/state', { id: nudgeOn.id, state: 'seen' }).catch(function () {}); }
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
  function syncNow() { if (syncing) { again = true; return; } doSync(); }
  function doSync() {
    if (!S.acct || !S.acct.token) return;
    syncing = true;
    var changed = false, needFam = false;
    var body = syncBody();
    api('/sync', body).then(function (r) {
      applySync(r);
      if (r.fam && r.fam.rev > S.rev) needFam = true;
      // الرسائل الجديدة
      return r.msgs.reduce(function (p, m) {
        return p.then(function () {
          return (m.inline ? Promise.resolve(m.inline) : api('/m/' + m.id, undefined, { text: true })).then(NB.dec).then(function (u8) {
            var x = unpack(u8), h = x.head;
            var rec = { id: m.id, chat: m.chat, s: m.sender, k: m.kind, t: m.created, st: {}, r: [] };
            if (m.kind === 'text') rec.text = h.text;
            else { rec.blob = new Blob([x.data], { type: h.mime || '' }); rec.mime = h.mime; ['dur', 'wf', 'w', 'h'].forEach(function (k) { if (h[k] != null) rec[k] = h[k]; }); }
            return NB.msgs.get(m.id).then(function (old) { if (!old) { changed = true; return NB.msgs.put(rec); } });
          }).then(function () { S.acks.push(m.id); }, function (e) { if (e && e.status === 404) S.acks.push(m.id); });
        });
      }, Promise.resolve()).then(function () { return handleEvents(r.evs || []); }).then(function (c2) { changed = changed || c2; return r; });
    }).then(function () {
      if (needFam) return loadFamily().then(function () { changed = true; });
    }).then(function () {
      if (changed) refreshView();
      if (S.view === 'home' && !S.me) home();
    }).catch(function (e) {
      if (e && e.status === 401) return lostDevice();
      S.acks = body.ack.concat(S.acks); S.evAcks = body.evAck.concat(S.evAcks);
    }).then(function () {
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
        if (e.t === 'settings') { S.fam.auto_del = d.auto_del; return autoDelete(); }
        if (e.t === 'update') { checkUpdate(); return; }
        if (e.t === 'wipe') return wipe(d.m).then(function (n) { if (n) { changed = true; if (d.m === S.me) toast('انحذفت المحادثات من هذا الجهاز'); } });
        if (e.t === 'nudge') { if (Date.now() - (d.at || e.at) < 10 * 60e3) showNudge(d); return; }
        if (e.t === 'nudge_state') {
          if (S.nudges[d.id] || S.dev.members.indexOf(d.f) >= 0) {
            var n = S.nudges[d.id] || (S.nudges[d.id] = { id: d.id, to: d.to, at: e.at });
            if (n.state !== 'seen' && n.state !== 'stopped') n.state = d.state;
            n.n = Math.max(n.n || 1, d.n || 1); changed = true;
            if (d.state === 'seen' && S.chat === pairId(d.f, d.to) && navigator.vibrate) navigator.vibrate(80);
          }
          if (nudgeOn && nudgeOn.id === d.id && d.state === 'stopped') closeNudge();
          return;
        }
        if (e.t === 'profile' || e.t === 'roles') { changed = true; return loadFamily(); }
      });
    }, Promise.resolve()).then(function () { return changed; });
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
    if (document.visibilityState === 'visible') { syncNow(); if (S.view === 'chat') renderMsgs(); checkUpdate(); }
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
      return NB.kv.get('endpoint').then(function (old) {
        if (!force && old === s.endpoint) return;
        return api('/sub', { endpoint: s.endpoint }).then(function () { return NB.kv.set('endpoint', s.endpoint); });
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
        if (d.type === 'push') syncNow();
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
    copy: copy, shareCode: shareCode, showCode: showCode, wrapKey: wrapKey, newCode: newCode, normCode: normCode, enableNotif: enableNotif, notifState: notifState, notifPerm: notifPerm,
    checkUpdate: checkUpdate, doReload: doReload, pack: pack, unpack: unpack, syncNow: syncNow, refreshRoles: refreshRoles, deviceHasAdmin: deviceHasAdmin, colorOf: colorOf,
    lostDevice: lostDevice, installTip: installTip, LOGO: LOGO, PLAY: PLAY, boot: boot, standalone: standalone, compress: compress, closeSheets: closeSheets
  };
})();
