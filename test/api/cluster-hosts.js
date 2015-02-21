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
        return done(err);
      }

      done();
    });
  });

  lab.before(function(done) {
    etcd.mkdir('_coreos.com/fleet/machines/' + machine.ID, function(err) {
      if (err && err.errorCode && err.errorCode !== 102) {
        return done(err);
      }

      done();
    });
  });

  lab.before(function(done) {
    etcd.set('_coreos.com/fleet/machines/' + machine.ID + '/object', JSON.stringify(machine), function(err) {
      if (err) {
        return done(err);
      }

      setTimeout(done, 1000);
    });
  });

  lab.test('GET /cluster/hosts returns an array', function(done) {
    orchestrator
      .get('/cluster/hosts')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        var machines = res.body;

        expect(machines).to.be.instanceOf(Array);
        expect(machines.length).to.equal(1);

        done();
      });
  });

  lab.test('GET /cluster/hosts/:id returns correct host document', function(done) {
    orchestrator
      .get('/cluster/hosts/' + machine.ID)
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        var hostDoc = res.body;

        expect(hostDoc).to.have.property('ID')
          .and.equal(machine.ID);
        expect(hostDoc).to.have.property('PublicIP')
          .and.equal(machine.PublicIP);
        expect(hostDoc).to.have.property('Version')
          .and.equal(machine.Version);
        expect(hostDoc).to.have.property('TotalResources')
          .and.deep.equal(machine.TotalResources);
        expect(hostDoc).to.have.property('units')
          .and.to.be.instanceOf(Array);
        expect(hostDoc).to.have.property('Metadata');

        done();
      });
  });

  lab.test('GET /cluster/hosts/:id/health returns a document with healthy property', function(done) {
    orchestrator
      .get('/cluster/hosts/' + machine.ID + '/health')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          return done(err);
        }

        var doc = res.body;

        expect(doc).to.be.an('object');
        expect(doc).to.have.property('healthy')
          .and.to.be.true;

        done();
      });
  });

  lab.after(function(done) {
    etcd.rmdir('_coreos.com/fleet/machines', {recursive: true}, function(err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });
});
