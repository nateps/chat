var _ = require('./utils'),
    htmlParser = require('./htmlParser'),
    views = {},
    loadFuncs = '',
    clientName, dom, model;

exports._link = function(d, m) {
  dom = d;
  model = m;
}
exports._setClientName = function(s) {
  clientName = s;
};

var uniqueId = exports.uniqueId = function() {
  return '_' + (uniqueId._count++).toString(36);
};
uniqueId._count = 0;

var get = exports._get = function(view, obj) {
  view = views[view];
  return (view) ?
    (_.isArray(obj) ? obj.reduce(function(memo, item) {
      return memo + view(item);
    }, '') : view(obj)) : '';
};

// Borrowed from Mustache.js
var htmlEscape = exports.htmlEscape = function(s) {
  s = String(s === null ? '' : s);
  return s.replace(/&(?!\w+;)|["'<>\\]/g, function(s) {
    switch (s) {
      case '&': return '&amp;';
      case '\\': return '\\\\';
      case '"': return '&quot;';
      case "'": return '&#39;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      default: return s;
    }
  });
};

function parse(template) {
  var stack = [],
      events = [],
      html = [''],
      htmlIndex = 0,
      placeholder = /^(\{{2,3})(\w+)\}{2,3}$/,
      elementParse;

  function modelText(name, escaped, quote) {
    return function(data) {
      var datum = data[name],
          obj = datum.model ? model.get(datum.model) : datum,
          text = datum.view ? get(datum.view, obj) : obj;
      if (escaped) text = htmlEscape(text);
      if (quote && text && text.indexOf(' ') !== -1) text = '"' + text + '"';
      return text;
    }
  }
  
  elementParse = {
    input: function(attr, attrs, name) {
      var method, setMethod, domArgs;
      if (attr === 'value') {
        method = 'propLazy';
        setMethod = 'set';
        if ('silent' in attrs) {
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
      _.forEach(attrs, function(key, value) {
        var match, name, escaped, method, setMethod;
        match = placeholder.exec(value);
        if (match) {
          escaped = match[1] === '{{';
          name = match[2];
          if (_.isUndefined(attrs.id)) {
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
          attrs[key] = modelText(name, escaped, true);
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
          if (_.isUndefined(attrs.id)) {
            attrs.id = function() { return attrs._id = uniqueId(); };
          }          
          events.push(function(data) {
            var path = data[name].model;
            if (path) {
              model.events.bind(path,
                [attrs._id || attrs.id, 'html', escaped, data[name].view]
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
    function pushValue(value, quote) {
      if (_.isFunction(value)) {
        htmlIndex = html.push(value, '') - 1;
      } else {
        html[htmlIndex] += (quote && value && value.indexOf(' ') !== -1) ?
          '"' + value + '"' : value;
      }
    }
    switch (item[0]) {
      case 'start':
        html[htmlIndex] += '<' + item[1];
        _.forEach(item[2], function(key, value) {
          html[htmlIndex] += ' ' + key + '=';
          pushValue(value, true);
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
      return memo + (_.isFunction(item) ? item(data) : item);
    }, '');
    events.forEach(function(item) { item(data); });
    return rendered;
  };
};

var preLoad = exports.preLoad = function(func) {
  loadFuncs += '(' + func.toString() + ')();';
};

function simpleView(name) {
  return function(datum) {
    var path = datum.model,
        obj = path ? model.get(path) : datum,
        text = datum.view ? get(datum.view, obj) : obj;
    if (path) {
      if (name === 'Title') {
        model.events.bind(path, ['__document', 'prop', 'title']);
      }
    }
    return text;
  };
};

exports.make = function(name, data, template, after) {
  var render = (template) ? parse(template) : simpleView(name),
      func = _.isFunction(data) ?
        function() { return render(data.apply(null, arguments)); } :
        function() { return render(data); };
  if (_.onServer) {
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

if (_.onServer) {
  exports.html = function() {
    var jsmin = require('jsmin').jsmin;
    model.events._names = {};
    dom.events._names = {};
    uniqueId._count = 0;
    return '<!DOCTYPE html>' +
      '<title>' + get('Title') + '</title>' + get('Head') + get('Body') +
      '<script>function $(s){return document.getElementById(s)}' + 
      jsmin(loadFuncs) + '</script>' +
      '<script src=/browserify.js></script>' +
      '<script>var ' + clientName + '=require("./' + clientName + '")(' +
      uniqueId._count + ',' +
      JSON.stringify(model.get()).replace(/<\//g, '<\\/') + ',' +
      JSON.stringify(model.events._names) + ',' +
      JSON.stringify(dom.events._names) + ');</script>' + get('Foot');
  };
}
