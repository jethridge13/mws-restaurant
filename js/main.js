let restaurants,
  neighborhoods,
  cuisines,
  observer
var map
var markers = []


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  const loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  // Create parent picture element
  const picture = document.createElement('picture');

  const webpSource = document.createElement('source');
  webpSource.srcset = DBHelper.imageSmallUrlForRestaurant(restaurant, 'webp');
  webpSource.type = 'image/webp';
  webpSource['data-fullsrc'] = DBHelper.imageUrlForRestaurant(restaurant, 'webp');

  // Create fallback image element
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  if (restaurant.photograph) {
    image.src = DBHelper.imageSmallUrlForRestaurant(restaurant);
    image['data-fullsrc'] = DBHelper.imageUrlForRestaurant(restaurant);
  } else {
    image.src = DBHelper.placeholderImageUrl();
  }
  image.alt = `Image of ${restaurant.name} Restaurant`;
  image.addEventListener('error', function handler(error) {
    // Remove event handler. In case of extreme error and
    // the placeholder can't be found, this will avoid an
    // infinite loop.
    image.src = DBHelper.placeholderImageUrl();
    image.removeEventListener('error', handler);
  });

  // Add intersection observer
  if (!observer) {
    observer = DBHelper.registerObserver();
  }
  observer.observe(picture);

  // Add picture to element
  picture.append(webpSource);
  picture.append(image);
  li.append(picture);

  // Name
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  // Neighborhood information
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  // Address information
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  // View Details button
  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View Details for ${restaurant.name}`);
  more.setAttribute('role', 'button');
  li.append(more)

  // Favorite button
  li.append(DBHelper.createFavoriteButton(restaurant));

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants, staticMap = true) => {
  if (staticMap) {
    const lat = 40.722216;
    const lng = -73.987501;
    const zoom = 12;
    const key = 'AIzaSyCZrFBCrmeqZztSGeC4MmUxqJgT63L_3lo';

    let markers = '';
    restaurants.forEach(x => {
      markers += `&markers=color:red%7C${x.latlng.lat},${x.latlng.lng}`;
    });
    const staticMapSrc = 
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}`
    +`&zoom=${zoom}&size=800x650&maptype=roadmap&key=${key}`
    + markers;

    document.getElementById('static-map').src = staticMapSrc;
  } else {
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map, false);
      google.maps.event.addListener(marker, 'click', () => {
        window.location.href = marker.url
      });
      self.markers.push(marker);
    });
  }
}

/**
 * Register the service worker.
 */
registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js').then(function(registration) {
        console.log('Service worker registered! Scope:', registration.scope);
      }).catch(function(error) {
        console.log('Service worker registration failed:', error);
      })
    })
  } else {
    console.log('Service workers are not supported.');
  }
}

addSwitchMapListener = () => {
  // Idea behind switching maps attributed to Lorenzo Zaccagnini
  // https://medium.com/@lorenzozaccagnini/improve-google-map-performance-in-your-pwa-fe24a6b3a37b
  // Implementation is entirely my own.
  staticMap = document.getElementById('static-map');
  staticMap.addEventListener('click', () => {
    // Load script
    const script = document.createElement('script');
    script.src= 'https://maps.googleapis.com/maps/api/js?' +
    'key=AIzaSyCZrFBCrmeqZztSGeC4MmUxqJgT63L_3lo&libraries=places' +
    '&callback=initMap';
    script.addEventListener('load', () => {
      staticMap.style.display = 'none';
      initMap();
      addMarkersToMap(self.restaurants, false);
      document.getElementById('map').style.display = 'block';
    });

    document.getElementsByTagName('head')[0].append(script);

  });
}

registerServiceWorker();

window.onload = () => {
  updateRestaurants();
  addSwitchMapListener();
}

