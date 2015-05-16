'use strict';

/* eslint-disable no-unused-expressions */

var Lab = require('lab');
var Etcd = require('node-etcd');
var Watcher = require('../../lib/fleet-watch-units');
var fixtures = require('../fixtures/etcd.json');

var host = process.env.DOCKER_IP || 'localhost';

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var etcd = new Etcd(host, 4001);
var watcher = new Watcher({'etcd-endpoint': host + ':4001'});
var unit = fixtures.unit;

lab.experiment('Fleet Watch Units', function() {
  lab.before(function(done) {
    etcd.mkdir('_coreos.com/fleet/state', function(err) {
      if (err) {
        done(err);
      }

      done();
    });
  });

  lab.test('Adding a unit results in that unit being present in the current state', function(done) {
    etcd.set('_coreos.com/fleet/state/myservice.service', JSON.stringify(unit), function(err) {
      if (err) {
        done(err);
      }

      function greatExpectations() {
        var state = watcher.getState();

        expect(state['myservice.service']).to.be.ok;
        expect(state['myservice.service'].machineState).to.be.ok;
        expect(state['myservice.service'].loadState).to.equal('loaded');
        expect(state['myservice.service'].activeState).to.equal('active');
        expect(state['myservice.service'].subState).to.equal('running');

        done();
      }

      setTimeout(greatExpectations, 1000);
    });
  });

  lab.test('Updating a unit results in the changes being present in the current state', function(done) {
    unit.activeState = 'inactive';
    unit.subState = 'dead';
    etcd.set('_coreos.com/fleet/state/myservice.service', JSON.stringify(unit), function(err) {
      if (err) {
        done(err);
      }

      function greatExpectations() {
        var state = watcher.getState();

        expect(state['myservice.service']).to.be.ok;
        expect(state['myservice.service'].machineState).to.be.ok;
        expect(state['myservice.service'].loadState).to.equal('loaded');
        expect(state['myservice.service'].activeState).to.equal('inactive');
        expect(state['myservice.service'].subState).to.equal('dead');

        done();
      }

      setTimeout(greatExpectations, 1000);
    });
  });

  lab.test('Removing a unit results in the unit not being present in the current state', function(done) {
    etcd.del('_coreos.com/fleet/state/myservice.service', function(err) {
      if (err) {
        done(err);
      }

      function greatExpectations() {
        var state = watcher.getState();

        expect(state['myservice.service']).to.not.be.ok;

        done();
      }

      setTimeout(greatExpectations, 1000);
    });

  });

  lab.after(function(done) {
    etcd.rmdir('_coreos.com/fleet/state', {recursive: true}, function(err) {
      if (err) {
        done(err);
      }

      done();
    });
  });
});
