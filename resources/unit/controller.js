'use strict';

var transformRawUnit = require('../../lib/unit-transform.js');
var shouldSendUnit = require('../../lib/check-unit.js');

module.exports = function(cfg) {
  var controller = {};
  var unitsWatcher = cfg.unitsWatcher;

  function unitsObjToArray(units) {
    var arr = [];
    Object.keys(units).forEach(function(key) {
      arr.push(transformRawUnit(units[key], key));
    });
    return arr;
  }

  controller.list = function(req, res) {
    req.log.info({'units.list': '*', 'uuid': req._uuid});
    var state = unitsObjToArray(unitsWatcher.getState());
    var resArr = [];

    for (var i in state) {
      if (shouldSendUnit(state[i].name, req.query)) {
        resArr.push(state[i]);
      }
    }

    res.send(200, resArr);
  };

  controller.get = function(req, res) {
    req.log.info({'units.get': req.params.id, 'uuid': req._uuid});
    var state = unitsWatcher.getState();

    var name = req.params.id + '.service';

    var unit = state[name];

    if (unit) {
      res.send(200, transformRawUnit(unit, name));
    } else {
      res.send(404);
    }
  };

  controller.health = function(req, res) {
    req.log.info({'units.health': req.params.id, 'uuid': req._uuid});
    var state = unitsWatcher.getState();
    var unit = state[req.params.id + '.service'];
    res.send(200, {healthy: !!unit});
  };

  return controller;
};
