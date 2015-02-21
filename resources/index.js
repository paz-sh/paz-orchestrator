'use strict';

module.exports = function(cfg) {
  return {
    /* eslint-disable key-spacing */
    cluster:      require('./cluster/controller')(cfg),
    host:         require('./host/controller')(cfg),
    unit:         require('./unit/controller')(cfg),
    service:      require('./service/controller')(cfg),
    loadBalancer: require('./loadBalancer/controller')(cfg),
    dns:          require('./dns/controller')(cfg)
    /* eslint-enable key-spacing */
  };
};
