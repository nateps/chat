var clone = function(o) {
  var F = function() {};
  F.prototype = o;
  return new F;
}

var isDefined = function(o) {
  return typeof o !== 'undefined';
}

var isArray = function(o) {
  return typeof o === 'object' && o.constructor === Array;
}

var isServer = typeof window === 'undefined';

// Adapted from an example by Erik Karlsson
// http://www.nonobtrusive.com/2009/07/24/custom-events-in-javascript-by-making-your-own-dispatcher-class/
var dispatcher = (function() {
  var events = [];
  return {
    addListener: function(event, callback) {
      events[event] = events[event] || [];
      events[event].push(callback);
    },
    removeListener: function(event, callback) {
      if (events[event]) {
        var i, listeners = events[event];
        for (i = listeners.length; i--;) {
          if (listeners[i] === callback) {
            listeners.splice(i, 1);
            return true;
          }
        }
      }
      return false;
    },
    fire: function(event, e) {
      if (events[event]) {
        var listeners = events[event],
            len = listeners.length;
        while (len--) {
          listeners[len](e);
        }
      }
    }
  };
})();

var setPaths = function(start, parentPath) {
  var i, prop, path;
  for (i in start) {
    prop = start[i];
    if (prop._type != 'Ref') {
      path = (parentPath) ? parentPath + '.' + i : i;
      if (typeof prop.path == 'function') {
        prop._path = path;
      }
      if (typeof prop == 'object') {
        setPaths(prop, path);
      }
    }
  }
}
var toTypeJSON = function() {
  var init = {}, i, prop;
  for (i in this) {
    prop = this[i];
    if (typeof prop !== 'function' && i != '_type' && i != '_path') {
      init[i] = prop;
    }
  }
  return {
    __type: this._type,
    __init: init
  };
}
var getPath = function() {
  if (!isDefined(this._path)) {
    setPaths(world, '');
  }
  return this._path;
}
var Constructor = function(type, spec, proto) {
  var f = (typeof spec == 'function') ? spec : function() {};
  if (proto) {
    f.prototype = (typeof proto == 'function') ? clone(proto.prototype) : proto;
  }
  f.prototype._type = type;
  f.prototype.toJSON = toTypeJSON;
  f.prototype.path = getPath;
  return f;
}

var Val, List;
(function() {
  var funcs = ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'],
      func, i;
  Val = new Constructor('Val',
    function(init) {
      this._value = (init && isDefined(init._value)) ? init._value : init;
    }, {
      _fireUpdate: function() {
        var path = this.path();
        dispatcher.fire('update:' + path);
        var message = JSON.stringify([path, this]);
        //debugger;
        unpackJson(JSON.parse(message));
        //socket.send(JSON.stringify([path, this]));
      },
      get: function() {
        return this._value;
      },
      set: function(arg) {
        this._value = arg;
        this._fireUpdate();
      },
      setSilent: function(arg) {
        this._value = arg;
      }
    });
  List = new Constructor('List',
    function(init) {
      this._value = (init && isArray(init._value)) ? init._value : [];
    }, Val);
  // Expose functions that manipulate the contained array
  for (i = 0; func = funcs[i++];) {
    List.prototype[func] = (function() {
      var f = Array.prototype[func];
      return function() {
        var out = f.apply(this._value, arguments);
        this._fireUpdate();
        return out;
      };
    })();
  }
})();

function addElementUpdater(id, value, func) {
  var el, eventName = 'update:' + value.path();
  function callback() {
    if (!el) el = document.getElementById(id);
    try {
      func(el);
    } catch (e) {
      dispatcher.removeListener(eventName, callback);
    }
  }
  dispatcher.addListener(eventName, callback);
}
function addAttributeUpdater(id, attr, value) {
  addElementUpdater(id, value, function(el) {
    el.setAttribute(attr, value.get());
  });
}
function addPropertyUpdater(id, prop, value) {
  addElementUpdater(id, value, function(el) {
    el[prop] = value.get();
  });
}
function addInnerUpdater(id, value) {
  addElementUpdater(id, value, function(el) {
    el.innerHTML = value.get();
  });
}
function addListUpdater(id, outItem, value) {
  addElementUpdater(id, value, function(el) {
    el.innerHTML = outList(outItem, value);
  });
}

var uniqueId = (function() {
  var id = 0;
  return function() {
    return '_' + (id++).toString(36);
  }
})();

function outList(outItem, value) {
  var items = value.get(),
      html = '',
      i, item;
  for (i = 0; item = items[i++];) {
    html += outItem(item);
  }
  return html;
}

var makeRef = function(root, init) {
  var obj, props, prop, i, Ref = function() {}, ref;
  props = init.split('.');
  obj = root;
  for (i = 0; prop = props[i++];) {
    obj = obj[prop];
  }
  Ref.prototype = obj;
  ref = new Ref;
  ref._type = 'Ref';
  ref.toJSON = function() {
    return {
      __ref: init
    }
  };
  return ref;
}
// Takes a specially formatted JSON object and adds the values to the root
var unpackJson = function(items) {
  var key, val, i, root, props;
  var makeObject = function(val) {
    var obj, refs, ref, ii;
    if (typeof val == 'object') {
      if (isDefined(val.__type)) {
        obj = (isDefined(val.__init)) ?
          new this[val.__type](makeObject(val.__init)) :
          new this[val.__type];
      } else if (isDefined(val.__ref)) {
        obj = makeRef(root, val.__ref);
      } else {
        obj = val;
        for (ii in obj) {
          obj[ii] = makeObject(obj[ii]);
        }
      }
    } else {
      obj = val;
    }
    return obj;
  }
  for (i = 0; key = items[i++], val = items[i++];) {
    root = world;
    props = key.split('.');
    if (props.length > 1) {
      while (props.length > 1) {
        root = root[props.pop()];
      }
      key = props[0];
    }
    root[key] = makeObject(val);
  }
}
this.unpackJson = unpackJson;

var User = new Constructor('User',
  function(init) {
    this.name = init && init.name || new Val('');
    this.picUrl = init && init.picUrl || new Val('');
  }
);
var Message = new Constructor('Message',
  function(init) {
    this.user = init && init.user || new User;
    this.comment = init && init.comment || new Val('');
  }
);

var outMessage = function(message) {
  var picId = uniqueId(),
      nameId = uniqueId(),
      commentId = uniqueId();
  addAttributeUpdater(picId, 'src', message.user.picUrl);
  addInnerUpdater(nameId, message.user.name);
  addInnerUpdater(commentId, message.comment);
  
  return '<li> \
    <img id=' + picId + ' src="' + message.user.picUrl.get() + '" class=pic> \
    <div class=message> \
      <p><b id=' + nameId + '>' + message.user.name.get() + '</b> \
      <p id=' + commentId + '>' + message.comment.get() + '</div>'
}

var outBody = function() {
  var session = world.session,
      messages = world.messages;
  addListUpdater('messageList', outMessage, messages);
  addAttributeUpdater('inputPic', 'src', session.user.picUrl);
  addAttributeUpdater('inputName', 'value', session.user.name);
  addPropertyUpdater('commentInput', 'value', session.newComment);
  
  return '<ul id=messageList>' + outList(outMessage, messages) + '</ul> \
    <div id=foot> \
      <img id=inputPic src="' + session.user.picUrl.get() + '" class=pic> \
      <div id=inputs> \
        <input id=inputName onkeyup=world.session.user.name.set(this.value) value="' + session.user.name.get() + '"> <b>(your nickname)</b> \
        <form action=javascript:postMessage() style=position:relative;margin-top:6px;padding-right:6px> \
          <input id=commentInput style=width:100% onkeyup=world.session.newComment.setSilent(this.value) value="' + session.newComment.get() + '"> \
        </form> \
      </div> \
    </div>'
}
this.outBody = outBody;

var postMessage = function() {
  world.messages.push(
    new Message({
      user: world.session.user,
      comment: new Val(world.session.newComment.get())
    })
  );
  world.session.newComment.set('');
}

var world = {};
this.world = world;
world._items = [];
world.addItem = function(key, value) {
  this._items.push(key);
  this[key] = value;
}
world.toJSON = function() {
  var obj = [], i, item, items = this._items;
  for (i = 0; item = items[i++];) {
    obj.push(item, this[item]);
  }
  return obj;
}

if (isServer) {
  world.addItem('users', [
    new User({
      name: new Val('Nate'),
      picUrl: new Val('http://nateps.com/resume/nate_smith_92x92.jpg')
    })
  ]);
  world.addItem('session', {
    user: makeRef(world, 'users.0'),
    newComment: new Val('')
  });
  world.addItem('messages', new List);
}