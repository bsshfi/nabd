/* نَبْض — النسخ الاحتياطي على Google Drive (لولي الأمر)
   الدخول بحساب Google عن طريق «مفتاح الدخول» CONFIG.GCLIENT، وبصلاحية drive.file بس:
   نبض يشوف ويعدّل الملفات اللي هو سواها في Drive فقط، وما يقدر يفتح باقي ملفاتك.
   - الكمبيوتر والأندرويد: نافذة Google صغيرة (popup)
   - الآيفون من الشاشة الرئيسية: نروح لصفحة Google ونرجع (redirect)، لأن النوافذ المنبثقة ما تشتغل زين هناك */
var GD = (function () {
  'use strict';
  var SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var FOLDER = 'نبض — نسخ احتياطية';
  var tok = null, exp = 0, gisP = null;

  // رجعنا من صفحة Google (redirect): نلقط التوكن من الرابط قبل أي شي ثاني
  (function () {
    try {
      var h = location.hash || '';
      if (h.indexOf('access_token=') < 0 || h.indexOf('state=gd') < 0) return;
      var p = {}; h.slice(1).split('&').forEach(function (kv) { var i = kv.indexOf('='); p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); });
      tok = p.access_token; exp = Date.now() + (+p.expires_in || 3500) * 1000;
      sessionStorage.setItem('nabd-gd', JSON.stringify({ tok: tok, exp: exp, act: String(p.state || '').replace(/^gd:?/, '') }));
      history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {}
    try { var s = JSON.parse(sessionStorage.getItem('nabd-gd') || 'null'); if (s && s.exp > Date.now()) { tok = s.tok; exp = s.exp; } } catch (e) {}
  })();

  function ok() { return !!(window.CONFIG && CONFIG.GCLIENT); }
  function iosApp() {
    var ua = navigator.userAgent || '', ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    return ios && (navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
  }
  // نحمّل مكتبة Google مسبقاً (لازم تكون جاهزة قبل الضغطة، عشان النافذة ما تنمنع)
  function preload() {
    if (!ok() || iosApp()) return Promise.resolve();
    if (gisP) return gisP;
    gisP = new Promise(function (res, rej) {
      if (window.google && google.accounts && google.accounts.oauth2) return res();
      var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = function () { res(); }; s.onerror = function () { gisP = null; rej({ msg: 'ما قدرنا نوصل لـ Google' }); };
      document.head.appendChild(s);
    });
    return gisP;
  }
  function has() { return !!tok && Date.now() < exp - 60e3; }
  /* نطلب الدخول. act = وش نسوي بعد الرجوع لو صار redirect (backup / restore / pick) */
  function signIn(act) {
    if (has()) return Promise.resolve(tok);
    if (!ok()) return Promise.reject({ msg: 'Google Drive مو مفعّل بعد' });
    if (iosApp() || !(window.google && google.accounts && google.accounts.oauth2)) {
      if (!iosApp() && !(window.google && google.accounts)) { preload(); return Promise.reject({ msg: 'لحظة… جرّب الضغط مرة ثانية' }); }
      var u = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + encodeURIComponent(CONFIG.GCLIENT) +
        '&redirect_uri=' + encodeURIComponent(CONFIG.SITE + '/') + '&response_type=token&include_granted_scopes=true&prompt=select_account' +
        '&scope=' + encodeURIComponent(SCOPE) + '&state=' + encodeURIComponent('gd:' + (act || ''));
      location.href = u;
      return new Promise(function () {});   // الصفحة بتنتقل
    }
    return new Promise(function (res, rej) {
      var c = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.GCLIENT, scope: SCOPE,
        callback: function (r) {
          if (!r || r.error) return rej({ msg: 'ما تم الدخول لـ Google' });
          tok = r.access_token; exp = Date.now() + (+r.expires_in || 3500) * 1000;
          try { sessionStorage.setItem('nabd-gd', JSON.stringify({ tok: tok, exp: exp })); } catch (e) {}
          res(tok);
        },
        error_callback: function (e) { rej({ msg: e && e.type === 'popup_closed' ? 'انقفلت نافذة Google' : 'ما قدرنا نفتح نافذة Google' }); }
      });
      c.requestAccessToken({ prompt: '' });
    });
  }
  /* بعد الرجوع من Google: وش كان المطلوب؟ (مرة وحدة) */
  function takeAct() {
    try {
      var s = JSON.parse(sessionStorage.getItem('nabd-gd') || 'null');
      if (!s || !s.act) return '';
      var a = s.act; s.act = ''; sessionStorage.setItem('nabd-gd', JSON.stringify(s)); return a;
    } catch (e) { return ''; }
  }
  function signOut() { tok = null; exp = 0; try { sessionStorage.removeItem('nabd-gd'); } catch (e) {} }

  function call(url, opt) {
    opt = opt || {}; opt.headers = Object.assign({ Authorization: 'Bearer ' + tok }, opt.headers || {});
    return fetch(url, opt).then(function (r) {
      if (r.status === 401) { signOut(); throw { msg: 'انتهى الدخول، اضغط مرة ثانية', auth: true }; }
      if (!r.ok) return r.text().then(function (t) { throw { msg: 'Google Drive رفض الطلب (' + r.status + ')', detail: t }; });
      return r;
    });
  }
  var API = 'https://www.googleapis.com/drive/v3/files';
  function folder() {
    return NB.kv.get('gdFolder').then(function (id) {
      var find = function () {
        var q = "name='" + FOLDER.replace(/'/g, "\\'") + "' and mimeType='application/vnd.google-apps.folder' and trashed=false";
        return call(API + '?q=' + encodeURIComponent(q) + '&fields=files(id)&pageSize=1').then(function (r) { return r.json(); }).then(function (j) {
          if (j.files && j.files[0]) return j.files[0].id;
          return call(API + '?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: FOLDER, mimeType: 'application/vnd.google-apps.folder' }) }).then(function (r) { return r.json(); }).then(function (f) { return f.id; });
        }).then(function (fid) { NB.kv.set('gdFolder', fid); return fid; });
      };
      if (!id) return find();
      return call(API + '/' + id + '?fields=id,trashed').then(function (r) { return r.json(); }).then(function (f) { return f && !f.trashed ? id : find(); }, find);
    });
  }
  /* رفع ملف (رفع على دفعات يتحمّل الملفات الكبيرة) */
  function upload(file, props) {
    return folder().then(function (fid) {
      var meta = { name: file.name, parents: [fid], mimeType: 'application/json', appProperties: props || {} };
      return call('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
        method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'application/json', 'X-Upload-Content-Length': String(file.size) }, body: JSON.stringify(meta)
      }).then(function (r) {
        var loc = r.headers.get('Location');
        if (loc) return fetch(loc, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: file }).then(function (r2) { if (!r2.ok) throw { msg: 'ما كمل الرفع (' + r2.status + ')' }; return r2.json(); });
        // احتياط: رفع عادي بخطوة وحدة
        var b = 'nabd' + Date.now(), body = new Blob(['--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) + '\r\n--' + b + '\r\nContent-Type: application/json\r\n\r\n', file, '\r\n--' + b + '--']);
        return call('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: body }).then(function (r3) { return r3.json(); });
      });
    });
  }
  function list() {
    return folder().then(function (fid) {
      var q = "'" + fid + "' in parents and trashed=false";
      return call(API + '?q=' + encodeURIComponent(q) + '&orderBy=createdTime desc&pageSize=30&fields=files(id,name,size,createdTime,appProperties)').then(function (r) { return r.json(); }).then(function (j) { return j.files || []; });
    });
  }
  function download(id) { return call(API + '/' + id + '?alt=media').then(function (r) { return r.blob(); }); }
  /* إيميل حساب Google المربوط (نعرضه تحت «آخر نسخة») */
  function email() { return call('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)').then(function (r) { return r.json(); }).then(function (j) { return (j.user && j.user.emailAddress) || ''; }, function () { return ''; }); }
  function remove(id) { return call(API + '/' + id, { method: 'DELETE' }).then(function () {}, function () {}); }
  /* نخلي آخر ٦ نسخ بس */
  function prune(keep) { return list().then(function (l) { return Promise.all(l.slice(keep || 6).map(function (f) { return remove(f.id); })); }); }

  return { email: email, ok: ok, iosApp: iosApp, preload: preload, has: has, signIn: signIn, signOut: signOut, takeAct: takeAct, upload: upload, list: list, download: download, prune: prune };
})();
