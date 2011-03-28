require('./utils')((function(){return this})());

var areSame = function(a, b) {
  if (a === b) return true;
  for (var key in a) if (!(key in b) || a[key] !== b[key]) return false;
  return true;
};

var EventDispatcher = exports = module.exports = function(bindCallback, triggerCallback) {
  this._bindCallback = bindCallback;
  this._triggerCallback = triggerCallback;
  this._names = {};
}
EventDispatcher.prototype = {
  bind: function(name, listener) {
    var names = this._names,
        listeners = names[name];
    var containsEqual = function(a, o) {
      return a.some(function(i) {
        return areSame(i, o);
      });
    }
    if (this._bindCallback(name, listener)) {
      if (listeners) {
        if (!containsEqual(listeners, listener)) {
          listeners.push(listener);
        }
      } else {
        names[name] = [listener];
      }
    }
  },
  unbind: function(name, listener) {
    var names = this._names;
    names[name] = names[name].filter(function(item) {
      return !areSame(item, listener);
    });
  },
  trigger: function(name, value) {
    var names = this._names,
        listeners = names[name],
        callback = this._triggerCallback,
        dirty = false,
        successful;
    if (listeners && !onServer) {
      listeners.forEach(function(listener, i) {
        successful = callback(listener, value);
        if (!successful) {
          delete listeners[i];
          dirty = true;
        }
      });
      if (dirty) {
        // Remove all falsy values
        names[name] = listeners.filter(function(value) { return !!value; });
      }
    }
  }
}