const ERROR_RELOAD_DELAY = 10000;
const ACTIVE_SLIDE_CLASS = 'overlay__slide--active';

const $errorOverlay = $('.overlay__error');
// Log any error and reload the page - with a timeout to prevent enless reloads
window.onerror = function(message, url, lineNumber) {
  console.error(message, url, '(line ' + lineNumber + ')');
  $errorOverlay.addClass(ACTIVE_SLIDE_CLASS);
  const where = url.replace(location.href, '') + ' (line ' + lineNumber + ')';
  const text = [message, where].join('\n');
  $errorOverlay.find('#stacktrace').text(text);
  // Reload
  setTimeout(() => {
    location.reload();
  }, ERROR_RELOAD_DELAY);
  return true;
};

// To free any accidental memory leaks and refresh the data.
// Once every day.
const AUTOMATIC_RELOAD_DELAY = 1000 * 60 * 60 * 24;
setTimeout(() => {
  location.reload();
}, AUTOMATIC_RELOAD_DELAY);

const request = require('request-promise');

const Slideshow = require('./slideshow');
const Slide = require('./slide');

const $loading = $('.overlay__loading');

const slideshow = new Slideshow({
  loadSlides: () => {
    $loading.addClass(ACTIVE_SLIDE_CLASS);
    return request({
      url: location.href + 'data/slides.json',
      json: true
    }).then((slides) => {
      $loading.removeClass(ACTIVE_SLIDE_CLASS);
      return slides.map((slide) => {
        return new Slide(slideshow, slide);
      });
    });
  },
  mapElement: document.getElementById('map'),
  overlayElement: document.getElementById('overlay'),
  autoProgress: true
});

// When resizing the window, resize the slideshows map
$(window).on('resize', () => {
  slideshow.map.resized();
});

// When a key is pressed, tell the slideshow
$(document).on('keydown', (e) => {
  slideshow.keypress(e.which);
});
