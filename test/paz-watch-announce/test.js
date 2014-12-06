'use strict';

/* eslint-disable no-unused-expressions */

var Lab = require('lab');
var Etcd = require('node-etcd');
var Watcher = require('../../lib/paz-watch-announce');

var host = process.env.DOCKER_IP || 'localhost';

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var etcd = new Etcd(host, 4001);
var watcher = new Watcher({'etcd-endpoint': host + ':4001'});

lab.experiment('Paz Watch Announce', function() {
  lab.before(function(done) {
    etcd.mkdir('paz/services', function(err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });

  lab.before(function(done) {
    etcd.mkdir('paz/services/myservice/1.0.1', function(err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });

  lab.test('Adding a unit results in that unit being present in the current state', function(done) {
    etcd.set('paz/services/myservice/1.0.1/1', '172.17.8.101:8080', function(err) {
      if (err) {
        return done(err);
      }

      function greatExpectations() {
        var state = watcher.getState();

        expect(state.myservice);
        expect(state.myservice['1.0.1']);
        expect(state.myservice['1.0.1']['1']).to.equal('172.17.8.101:8080');

        done();
      }

      setTimeout(greatExpectations, 1000);
    });
  });

  lab.test('Updating a unit results in the changes being present in the current state', function(done) {
    etcd.set('paz/services/myservice/1.0.1/1', '172.17.8.102:8080', function(err) {
      if (err) {
        return done(err);
      }

      function greatExpectations() {
        var state = watcher.getState();

        expect(state.myservice);
        expect(state.myservice['1.0.1']);
        expect(state.myservice['1.0.1']['1']).to.equal('172.17.8.102:8080');

        done();
      }

      setTimeout(greatExpectations, 1000);
    });
  });

  lab.test('Removing a unit results in the unit not being present in the current state', function(done) {
    etcd.del('paz/services/myservice/1.0.1/1', function(err) {
      if (err) {
        return done(err);
      }

      function greatExpectations() {
        var state = watcher.getState();

        expect(state.myservice['1.0.1']['1']).to.not.be.ok;

        done();
      }

      setTimeout(greatExpectations, 1000);
    });
  });

  lab.after(function(done) {
    etcd.rmdir('paz/services', {recursive: true}, function(err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });
});
