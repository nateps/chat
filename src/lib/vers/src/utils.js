var _ = exports;
    
// Based on Underscore.js:

var isArray = _.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};
var isArguments = _.isArguments = function(obj) {
  return !!(obj && hasOwnProperty.call(obj, 'callee'));
};
_.isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};
_.isString = function(obj) {
  return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
};
_.isNumber = function(obj) {
  return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
};
// NaN happens to be the only value in JavaScript that does not equal itself.
_.isNaN = function(obj) {
  return obj !== obj;
};
_.isBoolean = function(obj) {
  return obj === true || obj === false;
};
_.isDate = function(obj) {
  return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
};
_.isRegExp = function(obj) {
  return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
};
_.isNull = function(obj) {
  return obj === null;
};
_.isUndefined = function(obj) {
  return obj === void 0;
};
// Safely convert anything iterable into a real, live array.
_.toArray = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  if (isArguments(iterable)) return Array.slice.call(iterable);
  if (isArray(iterable)) return iterable;
  return forEach(iterable, function(key, value) { return value; });
};

// Custom utils:

_.onServer = _.isUndefined(window);

var forEach = _.forEach = function(obj, iterator) {
  for (var key in obj) {
    iterator(key, obj[key]);
  }
}