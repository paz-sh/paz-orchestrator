'use strict';

var debug = require('debug')('fleet-watch-units');
var override = require('json-override');
var path = require('path');
var Yoda = require('yoda');
var EventEmitter = require('events').EventEmitter;
var url = require('url');

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

    //
    // XXX Hacky fix for Metadata being null
    // (json-override should have a safety check?)
    //
    prev.machineState.Metadata = {};

    dirs.reverse().forEach(function(key) {
      if (key !== 'object') {
        var obj = Object.create(null);
        obj[key] = prev;
        prev = obj;
      }
    });
    override(state, prev);
    var dir = dirs.pop();
    watcher.emit('add', dir, prev[dir]);
  }

  function updateStateRemove(route, data) {
    var prev = state;
    var dirs = trimLeadingSlash(route).split(path.sep);
    var lastKey = dirs.pop();
    dirs.forEach(function(key) {
      prev = prev[key];
    });
    delete prev[lastKey];
    if (data) {
      data = JSON.parse(data);
    }
    watcher.emit('remove', lastKey, data);
  }

  var etcdEndpoint =
    cfg && cfg['etcd-endpoint'] ? cfg['etcd-endpoint'] : '127.0.0.1:2379';
  var urlData = url.parse(etcdEndpoint);
  var yoda = new Yoda(urlData.hostname, urlData.port);
  yoda.connect('/_coreos.com/fleet/state')
    .on('add', function(route, data) {
      debug({event: 'add', route: route, data: data});
      updateStateAdd(route, data);
    })
    .on('change', function(route, data) {
      debug({event: 'change', route: route, data: data});
      // don't need to do anything here
    })
    .on('remove', function(route, data) {
      debug({event: 'remove', route: route, data: data});
      updateStateRemove(route, data);
    });

  watcher.getState = function() {
    return state;
  };

  watcher.close = function() {
  };

  return watcher;
};
