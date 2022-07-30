const delay = del => new Promise(res => setTimeout(res, del));
const revisions = {
	'/': 13,
	'/favicon.ico': 6,
	'/build/bundle.js': 3,
}
const CACHENAME = 'appcache'

self.addEventListener('install', e => {
	console.log('installing - sw');
	self.skipWaiting();
	startCaching();
})
self.addEventListener('activate', () => {
	console.log('active - sw');
});

async function startCaching() {
	console.log('caching offline-required assets');
	const appcache = await caches.open(CACHENAME);
	const cachedKeys = await appcache.keys();
	const expectedCacheKeys = [];

	for ([url, rev] of Object.entries(revisions)) {
		const urlWithRev = `${url}?__rev__=${rev}`;
		if (!cachedKeys.includes(urlWithRev)) {
			console.log(`Added ${urlWithRev}`);
			appcache.add(urlWithRev);
		} else {
			console.log(`Same version ${urlWithRev}`);
		}
		expectedCacheKeys.push(urlWithRev);
	}

	cachedKeys.filter(k => )
}
/*
when converting to workbox, sameorigin handler handles revs*/
self.addEventListener('fetch', e => e.respondWith((async () => {
	const appcache = await caches.open(CACHENAME);
	const url = new URL(e.request.url, location.href);

	if (url.pathname in revisions) url.searchParams.append('__rev__', revisions[url.pathname])


	const match = await appcache.match(url);
	if (match) {
		console.log(`cache hit for ${url}`);
		return match;
	} else {
		console.log(`cache miss for ${url}`);
		const res = await fetch(url, { mode: 'no-cors' });
		await appcache.put(url, res.clone()); // clone here
		console.log(`added ${url} to cache`);
		return res;
	}
})()));;