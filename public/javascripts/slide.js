const ACTIVE_CLASS = 'overlay__slide--active';

class Slide {
  constructor(slideshow, options) {
    this.slideshow = slideshow;
    this.options = options;
    this.$slide = $(options.content || '');
  }

  show() {
    // But not right away
    setTimeout(() => {
      this.$slide.addClass(ACTIVE_CLASS);
    }, 1);
  }

  hide() {
    this.$slide.removeClass(ACTIVE_CLASS);
  }

  enter() {
    if(this.options.map === false) {
      this.slideshow.map.hide();
    } else {
      this.slideshow.map.show();
      this.slideshow.map.update(this.options.map || {});
    }
    // If we are already exiting
    if(this.removalTimeout) {
      clearTimeout(this.removalTimeout);
      delete this.removalTimeout;
    }
    // Attach the element to the dom
    this.$slide.appendTo(this.slideshow.$overlay);
    // And then show it
    this.show();
  }

  exit() {
    // Hide the element
    this.hide();
    // And then detach it from the dom.
    this.removalTimeout = setTimeout(() => {
      this.$slide.remove();
    }, 500); // The same as $default-transition-duration
  }
}

module.exports = Slide;
