/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
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
          console.log('Returning cached restaurants');
          console.log(data[0]);
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
   * Placeholder image URL.
   */
  static placeholderImageUrl() {
    return DBHelper.imageUrlForRestaurant({'photograph': 'undefined'});
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static openDatabase() {
    if (!'serviceWorker' in navigator) {
      return Promise.resolve();
    }
  
    return idb.open('mws-restaurant', 1, function(upgradeDb) {
      const restaurants = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'name'
      });

      const misc = upgradeDb.createObjectStore('misc', {
        autoIncrement: true
      });
    });
  }

}
