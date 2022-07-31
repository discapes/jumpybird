import { spawn } from "child_process";
import { watch as chokidarWatch } from "chokidar";
import CleanCSS from "clean-css";
import { copyFile, readFile, writeFile, open } from "fs/promises";
import { transformFileAsync } from "@babel/core";
import globAsync from "glob";
import { createHash } from "crypto";
import { promisify } from "util";
import { createReadStream } from "fs";
const glob = promisify(globAsync);

const cssDest = 'public/build/styles.min.css';
const cssSrc = 'src/*.css';
const jsSrc = 'src/index.js';
const jsDest = 'public/build/bundle.js';
const swSrc = 'src/sw.js';
const swDest = 'public/sw.js';

const actions = {
	dev(log) {
		watch(logTask(`css-watch`), cssSrc,
			async files => writeFile(cssDest, await cat(...files)));
		watch(logTask(`js-watch`), jsSrc, () => copyFile(jsSrc, jsDest));
		watch(logTask(`injectmanifest-watch`)
		, ['public/', swSrc], () => this.injectmanifest(logTask(`injectmanifest`))
		, { ignored: swDest, ignoreInitial: true });
		this.injectmanifest(logTask(`injectmanifest`))
		this.start(logTask(`start (dev)`));
	},
	async build(log) {
		await Promise.all([
			this.cleancss(logTask('cleancss')), this.minify(logTask('babel')),
		]);
		await this.injectmanifest(logTask('injectmanifest'));
		await this.minify(logTask('minify (sw)'), swDest, swDest);
	},
	start(log) {
		run('node node_modules/serve/build/main.js public', log)
		// why cant we npx here??
	},

	async cleancss(log) {
		const files = await glob(cssSrc);
		const minified = new CleanCSS().minify(files);
		await writeFile(cssDest, minified.styles);
		log(`minified ${files} and wrote to ${cssDest}`);
	},
	async minify(log, src = jsSrc, dest = jsDest) {
		const babelConfig = JSON.parse((await readFile('.babelrc')).toString());
		const output = await transformFileAsync(src, babelConfig);
		await writeFile(dest, output.code);
		log(`transformed ${src} and wrote to ${dest}`);
	},
	async injectmanifest(log) {
		const pathnames = await glob('**/*', { cwd: 'public', nodir: true });
		const revmap = (await Promise.all(pathnames.map(async f => {
			if (`public/${f}` === swDest) return undefined;
			const hash = await getHash(`public/${f}`)
			return [f === 'index.html' ? '/' : '/' + f, hash.slice(0, 10)];
		}))).filter(s => s != undefined);
		const sw = (await readFile(swSrc)).toString();
		const newsw = sw.replace('__MANIFEST__', JSON.stringify(revmap));
		await writeFile(swDest, newsw);
		log(`added ${revmap.length} entries to ${swSrc} and wrote to ${swDest}`);
	},
}

function getHash(filename) {
	return new Promise((resolve) => {
		let hash = createHash('sha1')
		const input = createReadStream(filename);
		input.on('readable', () => {
			const data = input.read();
			if (data) hash.update(data);
			else resolve(hash.digest('hex'));
		});
	});
}

function logTask(task) {
	// console.log(`[[${task}]]`)
	return msg => console.log(`[${task}] ${msg}`);
}

async function watch(log, patterns, onchange, options) {
	if (!Array.isArray(patterns)) patterns = [patterns];
	log(`watching ${patterns}`);
	const files = (await Promise.all(patterns.map(p => glob(p)))).flat();
	chokidarWatch(files, options).on('all', (e, path) => {
		log(`change in ${path}`);
		onchange(files)
	});
}

async function cat(...args) {
	return (await Promise.all(args.map(async f => (await readFile(f)).toString()))
	).join('\n');
}

function run(cmd, log) {
	const argv = cmd.split(' ');
	log(`running: ${cmd}`);
	const program = argv[0];
	const proc = spawn(program, argv.slice(1));
	const handler = data => data.toString().split('\n').forEach(data => log(`(${program}) ${data}`));
	proc.stdout.on('data', handler);
	proc.stderr.on('data', handler);
	return new Promise((res, rej) => {
		proc.on("error", err => (log(`error starting ${program}: ${err}`), rej(err)));
		proc.on("close", code => (log(`${program} exited with code ${code}`), res(code)));
	});
}

const args = process.argv.slice(2);
const action = args[0];
if (!action) console.error(`No action specified. Available actions: ${Object.keys(actions)}`);
else if (!(action in actions)) console.error(`${action} is not a valid action. Available actions: ${Object.keys(actions)}`);
else {
	console.log(`[[${action}]]`)
	actions[action](logTask(action));
}