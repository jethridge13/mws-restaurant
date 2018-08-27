let restaurant,
  observer;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map, false);
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      if (!self.restaurant.reviews) {
        restaurant.reviews = DBHelper.fetchReviews(self.restaurant.id, (error, reviews) => {
          if (!error) {
            self.restaurant.reviews = reviews;
          }
          fillBreadcrumb();
          fillRestaurantHTML();
          callback(null, restaurant)
        });
      }
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const source = document.getElementById('restaurant-pic');
  source.srcset = DBHelper.imageSmallUrlForRestaurant(restaurant, 'webp');
  source.type = 'image/webp';
  source['data-fullsrc'] = DBHelper.imageUrlForRestaurant(restaurant, 'webp');

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  if (restaurant.photograph) {
    image.src = DBHelper.imageSmallUrlForRestaurant(restaurant);
    image['data-fullsrc'] = DBHelper.imageUrlForRestaurant;
  } else {
    image.src = DBHelper.placeholderImageUrl();
  }
  image.alt = `Image of ${restaurant.name} Restaurant`;
  image.addEventListener('error', function handler(error) {
    image.src = DBHelper.placeholderImageUrl();
    image.removeEventListener('error', handler);
  });

  if (!observer) {
    observer = DBHelper.registerObserver();
  }
  observer.observe(source.parentElement);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  // Creation date
  if (review.createdAt) {
  	const date = document.createElement('p');
  	date.innerHTML = `Posted: ${new Date(review.createdAt)}`;
  	date.classList.add('review-date');
  	li.appendChild(date);
  }

  // Last update
  if (review.updatedAt && review.updatedAt !== review.createdAt) {
  	const updatedDate = document.createElement('p');
  	updatedDate.innerHTML = `Updated: ${new Date(review.updatedAt)}`;
  	date.classList.add('review-date');
  	li.appendChild(date);
  }

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const ol = document.createElement('ol');

  const li = document.createElement('li');
  li.innerHTML = restaurant.name;

  ol.appendChild(li);
  breadcrumb.appendChild(ol);
}

submitReview = (form) => {
  // Get all form inputs
  const reviewName = form.elements.namedItem('review-name');
  const reviewRating = form.elements.namedItem('review-rating');
  const reviewComments = form.elements.namedItem('review-comments');
  const restaurantID = self.restaurant.id;

  // Rudimentary field validation
  // TODO Add more validation to rating
  if (!(reviewName && reviewRating && reviewComments)) {
    return false;
  }
  // TODO Refactor this to be more DRY.
  if (!reviewName.value) {
    displayMissingFieldModal(reviewName);
    return false;
  } else if (!reviewRating.value) {
    displayMissingFieldModal(reviewRating);
    return false;
  } else if (!reviewComments.value) {
    displayMissingFieldModal(reviewComments);
    return false;
  }

  // Show spinner icon
  const reviewDiv = document.getElementById('review-submission');
  reviewDiv.style.display = 'none';
  
  const loader = document.createElement('div');
  loader.classList.add('loader');
  loader.id = ('review-loader');

  document.getElementById('review-submission-container').append(loader);

  // Create POST content
  const postData = {
    'restaurant_id': restaurantID,
    'name': reviewName.value,
    'rating': reviewRating.value,
    'comments': reviewComments.value
  }

  // Submit post
  DBHelper.postRestaurantReview(postData, (error, response) => {
    if (error) {
      removeReviewLoader();
      displayReviewSubmissionError(error);
      return false;
    }
    removeReviewLoader();
    displayReviewSubmissionSuccess();
    displayRecentlySubmittedReview(postData);
  });
  return false;
}

/**
 * Function to display a modal with various options on the review section
 */
displayReviewModal = (options) => {
  // TODO For robustness, add type checking
  /**
   * options: {
   *    title: 'Modal title',
   *    imageElement: HTMLElementObject,
   *    details: 'A bunch of text to display at the button'
   *  }
   */
  const reviewModal = document.createElement('div');
  reviewModal.classList.add('review-modal');
  reviewModal.id = 'review-modal';

  // Add title to modal
  if (options.title) {
    const modalTitle = document.createElement('h3');
    modalTitle.innerHTML = options.title;
    modalTitle.classList.add('review-modal-title');
    reviewModal.append(modalTitle);
  }

  // Add image to modal
  if (options.imageElement) {
    reviewModal.append(options.imageElement);
  }

  // Add comments to modal
  if (options.details) {
    const modalDetails = document.createElement('p');
    modalDetails.innerHTML = options.details;
    modalDetails.classList.add('review-modal-details');
    reviewModal.append(modalDetails);
  }

  // Add confirmation button
  const modalConfirm = document.createElement('button');
  modalConfirm.innerHTML = 'OK';
  modalConfirm.classList.add('review-modal-button');
  modalConfirm.addEventListener('click', () => {
    const reviewModal = document.getElementById('review-modal');
    reviewModal.parentNode.removeChild(reviewModal);
  });
  reviewModal.append(modalConfirm);

  // Add it all to review section
  document.getElementById('review-submission-container').append(reviewModal);
}

displayMissingFieldModal = (input) => {
  // TODO
}

displayReviewSubmissionSuccess = () => {
  const modalData = {
    title: 'Review Submitted!',
    details: 'Your review has been successfully submitted!'
  }

  const confirmationCheckmark = document.createElement('span');
  confirmationCheckmark.innerHTML = '&#10004';
  confirmationCheckmark.style.fontSize = '100px';
  confirmationCheckmark.style.color = 'green';
  modalData.imageElement = confirmationCheckmark;

  displayReviewModal(modalData);
}

displayReviewSubmissionError = (error) => {
  const modalData = {
    title: 'Error in Submitting Review',
    details: 'There was an error in submitting your review. It has been saved and will be resubmitted when possible.'
  }

  const errorDisplay = document.createElement('span');
  errorDisplay.innerHTML = '&#10008';
  errorDisplay.style.fontSize = '100px';
  errorDisplay.style.color = 'red';
  modalData.imageElement = errorDisplay;

  displayReviewModal(modalData);
}

displayRecentlySubmittedReview = (reviewData) => {
  // TODO
  const reviewsList = document.getElementById('reviews-list');
  const newReview = createReviewHTML(reviewData);
  newReview.style.backgroundColor = '#a4def1';
  reviewsList.insertBefore(newReview, reviewsList.childNodes[0]);
}

/**
 * Removes the loader that is displayed after submitting a review
 * Returns true if loader removed, otherwise returns false.
 */
removeReviewLoader = () => {
  const reviewLoader = document.getElementById('review-loader');
  if (reviewLoader) {
    reviewLoader.parentNode.removeChild(reviewLoader);
    document.getElementById('review-name').value = '';
    document.getElementById('review-rating').value = '';
    document.getElementById('review-comments').value = '';
    document.getElementById('review-submission').style.display = 'block';
    return true;
  }
  return false;
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Register the service worker.
 */
registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
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
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map, false);
      staticMap.style.display = 'none';
      document.getElementById('map').style.display = 'block';
    });

    document.getElementsByTagName('head')[0].append(script);
  });
}

registerServiceWorker();

window.onload = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
  addSwitchMapListener();
}
