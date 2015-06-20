'use strict';

var Lab = require('lab');

var helper = require('../../resources/host/helper');
var lab = exports.lab = Lab.script();
var expect = Lab.expect;

lab.experiment('helper.hostsObjToArray', function () {
  lab.test('returns an array', function (done) {
    var obj = {
      wow: {
        obj: 1
      },
      ooh: {
        obj: 2
      }
    };
    var state = helper.hostsObjToArray(obj);
    expect(state).to.be.instanceOf(Array);
    done();
  });

  lab.test('results array length is correct', function (done) {
    var obj = {
      wow: {
        obj: 1
      },
      ooh: {
        obj: 2
      }
    };
    var state = helper.hostsObjToArray(obj);
    expect(state.length).to.equal(2);
    done();
  });

  lab.test('results objects are unmolested', function (done) {
    var obj = {
      wow: {
        obj: 1
      },
      ooh: {
        obj: 2
      }
    };
    var state = helper.hostsObjToArray(obj);
    expect(state[0].obj).to.equal(1);
    expect(state[1].obj).to.equal(2);
    done();
  });
});

lab.experiment('addUnitsArray', function () {
  // XXX TODO
});
