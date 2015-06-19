'use strict';

var argh = require('argh');
var bunyan = require('bunyan');
var pkgjson = require('./package.json');
var restify = require('restify');
var routes = require('./lib/routes');
var AnnounceWatcher = require('./lib/paz-watch-announce');
var MachinesWatcher = require('./lib/fleet-watch-machines');
var UnitsWatcher = require('./lib/fleet-watch-units');
var transformRawUnit = require('./lib/unit-transform.js');
var shouldSendUnit = require('./lib/check-unit.js');
var io = require('socket.io')(1337);
var DnsHandler = require('./lib/dns-handler');
var server = exports;

function printUsage() {
  console.log([
    'Usage: ./bin/' + pkgjson.name + ' [--port] [--loglevel] [--svcdir-url]',
    'Starts ' + pkgjson.name + ' with the specified configuration',
    '--port port to run on (default: 9000)',
    '--loglevel log level (default: info)',
    '--svcdir-url host and port of the service directory (required)',
    '--scheduler-url host and port of the scheduler (default: http://127.0.0.1:9001)',
    '--etcd-endpoint host and port of an etcd endpoint (default: 172.17.8.101:2379)',
    '--cors set whether to enable CORS or not (default: true)',
    '--dns.disabled use this to disable DNS configuration, e.g. for localhost cluster (default: false).',
    '--dns.provider pkgcloud dns provider to use for updating machine dns records (default: dnsimple)',
    '--dns.email pkgcloud providers email address',
    '--dns.apiKey pkgcloud providers apiKey',
    '--dns.domain pkgcloud providers domain to update'
  ].join('\n'));
}

if (argh.argv.help || argh.argv.h) {
  printUsage();
  process.exit();
}

function ensureProtocolPrefix(url) {
  if (url && !url.match(/^http[s]{0,1}:\/\//)) {
    url = 'http://' + url;
  }
  return url;
}

var APP_NAME = pkgjson.name.toUpperCase().replace('-', '_');
argh.argv.dns = argh.argv.dns || {};
var opts = {
  'port':
    +(argh.argv.port ||
      process.env[APP_NAME + '_PORT'] ||
      '9000'),
  'loglevel':
    argh.argv.loglevel ||
    process.env[APP_NAME + '_LOGLEVEL'] ||
    'info',
  'svcdir-url':
    argh.argv['svcdir-url'] ||
    ensureProtocolPrefix(process.env[APP_NAME + '_SVCDIR_URL']) ||
    null,
  'scheduler-url':
    argh.argv['scheduler-url'] ||
    ensureProtocolPrefix(process.env[APP_NAME + '_SCHEDULER_URL']) ||
    'http://127.0.0.1:9001',
  'etcd-endpoint':
    argh.argv['etcd-endpoint'] ||
    ensureProtocolPrefix(process.env[APP_NAME + '_ETCD_ENDPOINT']) ||
    '172.17.8.101:2379',
  'cors': argh.argv.cors ||
    process.env[APP_NAME + '_CORS'] ||
    true,
  'dns': {
    'disabled':
      argh.argv.dns.disabled ||
      process.env[APP_NAME + '_DNS_DISABLED'] ||
      false,
    'provider':
      argh.argv.dns.provider ||
      process.env[APP_NAME + '_DNS_PROVIDER'] ||
      'dnsimple',
    'email':
      argh.argv.dns.email ||
      process.env[APP_NAME + '_DNS_EMAIL'] ||
      'test@example.com',
    'apiKey':
      argh.argv.dns.apiKey ||
      process.env[APP_NAME + '_DNS_APIKEY'] ||
      '312487532487',
    'domain':
      argh.argv.dns.domain ||
      process.env[APP_NAME + '_DNS_DOMAIN'] ||
      'lukeb0nd.com'
  }
};

if (opts.cors === 'true') {
  opts.cors = true;
}
if (opts.cors === 'false') {
  opts.cors = false;
}
console.log(JSON.stringify(opts));

// check for required args
if (!opts['svcdir-url']) {
  printUsage();
  console.error('\nArgument \'svcdir-url\' is required.');
  process.exit(1);
}

var logger = bunyan.createLogger({
  name: pkgjson.name + '_log',
  level: opts.loglevel,
  stream: process.stdout,
  serializers: restify.bunyan.serializers,
  src: (process.env.NODE_ENV !== 'production')
});

opts.logger = logger;

var restifyServer = restify.createServer({
    name: pkgjson.name,
    version: pkgjson.version,
    log: logger
  });

server.restifyServer = restifyServer;

restifyServer.log.level('info');

/* eslint-disable new-cap */

if (opts.cors) {
  restifyServer.pre(restify.CORS());
}

/* eslint-enable new-cap */

restifyServer.use(require('./middleware/uuid'));
restifyServer.use(require('./middleware/api-version'));
restifyServer.use(require('./middleware/logger'));

restifyServer.use(restify.queryParser());
restifyServer.use(restify.bodyParser({
  mapParams: false
}));

var svcClient = restify.createJsonClient({
  url: opts['svcdir-url']
});
opts.svcClient = svcClient;

var schedClient = restify.createJsonClient({
  url: opts['scheduler-url']
});

opts.schedClient = schedClient;

opts.io = io;

var announceWatcher = new AnnounceWatcher(opts);
opts.announceWatcher = announceWatcher;

var machinesWatcher = new MachinesWatcher(opts);
opts.machinesWatcher = machinesWatcher;

var dnsHandler;
console.log(opts.dns);
if (!opts.dns.disabled) {
  dnsHandler = new DnsHandler(opts);
  opts.dnsHandler = dnsHandler;
}

var unitsWatcher = new UnitsWatcher(opts);
opts.unitsWatcher = unitsWatcher;

// Setup unit events with socket.io
opts.unitsWatcher.on('add', function(name, rawUnit) {
  if (shouldSendUnit(name)) {
    io.emit('unit.add', transformRawUnit(rawUnit, name));
  }
});

opts.unitsWatcher.on('remove', function(name) {
  if (shouldSendUnit(name)) {
    io.emit('unit.remove', name.substr(0, name.lastIndexOf('.')));
  }
});

server.run = function() {
  routes(restifyServer, opts);
  restifyServer.listen(opts.port, function() {
    restifyServer.log.info(pkgjson.name + ' is now running on port ' + opts.port);
    restifyServer.log.info({'svcdir-url': opts['svcdir-url']});
    restifyServer.log.debug(opts);
  });
};

server.close = function(cb) {
  restifyServer.close(cb);
};

if (require.main === module) {
  logger.info('Starting server');
  server.run();
}
