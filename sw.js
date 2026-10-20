// 북퀘스트 오프라인 캐시. 앱을 고쳐 올릴 때 VERSION 숫자를 올리면 새 버전으로 바뀝니다.
const VERSION = 'bookquest-v9';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './fonts/Galmuri11.woff2', './fonts/Galmuri11-Bold.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const host = new URL(e.request.url).hostname;
  if (host === 'api.github.com' || host.endsWith('githubusercontent.com') || host.endsWith('workers.dev')) return;
  // 네트워크 우선, 안 되면 캐시 (새 버전을 올리면 바로 반영되도록)
  e.respondWith(
    // 같은 사이트 파일은 브라우저 캐시를 건너뛰고 서버에 새 버전이 있는지 확인
    fetch(new URL(e.request.url).origin === self.location.origin ? new Request(e.request, { cache: 'no-cache' }) : e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
