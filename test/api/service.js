'use strict';

/* eslint-disable no-unused-expressions */

var supertest = require('supertest');
var Lab = require('lab');

var fixtures = require('../fixtures/services.json');

var lab = exports.lab = Lab.script();
var expect = Lab.expect;

var host = process.env.DOCKER_IP || 'localhost';
var schedulerPort = process.env.SCHEDULER_PORT || 9002;

var orchestratorPort = process.env.ORCHESTRATOR_PORT || 9000;

var orchestratorPath = ['http://', host, ':', orchestratorPort].join('');
var schedulerPath    = ['http://', host, ':', schedulerPort].join('');

var scheduler = supertest(schedulerPath);
var orchestrator = supertest(orchestratorPath);

lab.experiment('Undeployed Service', function() {
  lab.test('GET /services returns a document with a services array', function(done) {
    orchestrator
      .get('/services')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var doc = res.body;

        expect(typeof doc).to.be.equal('object');
        expect(doc.doc).to.be.ok;
        expect(doc.doc).to.be.instanceOf(Array);

        done();
      });
  });

  lab.test('POST to /services returns a 201', function(done) {
    orchestrator
      .post('/services')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send(fixtures['my-service'])
      .expect('Content-Type', 'application/json')
      .expect(201)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var doc = res.body.doc;

        expect(doc.name).to.be.ok;
        expect(doc.description).to.be.ok;
        expect(doc.dockerRepository).to.be.ok;
        expect(doc.config).to.be.ok;
        expect(doc.config.publicFacing).to.be.true;

        done();
      });
  });

  lab.test('POST to /services of invalid data returns a 400', function(done) {
    orchestrator
      .post('/services')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(fixtures['invalid-service'])
      .expect(400)
      .end(function(err) {
        if (err) {
          done(err);
        }

        done();
      });
  });

  lab.test('GET /services returns an array that includes the newly created service', function(done) {
    orchestrator
      .get('/services')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var doc = res.body;

        expect(typeof doc).to.equal('object');
        expect(doc).to.have.property('doc');
        expect(doc.doc).to.be.instanceOf(Array);

        var found = doc.doc.some(function(service) {
          return (service.name === 'my-service');
        });

        expect(found).to.be.true;

        done();
      });
  });

  lab.test('GET /services/:id for the newly created service returns the service document', function(done) {
    orchestrator
      .get('/services/my-service')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var doc = res.body;

        expect(typeof doc).to.equal('object');
        expect(doc).to.have.property('doc');

        done();
      });
  });

  lab.test('GET /services/:id for a non-existant service returns a 404', function(done) {
    orchestrator
      .get('/services/foobar')
      .set('Accept', 'application/json')
      .expect(404)
      .end(function(err) {
        if (err) {
          done(err);
        }

        done();
      });
  });

  lab.test('GET /services/:id/config/last for the newly created service that hasn\'t yet been deployed returns a 404', function(done) {
    orchestrator
      .get('/services/my-service/config/last')
      .set('Accept', 'application/json')
      .expect(404)
      .end(function(err) {
        if (err) {
          done(err);
        }

        done();
      });
  });

  lab.test('DELETE /services/:id for newly created service returns 204', function(done) {
    orchestrator
      .delete('/services/my-service')
      .expect(204)
      .end(function(err) {
        if (err) {
          done(err);
        }

        done();
      });
  });
});

lab.experiment('Deployed Service', function() {
  lab.before(function(done) {
    orchestrator
      .post('/services')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .send(fixtures['my-service'])
      .expect('Content-Type', 'application/json')
      .expect(201)
      .end(function(err) {
        if (err) {
          done(err);
        }

        done();
      });
  });

  lab.before(function(done) {
    scheduler
      .post('/hooks/deploy')
      .set('Accept', 'application/json')
      .send(fixtures['deploy-my-service'])
      .expect(200)
      .end(function(err) {
        if (err) {
          done(err);
        }

        setTimeout(done, 3000);
      });
  });

  lab.test('GET /services/:id/config/last for the newly created service returns the service config', function(done) {
    orchestrator
      .get('/services/my-service/config/last')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var config = res.body.doc;

        expect(config.publicFacing).to.be.true;
        expect(config).to.have.property('ports');
        expect(config).to.have.property('ports');
        expect(config).to.have.property('numInstances');

        done();
      });
  });
  lab.test('GET /services/:id/config/next for the newly created service returns the service config', function(done) {
    orchestrator
      .get('/services/my-service/config/next')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var config = res.body.doc;

        expect(config.publicFacing).to.be.true;
        expect(config).to.have.property('ports');
        expect(config).to.have.property('ports');
        expect(config).to.have.property('numInstances');

        done();
      });
  });
  lab.test('PATCH /services/:id/config/next returns config object that was modified', function(done) {
    orchestrator
      .patch('/services/my-service/config/next')
      .set('Accept', 'application/json')
      .send({
        publicFacing: false
      })
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var config = res.body.doc;

        expect(config.publicFacing).to.be.false;

        done();
      });
  });

  lab.test('GET /services/:id/config/history for the newly created service returns a version list with configs', function(done) {
    orchestrator
      .get('/services/my-service/config/history')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var history = res.body.doc;

        expect(history['1']).to.be.ok;
        expect(history['1'].publicFacing).to.be.true;
        expect(history['1']).to.have.property('ports');
        expect(history['1']).to.have.property('ports');
        expect(history['1']).to.have.property('numInstances');

        done();
      });
  });

  lab.test('GET /services/:id/config/history/:version returns the expected version\'s config', function(done) {
    orchestrator
      .get('/services/my-service/config/history/1')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function(err, res) {
        if (err) {
          done(err);
        }

        var config = res.body.doc;

        expect(config.publicFacing).to.be.true;

        done();
      });
  });

  lab.after(function(done) {
    orchestrator
      .delete('/services/my-service')
      .expect(204)
      .end(function(err) {
        if (err) {
          done(err);
        }

        done();
      });
  });
});
