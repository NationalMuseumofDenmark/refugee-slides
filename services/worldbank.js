const request = require('request-promise');
const querystring = require('querystring');

const common = require('./common');

const BASE_URL = 'http://api.worldbank.org/';

const worldbank = {
  totalPopulation: (countryCode, fromYear, toYear) => {
    const path = 'countries/' + countryCode + '/indicators/SP.POP.TOTL';
    return worldbank.request(path, {
      format: 'json',
      date: fromYear + ':' + toYear
    });
  },
  request: (path, parameters) => {
    return common.request(BASE_URL, path, parameters);
  }
};

module.exports = worldbank;
