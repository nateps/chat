require('./utils')((function(){return this})());
var htmlParser = require('./htmlParser'),
    views = {},
    model, dom;

exports.setModel = function(o) {
  model = o;
}
exports.setDom = function(o) {
  dom = o;
}

var uniqueId = this.uniqueId = function() {
  return '_' + (uniqueId._count++).toString(36);
};
uniqueId._count = 0;

var get = this._get = function(func, obj) {
  func = views[func];
  return (func) ?
    (Array.isArray(obj) ? obj.reduce(function(memo, item, index) {
      return memo + func(item, index);
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

  function modelText(name, escaped) {
    return function(data) {
      var datum = data[name],
          obj = model.get(datum.model);
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
            method = elementParse[tag](key, attrs, name) :
            'attr';
          events.push(function(data) {
            model.events.bind(data[name].model, [attrs._id || attrs.id, method, key]);
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
            model.events.bind(data[name].model,
              [attrs._id || attrs.id, 'html', null, data[name].view]
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

  return function(data) {
    var rendered = html.reduce(function(memo, item) {
      return memo + (isFunction(item) ? item(data) : item);
    }, '');
    events.forEach(function(item) { item(data); });
    return rendered;
  };
}

this.make = function(name, data, template, after) {
  var render = parse(template);
  views[name] = isFunction(data) ?
    ((after && !onServer) ?
      function() {
        setTimeout(after, 0);
        return render(data.apply(null, arguments));
      } :
      function() {
        return render(data.apply(null, arguments));
      }) :
    ((after && !onServer) ?
      function() {
        setTimeout(after, 0);
        return render(data);
      } :
      function() {
        return render(data);
      });
};

this.server = function() {
  model.events._names = {};
  dom.events._names = {};
  uniqueId._count = 0;
  return {
    body: get('body'),
    script: 'chat.view.uniqueId._count=' + uniqueId._count + ';' +
    'chat.dom.events._names=' + JSON.stringify(dom.events._names) + ';' +
    'chat.model.events._names=' + JSON.stringify(model.events._names) + ';' +
    'chat.model.init(' + JSON.stringify(model.get()) + ');'
  }
};