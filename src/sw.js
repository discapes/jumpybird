const log = msg => console.log(`${location.href.slice(location.href.indexOf('/') + 1)}: ${msg}`);
const delay = del => new Promise(res => setTimeout(res, del));

// these things are revisioned, and are loaded for offline use
const requiredOffline = new Map(__MANIFEST__.map(([pathname, rev]) =>
	[location.origin + pathname, { rev, alreadyFetching: false }]
));

const APPCACHENAME = 'appcache';
const RUNTIMECACHE = 'runtimecache';
const cacheFileTypes = ['mp3', 'png', 'jpg', 'js', 'ogg'];

self.addEventListener('install', e => {
	log(`installing version ${__VERSION__}`);
	self.skipWaiting();
	loadAppCache();
})
self.addEventListener('activate', () => {
	self.clients.claim();
});

function addParams(urlStr, k, v) {
	let url = new URL(urlStr);
	url.searchParams.append(k, v);
	return url.href;
}

async function loadAppCache() {
	// log('caching offline-required and revisioned files');
	const appcache = await caches.open(APPCACHENAME);
	const alreadyInCache = (await appcache.keys()).map(req => req.url);
	const expectedCacheKeys = [];

	for (let [url, { rev, alreadyFetching }] of requiredOffline.entries()) {
		if (rev) url = addParams(url, '__rev__', rev);
		if (!alreadyInCache.includes(url) && !alreadyFetching) {
			// log(`(bg) ${APPCACHENAME} added ${url}`);
			fetch(url, { mode: 'no-cors' }).then(res => appcache.put(url, res))
		} else {
			// log(`(bg) ${APPCACHENAME} hit for ${url}`);
		}
		expectedCacheKeys.push(url);
	}
	alreadyInCache.filter(url => !expectedCacheKeys.includes(url))
		.forEach(url => {
			;
			appcache.delete(url);
			log(`${APPCACHENAME} removed ${url}`)
		})
}

self.addEventListener('fetch', e => e.respondWith((async () => {
	let cache;
	let cachename;
	let url = e.request.url;

	if (requiredOffline.has(url)) {
		cache = await caches.open(APPCACHENAME);
		cachename = APPCACHENAME;
		const info = requiredOffline.get(url);
		if (info.rev) url = addParams(url, '__rev__', info.rev);
		info.alreadyFetching = true;
	} else if (cacheFileTypes.find(t => url.endsWith(t))) {
		cache = await caches.open(RUNTIMECACHE);
		cachename = RUNTIMECACHE;
	}

	if (cache) {
		const match = await cache.match(url);
		if (match) {
			// log(`${cachename} hit for ${url}`);
			return match;
		} else {
			// log(`${cachename} miss for ${url}`);
			const res = await fetch(url, { mode: 'no-cors' });
			await cache.put(url, res.clone());
			log(`${cachename} added ${url}`);
			return res;
		}
	} else {
		const res = await fetch(url, { mode: 'no-cors' });
		log(`fetched ${url}`);
		return res;
	}
})()));