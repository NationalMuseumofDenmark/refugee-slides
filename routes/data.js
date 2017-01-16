const express = require('express');
const path = require('path');
const _ = require('lodash');

const TOP_COUNTRY_COUNT = 10;

const unhcr = require('../services/unhcr');

const router = express.Router();

const TIME_SERIES_YEARS = [];
unhcr.timeSeriesYears().then(years => {
  years.forEach(year => {
    TIME_SERIES_YEARS.push(year);
  })
  TIME_SERIES_YEARS.sort().reverse();
});

router.get('/', function(req, res, next) {
  unhcr.mediterranean.monthlyArrivalsByCountry().then(arrivals => {
    res.json(arrivals);
  }, next);
});

router.get('/slides.json', function(req, res, next) {
  const PAST_FIVE_TIME_SERIES_YEARS = TIME_SERIES_YEARS.slice(0, 5).reverse();

  const CURRENT_YEAR = (new Date()).getFullYear();
  const PAST_FIVE_YEARS = [];
  for(let year = CURRENT_YEAR; year > CURRENT_YEAR-5; year--) {
    PAST_FIVE_YEARS.push(year);
  }
  PAST_FIVE_YEARS.reverse();

  let slidePromises = [
    require('../slides/total-and-types')({
      years: PAST_FIVE_TIME_SERIES_YEARS,
      topCountryCount: TOP_COUNTRY_COUNT
    }),
    require('../slides/syria')({
      years: PAST_FIVE_TIME_SERIES_YEARS
    }),
    require('../slides/arrivals')({
    }),
    require('../slides/deaths')({
      PAST_FIVE_YEARS
    })
  ];

  // Concatinate all of them into one long list
  slidePromises = [].concat(...slidePromises);
  // When all promises of slides a fulfilled, we flatten the list and respond
  Promise.all(slidePromises).then((slides) => {
    const allSlides = [];
    slides.forEach((slideGroup) => {
      if(Array.isArray(slideGroup)) {
        // This was in-fact a group of slides
        slideGroup.forEach((slide) => {
          allSlides.push(slide);
        });
      } else {
        // This was in-fact a single slide
        allSlides.push(slideGroup);
      }
    });
    return allSlides;
  }).then((slides) => {
    res.json(slides);
  }, next);
});

router.get('/world.geojson', function(req, res, next) {
  // const path = require.resolve('datamaps/src/js/data/world.topo.json');
  const path = require.resolve('datamaps/src/js/data/world.hires.topo.json');
  res.sendFile(path);
});

module.exports = router;
