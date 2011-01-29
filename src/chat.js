"use strict";

var clone = function(o) {
  var F = function() {};
  F.prototype = o;
  return new F;
};
var isDefined = function(o) {
  return typeof o !== 'undefined';
};
var isArray = function(o) {
  return typeof o === 'object' && o.constructor === Array;
};
var isServer = typeof window === 'undefined';

var inArray = function(a, o) {
  var i = a.length;
  while (i--) {
    if (a[i] === o) {
      return true;
    }
  }
  return false;
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
updater.bind = function(name, render, id, method, property) {
  var names = this._names,
      record = {r: render, m: method, i: id, p: property},
      listeners = names[name];
  if (listeners) {
    if (!inArray(listeners, record)) {
      listeners.push(record);
    }
  } else {
    names[name] = [];
  }
};
updater.trigger = function(name, value) {
  var listeners = this._names[name], i, listener, s, el;
  if (listeners) {
    for (i = 0; listener = listeners[i++];) {
      if (listener.r) {
        s = isArray(value) ?
          outList(renders[listener.r], value) :
          renders[listener.r](value);
      } else {
        s = value;
      }
      el = document.getElementById(listener.i);
      if (el) {
        this._methods[listener.m](
          s,
          document.getElementById(listener.i),
          listener.p
        );
      } else {
        // TODO: Should remove the listener
      }
    }
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
    switch (arguments.length) {
      case 3:
        return this._world[a0][a1][a2];
      case 2:
        return this._world[a0][a1];
      case 1:
        return this._world[a0];
      case 0:
        return this._world;
    }
    return null;
  },
  setSilent: function(a0, a1, a2, a3) {
    switch (arguments.length) {
      case 4:
        this._world[a0][a1][a2] = a3;
        return;
      case 3:
        this._world[a0][a1] = a2;
        return;
      case 2:
        this._world[a0] = a1;
        return;
      case 1:
        this._world = a0;
    }
  },
  set: function(a0, a1, a2, a3) {
    this.setSilent(a0, a1, a2, a3);
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
    var arr = this._world[name];
    arr.push(value);
    updater.trigger(name, arr);
  }
}

var outList = function(render, items) {
  for (var i = 0, html = '', item; item = items[i]; i++) {
    html += render(item, i);
  }
  return html;
}

var outMessage = function(message, index) {
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
}
var renders = {
  outMessage: outMessage
};

var outBody = function() {
  var session = model.get('session');
  var userId = session.userId;
  var user = model.get('users', userId);
  
  updater.bind('messages', 'outMessage', 'messageList', 'html');
  updater.bind('users.' + userId + '.picUrl', null, 'inputPic', 'attr', 'src');
  updater.bind('users.' + userId + '.name', null, 'inputName', 'attr', 'value');
  updater.bind('session.newComment', null, 'commentInput', 'prop', 'value');
  
  return '<ul id=messageList>' + outList(outMessage, model.get('messages')) + '</ul> \
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
this.outServer = function() {
  return {
    body: outBody(),
    script: 'uniqueId._count=' + uniqueId._count + ';' +
    'updater._names=' + JSON.stringify(updater._names) + ';'
  }
}

var postMessage = function() {
  model.push('messages', {
    userId: model.get('session', 'userId'),
    comment: model.get('session', 'newComment')
  });
  model.set('session', 'newComment', '');
}
