const CACHE_NAME = 'cache-v1'
const ASSET_MANIFEST = '/.vite/manifest.json'

self.addEventListener('install', event => {
	console.log('[Service Worker] Install')
	const preCache = async () => {
		try {
			console.log('[Service Worker] Fetching asset manifest...');

			const response = await fetch(ASSET_MANIFEST, { 
				cache: 'no-cache',
				headers: { 'Accept': 'application/json' }
			});

			if (!response.ok) {
      			throw new Error(`Unable to fetch asset manifestd. HTTP ${response.status}`);
			}

			const manifest = await response.json();

			// extract all files to cache
			const filesToCache = Object.values(manifest).flatMap(entry => [entry.file, ...(entry.css || [])]);
			console.debug('[Service Worker] Files to cache:', filesToCache);

			const cache = await caches.open(CACHE_NAME);
			await cache.addAll(['/', ...filesToCache]);

			console.log('[Service Worker] Caching complete');
		} catch (err) {
			console.error('[Service Worker] Pre-caching failed:', err.message);
			throw err;
		}
	}

	event.waitUntil(preCache())
});


self.addEventListener('activate', event => {
	console.log('[Service Worker] Activate');
	event.waitUntil(
		caches.keys().then(keys =>
			Promise.all(
				keys.map(key => {
					if (key !== CACHE_NAME) {
						console.log('[Service Worker] Removing old cache:', key);
						return caches.delete(key);
					}
				})
			)
		)
	);
});

self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request)
		.then(response => {
			// Serve from cache or fetch from network
			return response || fetch(event.request);
		})
	);
});

