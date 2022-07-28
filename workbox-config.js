module.exports = {
	globDirectory: 'public/',
	skipWaiting: true,
	clientsClaim: true,
	sourcemap: false,
	mode: 'debug',
	globPatterns: [
		'**/*.{js,css,ico,png,html,json,jpg,ogg,mp3}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [],
	runtimeCaching: [
	{
		handler: "CacheFirst",
		urlPattern: ({ url }) => true,
		options: {
			cacheableResponse: { statuses: [0, 200] },
		}
	}]
};	