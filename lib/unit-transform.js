function getPropsFromKey(key, prop) {
  // Trim extension
  key = key.slice(0, -key.split('.').pop().length - 1);

  // XXX I guess there should be a global Paz VERSION var or something
  if (key.match(/paz\-+/)) {
    switch (prop) {
      case 'instance':
        return '';
      case 'version':
        return '';
      case 'service':
        return key;
    }
  }

  var arr = key.split('-');
  var instance = Number(arr.pop());
  var version = Number(arr.pop());
  var service = arr.join('-');

  switch (prop) {
    case 'instance':
      return instance;
    case 'version':
      return version;
    case 'service':
      return service;
  }
}

function transformRawUnit(unit, name) {
  // Remove service suffix
  unit.name = name.substr(0, name.lastIndexOf('.'));

  unit.instance = getPropsFromKey(name, 'instance');
  unit.version = getPropsFromKey(name, 'version');
  unit.service = getPropsFromKey(name, 'service');

  return unit;
}

module.exports = transformRawUnit;
