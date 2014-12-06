'use strict';

var version = require('../package.json').version;

module.exports = function(req, res, next) {
  res.setHeader('x-api-version', version);

  res._apiVersion = version;
  req._apiVersion = version;

  next();
};
