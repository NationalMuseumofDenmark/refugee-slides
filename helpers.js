const _ = require('lodash');

const moment = require('moment');
moment.locale('da');

var IntlPolyfill = require('intl');
Intl.NumberFormat   = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const danishNumbers = new Intl.NumberFormat('da-DK');
const translations = require('./translations');

let helpers = {
  moment,
  formatNumber: (number) => {
    return danishNumbers.format(number);
  },
  translate: (key, language) => {
    if(language in translations) {
      return _.get(translations[language], key, key);
    } else {
      throw new Error('Missing translations in language: ', language);
    }
  }
};

module.exports = helpers;
