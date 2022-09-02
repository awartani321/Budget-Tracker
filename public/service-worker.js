console.log("Service Worker");

self.importScripts('./js/idb.js');

var STATIC_CACHE_NAME = 'budget-tracker-static-cache-v1';
var DATA_CACHE_NAME = 'budget-tracker-data-cache-v1';

var cacheAssets = [
    './index.html',
    './css/styles.css',
    './js/index.js',
    './js/idb.js',
    './manifest.json',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png'
];

self.addEventListener('install', e => {
    console.log("service worker is installed");
    e.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                cache.addAll(cacheAssets)
                    .then(() => self.skipWaiting())
            })
    );
})


self.addEventListener('activate', e => {
    console.log('Service Worker: Activated');
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(
                    cache => {
                        if (cache !== STATIC_CACHE_NAME && cache !== DATA_CACHE_NAME) {
                            return caches.delete(cache);
                        }
                    }
                )
            )
        })
    );

    self.clients.claim();
})

self.addEventListener('fetch', e => {
    console.log('Service Worker: Fetching: ' + e.request.url);
    if (e.request.url.includes("/api/") && e.request.method === "GET") {
        e.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then((cache) => {
                    return fetch(e.request)
                        .then((res) => {
                            if (res.status === 200) {
                                cache.put(e.request, res.clone());
                            }

                            return res;
                        })
                        .catch(() => {
                            return cache.match(e.request);
                        });
                })
                .catch((err) => console.log(err))
        );

        return;
    }

    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});