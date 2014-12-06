'use strict';

module.exports = function() {
  var controller = {};

  controller.list = function(req) {
    req.log.info({'loadBalancers.list': '*', 'uuid': req._uuid});
  };

  controller.get = function(req) {
    req.log.info({'loadBalancers.get': req.params.id, 'uuid': req._uuid});
  };

  controller.health = function(req, res) {
    req.log.info({'loadBalancers.health': req.params.id, 'uuid': req._uuid});
    res.send({healthy: true});
  };

  return controller;
};
