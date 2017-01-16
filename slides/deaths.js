const unhcr = require('../services/unhcr');
const renderSlide = require('../render-slide');

module.exports = (parameters) => {
  return unhcr.mediterranean.deathsAndArrivalsByYear()
  .then((yearsOfDeathsAndArrivals) => {
    // Filtering out data with zeros - as these could be considered unrealistic
    const years = Object.keys(yearsOfDeathsAndArrivals).filter(year => {
      const deathsAndArrivalsThatYear = yearsOfDeathsAndArrivals[year];
      return deathsAndArrivalsThatYear.deaths > 0 &&
             deathsAndArrivalsThatYear.arrivals > 0;
    }).sort();

    return years.map(year => {
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
  });
};
