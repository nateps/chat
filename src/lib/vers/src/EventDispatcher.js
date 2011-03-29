require('./utils')((function(){return this})());

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
    obj[key] = listener;
    names[name] = obj;
  },
  unbind: function(name, listener) {
    var names = this._names,
        key = JSON.stringify(listener);
    delete names[name][key];
  },
  trigger: function(name, value) {
    var names = this._names,
        listeners = names[name],
        callback = this._triggerCallback;
    if (listeners && !onServer) {
      forEach(listeners, function(key, listener) {
        if (!callback(listener, value)) {
          delete listeners[key];
        }
      });
    }
  }
}