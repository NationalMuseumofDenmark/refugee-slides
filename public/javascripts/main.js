const request = require('request-promise');

const Slideshow = require('./slideshow');
const Slide = require('./slide');

const ACTIVE_SLIDE_CLASS = 'overlay__slide--active';
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
  overlayElement: document.getElementById('overlay')
});

// When resizing the window, resize the slideshows map
$(window).on('resize', () => {
  slideshow.map.resized();
});

// When a key is pressed, tell the slideshow
$(document).on('keydown', (e) => {
  slideshow.keypress(e.which);
});
