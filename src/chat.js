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
}
EventDispatcher.prototype = {
  _names: {},
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
  _methods: {
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
  model: new EventDispatcher(function(listener, value) {
    var transform = listener[0],
        id = listener[1],
        method = listener[2],
        property = listener[3],
        el = document.getElementById(id),
        transform, s;
    if (el) {
      transform = transform && out[transform];
      s = (transform) ?
        _.isArray(value) ? out.list(value, transform) : transform(value) :
        value;
      events._methods[method](s, el, property);
      return true;
    }
    return false;
  }),
  dom: new EventDispatcher(function(listener, value) {
    
  })
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
      'model._world=' + JSON.stringify(model._world) + ';'
    }
  },
  message: function(message, index) {
    var picId = uniqueId(),
        nameId = uniqueId(),
        commentId = uniqueId(),
        user = model.get('users', message.userId);

    events.model.bind('users.' + message.userId + '.picUrl', [null, picId, 'attr', 'src']);
    events.model.bind('users.' + message.userId + '.name', [null, nameId, 'html']);
    events.model.bind('messages.' + index + '.comment', [null, commentId, 'html']);

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

    events.model.bind('messages', ['message', 'messageList', 'html']);
    events.model.bind('users.' + userId + '.picUrl', [null, 'inputPic', 'attr', 'src']);
    events.model.bind('users.' + userId + '.name', [null, 'inputName', 'attr', 'value']);
    events.model.bind('session.newComment', [null, 'commentInput', 'prop', 'value']);
    
    

    return '<ul id=messageList>' + out.list(model.get('messages'), out.message) + '</ul> \
      <div id=foot> \
        <img id=inputPic src="' + user.picUrl + '" class=pic> \
        <div id=inputs> \
          <input id=inputName onkeyup=model.set("users",' + userId + ',"name",this.value) value="' + user.name + '"> <b>(your nickname)</b> \
          <form id=inputForm action=javascript:postMessage()> \
            <input id=commentInput onkeyup=model.setSilent("session","newComment",this.value) value="' + session.newComment + '"> \
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
