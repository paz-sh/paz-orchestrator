'use strict';

var pkgcloud = require('pkgcloud');

function DnsState(cfg, records, dnsimple) {
  if (!(this instanceof DnsState)) {
    return new DnsState(cfg, records);
  }

  this.state = {};
  this.dnsState = {};
  this.machineState = cfg.machinesWatcher.getState;
  this.unitState = cfg.announceWatcher.getState;

  this.dnsimple = dnsimple;
  this.domain = cfg.dns.domain;
  this.logger = cfg.logger;
  this.cfg = cfg;

  records.forEach(function(record) {
    if (!this.dnsState[record.type]) {
      this.dnsState[record.type] = {};
    }
    // TODO: special case for dnsimple
    this.dnsState[record.type][record.name + ':' + record.data] = {
      id: record.id
    };
  }.bind(this));
}

DnsState.prototype.updateDnsState = function(type, name, value, id) {
  if (!this.dnsState[type]) {
    this.dnsState[type] = {};
  }
  this.dnsState[type][name + ':' + value] = {
    id: id
  };
};

DnsState.prototype.getRecordId = function(type, name, value) {
  if (this.dnsState[type] &&
      this.dnsState[type][name + ':' + value]) {
    return this.dnsState[type][name + ':' + value].id;
  }
  return false;
};

DnsState.prototype.addMachine = function(name, ip) {
  this.logger.trace({
    name: name, value: ip
  });
  var id = this.getRecordId('A', name, ip);
  if (!id) {
    this.addRecord('A', name, ip);
  }
};

DnsState.prototype.removeMachine = function(name) {
  if (this.dnsState.POOL) {
    var remove = Object.keys(this.dnsState.POOL).filter(function(el) {
      return (el.indexOf(name) > -1);
    });
    remove.forEach(function(item) {
      var key = item.split(':').shift();
      var value = item.split(':').pop();
      this.deleteRecord(this.getRecordId('POOL', key, value), 'POOL', key, value);
    }.bind(this));
  }
};

function isPublicFacingSystemUnit(name) {
  switch (name) {
    case 'paz-orchestrator':
    case 'paz-orchestrator-socket':
    case 'paz-scheduler':
    case 'paz-web':
      return true;
  }
  return false;
}

DnsState.prototype.addUnit = function(name) {
  this.cfg.svcClient.get('/services/' + name + '/config', function(err, req, res, obj) {
    if (err && err.statusCode >= 500) {
      return this.logger.error(err);
    } else if (!err && res.statusCode === 200 && obj.doc.publicFacing ||
               err && err.statusCode === 404 && isPublicFacingSystemUnit(name)) {
      this.logger.info(name, 'Setting up DNS for service');
      Object.keys(this.machineState()).forEach(function(machine) {
        machine = machine + '.' + this.domain;
        var id = this.getRecordId('POOL', name, machine);
        if (!id) {
          this.addRecord('POOL', name, machine);
        }
      }.bind(this));
    } else {
      return this.logger.warn({
        err: err, body: obj, code: res && res.statusCode ? res.statusCode || 'undefined'
      });
    }
  }.bind(this));
};

DnsState.prototype.removeUnit = function() {

};

DnsState.prototype.addRecord = function(type, name, value) {
  this.dnsimple.createRecord(this.domain, {
    type: type,
    ttl: 60,
    name: name,
    data: value
  }, function(err, record) {
    if (err) {
      return this.logger.warn(err);
    }

    this.updateDnsState(type, record.name, record.data, record.id);
    this.logger.info({
      name: record.name, value: record.data
    }, 'Adding DNS `' + type + '` record');

  }.bind(this));
};

DnsState.prototype.deleteRecord = function(id, type, name, value) {
  this.logger.info({
    name: name, value: value
  }, 'Removing DNS `A` record');
  this.dnsimple.deleteRecord(this.domain, id, function(err) {
    if (err) {
      return this.logger.warn(err, 'DNS deleteRecord failed');
    }

    delete this.dnsState[type][name + ':' + value];
  }.bind(this));
};

DnsState.prototype.populateRunning = function() {
  // add running machines
  if (this.dnsState.A) {
    var state = this.machineState();
    var a = Object.keys(state).filter(function(key) {
      return !(Object.keys(this.dnsState.A)
        .indexOf(key + ':' + this.machineState()[key].PublicIP) > -1);
    }.bind(this));
    a.forEach(function(name) {
      this.addMachine(name, state[name].PublicIP);
    }.bind(this));
  }
  // add running units
  var unitsState = this.unitState();
  Object.keys(unitsState).forEach(function(name) {
    this.addUnit(name);
  }.bind(this));
};

module.exports = function(cfg) {

  var dnsimple = pkgcloud.dns.createClient(cfg.dns);

  var domain = cfg.dns.domain;

  dnsimple.getRecords(domain, function(err, records) {
    if (err) {
      cfg.logger.error(err, 'dnsimple error');
      return;
    }

    var dnsState = new DnsState(cfg, records, dnsimple);

    cfg.machinesWatcher.on('add', function(name, data) {
      dnsState.addMachine(name, data.PublicIP);
    });

    cfg.machinesWatcher.on('remove', function(key, data) {
      dnsState.removeMachine(key, data.PublicIP);
    });

    cfg.announceWatcher.on('add', function(name) {
      dnsState.addUnit(name);
    });

    cfg.announceWatcher.on('remove', function() {
      // XXX not sure if we want to delete anything
    });

    dnsState.populateRunning();
  });

};
