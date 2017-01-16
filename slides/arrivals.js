const unhcr = require('../services/unhcr');
const renderSlide = require('../render-slide');
const helpers = require('../helpers');

module.exports = (parameters) => {
  return unhcr.mediterranean.arrivalsPerYearMonthLocation()
  .then(arrivalsPerYear => {
    const slides = [];
    const years = Object.keys(arrivalsPerYear)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).reverse();

    // Calculate the maximal amount of refugees a sigle country has had
    const maximalPerCountryMonth = years.reduce((max, year) => {
      const arrivalsThatYear = arrivalsPerYear[year];
      const months = Object.keys(arrivalsThatYear);
      const maximalPerCountryMonthThatYear = months.reduce((max, month) => {
        const arrivalsThatMonth = arrivalsThatYear[month];
        const countryCode = Object.keys(arrivalsThatMonth.countries);
        const maximalThatMonth = countryCode.reduce((max, code) => {
          const arrivalsThatMonthInCountry = arrivalsThatMonth.countries[code];
          return Math.max(max, arrivalsThatMonthInCountry.value);
        }, 0);
        return Math.max(max, maximalThatMonth);
      });
      return Math.max(max, maximalPerCountryMonthThatYear);
    }, 0);

    years.forEach(year => {
      const arrivalsThatYear = arrivalsPerYear[year];
      const months = Object.keys(arrivalsThatYear)
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).reverse();

      months.forEach(month => {
        const arrivalsThatMonth = arrivalsThatYear[month];
        // Generate arcs based on locations
        arrivalsThatMonth.locations.forEach(arrival => {
          // console.log('arrival', arrival);
        });
        // Calculate contries that should be in focus
        const countriesInFocus = Object.keys(arrivalsThatMonth.countries)
        .map(code => {
          const arrivalsThatMonthInCountry = arrivalsThatMonth.countries[code];
          return {
            code,
            label: helpers.formatNumber(arrivalsThatMonthInCountry.value),
            significance: arrivalsThatMonthInCountry.value / maximalPerCountryMonth
          };
        });
        // Render and push to the array of slides
        slides.push({
          content: renderSlide('arrivals', {
            totalArrivals: arrivalsThatMonth.total,
            year,
            month
          }),
          duration: 2000,
          map: {
            countriesInFocus,
            scale: 5,
            offset: [0, 100]
          }
        });
      });
    });
    return slides;
  });
};
