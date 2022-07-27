module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{js,css,ico,png,html,json,jpg,ogg,mp3}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	runtimeCaching: [{
		handler: "NetworkFirst",
		urlPattern: () => 1,
	}]
};