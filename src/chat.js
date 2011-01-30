"use strict";

var isServer = typeof window === 'undefined';

if (isServer) {
  var _ = require('../lib/underscore_1.1.4');
} else {
  var socket = new io.Socket(null, {port: 8001});
  socket.connect();
  socket.on('message', function(message) {
    message = JSON.parse(message);
    model['_' + message[0]].apply(null, message[1]);
  });
}

var EventDispatcher = function(handler) {
  this._handler = handler;
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
    if (listeners) {
      if (!containsEqual(listeners, listener)) {
        listeners.push(listener);
      }
    } else {
      names[name] = [listener];
    }
  },
  trigger: function(name, value) {
    var names = this._names,
        listeners = names[name],
        handler = this._handler,
        dirty = false,
        successful;
    if (listeners && !isServer) {
      _.each(listeners, function(listener, i) {
        successful = handler(listener, value);
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

var events = {
  _setMethods: {
    attr: function(value, el, attr) {
      el.setAttribute(attr, value);
    },
    prop: function(value, el, prop) {
      el[prop] = value;
    },
    html: function(value, el) {
      el.innerHTML = value;
    }
  },
  _getMethods: {
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
  model: new EventDispatcher(function(listener, value) {
    var id = listener[0],
        method = listener[1],
        property = listener[2],
        transform = listener[3],
        el = document.getElementById(id),
        transform, s;
    if (!el) return false;
    transform = transform && out[transform];
    s = (transform) ?
      _.isArray(value) ? out.list(value, transform) : transform(value) :
      value;
    events._setMethods[method](s, el, property);
    return true;
  }),
  dom: new EventDispatcher(function(listener, targetId) {
    var func = listener[0],
        args = listener[1],
        id = listener[2],
        method = listener[3],
        property = listener[4],
        el, value;
    if (id === targetId) {
      el = document.getElementById(id);
      if (!el) return false;
      value = events._getMethods[method](el, property);
      model[func].apply(model, args.concat(value));
    }
    return true;
  })
}

var domHandler = function(e) {
  var e = e || event,
      target = e.target || e.srcElement;
  if (target.nodeType === 3) target = target.parentNode; // Fix for Safari bug
  events.dom.trigger(e.type, target.id);
}
if (!isServer) {
  _.each(['keyup', 'keydown'], function(item) {
    document['on' + item] = domHandler;
  });
}

var uniqueId = function() {
  return '_' + (uniqueId._count++).toString(36);
};
uniqueId._count = 0;

var model = {
  _world: {
    users: {
      0: {
        name: 'Nate',
        picUrl: 'http://nateps.com/resume/nate_smith_92x92.jpg'
      }
    },
    messages: [],
    session: {
      userId: 0,
      newComment: ''
    }
  },
  _send: function(method, args){
    if (!isServer) {
      socket.send(
        JSON.stringify(
          [method, _.toArray(args)]
        )
      );
    }
  },
  get: function(a0, a1, a2) {
    var world = model._world;
    switch (arguments.length) {
      case 3:
        return world[a0][a1][a2];
      case 2:
        return world[a0][a1];
      case 1:
        return world[a0];
      case 0:
        return world;
    }
    return null;
  },
  setSilent: function(a0, a1, a2, a3) {
    var world = model._world;
    switch (arguments.length) {
      case 4:
        world[a0][a1][a2] = a3;
        break;
      case 3:
        world[a0][a1] = a2;
        break;
      case 2:
        world[a0] = a1;
        break;
      case 1:
        world = a0;
    }
  },
  _set: function(a0, a1, a2, a3) {
    model.setSilent.apply(model, _.toArray(arguments));
    switch (arguments.length) {
      case 4:
        events.model.trigger(a0 + '.' + a1 + '.' + a2, a3);
        break;
      case 3:
        events.model.trigger(a0 + '.' + a1, a2);
        break;
      case 2:
        events.model.trigger(a0, a1);
    }
  },
  set: function(a0, a1, a2, a3) {
    model._set.apply(model, _.toArray(arguments));
    model._send('set', arguments);
  },
  _push: function(name, value) {
    var arr = model._world[name];
    arr.push(value);
    events.model.trigger(name, arr);
  },
  push: function(name, value) {
    model._push(name, value);
    model._send('push', arguments);
  }
}
this.model = model;

var out = {
  list: function(items, func) {
    return _.reduce(items, function(memo, item) {
      return memo + func(item);
    }, '');
  },
  server: function() {
    return {
      body: out.body(),
      script: 'uniqueId._count=' + uniqueId._count + ';' +
      'events.model._names=' + JSON.stringify(events.model._names) + ';' +
      'events.dom._names=' + JSON.stringify(events.dom._names) + ';' +
      'model._world=' + JSON.stringify(model._world) + ';'
    }
  },
  message: function(message, index) {
    var picId = uniqueId(),
        nameId = uniqueId(),
        commentId = uniqueId(),
        user = model.get('users', message.userId);

    events.model.bind('users.' + message.userId + '.picUrl', [picId, 'attr', 'src']);
    events.model.bind('users.' + message.userId + '.name', [nameId, 'html']);
    events.model.bind('messages.' + index + '.comment', [commentId, 'html']);

    return '<li> \
      <img id=' + picId + ' src="' + user.picUrl + '" class=pic> \
      <div class=message> \
        <p><b id=' + nameId + '>' + user.name + '</b> \
        <p id=' + commentId + '>' + message.comment + '</div>'
  },
  body: function() {
    var session = model.get('session'),
        userId = session.userId,
        user = model.get('users', userId);

    events.model.bind('messages', ['messageList', 'html', null, 'message']);
    events.model.bind('users.' + userId + '.picUrl', ['inputPic', 'attr', 'src']);
    events.model.bind('users.' + userId + '.name', ['inputName', 'attr', 'value']);
    events.model.bind('session.newComment', ['commentInput', 'prop', 'value']);
    
    events.dom.bind('keyup', ['set', ['users', userId, 'name'], 'inputName', 'prop', 'value']);
    events.dom.bind('keyup', ['setSilent', ['session', 'newComment'], 'commentInput', 'prop', 'value']);

    return '<ul id=messageList>' + out.list(model.get('messages'), out.message) + '</ul> \
      <div id=foot> \
        <img id=inputPic src="' + user.picUrl + '" class=pic> \
        <div id=inputs> \
          <input id=inputName value="' + user.name + '"> <b>(your nickname)</b> \
          <form id=inputForm action=javascript:postMessage()> \
            <input id=commentInput value="' + session.newComment + '"> \
          </form> \
        </div> \
      </div>'
  }
}
this.out = out;

var postMessage = function() {
  model.push('messages', {
    userId: model.get('session', 'userId'),
    comment: model.get('session', 'newComment')
  });
  model.set('session', 'newComment', '');
}
