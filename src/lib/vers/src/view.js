require('./utils')((function(){return this})());
var htmlParser = require('./htmlParser'),
    views = {},
    loadFuncs = '',
    clientName, model, dom;

exports.setModel = function(o) {
  model = o;
}
exports.setDom = function(o) {
  dom = o;
}
exports.setClientName = function(s) {
  clientName = s;
}

var uniqueId = exports.uniqueId = function() {
  return '_' + (uniqueId._count++).toString(36);
};
uniqueId._count = 0;

var get = exports._get = function(func, obj) {
  func = views[func];
  return (func) ?
    (isArray(obj) ? obj.reduce(function(memo, item) {
      return memo + func(item);
    }, '') : func(obj)) :
    null;
}

function parse(template) {
  var stack = [],
      events = [],
      html = [''],
      htmlIndex = 0,
      placeholder = /^(\{{2,3})(\w+)\}{2,3}$/,
      elementParse;
  
  // Borrowed from Mustache.js
  function htmlEscape(s) {
    s = String(s === null ? '' : s);
    return s.replace(/&(?!\w+;)|["'<>\\]/g, function(s) {
      switch(s) {
        case '&': return '&amp;';
        case '\\': return '\\\\';
        case '"': return '&quot;';
        case "'": return '&#39;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        default: return s;
      }
    });
  }

  function modelText(name, escaped) {
    return function(data) {
      var datum = data[name],
          obj = datum.model ? model.get(datum.model) : datum;
      if (isString(obj)) obj = htmlEscape(obj);
      return datum.view ? get(datum.view, obj) : obj;
    }
  }
  
  elementParse = {
    input: function(attr, attrs, name) {
      var method, setMethod, domArgs;
      if (attr === 'value') {
        method = 'propLazy';
        setMethod = 'set';
        if (attrs.silent) {
          method = 'prop';
          setMethod = 'setSilent';
          // This need not be in the HTML output
          delete attrs.silent;
        }
        events.push(function(data) {
          domArgs = [setMethod, data[name].model, attrs._id || attrs.id, 'prop', 'value'];
          dom.events.bind('keyup', domArgs);
          dom.events.bind('keydown', domArgs);
        });
      } else {
        method = 'attr';
      }
      return method;
    }
  }
  
  htmlParser.parse(template, {
    start: function(tag, attrs) {
      forEach(attrs, function(key, value) {
        var match, name, escaped, method, setMethod;
        match = placeholder.exec(value);
        if (match) {
          escaped = match[1] === '{{';
          name = match[2];
          if (isUndefined(attrs.id)) {
            attrs.id = function() { return attrs._id = uniqueId(); };
          }
          method = (tag in elementParse) ?
            elementParse[tag](key, attrs, name) : 'attr';
          events.push(function(data) {
            var path = data[name].model;
            if (path) {
              model.events.bind(path, [attrs._id || attrs.id, method, key]);
            }
          });
          attrs[key] = modelText(name, escaped);
        }
      });
      stack.push(['start', tag, attrs]);
    },
    chars: function(text) {
      var last = stack[stack.length - 1],
          attrs, match, name, escaped;
      match = placeholder.exec(text);
      if (match) {
        escaped = match[1] === '{{';
        name = match[2];
        text = modelText(name, escaped);
        if (last[0] === 'start') {
          attrs = last[2];
          if (isUndefined(attrs.id)) {
            attrs.id = function() { return attrs._id = uniqueId(); };
          }          
          events.push(function(data) {
            var path = data[name].model;
            if (path) {
              model.events.bind(path,
                [attrs._id || attrs.id, 'html', null, data[name].view]
              );
            }
          });
        }
      }
      stack.push(['chars', text]);
    },
    end: function(tag) {
      stack.push(['end', tag]);
    }
  });

  stack.forEach(function(item) {
    function pushValue(value) {
      if (isFunction(value)) {
        htmlIndex = html.push(value, '') - 1;
      } else {
        html[htmlIndex] += value;
      }
    }
    switch (item[0]) {
      case 'start':
        html[htmlIndex] += '<' + item[1];
        forEach(item[2], function(key, value) {
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

  return function(data, obj) {
    var rendered = html.reduce(function(memo, item) {
      return memo + (isFunction(item) ? item(data) : item);
    }, '');
    events.forEach(function(item) { item(data); });
    return rendered;
  };
}

var preLoad = exports.preLoad = function(func) {
  loadFuncs += '(' + func.toString() + ')();';
}

exports.make = function(name, data, template, after) {
  var render = parse(template),
      func = isFunction(data) ?
        function() { return render(data.apply(null, arguments)); } :
        function() { return render(data); };
  if (onServer) {
    if (after) preLoad(after);
    views[name] = func;
  } else {
    views[name] = (after) ?
      function() {
        setTimeout(after, 0);
        return func.apply(null, arguments);
      } : func;
  }
};

if (onServer) {
  exports.server = function() {
    var jsmin = require('jsmin').jsmin;
    model.events._names = {};
    dom.events._names = {};
    uniqueId._count = 0;
    return get('body') +
      '<script>function $(s){return document.getElementById(s)}' + 
      jsmin(loadFuncs) + '</script>' +
      '<script src=/socket.io/socket.io.js></script>' +
      '<script src=/browserify.js></script>' +
      '<script>var ' + clientName + '=require("./' + clientName + '")(' +
      uniqueId._count + ',' +
      JSON.stringify(model.get()).replace(/<\//g, '<\\/') + ',' +
      JSON.stringify(model.events._names) + ',' +
      JSON.stringify(dom.events._names) + ');</script>';
  };
}
