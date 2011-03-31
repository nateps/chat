var EventDispatcher = module.exports = function(triggerCallback, bindCallback) {
  this._triggerCallback = triggerCallback;
  if (bindCallback) {
    this.bind = function(name, listener) {
      if (bindCallback(name, listener)) {
        EventDispatcher.prototype.bind.call(this, name, listener);
      }
    };
  }
  this._names = {};
}
EventDispatcher.prototype = {
  bind: function(name, listener) {
    var names = this._names,
        key = JSON.stringify(listener),
        obj = names[name] || {};
    obj[key] = 1;
    names[name] = obj;
  },
  unbind: function(name, listener) {
    var names = this._names,
        key = JSON.stringify(listener);
    delete names[name][key];
  },
  trigger: function(name, value, options) {
    var names = this._names,
        listeners = names[name],
        callback = this._triggerCallback;
    if (listeners && !onServer) {
      Object.keys(listeners).forEach(function(key) {
        var listener = JSON.parse(key);
        if (!callback(listener, value, options)) {
          delete listeners[key];
        }
      });
    }
  }
}