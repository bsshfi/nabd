/* نَبْض — الرسم 3.0
   فُرش (قلم، شمع، لمعة، بخاخ، مائي، رشّة أشكال، قوس قزح، نيون، ممحاة)، تعبئة، أشكال، مرآة ٢/٤/٨،
   صفحات تلوين بأقسام + العائلة + لوّن صورتك، تكبير بإصبعين، رجوع/إعادة، أصوات، رسوماتي (مسودات)،
   صوت مع الرسمة، والرسمة تنرسم قدام اللي يستقبلها (pl) */
var DR = (function () {
  'use strict';

  /* ---------- أدوات رسم الصفحات (إحداثيات 100×100) ---------- */
  function C(x, y, r) { return 'M' + (x + r) + ' ' + y + 'a' + r + ' ' + r + ' 0 1 0-' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0z'; }
  function E(x, y, rx, ry) { return 'M' + (x + rx) + ' ' + y + 'a' + rx + ' ' + ry + ' 0 1 0-' + (2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (2 * rx) + ' 0z'; }
  function STAR(x, y, r, n, k) {
    n = n || 5; k = k || .45; var d = '';
    for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * k : r; d += (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ' ' + (y + rr * Math.sin(a)).toFixed(1); }
    return d + 'Z';
  }
  function SCAL(x, y, r, n) {
    var d = '', s = Math.PI * 2 / n;
    for (var i = 0; i <= n; i++) {
      var a = i * s - Math.PI / 2, px = x + r * Math.cos(a), py = y + r * Math.sin(a);
      if (!i) d = 'M' + px.toFixed(1) + ' ' + py.toFixed(1);
      else { var am = a - s / 2, cx = x + r * 1.32 * Math.cos(am), cy = y + r * 1.32 * Math.sin(am); d += 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1); }
    }
    return d + 'Z';
  }
  function RAYS(x, y, r1, r2, n) { var d = ''; for (var i = 0; i < n; i++) { var a = i * Math.PI * 2 / n; d += 'M' + (x + r1 * Math.cos(a)).toFixed(1) + ' ' + (y + r1 * Math.sin(a)).toFixed(1) + 'L' + (x + r2 * Math.cos(a)).toFixed(1) + ' ' + (y + r2 * Math.sin(a)).toFixed(1); } return d; }
  var WAVES = 'M0 90Q10 84 20 90T40 90T60 90T80 90T100 90';

  /* ---------- صفحات التلوين ---------- */
  var PAGES = {
    // تراثنا
    camel: { c: 'h', n: 'جمل', p: ['M18 58C18 48 26 44 32 44C36 32 46 32 50 42C54 34 62 34 64 44C70 46 74 42 75 36L77 24C78 19 86 19 88 24L91 30L86 32L83 31L80 50C80 58 76 62 70 62H24C20 62 18 60 18 58z', 'M26 62h5v24h-5z', 'M36 62h5v24h-5z', 'M60 62h5v24h-5z', 'M69 62h5v24h-5z', C(84.6, 26, 1.4), 'M18 54Q10 58 13 68', 'M2 90Q25 84 50 90T98 90', C(13, 20, 7)] },
    palm: { c: 'h', n: 'نخلة', p: ['M46 92L48 50H52L54 92z', 'M47 82h6M47.4 72h5.2M47.8 62h4.4', 'M50 48C40 30 24 30 12 40C26 38 38 42 50 48z', 'M50 48C60 30 76 30 88 40C74 38 62 42 50 48z', 'M50 48C44 28 34 18 22 18C34 24 42 34 50 48z', 'M50 48C56 28 66 18 78 18C66 24 58 34 50 48z', 'M50 48C47 30 50 16 56 8C54 22 54 34 50 48z', C(44, 55, 3), C(50, 57, 3), C(56, 55, 3), 'M6 92H94'] },
    dallah: { c: 'h', n: 'دلّة', p: ['M34 86C30 70 34 58 42 52L40 40H60L58 52C66 58 70 70 66 86z', 'M40 40C40 30 60 30 60 40', 'M50 31V24', C(50, 20, 3.5), 'M36 58C24 56 18 46 12 38L16 35C22 43 28 50 38 52', 'M64 46C80 46 82 72 66 78', 'M32 86H68V91H32z', 'M37 66H63', 'M38 72H62'] },
    falcon: { c: 'h', n: 'صقر', p: [C(40, 28, 10), 'M31 25L21 29L31 32z', C(37, 25, 2), 'M36 37C26 50 30 70 46 78C58 82 66 76 66 64C66 50 56 38 44 36z', 'M48 44C62 46 68 62 64 74C56 66 48 56 48 44z', 'M50 79L55 95H64L61 76', 'M14 82H84', 'M42 79L40 84M48 80V84'] },
    tent: { c: 'h', n: 'بيت شعر', p: ['M8 80L22 40L50 32L78 40L92 80z', 'M22 40V80M50 32V80M78 40V80', 'M42 80V58H58V80z', 'M14 64H86', 'M16 70L20 66L24 70L28 66L32 70L36 66L40 70', 'M60 70L64 66L68 70L72 66L76 70L80 66L84 70', 'M2 80H98', C(88, 14, 6)] },
    mosque: { c: 'h', n: 'مسجد', p: ['M12 88V56H74V88z', 'M24 56C24 34 62 34 62 56z', 'M43 38V30', 'M46 22a5 5 0 1 1-6 6a4 4 0 1 0 6-6z', 'M78 88V30H88V88z', 'M76 30L83 16L90 30z', 'M76 46H90', 'M37 88V74C37 66 49 66 49 74V88', 'M18 78V70C18 65 26 65 26 70V78z', 'M60 78V70C60 65 68 65 68 70V78z', 'M4 88H96'] },
    dhow: { c: 'h', n: 'سفينة', p: ['M10 66H90L80 80H22z', 'M50 66V12', 'M52 14L84 60H52z', 'M48 22L22 60H48z', 'M50 12L60 16L50 20', C(30, 73, 2.5), C(50, 73, 2.5), C(70, 73, 2.5), WAVES] },
    finjan: { c: 'h', n: 'فناجيل', p: ['M18 50H42L38 70H22z', 'M58 50H82L78 70H62z', E(50, 78, 42, 8), 'M28 44Q24 38 28 32Q32 26 28 20', 'M70 44Q66 38 70 32Q74 26 70 20', 'M18 56H42M58 56H82', E(50, 66, 7, 5), E(50, 58, 5, 4)] },
    lantern: { c: 'h', n: 'فانوس', p: [C(50, 10, 4), 'M38 26L50 14L62 26z', 'M34 26H66L62 74H38z', 'M42 32H58L56 66H44z', 'M50 60C44 54 48 46 50 40C52 46 56 54 50 60z', 'M36 74H64L60 84H40z', 'M34 26L38 74M66 26L62 74'] },
    moon: { c: 'h', n: 'هلال', p: ['M62 14A36 36 0 1 0 62 86A28 28 0 1 1 62 14z', STAR(74, 30, 7), STAR(84, 56, 5), STAR(70, 74, 4), STAR(20, 16, 4), C(88, 14, 1.5), C(14, 84, 1.5)] },
    // حيوانات
    cat: { c: 'a', n: 'قطة', p: [E(50, 56, 28, 24), 'M27 43L25 17L44 33', 'M73 43L75 17L56 33', E(40, 52, 4, 5), E(60, 52, 4, 5), 'M46 61h8l-4 4z', 'M50 65q-4 6-9 3M50 65q4 6 9 3', 'M30 60H12M30 64L14 70M70 60H88M70 64L86 70'] },
    dog: { c: 'a', n: 'كلب', p: ['M50 30C34 30 28 44 30 58C32 70 42 76 50 76C58 76 68 70 70 58C72 44 66 30 50 30z', 'M32 36C20 34 16 52 22 64C28 60 32 50 34 42z', 'M68 36C80 34 84 52 78 64C72 60 68 50 66 42z', C(42, 50, 3), C(58, 50, 3), 'M45 60H55L50 66z', 'M50 66Q46 72 42 70M50 66Q54 72 58 70', 'M47 71Q50 80 53 71'] },
    rabbit: { c: 'a', n: 'أرنب', p: [E(50, 64, 20, 18), 'M40 50C34 30 36 10 42 10C48 10 48 30 46 50z', 'M60 50C66 30 64 10 58 10C52 10 52 30 54 50z', 'M41.5 44Q40 28 42 18', 'M58.5 44Q60 28 58 18', C(43, 60, 2.5), C(57, 60, 2.5), 'M48 68H52L50 71z', 'M48 70L36 68M48 72L36 74M52 70L64 68M52 72L64 74', 'M50 71V75'] },
    lion: { c: 'a', n: 'أسد', p: [SCAL(50, 50, 32, 14), C(50, 52, 22), C(34, 34, 5), C(66, 34, 5), C(43, 47, 2.5), C(57, 47, 2.5), 'M46 56H54L50 61z', 'M50 61Q46 68 41 65M50 61Q54 68 59 65'] },
    elephant: { c: 'a', n: 'فيل', p: [E(23, 46, 16, 20), E(77, 46, 16, 20), E(50, 46, 22, 24), 'M44 64C44 78 40 86 34 90L40 94C48 88 56 80 56 64', C(42, 42, 2.5), C(58, 42, 2.5), 'M42 62Q36 70 38 75', 'M58 62Q64 70 62 75'] },
    turtle: { c: 'a', n: 'سلحفاة', p: ['M20 64C20 40 78 40 78 64z', 'M37 64L41 50H57L61 64M41 50L35 44M57 50L63 44', 'M16 64H82Q82 70 76 70H22Q16 70 16 64z', 'M80 62C84 52 98 52 96 62C95 67 89 68 82 67', C(91, 59, 1.5), 'M26 70V80H34V70', 'M64 70V80H72V70', 'M16 66L8 70L16 68', 'M2 84H98'] },
    owl: { c: 'a', n: 'بومة', p: [E(50, 56, 26, 32), C(40, 44, 9), C(60, 44, 9), C(40, 44, 3.5), C(60, 44, 3.5), 'M47 54H53L50 60z', 'M28 32L32 18L40 28', 'M72 32L68 18L60 28', 'M38 66Q50 90 62 66', 'M24 58Q18 74 30 84', 'M76 58Q82 74 70 84', 'M8 92H92'] },
    bird: { c: 'a', n: 'عصفور', p: [E(48, 58, 24, 16), C(72, 44, 11), 'M82 42L93 45L82 48z', C(74, 42, 2), 'M36 52Q48 40 58 54Q48 62 36 52z', 'M25 56L8 46L12 60L8 70L26 62', 'M44 74V86M54 74V86', 'M10 86H90'] },
    duck: { c: 'a', n: 'بطة', p: ['M20 62C20 50 34 46 50 50C52 38 58 30 68 30C78 30 82 38 80 46L91 48L80 52C76 54 70 54 68 56C80 60 82 72 72 78C60 86 30 86 20 62z', C(70, 40, 2), 'M36 62Q50 54 60 64Q48 72 36 62z', WAVES] },
    snail: { c: 'a', n: 'حلزون', p: [C(56, 50, 22), 'M56 50m0-5a5 5 0 1 1-5 5a10 10 0 1 1 10 10a15 15 0 1 1-15-15', 'M8 80C8 72 18 72 30 72H86C93 72 93 80 86 80H12Q8 80 8 78z', 'M14 72L10 58M22 72L22 58', C(10, 56, 2.5), C(22, 56, 2.5), 'M2 88H98'] },
    fish: { c: 'a', n: 'سمكة', p: [E(45, 50, 28, 17), 'M72 50L92 34V66z', C(28, 46, 3), 'M40 34Q50 22 60 35', 'M50 34Q44 50 50 66', 'M60 37Q55 50 60 63', C(11, 30, 3), C(19.5, 20, 2.5), 'M4 84Q14 78 24 84T44 84T64 84T84 84T100 84'] },
    butterfly: { c: 'a', n: 'فراشة', p: [E(50, 52, 3.5, 20), 'M47 44C30 16 8 22 13 40C17 53 34 54 47 50z', 'M53 44C70 16 92 22 87 40C83 53 66 54 53 50z', 'M47 56C34 58 20 70 27 81C34 89 46 76 47 64z', 'M53 56C66 58 80 70 73 81C66 89 54 76 53 64z', 'M48 33Q42 22 37 19', 'M52 33Q58 22 63 19', C(28, 35, 5), C(72, 35, 5), C(33.5, 70, 3.5), C(66.5, 70, 3.5)] },
    // فضاء ومركبات
    rocket: { c: 'v', n: 'صاروخ', p: ['M50 8C63 21 65 40 62 66H38C35 40 37 21 50 8z', C(50, 36, 7), 'M38 50L24 70L38 66z', 'M62 50L76 70L62 66z', 'M42 66L50 88L58 66z', 'M38 56H62', STAR(16, 24, 5, 4, .35), STAR(84, 38, 5, 4, .35), STAR(82, 84, 5, 4, .35)] },
    car: { c: 'v', n: 'سيارة', p: ['M10 66L10 54L22 50L33 36L65 36L76 50L90 54L90 66z', 'M37 40L32 50H48V40z', 'M52 40V50H70L62 40z', C(30, 68, 9), C(70, 68, 9), C(30, 68, 3), C(70, 68, 3), 'M86 56h4v4h-4z', 'M2 80H98'] },
    plane: { c: 'v', n: 'طيارة', p: ['M10 52C10 46 16 44 24 44H78C88 44 94 50 94 52C94 56 88 58 78 58H24C16 58 10 56 10 52z', 'M44 56L30 80H40L60 56', 'M44 46L32 26H40L58 46', 'M16 46L10 30H18L28 44', C(64, 51, 2.5), C(72, 51, 2.5), C(56, 51, 2.5), 'M84 47Q90 50 88 52H82V47z', SCAL(80, 20, 7, 7), SCAL(16, 84, 6, 7)] },
    train: { c: 'v', n: 'قطار', p: ['M10 46H44V76H10z', 'M44 34H62V76H44z', 'M48 40H58V52H48z', 'M18 30H26V46H18z', C(22, 22, 5), C(32, 13, 6), 'M66 50H94V76H66z', 'M70 56H80V64H70z', 'M82 56H90V64H82z', C(20, 80, 6), C(36, 80, 6), C(54, 80, 6), C(74, 80, 6), C(88, 80, 6), 'M2 89H98'] },
    bus: { c: 'v', n: 'باص', p: ['M8 34H86Q94 34 94 44V74H8z', 'M14 40H28V54H14z', 'M32 40H46V54H32z', 'M50 40H64V54H50z', 'M68 40H80V54H68z', 'M84 40H90V70H84', 'M8 62H84', C(26, 76, 8), C(74, 76, 8), C(26, 76, 3), C(74, 76, 3), 'M2 88H98'] },
    balloon: { c: 'v', n: 'منطاد', p: ['M50 8C26 8 18 32 30 50L42 64H58L70 50C82 32 74 8 50 8z', 'M50 8C40 22 40 48 46 64', 'M50 8C60 22 60 48 54 64', 'M42 64L42 76M58 64L58 76', 'M40 76H60L57 88H43z', SCAL(14, 30, 6, 7), SCAL(86, 70, 7, 7)] },
    planet: { c: 'v', n: 'كوكب', p: [C(50, 50, 20), 'M10 56C10 44 90 40 90 50C90 60 10 66 10 56z', 'M34 40Q50 34 66 40', STAR(14, 16, 5), STAR(86, 18, 4), STAR(80, 84, 5), STAR(18, 82, 4), C(50, 88, 1.5), C(90, 34, 1.5)] },
    ufo: { c: 'v', n: 'صحن طائر', p: ['M36 44C36 28 64 28 64 44z', E(50, 48, 36, 10), C(30, 49, 2.5), C(50, 52, 2.5), C(70, 49, 2.5), 'M38 57L26 90H74L62 57', C(50, 37, 4), STAR(12, 14, 4), STAR(88, 20, 5)] },
    helicopter: { c: 'v', n: 'هليكوبتر', p: ['M30 40C18 40 14 56 24 64H60C70 64 72 52 66 46C60 40 48 40 30 40z', 'M64 50H92V56H66', 'M92 42V64', 'M10 30H84', 'M44 30V40', 'M22 50C24 45 32 45 34 47V56H22z', 'M22 74H66M32 64V74M56 64V74'] },
    bike: { c: 'v', n: 'سيكل', p: [C(26, 64, 16), C(74, 64, 16), 'M26 64L44 40H66L74 64', 'M44 40L50 64L66 40', 'M26 64H50', 'M38 34H50', 'M44 34V40', 'M66 40L64 30H72', C(50, 64, 4)] },
    // أشياء حلوة
    house: { c: 'n', n: 'بيت', p: ['M25 50h50v38h-50z', 'M18 52L50 22L82 52z', 'M64 31h7v12h-7z', 'M44 66h12v22h-12z', 'M30 58h10v10h-10z', 'M60 58h10v10h-10z', C(82, 16, 8), 'M4 88H96', 'M12 88V76a5 5 0 0 1 10 0V88'] },
    flower: { c: 'n', n: 'وردة', p: [C(65, 38, 8), C(60.6, 48.6, 8), C(50, 53, 8), C(39.4, 48.6, 8), C(35, 38, 8), C(39.4, 27.4, 8), C(50, 23, 8), C(60.6, 27.4, 8), C(50, 38, 8), 'M50 62V86', 'M50 74C42 64 32 66 30 70C36 78 44 78 50 74z', 'M50 72C58 62 68 64 70 68C64 76 56 76 50 72z', 'M36 86h28l-4 10h-20z'] },
    tree: { c: 'n', n: 'شجرة', p: [SCAL(50, 38, 26, 9), 'M44 62H56V90H44z', C(40, 34, 3.5), C(58, 30, 3.5), C(54, 46, 3.5), C(36, 48, 3.5), C(64, 44, 3.5), 'M6 90H94'] },
    sun: { c: 'n', n: 'شمس', p: [C(50, 50, 20), RAYS(50, 50, 25, 38, 12), C(43, 46, 2.5), C(57, 46, 2.5), 'M41 55Q50 64 59 55'] },
    rainbow: { c: 'n', n: 'قوس قزح', p: ['M10 70A40 40 0 0 1 90 70', 'M18 70A32 32 0 0 1 82 70', 'M26 70A24 24 0 0 1 74 70', 'M34 70A16 16 0 0 1 66 70', 'M10 70H34M66 70H90', SCAL(16, 74, 9, 7), SCAL(84, 74, 9, 7)] },
    icecream: { c: 'n', n: 'آيسكريم', p: ['M34 50L50 92L66 50z', 'M38 58L60 76M62 58L42 78M44 72L56 86', 'M32 50C28 40 34 30 42 32C44 22 58 22 60 32C68 30 74 42 68 50z', C(52, 18, 4), 'M52 14Q54 8 60 8'] },
    cake: { c: 'n', n: 'كيكة', p: ['M18 60H82V86H18z', 'M26 40H74V60H26z', 'M18 66Q24 72 30 66Q36 72 42 66Q48 72 54 66Q60 72 66 66Q72 72 78 66Q82 70 82 66', 'M38 28H42V40H38z', 'M48 28H52V40H48z', 'M58 28H62V40H58z', 'M40 26Q36 20 40 14Q44 20 40 26z', 'M50 26Q46 20 50 14Q54 20 50 26z', 'M60 26Q56 20 60 14Q64 20 60 26z', 'M8 88H92'] },
    balloons: { c: 'n', n: 'بالونات', p: [E(32, 32, 13, 16), E(56, 26, 13, 16), E(72, 46, 13, 16), 'M30 48L34 52L28 52z', 'M54 42L58 46L52 46z', 'M70 62L74 66L68 66z', 'M31 52Q36 72 50 92', 'M55 46Q52 70 50 92', 'M71 66Q62 80 50 92'] },
    crown: { c: 'n', n: 'تاج', p: ['M14 74L18 34L34 54L50 24L66 54L82 34L86 74z', 'M14 74H86V84H14z', C(50, 62, 4), C(32, 64, 3), C(68, 64, 3), C(18, 31, 3), C(50, 21, 3), C(82, 31, 3)] },
    castle: { c: 'n', n: 'قلعة', p: ['M10 40H28V90H10z', 'M72 40H90V90H72z', 'M28 54H72V90H28z', 'M8 40L19 18L30 40z', 'M70 40L81 18L92 40z', 'M28 54V46H36V54M44 54V46H56V54M64 54V46H72V54', 'M42 90V74C42 66 58 66 58 74V90', 'M16 50H22V58H16z', 'M78 50H84V58H78z', 'M19 18V8L27 11L19 14'] },
    heart: { c: 'n', n: 'قلب', p: ['M50 88C20 66 8 50 12 33C16 18 36 14 50 30C64 14 84 18 88 33C92 50 80 66 50 88z', 'M50 70C36 60 30 52 32 44C34 37 44 35 50 43C56 35 66 37 68 44C70 52 64 60 50 70z'] },
    star: { c: 'n', n: 'نجمة', p: [STAR(50, 52, 42, 5, .48), STAR(50, 54, 20, 5, .48), C(14, 14, 2), C(88, 86, 2)] }
  };
  var CATS = [['h', '🐪 تراثنا'], ['a', '🐱 حيوانات'], ['v', '🚀 فضاء ومركبات'], ['n', '🌈 أشياء حلوة'], ['fam', '👨‍👩‍👧 العائلة'], ['photo', '📷 صورتك'], ['bg', '🎨 لون الورقة']];

  var COLORS = ['#1B2333', '#E53935', '#FF7043', '#FF8A3D', '#F5B62A', '#FFE14D', '#8BD346', '#23854D', '#00A896', '#3FC1C9', '#9AD3F5', '#2F6FDB', '#3D3DB4', '#7E57C2', '#A13D8F', '#F28AB2', '#FFD6E7', '#8A5A3C', '#C49A6C', '#FFE0B2', '#9E9E9E', '#FFFFFF'];
  var BGS = ['#FFFFFF', '#FFF4C7', '#FAD9E6', '#DCEBFA', '#D6F0E0', '#E6E0FA', '#FFE0D6', '#BDE7FF', '#1B2333', '#2B3FA8', '#0F8B8D', '#F5B62A'];
  var BRUSHES = [['pen', '✏️', 'قلم'], ['crayon', '🖍️', 'شمع'], ['glitter', '✨', 'لمعة'], ['spray', '💨', 'بخاخ'], ['water', '💧', 'مائي'], ['pattern', '⭐', 'رشّة أشكال'], ['rainbow', '🌈', 'قوس قزح'], ['glow', '💡', 'نيون'], ['fill', '🪣', 'تعبئة'], ['shape', '🔷', 'أشكال'], ['erase', '🧽', 'ممحاة']];
  var PATS = [['star', '⭐'], ['heart', '❤️'], ['flower', '🌸'], ['dot', '⚪'], ['rb', '🌈']];
  var SHAPES = [['circle', '⚪', 'دائرة'], ['rect', '⬜', 'مربع'], ['star', '⭐', 'نجمة'], ['heart', '❤️', 'قلب'], ['tri', '🔺', 'مثلث'], ['line', '➖', 'خط']];
  var SIZES = [.012, .026, .05, .09];
  var SPARK = ['#FFD54A', '#FFFFFF', '#FF8AD8', '#8AE8FF', '#B9F27C'];

  /* ---------- المحرّك (نفسه للرسم وللتشغيل) ---------- */
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function mirrors(m, W, H) {
    var cx = W / 2, cy = H / 2, f = [function (x, y) { return [x, y]; }];
    if (m === 2) f.push(function (x, y) { return [2 * cx - x, y]; });
    else if (m === 4) f.push(function (x, y) { return [2 * cx - x, y]; }, function (x, y) { return [x, 2 * cy - y]; }, function (x, y) { return [2 * cx - x, 2 * cy - y]; });
    else if (m === 8) {
      f = [];
      [0, 1, 2, 3].forEach(function (r) { [0, 1].forEach(function (fl) {
        f.push(function (x, y) { var dx = x - cx, dy = y - cy; if (fl) dx = -dx; for (var k = 0; k < r; k++) { var t = dx; dx = -dy; dy = t; } return [cx + dx, cy + dy]; });
      }); });
    }
    return f;
  }
  function shapePath(ctx, k, x, y, r) {
    ctx.beginPath();
    if (k === 'star') { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx[i ? 'lineTo' : 'moveTo'](x + rr * Math.cos(a), y + rr * Math.sin(a)); } ctx.closePath(); }
    else if (k === 'heart') { var s = r / 12; ctx.moveTo(x, y + 10 * s); ctx.bezierCurveTo(x - 14 * s, y, x - 12 * s, y - 12 * s, x, y - 5 * s); ctx.bezierCurveTo(x + 12 * s, y - 12 * s, x + 14 * s, y, x, y + 10 * s); ctx.closePath(); }
    else if (k === 'flower') { for (var j = 0; j < 5; j++) { var b = j * Math.PI * 2 / 5; ctx.moveTo(x + r * .55 * Math.cos(b) + r * .42, y + r * .55 * Math.sin(b)); ctx.arc(x + r * .55 * Math.cos(b), y + r * .55 * Math.sin(b), r * .42, 0, Math.PI * 2); } }
    else if (k === 'tri') { ctx.moveTo(x, y - r); ctx.lineTo(x + r * .87, y + r * .5); ctx.lineTo(x - r * .87, y + r * .5); ctx.closePath(); }
    else ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  function hexA(c, a) { var n = parseInt(c.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  function Engine(cv, opt) {
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    var E = { cv: cv, ctx: ctx, ops: [], lines: null, base: null, dpr: opt && opt.dpr || 1 };
    E.bg = function () { for (var i = E.ops.length - 1; i >= 0; i--) if (E.ops[i].t === 'bg') return E.ops[i].c; return '#FFFFFF'; };
    E.page = function () { for (var i = E.ops.length - 1; i >= 0; i--) if (E.ops[i].t === 'pg') return E.ops[i].k; return null; };
    // خطوط صفحة التلوين (فوق كل شي)
    E.drawLines = function () {
      var k = E.page(), W = cv.width, H = cv.height; if (!k) return;
      ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (PAGES[k]) {
        var sc = Math.min(W, H) / 100 * .92, ox = (W - 100 * sc) / 2, oy = (H - 100 * sc) / 2;
        ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.lineWidth = 1.6; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#1B2333';
        PAGES[k].p.forEach(function (d) { try { ctx.stroke(new Path2D(d)); } catch (e) {} });
      } else if (E.lines) {
        var im = E.lines, s2 = Math.min(W / im.width, H / im.height) * (k === 'photo' ? 1 : .92), w2 = im.width * s2, h2 = im.height * s2;
        ctx.drawImage(im, (W - w2) / 2, (H - h2) / 2, w2, h2);
      }
      ctx.restore();
    };
    E.seg = function (o, i) {
      var W = cv.width, H = cv.height, P = o.p, lw = Math.max(1, o.w * W), fs = mirrors(o.m || 0, W, H);
      var a = P[Math.max(0, i - 1)], b = P[i], ax = a[0] * W, ay = a[1] * H, bx = b[0] * W, by = b[1] * H;
      var R = rng((o.sd || 1) * 7919 + i * 104729), dist = Math.hypot(bx - ax, by - ay);
      ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.shadowBlur = 0;
      fs.forEach(function (f, fi) {
        var A1 = f(ax, ay), B1 = f(bx, by), x0 = A1[0], y0 = A1[1], x1 = B1[0], y1 = B1[1];
        var line = function (col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + (dist ? 0 : .1), y1); ctx.stroke(); };
        var steps = function (gap, fn) { var n = Math.max(1, Math.ceil(dist / gap)); for (var s = 0; s < n; s++) { var t = (s + R()) / n; fn(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); } };
        var b2 = o.b;
        if (b2 === 'erase') line(E.bg(), lw);
        else if (b2 === 'rainbow') line('hsl(' + ((o.h + i * 7) % 360) + ',90%,55%)', lw);
        else if (b2 === 'glow') { ctx.shadowColor = o.c; ctx.shadowBlur = lw * 1.3; line(o.c, lw); ctx.shadowBlur = 0; line('rgba(255,255,255,.8)', Math.max(1.5, lw * .35)); }
        else if (b2 === 'crayon') {
          ctx.fillStyle = o.c;
          steps(Math.max(1, lw * .22), function (x, y) {
            for (var k = 0; k < 7; k++) { var an = R() * 6.283, rr = Math.sqrt(R()) * lw * .5; ctx.globalAlpha = .35 + R() * .45; ctx.fillRect(x + Math.cos(an) * rr, y + Math.sin(an) * rr, Math.max(1, lw * .09), Math.max(1, lw * .09)); }
          });
          ctx.globalAlpha = 1;
        } else if (b2 === 'spray') {
          ctx.fillStyle = o.c;
          steps(Math.max(1, lw * .35), function (x, y) { for (var k = 0; k < 9; k++) { var an = R() * 6.283, rr = Math.sqrt(R()) * lw * 1.3, d = Math.max(1, lw * .06); ctx.globalAlpha = .55 + R() * .45; ctx.fillRect(x + Math.cos(an) * rr, y + Math.sin(an) * rr, d, d); } });
          ctx.globalAlpha = 1;
        } else if (b2 === 'water') {
          steps(Math.max(1, lw * .3), function (x, y) {
            var r = lw * .7 * (.85 + R() * .3), g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, hexA(o.c, .1)); g.addColorStop(.7, hexA(o.c, .07)); g.addColorStop(1, hexA(o.c, 0));
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
          });
        } else if (b2 === 'glitter') {
          line(hexA(o.c, .35), lw * .7);
          steps(Math.max(1, lw * .5), function (x, y) {
            if (R() < .45) return;
            var an = R() * 6.283, rr = R() * lw * .9, sx = x + Math.cos(an) * rr, sy = y + Math.sin(an) * rr, z = lw * (.18 + R() * .35);
            ctx.fillStyle = R() < .4 ? o.c : SPARK[Math.floor(R() * SPARK.length)];
            ctx.beginPath(); ctx.moveTo(sx, sy - z); ctx.quadraticCurveTo(sx, sy, sx + z, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + z); ctx.quadraticCurveTo(sx, sy, sx - z, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - z); ctx.fill();
          });
        } else if (b2 === 'pattern') {
          // نحط شكل كل مسافة ثابتة على طول الخط
          // المسافة التراكمية على طول الخط (تكبر مع الرسم)
          if (!o._d || o._dW !== W) { o._d = [0]; o._dW = W; }
          for (var q = o._d.length; q < P.length; q++) o._d.push(o._d[q - 1] + Math.hypot((P[q][0] - P[q - 1][0]) * W, (P[q][1] - P[q - 1][1]) * H));
          var gap = lw * 2.6, d0 = i ? o._d[i - 1] : 0, d1 = o._d[i];
          for (var n = i ? Math.floor(d0 / gap) + 1 : 0; n * gap <= d1 && (i ? d1 > d0 : n === 0); n++) {
            var t = i ? (n * gap - d0) / (d1 - d0) : 0, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, R2 = rng(n * 31 + (o.sd || 1));
            var col = o.pt === 'rb' ? 'hsl(' + ((n * 47 + (o.sd || 0)) % 360) + ',90%,58%)' : o.c, z = lw * (.8 + R2() * .5);
            ctx.save(); ctx.translate(x, y); ctx.rotate((R2() - .5) * 1.2); ctx.fillStyle = col;
            shapePath(ctx, o.pt === 'rb' ? ['star', 'heart', 'flower'][n % 3] : o.pt, 0, 0, z); ctx.fill(); ctx.restore();
          }
        } else line(o.c, lw);
      });
      ctx.restore();
    };
    E.shape = function (o) {
      var W = cv.width, H = cv.height, lw = Math.max(2, o.w * W), fs = mirrors(o.m || 0, W, H);
      ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = o.c; ctx.shadowBlur = 0;
      fs.forEach(function (f) {
        var a = f(o.a[0] * W, o.a[1] * H), b = f(o.b[0] * W, o.b[1] * H), r = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (o.k === 'line') { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
        else if (o.k === 'rect') { ctx.beginPath(); ctx.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); }
        else shapePath(ctx, o.k, a[0], a[1], Math.max(4, r));
        ctx.stroke();
      });
      ctx.restore();
    };
    E.flood = function (o) {
      var W = cv.width, H = cv.height;
      mirrors(o.m || 0, W, H).forEach(function (f) { var p = f(o.x * W, o.y * H); flood(ctx, W, H, Math.floor(p[0]), Math.floor(p[1]), o.c); });
    };
    E.drawBase = function () {
      var W = cv.width, H = cv.height, bi = E.base; if (!bi) return;
      var k0 = Math.min(W / bi.width, H / bi.height); ctx.drawImage(bi, (W - bi.width * k0) / 2, (H - bi.height * k0) / 2, bi.width * k0, bi.height * k0);
    };
    E.clear = function () { var W = cv.width, H = cv.height; ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.fillStyle = E.bg(); ctx.fillRect(0, 0, W, H); ctx.restore(); E.drawBase(); E.drawLines(); };
    // رسم عملية كاملة
    E.op = function (o) {
      if (o.t === 's') { for (var i = 0; i < o.p.length; i++) E.seg(o, i); }
      else if (o.t === 'f') E.flood(o);
      else if (o.t === 'sh') E.shape(o);
      if (o.t === 's' || o.t === 'f' || o.t === 'sh') E.drawLines();
    };
    E.redraw = function (skip) {
      // نبدأ من آخر خلفية/صفحة
      E.clear();
      E.ops.forEach(function (o) { if (o !== skip) E.op(o); });
    };
    return E;
  }
  /* التعبئة: نلوّن المنطقة المقفلة */
  function flood(ctx, W, H, x0, y0, c) {
    if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return;
    var img = ctx.getImageData(0, 0, W, H), d = new Uint32Array(img.data.buffer);
    var seed = d[y0 * W + x0], sr = seed & 255, sg = (seed >> 8) & 255, sb = (seed >> 16) & 255;
    var n = parseInt(c.slice(1), 16), fill = (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16);
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
    for (var k = 0; k < d.length; k++) if (seen[k]) { if (k % W && !seen[k - 1]) d[k - 1] = fill; if ((k + 1) % W && !seen[k + 1]) d[k + 1] = fill; }
    ctx.putImageData(img, 0, 0);
  }

  /* ---------- صورة ← خطوط تلوين ---------- */
  function lineArt(src, photo) {
    var M = 640, k = Math.min(1, M / Math.max(src.width, src.height)), W = Math.max(2, Math.round(src.width * k)), H = Math.max(2, Math.round(src.height * k));
    var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(src, 0, 0, W, H);
    var d = x.getImageData(0, 0, W, H).data, g = new Float32Array(W * H);
    for (var i = 0; i < W * H; i++) g[i] = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114;
    if (photo) { // تنعيم بسيط للصور عشان ما تطلع نقاط كثيرة
      for (var pass = 0; pass < 2; pass++) { var h = new Float32Array(g); for (var y = 1; y < H - 1; y++) for (var xx = 1; xx < W - 1; xx++) { var p = y * W + xx; g[p] = (h[p] * 4 + h[p - 1] + h[p + 1] + h[p - W] + h[p + W]) / 8; } }
    }
    var mag = new Float32Array(W * H), all = [];
    for (var y2 = 1; y2 < H - 1; y2++) for (var x2 = 1; x2 < W - 1; x2++) {
      var q = y2 * W + x2;
      var gx = -g[q - W - 1] - 2 * g[q - 1] - g[q + W - 1] + g[q - W + 1] + 2 * g[q + 1] + g[q + W + 1];
      var gy = -g[q - W - 1] - 2 * g[q - W] - g[q - W + 1] + g[q + W - 1] + 2 * g[q + W] + g[q + W + 1];
      mag[q] = Math.hypot(gx, gy); if (photo && (q & 7) === 0) all.push(mag[q]);
    }
    var th = 90;
    if (photo && all.length) { all.sort(function (a, b) { return a - b; }); th = Math.max(40, all[Math.floor(all.length * .86)]); }
    var out = x.createImageData(W, H), o = out.data;
    for (var j = 0; j < W * H; j++) if (mag[j] > th) {
      // نسمّك الخط شوي
      [j, j + 1, j + W].forEach(function (z) { if (z < W * H) { o[z * 4] = 27; o[z * 4 + 1] = 35; o[z * 4 + 2] = 51; o[z * 4 + 3] = 255; } });
    }
    x.clearRect(0, 0, W, H); x.putImageData(out, 0, 0);
    return c;
  }
  var famArt = {};
  function famLines(id) {
    if (famArt[id]) return famArt[id];
    return (famArt[id] = A.avatarImage(id, 560).then(function (c) { return lineArt(c, false); }));
  }

  /* ---------- ترميز الرسمة للتشغيل (pl) ---------- */
  function q(v) { return Math.round(v * 1000); }
  function encode(ops, aspect) {
    var out = [];
    ops.forEach(function (o) {
      if (o.t === 's') { var f = []; o.p.forEach(function (p) { f.push(q(p[0]), q(p[1])); }); out.push({ t: 's', b: o.b, c: o.c, w: q(o.w), m: o.m || 0, sd: o.sd, h: o.h, pt: o.pt, p: f }); }
      else if (o.t === 'sh') out.push({ t: 'sh', k: o.k, c: o.c, w: q(o.w), m: o.m || 0, a: [q(o.a[0]), q(o.a[1])], b: [q(o.b[0]), q(o.b[1])] });
      else if (o.t === 'f') out.push({ t: 'f', x: q(o.x), y: q(o.y), c: o.c, m: o.m || 0 });
      else out.push(o.t === 'bg' ? { t: 'bg', c: o.c } : { t: 'pg', k: o.k });
    });
    return JSON.stringify({ v: 1, r: Math.round(aspect * 1000) / 1000, o: out });
  }
  function decode(s) {
    var d = typeof s === 'string' ? JSON.parse(s) : s, u = function (v) { return v / 1000; };
    d.o = d.o.map(function (o) {
      if (o.t === 's') { var p = []; for (var i = 0; i < o.p.length; i += 2) p.push([u(o.p[i]), u(o.p[i + 1])]); o.p = p; o.w = u(o.w); }
      else if (o.t === 'sh') { o.w = u(o.w); o.a = [u(o.a[0]), u(o.a[1])]; o.b = [u(o.b[0]), u(o.b[1])]; }
      else if (o.t === 'f') { o.x = u(o.x); o.y = u(o.y); }
      return o;
    });
    return d;
  }

  /* ---------- الأصوات الخفيفة ---------- */
  var snd = { on: (function () { try { return localStorage.getItem('nabd-dsnd') !== '0'; } catch (e) { return true; } })(), ac: null, noise: null, g: null };
  function sndInit() {
    if (!snd.on || snd.ac) return;
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)(); snd.ac = ac;
      var len = ac.sampleRate * 1, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = .8;
      var g = ac.createGain(); g.gain.value = 0; src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(); snd.g = g;
    } catch (e) { snd.ac = null; }
  }
  function scribble(v) { if (!snd.on || !snd.g) return; try { snd.g.gain.setTargetAtTime(Math.min(.05, v), snd.ac.currentTime, .03); } catch (e) {} }
  function pop(f) {
    if (!snd.on) return; sndInit(); if (!snd.ac) return;
    try { var ac = snd.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f || 660, ac.currentTime); o.frequency.exponentialRampToValueAtTime((f || 660) * 1.6, ac.currentTime + .08); g.gain.setValueAtTime(.08, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .14); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .15); } catch (e) {}
  }
  function sndClose() { try { if (snd.ac) snd.ac.close(); } catch (e) {} snd.ac = null; snd.g = null; }

  /* ---------- رسوماتي (مسودات على الجهاز) ---------- */
  function draftsKey() { return 'drafts:' + A.S.me; }
  function drafts() { return NB.kv.get(draftsKey()).then(function (a) { return a || []; }, function () { return []; }); }
  function saveDraft(d) { return drafts().then(function (a) { a = a.filter(function (x) { return x.id !== d.id; }); a.unshift(d); return NB.kv.set(draftsKey(), a.slice(0, 10)); }); }
  function dropDraft(id) { return drafts().then(function (a) { return NB.kv.set(draftsKey(), a.filter(function (x) { return x.id !== id; })); }); }

  function svgThumb(k) { return '<svg viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + PAGES[k].p.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g></svg>'; }

  /* ================= شاشة الرسم ================= */
  function screen(opt) {
    opt = opt && !opt.target ? opt : {};
    var S = A.S, $ = A.$, esc = A.esc, ic = A.ic, chat = S.chat;
    S.view = 'draw';
    var st = { tool: 'pen', color: COLORS[1], size: 1, mirror: 0, pat: 'star', shape: 'circle', redo: [], draftId: opt.draft ? opt.draft.id : A.rid(8), photo: null, voice: null, dirty: false };
    var el = A.show(
      '<div class="d2top"><button class="icb" id="dx" aria-label="إغلاق">' + ic('close') + '</button><span class="fd grow d2title">' + (opt.base ? '🖍️ كمّل الرسمة' : '🎨 ارسم لـ' + esc(A.chatTitle(chat))) + '</span>' +
      '<button class="icb" id="dsd" aria-label="رسوماتي">💾</button><button class="icb" id="dsn" aria-label="الأصوات">' + (snd.on ? '🔊' : '🔇') + '</button>' +
      '<button class="icb" id="du" aria-label="تراجع">' + ic('undo') + '</button><button class="icb" id="dr" aria-label="إعادة" style="transform:scaleX(-1)">' + ic('undo') + '</button></div>' +
      '<div class="d2wrap" id="dw"><div class="d2zoom" id="dz"><canvas id="cv"></canvas><svg class="d2guide" id="dg" preserveAspectRatio="none" viewBox="0 0 100 100"></svg></div>' +
      '<button class="d2zr" id="dzr" hidden>🔍 رجّع الحجم</button><div class="d2resume" id="dres" hidden></div></div>' +
      '<div class="d2panel">' +
      '<div class="d2tools" id="dtl">' + BRUSHES.map(function (t) { return '<button data-tool="' + t[0] + '"' + (t[0] === st.tool ? ' class="on"' : '') + '><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join('') + '</div>' +
      '<div id="dctx" class="d2ctx"></div>' +
      '<div class="d2row"><div class="d2sizes">' + SIZES.map(function (s, i) { return '<button data-s="' + i + '"' + (i === st.size ? ' class="on"' : '') + ' aria-label="حجم ' + (i + 1) + '"><i style="width:' + [6, 11, 17, 24][i] + 'px;height:' + [6, 11, 17, 24][i] + 'px"></i></button>'; }).join('') + '</div>' +
      '<button class="d2b" id="dm" aria-label="المرآة">🪞<b id="dmv">لا</b></button><button class="d2b" id="dp" aria-label="الورقة">📄<b>ورقة</b></button><button class="d2b" id="dv" aria-label="صوت مع الرسمة">🎤<b id="dvv">صوت</b></button>' +
      '<span class="grow"></span><button class="btn d2send" id="ds" aria-label="إرسال">' + ic('send', 'style="transform:scaleX(-1)"') + '</button></div></div>', 'd2');
    el.style.height = '100dvh';
    var cv = $('#cv'), wrap = $('#dw'), zoom = $('#dz'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var E = Engine(cv, { dpr: dpr });
    if (opt.base) E.base = opt.base;
    var cur = null, snap = null;

    function fit() {
      var r = wrap.getBoundingClientRect(); if (!r.width) return;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
      E.redraw();
    }
    function guides() {
      var g = $('#dg'), m = st.mirror, r = wrap.getBoundingClientRect(), ar = r.height / (r.width || 1), h = '';
      if (m >= 2) h += '<line x1="50" y1="0" x2="50" y2="100"/>';
      if (m >= 4) h += '<line x1="0" y1="50" x2="100" y2="50"/>';
      if (m === 8) { var dy = 50 / ar; h += '<line x1="' + (50 - 50 * ar) + '" y1="0" x2="' + (50 + 50 * ar) + '" y2="100"/><line x1="' + (50 + 50 * ar) + '" y1="0" x2="' + (50 - 50 * ar) + '" y2="100"/>'; void dy; }
      g.innerHTML = h; $('#dmv').textContent = m ? (m === 2 ? '٢' : m === 4 ? '٤' : '٨') : 'لا';
      $('#dm').classList.toggle('on', !!m);
    }
    function changed() {
      st.dirty = true; st.redo = []; updBtns();
      clearTimeout(st.saveT); st.saveT = setTimeout(autoSave, 1500);
    }
    function updBtns() { $('#du').disabled = !E.ops.some(function (o) { return o.t !== 'pg'; }); $('#dr').disabled = !st.redo.length; }
    function hasInk() { return E.ops.some(function (o) { return o.t === 's' || o.t === 'f' || o.t === 'sh'; }); }
    function thumb() { var c = document.createElement('canvas'), k = 200 / Math.max(cv.width, cv.height); c.width = Math.round(cv.width * k); c.height = Math.round(cv.height * k); c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .7); }
    function autoSave() {
      if (!hasInk()) return Promise.resolve();
      var d = { id: st.draftId, chat: chat, t: Date.now(), ops: JSON.parse(encode(E.ops, cv.width / cv.height)), thumb: thumb() };
      if (E.page() === 'photo' && st.photo) d.photo = st.photo.toDataURL('image/png');
      return saveDraft(d);
    }
    function loadDraft(d) {
      st.draftId = d.id;
      var dd = decode({ v: 1, r: 1, o: JSON.parse(JSON.stringify(d.ops.o || d.ops)) });
      E.ops = dd.o; E.lines = null;
      var k = E.page(), go = function () { E.redraw(); updBtns(); };
      if (k === 'photo' && d.photo) { var im = new Image(); im.onload = function () { st.photo = im; E.lines = im; go(); }; im.src = d.photo; }
      else if (k && /^av:/.test(k)) famLines(k.slice(3)).then(function (c) { E.lines = c; go(); });
      else go();
    }

    /* ---- الإدخال: رسم بإصبع، تكبير بإصبعين ---- */
    var ptrs = {}, pinch = null, view = { s: 1, x: 0, y: 0 }, lastP = null, lastT = 0;
    function applyView() {
      var r = wrap.getBoundingClientRect();
      view.s = Math.max(1, Math.min(5, view.s));
      view.x = Math.min(0, Math.max(r.width * (1 - view.s), view.x)); view.y = Math.min(0, Math.max(r.height * (1 - view.s), view.y));
      if (view.s === 1) { view.x = view.y = 0; }
      zoom.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.s + ')';
      $('#dzr').hidden = view.s < 1.05;
    }
    function pt(e) { var r = cv.getBoundingClientRect(); return [Math.max(-0.05, Math.min(1.05, (e.clientX - r.left) / r.width)), Math.max(-0.05, Math.min(1.05, (e.clientY - r.top) / r.height))]; }
    function takeSnap() { snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; snap.getContext('2d').drawImage(cv, 0, 0); }
    wrap.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      try { wrap.setPointerCapture(e.pointerId); } catch (x) {}
      ptrs[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(ptrs);
      if (ids.length === 2) {
        // إصبعين = تكبير/تحريك، ونلغي الخط القصير اللي بدأ بالإصبع الأول
        if (cur && cur.t === 's' && cur.p.length < 10) { E.ops.pop(); E.redraw(); }
        else if (cur && cur.t === 'sh') { E.ops.pop(); E.redraw(); }
        cur = null; snap = null; scribble(0);
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, s: view.s, x: view.x, y: view.y };
        return;
      }
      if (ids.length > 2 || pinch) return;
      sndInit();
      var p = pt(e), t = st.tool, size = SIZES[st.size];
      if (t === 'fill') { var o = { t: 'f', x: p[0], y: p[1], c: st.color, m: st.mirror }; E.ops.push(o); E.op(o); pop(520); if (navigator.vibrate) navigator.vibrate(12); changed(); return; }
      if (t === 'shape') { cur = { t: 'sh', k: st.shape, c: st.color, w: size * .7, m: st.mirror, a: p, b: p }; E.ops.push(cur); takeSnap(); return; }
      cur = { t: 's', b: t, c: st.color, w: t === 'erase' ? Math.max(.04, size * 1.6) : size, m: st.mirror, sd: Math.floor(Math.random() * 1e6), h: Math.floor(Math.random() * 360), pt: st.pat, p: [p] };
      E.ops.push(cur); E.seg(cur, 0); lastP = p; lastT = performance.now();
    });
    wrap.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = [e.clientX, e.clientY];
      if (pinch) {
        var ids = Object.keys(ptrs); if (ids.length < 2) return;
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, r = wrap.getBoundingClientRect();
        var s = Math.max(1, Math.min(5, pinch.s * d / (pinch.d || 1)));
        // نخلي النقطة اللي بين الإصبعين ثابتة
        var cx = pinch.mx - r.left, cy = pinch.my - r.top;
        view.x = cx - (cx - pinch.x) * s / pinch.s + (mx - pinch.mx); view.y = cy - (cy - pinch.y) * s / pinch.s + (my - pinch.my); view.s = s;
        applyView(); return;
      }
      if (!cur) return;
      var p = pt(e);
      if (cur.t === 'sh') { cur.b = p; var c2 = cv.getContext('2d'); c2.drawImage(snap, 0, 0); E.shape(cur); E.drawLines(); return; }
      var lp = cur.p[cur.p.length - 1];
      if (Math.abs(lp[0] - p[0]) + Math.abs(lp[1] - p[1]) < .0025) return;
      cur.p.push(p); E.seg(cur, cur.p.length - 1);
      var now = performance.now(), sp = Math.hypot(p[0] - lastP[0], p[1] - lastP[1]) / Math.max(1, now - lastT) * 1000; lastP = p; lastT = now;
      scribble(cur.b === 'erase' ? sp * .02 : sp * .035);
    });
    function up(e) {
      delete ptrs[e.pointerId];
      if (pinch) { if (!Object.keys(ptrs).length) pinch = null; return; }
      if (!cur) return;
      scribble(0);
      if (cur.t === 'sh') { if (Math.hypot(cur.b[0] - cur.a[0], cur.b[1] - cur.a[1]) < .01) cur.b = [cur.a[0] + .08, cur.a[1] + .08]; cv.getContext('2d').drawImage(snap, 0, 0); E.shape(cur); pop(760); snap = null; }
      E.drawLines(); cur = null; changed();
    }
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    $('#dzr').onclick = function () { view = { s: 1, x: 0, y: 0 }; applyView(); };

    /* ---- اللوحة ---- */
    function colorRow() {
      return '<div class="d2colors">' + COLORS.map(function (c) { return '<button class="sw' + (c === st.color ? ' on' : '') + '" data-c="' + c + '" aria-label="لون" style="background:' + c + '"></button>'; }).join('') +
        '<label class="sw d2pick' + (COLORS.indexOf(st.color) < 0 ? ' on' : '') + '" aria-label="لون من عندك"' + (COLORS.indexOf(st.color) < 0 ? ' style="background:' + st.color + '"' : '') + '><input type="color" id="dcp" value="' + st.color + '"></label></div>';
    }
    function paintCtx() {
      var box = $('#dctx'), t = st.tool, h = '';
      if (t === 'pattern') h = '<div class="d2chips">' + PATS.map(function (p) { return '<button data-pt="' + p[0] + '"' + (p[0] === st.pat ? ' class="on"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div>' + (st.pat === 'rb' ? '' : colorRow());
      else if (t === 'shape') h = '<div class="d2chips">' + SHAPES.map(function (p) { return '<button data-sh="' + p[0] + '"' + (p[0] === st.shape ? ' class="on"' : '') + '>' + p[1] + ' ' + p[2] + '</button>'; }).join('') + '</div>' + colorRow();
      else if (t === 'rainbow') h = '<p class="d2hint">🌈 ارسم وتطلع الألوان لحالها!</p>';
      else if (t === 'erase') h = '<p class="d2hint">🧽 امسح بإصبعك · الحجم من تحت</p>';
      else h = colorRow() + (t === 'fill' ? '<p class="d2hint" style="padding:4px 2px 0">اضغط داخل أي شكل يتلوّن كله 🪣</p>' : '');
      box.innerHTML = h;
      box.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { st.color = b.dataset.c; pop(880); paintCtx(); }; });
      box.querySelectorAll('[data-pt]').forEach(function (b) { b.onclick = function () { st.pat = b.dataset.pt; paintCtx(); }; });
      box.querySelectorAll('[data-sh]').forEach(function (b) { b.onclick = function () { st.shape = b.dataset.sh; paintCtx(); }; });
      var cp = $('#dcp'); if (cp) cp.oninput = function () { st.color = cp.value.toUpperCase(); var l = cp.parentNode; l.style.background = st.color; box.querySelectorAll('.sw').forEach(function (x) { x.classList.toggle('on', x === l); }); };
    }
    function setTool(t) { st.tool = t; el.querySelectorAll('[data-tool]').forEach(function (x) { x.classList.toggle('on', x.dataset.tool === t); }); paintCtx(); }
    el.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { setTool(b.dataset.tool); pop(600); }; });
    el.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { st.size = +b.dataset.s; el.querySelectorAll('[data-s]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#dm').onclick = function () { st.mirror = { 0: 2, 2: 4, 4: 8, 8: 0 }[st.mirror]; guides(); pop(700); if (st.mirror === 2 && !st.mirTip) { st.mirTip = 1; A.toast('🪞 ارسم بجهة وتنعكس على الثانية!'); } };
    $('#du').onclick = function () { for (var i = E.ops.length - 1; i >= 0; i--) if (E.ops[i].t !== 'pg') { st.redo.push(E.ops.splice(i, 1)[0]); break; } E.redraw(); updBtns(); pop(400); clearTimeout(st.saveT); st.saveT = setTimeout(autoSave, 1500); };
    $('#dr').onclick = function () { var o = st.redo.pop(); if (!o) return; E.ops.push(o); if (o.t === 'bg') E.redraw(); else E.op(o); updBtns(); pop(500); };
    $('#dsn').onclick = function () { snd.on = !snd.on; try { localStorage.setItem('nabd-dsnd', snd.on ? '1' : '0'); } catch (e) {} this.textContent = snd.on ? '🔊' : '🔇'; if (!snd.on) sndClose(); };

    /* ---- الورقة: صفحات تلوين، العائلة، صورتك، لون الورقة ---- */
    function startPage(op, lines) {
      var go = function () {
        st.draftId = A.rid(8); st.redo = []; var keepBg = E.bg();
        E.ops = keepBg !== '#FFFFFF' && op.t === 'pg' ? [{ t: 'bg', c: keepBg }] : [];
        E.lines = lines || null; E.ops.push(op); E.redraw(); updBtns(); if (op.t === 'pg') setTool('fill');
      };
      if (hasInk()) { autoSave().then(function () { A.toast('رسمتك السابقة انحفظت في 💾 رسوماتي'); go(); }); } else go();
    }
    function pageSheet() {
      var tab = 'h';
      var sh = A.sheet('<div class="row"><h2 class="grow" style="font-size:22px">📄 ورقة جديدة</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
        '<div class="chips d2cats">' + CATS.map(function (c) { return '<button class="chip' + (c[0] === tab ? ' on' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div><div id="pgl"></div>');
      $('#x', sh).onclick = function () { sh.remove(); };
      function paint() {
        var box = $('#pgl', sh), h = '';
        if (tab === 'fam') h = '<div class="d2pages">' + A.live().map(function (id) { return '<button data-av="' + id + '">' + A.av(id, 64) + '<span>' + esc(A.nm(id)) + '</span></button>'; }).join('') + '</div><p class="small muted" style="margin:8px 2px 0">شخصية أي واحد من العائلة تصير صفحة تلوين 🖍️</p>';
        else if (tab === 'photo') h = '<div class="col" style="gap:10px;text-align:center;padding:10px 0"><span style="font-size:52px">📷</span><b>صوّر أي شي وتصير صفحة تلوين</b><span class="small muted">وجهك، لعبتك، قطوتك… وبعدين لوّنها</span><button class="btn block" id="phg">📷 اختر صورة أو صوّر</button><input type="file" accept="image/*" id="phf" hidden></div>';
        else if (tab === 'bg') h = '<div class="d2colors" style="flex-wrap:wrap">' + BGS.map(function (c) { return '<button class="sw' + (c === E.bg() ? ' on' : '') + '" data-bgc="' + c + '" style="background:' + c + ';width:44px;height:44px"></button>'; }).join('') + '</div><p class="small muted" style="margin:8px 2px 0">لون الورقة يتغيّر ورسمتك تبقى فوقه</p>';
        else h = '<div class="d2pages">' + Object.keys(PAGES).filter(function (k) { return PAGES[k].c === tab; }).map(function (k) { return '<button data-pg="' + k + '">' + svgThumb(k) + '<span>' + PAGES[k].n + '</span></button>'; }).join('') + '</div>';
        box.innerHTML = h;
        box.querySelectorAll('[data-pg]').forEach(function (b) { b.onclick = function () { sh.remove(); startPage({ t: 'pg', k: b.dataset.pg }); pop(700); }; });
        box.querySelectorAll('[data-av]').forEach(function (b) { b.onclick = function () { sh.remove(); var id = b.dataset.av; A.toast('نجهّز الصفحة…', 1200); famLines(id).then(function (c) { startPage({ t: 'pg', k: 'av:' + id }, c); }); }; });
        box.querySelectorAll('[data-bgc]').forEach(function (b) { b.onclick = function () { sh.remove(); if (b.dataset.bgc !== E.bg()) { E.ops.push({ t: 'bg', c: b.dataset.bgc }); E.redraw(); changed(); } }; });
        var pf = $('#phf', sh);
        if (pf) {
          $('#phg', sh).onclick = function () { pf.click(); };
          pf.onchange = function () {
            var f = pf.files && pf.files[0]; if (!f) return;
            var u = URL.createObjectURL(f), im = new Image();
            im.onload = function () { URL.revokeObjectURL(u); sh.remove(); var c = lineArt(im, true); st.photo = c; startPage({ t: 'pg', k: 'photo' }, c); A.toast('🖍️ لوّن صورتك!'); };
            im.onerror = function () { A.toast('ما قدرنا نفتح الصورة'); };
            im.src = u;
          };
        }
      }
      sh.querySelectorAll('[data-cat]').forEach(function (b) { b.onclick = function () { tab = b.dataset.cat; sh.querySelectorAll('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); }; });
      paint();
    }
    $('#dp').onclick = pageSheet;

    /* ---- رسوماتي ---- */
    function draftSheet() {
      drafts().then(function (a) {
        var sh = A.sheet('<div class="row"><h2 class="grow" style="font-size:22px">💾 رسوماتي</h2><button class="icb flat" id="x" aria-label="إغلاق">' + ic('close') + '</button></div>' +
          (a.length ? '<p class="small muted" style="margin:0">الرسومات اللي ما خلصت تنحفظ هنا لحالها. اختر وحدة وكمّلها.</p><div class="d2drafts">' + a.map(function (d, i) { return '<div><button data-d="' + i + '"><img src="' + d.thumb + '" alt="رسمة محفوظة"></button><button class="d2del" data-del="' + i + '" aria-label="حذف">✕</button></div>'; }).join('') + '</div>' : '<div class="col center" style="gap:8px;padding:24px 0;text-align:center"><span style="font-size:46px">💾</span><b>ما فيه رسومات محفوظة</b><span class="small muted">إذا طلعت قبل ما ترسل، رسمتك تنحفظ هنا.</span></div>'));
        $('#x', sh).onclick = function () { sh.remove(); };
        sh.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { var d = a[+b.dataset.d]; sh.remove(); var go = function () { loadDraft(d); }; if (hasInk() && st.draftId !== d.id) autoSave().then(go); else go(); }; });
        sh.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var d = a[+b.dataset.del]; if (!confirm('تحذف هالرسمة؟')) return; dropDraft(d.id).then(function () { sh.remove(); draftSheet(); }); }; });
      });
    }
    $('#dsd').onclick = draftSheet;

    /* ---- صوت مع الرسمة ---- */
    var rec = null;
    $('#dv').onclick = function () {
      var b = $('#dv');
      if (rec) { rec.mr.stop(); return; }
      if (st.voice) { if (confirm('تحذف الصوت المسجّل؟')) { st.voice = null; $('#dvv').textContent = 'صوت'; b.classList.remove('on'); } return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return A.toast('التسجيل غير مدعوم على هذا الجهاز');
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (stream) {
        var types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'], type = '';
        for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported(types[i])) { type = types[i]; break; }
        var mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : {}), chunks = [], t0 = Date.now();
        rec = { mr: mr };
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); }); clearInterval(rec.tk); rec = null; b.classList.remove('rec');
          var dur = (Date.now() - t0) / 1000;
          if (dur < .8) { $('#dvv').textContent = 'صوت'; return; }
          var blob = new Blob(chunks, { type: (mr.mimeType || type || 'audio/webm').split(';')[0] });
          A.analyze(blob, null).then(function (r) {
            st.voice = { blob: blob, dur: Math.round(r && r.dur ? r.dur : dur), wf: r ? r.wf : [] };
            $('#dvv').textContent = A.fmtDur(st.voice.dur) + ' ✓'; b.classList.add('on');
            A.toast('🎤 الصوت ينرسل مع الرسمة');
          });
        };
        mr.start(250); b.classList.add('rec');
        rec.tk = setInterval(function () { var s = (Date.now() - t0) / 1000; $('#dvv').textContent = '⏹ ' + A.fmtDur(s); if (s >= 60) mr.stop(); }, 250);
      }).catch(function () { A.toast('اسمح لنَبْض باستخدام الميكروفون', 3500); });
    };

    /* ---- خروج وإرسال ---- */
    function leave() { if (rec) { try { rec.mr.stop(); } catch (e) {} } sndClose(); clearTimeout(st.saveT); }
    $('#dx').onclick = function () {
      if (hasInk()) autoSave().then(function () { A.toast('انحفظت في 💾 رسوماتي'); });
      leave(); A.openChat(chat);
    };
    $('#ds').onclick = function () {
      if (!hasInk()) return A.toast('ارسم شي أول 🎨');
      var k = Math.min(1, 1080 / Math.max(cv.width, cv.height)), c2 = document.createElement('canvas');
      c2.width = Math.round(cv.width * k); c2.height = Math.round(cv.height * k); c2.getContext('2d').drawImage(cv, 0, 0, c2.width, c2.height);
      var pg = E.page(), pl = null;
      if (!opt.base && pg !== 'photo') { try { pl = encode(E.ops, cv.width / cv.height); if (pl.length > 350000) pl = null; } catch (e) { pl = null; } }
      var voice = st.voice, did = st.draftId;
      leave();
      c2.toBlob(function (b) {
        S.chat = chat; A.openChat(chat);
        A.sendMsg('draw', { w: c2.width, h: c2.height, rp: opt.rp, cap: opt.cap, pl: pl }, b);
        if (voice) setTimeout(function () { A.sendMsg('voice', { dur: voice.dur, wf: voice.wf, cap: '🎤 عن الرسمة' }, voice.blob); }, 250);
        dropDraft(did);
      }, 'image/jpeg', .88);
    };
    window.addEventListener('resize', function rs() { if (S.view !== 'draw') return window.removeEventListener('resize', rs); fit(); applyView(); guides(); });
    paintCtx(); guides(); updBtns();
    setTimeout(function () {
      fit();
      if (opt.draft) loadDraft(opt.draft);
      else if (!opt.base) drafts().then(function (a) {
        var d = a[0]; if (!d || S.view !== 'draw' || hasInk()) return;
        var box = $('#dres'); box.hidden = false;
        box.innerHTML = '<img src="' + d.thumb + '" alt=""><span class="grow">عندك رسمة ما خلصت</span><button class="btn sm" id="drY">كمّلها</button><button class="icb flat" id="drN" aria-label="لا">✕</button>';
        $('#drY').onclick = function () { box.hidden = true; loadDraft(d); };
        $('#drN').onclick = function () { box.hidden = true; };
        setTimeout(function () { box.hidden = true; }, 9000);
      });
    }, 30);
  }

  /* ================= الرسمة تنرسم قدامك ================= */
  function play(m, src) {
    var data; try { data = decode(m.pl); } catch (e) { return A.toast('ما قدرنا نشغّل الرسمة'); }
    var v = document.createElement('div'); v.className = 'viewer d2play';
    v.innerHTML = '<div class="d2pbox"><canvas></canvas></div><div class="vbar" style="flex-direction:column;align-items:stretch"><div class="d2prog"><i></i></div><div class="vbtns"><button class="btn sm" id="pr">↻ من جديد</button><button class="btn sm line" id="pc">إغلاق</button></div></div>';
    document.body.appendChild(v);
    var cv = v.querySelector('canvas'), box = v.querySelector('.d2pbox'), bar = v.querySelector('.d2prog i');
    var r = box.getBoundingClientRect(), ar = data.r || .75, w = r.width, h = w / ar;
    if (h > r.height) { h = r.height; w = h * ar; }
    var dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var E = Engine(cv, { dpr: dpr }), all = data.o, raf = 0, stopped = false;
    // نجهّز صفحة العائلة لو موجودة
    var pg = null; all.forEach(function (o) { if (o.t === 'pg') pg = o.k; });
    var prep = pg && /^av:/.test(pg) ? famLines(pg.slice(3)) : Promise.resolve(null);
    var units = function (o) { return o.t === 's' ? o.p.length : o.t === 'f' ? 8 : o.t === 'sh' ? 10 : 1; };
    var total = all.reduce(function (n, o) { return n + units(o); }, 0), dur = Math.max(3000, Math.min(14000, total * 9));
    function run() {
      cancelAnimationFrame(raf); E.ops = []; var i = 0, j = 0, done = 0, t0 = performance.now();
      E.ops = all.filter(function (o) { return o.t === 'bg' || o.t === 'pg'; }).slice(0, 0);
      E.clear();
      function frame(now) {
        if (stopped) return;
        var target = Math.min(total, (now - t0) / dur * total);
        while (i < all.length && done < target) {
          var o = all[i];
          if (o.t === 'bg' || o.t === 'pg') { E.ops.push(o); E.redraw(); done += 1; i++; continue; }
          if (o.t === 's') {
            if (j === 0) E.ops.push(o);
            while (j < o.p.length && done < target) { E.seg(o, j); j++; done++; }
            if (j >= o.p.length) { E.drawLines(); i++; j = 0; }
            continue;
          }
          E.ops.push(o); E.op(o); done += units(o); i++;
        }
        bar.style.width = (done / total * 100) + '%';
        if (i < all.length) raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    }
    prep.then(function (c) { E.lines = c; run(); });
    v.querySelector('#pr').onclick = run;
    v.querySelector('#pc').onclick = function () { stopped = true; cancelAnimationFrame(raf); v.remove(); };
    v.onclick = function (e) { if (e.target === v) { stopped = true; cancelAnimationFrame(raf); v.remove(); } };
    void src;
  }

  return { Engine: Engine, screen: screen, play: play, PAGES: PAGES, lineArt: lineArt, encode: encode, decode: decode };
})();
