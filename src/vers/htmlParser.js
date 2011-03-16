// Modified from HTML Parser By John Resig (ejohn.org)
// http://ejohn.org/blog/pure-javascript-html-parser/
// Original code by Erik Arvidsson, Mozilla Public License
// http://erik.eae.net/simplehtmlparser/simplehtmlparser.js

var _ = require('underscore'),
    // Regular Expressions for parsing
    startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
    endTag = /^<\/(\w+)[^>]*>/,
    attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,
    // HTML elements
    empty = makeMap('area,base,br,col,embed,hr,img,input,link,meta,param,source'),
    block = makeMap('address,area,article,aside,blockquote,body,caption,colgroup,dd,details,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,link,menu,meta,nav,ol,p,param,pre,section,summary,table,tbody,td,tfoot,th,thead,title,tr,ul'),
    inline = makeMap('a,abbr,audio,b,base,bdo,br,button,canvas,cite,code,command,embed,datalist,del,dfn,em,i,iframe,img,input,ins,keygen,kbd,label,map,mark,meter,noscript,object,optgroup,option,output,progress,q,rp,rt,ruby,samp,select,source,span,strike,strong,sub,sup,textarea,time,var,video,wbr'),
    // Elements that close themselves when left open
    closeSelf = makeMap('colgroup,dd,dt,li,option,p,td,tfoot,th,thead,tr'),
    // Attributes that have their values filled in (Ex: disabled="disabled")
    fillAttrs = makeMap('silent,checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected'),
    // Special Elements (can contain anything)
    special = makeMap('script,style');

function makeMap(list) {
  return _.reduce(list.split(','), function(memo, item) {
    memo[item] = true;
    return memo;
  }, {});
}

var parse = this.parse = function(html, handler) {
  var charsHandler = handler && handler.chars,
      startHandler = handler && handler.start,
      endHandler = handler && handler.end,
      stack = [],
      last, index, chars, match;
  
  stack.last = function() {
    return this[this.length - 1];
  };
  
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

    var attrs = {};
    rest.replace(attr, function(match, name) {
      var value = arguments[2] ? arguments[2] :
        arguments[3] ? arguments[3] :
        arguments[4] ? arguments[4] :
        fillAttrs[name] ? name : '';
      attrs[name] = value;
    });
    if (startHandler) startHandler(tagName, attrs, unary);
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
        if (endHandler) endHandler(stack[i]);
      }
      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
  
  // Remove all comments
  html = html.replace(/<!--(.*?)-->/g, '')
    .replace(/<!\[CDATA\[(.*?)]]>/g, '');
  
  while (html) {
    last = html;
    chars = true;

    // Special elements include script and style elements
    if (special[stack.last()]) {
      
      html = html.replace(new RegExp('(.*)<\/' + stack.last() + '[^>]*>'), 
        function(all, text){
          if (charsHandler) charsHandler(text);
          return '';
        }
      );
      parseEndTag('', stack.last());
      
    } else {
      
      // End tag
      if (html[0] === '<' && html[1] === '/') {
        match = html.match(endTag);
        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(endTag, parseEndTag);
          chars = false;
        }

      // Start tag
      } else if (html[0] === '<') {
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
        if (charsHandler) charsHandler(text);
      }

    }

    if (html === last) {
      throw 'Parse Error: ' + html;
    }
  }

  // Clean up any remaining tags
  parseEndTag();
};