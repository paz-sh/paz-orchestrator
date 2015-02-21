'use strict';

var transformRawUnit = require('../../lib/unit-transform.js');
var shouldSendUnit = require('../../lib/check-unit.js');

module.exports = function(cfg) {
  var controller = {};
  var svcClient = cfg.svcClient;
  var schedClient = cfg.schedClient;
  var unitsWatcher = cfg.unitsWatcher;
  var io = cfg.io;

  function getUnitsArray(query) {
    var unitsObj = unitsWatcher.getState();
    var unitsArray = [];

    for (var key in unitsObj) {
      if (shouldSendUnit(key, query)) {
        unitsArray.push(transformRawUnit(unitsObj[key], key));
      }
    }

    return unitsArray;
  }

  controller.list = function(req, res) {
    req.log.info({'service.get': '*', 'uuid': req._uuid});
    svcClient.get('/services', function(err, sreq, sres, obj) {
      if (err) {
        req.log.error(err);
        res.send(err.statusCode || 500, err);
      } else {
        res.send(sres.statusCode, obj);
      }
    });
  };

  controller.create = function(req, res) {
    req.log.info({'service.create': '*', 'uuid': req._uuid});

    svcClient.post('/services', req.body, function(err, sreq, sres, obj) {
      if (err) {
        req.log.error(err);
        res.send(err.statusCode || 500, err.message);
      } else {
        if (!req.query.noEmit) {
          io.emit('service.create', req.body);
        }
        res.send(sres.statusCode, obj);
      }
    });
  };

  controller.get = function(req, res) {
    req.log.info({'service.get': req.params.name, 'uuid': req._uuid});
    svcClient.get('/services/' +
      req.params.name, function(err, sreq, sres, obj) {
        if (err) {
          req.log.error(err);
          res.send(err.statusCode || 500, err);
        } else {
          res.send(sres.statusCode, obj);
        }
      });
  };

  controller.modifyConfig = function(req, res) {
    req.log.info({'service.modifyConfig': req.params.name, 'uuid': req._uuid});
    svcClient.patch('/services/' + req.params.name + '/config',
      req.body, function(err, sreq, sres, obj) {
        if (err) {
          req.log.error(err);
          res.send(err.statusCode || 500, err.message);
        } else {
          if (!req.query.noEmit) {
            io.emit('service.modifyConfig', req.params.name, obj.doc);
          }
          res.send(sres.statusCode, obj);
        }
      });
  };

  controller.del = function(req, res) {
    req.log.info({'service.del': req.params.name, 'uuid': req._uuid});
    svcClient.del('/services/' + req.params.name,
      function(err, sreq, sres, obj) {
        if (err) {
          req.log.error(err);
          res.send(err.statusCode || 500, err.message);
        } else {
          if (!req.query.noEmit) {
            io.emit('service.del', req.params.name);
          }
          res.send(sres.statusCode, obj);
        }
      });
  };

  controller.configLast = function(req, res) {
    req.log.info({
      'service.configLast': req.params.name,
      'unit': req.params.id,
      'uuid': req._uuid
    });
    schedClient.get('/config/' + req.params.name + '/version/latest',
      function(err, sreq, sres, obj) {
        if (err) {
          req.log.error(err);
          res.send(err.statusCode, obj);
        } else {
          res.send(sres.statusCode, obj);
        }
      });
  };

  controller.configNext = function(req, res) {
    req.log.info({
      'service.configNext': req.params.name,
      'unit': req.params.id,
      'uuid': req._uuid
    });
    svcClient.get('/services/' + req.params.name + '/config',
      function(err, sreq, sres, obj) {
        if (err) {
          req.log.error(err);
          res.send(err.statusCode || 500, err);
        } else {
          res.send(sres.statusCode, obj);
        }
      });
  };

  controller.configHistory = function(req, res) {
    req.log.info({
      'service.configHistory': req.params.name,
      'unit': req.params.id,
      'uuid': req._uuid
    });
    schedClient.get('/config/' + req.params.name + '/history',
      function(err, sreq, sres, obj) {
        if (err) {
          req.log.error(err);
          res.send(err.statusCode, obj);
        } else {
          res.send(sres.statusCode, obj);
        }
      });
  };

  controller.configHistoryVersion = function(req, res) {
    req.log.info({
      'service.configHistoryVersion': req.params.name,
      'unit': req.params.id,
      'uuid': req._uuid
    });
    schedClient.get('/config/' + req.params.name + '/version/' +
      req.params.version, function(err, sreq, sres, obj) {
        if (err) {
          req.log.error(err);
          res.send(err.statusCode, obj);
        } else {
          res.send(sres.statusCode, obj);
        }
      });
  };

  controller.units = function(req, res) {
    req.log.info({'service.units': req.params.name, 'unit': req.params.id, 'uuid': req._uuid});
    var running = getUnitsArray(req.query);
    var serviceUnits = [];

    for (var u = 0; u < running.length; u++) {
      if (running[u].service === req.params.name) {
        serviceUnits.push(running[u]);
      }
    }
    res.send(200, serviceUnits);
  };

  controller.unitsGet = function(req, res) {
    req.log.info({'service.unitsGet': req.params.name, 'unit': req.params.id, 'uuid': req._uuid});

    var name = req.params.id + '.service';
    var unit = unitsWatcher.getState()[name];
    var isFromService = true;

    if (unit.service !== req.params.name) {
      isFromService = false;
    }

    if (unit && isFromService) {
      res.send(200, transformRawUnit(unit, name));
    } else {
      res.send(404, 'Unit from service not found.');
    }
  };

  controller.unitsHealth = function(req, res) {
    req.log.info({
      'service.unitsHealth': req.params.name,
      'unit': req.params.id,
      'uuid': req._uuid
    });
    res.send(200, {healthy: true});
  };

  return controller;
};
