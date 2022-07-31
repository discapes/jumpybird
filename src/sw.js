const delay = del => new Promise(res => setTimeout(res, del));
// todo typescript, minify this

// put things here because they need revisioning,
// or that are needed offline but not loaded immediately
// or that are loaded by css or other things before sw activate
const requiredOffline = new Map([...Object.entries({
	'/': { rev: 2, alreadyFetching: false },
	'/assets/bg.png': { rev: 1, alreadyFetching: false },
	'/favicon.ico': { rev: 1, alreadyFetching: false },
	'/build/styles.min.css': { rev: 1, alreadyFetching: false },
	'/build/bundle.js': { rev: 5, alreadyFetching: false },
})].map(([k, v]) => [new URL(k, location.href).href, v]));

const APPCACHENAME = 'appcache';
const RUNTIMECACHE = 'runtimecache';

self.addEventListener('install', e => {
	console.log('sw: installing');
	self.skipWaiting();
	loadAppCache(self.__WB_MANIFEST);
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
		.forEach(url => {;
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