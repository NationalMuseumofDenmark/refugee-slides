const unhcr = require('../services/unhcr');
const renderSlide = require('../render-slide');
const helpers = require('../helpers');

const DEFAULT_DURATION = 5000;
const INTRO_DURATION = 10000;

module.exports = (parameters) => {
  return unhcr.refugeesPerYearAndContries(parameters)
  .then((yearAccumulations) => {
    const firstYear = Math.min(...yearAccumulations.map(a => a.year));
    const lastYear = Math.max(...yearAccumulations.map(a => a.year));
    const slides = [];
    slides.push({
      content: renderSlide('intro-total', {
        slideCount: yearAccumulations.length,
        firstYear,
        lastYear
      }),
      credits: false,
      duration: INTRO_DURATION
    });
    const maxTotalCombined = yearAccumulations.reduce((result, accumulation) => {
      const topCountry = accumulation.topCountries[0];
      if(topCountry.totalCombined > result) {
        return topCountry.totalCombined;
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
          label: helpers.formatNumber(accumulation.totalCombined),
          significance: accumulation.totalCombined / maxTotalCombined
        };
      });

      slides.push({
        content: renderSlide('total', {
          totalCombined: yearAccumulation.totalCombined || 0,
          year: yearAccumulation.year
        }),
        duration: DEFAULT_DURATION,
        map: {
          countriesInFocus
        }
      });
    });
    slides.push({
      content: renderSlide('intro-types', {
        slideCount: yearAccumulations.length,
        firstYear,
        lastYear
      }),
      credits: false,
      duration: INTRO_DURATION
    });
    // Generate the 'type' slides
    yearAccumulations.forEach((yearAccumulation) => {
      slides.push({
        content: renderSlide('types', {
          totalInternallyDisplaced: yearAccumulation.totalInternallyDisplaced || 0,
          totalStateless: yearAccumulation.totalStateless || 0,
          totalRefugees: yearAccumulation.totalRefugees || 0,
          totalAsylumSeekers: yearAccumulation.totalAsylumSeekers || 0,
          year: yearAccumulation.year
        }),
        duration: DEFAULT_DURATION
      });
    });
    return slides;
  });
};
