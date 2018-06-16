self.addEventListener('install', function(event) {
	console.log('Attempting to install sw and cache static assets');
	const filesToCache = [
		'/',
		'sw.js',
		'index.html',
		'js/main.js',
		'css/styles.css'
	];
	event.waitUntil(
		caches.open('mws-restaurant-v1').then(function(cache) {
			return cache.addAll(filesToCache);
		})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request).then(function(response) {
			if (response) return response;
			return fetch(event.request);
		})
	);
});
