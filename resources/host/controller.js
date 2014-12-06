'use strict';

var shouldSendUnit = require('../../lib/check-unit.js');

module.exports = function(cfg) {
  var controller = {};
  var machinesWatcher = cfg.machinesWatcher;
  var unitsWatcher = cfg.unitsWatcher;

  function hostsObjToArray(hosts) {
    var arr = [];
    Object.keys(hosts).forEach(function(key) {
      arr.push(hosts[key]);
    });
    return arr;
  }

  function addUnitsArray(host, query) {
    var units = unitsWatcher.getState();

    host.units = [];

    for (var key in units) {
      if (units.hasOwnProperty(key)) {

        if (!shouldSendUnit(key, query)) {
          delete units[key];
        } else {
          if (units[key].machineState.ID === host.ID) {
            host.units.push(key.substr(0, key.lastIndexOf('.')));
          }
        }
      }
    }

    return host;
  }

  controller.list = function(req, res) {
    req.log.info({'hosts.list': '*', 'uuid': req._uuid});

    var state = hostsObjToArray(machinesWatcher.getState());

    for (var m = 0; m < state.length; m++) {
      state[m] = addUnitsArray(state[m], req.query);
    }

    res.send(200, state);
  };

  controller.get = function(req, res) {
    req.log.info({'hosts.get': req.params.id, 'uuid': req._uuid});
    var state = machinesWatcher.getState();

    req.log.info({'state': state});
    var host = addUnitsArray(state[req.params.id]);

    if (host) {
      res.send(200, host);
    }
    else {
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
