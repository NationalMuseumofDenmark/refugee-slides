const moment = require('moment');
moment.locale('da');

var IntlPolyfill = require('intl');
Intl.NumberFormat   = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const danishNumbers = new Intl.NumberFormat('da-DK');

let helpers = {
  moment,
  formatNumber: (number) => {
    return danishNumbers.format(number);
  }
};

module.exports = helpers;
