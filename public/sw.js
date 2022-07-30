const delay = del => new Promise(res => setTimeout(res, del));
// todo typescript

// put things here because they need revisioning,
// or that are needed offline but not loaded immediately
const requiredOffline = new Map([...Object.entries({
	'/': { rev: 24, alreadyFetching: false },
	'/assets/bg.png': { rev: 15, alreadyFetching: false },
	'/favicon.ico': { rev: 6, alreadyFetching: false },
	'/build/bundle.js': { rev: 4, alreadyFetching: false },
})].map(([k, v]) => [new URL(k, location.href).href, v]));

const APPCACHENAME = 'appcache';
const RUNTIMECACHE = 'runtimecache';

self.addEventListener('install', e => {
	console.log('sw: installing');
	self.skipWaiting();
	console.log([{"revision":"db5e73210dfcdd31ac711c35da31005d","url":"assets/bg.png"},{"revision":"0c0638ff44761aedf2d8ba9f04318627","url":"build/bundle.js"},{"revision":"bb007ab5db1a3f44583d34ade31dcf07","url":"build/styles.min.css"},{"revision":"09a1e8e01ec02ef4dcde7d2441f1086d","url":"favicon.ico"},{"revision":"42ef93b8a53851651e5545905a6f3232","url":"icons/icon-1024x1024.png"},{"revision":"d681b4297a88e64af70c0eb0d061a444","url":"icons/icon-128x128.png"},{"revision":"514d8025e713dee11b64847dfa8b5fee","url":"icons/icon-144x144.png"},{"revision":"841cb8ef6a2c7163aa2c0fc64faccea4","url":"icons/icon-192x192.png"},{"revision":"823e9a2c8c956037d0f3ab8d7701c771","url":"icons/icon-384x384.png"},{"revision":"7ddaec85559539e678873742676103f7","url":"icons/icon-512x512.png"},{"revision":"f4ce6c0b90ec3482dc6b9d7bf555b399","url":"icons/icon-72x72.png"},{"revision":"5b6c66b7dc69c7fbf5fed451c5c0257a","url":"icons/icon-96x96.png"},{"revision":"68e2fb5c36a3d7600d7b4afdd2331654","url":"icons/maskable_icon_x128.png"},{"revision":"c328365a9af31a61df9c1a93d0980e36","url":"icons/maskable_icon_x192.png"},{"revision":"8906a3d5cccb41da2772b07ddb2de8e5","url":"icons/maskable_icon_x384.png"},{"revision":"2c12ba592882fc04784df3410d516821","url":"icons/maskable_icon_x512.png"},{"revision":"466da4ece0979ab36113b0e39e847262","url":"icons/maskable_icon_x72.png"},{"revision":"9a7ea1b04bf78fe54ef77b8b8bb5d511","url":"icons/maskable_icon_x96.png"},{"revision":"dab47e6780fb92a8a53b2cd42d5f2865","url":"index.html"},{"revision":"77d639885f73fd0c060f4a121b37c5b0","url":"manifest.json"},{"revision":"b74a053f2db2576c6e193a15cd4654f1","url":"screenshots/3j9bal1.jpg"},{"revision":"141bf56fc0671b0879a7cef45ff40ad5","url":"screenshots/fvWeclw.jpg"},{"revision":"7b95e41f7da99c7a96740808a8bc339f","url":"screenshots/tmBM3C2.jpg"}]);
	loadStaticCache();
})
self.addEventListener('activate', () => {
	console.log('sw: active');
	self.clients.claim();
});

function addParams(urlStr, k, v) {
	let url = new URL(urlStr);
	url.searchParams.append(k, v);
	return url.href;
}

async function loadStaticCache() {
	console.log('caching offline-required and revisioned files');
	const appcache = await caches.open(APPCACHENAME);
	const alreadyInCache = (await appcache.keys()).map(req => req.url);
	const expectedCacheKeys = [];

	for (let [url, { rev, alreadyFetching }] of requiredOffline.entries()) {
		if (rev) url = addParams(url, '__rev__', rev);
		if (!alreadyInCache.includes(url) && !alreadyFetching) {
			console.log(`(bg) adding ${url} to static cache`);
			fetch(url, { mode: 'no-cors' }).then(res => appcache.put(url, res))
		} else {
			console.log(`(bg) ${url} is already ${APPCACHENAME}`);
		}
		expectedCacheKeys.push(url);
	}
	alreadyInCache.filter(url => !expectedCacheKeys.includes(url))
		.forEach(url => {
			console.log(`removing old static cache entry ${url}`);
			appcache.delete(url);
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