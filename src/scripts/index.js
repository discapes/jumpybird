import { dialog } from './util.js';

// todo theres gotta be a better __filename
const silentlog = msg => void console.log(`${'index'}: ${msg}`);
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
						console.log(`updated! reloading...`);
						localStorage.setItem('version', nv);
						window.location.reload();
					});
			};
		}
	});
}