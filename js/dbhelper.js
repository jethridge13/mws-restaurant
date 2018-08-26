/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_REVIEWS_URL() {
    const port = 1337
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.openDatabase().then(function(db) {
      const store = db.transaction(['misc']).objectStore('misc');
      // TODO Consider getting by index instead of using getAll()
      store.getAll().then(function(data) {
        if (data.length > 0) {
          callback(null, data[0]);
          return;
        }
      });
    });

    fetch(DBHelper.DATABASE_URL)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      DBHelper.openDatabase().then(function(db) {
        const tx = db.transaction(['misc'], 'readwrite');
        const store = tx.objectStore('misc');
        store.getAll().then(function(data) {
          if (data.length === 0) {
            store.put(json);
          }
        })
      });
      callback(null, json);
    })
    .catch(error => {
      const errorResponse = (`Request failed with error ${error}`);
      callback(errorResponse, null);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    DBHelper.openDatabase().then(function(db) {
      const store = db.transaction(['restaurants']).objectStore('restaurants');
      store.get(parseInt(id)).then(function(data) {
        if (data) {
          return data;
        }
      });
    })

    fetch(`${DBHelper.DATABASE_URL}/${id}`)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      // Put request into object store

      DBHelper.openDatabase().then(function(db) {
        const tx = db.transaction(['restaurants'], 'readwrite');
        const store = tx.objectStore('restaurants');
        store.put(json);
      });
      callback(null, json);
    })
    .catch(error => {
      const errorResponse = (`Request failed with error ${error}`);
      callback(errorResponse, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch all of a restaurant's reviews by ID.
   */
  static fetchReviews(id, callback) {
    fetch(DBHelper.DATABASE_REVIEWS_URL + `/?restaurant_id=${id}`)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      // TODO Add this to idb cache
      callback(null, json);
    })
    .catch(error => {
      const errorResponse = (`Failed to fetch review from restaurant id: ${id}`);
      callback(errorResponse, null);
    })
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, type='jpg') {
    if (type === 'webp') {
      return (`/img/dist/webp/${restaurant.photograph}.webp`);
    }
    return (`/img/dist/${restaurant.photograph}.jpg`);
  }

  /**
   * Small restaurant image URL.
   */
  static imageSmallUrlForRestaurant(restaurant, type='jpg') {
    if (type === 'webp') {
      return (`/img/dist/small/webp/${restaurant.photograph}.webp`);
    }
    return (`/img/dist/small/${restaurant.photograph}.jpg`);
  }

  /**
   * Placeholder image URL.
   */
  static placeholderImageUrl() {
    return DBHelper.imageUrlForRestaurant({'photograph': 'undefined'});
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map, staticMap=true) {
    if (staticMap) {
      const staticMap = document.getElementById('static-map');
      const lat = restaurant.latlng.lat;
      const lng = restaurant.latlng.lng;
      const zoom = 16;
      const key = 'AIzaSyCZrFBCrmeqZztSGeC4MmUxqJgT63L_3lo';

      const staticMapSrc = 
      `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}`
      + `&zoom=${zoom}&size=800x650&maptype=roadmap&key=${key}`
      + `&markers=color:red%7C${lat},${lng}`;

      staticMap.src = staticMapSrc;
    } else {
      const marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP}
      );
      return marker;
    }
  }

  /**
   * POST a review to the database
   */
  static postRestaurantReview(postData) {
    const postURL = 'http://localhost:1337/reviews'
    fetch(postURL, {
      method: 'POST',
      body: JSON.stringify(postData),
      headers : {'Content-Type': 'application/json'}
    })
    .then(response => {
      return response.json();
    })
    .then(json => {
      // TODO Confirm submission success
      console.log(json);
    })
    .catch(error => {
      // TODO Display error
      console.log(error);
      DBHelper.openDatabase().then(function(db) {
        const tx = db.transaction(['offline-reviews'], 'readwrite');
        const store = tx.objectStore('offline-reviews');
        store.put(postData);
      });
    });
  }

  static openDatabase() {
    if (!'serviceWorker' in navigator) {
      return Promise.resolve();
    }
  
    return idb.open('mws-restaurant', 1, function(upgradeDb) {
      const restaurants = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });

      const misc = upgradeDb.createObjectStore('misc', {
        autoIncrement: true
      });

      const offlineReviews = upgradeDb.createObjectStore('offline-reviews', {
        autoIncrement: true
      });
    });
  }

  static handleIntersection(entries) {
  // There is no reason for it to be called a second time.
  // All code is my own original work. The following links were
  // consulted when working on it.
  // https://developers.google.com/web/updates/2016/04/intersectionobserver
  // https://scotch.io/tutorials/lazy-loading-images-for-performance-using-intersection-observer
    window.requestIdleCallback(() => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.nodeName === 'PICTURE') {
          Array.from(entry.target.children).forEach(child => {
            if (child['data-fullsrc'] && child.src) {
              child.src = child['data-fullsrc'];
            } else if (child['data-fullsrc'] && child.srcset) {
              child.srcset = child['data-fullsrc'];
            }
          });
          observer.unobserve(entry.target);
        }
      })
    });
  }

  static registerObserver() {
    const options = {
      threshold: 0.2
    };
    let observer = new IntersectionObserver(DBHelper.handleIntersection, options);
    return observer
  }


}
