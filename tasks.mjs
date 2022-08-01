import { spawn } from "child_process";
import { watch as chokidarWatch } from "chokidar";
import CleanCSS from "clean-css";
import { copyFile, readFile, writeFile } from "fs/promises";
import { transformFileAsync } from "@babel/core";
import globAsync from "glob";
import { createHash } from "crypto";
import { promisify } from "util";
import { createReadStream } from "fs";
import { basename, dirname } from "path";
const glob = promisify(globAsync);

const cssDest = 'public/build/styles.min.css';
const cssSrc = 'src/*.css';

const jsSrc = 'src/scripts/*.js';
const jsDestDir = 'public/build';

const swSrc = 'src/sw.js';
const swDest = 'public/sw.js';

const versionDest = 'public/version';
const dontCache = [swDest, versionDest];

const tasks = {
	dev() {
		const log = getLogger(this.dev.name);

		watch(getLogger(`css-watch`), cssSrc, async (files, file, log) => {
			await writeFile(cssDest, await cat(...files));
			log(`concatenated ${files} to ${cssDest}`);
		});

		watch(getLogger(`js-watch`), jsSrc, async (files, file, log) => {
			await copyFile(file, `${jsDestDir}/${basename(file)}`)
			log(`copied ${file} to ${jsDestDir}/${basename(file)}`);
		});

		watch(getLogger(`injectmanifest-watch`), ['public/', swSrc], () =>
			this.injectmanifest(getLogger(`injectmanifest`))
			, { ignored: dontCache, ignoreInitial: true });

		this.injectmanifest(getLogger(`injectmanifest`));
		this.start(getLogger(`start (dev)`));
	},
	async build() {
		const log = getLogger(this.build.name);

		await Promise.all([
			this.cleancss(), this.minify(),
		]);
		await this.injectmanifest();
		await this.minify([swDest], dirname(swDest));
	},
	start() {
		const log = getLogger(this.start.name);
		run('node node_modules/serve/build/main.js public', log);
		// todo why cant we npx here??
	},

	async cleancss() {
		const log = getLogger(this.cleancss.name);
		const files = await glob(cssSrc);
		const minified = new CleanCSS().minify(files);
		await writeFile(cssDest, minified.styles);
		log(`minified ${files} and wrote to ${cssDest}`);
	},

	async minify(sources, destDir = jsDestDir) {
		if (!sources) sources = await glob(jsSrc);
		const log = getLogger(this.minify.name);
		const babelConfig = JSON.parse((await readFile('.babelrc')).toString());

		sources.forEach(async src => {
			const output = await transformFileAsync(src, babelConfig);
			await writeFile(`${destDir}/${basename(src)}`, output.code);
			log(`transformed ${src} and wrote to ${destDir}`);
		});
	},

	async injectmanifest() {
		const log = getLogger(this.injectmanifest.name);

		const pathnames = await glob('**/*', { cwd: 'public', nodir: true });
		const revmap = (await Promise.all(pathnames.map(async f => {
			if (dontCache.find(dc => dc === `public/${f}`)) return undefined;
			const hash = await getFileHash(`public/${f}`)
			return [f === 'index.html' ? '/' : '/' + f, hash.slice(0, 10)];
		}))).filter(s => s != undefined);

		const sw = (await readFile(swSrc)).toString();
		let newsw = sw.replace('__MANIFEST__', JSON.stringify(revmap));

		const version = getHash(newsw).slice(0, 10);
		newsw = newsw.replace('__VERSION__', JSON.stringify(version));
		await writeFile(swDest, newsw);
		log(`added ${revmap.length} entries to ${swSrc} and wrote to ${swDest}`);

		await writeFile(versionDest, version);
		log(`wrote sw version ${version} to ${versionDest}`)
	},

	async clean() {
		const log = getLogger(this.clean.name);
		log(`TODO`);
		const toBeDeleted = [swSrc, jsDestDir, cssDest, versionDest];
	}
}

function getFileHash(filename) {
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

function getHash(str) {
	let hash = createHash('sha1');
	hash.update(str);
	return hash.digest('hex');
}

function getLogger(task) {
	return msg => console.log(`[${task}] ${msg}`);
}

async function watch(log, patterns, onchange, options) {
	if (!Array.isArray(patterns)) patterns = [patterns];
	log(`watching ${patterns}`);
	const files = (await Promise.all(patterns.map(p => glob(p)))).flat();
	chokidarWatch(files, options).on('all', (e, path) =>
		onchange(files, path, log)
	);
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
const task = args[0];
if (!task) console.error(`No task specified. Available task: ${Object.keys(tasks)}`);
else if (!(task in tasks)) console.error(`${task} is not a valid tasks. Available tasks: ${Object.keys(tasks)}`);
else {
	console.log(`[[${task}]]`)
	tasks[task]();
}