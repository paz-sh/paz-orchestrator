'use strict';

var debug = require('debug')('fleet-watch-machines');
var override = require('json-override');
var path = require('path');
var Yoda = require('yoda');
var EventEmitter = require('events').EventEmitter;
var clone = require('lodash.clone');

module.exports = function(cfg) {
  var state = {};
  var watcher = new EventEmitter();

  function trimLeadingSlash(s) {
    if (s.charAt(0) === '/') {
      return s.substr(1);
    }
    return s;
  }

  function updateStateAdd(route, data) {
    debug('add', {route: route, data: data});
    if (!data) {
      // probably some intermediate key
      return;
    }
    var dirs = trimLeadingSlash(route).split(path.sep);
    var prev = JSON.parse(data);
    dirs.reverse().forEach(function(key) {
      if (key !== 'object') {
        var obj = Object.create(null);
        obj[key] = prev;
        prev = obj;
      }
    });
    override(state, prev);
    var key = dirs.pop();
    watcher.emit('add', key, prev[key]);
  }

  function updateStateRemove(route, data) {
    var prev = state;
    var dirs = trimLeadingSlash(route).split(path.sep);
    dirs.pop(); // discard 'object'
    var lastKey = dirs.pop();
    dirs.forEach(function(key) {
      prev = prev[key];
    });
    if (prev[lastKey]) {
      data = clone(prev[lastKey]);
    }
    watcher.emit('remove', lastKey, data);
    delete prev[lastKey];
  }

  var etcdEndpoint =
    cfg && cfg['etcd-endpoint'] ? cfg['etcd-endpoint'] : '127.0.0.1:4001';
  debug('connecting to', etcdEndpoint);
  var terms = etcdEndpoint.split(':');
  var yoda = new Yoda(terms[0], terms[1]);
  yoda.connect('/_coreos.com/fleet/machines')
    .on('add', function(route, data) {
      debug({event: 'add', route: route, data: data});
      updateStateAdd(route, data);
      debug('State is now', state);
    })
    .on('change', function(route, data) {
      debug({event: 'change', route: route, data: data});
      // don't need to do anything here
    })
    .on('remove', function(route, data) {
      debug({event: 'remove', route: route, data: data});
      updateStateRemove(route, data);
      debug('State is now', state);
    });

  watcher.getState = function() {
    return state;
  };

  watcher.close = function() {
  };

  return watcher;
};
