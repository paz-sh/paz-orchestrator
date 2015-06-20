'use strict';

var shouldSendUnit = require('../../lib/check-unit.js');

module.exports = {
  hostsObjToArray: function(hosts) {
    var arr = [];
    Object.keys(hosts).forEach(function(key) {
      arr.push(hosts[key]);
    });
    return arr;
  },
  addUnitsArray: function(units, host, query) {
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
};
