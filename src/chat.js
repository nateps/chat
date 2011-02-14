"use strict";

var isServer = typeof window === 'undefined';
var socket;

if (isServer) {
  var _ = require('underscore');
} else {
  socket = new io.Socket(null, {port: 8001});
  socket.connect();
  socket.on('message', function(message) {
    message = JSON.parse(message);
    model['_' + message[0]].apply(null, message[1]);
  });
}
this.setSocket = function(s) {
  socket = s;
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
        propLazy: function(value, el, prop) {
          if (el !== document.activeElement) el[prop] = value;
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
        if (_.isUndefined(obj)) return false; // Remove bad event handler
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
        // Set the object to itself to trigger change event
        set(pathName, get(pathName));
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
        if (_.isUndefined(obj)) return null; // Return null if not found
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
      [method, _.toArray(args)]
    );
    if (isServer) {
      if (broadcast && socket) {
        socket.broadcast(message);
      }
    } else {
      socket.send(message);
    }
  };
  
  var _set = that._set = function(path, value, silent, sendUpdate, broadcast) {
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
  var set = that.set = function(path, value, broadcast) {
    _set(path, value, false, true, broadcast);
  };
  var setSilent = that.setSilent = function(path, value) {
    _set(path, value, true);
  };
  
  var _push = that._push = function(name, value, sendUpdate, broadcast) {
    var arr = world[name];
    arr.push(value);
    events.trigger(name, arr);
    if (sendUpdate) send('push', [name, value], broadcast);
  };
  var push = that.push = function(name, value, broadcast) {
    _push(name, value, true, broadcast);
  };
  
  that.ref = function(ref, key) {
    return {_r: ref, _k: key};
  };
  that.init = function(value) {
    world = value;
  };
  return that;
})();

var uniqueId = function() {
  return '_' + (uniqueId._count++).toString(36);
};
uniqueId._count = 0;

var arrayLast = function() {
  return this[this.length - 1];
}

// HTML Parser By John Resig (ejohn.org)
// http://ejohn.org/blog/pure-javascript-html-parser/
// Original code by Erik Arvidsson, Mozilla Public License
// http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 
var htmlParser = function(html, handler) {
  // Regular Expressions for parsing
  var startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
      endTag = /^<\/(\w+)[^>]*>/,
      attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,
      // HTML elements
      empty = makeMap('area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed'),
      block = makeMap('address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul'),
      inline = makeMap('a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var'),
      // Elements that close themselves when left open
      closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr'),
      // Attributes that have their values filled in (Ex: disabled="disabled")
      fillAttrs = makeMap('silent,checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected'),
      // Special Elements (can contain anything)
      special = makeMap("script,style"),
      stack = [],
      last, index, chars, match;
  stack.last = function() {
    return this[this.length - 1];
  };
  
  function makeMap(list) {
    return _.reduce(list.split(','), function(memo, item) {
      memo[item] = true;
      return memo;
    }, {});
  }
  
  function parseStartTag(tag, tagName, rest, unary) {
    if (block[tagName]) {
      while (stack.last() && inline[stack.last()]) {
        parseEndTag('', stack.last());
      }
    }
    if (closeSelf[tagName] && stack.last() === tagName) {
      parseEndTag('', tagName);
    }
    unary = empty[tagName] || !!unary;
    if (!unary) stack.push(tagName);
    
    if (handler.start) {
      var attrs = {};
      rest.replace(attr, function(match, name) {
        var value = arguments[2] ? arguments[2] :
          arguments[3] ? arguments[3] :
          arguments[4] ? arguments[4] :
          fillAttrs[name] ? name : '';
        attrs[name] = value;
      });
      if (handler.start) handler.start(tagName, attrs, unary);
    }
  }

  function parseEndTag(tag, tagName) {
    // If no tag name is provided, clean shop
    if (!tagName) {
      var pos = 0;
    // Find the closest opened tag of the same type
    } else {
      for (var pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos] === tagName) break;
      }
    }
    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if (handler.end) handler.end(stack[i]);
      }
      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
  
  while (html) {
    last = html;
    chars = true;
    
    // Make sure we're not in a script or style element
    if (!stack.last() || !special[stack.last()]) {

      // Comment
      if (html.indexOf('<!--') === 0) {
        index = html.indexOf('-->');
        if (index >= 0) {
          if (handler.comment) handler.comment(html.substring(4, index));
          html = html.substring(index + 3);
          chars = false;
        }

      // End tag
      } else if (html.indexOf('</') === 0) {
        match = html.match(endTag);
        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(endTag, parseEndTag);
          chars = false;
        }

      // Start tag
      } else if (html.indexOf('<') === 0) {
        match = html.match(startTag);
        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(startTag, parseStartTag);
          chars = false;
        }
      }

      if (chars) {
        index = html.indexOf('<');
        var text = index < 0 ? html : html.substring(0, index);
        html = index < 0 ? '' : html.substring(index);
        if (handler.chars) handler.chars(text);
      }

    } else {
      html = html.replace(new RegExp('(.*)<\/' + stack.last() + '[^>]*>'), function(all, text){
        text = text.replace(/<!--(.*?)-->/g, '$1')
          .replace(/<!\[CDATA\[(.*?)]]>/g, '$1');
        if (handler.chars) handler.chars(text);
        return '';
      });
      parseEndTag('', stack.last());
    }
    
    if (html === last) {
      throw 'Parse Error: ' + html;
    }
  }
  
  // Clean up any remaining tags
  parseEndTag();
};

var out = this.out = {
  _list: function(items, func) {
    return _.reduce(items, function(memo, item, index) {
      return memo + func(item, index);
    }, '');
  },
  _server: function() {
    model.events._names = {};
    dom.events._names = {};
    uniqueId._count = 0;
    return {
      body: out.body(),
      script: 'uniqueId._count=' + uniqueId._count + ';' +
      'model.events._names=' + JSON.stringify(model.events._names) + ';' +
      'dom.events._names=' + JSON.stringify(dom.events._names) + ';' +
      'model.init(' + JSON.stringify(model.get()) + ');'
    }
  },
  _parse: function(template) {
    var stack = [],
        events = [],
        html = [''],
        htmlIndex = 0,
        placeholder = /^(\{{2,3})(\w+)\}{2,3}$/;
    stack.last = function() {
      return this[this.length - 1];
    };
    
    function modelText(name, escaped) {
      return function(data) {
        var datum = data[name],
            obj = model.get(datum.model);
        return (_.isArray(obj) && datum.transform) ?
          out._list(obj, out[datum.transform]) : obj;
      }
    }
    
    htmlParser(template, {
      start: function(tag, attrs) {
        _.each(attrs, function(value, key) {
          var match, name, escaped, method, setMethod;
          match = placeholder.exec(value);
          if (match) {
            escaped = match[1] === '{{';
            name = match[2];
            if (_.isUndefined(attrs.id)) {
              attrs.id = function() { return attrs._id = uniqueId(); };
            }
            method = 'attr';
            if (tag === 'input' && key === 'value') {
              method = 'propLazy';
              setMethod = 'set';
              if (attrs.silent) {
                method = 'prop';
                setMethod = 'setSilent';
              }
              events.push(function(data) {
                var domArgs = [setMethod, data[name].model, attrs._id || attrs.id, 'prop', 'value'];
                dom.events.bind('keyup', domArgs);
                dom.events.bind('keydown', domArgs);
              });
            }
            events.push(function(data) {
              model.events.bind(data[name].model, [attrs._id || attrs.id, method, key]);
            });
            attrs[key] = modelText(name, escaped);
          }
        });
        stack.push(['start', tag, attrs]);
      },
      chars: function(text) {
        var last = stack.last(),
            attrs, match, name, escaped;
        match = placeholder.exec(text);
        if (match) {
          escaped = match[1] === '{{';
          name = match[2];
          text = modelText(name, escaped);
          if (last[0] === 'start') {
            attrs = last[2];
            if (_.isUndefined(attrs.id)) {
              attrs.id = function() { return attrs._id = uniqueId(); };
            }
            events.push(function(data) {
              model.events.bind(data[name].model,
                [attrs._id || attrs.id, 'html', null, data[name].transform]
              );
            });
          }
        }
        stack.push(['chars', text]);
      },
      end: function(tag) {
        stack.push(['end', tag]);
      }
    });
    
    _.each(stack, function(item) {
      function pushValue(value) {
        if (_.isFunction(value)) {
          htmlIndex = html.push(value, '') - 1;
        } else {
          html[htmlIndex] += value;
        }
      }
      switch (item[0]) {
        case 'start':
          html[htmlIndex] += '<' + item[1];
          _.each(item[2], function(value, key) {
            html[htmlIndex] += ' ' + key + '="';
            pushValue(value);
            html[htmlIndex] += '"';
          });
          html[htmlIndex] += '>';
          return;
        case 'chars':
          pushValue(item[1]);
          return;
        case 'end':
          html[htmlIndex] += '</' + item[1] + '>';
      }
    });
    
    return function(data) {
      var rendered = _.reduce(html, function(memo, item) {
        return memo + (_.isFunction(item) ? item(data) : item);
      }, '');
      _.each(events, function(item) { item(data); });
      return rendered;
    };
  },
  _make: function(data, template, after) {
    var render = out._parse(template);
    return _.isFunction(data) ?
      ((after && !isServer) ?
        function() {
          setTimeout(after, 0);
          return render(data.apply(null, arguments));
        } :
        function() {
          return render(data.apply(null, arguments));
        }) :
      ((after && !isServer) ?
        function() {
          setTimeout(after, 0);
          return render(data);
        } :
        function() {
          return render(data);
        });
  }
}

model.init({
  users: {},
  messages: [],
  _session: {
    userId: 0,
    user: model.ref('users', '_session.userId'),
    newComment: ''
  }
});

out.message = out._make(
  function(item, index) {
    return {
      userPicUrl: { model: 'users.' + item.userId + '.picUrl' },
      userName: { model: 'users.' + item.userId + '.name' },
      comment: { model: 'messages.' + index + '.comment' }
    };
  },
  '<li><img src="{{{userPicUrl}}}" class=pic>' +
    '<div class=message>' +
      '<p><b>{{userName}}</b>' +
      '<p>{{comment}}' +
    '</div>',
  function() { window.scrollBy(0,9999); }
);

out.body = out._make({
    messages: { model: 'messages', transform: 'message' },
    userPicUrl: { model: '_session.user.picUrl' },
    userName: { model: '_session.user.name' },
    newComment: { model: '_session.newComment' }
  },
  '<ul id=messageList>{{{messages}}}</ul>' +
    '<div id=foot>' +
      '<img id=inputPic src="{{{userPicUrl}}}" class=pic>' +
      '<div id=inputs>' +
        '<input id=inputName value="{{userName}}">' +
        '<form id=inputForm action=javascript:postMessage()>' +
          '<input id=commentInput value="{{newComment}}" silent>' +
        '</form>' +
      '</div>' +
    '</div>'
);

var postMessage = function() {
  model.push('messages', {
    userId: model.get('_session.userId'),
    comment: model.get('_session.newComment')
  });
  model.set('_session.newComment', '');
}
