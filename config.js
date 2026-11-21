/* نَبْض | NABD — الإعدادات العامة (يقراها التطبيق و sw.js)
   VERSION: غيّره مع كل تحديث (ومعه CACHE في sw.js و ?v= في index.html)
   API: رابط السيرفر (nabd-api) · VAPID: المفتاح العام للإشعارات */
var CONFIG = {
  VERSION: '4.2.2',
  SITE: 'https://nabd.wamdarc.com',
  API: 'https://nabd-api.bsshfi.workers.dev',
  // مفتاح دخول Google (OAuth Client ID) للنسخ على Google Drive — عام وآمن (مو سر)، فاضي = الميزة مخفية
  GCLIENT: '662418953189-08uhrv5pul6s1q3ac3r1a9kf5l35g27b.apps.googleusercontent.com',
  VAPID: 'BA1DWhF8CIJMdDMHRC6gILasjlvmJt0S2Oaice-WbL3g-eqcXIYMsW3R289wnajDBCTUD2wSC0V30OGxQkkwflY'
};
