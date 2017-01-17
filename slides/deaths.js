const unhcr = require('../services/unhcr');
const renderSlide = require('../render-slide');

const INTRO_DURATION = 10000;

module.exports = (parameters) => {
  return unhcr.mediterranean.deathsAndArrivalsByYear()
  .then((yearsOfDeathsAndArrivals) => {
    // Filtering out data with zeros - as these could be considered unrealistic
    const years = Object.keys(yearsOfDeathsAndArrivals).filter(year => {
      const deathsAndArrivalsThatYear = yearsOfDeathsAndArrivals[year];
      return deathsAndArrivalsThatYear.deaths > 0 &&
             deathsAndArrivalsThatYear.arrivals > 0;
    }).sort();

    const slides = years.map(year => {
      const deathsAndArrivalsThatYear = yearsOfDeathsAndArrivals[year];
      return {
        content: renderSlide('deaths', {
          totalArrivals: deathsAndArrivalsThatYear.arrivals,
          totalDeaths: deathsAndArrivalsThatYear.deaths,
          year
        }),
        duration: 5000,
        map: false
      };
    });

    const fromYear = Math.min(...years);
    const toYear = Math.max(...years);
    return [{
      content: renderSlide('intro-deaths', {
        slideCount: slides.length,
        firstYear: fromYear,
        lastYear: toYear
      }),
      credits: false,
      duration: INTRO_DURATION
    }].concat(slides);
  });
};
