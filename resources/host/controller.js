'use strict';

var helper = require('./helper.js');

module.exports = function(cfg) {
  var controller = {};
  var machinesWatcher = cfg.machinesWatcher;
  var unitsWatcher = cfg.unitsWatcher;

  controller.list = function(req, res) {
    req.log.info({'hosts.list': '*', 'uuid': req._uuid});

    var state = helper.hostsObjToArray(machinesWatcher.getState());

    var units = unitsWatcher.getState();
    for (var m = 0; m < state.length; m++) {
      state[m] = helper.addUnitsArray(units, state[m], req.query);
    }

    res.send(200, state);
  };

  controller.get = function(req, res) {
    req.log.info({'hosts.get': req.params.id, 'uuid': req._uuid});
    var state = machinesWatcher.getState();

    req.log.info({'state': state});
    var units = unitsWatcher.getState();
    var host = helper.addUnitsArray(units, state[req.params.id]);

    if (host) {
      res.send(200, host);
    } else {
      res.send(404);
    }
  };

  controller.health = function(req, res) {
    req.log.info({'hosts.health': req.params.id, 'uuid': req._uuid});
    var state = machinesWatcher.getState();
    var host = state[req.params.id];
    res.send(200, {healthy: !!host});
  };

  return controller;
};
