const unhcr = require('../services/unhcr');
const worldbank = require('../services/worldbank');
const renderSlide = require('../render-slide');
const helpers = require('../helpers');

module.exports = (parameters) => {
  return unhcr.refugeesPerYearAndContries({
    years: parameters.years,
    origin: 'SYR'
  })
  .then((yearAccumulations) => {
    // Determine the total population of the country
    const fromYear = Math.min(...parameters.years);
    const toYear = Math.max(...parameters.years);
    return worldbank.totalPopulation('SY', fromYear, toYear)
    .then((populationStatistics) => {
      const populationsPerYear = {};
      if(populationStatistics.length < 2) {
        throw new Error('Unexpected result');
      }
      // Loop though the results
      populationStatistics[1].forEach(yearStatistic => {
        const year = parseInt(yearStatistic.date, 10);
        const value = parseInt(yearStatistic.value, 10);
        populationsPerYear[year] = value;
      });
      // Extend the accumulation with the population.
      yearAccumulations.forEach((yearAccumulation) => {
        const totalPopulation = populationsPerYear[yearAccumulation.year];
        yearAccumulation.totalPopulation = totalPopulation;
      });
      return yearAccumulations;
    });
  })
  .then((yearAccumulations) => {
    return yearAccumulations.map((yearAccumulation) => {
      return {
        content: renderSlide('syria', {
          totalPopulation: yearAccumulation.totalPopulation,
          totalInternallyDisplaced: yearAccumulation.totalInternallyDisplaced || 0,
          totalRefugees: yearAccumulation.totalRefugees || 0,
          year: yearAccumulation.year
        }),
        duration: 5000,
        map: {
          countriesInFocus: [
            { code: 'SYR' }
          ],
          scale: 5,
          offset: [-500, 0]
        }
      };
    });
  });
};
