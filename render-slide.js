const pug = require('pug');
const path = require('path');
const helpers = require('./helpers');

module.exports = (type, locals) => {
  const p = path.join(__dirname, 'views', 'slides', type + '.pug');
  locals.helpers = helpers;
  return pug.renderFile(p, locals);
};
