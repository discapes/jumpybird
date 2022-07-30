await navigator.serviceWorker.ready;
// even if we wait for serviceworker.ready, we still need to load images in a timeout 0
// for some reason;

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const imagePromises = [];
function imageElement(src) {
	const img = new Image();
	imagePromises.push(new Promise(res => img.onload = res));
	setTimeout(() => img.src = src, 0);
	return img;
}

const images = {
	grass: imageElement("https://i.imgur.com/cjTERnI.png"),
	pipe: imageElement("https://i.imgur.com/drXBESn.png"),
	rotatedpipe: imageElement("https://i.imgur.com/5dhVgLM.png"),
	bird: imageElement("https://i.imgur.com/R1PnJuH.png"),
};

let wingsoundIndex = 0;
const wingSounds = 5;
const baseWingSound = new Audio("https://www.myinstants.com/media/sounds/sfx_wing.mp3");
const sounds = {
	wing: Array(wingSounds).fill(0).map(f => baseWingSound.cloneNode()),
	death: new Audio("https://www.myinstants.com/media/sounds/sfx_die.mp3"),
};

class RemovableListener {
	constructor(type, listener, options) {
		this.type = type;
		this.listener = listener;
		this.options = options;
	}
	add() {
		window.addEventListener(this.type, this.listener, this.options);
	}
	remove() {
		window.removeEventListener(this.type, this.listener, this.options);
	}
}

function newGame() {
	let w = canvas.parentElement.clientWidth;
	let h = canvas.parentElement.clientHeight;
	let scale = h / 100;
	canvas.height = h;
	canvas.width = w;
	ctx.font = `normal bold ${10 * scale}px sans-serif`;

	const eventListeners = [
		["keydown", e => {
			if (e.key === " ") {
				e.preventDefault();
				tap();
			}
		}],
		["touchstart", e => {
			e.preventDefault();
			tap();
		}, { passive: false }], // needed?
		["mousedown", e => {
			if (e.button === 0) tap();
		}],
		["resize", () => {
			w = canvas.parentElement.clientWidth;
			h = canvas.parentElement.clientHeight;
			scale = h / 100;
			canvas.height = h;
			canvas.width = w;
			ctx.font = `normal bold ${10 * scale}px sans-serif`;
			frame();
		}]
	].map(([type, listener, options]) => new RemovableListener(type, listener, options));
	eventListeners.forEach(e => e.add());

	const MSPF = 10;
	const birdh = 3;
	const birdw = 6.5;
	const grassy = 85;
	const xgap = 17;
	const pipew = 10;
	const pipeh = 30;
	const g = 300;
	const npipes = 20;
	const ygap = 25;
	const x = 10;
	const speed = 15;
	const tapBoost = 80;
	const genPipeY = () => Math.random() * 20 + 50;

	let y = 50;
	let vy = 0;
	let meters = 0;
	let lastFrameDate;
	let gameStarted = false;
	let gameOverDate = false;
	let grassoffset = 0;
	let allowRestart = false;
	let frameInterval;

	// TODO put this in notes
	const pipes = [...Array(npipes).keys()].map(i => ({
		x: (i * (pipew + xgap)) + 50,
		y: genPipeY(),
		dir: Math.random() * 2 * Math.PI,
		cw: Math.random() > 0.5,
		speed: Math.random(),
	}));

	Promise.all(imagePromises).then(frame);
	return;

	function frame() {
		const timeDelta = lastFrameDate ? (Date.now() - lastFrameDate) / 1000 : 0;
		if (gameStarted) lastFrameDate = Date.now();
		ctx.clearRect(0, 0, w, h);

		if (gameStarted) {
			y = 100 - ((100 - y) + vy * timeDelta + 1 / 2 * g * timeDelta * timeDelta);
			vy = Math.max(vy - g * timeDelta, -100);
			if (!gameOverDate) meters += timeDelta * 14.5;
		}

		pipes.forEach(pipe => {
			if (gameStarted && !gameOverDate) {
				movePipe(pipe);
			}

			// another pipe extends the pipe without it having another head
			img(images.pipe, pipe.x, pipe.y, pipew, pipeh);
			img(images.rotatedpipe, pipe.x, pipe.y + pipeh, pipew, pipeh);

			img(images.rotatedpipe, pipe.x, pipe.y - pipeh - ygap, pipew, pipeh);
			img(images.pipe, pipe.x, pipe.y - pipeh - ygap - pipeh, pipew, pipeh);
		});

		// draw grass to fill viewport
		const grassactw = 100 * scale;
		const grassacth = 20 * scale;
		for (let x = grassoffset; x < w; x += grassactw) {
			ctx.drawImage(images.grass, x, grassy * scale, grassactw, grassacth)
		}
		// move grass
		if (gameStarted && !gameOverDate) {
			grassoffset -= (timeDelta * speed) * scale;
			grassoffset = grassoffset % grassactw;
		}

		// draw score
		ctx.fillStyle = "white";
		const text = Math.floor(Math.max(0, meters)) + "m";
		const textmeasure = ctx.measureText(text);
		ctx.fillText(text, 10 * scale, (10 * scale) + textmeasure.actualBoundingBoxAscent);
		ctx.fillStyle = "black";
		ctx.strokeText(text, 10 * scale, (10 * scale) + textmeasure.actualBoundingBoxAscent);

		// draw bird
		ctx.translate(x * scale, y * scale);
		ctx.rotate(-vy / 300);
		img(images.bird, 0, 0, birdw, birdh);
		ctx.setTransform(1, 0, 0, 1, 0, 0);


		if (gameOverDate && y * scale > h) {
			if (frameInterval) clearInterval(frameInterval);
			allowRestart = true;
		}
		return;

		function img(i, x, y, w, h) {
			ctx.drawImage(i, x * scale, y * scale, w * scale, h * scale);
		}

		function movePipe(pipe) {
			pipe.x -= (timeDelta * speed);
			pipe.x += Math.sin(pipe.dir) * (timeDelta * 10);
			pipe.y += Math.cos(pipe.dir) * (timeDelta * 10);
			pipe.dir += (pipe.cw * 2 - 1) * Math.random() * 0.1 * (timeDelta / 0.015);

			if (pipe.x < -pipew) {
				pipe.x = (npipes - 1) * (pipew + xgap) + (xgap);
				pipe.y = genPipeY();
			}

			if (
				(y < pipe.y - ygap && x < pipe.x + pipew && x + birdw > pipe.x)
				|| (y + birdh > pipe.y && x < pipe.x + pipew && x + birdw > pipe.x)
				|| (y + birdh >= grassy)
			) {
				gameOverDate = Date.now();
				vy = 50;
				sounds.death.play();
			}
		}
	}

	function tap() {
		if (gameOverDate && allowRestart) {
			restart();
		} else if (!gameOverDate) {
			vy = tapBoost;
			sounds.wing[wingsoundIndex].play();
			wingsoundIndex = ++wingsoundIndex % wingSounds;
			if (!gameStarted) {
				gameStarted = true;
				frameInterval = setInterval(frame, MSPF);
			}
		}
	}

	function restart() {
		eventListeners.forEach(e => e.remove());
		if (frameInterval) clearInterval(frameInterval);
		newGame();;
	}
}

newGame();