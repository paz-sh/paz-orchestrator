'use strict';

module.exports = function(api, cfg) {
  var r = require('../resources')(cfg);

  //
  // cluster
  //
  api.get('/cluster',                                 r.cluster.get);

  //
  // hosts
  //
  api.get('/cluster/hosts',                           r.host.list);
  api.get('/cluster/hosts/:id',                       r.host.get);
  api.get('/cluster/hosts/:id/health',                r.host.health);

  //
  // units
  //
  api.get('/cluster/units',                           r.unit.list);
  api.get('/cluster/units/:id',                       r.unit.get);
  api.get('/cluster/units/:id/health',                r.unit.health);

  //
  // services
  //
  api.get('/services',                               r.service.list);
  api.post('/services',                              r.service.create);
  api.get('/services/:name',                         r.service.get);
  api.del('/services/:name',                         r.service.del);
  api.get('/services/:name/config/last',             r.service.configLast);
  api.get('/services/:name/config/next',             r.service.configNext);
  api.patch('/services/:name/config/next',           r.service.modifyConfig);
  api.get('/services/:name/config/history',          r.service.configHistory);
  api.get('/services/:name/config/history/:version',
    r.service.configHistoryVersion);
  api.get('/services/:name/units',                   r.service.units);
  api.get('/services/:name/units/:id',               r.service.unitsGet);
  api.get('/services/:name/units/:id/health',        r.service.unitsHealth);

  //
  // load balancers
  //
  api.get('/cluster/load-balancers',                  r.loadBalancer.list);
  api.get('/cluster/load-balancers/:id',              r.loadBalancer.get);
  api.get('/cluster/load-balancers/:id/health',       r.loadBalancer.health);

  //
  // dns
  //
  api.get('/cluster/dns',                             r.dns.list);
  api.get('/cluster/dns/:service',                    r.dns.get);
};
