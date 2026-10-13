/* サービスワーカー：アプリのファイルを端末に保存し、電波がなくても開けるようにする
   ネット優先なので、index.html を直して公開するだけなら VERSION は変えなくてよい。
   保存するファイル（FILES）を増減したときは VERSION を 1 つ上げる（古い保存分が消える） */
const VERSION = 'v1';
const CACHE = `my-books-${VERSION}`;
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

// インストール時：ファイルをまとめて保存
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 有効化時：古いバージョンの保存分を削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 読み込み時：ネットにつながればネットの最新版を使い、つながらなければ保存分を使う
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
