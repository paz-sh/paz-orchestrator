'use strict';

module.exports = function(req, res, next) {
  req.log.info({
    req: {
      method: req.method,
      url: req.url
    },
    res: res,
    uuid: req._uuid
  });
  next();
};
