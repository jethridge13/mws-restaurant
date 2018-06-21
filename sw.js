self.addEventListener('install', function(event) {
	console.log('Attempting to install sw and cache static assets');
	const filesToCache = [
		'/',
		'sw.js',
		'js/main.js',
		'js/dbhelper.js',
		'js/restaurant_info.js',
		'data/restaurants.json',
		'css/styles.css',
		'index.html',
		'restaurant.html'
	];
	event.waitUntil(
		caches.open('mws-restaurant-v1').then(function(cache) {
			return cache.addAll(filesToCache);
		})
	);
});

self.addEventListener('fetch', function(event) {
	// restaurant.html caching inspired by Doug Brown's Project 1 Webinar
	// https://www.youtube.com/watch?v=92dtrNU1GQc
	if (event.request.url.indexOf('restaurant.html') > -1) {
		event.request = new Request('restaurant.html')
	}
	event.respondWith(
		caches.match(event.request)
		.then(function(response) {
			if (response) return response;
			return fetch(event.request);
		})
		.catch(function(error) {
			console.error(error);
			console.log(event.request);
		})
	);
});
