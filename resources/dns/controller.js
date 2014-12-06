'use strict';

module.exports = function() {
  var controller = {};

  controller.list = function(req) {
    req.log.info({'dns.list': '*', 'uuid': req._uuid});
  };

  controller.get = function(req) {
    req.log.info({'dns.get': req.params.service, 'uuid': req._uuid});
  };

  return controller;
};
