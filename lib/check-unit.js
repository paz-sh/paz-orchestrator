'use strict';

// Decides whether to send a unit based on querystring
function shouldSendUnit(name, query) {
  /* eslint-disable no-multi-spaces */
  var includeSysUnits      = query ? (query.includeSystemUnits   === 'true') : false;
  var includeAnnouncers    = query ? (query.includeAnnouncers    === 'true') : false;
  var includeLoadbalancers = query ? (query.includeLoadbalancers === 'true') : false;
  /* eslint-enable no-multi-spaces */

  if (!includeSysUnits && name.match(/^paz\-*/)) {
    return false;
  }

  if (!includeAnnouncers && name.match(/\-announce/)) {
    return false;
  }

  if (!includeLoadbalancers && name.match(/\-loadbalancer/)) {
    return false;
  }

  return true;
}

module.exports = shouldSendUnit;
