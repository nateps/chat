
function makeMap(list) {
  return list.split(',').reduce(function(memo, item) {
    memo[item] = true;
    return memo;
  }, {});
}

// Regular Expressions for parsing
var startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
    endTag = /^<\/(\w+)[^>]*>/,
    attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

// HTML elements
var empty = makeMap('area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed'),
    block = makeMap('address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul'),
    inline = makeMap('a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var'),
    // Elements that close themselves when left open
    closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr'),
    // Attributes that have their values filled in disabled="disabled"
    fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected');


var parser = this.parser = function(input, handler) {
  var scope = [{}],
      blocks = [],
      stack = [],
      htmlMode = true,
      block, last, index, chars, match;
  stack.last = function() {
    return this[this.length - 1];
  };
  
  function parseStartTag(tag, tagName, rest, unary) {
    if (block[tagName]) {
      while (stack.last() && inline[stack.last()]) {
        parseEndTag('', stack.last());
      }
    }
    
    if (closeSelf[tagName] && stack.last() == tagName) {
      parseEndTag('', tagName);
    }
    
    unary = empty[tagName] || !!unary;
    if (!unary)
      stack.push(tagName);
    
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
      if (handler.start)
        handler.start(tagName, attrs, unary);
    }
  }

  function parseEndTag(tag, tagName) {
    // If no tag name is provided, clean shop
    if (!tagName)
      var pos = 0;
      
    // Find the closest opened tag of the same type
    else
      for (var pos = stack.length - 1; pos >= 0; pos--)
        if (stack[pos] == tagName)
          break;
    
    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--)
        if (handler.end)
          handler.end(stack[i]);
      
      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
  
  while (input) {
    last = input;
    
    if (htmlMode) {
      chars = true;
      if (!stack.last()) {

        // Comment
        if (input.indexOf('<!--') == 0) {
          index = input.indexOf('-->');
          if (index >= 0) {
            if (handler.comment)
              handler.comment(input.substring(4, index));
            input = input.substring(index + 3);
            chars = false;
          }

        // End tag
        } else if (input.indexOf('</') == 0) {
          match = input.match(endTag);
          if (match) {
            input = input.substring(match[0].length);
            match[0].replace(endTag, parseEndTag);
            chars = false;
          }

        // Start tag
        } else if (input.indexOf('<') == 0) {
          match = input.match(startTag);
          if (match) {
            input = input.substring(match[0].length);
            match[0].replace(startTag, parseStartTag);
            chars = false;
          }
        }

        if (chars) {
          index = input.indexOf('<');
          var text = index < 0 ? input : input.substring(0, index);
          input = index < 0 ? '' : input.substring(index);
          if (handler.chars)
            handler.chars(text);
        }

      } else {
        input = input.replace(new RegExp('(.*)<\/' + stack.last() + '[^>]*>'), function(all, text){
          text = text.replace(/<!--(.*?)-->/g, '$1')
            .replace(/<!\[CDATA\[(.*?)]]>/g, '$1');
          if (handler.chars)
            handler.chars(text);
          return '';
        });

        parseEndTag('', stack.last());
      }
      
    } else {
    
      // Start of a function
      if (input.indexOf('function') == 0) {
        match = input.match(/^function[\s(].*?{/);
        if (match) {
          input = input.substring(match[0].length);
          scope.push({});
          blocks.push('function');
        }
      }
      
      } else if (input.indexOf('{') == 0) {
        input = input.substring(1);
        blocks.push('other');
      
      } else if (input.indexOf('}') == 0) {
        input = input.substring(1);
        block = blocks.pop();
        console.log(block);
      
      } else {
        
      }
    }
    
    if (input == last)
      throw 'Parse Error: ' + input;
  }
}