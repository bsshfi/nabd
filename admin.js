/* نَبْض | NABD — التطبيق (٢): الإعدادات، إدارة الأفراد، أجهزة العائلة، النسخ الاحتياطي */
(function (A) {
  'use strict';
  var S = A.S, $ = A.$, esc = A.esc, ic = A.ic, av = A.av, nm = A.nm;

  function head(title, back, pill) {
    return '<div class="row">' + (back === false ? '' : '<button class="icb" id="bk" aria-label="رجوع">' + ic('back') + '</button>') + '<h2 class="grow fd" style="font-size:' + (back === false ? 26 : 24) + 'px">' + title + '</h2>' + (pill ? '<span class="pill">' + pill + '</span>' : '') + '</div>';
  }
  function bindBack(fn) { var b = $('#bk'); if (b) b.onclick = fn; }
  function canAdmin() { return A.isAdmin(S.me); }

  /* ================= الإعدادات ================= */
  A.settings = function () {
    S.view = 'settings';
    var admin = canAdmin(), parent = A.isParent(S.me) && S.dev.trusted.indexOf(S.me) >= 0;
    var ids = A.live();
    var el = A.show(head('الإعدادات', false, admin ? (A.isOwner(S.me) ? 'المدير الأساسي' : A.fem(S.me) ? 'مشرفة' : 'مشرف') : parent ? 'وليّ أمر' : '') +
      '<div class="card col" style="gap:12px"><div class="row" style="gap:10px">' + A.grpIcon(44, 14) + '<span class="grow col" style="gap:0"><span class="row" style="align-items:baseline;gap:8px;flex-wrap:wrap"><span class="fd" style="font-size:22px;font-weight:800">' + esc(S.prof.name) + '</span><span class="tiny soft">منذ ' + A.fmtDate(S.fam.created || S.acct.created) + '</span></span><span class="tiny muted">القروب: ' + esc(A.grp().name) + '</span></span>' +
      (admin ? '<button class="btn sm ghost" id="edG">' + ic('pen') + ' تعديل</button>' : '') + '</div>' +
      '<div class="row" style="flex-wrap:wrap;gap:8px">' + ids.map(function (id) { return '<button data-m="' + id + '" aria-label="' + esc(nm(id)) + '" class="col center" style="gap:2px;width:62px">' + av(id, 48) + '<span class="tiny" style="max-width:62px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(nm(id)) + '</span></button>'; }).join('') +
      (admin ? '<button id="addM" class="col center" style="gap:2px;width:62px"><span class="av" style="width:48px;height:48px;background:var(--accent-soft);color:var(--accent-ink)">' + ic('plus') + '</span><span class="tiny">إضافة</span></button>' : '') + '</div>' +
      (admin ? '<span class="tiny muted">اضغط على أي فرد لتعديل اسمه وصورته وصلاحياته</span>' : '') + '</div>' +
      (admin ? '<div class="list"><button id="goDev">' + ic('phone') + '<span class="grow">أجهزة العائلة</span><span class="tiny muted">التحديث والحذف والصلاحيات</span>' + ic('back', 'style="transform:scaleX(-1);color:var(--soft)"') + '</button>' +
        '<button id="goLink">' + ic('key') + '<span class="grow">ربط جهاز جديد</span>' + ic('back', 'style="transform:scaleX(-1);color:var(--soft)"') + '</button></div>' : '') +
      (parent ? '<div class="list"><button id="goBak">' + ic('down') + '<span class="grow">النسخ الاحتياطي' + (admin ? ' وكود العائلة' : '') + '</span>' + ic('back', 'style="transform:scaleX(-1);color:var(--soft)"') + '</button></div>' : '') +
      '<span class="label">التنبيهات</span><div class="list"><div id="nrow">' + ic('bell') + '<span class="grow" id="nst">…</span></div></div>' +
      '<span class="label">التخزين</span><div class="list"><div class="col" style="align-items:stretch;gap:8px"><span class="row" style="justify-content:space-between"><span>على هذا الجهاز</span><span class="small muted" id="sz">…</span></span><span class="bar"><i id="szb" style="display:block;width:0;background:var(--accent)"></i></span></div>' +
      '<div>' + ic('shield') + '<span class="grow col" style="gap:0"><span>الرسالة في السيرفر</span><span class="tiny muted">مشفّرة، وتنحذف أول ما توصل، وبحد أقصى ٣ أيام</span></span></div>' +
      '<div>' + ic('trash') + '<span class="grow col" style="gap:0"><span>الحذف التلقائي لهذا الجهاز</span><span class="tiny muted">' + autoDelText() + '</span></span></div></div>' +
      '<span class="label">المظهر</span><div class="seg" id="thm">' + [['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']].map(function (t) { return '<button data-th="' + t[0] + '" class="' + (A.theme() === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<span class="label">لون التطبيق لـ' + esc(nm(S.me)) + ' (في الفاتح)</span><div class="card skyrow">' + A.SKIES.map(function (k) { return '<button data-sky="' + k[0] + '" class="' + (A.sky() === k[0] ? 'on' : '') + '"><i style="background:linear-gradient(180deg,' + k[2] + ',#f4ede4)"></i>' + k[1] + '</button>'; }).join('') + '</div>' +
      '<span class="label">' + esc(nm(S.me)) + '</span><div class="list">' +
      (admin ? '' : '<button id="myAv">' + av(S.me, 28) + '<span class="grow">' + (parent ? 'تغيير اسمي وصورتي' : 'تغيير صورتي') + '</span></button>') +
      (parent ? '<button id="chPin">' + ic('lock') + '<span class="grow">تغيير رمزي السري</span></button>' : '') +
      '<button id="swp">' + ic('swap') + '<span class="grow">تبديل الشخص</span>' + (parent ? '' : '<span class="soft">' + ic('lock', 'style="width:16px;height:16px"') + '</span>') + '</button>' +
      '<button id="out" style="color:var(--danger)">' + ic('close') + '<span class="grow">خروج ' + esc(nm(S.me)) + ' من هذا الجهاز</span>' + (parent ? '' : '<span class="soft">' + ic('lock', 'style="width:16px;height:16px"') + '</span>') + '</button></div>' +
      '<span class="label">التطبيق</span><div class="list"><button id="upd">' + ic('refresh') + '<span class="grow">حدّث التطبيق الآن</span><span class="tiny muted" dir="ltr">v' + CONFIG.VERSION + '</span></button>' +
      '<button id="shareApp">' + ic('share') + '<span class="grow">شارك نَبْض مع عائلة ثانية</span></button></div>' +
      '<div class="row center" style="gap:8px;margin-top:6px"><span class="tiny muted">نَبْض · الإصدار ' + CONFIG.VERSION + '</span><a href="https://wamdarc.com" target="_blank" rel="noopener" class="wamd" style="text-decoration:none">WAMD ARC</a></div>' + A.tabBar('gear'), 'v2');
    bindBack(A.home);
    el.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { if (admin) memberSheet(b.dataset.m); }; });
    if ($('#addM')) $('#addM').onclick = addMember;
    if ($('#goDev')) $('#goDev').onclick = A.devices;
    if ($('#goLink')) $('#goLink').onclick = linkSheet;
    if ($('#goBak')) $('#goBak').onclick = A.backup;
    if ($('#myAv')) $('#myAv').onclick = A.editMe;
    if ($('#chPin')) $('#chPin').onclick = function () {
      A.setPin('رمزك السري الجديد', function (p) { A.api('/pin', { member: S.me, pin: p }).then(function () { A.toast('تغيّر الرمز ✓'); }, function () { A.toast('ما قدرنا نغيّره'); }); });
    };
    $('#swp').onclick = function () { A.parentGate(function () { A.picker(true); }, 'تبديل الشخص يحتاج رمز الأب أو الأم'); };
    if ($('#edG')) $('#edG').onclick = groupSheet;
    el.querySelectorAll('[data-sky]').forEach(function (b) { b.onclick = function () { A.setSky(b.dataset.sky); el.querySelectorAll('[data-sky]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    el.querySelectorAll('[data-th]').forEach(function (b) { b.onclick = function () { A.setTheme(b.dataset.th); el.querySelectorAll('[data-th]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#out').onclick = function () { A.parentGate(leaveDevice, 'خروج الشخص من الجهاز يحتاج رمز الأب أو الأم'); };
    function leaveDevice() {
      if (!confirm('تطلّع ' + nm(S.me) + ' من هذا الجهاز؟ ما توصله رسائله هنا بعدها.')) return;
      A.api('/unuse', { member: S.me }).then(function (r) { S.dev.members = r.members; S.dev.trusted = S.dev.trusted.filter(function (x) { return x !== S.me; }); S.me = null; NB.kv.set('dev', S.dev); NB.kv.del('me'); A.picker(true); }, function () { A.toast('ما فيه اتصال'); });
    }
    $('#upd').onclick = function () {
      var b = this; b.disabled = true;
      A.checkUpdate(true).then(function (has) {
        if (has) { A.toast('نحدّث… ✨'); setTimeout(function () { A.doReload(); }, 2500); }
        else fetch('config.js?ts=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
          var m = /VERSION:\s*'([^']+)'/.exec(t);
          if (m && m[1] !== CONFIG.VERSION) { A.toast('نحدّث إلى ' + m[1] + '…'); setTimeout(function () { A.doReload(); }, 2500); }
          else A.toast('عندك آخر نسخة ✓');
        }, function () { A.toast('عندك آخر نسخة ✓'); });
      }).then(function () { b.disabled = false; });
    };
    $('#shareApp').onclick = function () {
      var t = 'نَبْض: تطبيق تواصل للعائلة فقط، صوت وكتابة وصور ورسم 💙\n' + CONFIG.SITE;
      if (navigator.share) navigator.share({ title: 'نَبْض', text: t }).catch(function () {}); else A.copy(t);
    };
    paintNotif(); paintStorage();
  };
  function autoDelText() {
    if (A.deviceHasAdmin()) return 'ما ينطبق على المشرفين، رسائلك تبقى';
    var d = S.fam.auto_del;
    return d ? 'الرسائل الأقدم من ' + ({ 7: '٧ أيام', 30: '٣٠ يوم', 90: '٩٠ يوم' }[d] || d + ' يوم') + ' تنحذف من هذا الجهاز' : 'مقفل، الرسائل تبقى';
  }
  function paintNotif() {
    A.notifState().then(function (st) {
      var el = $('#nst'), row = $('#nrow'); if (!el) return;
      var txt = { on: 'شغالة ✓', off: 'مقفلة', denied: 'مقفلة من إعدادات المتصفح', 'ios-install': 'أضف نَبْض للشاشة الرئيسية أول', unsupported: 'غير مدعومة على هذا الجهاز' }[st];
      el.textContent = txt;
      if (st === 'off') { var b = document.createElement('button'); b.className = 'btn sm orange'; b.textContent = 'فعّل'; b.onclick = function () { A.enableNotif().then(paintNotif); }; row.appendChild(b); }
    });
  }
  function paintStorage() {
    Promise.all([navigator.storage && navigator.storage.estimate ? navigator.storage.estimate() : Promise.resolve(null), NB.msgs.all()]).then(function (r) {
      var e = r[0], n = r[1].length, el = $('#sz'); if (!el) return;
      var used = e && e.usage ? e.usage : r[1].reduce(function (t, m) { return t + NB.mediaSize(m) + ((m.text || '').length * 2); }, 0);
      el.textContent = mb(used) + ' · ' + A.num(n) + ' رسالة';
      if (e && e.quota) $('#szb').style.width = Math.max(1, Math.min(100, used / e.quota * 100 * 20)) + '%';
    });
  }
  function mb(b) { return b < 1048576 ? A.num(Math.max(1, Math.round(b / 1024))) + ' ك.ب' : A.num(Math.round(b / 104857.6) / 10) + ' م.ب'; }

  /* ----- قروب العائلة: الاسم والرمز واللون ----- */
  var GE = ['', '🏠', '🏡', '👨‍👩‍👧‍👦', '👨‍👩‍👧', '❤️', '💙', '💚', '🧡', '💜', '🌟', '🌙', '☀️', '🌴', '🐪', '🦅', '🌸', '🍉', '☕', '🎉', '⚽', '🎮', '🕌', '📚', '✈️', '🏕️', '🦁', '🐱'];
  var GC = ['#0F8B8D', '#3C5BD6', '#6C4BD6', '#A13D8F', '#C2410C', '#D4552B', '#23854D', '#1B2333'];
  function groupSheet() {
    var g = Object.assign({}, S.prof.group || {}), fam = S.prof.name;
    var sh = A.sheet('<div class="row"><h2 class="grow fd" style="font-size:22px">قروب العائلة</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      '<div id="gpv"></div>' +
      '<label class="field"><span>اسم القروب</span><input class="inp" id="gn" maxlength="24" placeholder="العائلة" value="' + esc(g.name || '') + '"></label>' +
      '<label class="field"><span>اسم العائلة (يظهر تحت «مين معنا؟»)</span><input class="inp" id="fn2" maxlength="30" value="' + esc(fam) + '"></label>' +
      '<div class="field"><span>الرمز</span><div class="avgrid" style="grid-template-columns:repeat(7,minmax(0,1fr));gap:8px">' + GE.map(function (e, i) {
        return '<button data-ge="' + i + '" class="' + ((g.e || '') === e ? 'on' : '') + '" style="width:44px;height:44px;font-size:24px;line-height:1;background:var(--card);box-shadow:0 1px 0 var(--line)" aria-label="' + (e || 'بيت') + '">' + (e || '<svg class="ic" viewBox="0 0 24 24">' + A.IC.home + '</svg>') + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><span>اللون</span><div class="row" style="justify-content:space-between">' + GC.map(function (c) { return '<button data-gc="' + c + '" aria-label="لون" style="width:38px;height:38px;border-radius:50%;background:' + c + ';border:3px solid var(--card);outline:' + ((g.c || GC[0]) === c ? '3px solid var(--ink)' : '0') + '"></button>'; }).join('') + '</div></div>' +
      '<button class="btn block" id="gs">حفظ</button>');
    function pv() {
      var keep = S.prof.group; S.prof.group = g;
      $('#gpv', sh).innerHTML = '<div class="chatcard fam" style="background:' + A.grp().c + ';pointer-events:none">' + A.grpIcon(56, 20) + '<span class="grow col" style="gap:2px"><span class="nm">' + esc(A.grp().name) + '</span><span class="pv">معاينة</span></span></div>';
      S.prof.group = keep;
    }
    $('#x', sh).onclick = function () { sh.remove(); };
    $('#gn', sh).oninput = function () { g.name = this.value.trim(); pv(); };
    sh.querySelectorAll('[data-ge]').forEach(function (b) { b.onclick = function () { g.e = GE[+b.dataset.ge]; sh.querySelectorAll('[data-ge]').forEach(function (x) { x.classList.toggle('on', x === b); }); pv(); }; });
    sh.querySelectorAll('[data-gc]').forEach(function (b) { b.onclick = function () { g.c = b.dataset.gc; sh.querySelectorAll('[data-gc]').forEach(function (x) { x.style.outline = x === b ? '3px solid var(--ink)' : '0'; }); pv(); }; });
    $('#gs', sh).onclick = function () {
      var oldG = S.prof.group, oldN = S.prof.name, nn = $('#fn2', sh).value.trim();
      A.saveProfile({}, function () { S.prof.group = { name: g.name || '', e: g.e || '', c: g.c || '' }; if (nn) S.prof.name = nn; })
        .then(function () { sh.remove(); A.toast('انحفظ ✓'); A.settings(); }, function () { S.prof.group = oldG; S.prof.name = oldN; A.toast('ما قدرنا نحفظ'); });
    };
    pv();
  }

  /* ----- ربط جهاز ----- */
  function linkSheet() {
    var sh = A.sheet('<h2 class="fd" style="font-size:22px">ربط جهاز جديد</h2>' +
      '<ol class="small muted" style="margin:0;padding-inline-start:20px;line-height:1.9"><li>افتح <b dir="ltr">nabd.wamdarc.com</b> على الجهاز الجديد</li><li>اكتب كود العائلة واضغط «رجّعني للعائلة»</li><li>اختار مين يستخدم الجهاز</li></ol>' +
      '<div class="inp code" style="height:auto;padding:16px;border-style:dashed;font-size:24px">' + esc(S.acct.code || '—') + '</div>' +
      '<div class="row"><button class="btn sm block" id="c1">' + ic('copy') + ' نسخ</button><button class="btn sm ghost block" id="s1">' + ic('share') + ' مشاركة الرابط</button></div>');
    $('#c1', sh).onclick = function () { A.copy(S.acct.code); };
    $('#s1', sh).onclick = A.shareCode;
  }

  /* ================= إدارة فرد ================= */
  function addMember() {
    A.memberForm(null, function (m) {
      A.saveProfile({ add: [{ id: m.id, kind: m.kind }] }, function () {
        S.prof.members[m.id] = { name: m.name, kind: m.kind, g: m.g, av: m.av, bd: m.bd || '' };
        S.prof.order = (S.prof.order || []).filter(function (x) { return x !== m.id; }).concat([m.id]);
      }).then(function () { A.toast('انضاف ' + m.name + ' ✓'); A.settings(); }, function () {
        delete S.prof.members[m.id]; A.toast('ما قدرنا نضيفه، جرّب مرة ثانية');
      });
    });
  }
  function memberSheet(id) {
    var r = A.role(id) || {}, owner = A.isOwner(id), meOwner = A.isOwner(S.me), m = A.member(id);
    var canTouch = meOwner || (!owner && !(r.admin && id !== S.me));
    var sh = A.sheet('<div class="col center" style="gap:6px">' + av(id, 96) + '<h2 class="fd" style="font-size:24px">' + esc(nm(id)) + '</h2><span class="small muted">' + A.kindLabel(m) + (owner ? ' · المدير الأساسي' : r.admin ? ' · مشرف' : '') + '</span></div>' +
      '<div class="list">' +
      '<button id="ed">' + ic('pen') + '<span class="grow">تعديل الاسم والنوع والصورة الرمزية</span></button>' +
      (meOwner && !owner ? '<button id="adm">' + ic('shield') + '<span class="grow col" style="gap:0"><span>مشرف</span><span class="tiny muted">بدونها تنطبق عليه إعدادات الإدارة مثل الأبناء</span></span><span class="tog' + (r.admin ? ' on' : '') + '"></span></button>' : '') +
      (meOwner && !owner && r.pin ? '<button id="rp">' + ic('lock') + '<span class="grow">تصفير الرمز السري</span></button>' : '') +
      (canTouch ? '<button id="wp" style="color:var(--danger)">' + ic('trash') + '<span class="grow">حذف محادثات ' + esc(nm(id)) + ' من أجهزته</span></button>' : '') +
      (!owner && canTouch && id !== S.me ? '<button id="rm" style="color:var(--danger)">' + ic('close') + '<span class="grow">حذف ' + esc(nm(id)) + ' من العائلة</span></button>' : '') +
      '</div><span class="tiny muted" style="text-align:center">' + (owner && !meOwner ? 'المدير الأساسي محمي، ما أحد يقدر يغيّر صلاحياته.' : 'الصورة الرمزية تتحدّث عند كل العائلة.') + '</span>');
    $('#ed', sh).onclick = function () {
      sh.remove();
      A.memberForm(Object.assign({ id: id }, m), function (d) {
        var old = JSON.stringify(S.prof.members[id]);
        A.saveProfile({}, function () { S.prof.members[id] = Object.assign({}, S.prof.members[id] || m, { name: d.name, av: d.av, g: d.g, bd: d.bd || '' }); }).then(function () { A.toast('انحفظ ✓'); A.settings(); }, function () { S.prof.members[id] = JSON.parse(old); A.toast('ما قدرنا نحفظ'); });
      }, { lockKind: true });
    };
    if ($('#adm', sh)) $('#adm', sh).onclick = function () {
      var on = !r.admin;
      if (on && !confirm('تعطي ' + nm(id) + ' صلاحية الإشراف؟ يقدر يدير الأجهزة والحذف والصور، لكن ما يقدر يشيل إدارتك.')) return;
      A.api('/admin/role', { member: S.me, target: id, on: on }).then(A.refreshRoles).then(function () { sh.remove(); A.toast(on ? (A.fem(id) ? 'صارت ' + nm(id) + ' مشرفة ✓' : 'صار ' + nm(id) + ' مشرف ✓') : 'انشالت الصلاحية'); A.settings(); }, function () { A.toast('ما قدرنا نغيّرها'); });
    };
    if ($('#rp', sh)) $('#rp', sh).onclick = function () {
      if (!confirm('نصفّر رمز ' + nm(id) + '؟ يختار رمز جديد أول ما يدخل.')) return;
      A.api('/pin', { member: S.me, target: id }).then(function () { A.toast('انصفّر ✓'); sh.remove(); A.refreshRoles(); }, function () { A.toast('ما قدرنا'); });
    };
    if ($('#wp', sh)) $('#wp', sh).onclick = function () { sh.remove(); wipeMember(id); };
    if ($('#rm', sh)) $('#rm', sh).onclick = function () {
      if (!confirm('تحذف ' + nm(id) + ' من العائلة؟ ما يقدر يرسل أو يستقبل بعدها.')) return;
      A.saveProfile({ remove: [id] }, function () { S.prof.order = (S.prof.order || []).filter(function (x) { return x !== id; }); }).then(function () { sh.remove(); A.toast('انحذف'); A.settings(); }, function () { A.toast('ما قدرنا نحذفه'); });
    };
  }
  function wipeMember(id) {
    if (!confirm('تحذف كل محادثات ' + nm(id) + ' من أجهزته؟ (العائلة والخاصة)\nإذا جهازه مطفي، تنحذف أول ما يتصل.')) return;
    A.api('/admin/wipe', { member: S.me, target: id }).then(function (r) {
      A.toast(r.devices ? 'انطلب الحذف من ' + A.num(r.devices) + ' جهاز ✓' : nm(id) + ' ما عنده أجهزة مربوطة', 3500);
    }, function (e) { A.toast(e && e.error === 'owner_protected' ? 'المدير الأساسي محمي' : e && e.error === 'admin_protected' ? 'ما تقدر تحذف محادثات مشرف' : 'ما قدرنا'); });
  }

  /* ================= أجهزة العائلة ================= */
  var PLN = { ios: 'آيفون', android: 'أندرويد', desktop: 'كمبيوتر', other: 'جهاز' };
  A.devices = function () {
    if (!canAdmin()) return A.settings();
    S.view = 'devices';
    var el = A.show(head('أجهزة العائلة', null, A.isOwner(S.me) ? 'المدير الأساسي' : A.fem(S.me) ? 'مشرفة' : 'مشرف') + '<div id="dv" class="col" style="gap:14px"><div class="card center">جاري التحميل…</div></div>');
    bindBack(A.settings);
    load();
    function load() {
      A.api('/admin/devices?member=' + encodeURIComponent(S.me)).then(function (j) { if (S.view === 'devices') render(j); }, function () { $('#dv').innerHTML = '<div class="notice red">ما قدرنا نجيب الأجهزة. تأكد من الاتصال.</div>'; });
    }
    function render(j) {
      S.devs = j;
      var latest = CONFIG.VERSION, devs = j.devices, upd = devs.filter(function (d) { return d.ver === latest; }).length;
      var ids = A.live(), meOwner = A.isOwner(S.me);
      var stat = function (id) {
        var ds = devs.filter(function (d) { return d.members.indexOf(id) >= 0; });
        if (!ds.length) return { on: false, txt: 'ما عنده جهاز مربوط', warn: '', ds: ds };
        var best = ds.slice().sort(function (a, b) { return b.last - a.last; })[0];
        var on = j.now - best.last < j.online_ms;
        var warn = ds.some(function (d) { return d.ver !== latest; }) ? ['var(--warn)', 'التحديث بانتظار الاتصال'] : ds.every(function (d) { return !d.push; }) ? ['var(--danger)', 'التنبيهات مقفلة على ' + (A.fem(id) ? 'جهازها' : 'جهازه')] : null;
        return { on: on, txt: (on ? (A.fem(id) ? 'متصلة' : 'متصل') : 'آخر اتصال ' + A.ago(best.last)) + ' · ' + esc(best.ver || '—'), warn: warn, ds: ds };
      };
      $('#dv').innerHTML =
        '<div style="background:var(--brand);border-radius:24px;padding:16px;color:#fff" class="col">' +
        '<div class="row">' + ic('refresh', 'style="width:26px;height:26px"') + '<span class="grow col" style="gap:0"><b style="font-size:17px">الإصدار ' + esc(latest) + '</b><span class="tiny" style="color:#D8DEFA">التحديث التلقائي شغال · ' + A.num(upd) + ' من ' + A.num(devs.length) + ' أجهزة محدّثة</span></span></div>' +
        '<div class="row" style="gap:6px">' + devs.map(function (d) { return '<span style="flex:1;height:8px;border-radius:99px;background:' + (d.ver === latest ? '#fff' : '#6F84E2') + '"></span>'; }).join('') + '</div>' +
        '<button class="btn" id="updAll" style="background:#fff;color:#2B3FA8">حدّث كل الأجهزة الآن</button></div>' +
        '<span class="label">الأفراد</span><div class="list">' + ids.map(function (id) {
          var s = stat(id), owner = A.isOwner(id), r = A.role(id) || {};
          var canWipe = meOwner || (!owner && !(r.admin && id !== S.me));
          return '<div><button data-d="' + id + '" class="row grow" style="gap:10px;text-align:start">' + av(id, 44) + '<span class="grow col" style="gap:1px"><b style="font-size:15px">' + esc(nm(id)) + '</b>' +
            '<span class="tiny row" style="gap:5px;color:' + (s.on ? 'var(--ok)' : 'var(--muted)') + '"><span class="dot8" style="background:' + (s.on ? '#23854D' : '#A6AFC0') + '"></span>' + s.txt + '</span>' +
            (s.warn ? '<span class="tiny" style="color:' + s.warn[0] + '">' + s.warn[1] + '</span>' : '') + '</span></button>' +
            (canWipe ? '<button class="icb flat" data-w="' + id + '" aria-label="حذف محادثات ' + esc(nm(id)) + '" style="background:var(--danger-soft);color:var(--danger)">' + ic('trash') + '</button>' : '') + '</div>';
        }).join('') + '</div>' +
        '<span class="label">الحذف التلقائي للمحادثات</span><div class="card col" style="gap:10px"><span class="small muted">تنحذف الرسائل والوسائط الأقدم من:</span>' +
        '<div class="chips" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr))">' + [[7, '٧ أيام'], [30, '٣٠ يوم'], [90, '٩٠ يوم'], [0, 'أبداً']].map(function (o) { return '<button class="chip' + (j.auto_del === o[0] ? ' on' : '') + '" data-ad="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
        '<span class="tiny muted">ينطبق على كل الأجهزة ما عدا المشرفين. قبل ما تختار مدة قصيرة، خذ نسخة كاملة من «النسخ الاحتياطي».</span></div>' +
        quietCard(j.quiet || S.fam.quiet || {}) +
        whoTalks() +
        '<span class="label">صلاحيات الإدارة</span><div class="list">' + ids.filter(function (id) { return A.isParent(id) || (A.role(id) || {}).admin || A.isOwner(id); }).concat(ids.filter(function (id) { return !A.isParent(id) && !(A.role(id) || {}).admin && !A.isOwner(id); })).map(function (id) {
          var owner = A.isOwner(id), r = A.role(id) || {};
          return '<div>' + av(id, 36) + '<span class="grow col" style="gap:0"><b style="font-size:15px">' + esc(nm(id)) + (owner ? '' : A.fem(id) ? ' مشرفة' : ' مشرف') + '</b>' + (owner ? '' : '<span class="tiny muted">بدونها تنطبق ' + (A.fem(id) ? 'عليها' : 'عليه') + ' إعدادات الإدارة مثل الأبناء</span>') + '</span>' +
            (owner ? '<span class="pill" style="background:var(--brand-soft);color:var(--brand-ink);font-weight:600">المدير الأساسي</span>' : meOwner ? '<button class="tog' + (r.admin ? ' on' : '') + '" data-ad2="' + id + '" role="switch" aria-checked="' + !!r.admin + '" aria-label="' + esc(nm(id)) + ' مشرف"></button>' : '<span class="tiny muted">' + (r.admin ? (A.fem(id) ? 'مشرفة' : 'مشرف') : '—') + '</span>') + '</div>';
        }).join('') + '</div>' +
        (meOwner ? '' : '<span class="tiny muted" style="text-align:center">المدير الأساسي بس يعطي ويشيل الإشراف.</span>');
      document.querySelectorAll('[data-lk]').forEach(function (b) {
        b.onclick = function () {
          var p = b.dataset.lk.split('|'), on = !b.classList.contains('on');
          A.api('/admin/links', { member: S.me, a: p[0], b: p[1], on: on }).then(function (r) {
            S.fam.links = r.links; b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
            A.toast(on ? A.nm(p[0]) + ' و' + A.nm(p[1]) + ' يقدرون يتراسلون ✓' : 'انقفلت المحادثة بينهم');
          }, function () { A.toast('ما قدرنا'); });
        };
      });
      $('#updAll').onclick = function () {
        var b = this; b.disabled = true;
        A.api('/admin/update', { member: S.me, ver: CONFIG.VERSION }).then(function () { A.toast('الأجهزة المتصلة تتحدّث الحين، والباقي أول ما تتصل ✓', 3500); setTimeout(load, 9000); }, function () { A.toast('ما قدرنا'); }).then(function () { b.disabled = false; });
      };
      document.querySelectorAll('[data-w]').forEach(function (b) { b.onclick = function () { wipeMember(b.dataset.w); }; });
      document.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { devSheet(b.dataset.d, stat(b.dataset.d).ds, load); }; });
      document.querySelectorAll('[data-ad]').forEach(function (b) {
        b.onclick = function () {
          var v = +b.dataset.ad;
          if (v && v < (j.auto_del || 9999) && !confirm('الرسائل الأقدم من المدة هذي تنحذف من أجهزة الأبناء وغير المشرفين. أكمل؟')) return;
          A.api('/admin/settings', { member: S.me, auto_del: v }).then(function (r) { S.fam.auto_del = r.auto_del; j.auto_del = r.auto_del; render(j); A.toast('انحفظ ✓'); }, function () { A.toast('ما قدرنا'); });
        };
      });
      var qs = function (q) { A.api('/admin/settings', { member: S.me, quiet: q }).then(function (r) { S.fam.quiet = r.quiet; j.quiet = r.quiet; render(j); A.toast(r.quiet.on ? 'وضع النوم شغّال 🌙' : 'انطفى وضع النوم'); }, function () { A.toast('ما قدرنا'); }); };
      var qt = $('#qOn'); if (qt) qt.onclick = function () { var q = j.quiet || S.fam.quiet || {}; qs({ on: !q.on, from: q.from || '21:00', to: q.to || '06:00' }); };
      ['qFrom', 'qTo'].forEach(function (k) { var e = $('#' + k); if (e) e.onchange = function () { var q = j.quiet || S.fam.quiet || {}; qs({ on: !!q.on, from: $('#qFrom').value, to: $('#qTo').value }); }; });
      document.querySelectorAll('[data-ad2]').forEach(function (b) {
        b.onclick = function () {
          var id = b.dataset.ad2, on = !(A.role(id) || {}).admin;
          if (on && !confirm('تعطي ' + nm(id) + ' صلاحية الإشراف؟ يقدر يدير الأجهزة والحذف والصور، لكن ما يقدر يشيل إدارتك.')) return;
          A.api('/admin/role', { member: S.me, target: id, on: on }).then(A.refreshRoles).then(function () { render(j); A.toast(on ? (A.fem(id) ? 'صارت ' + nm(id) + ' مشرفة ✓' : 'صار ' + nm(id) + ' مشرف ✓') : 'انشالت الصلاحية'); }, function () { A.toast('ما قدرنا'); });
        };
      });
    }
  };
  /* وضع النوم: الإشعارات تسكت عند الأبناء بوقت محدد (الرسائل توصل وتنتظرهم الصبح) */
  function quietCard(q) {
    var opts = function (sel) { var h = ''; for (var i = 0; i < 48; i++) { var t = ('0' + Math.floor(i / 2)).slice(-2) + ':' + (i % 2 ? '30' : '00'); h += '<option value="' + t + '"' + (t === sel ? ' selected' : '') + '>' + t + '</option>'; } return h; };
    return '<span class="label">وضع النوم 🌙</span><div class="card col" style="gap:10px"><div class="row"><span class="grow col" style="gap:2px"><b style="font-size:15px">إسكات تنبيهات الأبناء وقت النوم</b><span class="tiny muted">الرسائل توصل عادي وتنتظرهم الصبح. النبضة بس تقدر توصل لهم.</span></span>' +
      '<button class="tog' + (q.on ? ' on' : '') + '" id="qOn" role="switch" aria-checked="' + !!q.on + '" aria-label="وضع النوم"></button></div>' +
      '<div class="row" style="gap:10px' + (q.on ? '' : ';opacity:.5') + '"><label class="field grow"><span>من</span><select class="inp" id="qFrom" style="direction:ltr">' + opts(q.from || '21:00') + '</select></label><label class="field grow"><span>إلى</span><select class="inp" id="qTo" style="direction:ltr">' + opts(q.to || '06:00') + '</select></label></div></div>';
  }
  /* مين يكلّم مين: الأب والأم مع الكل دائماً، وبين الأبناء حسب اختيار المدير */
  function whoTalks() {
    var kids = A.live().filter(function (id) { return !A.isParent(id); }), rows = '';
    for (var i = 0; i < kids.length; i++) for (var j = i + 1; j < kids.length; j++) {
      var a = kids[i], b = kids[j], k = a < b ? a + ':' + b : b + ':' + a, on = (S.fam.links || []).indexOf(k) >= 0;
      rows += '<div>' + av(a, 34) + '<span style="color:var(--soft)">⇄</span>' + av(b, 34) + '<b class="grow" style="font-size:15px">' + esc(nm(a)) + ' و' + esc(nm(b)) + '</b>' +
        '<button class="tog' + (on ? ' on' : '') + '" data-lk="' + a + '|' + b + '" role="switch" aria-checked="' + on + '" aria-label="محادثة بين ' + esc(nm(a)) + ' و' + esc(nm(b)) + '"></button></div>';
    }
    if (!rows) return '';
    return '<span class="label">مين يكلّم مين</span><div class="list">' + rows + '</div>' +
      '<span class="tiny muted" style="margin:-6px 6px 0">الأب والأم يتكلمون مع الكل دائماً. فعّل المحادثة الخاصة بين الأبناء اللي تبيهم يتراسلون.</span>';
  }
  function devSheet(id, ds, reload) {
    var meOwner = A.isOwner(S.me);
    var sh = A.sheet('<div class="row">' + av(id, 52) + '<h2 class="grow fd" style="font-size:22px">أجهزة ' + esc(nm(id)) + '</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
      (ds.length ? '<div class="list">' + ds.map(function (d) {
        var others = d.members.filter(function (x) { return x !== id; }).map(nm).map(esc);
        var prot = d.members.indexOf(S.fam.owner) >= 0 && !meOwner;
        return '<div class="col" style="align-items:stretch;gap:6px"><div class="row">' + ic('phone') + '<b class="grow">' + PLN[d.plat || 'other'] + (d.me ? ' · هذا الجهاز' : '') + '</b><span class="tiny muted" dir="ltr">v' + esc(d.ver || '—') + '</span></div>' +
          '<span class="tiny muted">آخر اتصال ' + A.ago(d.last) + ' · التنبيهات ' + (d.push ? 'شغالة ✓' : 'مقفلة') + (others.length ? ' · يستخدمه أيضاً: ' + others.join('، ') : '') + '</span>' +
          (d.me || prot ? '' : '<button class="btn sm danger" data-rd="' + esc(d.id) + '">فصل هذا الجهاز عن العائلة</button>') + '</div>';
      }).join('') + '</div>' : '<div class="card small muted">' + esc(nm(id)) + ' ما عنده جهاز مربوط. اربطه من «ربط جهاز جديد».</div>'));
    $('#x', sh).onclick = function () { sh.remove(); };
    sh.querySelectorAll('[data-rd]').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('تفصل هذا الجهاز؟ يحتاج كود العائلة عشان يرجع.')) return;
        A.api('/admin/device/remove', { member: S.me, dev: b.dataset.rd }).then(function () { sh.remove(); A.toast('انفصل الجهاز'); reload(); }, function () { A.toast('ما قدرنا'); });
      };
    });
  }

  /* ================= النسخ الاحتياطي ================= */
  A.backup = function () {
    if (!A.isParent(S.me) && !canAdmin()) return A.settings();
    S.view = 'backup';
    var admin = canAdmin();
    NB.kv.get('lastBackup').then(function (last) {
      var el = A.show(head('النسخ الاحتياطي') +
        (admin ? '<div class="card col" style="gap:12px"><div class="row"><span class="av" style="width:40px;height:40px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink)">' + ic('key') + '</span><span class="col grow" style="gap:0"><b style="font-size:17px">كود العائلة</b><span class="tiny muted">يرجّع المجموعة لأي جهاز انحذف منه التطبيق</span></span></div>' +
          '<div class="inp code" id="cd" style="height:auto;padding:14px;border-style:dashed;font-size:24px">' + esc(S.acct.code || '—') + '</div>' +
          '<div class="row" style="gap:8px"><button class="btn sm block" id="cc">نسخ الكود</button><button class="btn sm ghost block" id="cs">مشاركة</button><button class="btn sm danger block" id="cn">كود جديد</button></div>' +
          '<span class="tiny muted">يرجّع الأفراد والأسماء والصور الرمزية والإعدادات. احفظه في مكان آمن، و«كود جديد» يلغي القديم فوراً (الأجهزة المربوطة تبقى).</span></div>' : '') +
        '<div class="card col" style="gap:12px"><div class="row"><span class="av" style="width:40px;height:40px;border-radius:12px;background:var(--brand-soft);color:var(--brand)">' + ic('phone') + '</span><span class="col grow" style="gap:0"><b style="font-size:17px">نسخة كاملة على جهازك</b><span class="tiny muted">ملف واحد تحفظه في جوالك أو في الملفات</span></span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">' + [['text', 'الرسائل'], ['photo', 'الصور'], ['voice', 'الصوتيات'], ['draw', 'الرسومات']].map(function (k) {
          return '<label class="row" style="background:var(--bg);border-radius:12px;padding:10px;font-size:14px;gap:8px"><input type="checkbox" checked data-k="' + k[0] + '" style="width:20px;height:20px;accent-color:#3C5BD6">' + k[1] + '</label>';
        }).join('') + '</div>' +
        '<span class="row tiny muted" style="justify-content:space-between"><span>آخر نسخة: ' + (last ? A.fmtDate(last) : 'ما فيه') + '</span><span id="bs">…</span></span>' +
        '<div class="row" style="gap:8px"><button class="btn brand" id="bx" style="flex:3">حفظ نسخة كاملة</button><label class="btn line" style="flex:2;border-color:var(--brand);color:var(--brand-ink)">استرجاع من ملف<input type="file" id="bi" accept=".json,.nabd,application/json" hidden></label></div>' +
        '<span class="tiny muted">الرسائل ما تنحفظ في السيرفر، فهذي النسخة هي الطريقة الوحيدة لترجيعها لو انحذف التطبيق.</span></div>' +
        '<button class="card row" id="rem" style="text-align:start"><span class="grow col" style="gap:0"><span>تذكير أسبوعي بالنسخ</span><span class="tiny muted">إشعار كل جمعة الساعة ٨ مساءً</span></span><span class="tog' + (S.reminder ? ' on' : '') + '" id="remT"></span></button>');
      bindBack(A.settings);
      NB.msgs.all().then(function (all) { var b = all.reduce(function (t, m) { return t + NB.mediaSize(m) + (m.text || '').length * 2; }, 0); var e = $('#bs'); if (e) e.textContent = 'الحجم: ' + mb(b * 1.35) + ' · ' + A.num(all.length) + ' رسالة'; });
      if (admin) {
        $('#cc').onclick = function () { A.copy(S.acct.code); };
        $('#cs').onclick = A.shareCode;
        $('#cn').onclick = function () {
          if (!confirm('نسوي كود جديد؟ القديم يتوقف فوراً، والأجهزة المربوطة الحين تبقى شغالة.')) return;
          var code = A.newCode();
          NB.kv.get('acct').then(function (acct) { return A.wrapKey(code, NB.b64d(acct.key)); }).then(function (w) {
            return A.api('/code', { member: S.me, code_id: w.code_id, wrapped: w.wrapped, salt: w.salt });
          }).then(function () { S.acct.code = code; return NB.kv.set('acct', S.acct); }).then(function () { $('#cd').textContent = code; A.toast('الكود الجديد جاهز ✓'); }, function () { A.toast('ما قدرنا نغيّره'); });
        };
      }
      $('#bx').onclick = function () {
        var kinds = [].slice.call(document.querySelectorAll('[data-k]:checked')).map(function (i) { return i.dataset.k; });
        if (!kinds.length) return A.toast('اختر شي واحد على الأقل');
        exportBackup(kinds, this);
      };
      $('#bi').onchange = function () {
        var f = this.files[0]; this.value = ''; if (!f) return;
        A.importBackup(f).then(function (n) { A.toast('رجعت ' + A.num(n) + ' رسالة ✓', 3500); A.backup(); }, function (e) { A.toast(e && e.msg || 'الملف هذا ما ينفع'); });
      };
      $('#rem').onclick = function () {
        var on = !S.reminder;
        A.api('/reminder', { on: on }).then(function () {
          S.reminder = on; $('#remT').classList.toggle('on', on);
          if (on && A.notifPerm() !== 'granted') A.enableNotif();
        }, function () { A.toast('ما فيه اتصال'); });
      };
    });
  };

  function blobB64(b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(String(fr.result).split(',')[1] || ''); }; fr.readAsDataURL(b); }); }
  function exportBackup(kinds, btn) {
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    NB.msgs.all().then(function (all) {
      all = all.filter(function (m) { return kinds.indexOf(m.k === 'sticker' ? 'draw' : m.k) >= 0 && !m.out; }).sort(function (a, b) { return a.t - b.t; });
      var parts = ['{"app":"nabd","v":1,"fam":' + JSON.stringify(S.acct.fam) + ',"name":' + JSON.stringify(S.prof.name) + ',"exported":' + Date.now() + ',"profile":' + JSON.stringify(S.prof) + ',"msgs":['];
      var i = 0;
      return all.reduce(function (p, m) {
        return p.then(function () {
          var o = { id: m.id, chat: m.chat, s: m.s, k: m.k, t: m.t, text: m.text, mime: m.mime, dur: m.dur, wf: m.wf, w: m.w, h: m.h, st: m.st, r: m.r, re: m.re };
          return (NB.media(m) ? blobB64(NB.media(m)) : Promise.resolve(null)).then(function (d) { if (d) o.data = d; parts.push((i++ ? ',' : '') + JSON.stringify(o)); });
        });
      }, Promise.resolve()).then(function () {
        parts.push(']}');
        var day = new Date().toISOString().slice(0, 10);
        var file = new File(parts, 'nabd-' + day + '.json', { type: 'application/json' });
        var done = function () { NB.kv.set('lastBackup', Date.now()); A.toast('انحفظت النسخة ✓ (' + A.num(all.length) + ' رسالة)', 3500); };
        if (navigator.canShare && navigator.canShare({ files: [file] }) && A.plat() !== 'desktop') {
          return navigator.share({ files: [file], title: 'نسخة نَبْض' }).then(done, function (e) { if (e && e.name !== 'AbortError') download(file, done); });
        }
        download(file, done);
      });
    }).catch(function () { A.toast('ما قدرنا نجهز النسخة'); }).then(function () { btn.disabled = false; btn.textContent = 'حفظ نسخة كاملة'; });
  }
  function download(file, done) {
    var u = URL.createObjectURL(file), a = document.createElement('a');
    a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 20000); done();
  }
  A.importBackup = function (file) {
    return file.text().then(function (t) {
      var j; try { j = JSON.parse(t); } catch (e) { throw { msg: 'الملف هذا مو نسخة نَبْض' }; }
      if (!j || j.app !== 'nabd' || !Array.isArray(j.msgs)) throw { msg: 'الملف هذا مو نسخة نَبْض' };
      if (S.acct && j.fam && S.acct.fam && j.fam !== S.acct.fam) throw { msg: 'النسخة هذي لعائلة ثانية' };
      var n = 0;
      return j.msgs.reduce(function (p, o) {
        return p.then(function () {
          return NB.msgs.get(o.id).then(function (old) {
            if (old) return;
            var m = { id: o.id, chat: o.chat, s: o.s, k: o.k, t: o.t, st: o.st || {}, r: o.r || [] };
            if (o.text != null) m.text = o.text;
            ['mime', 'dur', 'wf', 'w', 'h', 're'].forEach(function (k) { if (o[k] != null) m[k] = o[k]; });
            if (o.data) { var bin = atob(o.data), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); m.buf = u.buffer; m.mime = o.mime || ''; }
            n++; return NB.msgs.put(m);
          });
        });
      }, Promise.resolve()).then(function () { return n; });
    });
  };

  A.boot();
})(A);
