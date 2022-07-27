module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{js,css,ico,png,html,json}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};