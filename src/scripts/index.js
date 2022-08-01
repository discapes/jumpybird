import { dialog } from './util.js';
import news from './news.js';

const __filename = import.meta.url.slice(import.meta.url.lastIndexOf('/') + 1, import.meta.url.lastIndexOf('?'));
const silentlog = msg => void console.log(`${__filename}: ${msg}`);
const log = msg => silentlog(msg) || dialog(msg, 1, 1);
const blocking = false;

if ('serviceWorker' in navigator) {
	const reg = await navigator.serviceWorker.register('./sw.js', { scope: '/' });
	if (reg.active)
		if (blocking) await update(reg);
		else update(reg);

	await navigator.serviceWorker.ready;
	silentlog(`serviceworker ready`);
	import('./game.js');
}

function update(reg) {
	return new Promise((resolve, reject) => {
		silentlog(`Checking for updates...`);
		let newVersion = fetch('/version').then(v => v.text());
		newVersion.then(nv => {
			if (!nv) return;
			const cv = localStorage.getItem('version');
			if (cv == nv) {
				log(`Up to date!`);
				setTimeout(readNews, 100);
				resolve();
			}
			else {
				log(`New version available, reloading...`);
			}
		}).catch(e => {
			log(`Couldn't connect.`);
			resolve();
		});

		reg.onupdatefound = e => {
			const worker = reg.installing;
			worker.onstatechange = async () => {
				if (worker.state === "activated")
					newVersion.then(async nv => {
						silentlog(`updated! reloading...`);
						localStorage.setItem('version', nv);
						window.location.reload();
					});
			};
		}
	});
}

function readNews() {
	let newsRead = localStorage.getItem('newsread') || 0;
	news.slice(newsRead, news.length).forEach(item => {
		if (item.v) {
			alert(`What's new in ${item.v}:

${item.text}`);
		} else {
			alert(item.text);;
		}
		newsRead++;
		localStorage.setItem('newsread', newsRead);
	})
}