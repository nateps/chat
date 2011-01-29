"use strict";

var isServer = typeof window === 'undefined';

if (isServer) {
  var _ = require('../lib/underscore_1.1.4');
}

var updater = {
  _names: {},
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
  }
};
updater.bind = function(name, transform, id, method, property) {
  var names = updater._names,
      record = {t: transform, i: id, m: method, p: property},
      listeners = names[name];
  var containsEqual = function(a, o) {
    return _.some(a, function(i) {
      return _.isEqual(i, o);
    });
  }
  if (listeners) {
    if (!containsEqual(listeners, record)) {
      listeners.push(record);
    }
  } else {
    names[name] = [record];
  }
};
updater.trigger = function(name, value) {
  var names = updater._names,
      listeners = names[name],
      i, listener, transform, s, el;
  if (listeners) {
    _.each(listeners, function(listener, i) {
      transform = listener.t && out[listener.t];
      s = (transform) ?
        _.isArray(value) ? out.list(value, transform) : transform(value) :
        value;
      el = document.getElementById(listener.i);
      if (el) {
        updater._methods[listener.m](s, el, listener.p);
      } else {
        delete listeners[i];
      }
    });
    names[name] = _.compact(listeners);
  }
};

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
        return;
      case 3:
        world[a0][a1] = a2;
        return;
      case 2:
        world[a0] = a1;
        return;
      case 1:
        world = a0;
    }
  },
  set: function(a0, a1, a2, a3) {
    model.setSilent(a0, a1, a2, a3);
    switch (arguments.length) {
      case 4:
        updater.trigger(a0 + '.' + a1 + '.' + a2, a3);
        return;
      case 3:
        updater.trigger(a0 + '.' + a1, a2);
        return;
      case 2:
        updater.trigger(a0, a1);
    }
  },
  push: function(name, value) {
    var arr = model._world[name];
    arr.push(value);
    updater.trigger(name, arr);
  }
}

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
      'updater._names=' + JSON.stringify(updater._names) + ';'
    }
  },
  message: function(message, index) {
    var picId = uniqueId(),
        nameId = uniqueId(),
        commentId = uniqueId(),
        user = model.get('users', message.userId);

    updater.bind('users.' + message.userId + '.picUrl', null, picId, 'attr', 'src');
    updater.bind('users.' + message.userId + '.name', null, nameId, 'html');
    updater.bind('messages.' + index + '.comment', null, commentId, 'html');

    return '<li> \
      <img id=' + picId + ' src="' + user.picUrl + '" class=pic> \
      <div class=message> \
        <p><b id=' + nameId + '>' + user.name + '</b> \
        <p id=' + commentId + '>' + message.comment + '</div>'
  },
  body: function() {
    var session = model.get('session');
    var userId = session.userId;
    var user = model.get('users', userId);

    updater.bind('messages', 'message', 'messageList', 'html');
    updater.bind('users.' + userId + '.picUrl', null, 'inputPic', 'attr', 'src');
    updater.bind('users.' + userId + '.name', null, 'inputName', 'attr', 'value');
    updater.bind('session.newComment', null, 'commentInput', 'prop', 'value');

    return '<ul id=messageList>' + out.list(model.get('messages'), out.message) + '</ul> \
      <div id=foot> \
        <img id=inputPic src="' + user.picUrl + '" class=pic> \
        <div id=inputs> \
          <input id=inputName onkeyup=model.set("users",' + userId + ',"name",this.value) value="' + user.name + '"> <b>(your nickname)</b> \
          <form action=javascript:postMessage() style=position:relative;margin-top:6px;padding-right:6px> \
            <input id=commentInput style=width:100% onkeyup=model.setSilent("session","newComment",this.value) value="' + session.newComment + '"> \
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
