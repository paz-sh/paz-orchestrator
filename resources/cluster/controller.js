'use strict';

module.exports = function(cfg) {
  var controller = {};
  var machinesWatcher = cfg.machinesWatcher;

  controller.get = function(req, res) {
    req.log.info({'cluster.get': req.params.name, 'uuid': req._uuid});
    var machines = machinesWatcher.getState();

    req.log.info({'machines': machines});
    res.send(200, {hostCount: Object.keys(machines).length});
  };

  return controller;
};
