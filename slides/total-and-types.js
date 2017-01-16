const unhcr = require('../services/unhcr');
const renderSlide = require('../render-slide');
const helpers = require('../helpers');

module.exports = (parameters) => {
  return unhcr.refugeesPerYearAndContries(parameters)
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
        duration: 5000,
        map: {
          countriesInFocus
        }
      });
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
        duration: 5000,
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
};
