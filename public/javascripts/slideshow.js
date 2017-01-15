const Map = require('./map');

const ARROW_LEFT = 37;
const ARROW_RIGHT = 39;

class Slideshow {
  constructor(options) {
    this.options = options;
    this.map = new Map(options.mapElement, {
      worldMapUrl: '/data/world.geojson'
    });
    this.$overlay = $(options.overlayElement);
    this.loadSlides();
  }

  loadSlides() {
    if(this.slides) {
      this.slides = this.slides;
      this.changeSlide(null, 0);
    } else if(typeof(this.options.loadSlides) === 'function') {
      this.options.loadSlides().then((slides) => {
        this.slides = slides;
        // and then changing to the first slide
        this.changeSlide(null, 0);
      });
    } else {
      throw new Error('No way of loading slides');
    }
  }

  changeSlide(oldSlideIndex, newSlideIndex) {
    const oldSlide = oldSlideIndex !== null ? this.slides[oldSlideIndex] : null;
    const newSlide = this.slides[newSlideIndex];

    this.currentSlideIndex = newSlideIndex;

    newSlide.enter(this);
    if(oldSlide) {
      oldSlide.exit(this);
    }
  }

  changeSlideByOffset(offset) {
    const oldSlideIndex = this.currentSlideIndex;
    let newSlideIndex = this.currentSlideIndex + offset;
    // Make sure the slide index is positive
    while(newSlideIndex < 0) {
      newSlideIndex += this.slides.length;
    }
    // Make sure the index is not too large
    newSlideIndex %= this.slides.length;
    // Transition the slide
    this.changeSlide(oldSlideIndex, newSlideIndex);
  }

  nextSlide() {
    this.changeSlideByOffset(1);
  }

  previousSlide() {
    this.changeSlideByOffset(-1);
  }

  keypress(keyCode) {
    if(keyCode === ARROW_LEFT) {
      this.previousSlide();
    } else if(keyCode === ARROW_RIGHT) {
      this.nextSlide();
    } else {
      console.warn('Unexpected key press: ' + keyCode);
    }
  }
}

module.exports = Slideshow;