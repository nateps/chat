var _ = require('underscore'),
    isServer = typeof window === 'undefined';

var EventDispatcher = this.EventDispatcher = function(bindCallback, triggerCallback) {
  this._bindCallback = bindCallback;
  this._triggerCallback = triggerCallback;
  this._names = {};
}
EventDispatcher.prototype = {
  bind: function(name, listener) {
    var names = this._names,
        listeners = names[name];
    var containsEqual = function(a, o) {
      return _.some(a, function(i) {
        return _.isEqual(i, o);
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
    names[name] = _.filter(names[name], function(item) {
      return !_.isEqual(item, listener);
    });
  },
  trigger: function(name, value) {
    var names = this._names,
        listeners = names[name],
        callback = this._triggerCallback,
        dirty = false,
        successful;
    if (listeners && !isServer) {
      _.each(listeners, function(listener, i) {
        successful = callback(listener, value);
        if (!successful) {
          delete listeners[i];
          dirty = true;
        }
      });
      if (dirty) {
        names[name] = _.compact(listeners);
      }
    }
  }
}