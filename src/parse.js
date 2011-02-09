
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
      var attrs = [];
      rest.replace(attr, function(match, name) {
        var value = arguments[2] ? arguments[2] :
          arguments[3] ? arguments[3] :
          arguments[4] ? arguments[4] :
          fillAttrs[name] ? name : '';
        attrs.push({
          name: name,
          value: value,
          escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
        });
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
}
