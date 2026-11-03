/* نَبْض — الشخصيات: صورة رمزية تتركّب (بشرة، شعر، شماغ/غترة/طاقية/حجاب، لبس، تعبير، لحية، نظارة)
   تنحفظ كـ av = { ch: {...}, bg } — صغيرة ومشفّرة مع بيانات العائلة. viewBox 100×100 */
var CH = (function () {
  var SKIN = ['#FFE3CC', '#F7CDA6', '#E8B086', '#C98B5E', '#9A6440', '#6E4630'];
  var HAIRC = ['#1C1512', '#3A2618', '#6B4226', '#A86A32', '#D8A25C', '#8C8C8C'];
  var CLOTH = ['#E8505B', '#F59E0B', '#2F6FDB', '#23854D', '#8B5CF6', '#EC4899', '#0EA5E9', '#1B2333', '#FFFFFF'];
  var HIJABC = ['#FFFFFF', '#1B2333', '#F4B6C8', '#A9C9EC', '#CDB8E8', '#E9D7B9', '#8B5E3C', '#0F8B8D'];
  var HAIRS = { short: 'قصير', spiky: 'منفوش', side: 'جنب', curly: 'كيرلي', long: 'طويل', pigtails: 'ذيلين', bun: 'كعكة', pony: 'ذيل', bald: 'بدون' };
  var HEADS = { none: 'بدون', shmagh: 'شماغ', ghutra: 'غترة', taqiya: 'طاقية', hijab: 'حجاب', cap: 'كاب', bow: 'فيونكة' };
  var OUTFITS = { thobe: 'ثوب', tee: 'تيشيرت', dress: 'فستان', trad: 'جلابية مطرزة', hoodie: 'هودي', abaya: 'عباية' };
  var FACES = { smile: 'مبتسم', grin: 'فرحان', laugh: 'يضحك', wink: 'غمزة', calm: 'هادي' };
  var BEARDS = { 0: 'بدون', 1: 'شنب', 2: 'سكسوكة', 3: 'لحية' };
  var GLASSES = { 0: 'بدون', 1: 'نظارة', 2: 'شمسية' };

  /* أشكال جاهزة (مثل الصورة) */
  var PRESETS = [
    { n: 'ولد بشماغ', g: 'm', ch: { s: 1, h: 'short', hc: 0, hw: 'shmagh', o: 'thobe', e: 'grin' }, bg: '#DCEBFA' },
    { n: 'ولد يضحك', g: 'm', ch: { s: 2, h: 'short', hc: 0, hw: 'shmagh', o: 'thobe', e: 'laugh' }, bg: '#FFF0C2' },
    { n: 'ولد بغترة', g: 'm', ch: { s: 1, h: 'short', hc: 0, hw: 'ghutra', o: 'thobe', e: 'smile' }, bg: '#D6F0E0' },
    { n: 'ولد بطاقية', g: 'm', ch: { s: 3, h: 'short', hc: 0, hw: 'taqiya', o: 'thobe', e: 'wink' }, bg: '#FFE3B3' },
    { n: 'ولد كاب', g: 'm', ch: { s: 2, h: 'spiky', hc: 1, hw: 'cap', wc: 2, o: 'hoodie', oc: 3, e: 'grin' }, bg: '#E6E0FA' },
    { n: 'بنت بحجاب', g: 'f', ch: { s: 1, h: 'long', hc: 0, hw: 'hijab', wc: 0, o: 'trad', e: 'smile' }, bg: '#FAD9E6' },
    { n: 'بنت بفستان', g: 'f', ch: { s: 1, h: 'long', hc: 1, hw: 'none', o: 'dress', oc: 6, e: 'grin' }, bg: '#DCEBFA' },
    { n: 'بنت ذيلين', g: 'f', ch: { s: 2, h: 'pigtails', hc: 2, hw: 'bow', wc: 5, o: 'tee', oc: 5, e: 'laugh' }, bg: '#FFF0C2' },
    { n: 'بنت كعكة', g: 'f', ch: { s: 0, h: 'bun', hc: 0, hw: 'none', o: 'dress', oc: 4, e: 'wink' }, bg: '#D6F0E0' },
    { n: 'أب بشماغ', g: 'm', ch: { s: 2, h: 'short', hc: 0, hw: 'shmagh', o: 'thobe', e: 'smile', b: 3 }, bg: '#E3E8EF' },
    { n: 'أب بغترة', g: 'm', ch: { s: 1, h: 'short', hc: 0, hw: 'ghutra', o: 'thobe', e: 'grin', b: 2, gl: 1 }, bg: '#FFE0D6' },
    { n: 'أم بحجاب', g: 'f', ch: { s: 1, h: 'long', hc: 0, hw: 'hijab', wc: 1, o: 'abaya', e: 'smile' }, bg: '#E6E0FA' }
  ];

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); }
    return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }
  function pick(arr, i) { return arr[Math.max(0, Math.min(arr.length - 1, i | 0))]; }

  /* نقوش مشتركة (مرة وحدة في الصفحة) */
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    // الشماغ: مربعات حمراء مائلة دقيقة على أبيض (نقشة الشماغ)
    '<pattern id="chShm" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#FBF8F5"/><rect width="2" height="2" fill="#C8102E"/><rect x="2.4" y="2.4" width="1.2" height="1.2" fill="#C8102E" opacity=".7"/></pattern>' +
    '<linearGradient id="chGh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9EDF2"/><stop offset=".3" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9EDF2"/></linearGradient>' +
    '<linearGradient id="chCl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>' +
    '<pattern id="chShmB" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><rect width="2.4" height="2.4" fill="#B30F27"/><rect width="1.2" height="1.2" fill="#FBF7F4"/></pattern>' +
    '<pattern id="chKnit" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#FFFFFF"/><circle cx="1.5" cy="1.5" r=".55" fill="#D3D9E2"/></pattern>' +
    '<radialGradient id="chSh" cx="50%" cy="35%" r="65%"><stop offset="70%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".10"/></radialGradient>' +
    '</defs></svg>';
  function ensureDefs() {
    if (typeof document === 'undefined' || document.getElementById('chDefs')) return;
    var d = document.createElement('div'); d.id = 'chDefs'; d.innerHTML = DEFS;
    (document.body || document.documentElement).appendChild(d);
  }

  /* ---------- القطع ---------- */
  function body(c, sk) {
    var o = c.o || 'tee', col = pick(CLOTH, c.oc == null ? 2 : c.oc), s = '';
    var torso = 'M10 100 C11 86 22 77 38 74 L62 74 C78 77 89 86 90 100 Z';
    var neck = '<path d="M42 58 L42 75 C45 79 55 79 58 75 L58 58 Z" fill="' + shade(sk, -.12) + '"/>';
    if (o === 'thobe') {
      s = neck + '<path d="' + torso + '" fill="#FBFBFC"/>' +
        '<path d="M10 100 C11 86 22 77 38 74 L36 100 Z" fill="#000" opacity=".05"/><path d="M90 100 C89 86 78 77 62 74 L64 100 Z" fill="#000" opacity=".05"/>' +
        '<path d="M40.5 73 C44 78.5 56 78.5 59.5 73 L60 76.5 C56 82 44 82 40 76.5 Z" fill="#EEF0F4" stroke="#D5DAE2" stroke-width=".7"/>' +
        '<path d="M50 80.5 V100" stroke="#D5DAE2" stroke-width="1"/><circle cx="50" cy="85" r="1.1" fill="#C9CFD9"/><circle cx="50" cy="91" r="1.1" fill="#C9CFD9"/>';
    } else if (o === 'tee') {
      s = neck + '<path d="' + torso + '" fill="' + col + '"/>' +
        '<path d="M41 74 C44 80 56 80 59 74" fill="none" stroke="' + shade(col, -.22) + '" stroke-width="2.4"/>' +
        '<path d="M50 88 l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#fff" opacity=".85"/>';
    } else if (o === 'dress') {
      s = neck + '<path d="' + torso + '" fill="' + col + '"/>' +
        '<g fill="#fff" opacity=".55"><circle cx="24" cy="90" r="1.6"/><circle cx="34" cy="96" r="1.6"/><circle cx="66" cy="96" r="1.6"/><circle cx="76" cy="90" r="1.6"/><circle cx="30" cy="84" r="1.2"/><circle cx="70" cy="84" r="1.2"/></g>' +
        '<path d="M50 76 C44 76 38 76 36 79 C38 85 46 85 50 80 C54 85 62 85 64 79 C62 76 56 76 50 76 Z" fill="#FFFFFF" stroke="' + shade(col, -.15) + '" stroke-width=".7"/>' +
        '<circle cx="50" cy="83" r="1.6" fill="' + shade(col, -.3) + '"/>';
    } else if (o === 'trad') {
      // جلابية سوداء مطرزة (ألوان التطريز النجدي)
      s = neck + '<path d="' + torso + '" fill="#1E1E24"/>' +
        '<path d="M41 74 L50 90 L59 74" fill="none" stroke="#E2B53E" stroke-width="2.2"/>' +
        '<path d="M43 74 L50 86.5 L57 74" fill="none" stroke="#D3313A" stroke-width="1.2" stroke-dasharray="1.6 1.2"/>' +
        '<g><path d="M50 90 V100" stroke="#E2B53E" stroke-width="2.4"/>' +
        '<path d="M47 93 l3 -2.4 3 2.4 -3 2.4z M47 98.5 l3 -2.4 3 2.4 -3 2.4z" fill="#D3313A"/>' +
        '<circle cx="44" cy="84" r="1.1" fill="#2BA36B"/><circle cx="56" cy="84" r="1.1" fill="#2BA36B"/><circle cx="46.5" cy="80" r=".9" fill="#E2B53E"/><circle cx="53.5" cy="80" r=".9" fill="#E2B53E"/>' +
        '<path d="M20 90 q3 -3 6 0 q3 3 6 0 M68 90 q3 -3 6 0 q3 3 6 0" fill="none" stroke="#E2B53E" stroke-width="1"/></g>';
    } else if (o === 'hoodie') {
      s = neck + '<path d="M30 76 C34 66 66 66 70 76 C66 72 34 72 30 76 Z" fill="' + shade(col, -.2) + '"/>' +
        '<path d="' + torso + '" fill="' + col + '"/>' +
        '<path d="M36 75 C40 82 60 82 64 75" fill="none" stroke="' + shade(col, -.25) + '" stroke-width="3"/>' +
        '<path d="M45 80 V92 M55 80 V92" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/><circle cx="45" cy="92.5" r="1.3" fill="#fff"/><circle cx="55" cy="92.5" r="1.3" fill="#fff"/>' +
        '<path d="M36 100 C38 94 62 94 64 100" fill="' + shade(col, -.12) + '"/>';
    } else if (o === 'abaya') {
      s = neck + '<path d="' + torso + '" fill="#17171C"/>' +
        '<path d="M50 78 V100" stroke="#33333B" stroke-width="1.2"/><path d="M14 96 C20 90 26 88 30 88 M86 96 C80 90 74 88 70 88" stroke="#3A3A44" stroke-width="1" fill="none"/>';
    }
    return s;
  }

  function ears(sk) {
    return '<ellipse cx="31" cy="47" rx="4.2" ry="5.2" fill="' + sk + '"/><ellipse cx="69" cy="47" rx="4.2" ry="5.2" fill="' + sk + '"/>' +
      '<path d="M30 45.5 q1.6 1.5 0 3.5 M70 45.5 q-1.6 1.5 0 3.5" stroke="' + shade(sk, -.25) + '" stroke-width="1" fill="none"/>';
  }
  function head(sk) {
    return '<path d="M50 24 C61 24 69 32 69 45 C69 58 61 66 50 66 C39 66 31 58 31 45 C31 32 39 24 50 24 Z" fill="' + sk + '"/>' +
      '<path d="M50 24 C61 24 69 32 69 45 C69 58 61 66 50 66 C39 66 31 58 31 45 C31 32 39 24 50 24 Z" fill="url(#chSh)"/>';
  }
  function face(c, sk, hc) {
    var e = c.e || 'smile', ink = '#22181A', s = '';
    var brow = shade(hc, .05);
    var eye = function (x) { return '<ellipse cx="' + x + '" cy="46.5" rx="2.5" ry="3.1" fill="' + ink + '"/><circle cx="' + (x + .9) + '" cy="45.4" r=".95" fill="#fff"/>'; };
    var happy = function (x) { return '<path d="M' + (x - 3) + ' 47.5 q3 -3.6 6 0" fill="none" stroke="' + ink + '" stroke-width="1.9" stroke-linecap="round"/>'; };
    // الحواجب
    var by = e === 'laugh' ? 39.6 : 40.6;
    s += '<path d="M38.8 ' + by + ' q3.6 -2.2 7.2 -.4 M54 ' + (by - .4) + ' q3.6 -1.8 7.2 .4" fill="none" stroke="' + brow + '" stroke-width="1.7" stroke-linecap="round"/>';
    // العيون
    if (e === 'laugh') s += happy(42.5) + happy(57.5);
    else if (e === 'wink') s += eye(42.5) + happy(57.5);
    else s += eye(42.5) + eye(57.5);
    // الخدود والأنف
    s += '<ellipse cx="38" cy="53.5" rx="3.6" ry="2.2" fill="#FF7B7B" opacity=".28"/><ellipse cx="62" cy="53.5" rx="3.6" ry="2.2" fill="#FF7B7B" opacity=".28"/>';
    s += '<path d="M48.6 51.6 q1.4 1.4 2.8 0" fill="none" stroke="' + shade(sk, -.3) + '" stroke-width="1.3" stroke-linecap="round"/>';
    // الفم
    if (e === 'smile' || e === 'wink') s += '<path d="M44.5 56 q5.5 5 11 0" fill="none" stroke="#8A2F2F" stroke-width="1.9" stroke-linecap="round"/>';
    else if (e === 'calm') s += '<path d="M46.5 57 q3.5 2 7 0" fill="none" stroke="#8A2F2F" stroke-width="1.7" stroke-linecap="round"/>';
    else if (e === 'grin') s += '<path d="M43.5 55.2 h13 q-.6 6.6 -6.5 6.6 q-5.9 0 -6.5 -6.6 Z" fill="#7A1F27"/><path d="M44.2 55.2 h11.6 l-.3 1.8 h-11 Z" fill="#fff"/><path d="M46.6 60 q3.4 -2.2 6.8 0 q-1.4 1.6 -3.4 1.6 q-2 0 -3.4 -1.6Z" fill="#F07A84"/>';
    else if (e === 'laugh') s += '<path d="M42.5 54.6 h15 q-.6 8.6 -7.5 8.6 q-6.9 0 -7.5 -8.6 Z" fill="#7A1F27"/><path d="M43.2 54.6 h13.6 l-.4 2.1 h-12.8 Z" fill="#fff"/><path d="M45.8 60.6 q4.2 -2.6 8.4 0 q-1.8 2.4 -4.2 2.4 q-2.4 0 -4.2 -2.4Z" fill="#F07A84"/>';
    return s;
  }
  function beard(c, hc) {
    var b = c.b | 0; if (!b) return '';
    var col = hc, s = '';
    var must = '<path d="M43 54.2 C45.5 52 48.5 52.6 50 53.8 C51.5 52.6 54.5 52 57 54.2 C54.5 55.6 52 55.2 50 54.4 C48 55.2 45.5 55.6 43 54.2 Z" fill="' + col + '"/>';
    if (b === 1) return must;
    if (b === 2) return must + '<path d="M45 61.5 C47 64.8 53 64.8 55 61.5 C55.4 64 54 67.6 50 67.8 C46 67.6 44.6 64 45 61.5 Z" fill="' + col + '"/>' +
      '<path d="M44.6 56.2 C44 58.5 44.4 60.5 45 61.5 M55.4 56.2 C56 58.5 55.6 60.5 55 61.5" stroke="' + col + '" stroke-width="1.1" fill="none" opacity=".8"/>';
    // لحية كاملة (مرتّبة)
    s = '<path d="M31.5 46 C32 56 36 62 40 64.5 C44 68.4 47 69.4 50 69.4 C53 69.4 56 68.4 60 64.5 C64 62 68 56 68.5 46 C67.6 52 65.4 56 62 57.6 C59 58.8 56.6 58.4 55 57.2 C53.4 59.6 46.6 59.6 45 57.2 C43.4 58.4 41 58.8 38 57.6 C34.6 56 32.4 52 31.5 46 Z" fill="' + col + '"/>';
    return s + must;
  }
  function glasses(c) {
    var g = c.gl | 0; if (!g) return '';
    var fill = g === 2 ? '#1B2333' : 'rgba(255,255,255,.18)';
    return '<g fill="' + fill + '" stroke="#1B2333" stroke-width="1.5"><rect x="36.2" y="42" width="11.6" height="9" rx="3.6"/><rect x="52.2" y="42" width="11.6" height="9" rx="3.6"/></g>' +
      '<path d="M47.8 45.4 q2.2 -1.5 4.4 0 M36.2 45 L31.6 43.8 M63.8 45 L68.4 43.8" stroke="#1B2333" stroke-width="1.4" fill="none"/>' +
      (g === 2 ? '<path d="M38.4 44 l3 0 M54.4 44 l3 0" stroke="#fff" stroke-width="1" opacity=".6" stroke-linecap="round"/>' : '');
  }

  /* الشعر: خلف الراس + فوقه */
  function hairBack(c, hc) {
    var h = c.h || 'short';
    if (h === 'long') return '<path d="M30 42 C27 26 38 19 50 19 C62 19 73 26 70 42 L72 66 C73 74 71 80 66 82 L34 82 C29 80 27 74 28 66 Z" fill="' + hc + '"/>';
    if (h === 'pony') return '<path d="M64 34 C78 36 80 56 74 70 C72 62 70 50 64 44 Z" fill="' + hc + '"/>';
    if (h === 'pigtails') return '<g fill="' + hc + '"><path d="M30 40 C20 42 16 54 20 66 C24 60 28 54 32 50 Z"/><path d="M70 40 C80 42 84 54 80 66 C76 60 72 54 68 50 Z"/></g>';
    if (h === 'bun') return '<circle cx="50" cy="19.5" r="8.2" fill="' + hc + '"/><path d="M44 17 q6 -4 12 0" stroke="' + shade(hc, .18) + '" stroke-width="1" fill="none"/>';
    return '';
  }
  function hairFront(c, hc) {
    var h = c.h || 'short', hi = shade(hc, .2);
    if (h === 'bald') return '<path d="M42 29 q4 -2 8 -1" stroke="#fff" stroke-width="1.5" opacity=".35" fill="none" stroke-linecap="round"/>';
    if (h === 'short') return '<path d="M30.6 45 C29 30 37.5 21.5 50 21.5 C62.5 21.5 71 30 69.4 45 C68.6 39 66.6 35 63.2 33 C58 35.6 51 35.8 44 33.6 C41 35.4 37.6 37 35.4 39.6 C33.4 41.4 31.8 43 30.6 45 Z" fill="' + hc + '"/>' +
      '<path d="M40 27 q8 -3.6 17 -1" stroke="' + hi + '" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/>';
    if (h === 'spiky') return '<path d="M30.6 45 C29.6 36 31 30 34 26.6 L33 20 L39.4 23.4 L41 16.8 L46 21.6 L50 15.4 L53.6 21.6 L59 16.8 L60.4 23.4 L67 20.4 L66 26.8 C69 30 70.4 36 69.4 45 C68 39 65 35 61 33.4 C54 35.4 46 35.4 39 33.4 C35 35 32 39 30.6 45 Z" fill="' + hc + '"/>';
    if (h === 'side') return '<path d="M30.6 46 C28.8 30 38 21 51 21.4 C63 21.8 71 30 69.4 45 C67.6 37.6 63 33.4 58 32.2 C52 36.6 42 39.4 34.6 39.6 C32.8 41.4 31.4 43.6 30.6 46 Z" fill="' + hc + '"/>' +
      '<path d="M58 32.2 C55 28 52 26 47 25.4" stroke="' + shade(hc, -.3) + '" stroke-width="1" fill="none"/>';
    if (h === 'curly') {
      var cs = [[34, 36, 5.6], [37, 29, 6], [44, 25, 6.4], [52, 23.6, 6.4], [59.6, 26, 6.2], [65.4, 31, 5.8], [67.4, 38, 4.8], [32.4, 42, 3.8], [41, 31, 4.6], [50, 30, 4.6], [58, 31.4, 4.4]];
      return '<g fill="' + hc + '">' + cs.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '"/>'; }).join('') + '</g>' +
        '<g fill="none" stroke="' + hi + '" stroke-width=".9" opacity=".55">' + cs.slice(0, 7).map(function (p) { return '<path d="M' + (p[0] - 2) + ' ' + (p[1] - 1) + ' q2 -2 4 0"/>'; }).join('') + '</g>';
    }
    // شعر البنات: غرّة مع فرق
    var fr = '<path d="M30.4 47 C28.6 30 37.6 21 50 21 C62.4 21 71.4 30 69.6 47 C68.6 40 66.4 36 63.6 34 C61 35 57.4 34.6 54.6 31.4 C51 35.2 44 37.2 37.4 36.6 C34.2 39.4 31.8 43 30.4 47 Z" fill="' + hc + '"/>' +
      '<path d="M54.6 31.4 C53.8 28 52 25.4 49 24" stroke="' + shade(hc, -.3) + '" stroke-width="1" fill="none"/>' +
      '<path d="M38 27.6 q6 -4 13 -3.4" stroke="' + hi + '" stroke-width="1.2" fill="none" opacity=".55" stroke-linecap="round"/>';
    if (h === 'long') fr += '<path d="M30.6 46 C30 54 30.6 62 32.6 68 L29.4 68 C28.4 60 28.6 52 30.6 46 Z M69.4 46 C70 54 69.4 62 67.4 68 L70.6 68 C71.6 60 71.4 52 69.4 46 Z" fill="' + hc + '"/>';
    return fr;
  }

  /* أغطية الراس */
  function shmagh(red) {
    var fill = red ? 'url(#chShm)' : 'url(#chGh)', fold = red ? 'rgba(80,0,12,.20)' : 'rgba(60,80,110,.13)', rim = red ? '#FFFFFF' : '#FFFFFF';
    // القماش كامل مع فتحة الوجه (evenodd) — يغطي الراس وينزل على الكتفين
    var outer = 'M50 8.5 C38 8.5 27.6 13 23.4 22.4 C20 30 20.4 40 20.6 49 C20.8 61 19 73 13.6 85 C11.6 89.6 10.2 94.4 9.6 100 L90.4 100 C89.8 94.4 88.4 89.6 86.4 85 C81 73 79.2 61 79.4 49 C79.6 40 80 30 76.6 22.4 C72.4 13 62 8.5 50 8.5 Z';
    var hole = 'M50 31.6 C46.4 30.2 40.6 29.8 37 31.6 C33.2 33.6 31.4 38.8 31.4 45.6 C31.4 53.6 34.4 60.2 38.6 63.8 C40.6 66 41.4 70 41 74.6 C40.6 83 38.6 92 37 100 L63 100 C61.4 92 59.4 83 59 74.6 C58.6 70 59.4 66 61.4 63.8 C65.6 60.2 68.6 53.6 68.6 45.6 C68.6 38.8 66.8 33.6 63 31.6 C59.4 29.8 53.6 30.2 50 31.6 Z';
    var s = '<path d="M50 31.6 C46.4 30.2 40.6 29.8 37 31.6 C33.2 33.6 31.4 38.8 31.4 45.6 C31.4 50 32.2 54 33.6 57 L35 50 C35 42 38 37 42 35 C46 33.4 54 33.4 58 35 C62 37 65 42 65 50 L66.4 57 C67.8 54 68.6 50 68.6 45.6 C68.6 38.8 66.8 33.6 63 31.6 C59.4 29.8 53.6 30.2 50 31.6 Z" fill="#7A4A30" opacity=".10"/>';
    s += '<path d="' + outer + ' ' + hole + '" fill="' + fill + '" fill-rule="evenodd"/>';
    // حجم وطيّات ناعمة
    s += '<path d="' + outer + ' ' + hole + '" fill="url(#chCl)" fill-rule="evenodd"/>';
    s += '<g fill="none" stroke="' + fold + '" stroke-linecap="round">' +
      '<path d="M26.4 34 C24.6 46 25.4 58 23.6 70 C22.4 80 19.4 90 17 100" stroke-width="3.2"/>' +
      '<path d="M73.6 34 C75.4 46 74.6 58 76.4 70 C77.6 80 80.6 90 83 100" stroke-width="3.2"/>' +
      '<path d="M35.4 66 C35.6 76 32.6 88 30 100 M64.6 66 C64.4 76 67.4 88 70 100" stroke-width="2.2"/>' +
      '<path d="M44 10.4 C41 16 40 22 40.6 26 M56 10.4 C59 16 60 22 59.4 26" stroke-width="1.6"/></g>';
    // الحافة المطوية حول الوجه
    s += '<path d="M50 31.6 C46.4 30.2 40.6 29.8 37 31.6 C33.2 33.6 31.4 38.8 31.4 45.6 C31.4 53.6 34.4 60.2 38.6 63.8 C40.6 66 41.4 70 41 74.6 C40.6 83 38.6 92 37 100 M50 31.6 C53.6 30.2 59.4 29.8 63 31.6 C66.8 33.6 68.6 38.8 68.6 45.6 C68.6 53.6 65.6 60.2 61.4 63.8 C59.4 66 58.6 70 59 74.6 C59.4 83 61.4 92 63 100" fill="none" stroke="' + rim + '" stroke-width="2.4" stroke-linejoin="round"/>';
    // القمة (طيّة الشماغ فوق)
    s += '<path d="M50 8.8 C48.4 13 48.2 16.4 50 19.4 C51.8 16.4 51.6 13 50 8.8 Z" fill="' + fold + '"/>';
    if (red) s += '<path d="M9.6 100 C10.2 95.6 11.2 92.2 12.6 88.6 L18.8 91.2 C17.6 94 17 96.8 16.6 100 Z M90.4 100 C89.8 95.6 88.8 92.2 87.4 88.6 L81.2 91.2 C82.4 94 83 96.8 83.4 100 Z" fill="url(#chShmB)"/>';
    // العقال: حلقتين سود (نشوف الخلفية رفيعة فوق، والأمامية عريضة على الجبهة)
    s += '<g fill="none" stroke-linecap="round">' +
      '<path d="M27.4 23.4 C31 17 40 14.6 50 14.6 C60 14.6 69 17 72.6 23.4" stroke="#121216" stroke-width="2.2"/>' +
      '<path d="M26.4 23.6 C33 27.4 41 28.6 50 28.6 C59 28.6 67 27.4 73.6 23.6" stroke="#121216" stroke-width="3.6"/>' +
      '<path d="M26.8 19.6 C33.4 23.4 41.4 24.4 50 24.4 C58.6 24.4 66.6 23.4 73.2 19.6" stroke="#121216" stroke-width="3.2"/>' +
      '<path d="M28.6 22.6 C34.6 25.8 42 26.8 50 26.8 C58 26.8 65.4 25.8 71.4 22.6 M28.8 18.8 C34.8 22 42 22.8 50 22.8 C58 22.8 65.2 22 71.2 18.8" stroke="#6A6A78" stroke-width=".8"/>' +
      '</g>';
    return s;
  }
  function hijab(c) {
    var col = pick(HIJABC, c.wc | 0), white = col === '#FFFFFF', dk = shade(col, white ? -.12 : -.2), lt = shade(col, .3);
    var outer = 'M50 14.6 C35.6 14.6 25.6 23.4 24.8 37.4 C24.2 48.4 26 57.6 28.6 63.6 C23.6 67.6 16.4 71.4 13.6 78.6 C12.4 81.6 12.6 85 14.4 87 C26 91.4 38 93 50 93 C62 93 74 91.4 85.6 87 C87.4 85 87.6 81.6 86.4 78.6 C83.6 71.4 76.4 67.6 71.4 63.6 C74 57.6 75.8 48.4 75.2 37.4 C74.4 23.4 64.4 14.6 50 14.6 Z';
    var hole = 'M50 28.4 C40.4 28.4 33 35 32.6 45.6 C32.2 56.4 39.8 65.6 50 65.6 C60.2 65.6 67.8 56.4 67.4 45.6 C67 35 59.6 28.4 50 28.4 Z';
    return '<path d="' + outer + ' ' + hole + '" fill="' + col + '" fill-rule="evenodd"/>' +
      '<path d="' + outer + ' ' + hole + '" fill="url(#chCl)" fill-rule="evenodd"/>' +
      '<path d="M50 28.4 C40.4 28.4 33 35 32.6 45.6 C32.6 41 34 37.6 36.4 35 C40 31.6 45 30.6 50 30.6 C55 30.6 60 31.6 63.6 35 C66 37.6 67.4 41 67.4 45.6 C67 35 59.6 28.4 50 28.4 Z" fill="' + dk + '" opacity=".55"/>' +
      '<g fill="none" stroke="' + dk + '" stroke-linecap="round" opacity=".75">' +
      '<path d="M30 40 C28.8 49 30.6 58 35.4 65" stroke-width="1.8"/><path d="M70 40 C71.2 49 69.4 58 64.6 65" stroke-width="1.8"/>' +
      '<path d="M32 69 C38 73.6 44 75.2 50 75.2 C56 75.2 62 73.6 68 69" stroke-width="1.8"/>' +
      '<path d="M21 78 C26 83 32 86.4 40 88.4 M79 78 C74 83 68 86.4 60 88.4" stroke-width="1.6"/></g>' +
      '<path d="M37 21 C42 18 50 17.2 58 19.4" fill="none" stroke="' + lt + '" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>' +
      (col === '#1B2333' ? '' : '<circle cx="68.4" cy="61" r="1.6" fill="' + dk + '"/>');
  }
  function taqiya() {
    return '<path d="M30.4 41 C29.6 27 38.6 19.6 50 19.6 C61.4 19.6 70.4 27 69.6 41 C63 37.6 37 37.6 30.4 41 Z" fill="url(#chKnit)"/>' +
      '<path d="M30.4 41 C37 37.6 63 37.6 69.6 41" fill="none" stroke="#D3D9E2" stroke-width="1.4"/>' +
      '<path d="M50 19.6 V38.6 M40 21.6 C38 27 37.4 32 37.6 38.8 M60 21.6 C62 27 62.6 32 62.4 38.8" fill="none" stroke="#E3E7ED" stroke-width=".9"/>';
  }
  function cap(c) {
    var col = pick(CLOTH, c.wc == null ? 2 : c.wc), dk = shade(col, -.25);
    return '<path d="M30 40 C29 26 38 18.6 50 18.6 C62 18.6 71 26 70 40 Z" fill="' + col + '"/>' +
      '<path d="M50 18.6 V40 M40 20.6 C37.6 27 37 33 37.4 40 M60 20.6 C62.4 27 63 33 62.6 40" stroke="' + dk + '" stroke-width=".9" fill="none" opacity=".7"/>' +
      '<circle cx="50" cy="19" r="1.8" fill="' + dk + '"/>' +
      '<path d="M28 39 C38 36.2 62 36.2 72 39 C75 40 76 42 74 42.8 C62 40.8 38 40.8 26 42.8 C24 42 25 40 28 39 Z" fill="' + dk + '"/>';
  }
  function bow(c) {
    var col = pick(CLOTH, c.wc == null ? 5 : c.wc), dk = shade(col, -.25);
    return '<g transform="translate(62 24) rotate(18)"><path d="M0 0 L-9 -6 C-11 -2 -11 2 -9 6 Z M0 0 L9 -6 C11 -2 11 2 9 6 Z" fill="' + col + '"/><circle r="2.6" fill="' + dk + '"/></g>';
  }

  /* الرسم الكامل */
  function svg(ch) {
    ensureDefs();
    var c = ch || {}, sk = pick(SKIN, c.s == null ? 1 : c.s), hc = pick(HAIRC, c.hc | 0), hw = c.hw || 'none';
    var covered = hw === 'shmagh' || hw === 'ghutra' || hw === 'hijab';
    var s = '';
    if (!covered) s += hairBack(c, hc);
    s += body(c, sk);
    if (!covered) s += ears(sk);
    s += head(sk);
    if (!covered || hw === 'hijab') {} // الحجاب يغطي الأذنين
    s += face(c, sk, hc) + beard(c, hc);
    if (hw === 'shmagh') s += shmagh(true);
    else if (hw === 'ghutra') s += shmagh(false);
    else if (hw === 'hijab') s += hijab(c);
    else {
      if (hw === 'taqiya') s += (c.h === 'bald' ? '' : hairFront({ h: 'short' }, hc)) + taqiya();
      else if (hw === 'cap') s += hairFront(c.h === 'long' || c.h === 'pigtails' || c.h === 'pony' || c.h === 'bun' ? c : { h: c.h === 'bald' ? 'bald' : 'short' }, hc) + cap(c);
      else s += hairFront(c, hc) + (hw === 'bow' ? bow(c) : '');
    }
    s += glasses(c);
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + s + '</svg>';
  }

  function presetFor(kind, g) {
    var want = kind === 'parent' ? (g === 'f' ? 'أم بحجاب' : 'أب بشماغ') : (g === 'f' ? 'بنت بحجاب' : 'ولد بشماغ');
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].n === want) return PRESETS[i];
    return PRESETS[0];
  }

  return { svg: svg, SKIN: SKIN, HAIRC: HAIRC, CLOTH: CLOTH, HIJABC: HIJABC, HAIRS: HAIRS, HEADS: HEADS, OUTFITS: OUTFITS, FACES: FACES, BEARDS: BEARDS, GLASSES: GLASSES, PRESETS: PRESETS, presetFor: presetFor };
})();
