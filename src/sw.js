const delay = del => new Promise(res => setTimeout(res, del));

// these things are revisioned, and are loaded for offline use
const requiredOffline = new Map(__MANIFEST__.map(([ pathname, rev]) =>
	[location.origin + pathname, { rev, alreadyFetching: false }]
));

const APPCACHENAME = 'appcache';
const RUNTIMECACHE = 'runtimecache';

self.addEventListener('install', e => {
	console.log('sw: installing');
	self.skipWaiting();
	loadAppCache();
})
self.addEventListener('activate', () => {
	console.log('sw: activating');
	self.clients.claim();
});

function addParams(urlStr, k, v) {
	let url = new URL(urlStr);
	url.searchParams.append(k, v);
	return url.href;
}

async function loadAppCache() {
	console.log('caching offline-required and revisioned files');
	const appcache = await caches.open(APPCACHENAME);
	const alreadyInCache = (await appcache.keys()).map(req => req.url);
	const expectedCacheKeys = [];

	for (let [url, { rev, alreadyFetching }] of requiredOffline.entries()) {
		if (rev) url = addParams(url, '__rev__', rev);
		if (!alreadyInCache.includes(url) && !alreadyFetching) {
			console.log(`(bg) ${APPCACHENAME} added ${url}`);
			fetch(url, { mode: 'no-cors' }).then(res => appcache.put(url, res))
		} else {
			console.log(`(bg) ${APPCACHENAME} hit for ${url}`);
		}
		expectedCacheKeys.push(url);
	}
	alreadyInCache.filter(url => !expectedCacheKeys.includes(url))
		.forEach(url => {
			;
			appcache.delete(url);
			console.log(`${APPCACHENAME} removed ${url}`)
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
	} else {
		cache = await caches.open(RUNTIMECACHE);
		cachename = RUNTIMECACHE;
	}

	const match = await cache.match(url);
	if (match) {
		console.log(`${cachename} hit for ${url}`);
		return match;
	} else {
		console.log(`${cachename} miss for ${url}`);
		const res = await fetch(url, { mode: 'no-cors' });
		await cache.put(url, res.clone());
		console.log(`${cachename} added ${url}`);
		return res;
	}
})()));