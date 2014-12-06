'use strict';

/* eslint-disable no-unused-expressions */

var Lab = require('lab');
var Etcd = require('node-etcd');
var Watcher = require('../../lib/fleet-watch-machines');
var fixtures = require('../fixtures/etcd.json');

var host = process.env.DOCKER_IP || 'localhost';

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var etcd = new Etcd(host, 4001);
var machine = fixtures.host;
var watcher = new Watcher({'etcd-endpoint': host + ':4001'});

lab.experiment('Fleet Watch Machines', function() {
  lab.before(function(done) {
    etcd.mkdir('_coreos.com/fleet/machines', function(err) {
      if (err) {
        done(err);
      }

      done();
    });
  });

  lab.before(function(done) {
    etcd.mkdir('_coreos.com/fleet/machines/' + machine.ID, function(err) {
      if (err) {
        done(err);
      }

      done();

    });

  });

  lab.before(function(done) {
    etcd.set('_coreos.com/fleet/machines/' + machine.ID  + '/object', JSON.stringify(machine), function(err) {
      if (err) {
        done(err);
      }

      setTimeout(done, 1000);
    });
  });

  lab.test('Adding a machine results in that machine being present in the current state', function(done) {
    var state = watcher.getState();
    var ID = machine.ID;

    expect(state).to.have.property(ID);
    expect(state[ID]).to.have.property('ID');
    expect(state[ID]).to.have.property('PublicIP').and.to.equal('172.17.8.101');

    done();
  });

  lab.test('Updating a machine results in the changes being present in the current state', function(done) {
    machine.PublicIP = '172.17.8.102';

    etcd.set('_coreos.com/fleet/machines/' + machine.ID  + '/object', JSON.stringify(machine), function(err) {
      if (err) {
        done(err);
      }

      function greatExpectations() {
        var state = watcher.getState();
        var ID = machine.ID;

        expect(state).to.have.property(ID);
        expect(state[ID]).to.have.property('ID');
        expect(state[ID]).to.have.property('PublicIP').and.to.equal('172.17.8.102');

        done();
      }

      setTimeout(greatExpectations, 1000);
    });
  });

  lab.test('Removing a machine results in the machine not being present in the current state', function(done) {
    etcd.del('_coreos.com/fleet/machines/' + machine.ID  + '/object',
        function(err) {
          if (err) {
            done(err);
          }

          function greatExpectations() {
            var state = watcher.getState();
            var ID = machine.ID;

            expect(state).not.to.have.property(ID);

            done();
          }

          setTimeout(greatExpectations, 1000);
        });
  });

  lab.after(function(done) {
    etcd.rmdir('_coreos.com/fleet/machines', {recursive: true}, function(err) {
      if (err) {
        done(err);
      }

      done();
    });
  });
});
