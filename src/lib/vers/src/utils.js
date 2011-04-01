module.exports = function(root) {
    
  // Based on Underscore.js:
  
  var isArray = root.isArray = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };
  var isArguments = root.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };
  root.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };
  root.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };
  root.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };
  // NaN happens to be the only value in JavaScript that does not equal itself.
  root.isNaN = function(obj) {
    return obj !== obj;
  };
  root.isBoolean = function(obj) {
    return obj === true || obj === false;
  };
  root.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };
  root.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };
  root.isNull = function(obj) {
    return obj === null;
  };
  root.isUndefined = function(obj) {
    return obj === void 0;
  };
  // Safely convert anything iterable into a real, live array.
  root.toArray = function(iterable) {
    if (!iterable) return [];
    if (iterable.toArray) return iterable.toArray();
    if (isArray(iterable)) return iterable;
    if (isArguments(iterable)) return Array.slice.call(iterable);
    return forEach(iterable, function(key, value) { return value; });
  };
  
  // Custom utils:
  
  root.onServer = process.title === 'node';
  
  var forEach = root.forEach = function(obj, iterator) {
    for (var key in obj) {
      iterator(key, obj[key]);
    }
  }
}