const request = require('request-promise');
const querystring = require('querystring');
const _ = require('lodash');

function removeUndefined(originalObj) {
  const obj = _.clone(originalObj);
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
  return obj;
}

module.exports = {
  request: (BASE_URL, path, parameters) => {
    let url = BASE_URL + path;
    if(parameters) {
      parameters = removeUndefined(parameters);
      url += '?' + querystring.stringify(parameters);
    }
    return request({
      url,
      json: true
    });
  }
};
