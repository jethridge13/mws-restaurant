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
    return `https://jethridge-mws-prod.herokuapp.com/restaurants`;
  }

  static get DATABASE_REVIEWS_URL() {
    const port = 1337
    return `https://jethridge-mws-prod.herokuapp.com/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.openDatabase().then(function(db) {
      const store = db.transaction(['restaurants']).objectStore('restaurants');
      store.getAll().then(function(data) {
        if (data.length > 0) {
          callback(null, data);
        } else {
          fetch(DBHelper.DATABASE_URL)
          .then(function(response) {
            return response.json();
          })
          .then(function(json) {
            DBHelper.openDatabase().then(function(db) {
              const tx = db.transaction(['restaurants'], 'readwrite');
              const store = tx.objectStore('restaurants');
              json.forEach(restaurant => {
                store.put(restaurant);
              });
            });
            callback(null, json);
          })
          .catch(error => {
            const errorResponse = (`Request failed with error ${error}`);
            callback(errorResponse, null);
          });
        }
      });
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
          callback(null, data);
        } else {
          DBHelper._fetchRestaurantByIdAndAddToDb(id, callback);
        }
      });
    });
  }

  /**
   * Fetch a restaurant by its ID and add it to the database
   */
  static _fetchRestaurantByIdAndAddToDb(id, callback) {
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
    DBHelper.openDatabase().then(db => {
      const tx = db.transaction(['reviews'], 'readwrite');
      const store = tx.objectStore('reviews');
      store.get(id).then(data => {
        if (data) {
          callback(null, data);
          // If newer data available from server, fetch and display that.
          DBHelper._fetchReviewsAndAddToDB(id, callback);
        } else {
          DBHelper._fetchReviewsAndAddToDB(id, callback);
        }
      })
    });
  }

  static _fetchReviewsAndAddToDB(id, callback) {
    fetch(DBHelper.DATABASE_REVIEWS_URL + `/?restaurant_id=${id}`)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      DBHelper.openDatabase().then(db => {
        const tx = db.transaction(['reviews'], 'readwrite');
        const store = tx.objectStore('reviews');
        store.delete(id);
        store.put(json, id);
      });
      callback(null, json);
    })
    .catch(error => {
      const errorResponse = (`Failed to fetch review from restaurant id: ${id}`);
      callback(errorResponse, null);
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
      return (`./img/dist/webp/${restaurant.photograph}.webp`);
    }
    return (`./img/dist/${restaurant.photograph}.jpg`);
  }

  /**
   * Small restaurant image URL.
   */
  static imageSmallUrlForRestaurant(restaurant, type='jpg') {
    if (type === 'webp') {
      return (`./img/dist/small/webp/${restaurant.photograph}.webp`);
    }
    return (`./img/dist/small/${restaurant.photograph}.jpg`);
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
  static postRestaurantReview(postData, callback) {
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
      callback(null, json);
      DBHelper.addReviewToDb(json);
    })
    .catch(error => {
      DBHelper.openDatabase().then(function(db) {
        const tx = db.transaction(['offline-reviews'], 'readwrite');
        const store = tx.objectStore('offline-reviews');
        store.put(postData);
      });
      callback(error, null);
    });
  }

  /**
   * Get all reviews pending submission
   */
  static getReviewsPendingSubmission(callback) {
    DBHelper.openDatabase().then(function(db) {
      const store = db.transaction(['offline-reviews'], 'readwrite')
      .objectStore('offline-reviews');
      store.getAll().then(function(data) {
        if (data.length !== 0) {
          store.clear().then(() => {
            callback(null, data);
          })
        }
      })
    });
  }

  /**
   * Add a review to the idb
   */
  static addReviewToDb(review) {
    DBHelper.openDatabase().then(db => {
      const store = db.transaction(['reviews'], 'readwrite')
      .objectStore('reviews');
      store.get(review.restaurant_id).then(data => {
        let reviews = review;
        if (data) {
          data.push(review);
          reviews = data;
        }
        store.put(reviews, review.restaurant_id);
      });
    });
  }

  /**
   * Updates the db to reflect the most recent favorite status
   */
  static updateFavoriteInDb(restaurant) {
    DBHelper.openDatabase().then(db => {
      const store = db.transaction(['restaurants'], 'readwrite')
      .objectStore('restaurants');
      store.put(restaurant);
    });
  }

  /**
   * Get a specific favorite pending submission
   */
  static getFavoritePendingSubmission(id, callback) {
    DBHelper.openDatabase().then(function(db) {
      const store = db.transaction(['offline-favorites'], 'readwrite')
      .objectStore('offline-favorites');
      store.get(id).then(function(data) {
        if (data) {
          store.delete(id);
          callback(null, data);
        } else {
          callback(null, null);
        }
      })
      .catch(error => {
        callback(error, null);
      })
    });
  }

  /**
   * Toggles the restaurant between favorite and not favorite
   */
  static toggleFavoriteRestaurant(restaurant, callback) {
    const url = `${DBHelper.DATABASE_URL}/${restaurant.id}/?${restaurant.is_favorite === 'true' ? 'is_favorite=false' : 'is_favorite=true'}`
    fetch(url, {method: 'PUT'})
    .then(response => response.json())
    .then(json => {
      DBHelper.updateFavoriteInDb(json);
      callback(null, json);
    })
    .catch(error => {
      DBHelper.openDatabase().then(db => {
        const tx = db.transaction(['offline-favorites'], 'readwrite');
        const store = tx.objectStore('offline-favorites');
        store.get(restaurant.id).then(data => {
          // If favorite is already in db, then that means there is a
          // pending favorite request. When offline, removing the
          // pending request is essentially the same as sending a
          // request to unfavorite it.
          if (data) {
            store.delete(restaurant.id);
          } else {
            // ID not found in db, save to post later
            store.put({
              id: restaurant.id,
              favorite: restaurant.is_favorite === 'true' ? true : false
            });
          }
        });
      });
      callback(error, null);
    });
  }

  /**
   * Creates a favorite button element
   */
  static createFavoriteButton(restaurant) {
    // TODO Sync favorite button with idb when toggling
    const favorite = document.createElement('button');
    favorite.classList.add('favorite-star');
    favorite.setAttribute('tabindex', '0');
    if (restaurant.is_favorite === 'true') {
      favorite.innerHTML = '&#9733';
      favorite.setAttribute('aria-label', `Remove ${restaurant.name} from favorites`);
      favorite.classList.add('favorited');    
    } else {
      favorite.innerHTML = '&#9734';
      favorite.setAttribute('aria-label', `Add ${restaurant.name} to favorites`);
      favorite.classList.remove('favorited');
    }
    // If there is a pending favorite submission, retrieve it and submit
    DBHelper.getFavoritePendingSubmission(restaurant.id, (error, favorite) => {
      if (error) {
        console.error(error);
      } else if (favorite){
        DBHelper.toggleFavoriteRestaurant(favorite, (error, response) => {
          if (error) {
            // TODO Display error
            console.error(error);
          } else {
            // TODO Display success
            console.log(response);
          }
        });
      }
    });
    favorite.setAttribute('role', 'button');
    favorite.addEventListener('click', (event) => {
      DBHelper.toggleFavoriteRestaurant(restaurant, (error, response) => {
        // TODO Add in loader
        // Even though right now it changes instantensouly, it might not always
        if (error) {
          // TODO Handle error
          console.error(error);
        } else {
          restaurant.is_favorite = response.is_favorite;
          if (response.is_favorite === 'true') {
            favorite.innerHTML = '&#9733';
            favorite.setAttribute('aria-label', `Remove ${restaurant.name} from favorites`);
            favorite.classList.add('favorited');  
          } else {
            favorite.innerHTML = '&#9734';
            favorite.setAttribute('aria-label', `Add ${restaurant.name} to favorites`);
            favorite.classList.remove('favorited');
          }
        }
      });
    });
    return favorite;
  }

  static openDatabase() {
    if (!'serviceWorker' in navigator) {
      return Promise.resolve();
    }
  
    return idb.open('mws-restaurant', 1, function(upgradeDb) {
      const restaurants = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });

      const offlineReviews = upgradeDb.createObjectStore('offline-reviews', {
        autoIncrement: true
      });

      const offlineFavorites = upgradeDb.createObjectStore('offline-favorites', {
        keyPath: 'id'
      });

      const reviews = upgradeDb.createObjectStore('reviews', {autoIncrement: true});
    });
  }

  static handleIntersection(entries) {
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
          // There is no reason for it to be called a second time.
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
