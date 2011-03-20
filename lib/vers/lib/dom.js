var _ = require('underscore'),
    EventDispatcher = require('./EventDispatcher').EventDispatcher,
    getMethods = {
      attr: function(el, attr) {
        return el.getAttribute(attr);
      },
      prop: function(el, prop) {
        return el[prop];
      },
      html: function(el) {
        return el.innerHTML;
      }
    },
    isServer = typeof window === 'undefined';

var events = this.events = new EventDispatcher(
  function(name, listener) {
    return true;
  },
  function(listener, targetId) {
    var func = listener[0],
        path = listener[1],
        id = listener[2],
        method = listener[3],
        property = listener[4],
        el, value;
    if (id === targetId) {
      el = document.getElementById(id);
      if (!el) return false;
      value = getMethods[method](el, property);
      model[func].apply(null, [path, value]);
    }
    return true;
  }
);

var domHandler = function(e) {
  var e = e || event,
      target = e.target || e.srcElement;
  if (target.nodeType === 3) target = target.parentNode; // Fix for Safari bug
  events.trigger(e.type, target.id);
}
if (!isServer) {
  _.each(['keyup', 'keydown'], function(item) {
    document['on' + item] = domHandler;
  });
}