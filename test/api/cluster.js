'use strict';

/* eslint-disable no-unused-expressions */

var Lab = require('lab');
var Etcd = require('node-etcd');
var supertest = require('supertest');
var fixtures = require('../fixtures/etcd.json');

var host = process.env.DOCKER_IP || 'localhost';
var orchestratorPort = process.env.ORCHESTRATOR_PORT || 9000;
var orchestratorPath = ['http://', host, ':', orchestratorPort].join('');

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var etcd = new Etcd(host, 4001);
var orchestrator = supertest(orchestratorPath);
var machine = fixtures.host;

lab.experiment('Cluster Hosts', function() {
  lab.before(function(done) {
    etcd.mkdir('_coreos.com/fleet/machines', function(err) {
      if (err && err.errorCode && err.errorCode !== 102) {
        done(err);
      }

      done();
    });
  });

  lab.before(function(done) {
    etcd.mkdir('_coreos.com/fleet/machines/' + machine.ID, function(err) {
      if (err && err.errorCode && err.errorCode !== 102) {
        done(err);
      }

      done();
    });
  });

  lab.before(function(done) {
    etcd.set('_coreos.com/fleet/machines/' + machine.ID + '/object', JSON.stringify(machine), function(err) {
      if (err) {
        done(err);
      }

      setTimeout(done, 1000);
    });
  });

  lab.test('GET /cluster returns a document with a truthy hostCount', function(done) {
    orchestrator
      .get('/cluster')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var doc = res.body;

        expect(doc).to.be.an('object');
        expect(doc.hostCount).to.equal(1);

        done();
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
