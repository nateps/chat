"use strict";

var isServer = typeof window === 'undefined';

if (isServer) {
  var _ = require('underscore');
} else {
  var socket = new io.Socket(null, {port: 8001});
  socket.connect();
  socket.on('message', function(message) {
    message = JSON.parse(message);
    model['_' + message[0]].apply(null, message[1]);
  });
}

var EventDispatcher = function(bindCallback, triggerCallback) {
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

var dom = (function(){
  var that = {},
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
      };
  
  var events = that.events = new EventDispatcher(
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
  
  return that;
})();

var model = this.model = (function(){
  var that = {},
      world = {},
      setMethods = {
        attr: function(value, el, attr) {
          el.setAttribute(attr, value);
        },
        prop: function(value, el, prop) {
          el[prop] = value;
        },
        html: function(value, el) {
          el.innerHTML = value;
        }
      };
  
  var events = that.events = new EventDispatcher(
    function(pathName, listener) {
      var obj = world,
          path, i, prop, refName, keyName, ref, key, eventPath;
      path = pathName.split('.');
      for (i = 0; prop = path[i++];) {
        obj = obj[prop];
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
      var id, method, property, transform, el, s,
          oldPathName, pathName, listenerObj;
      if (_.isArray(listener)) {
        id = listener[0];
        method = listener[1];
        property = listener[2];
        transform = listener[3];
        el = document.getElementById(id);
        if (!el) return false;
        transform = transform && out[transform];
        s = (transform) ?
          _.isArray(value) ? out._list(value, transform) : transform(value) :
          value;
        setMethods[method](s, el, property);
        return true;
      } else if ((oldPathName = listener._o) && (pathName = listener._p) && (listenerObj = listener._l)) {
        events.unbind(oldPathName, listenerObj);
        events.bind(pathName, listenerObj);
        // Remove this handler, since it will be replaced with a new handler
        // in the bind action above
      }
      return false;
    }
  );
  
  var get = that.get = function(path) {
    var obj = world,
        i, prop, ref, key;
    if (path) {
      path = path.split('.');
      for (i = 0; prop = path[i++];) {
        obj = obj[prop];
        if ((ref = obj._r) && (key = obj._k)) {
          ref = get(ref);
          key = get(key);
          obj = ref[key];
        }
      }
    }
    return obj;
  };
  
  var send = function(method, args){
    if (!isServer) {
      socket.send(
        JSON.stringify(
          [method, _.toArray(args)]
        )
      );
    }
  };
  
  var _set = that._set = function(path, value, silent) {
    var obj = world,
        eventPath = [],
        i, prop, len, child, ref, key;
    if (path) {
      path = path.split('.');
      len = path.length;
      for (i = 0; prop = path[i++];) {
        child = obj[prop];
        if ((ref = child._r) && (key = child._k)) {
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
    events.trigger(eventPath.join('.'), value);
  };
  var set = that.set = function(path, value) {
    _set(path, value);
    send('set', arguments);
  };
  var setSilent = that.setSilent = function(path, value) {
    _set(path, value, true);
  };
  
  var _push = that._push = function(name, value) {
    var arr = world[name];
    arr.push(value);
    events.trigger(name, arr);
  };
  var push = that.push = function(name, value) {
    model._push(name, value);
    send('push', arguments);
  };
  
  that.ref = function(ref, key) {
    return {_r: ref, _k: key};
  };
  that.init = function(value) {
    world = value;
  }
  return that;
})();

model.init({
  users: {
    0: {
      name: 'Nate',
      picUrl: 'http://nateps.com/resume/nate_smith_92x92.jpg'
    }
  },
  messages: [],
  session: {
    userId: 0,
    user: model.ref('users', 'session.userId'),
    newComment: ''
  }
});

var uniqueId = function() {
  return '_' + (uniqueId._count++).toString(36);
};
uniqueId._count = 0;

var out = this.out = {
  _list: function(items, func) {
    return _.reduce(items, function(memo, item, index) {
      return memo + func(item, index);
    }, '');
  },
  _server: function() {
    return {
      body: out.body(),
      script: 'uniqueId._count=' + uniqueId._count + ';' +
      'model.events._names=' + JSON.stringify(model.events._names) + ';' +
      'dom.events._names=' + JSON.stringify(dom.events._names) + ';' +
      'model.init(' + JSON.stringify(model.get()) + ');'
    }
  },
  message: function(message, index) {
    var picId = uniqueId(),
        nameId = uniqueId(),
        commentId = uniqueId(),
        user = model.get('users.' + message.userId);

    model.events.bind('users.' + message.userId + '.picUrl', [picId, 'attr', 'src']);
    model.events.bind('users.' + message.userId + '.name', [nameId, 'html']);
    model.events.bind('messages.' + index + '.comment', [commentId, 'html']);

    return '<li> \
      <img id=' + picId + ' src="' + user.picUrl + '" class=pic> \
      <div class=message> \
        <p><b id=' + nameId + '>' + user.name + '</b> \
        <p id=' + commentId + '>' + message.comment + '</div>'
  },
  body: function() {
    model.events.bind('messages', ['messageList', 'html', null, 'message']);
    model.events.bind('session.user.picUrl', ['inputPic', 'attr', 'src']);
    model.events.bind('session.user.name', ['inputName', 'attr', 'value']);
    model.events.bind('session.newComment', ['commentInput', 'prop', 'value']);
    
    dom.events.bind('keyup', ['set', 'session.user.name', 'inputName', 'prop', 'value']);
    dom.events.bind('keyup', ['setSilent', 'session.newComment', 'commentInput', 'prop', 'value']);
    dom.events.bind('keydown', ['set', 'session.user.name', 'inputName', 'prop', 'value']);
    dom.events.bind('keydown', ['setSilent', 'session.newComment', 'commentInput', 'prop', 'value']);

    return '<ul id=messageList>' + out._list(model.get('messages'), out.message) + '</ul> \
      <div id=foot> \
        <img id=inputPic src="' + model.get('session.user.picUrl') + '" class=pic> \
        <div id=inputs> \
          <input id=inputName value="' + model.get('session.user.name') + '"> <b>(your nickname)</b> \
          <form id=inputForm action=javascript:postMessage()> \
            <input id=commentInput value="' + model.get('session.newComment') + '"> \
          </form> \
        </div> \
      </div>'
  }
}

var postMessage = function() {
  model.push('messages', {
    userId: model.get('session.userId'),
    comment: model.get('session.newComment')
  });
  model.set('session.newComment', '');
}
