const express = require('express');
const pug = require('pug');
const path = require('path');
const _ = require('lodash');

const TOP_COUNTRY_COUNT = 5;

const unhcr = require('../services/unhcr');
const helpers = require('../helpers');

const router = express.Router();

function renderSlide(type, locals) {
  const p = path.join(__dirname, '..', 'views', 'slides', type + '.pug');
  locals.helpers = helpers;
  return pug.renderFile(p, locals);
}

router.get('/', function(req, res, next) {
  unhcr.mediterranean.monthlyArrivalsByCountry().then(arrivals => {
    res.json(arrivals);
  }, next);
});

router.get('/slides.json', function(req, res, next) {
  let slidePromises = [];

  const thisYear = (new Date()).getFullYear();
  const pastFiveYears = [];
  for(let year = thisYear; year > thisYear-5; year--) {
    pastFiveYears.push(year);
  }

  let totalAndTypeSlidePromises = unhcr
  .refugeesPerYearAndContries(TOP_COUNTRY_COUNT, [2013, 2012, 2011, 2010, 2009])
  .then((yearAccumulations) => {
    const slides = [];
    const maxTotalRefugees = yearAccumulations.reduce((result, accumulation) => {
      const maxTotalRefugeesThisYear = accumulation.topCountries[0].totalRefugees;
      if(maxTotalRefugeesThisYear > result) {
        return maxTotalRefugeesThisYear;
      } else {
        return result;
      }
    }, 0);
    // Generate the 'total' slides
    yearAccumulations.forEach((yearAccumulation) => {
      const countriesInFocus = yearAccumulation.topCountries
      .map(accumulation => {
        return {
          code: accumulation.origin,
          label: helpers.formatNumber(accumulation.totalRefugees),
          significance: accumulation.totalRefugees / maxTotalRefugees
        };
      });

      slides.push({
        content: renderSlide('total', {
          totalRefugees: yearAccumulation.totalRefugees || 0,
          year: yearAccumulation.year
        }),
        map: {
          countriesInFocus
        }
      });
    });
    // Generate the 'total' slides
    yearAccumulations.forEach((yearAccumulation) => {
      slides.push({
        content: renderSlide('types', {
          totalInternallyDisplaced: yearAccumulation.totalInternallyDisplaced || 0,
          totalStateless: yearAccumulation.totalStateless || 0,
          totalRefugees: yearAccumulation.totalRefugees || 0,
          totalAsylumSeekers: yearAccumulation.totalAsylumSeekers || 0,
          year: yearAccumulation.year
        }),
        map: {
          projection: {
            center: [0, 0],
            rotate: [0, 0],
            scale: 200
          }
        }
      });
    });
    return slides;
  });

  // Prepend the promises
  slidePromises = slidePromises.concat(totalAndTypeSlidePromises);

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
  const path = require.resolve('datamaps/src/js/data/world.topo.json');
  // const path = require.resolve('datamaps/src/js/data/world.hires.topo.json');
  res.sendFile(path);
});

module.exports = router;
