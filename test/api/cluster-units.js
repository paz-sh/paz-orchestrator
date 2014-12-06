'use strict';

/* eslint-disable no-unused-expressions */

var Lab = require('lab');
var Etcd = require('node-etcd');
var supertest = require('supertest');
var unit = require('../fixtures/etcd.json').unit;

var host = process.env.DOCKER_IP || 'localhost';
var orchestratorPort = process.env.ORCHESTRATOR_PORT || 9000;
var orchestratorPath = ['http://', host, ':', orchestratorPort].join('');

var lab = exports.lab = Lab.script();
var expect = Lab.expect;
var etcd = new Etcd(host, 4001);
var orchestrator = supertest(orchestratorPath);

lab.experiment('Cluster Units', function() {
  lab.before(function(done) {
    etcd.mkdir('_coreos.com/fleet/state', function(err) {
      if (err && err.errorCode && err.errorCode !== 102) {
        done(err);
      }

      done();
    });
  });

  lab.before(function(done) {
    etcd.set('_coreos.com/fleet/state/myservice-1-1.service', JSON.stringify(unit), function(err) {
      if (err) {
        done(err);
      }

      setTimeout(done, 1000);
    });
  });

  lab.test('GET /cluster/units responds with list of units', function(done) {
    orchestrator
      .get('/cluster/units')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var units = res.body;

        expect(units).to.be.instanceOf(Array);
        expect(units.length).to.equal(1);

        done();
      });
  });

  lab.test('GET /cluster/units/:id responds with correct unit', function(done) {
    orchestrator
      .get('/cluster/units/myservice-1-1')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var remoteUnit = res.body;

        expect(remoteUnit).to.have.property('name')
          .and.to.equal('myservice-1-1');
        expect(remoteUnit).to.have.property('service')
          .and.to.equal('myservice');
        expect(remoteUnit).to.have.property('version')
          .and.to.equal(1);
        expect(remoteUnit).to.have.property('instance')
          .and.to.equal(1);

        expect(remoteUnit).to.have.property('activeState');
        expect(remoteUnit).to.have.property('loadState');
        expect(remoteUnit).to.have.property('machineState');
        expect(remoteUnit).to.have.property('subState');

        done();
      });
  });

  lab.test('GET /cluster/units/myservice/health responds with valid health', function(done) {
    orchestrator
      .get('/cluster/units/myservice-1-1/health')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var doc = res.body;

        expect(doc).to.have.property('healthy')
          .and.to.be.true;

        done();
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
