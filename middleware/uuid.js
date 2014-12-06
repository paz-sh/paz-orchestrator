'use strict';

module.exports = function(req, res, next) {
  var uuid = (~~(Math.random() * 1e9)).toString(36);
  res.setHeader('x-api-uuid', uuid);
  res._uuid = uuid;
  req._uuid = uuid;
  next();
};
