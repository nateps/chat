require('./utils')((function(){return this})());
var EventDispatcher = require('./EventDispatcher'),
    world = {},
    setMethods = {
      attr: function(value, el, attr) {
        el.setAttribute(attr, value);
      },
      prop: function(value, el, prop) {
        el[prop] = value;
      },
      propLazy: function(value, el, prop) {
        if (el !== document.activeElement) el[prop] = value;
      },
      html: function(value, el) {
        el.innerHTML = value;
      }
    },
    socket, view;

exports.setSocket = function(o) {
  socket = o;
}
exports.setView = function(o) {
  view = o;
}

if (!onServer) {
  socket = new io.Socket(null, {port: 8001});
  socket.connect();
  socket.on('message', function(message) {
    message = JSON.parse(message);
    exports['_' + message[0]].apply(null, message[1]);
  });
}

var events = exports.events = new EventDispatcher(
  function(pathName, listener) {
    var obj = world,
        path, i, prop, refName, keyName, ref, key, eventPath;
    path = pathName.split('.');
    for (i = 0; prop = path[i++];) {
      obj = obj[prop];
      if (isUndefined(obj)) return false; // Remove bad event handler
      if ((refName = obj._r) && (keyName = obj._k)) {
        key = get(keyName);
        ref = get(refName);
        eventPath = [refName, key].concat(path.slice(i)).join('.');
        // Register an event to update the other event handler when the
        // reference key changes
        events.bind(keyName, {_o: eventPath, _p: pathName, _l: listener});
        // Bind the event to the dereferenced path
        events.bind(eventPath, listener);
        // Cancel the creation of an event to a path with a reference in it
        return false;
      }
    }
    return true;
  },
  function(listener, value) {
    var id, method, property, viewFunc, el, s,
        oldPathName, pathName, listenerObj;
    if (isArray(listener)) {
      id = listener[0];
      method = listener[1];
      property = listener[2];
      viewFunc = listener[3];
      el = document.getElementById(id);
      if (!el) return false;
      s = (viewFunc) ? view._get(viewFunc, value) : value;
      setMethods[method](s, el, property);
      return true;
    } else if ((oldPathName = listener._o) && (pathName = listener._p) && (listenerObj = listener._l)) {
      events.unbind(oldPathName, listenerObj);
      events.bind(pathName, listenerObj);
      // Set the object to itself to trigger change event
      set(pathName, get(pathName));
      // Remove this handler, since it will be replaced with a new handler
      // in the bind action above
    }
    return false;
  }
);

var get = exports.get = function(path) {
  var obj = world,
      i, prop, ref, key;
  if (path) {
    path = path.split('.');
    for (i = 0; prop = path[i++];) {
      obj = obj[prop];
      if (isUndefined(obj)) return null; // Return null if not found
      if ((ref = obj._r) && (key = obj._k)) {
        ref = get(ref);
        key = get(key);
        obj = ref[key];
      }
    }
  }
  return obj;
};

var send = function(method, args, broadcast){
  var message = JSON.stringify(
    [method, toArray(args)]
  );
  if (onServer) {
    if (broadcast && socket) {
      socket.broadcast(message);
    }
  } else {
    socket.send(message);
  }
};

var _set = exports._set = function(path, value, silent, sendUpdate, broadcast) {
  var obj = world,
      eventPath = [],
      i, prop, len, child, ref, key;
  if (path) {
    path = path.split('.');
    len = path.length;
    for (i = 0; prop = path[i++];) {
      child = obj[prop];
      if (child && (ref = child._r) && (key = child._k)) {
        key = get(key);
        eventPath = [ref, key];
        ref = get(ref);
        if (i === len) {
          ref[key] = value;
        } else {
          obj = ref[key];
        }
      } else {
        if (i === len) {
          obj[prop] = value;
        } else {
          obj = child;
        }
        eventPath.push(prop);
      }
    }
  }
  if (silent) return;
  eventPath = eventPath.join('.');
  events.trigger(eventPath, value);
  if (sendUpdate) send('set', [eventPath, value], broadcast);
};
var set = exports.set = function(path, value, broadcast) {
  _set(path, value, false, true, broadcast);
};
var setSilent = exports.setSilent = function(path, value) {
  _set(path, value, true);
};

var _push = exports._push = function(name, value, sendUpdate, broadcast) {
  var arr = world[name];
  arr.push(value);
  events.trigger(name, arr);
  if (sendUpdate) send('push', [name, value], broadcast);
};
var push = exports.push = function(name, value, broadcast) {
  _push(name, value, true, broadcast);
};

exports.ref = function(ref, key) {
  return {_r: ref, _k: key};
};
exports.init = function(value) {
  world = value;
};