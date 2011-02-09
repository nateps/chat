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
      fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected'),
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
    return {
      body: out.body(),
      script: 'uniqueId._count=' + uniqueId._count + ';' +
      'model.events._names=' + JSON.stringify(model.events._names) + ';' +
      'dom.events._names=' + JSON.stringify(dom.events._names) + ';' +
      'model.init(' + JSON.stringify(model.get()) + ');'
    }
  },
  _parse: function(data, template) {
    var stack = [],
        placeholder = /^(\{{2,3})(\w+)\}{2,3}$/,
        html;
    stack.last = function() {
      return this[this.length - 1];
    };
    function getModelText(datum, escaped) {
      var obj = model.get(datum.model),
          transform = datum.transform;
      return (_.isArray(obj) && transform) ? out._list(obj, out[transform]) : obj;
    }

    htmlParser(template, {
      start: function(tag, attrs) {
        var match, datum, escaped, method, domArgs;
        _.each(attrs, function(value, key) {
          match = placeholder.exec(value);
          if (match) {
            hasPlaceholder = true;
            escaped = match[1] === '{{';
            datum = data[match[2]];
            if (_.isUndefined(attrs.id)) {
              attrs.id = uniqueId();
            }
            method = 'attr';
            if (tag === 'input' && key === 'value') {
              domArgs = ['set', datum.model, attrs.id, 'prop', 'value'];
              method = 'propLazy';
              if (datum.silent) {
                domArgs[0] = 'setSilent';
                method = 'prop';
              }
              dom.events.bind('keyup', domArgs);
              dom.events.bind('keydown', domArgs);
            }
            model.events.bind(datum.model, [attrs.id, method, key]);
            attrs[key] = getModelText(datum, escaped);
          }
        });
        stack.push(['start', tag, attrs]);
      },
      chars: function(text) {
        var last = stack.last(),
            attrs, match, datum, escaped;      
        match = placeholder.exec(text);
        if (match) {
          escaped = match[1] === '{{';
          datum = data[match[2]];
          text = getModelText(datum, escaped);
          if (last[0] === 'start') {
            attrs = last[2];
            if (_.isUndefined(attrs.id)) {
              attrs.id = uniqueId();
            }
            model.events.bind(datum.model, [attrs.id, 'html', null, datum.transform]);
          }
        }
        stack.push(['chars', text]);
      },
      end: function(tag) {
        stack.push(['end', tag]);
      }
    });

    html = _.reduce(stack, function(memo, item) {
      switch (item[0]) {
        case 'start':
          return memo + '<' + item[1] +
            _.reduce(item[2], function(attrs, value, key) {
              return attrs + ' ' + key + '="' + value + '"';
            }, '') + '>';
        case 'chars':
          return memo + item[1];
        case 'end':
          return memo + '</' + item[1] + '>';
      }
    }, '');

    return html;
  }
}

out.message = function(message, index) {
  return out._parse({
      userPicUrl: { model: 'users.' + message.userId + '.picUrl' },
      userName: { model: 'users.' + message.userId + '.name' },
      comment: { model: 'messages.' + index + '.comment' }
    },
    '<li><img src="{{{userPicUrl}}}" class=pic>' +
      '<div class=message>' +
        '<p><b>{{userName}}</b>' +
        '<p>{{comment}}' +
      '</div>'
  );
};

out.body = function() {
  return out._parse({
      messages: { model: 'messages', transform: 'message' },
      userPicUrl: { model: 'session.user.picUrl' },
      userName: { model: 'session.user.name' },
      newComment: { model: 'session.newComment', silent: true }
    },
    '<ul id=messageList>{{{messages}}}</ul>' +
      '<div id=foot>' +
        '<img id=inputPic src="{{{userPicUrl}}}" class=pic>' +
        '<div id=inputs>' +
          '<input id=inputName value="{{userName}}"> <b>(your nickname)</b>' +
          '<form id=inputForm action=javascript:postMessage()>' +
            '<input id=commentInput value="{{newComment}}">' +
          '</form>' +
        '</div>' +
      '</div>'
  );
};

var postMessage = function() {
  model.push('messages', {
    userId: model.get('session.userId'),
    comment: model.get('session.newComment')
  });
  model.set('session.newComment', '');
}
