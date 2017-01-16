const request = require('request-promise');
const querystring = require('querystring');
const _ = require('lodash');

const common = require('./common');

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
    },
    monthlyArrivalsByLocation: () => {
      return unhcr.request('mediterranean/monthly_arrivals_by_location.json');
    },
    deathsByYear: () => {
      return unhcr.request('mediterranean/deaths.json');
    },
    arrivalsByYear: () => {
      return unhcr.request('mediterranean/arrivals_by_year.json');
    },
    deathsAndArrivalsByYear: () => {
      return Promise.all([
        unhcr.mediterranean.deathsByYear(),
        unhcr.mediterranean.arrivalsByYear()
      ]).then(results => {
        const [ deaths, arrivals ] = results;
        const result = {};
        const structure = {
          deaths: 0,
          arrivals: 0
        };
        // Loop though both of them
        deaths.forEach(deathsStatistic => {
          const thatYear = getOrCreate(result, deathsStatistic.year, structure);
          thatYear.deaths = deathsStatistic.value;
        });
        arrivals.forEach(arrivalsStatistic => {
          const thatYear = getOrCreate(result, arrivalsStatistic.year, structure);
          thatYear.arrivals = arrivalsStatistic.value;
        });
        return result;
      });
    },
    arrivalsPerYearMonthLocation: () => {
      return unhcr.mediterranean.monthlyArrivalsByLocation()
      .then(arrivals => {
        const arrivalsPerYear = {};
        arrivals.forEach(arrival => {
          arrivalsThisYear = getOrCreate(arrivalsPerYear, arrival.year, {});
          arrivalsThisMonth = getOrCreate(arrivalsThisYear, arrival.month, {
            locations: [],
            countries: {},
            total: 0
          });
          arrivalsThisMonth.locations.push(arrival);
          // Create an accumulation on the country level
          arrivalsThisMonthAndCountry = getOrCreate(arrivalsThisMonth.countries, arrival.country, {
            value: 0
          });
          arrivalsThisMonthAndCountry.value += arrival.value;
          // Calculate a grand total this month
          arrivalsThisMonth.total += arrival.value;
        });
        return arrivalsPerYear;
      });
    },
  },
  refugeesPerYearAndContries: (parameters) => {
    if(!parameters.years || parameters.years.length === 0) {
      throw new Error('Missing the years parameter');
    }
    const promisedYears = parameters.years.map(year => {
      return unhcr.personsPerContries({
        year,
        'country_of_origin': parameters.origin
      })
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
            totalCombined: 0,
            perResidence: {},
            origin
          });
          const internallyDisplaced = parseCount(statistic, 'idps');
          const stateless = parseCount(statistic, 'stateless_persons');
          const refugees = parseCount(statistic, 'refugees');
          const asylumSeekers = parseCount(statistic, 'asylum_seekers');

          accumulation.totalInternallyDisplaced += internallyDisplaced;
          accumulation.totalStateless += stateless;
          accumulation.totalRefugees += refugees;
          accumulation.totalAsylumSeekers += asylumSeekers;

          accumulation.totalCombined += internallyDisplaced;
          accumulation.totalCombined += stateless;
          accumulation.totalCombined += refugees;
          accumulation.totalCombined += asylumSeekers;
        });

        const statisticsPerOriginList = Object.values(statisticsPerOrigin);
        // Sort by totalCombined
        statisticsPerOriginList.sort((accumulationA, accumulationB) => {
          return accumulationB.totalCombined - accumulationA.totalCombined;
        });

        function totalAcrossCountries(key) {
          return statisticsPerOriginList.reduce((total, accumulation) => {
            return total + accumulation[key];
          }, 0);
        }

        const result = {
          year,
          totalInternallyDisplaced: totalAcrossCountries('totalInternallyDisplaced'),
          totalStateless: totalAcrossCountries('totalStateless'),
          totalRefugees: totalAcrossCountries('totalRefugees'),
          totalAsylumSeekers: totalAcrossCountries('totalAsylumSeekers'),
          totalCombined: totalAcrossCountries('totalCombined')
        };

        // Now - filter out any XX* countries
        const statisticsPerCountry = statisticsPerOriginList
        .filter(accumulation => {
          return accumulation.origin.indexOf('XX') !== 0;
        });

        if(parameters.topCountryCount) {
          result.topCountries = statisticsPerCountry.slice(0, parameters.topCountryCount);
        }

        return result;
      });
    });
  },
  personsPerContries: (parameters) => {
    return unhcr.request('persons_of_concern.json', parameters)
    .then((statistics) => {
      if(statistics.length === 0) {
        console.warn('The API has no personsPerContries data for ' + year);
      }
      return statistics;
    });
  },
  timeSeriesYears: () => {
    return unhcr.request('time_series_years.json');
  },
  request: (path, parameters) => {
    return common.request(BASE_URL, path, parameters);
  }
};

module.exports = unhcr;
