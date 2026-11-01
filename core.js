/* نَبْض | NABD — النواة المشتركة بين التطبيق و sw.js
   التخزين على الجهاز (IndexedDB) + التشفير بمفتاح العائلة (AES-GCM) + أسماء الأفراد */
var NB = (function () {
  'use strict';
  var DBN = 'nabd', dbp = null;

  /* ---------- IndexedDB ---------- */
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('msgs')) {
          var s = d.createObjectStore('msgs', { keyPath: 'id' });
          s.createIndex('chat', ['chat', 't']);
          s.createIndex('t', 't');
        }
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(store, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(store, mode), s = t.objectStore(store), out;
        var r = fn(s);
        if (r && 'onsuccess' in r) r.onsuccess = function () { out = r.result; };
        t.oncomplete = function () { res(out); };
        t.onerror = t.onabort = function () { rej(t.error); };
      });
    });
  }
  var kv = {
    get: function (k) { return tx('kv', 'readonly', function (s) { return s.get(k); }); },
    set: function (k, v) { return tx('kv', 'readwrite', function (s) { return s.put(v, k); }); },
    del: function (k) { return tx('kv', 'readwrite', function (s) { return s.delete(k); }); }
  };
  var msgs = {
    put: function (m) { return tx('msgs', 'readwrite', function (s) { return s.put(m); }); },
    get: function (id) { return tx('msgs', 'readonly', function (s) { return s.get(id); }); },
    del: function (id) { return tx('msgs', 'readwrite', function (s) { return s.delete(id); }); },
    chat: function (chat) {
      return tx('msgs', 'readonly', function (s) { return s.index('chat').getAll(IDBKeyRange.bound([chat, 0], [chat, Infinity])); });
    },
    all: function () { return tx('msgs', 'readonly', function (s) { return s.getAll(); }); },
    clear: function () { return tx('msgs', 'readwrite', function (s) { return s.clear(); }); }
  };

  /* ---------- base64url ---------- */
  function b64e(bytes) {
    bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    var s = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64d(str) {
    var s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4));
    var a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  var te = new TextEncoder(), td = new TextDecoder();

  /* ---------- التشفير ---------- */
  var keyCache = null, keyRaw = null;
  function famKey() {
    return kv.get('acct').then(function (a) {
      if (!a || !a.key) throw new Error('nokey');
      if (keyCache && keyRaw === a.key) return keyCache;
      keyRaw = a.key;
      return (keyCache = crypto.subtle.importKey('raw', b64d(a.key), 'AES-GCM', false, ['encrypt', 'decrypt']));
    });
  }
  function enc(bytes) {
    return famKey().then(function (k) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, bytes).then(function (ct) {
        var out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12);
        return b64e(out);
      });
    });
  }
  function dec(str) {
    return famKey().then(function (k) {
      var a = b64d(str);
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: a.subarray(0, 12) }, k, a.subarray(12)).then(function (p) { return new Uint8Array(p); });
    });
  }
  function encJSON(o) { return enc(te.encode(JSON.stringify(o))); }
  function decJSON(s) { return dec(s).then(function (b) { return JSON.parse(td.decode(b)); }); }

  /* ---------- الأسماء ---------- */
  function profile() { return kv.get('profile').then(function (p) { return (p && p.data) || { name: '', members: {} }; }); }
  function nameOf(p, id) { var m = p.members && p.members[id]; return (m && m.name) || 'أحد العائلة'; }
  function chatParts(chat) { if (chat === 'g') return null; var m = /^p:([^:]+):([^:]+)$/.exec(chat || ''); return m ? [m[1], m[2]] : null; }
  var KIND = { text: 'رسالة', voice: '🎤 رسالة صوتية', photo: '📷 صورة', draw: '🎨 رسمة' };

  /* الوسائط تنحفظ كبايتات (ArrayBuffer) مو Blob: آيفون يضيّع الـBlob المحفوظ في IndexedDB أحياناً */
  function media(m) { if (!m) return null; if (m.buf) return new Blob([m.buf], { type: m.mime || '' }); return m.blob || null; }
  function mediaSize(m) { return m.buf ? m.buf.byteLength : m.blob ? m.blob.size : 0; }

  return { media: media, mediaSize: mediaSize, kv: kv, msgs: msgs, b64e: b64e, b64d: b64d, te: te, td: td, enc: enc, dec: dec, encJSON: encJSON, decJSON: decJSON, profile: profile, nameOf: nameOf, chatParts: chatParts, KIND: KIND, db: db };
})();
