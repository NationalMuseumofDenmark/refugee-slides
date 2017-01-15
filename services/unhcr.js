const request = require('request-promise');
const _ = require('lodash');

const BASE_URL = 'http://data.unhcr.org/api/stats/';

function getOrCreate(array, key, defaults) {
  if(key in array) {
    return array[key];
  } else {
    const obj = _.clone(defaults);
    array[key] = obj;
    return obj;
  }
}

function parseCount(statistic, key) {
  // Accumulate the number of internally displaced
  if(statistic[key] === '*') {
    // Confidential - let's assume at least 1
    return 1;
  } else if(statistic[key]) {
    return parseInt(statistic[key], 10);
  } else {
    return 0;
  }
}

const unhcr = {
  mediterranean: {
    monthlyArrivalsByCountry: () => {
      return unhcr.request('mediterranean/monthly_arrivals_by_country.json');
    }
  },
  refugeesPerYearAndContries: (topCountryCount, years) => {
    const promisedYears = years.map(year => {
      return unhcr.personsPerContries(year)
      .then(statistics => {
        return {
          year,
          statistics
        };
      });
    });

    return Promise.all(promisedYears).then(statisticsPerYear => {
      return statisticsPerYear.map(statisticsThatYear => {
        const year = statisticsThatYear.year;
        const statistics = statisticsThatYear.statistics;

        // TODO: Accumulate refugees per country_of_origin
        const statisticsPerOrigin = {};
        statistics.forEach(statistic => {
          const origin = statistic.country_of_origin;
          const residence = statistic.country_of_residence;
          // Initialize if this is the first - or get it
          let accumulation = getOrCreate(statisticsPerOrigin, origin, {
            totalInternallyDisplaced: 0,
            totalStateless: 0,
            totalRefugees: 0,
            totalAsylumSeekers: 0,
            perResidence: {},
            origin
          });
          accumulation.totalInternallyDisplaced += parseCount(statistic, 'idps');
          accumulation.totalStateless += parseCount(statistic, 'stateless_persons');
          accumulation.totalRefugees += parseCount(statistic, 'refugees');
          accumulation.totalAsylumSeekers += parseCount(statistic, 'asylum_seekers');
        });

        const statisticsPerOriginList = Object.values(statisticsPerOrigin);
        // Sort by totalRefugees
        statisticsPerOriginList.sort((accumulationA, accumulationB) => {
          return accumulationB.totalRefugees - accumulationA.totalRefugees;
        });

        function totalAcrossCountries(key) {
          return statisticsPerOriginList.reduce((total, accumulation) => {
            return total + accumulation[key];
          }, 0);
        }

        return {
          year,
          totalInternallyDisplaced: totalAcrossCountries('totalInternallyDisplaced'),
          totalStateless: totalAcrossCountries('totalStateless'),
          totalRefugees: totalAcrossCountries('totalRefugees'),
          totalAsylumSeekers: totalAcrossCountries('totalAsylumSeekers'),
          topCountries: statisticsPerOriginList.slice(0, topCountryCount)
        };
      });
    });
    return Promise.all(promisedYears);
  },
  personsPerContries: (year) => {
    const result = {};
    return unhcr.request('persons_of_concern.json?year=' + year)
    .then((statistics) => {
      if(statistics.length === 0) {
        console.warn('The API has no personsPerContries data for ' + year);
      }
      return statistics;
    });
  },
  request: (path) => {
    return request({
      url: BASE_URL + path,
      json: true
    });
  }
};

module.exports = unhcr;
