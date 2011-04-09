function require(a){var b=require.modules[a]||require.modules[a+".js"]||require.modules[a+"/index"]||require.modules[a+"/index.js"];if(!b)throw new Error("Cannot find module '"+a+"'");return b._cached?b._cached:b()}var _browserifyRequire=require;require.paths=[],require.modules={},require.fromFile=function(a,b){var c=_browserifyRequire.resolve(a,b);return _browserifyRequire(c)},require.resolve=function(a,b){if(!b.match(/^[\.\/]/))return b;if(b.match(/^\//))return b;var c=a.match(/^[\.\/]/)?a.replace(/[^\/]+$/,""):a;c===""&&(c=".");var d=/[^\/.]+\/\.\./g,e=/\/{2,}/g;for(var f=b;f.match(d)!=null||f.match(e)!=null;f=f.replace(d,"").replace(e,"/"));while(f.match(/^\.\.\//)){if(c==="/"||c==="")throw new Error("Couldn't resolve path'"+b+"' with respect to filename '"+a+"': "+"file can't resolve past base");f=f.replace(/^\.\.\//,""),c=c.replace(/[^\/]+\/$/,"")}var g=c.match(/\//)?c.replace(/[^\/]+$/,"")+f:f.replace(/^\.\//,c+"/");return g.replace(/\/.\//,"/")},typeof process=="undefined"&&(process={nextTick:function(a){setTimeout(a,0)},title:"browser"}),function(a){var b=Object.prototype.hasOwnProperty;Array.isArray||(Array.isArray=function(a){return Object.prototype.toString.call(a)=="[object Array]"}),Array.prototype.forEach||(Array.prototype.forEach=function(a,b){var c=this.length>>>0;for(var d=0;d<c;d++)d in this&&a.call(b,this[d],d,this)}),Array.prototype.map||(Array.prototype.map=function(a){var b=this.length>>>0;if(typeof a!="function")throw new TypeError;var c=Array(b),d=arguments[1];for(var e=0;e<b;e++)e in this&&(c[e]=a.call(d,this[e],e,this));return c}),Array.prototype.filter||(Array.prototype.filter=function(a){var b=[],c=arguments[1];for(var d=0;d<this.length;d++)a.call(c,this[d])&&b.push(this[d]);return b}),Array.prototype.every||(Array.prototype.every=function(a){var b=arguments[1];for(var c=0;c<this.length;c++)if(!a.call(b,this[c]))return!1;return!0}),Array.prototype.some||(Array.prototype.some=function(a){var b=arguments[1];for(var c=0;c<this.length;c++)if(a.call(b,this[c]))return!0;return!1}),Array.prototype.reduce||(Array.prototype.reduce=function(a){var b=this.length>>>0;if(typeof a!="function")throw new TypeError;if(b==0&&arguments.length==1)throw new TypeError;var c=0;if(arguments.length>=2)var d=arguments[1];else for(;;){if(c in this){d=this[c++];break}if(++c>=b)throw new TypeError}for(;c<b;c++)c in this&&(d=a.call(null,d,this[c],c,this));return d}),Array.prototype.reduceRight||(Array.prototype.reduceRight=function(a){var b=this.length>>>0;if(typeof a!="function")throw new TypeError;if(b==0&&arguments.length==1)throw new TypeError;var c=b-1;if(arguments.length>=2)var d=arguments[1];else for(;;){if(c in this){d=this[c--];break}if(--c<0)throw new TypeError}for(;c>=0;c--)c in this&&(d=a.call(null,d,this[c],c,this));return d}),Array.prototype.indexOf||(Array.prototype.indexOf=function(a){var c=this.length;if(!c)return-1;var d=arguments[1]||0;if(d>=c)return-1;d<0&&(d+=c);for(;d<c;d++){if(!b.call(this,d))continue;if(a===this[d])return d}return-1}),Array.prototype.lastIndexOf||(Array.prototype.lastIndexOf=function(a){var c=this.length;if(!c)return-1;var d=arguments[1]||c;d<0&&(d+=c),d=Math.min(d,c-1);for(;d>=0;d--){if(!b.call(this,d))continue;if(a===this[d])return d}return-1}),Object.getPrototypeOf||(Object.getPrototypeOf=function(a){return a.__proto__||a.constructor.prototype}),Object.getOwnPropertyDescriptor||(Object.getOwnPropertyDescriptor=function(c){if(typeof c!="object"&&typeof c!="function"||c===null)throw new TypeError("Object.getOwnPropertyDescriptor called on a non-object");return b.call(c,property)?{value:c[property],enumerable:!0,configurable:!0,writeable:!0}:a}),Object.getOwnPropertyNames||(Object.getOwnPropertyNames=function(a){return Object.keys(a)}),Object.create||(Object.create=function(a,b){var c;if(a===null)c={"__proto__":null};else{if(typeof a!="object")throw new TypeError("typeof prototype["+typeof a+"] != 'object'");var d=function(){};d.prototype=a,c=new d}typeof b!="undefined"&&Object.defineProperties(c,b);return c}),Object.defineProperty||(Object.defineProperty=function(a,c,d){if(typeof d=="object"&&a.__defineGetter__){if(b.call(d,"value")){!a.__lookupGetter__(c)&&!a.__lookupSetter__(c)&&(a[c]=d.value);if(b.call(d,"get")||b.call(d,"set"))throw new TypeError("Object doesn't support this action")}else typeof d.get=="function"&&a.__defineGetter__(c,d.get);typeof d.set=="function"&&a.__defineSetter__(c,d.set)}return a}),Object.defineProperties||(Object.defineProperties=function(a,c){for(var d in c)b.call(c,d)&&Object.defineProperty(a,d,c[d]);return a}),Object.seal||(Object.seal=function(a){return a}),Object.freeze||(Object.freeze=function(a){return a});try{Object.freeze(function(){})}catch(c){Object.freeze=function(a){return function(b){return typeof b=="function"?b:a(b)}}(Object.freeze)}Object.preventExtensions||(Object.preventExtensions=function(a){return a}),Object.isSealed||(Object.isSealed=function(a){return!1}),Object.isFrozen||(Object.isFrozen=function(a){return!1}),Object.isExtensible||(Object.isExtensible=function(a){return!0});if(!Object.keys){var d=!0,e=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],f=e.length;for(var g in{toString:null})d=!1;Object.keys=function(a){if(typeof a!="object"&&typeof a!="function"||a===null)throw new TypeError("Object.keys called on a non-object");var c=[];for(var g in a)b.call(a,g)&&c.push(g);if(d)for(var h=0,i=f;h<i;h++){var j=e[h];b.call(a,j)&&c.push(j)}return c}}Date.prototype.toISOString||(Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+(this.getUTCMonth()+1)+"-"+this.getUTCDate()+"T"+this.getUTCHours()+":"+this.getUTCMinutes()+":"+this.getUTCSeconds()+"Z"}),Date.now||(Date.now=function(){return(new Date).getTime()}),Date.prototype.toJSON||(Date.prototype.toJSON=function(a){if(typeof this.toISOString!="function")throw new TypeError;return this.toISOString()}),isNaN(Date.parse("T00:00"))&&(Date=function(b){var c=function(a,d,e,f,g,h,i){var j=arguments.length;if(this instanceof b){var k=j===1&&String(a)===a?new b(c.parse(a)):j>=7?new b(a,d,e,f,g,h,i):j>=6?new b(a,d,e,f,g,h):j>=5?new b(a,d,e,f,g):j>=4?new b(a,d,e,f):j>=3?new b(a,d,e):j>=2?new b(a,d):j>=1?new b(a):new b;k.constructor=c;return k}return b.apply(this,arguments)},d=new RegExp("^(?:((?:[+-]\\d\\d)?\\d\\d\\d\\d)(?:-(\\d\\d)(?:-(\\d\\d))?)?)?(?:T(\\d\\d):(\\d\\d)(?::(\\d\\d)(?:\\.(\\d\\d\\d))?)?)?(?:Z|([+-])(\\d\\d):(\\d\\d))?$");for(var e in b)c[e]=b[e];c.now=b.now,c.UTC=b.UTC,c.prototype=b.prototype,c.prototype.constructor=c,c.parse=function(c){var e=d.exec(c);if(e){e.shift();var f=e[0]===a;for(var g=0;g<10;g++){if(g===7)continue;e[g]=+(e[g]||(g<3?1:0)),g===1&&e[g]--}if(f)return((e[3]*60+e[4])*60+e[5])*1e3+e[6];var h=(e[8]*60+e[9])*60*1e3;e[6]==="-"&&(h=-h);return b.UTC.apply(this,e.slice(0,7))+h}return b.parse.apply(this,arguments)};return c}(Date));var h=Array.prototype.slice;Function.prototype.bind||(Function.prototype.bind=function(a){var b=this;if(typeof b.apply!="function"||typeof b.call!="function")return new TypeError;var c=h.call(arguments),d=function(){if(this instanceof d){var a=Object.create(b.prototype);b.apply(a,c.concat(h.call(arguments)));return a}return b.call.apply(b,c.concat(h.call(arguments)))};d.bound=b,d.boundTo=a,d.boundArgs=c,d.length=typeof b=="function"?Math.max(b.length-c.length,0):0;return d});if(!String.prototype.trim){var i=/^\s\s*/,j=/\s\s*$/;String.prototype.trim=function(){return String(this).replace(i,"").replace(j,"")}}}(),_browserifyRequire.modules.vers=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/index.js",e=function(a){return _browserifyRequire.fromFile("vers",a)};(function(){a.exports=e("./lib/vers")}).call(a.exports),_browserifyRequire.modules.vers._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/dom"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/dom.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/dom",a)};(function(){var a=e("./utils"),c=e("./EventDispatcher"),d={attr:function(a,b){return a.getAttribute(b)},prop:function(a,b){return a[b]},html:function(a){return a.innerHTML}},f;b._link=function(a){f=a};var g=b.events=new c(function(a,b){var c=a[0],e=a[1],g=a[2],h=a[3],i=a[4],j,k;if(g===b){j=document.getElementById(g);if(!j)return!1;k=d[h](j,i),f[c].apply(null,[e,k])}return!0}),h=function(a){var a=a||event,b=a.target||a.srcElement;b.nodeType===3&&(b=b.parentNode),g.trigger(a.type,b.id)};a.onServer||["keyup","keydown"].forEach(function(a){document["on"+a]=h})}).call(a.exports),_browserifyRequire.modules["vers/lib/dom"]._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/EventDispatcher"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/EventDispatcher.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/EventDispatcher",a)};(function(){var b=e("./utils"),c=a.exports=function(a,b){this._triggerCallback=a,b&&(this.bind=function(a,d){b(a,d)&&c.prototype.bind.call(this,a,d)}),this._names={}};c.prototype={bind:function(a,b){var c=this._names,d=JSON.stringify(b),e=c[a]||{};e[d]=!0,c[a]=e},unbind:function(a,b){var c=this._names,d=JSON.stringify(b);delete c[a][d]},trigger:function(a,c,d){var e=this._names,f=e[a],g=this._triggerCallback;f&&!b.onServer&&Object.keys(f).forEach(function(a){var b=JSON.parse(a);g(b,c,d)||delete f[a]})},get:function(){var a=this._names,b={};Object.keys(a).forEach(function(c){b[c]=Object.keys(a[c]).map(function(a){return a.replace(/"/g,"'")})});return b},set:function(a){var b=this._names;Object.keys(a).forEach(function(c){var d=b[c]={},e=a[c];e.forEach(function(a){d[a.replace(/'/g,'"')]=!0})})}}}).call(a.exports),_browserifyRequire.modules["vers/lib/EventDispatcher"]._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/htmlParser"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/htmlParser.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/htmlParser",a)};(function(){function f(a){return a.split(",").reduce(function(a,b){a[b]=!0;return a},{})}var a=/^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,c=/^<\/(\w+)[^>]*>/,d=/(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,e=f("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected"),g=b.parse=function(b,f){function p(a,b){j(b)}function o(a,b,c){var f={};c.replace(d,function(a,b){var c=arguments[2]?arguments[2]:arguments[3]?arguments[3]:arguments[4]?arguments[4]:e[b]?b:"";f[b]=c}),i(b,f)}var g=function(){},h=f&&f.chars||g,i=f&&f.start||g,j=f&&f.end||g,k,l,m,n;b=b.replace(/<!--(.*?)-->/g,"").replace(/<!\[CDATA\[(.*?)]]>/g,"");while(b){k=b,m=!0,b[0]==="<"&&b[1]==="/"?(n=b.match(c),n&&(b=b.substring(n[0].length),n[0].replace(c,p),m=!1)):b[0]==="<"&&(n=b.match(a),n&&(b=b.substring(n[0].length),n[0].replace(a,o),m=!1));if(m){l=b.indexOf("<");var q=l<0?b:b.substring(0,l);b=l<0?"":b.substring(l),h(q)}if(b===k)throw"Parse Error: "+b}}}).call(a.exports),_browserifyRequire.modules["vers/lib/htmlParser"]._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/model"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/model.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/model",a)};(function(){var a=e("./utils"),c=e("./EventDispatcher"),d={},f={},g={},h=a.onServer?null:document.createElement("div"),i={attr:function(a,b,c){b.setAttribute(c,a)},prop:function(a,b,c){b[c]=a},propLazy:function(a,b,c){b!==document.activeElement&&(b[c]=a)},html:function(a,b,c){c&&(b.innerHTML=k.htmlEscape(a))},appendHtml:function(a,b){var c;h.innerHTML=a;while(c=h.firstChild)b.appendChild(c)}},j,k;b._link=function(a){k=a},b._setSocket=function(a){j=a};var l=b.events=new c(function(b,c,d){var e,f,g,h,j,n,o,q,r,s;if(a.isArray(b)){e=b[0],f=b[1],g=b[2],h=b[3],e==="__document"?j=document:e==="__window"?j=window:j=document.getElementById(e);if(!j)return!1;if(c.$f)return!0;if(d)switch(d){case"push":n=k._get(h,c[c.length-1]),i.appendHtml(n,j)}else n=h?k._get(h,c):c,i[f](n,j,g);return!0}if((o=b.$o)&&(q=b.$p)&&(r=b.$l)){l.unbind(o,r),l.bind(q,r),p(q,m(q));return!1}if((s=b.$f)&&(q=b.$p)){l.trigger(q,m(q));return!0}return!1},function(b,c){var e=d,f,h,i,j,k,n,o,p,q,r;f=b.split(".");for(h=0;i=f[h++];){e=e[i];if(a.isUndefined(e))return!1;if((j=e.$r)&&(k=e.$k)){o=m(k),n=m(j),p=[j,o].concat(f.slice(h)).join("."),l.bind(k,{$o:p,$p:b,$l:c}),l.bind(p,c);return!1}(q=e.$f)&&g[q].forEach(function(a){l.bind(a,{$f:q,$p:b})})}return!0}),m=b.get=function(b){var c=d,e,h,i,j,k,l;if(b){b=b.split(".");for(e=0;h=b[e++];){c=c[h];if(a.isUndefined(c))return null;if((i=c.$r)&&(j=c.$k))i=m(i),j=m(j),c=i[j];else if(k=c.$f)l=g[k],l=l.map?l.map(m):[],k=f[k],k&&(c=k.apply(null,l))}}return c},n=function(b,c,d){var e=JSON.stringify([b,a.toArray(c)]);a.onServer?d&&j&&j.broadcast(e):j.send(e)},o=b._set=function(a,b,c,e,f){var g=d,h=[],i,j,k,o,p,q;if(a){a=a.split("."),k=a.length;for(i=0;j=a[i++];)o=g[j],o&&(p=o.$r)&&(q=o.$k)?(q=m(q),h=[p,q],p=m(p),i===k?p[q]=b:g=p[q]):(i===k?g[j]=b:g=o,h.push(j))}c||(h=h.join("."),l.trigger(h,b),e&&n("set",[h,b],f))},p=b.set=function(a,b,c){o(a,b,!1,!0,c)},q=b.setSilent=function(a,b){o(a,b,!0)},r=b._push=function(a,b,c,e){var f=d[a];f.push(b),l.trigger(a,f,"push"),c&&n("push",[a,b],e)},s=b.push=function(a,b,c){r(a,b,!0,c)};b.func=function(a){return{$f:a}},b.makeFunc=function(a,b,c){f[a]=c,g[a]=b},b.ref=function(a,b){return{$r:a,$k:b}},b.init=function(a){d=a}}).call(a.exports),_browserifyRequire.modules["vers/lib/model"]._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/socket.io"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/socket.io.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/socket.io",a)};(function(){var b={};a.exports=b,function(){var a=!1;b.util={ios:!1,load:function(b){if(/loaded|complete/.test(document.readyState)||a)return b();"attachEvent"in window?window.attachEvent("onload",b):window.addEventListener("load",b,!1)},inherit:function(a,b){for(var c in b.prototype)a.prototype[c]=b.prototype[c]},indexOf:function(a,b,c){for(var d=a.length,e=c<0?Math.max(0,d+c):c||0;e<d;e++)if(a[e]===b)return e;return-1},isArray:function(a){return Object.prototype.toString.call(a)==="[object Array]"},merge:function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c])}},b.util.ios=/iphone|ipad/i.test(navigator.userAgent),b.util.android=/android/i.test(navigator.userAgent),b.util.opera=/opera/i.test(navigator.userAgent),b.util.load(function(){a=!0})}(),function(){var a="~m~",c=function(a){if(Object.prototype.toString.call(a)=="[object Object]"){if(!("JSON"in window)){"console"in window&&console.error&&console.error("Trying to encode as JSON, but JSON.stringify is missing.");return'{ "$error": "Invalid message" }'}return"~j~"+JSON.stringify(a)}return String(a)};Transport=b.Transport=function(a,c){this.base=a,this.options={timeout:15e3},b.util.merge(this.options,c)},Transport.prototype.send=function(){throw new Error("Missing send() implementation")},Transport.prototype.connect=function(){throw new Error("Missing connect() implementation")},Transport.prototype.disconnect=function(){throw new Error("Missing disconnect() implementation")},Transport.prototype._encode=function(d){var e="",f,d=b.util.isArray(d)?d:[d];for(var g=0,h=d.length;g<h;g++)f=d[g]===null||d[g]===undefined?"":c(d[g]),e+=a+f.length+a+f;return e},Transport.prototype._decode=function(b){var c=[],d,e;do{if(b.substr(0,3)!==a)return c;b=b.substr(3),d="",e="";for(var f=0,g=b.length;f<g;f++){e=Number(b.substr(f,1));if(b.substr(f,1)==e)d+=e;else{b=b.substr(d.length+a.length),d=Number(d);break}}c.push(b.substr(0,d)),b=b.substr(d)}while(b!=="");return c},Transport.prototype._onData=function(a){this._setTimeout();var b=this._decode(a);if(b&&b.length)for(var c=0,d=b.length;c<d;c++)this._onMessage(b[c])},Transport.prototype._setTimeout=function(){var a=this;this._timeout&&clearTimeout(this._timeout),this._timeout=setTimeout(function(){a._onTimeout()},this.options.timeout)},Transport.prototype._onTimeout=function(){this._onDisconnect()},Transport.prototype._onMessage=function(a){this.sessionid?a.substr(0,3)=="~h~"?this._onHeartbeat(a.substr(3)):a.substr(0,3)=="~j~"?this.base._onMessage(JSON.parse(a.substr(3))):this.base._onMessage(a):(this.sessionid=a,this._onConnect())},Transport.prototype._onHeartbeat=function(a){this.send("~h~"+a)},Transport.prototype._onConnect=function(){this.connected=!0,this.connecting=!1,this.base._onConnect(),this._setTimeout()},Transport.prototype._onDisconnect=function(){this.connecting=!1,this.connected=!1,this.sessionid=null,this.base._onDisconnect()},Transport.prototype._prepareUrl=function(){return(this.base.options.secure?"https":"http")+"://"+this.base.host+":"+this.base.options.port+"/"+this.base.options.resource+"/"+this.type+(this.sessionid?"/"+this.sessionid:"/")}}(),function(){var a=new Function,c=function(){if(!("XMLHttpRequest"in window))return!1;var a=new XMLHttpRequest;return a.withCredentials!=undefined}(),d=function(a){if("XDomainRequest"in window&&a)return new XDomainRequest;if("XMLHttpRequest"in window&&(!a||c))return new XMLHttpRequest;if(!a){try{var b=new ActiveXObject("MSXML2.XMLHTTP");return b}catch(d){}try{var e=new ActiveXObject("Microsoft.XMLHTTP");return e}catch(d){}}return!1},e=b.Transport.XHR=function(){b.Transport.apply(this,arguments),this._sendBuffer=[]};b.util.inherit(e,b.Transport),e.prototype.connect=function(){this._get();return this},e.prototype._checkSend=function(){if(!this._posting&&this._sendBuffer.length){var a=this._encode(this._sendBuffer);this._sendBuffer=[],this._send(a)}},e.prototype.send=function(a){b.util.isArray(a)?this._sendBuffer.push.apply(this._sendBuffer,a):this._sendBuffer.push(a),this._checkSend();return this},e.prototype._send=function(b){var c=this;this._posting=!0,this._sendXhr=this._request("send","POST"),this._sendXhr.onreadystatechange=function(){var b;if(c._sendXhr.readyState==4){c._sendXhr.onreadystatechange=a;try{b=c._sendXhr.status}catch(d){}c._posting=!1,b==200?c._checkSend():c._onDisconnect()}},this._sendXhr.send("data="+encodeURIComponent(b))},e.prototype.disconnect=function(){this._onDisconnect();return this},e.prototype._onDisconnect=function(){if(this._xhr){this._xhr.onreadystatechange=a;try{this._xhr.abort()}catch(c){}this._xhr=null}if(this._sendXhr){this._sendXhr.onreadystatechange=a;try{this._sendXhr.abort()}catch(c){}this._sendXhr=null}this._sendBuffer=[],b.Transport.prototype._onDisconnect.call(this)},e.prototype._request=function(a,b,c){var e=d(this.base._isXDomain());c&&(e.multipart=!0),e.open(b||"GET",this._prepareUrl()+(a?"/"+a:"")),b=="POST"&&"setRequestHeader"in e&&e.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=utf-8");return e},e.check=function(a){try{if(d(a))return!0}catch(b){}return!1},e.xdomainCheck=function(){return e.check(!0)},e.request=d}(),function(){var a=b.Transport.websocket=function(){b.Transport.apply(this,arguments)};b.util.inherit(a,b.Transport),a.prototype.type="websocket",a.prototype.connect=function(){var a=this;this.socket=new WebSocket(this._prepareUrl()),this.socket.onmessage=function(b){a._onData(b.data)},this.socket.onclose=function(b){a._onClose()},this.socket.onerror=function(b){a._onError(b)};return this},a.prototype.send=function(a){this.socket&&this.socket.send(this._encode(a));return this},a.prototype.disconnect=function(){this.socket&&this.socket.close();return this},a.prototype._onClose=function(){this._onDisconnect();return this},a.prototype._onError=function(a){this.base.emit("error",[a])},a.prototype._prepareUrl=function(){return(this.base.options.secure?"wss":"ws")+"://"+this.base.host+":"+this.base.options.port+"/"+this.base.options.resource+"/"+this.type+(this.sessionid?"/"+this.sessionid:"")},a.check=function(){return"WebSocket"in window&&WebSocket.prototype&&WebSocket.prototype.send&&!!WebSocket.prototype.send.toString().match(/native/i)&&typeof WebSocket!="undefined"},a.xdomainCheck=function(){return!0}}(),function(){var a=new Function,c=b.Transport["xhr-polling"]=function(){b.Transport.XHR.apply(this,arguments)};b.util.inherit(c,b.Transport.XHR),c.prototype.type="xhr-polling",c.prototype.connect=function(){if(b.util.ios||b.util.android){var a=this;b.util.load(function(){setTimeout(function(){b.Transport.XHR.prototype.connect.call(a)},10)})}else b.Transport.XHR.prototype.connect.call(this)},c.prototype._get=function(){var b=this;this._xhr=this._request(+(new Date),"GET"),this._xhr.onreadystatechange=function(){var c;if(b._xhr.readyState==4){b._xhr.onreadystatechange=a;try{c=b._xhr.status}catch(d){}c==200?(b._onData(b._xhr.responseText),b._get()):b._onDisconnect()}},this._xhr.send(null)},c.check=function(){return b.Transport.XHR.check()},c.xdomainCheck=function(){return b.Transport.XHR.xdomainCheck()}}(),function(){var a=b.Socket=function(a,c){this.host=a||document.domain,this.options={secure:!1,document:document,port:document.location.port||80,resource:"socket.io",transports:["websocket","xhr-polling"],transportOptions:{"xhr-polling":{timeout:25e3},"jsonp-polling":{timeout:25e3}},connectTimeout:5e3,tryTransportsOnConnectTimeout:!0,rememberTransport:!0},b.util.merge(this.options,c),this.connected=!1,this.connecting=!1,this._events={},this.transport=this.getTransport(),!this.transport&&"console"in window&&console.error("No transport available")};a.prototype.getTransport=function(a){var c=a||this.options.transports,d;this.options.rememberTransport&&!a&&(d=this.options.document.cookie.match("(?:^|;)\\s*socketio=([^;]*)"),d&&(this._rememberedTransport=!0,c=[decodeURIComponent(d[1])]));for(var e=0,f;f=c[e];e++)if(b.Transport[f]&&b.Transport[f].check()&&(!this._isXDomain()||b.Transport[f].xdomainCheck()))return new b.Transport[f](this,this.options.transportOptions[f]||{});return null},a.prototype.connect=function(){if(this.transport&&!this.connected){this.connecting&&this.disconnect(),this.connecting=!0,this.emit("connecting",[this.transport.type]),this.transport.connect();if(this.options.connectTimeout){var a=this;this.connectTimeoutTimer=setTimeout(function(){if(!a.connected){a.disconnect();if(a.options.tryTransportsOnConnectTimeout&&!a._rememberedTransport){a._remainingTransports||(a._remainingTransports=a.options.transports.slice(0));var b=a._remainingTransports;while(b.length>0&&b.splice(0,1)[0]!=a.transport.type);b.length&&(a.transport=a.getTransport(b),a.connect())}(!a._remainingTransports||a._remainingTransports.length==0)&&a.emit("connect_failed")}a._remainingTransports&&a._remainingTransports.length==0&&delete a._remainingTransports},this.options.connectTimeout)}}return this},a.prototype.send=function(a){if(!this.transport||!this.transport.connected)return this._queue(a);this.transport.send(a);return this},a.prototype.disconnect=function(){this.connectTimeoutTimer&&clearTimeout(this.connectTimeoutTimer),this.transport.disconnect();return this},a.prototype.on=function(a,b){a in this._events||(this._events[a]=[]),this._events[a].push(b);return this},a.prototype.emit=function(a,b){if(a in this._events){var c=this._events[a].concat();for(var d=0,e=c.length;d<e;d++)c[d].apply(this,b===undefined?[]:b)}return this},a.prototype.removeEvent=function(a,b){if(a in this._events)for(var c=0,d=this._events[a].length;c<d;c++)this._events[a][c]==b&&this._events[a].splice(c,1);return this},a.prototype._queue=function(a){"_queueStack"in this||(this._queueStack=[]),this._queueStack.push(a);return this},a.prototype._doQueue=function(){if(!("_queueStack"in this)||!this._queueStack.length)return this;this.transport.send(this._queueStack),this._queueStack=[];return this},a.prototype._isXDomain=function(){return this.host!==document.domain},a.prototype._onConnect=function(){this.connected=!0,this.connecting=!1,this._doQueue(),this.options.rememberTransport&&(this.options.document.cookie="socketio="+encodeURIComponent(this.transport.type)),this.emit("connect")},a.prototype._onMessage=function(a){this.emit("message",[a])},a.prototype._onDisconnect=function(){var a=this.connected;this.connected=!1,this.connecting=!1,this._queueStack=[],a&&this.emit("disconnect")},a.prototype.fire=a.prototype.emit,a.prototype.addListener=a.prototype.addEvent=a.prototype.addEventListener=a.prototype.on}()}).call(a.exports),_browserifyRequire.modules["vers/lib/socket.io"]._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/utils"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/utils.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/utils",a)};(function(){var a=b,c=a.isArray=Array.isArray||function(a){return toString.call(a)==="[object Array]"},d=a.isArguments=function(a){return!!a&&!!hasOwnProperty.call(a,"callee")};a.isFunction=function(a){return!!(a&&a.constructor&&a.call&&a.apply)},a.isString=function(a){return!!(a===""||a&&a.charCodeAt&&a.substr)},a.isNumber=function(a){return!!(a===0||a&&a.toExponential&&a.toFixed)},a.isNaN=function(a){return a!==a},a.isBoolean=function(a){return a===!0||a===!1},a.isDate=function(a){return!!(a&&a.getTimezoneOffset&&a.setUTCFullYear)},a.isRegExp=function(a){return!(!(a&&a.test&&a.exec)||!a.ignoreCase&&a.ignoreCase!==!1)},a.isNull=function(a){return a===null},a.isUndefined=function(a){return a===void 0},a.isDefined=function(a){return a!==void 0},a.toArray=function(a){if(!a)return[];if(a.toArray)return a.toArray();if(d(a))return Array.slice.call(a);if(c(a))return a;return f(a,function(a,b){return b})},a.toInteger=function(a){return a-0},a.onServer=typeof window=="undefined";var f=a.forEach=function(a,b){for(var c in a)b(c,a[c])};a.onServer&&(a.minify=function(){var a={},b=e("uglify-js");return function(c,d){if(d&&a[c])return a[c];var e=b.uglify,f=b.parser.parse(c);f=e.ast_mangle(f),f=e.ast_squeeze(f),f=e.gen_code(f),d&&(a[c]=f);return f}}())}).call(a.exports),_browserifyRequire.modules["vers/lib/utils"]._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/vers"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/vers.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/vers",a)};(function(){var c=b.dom=e("./dom"),d=b.model=e("./model"),f=b.view=e("./view"),g=b.utils=e("./utils");c._link(d),d._link(f),f._link(c,d),a.exports=function(a,h){g.onServer?(h.dom=c,h.model=d,h.view=f,a.exports=function(b){var c=e("socket.io"),i=e("browserify"),j=e("path"),k=j.dirname(a.filename),l=i({staticRoot:j.dirname(k),base:k,coffee:!1,builtins:!1,require:["vers"],filter:g.minify}),m=c.listen(b,{transports:["websocket","xhr-polling"]});m.on("connection",function(a){a.on("message",function(b){var c=JSON.parse(b),e=c[0],f=c[1];/(^_)|(\._)/.test(f[0])||(d[e].apply(null,f),a.broadcast(b))})}),d._setSocket(m),h.socket=m,f._setClientName(j.basename(a.filename,".js")),f._setJsFile(l.filename),b.use(l.handle);return h}):a.exports=function(a,b,g,i){var j=e("./socket.io"),k=new j.Socket(null);k.connect(),k.on("message",function(a){a=JSON.parse(a),d["_"+a[0]].apply(null,a[1])}),d._setSocket(k),f.uniqueId._count=a,d.init(b),d.events.set(g),c.events.set(i);return h};return b}}).call(a.exports),_browserifyRequire.modules["vers/lib/vers"]._cached=a.exports;return a.exports},_browserifyRequire.modules["vers/lib/view"]=function(){var a={exports:{}},b=a.exports,c="vers",d="vers/view.js",e=function(a){return _browserifyRequire.fromFile("vers/lib/view",a)};(function(){function q(a){return function(b){var c=b.model,d=c?j.get(c):b,e=b.view?l(b.view,d):d;c&&a==="Title"&&j.events.bind(c,["__document","prop","title"]);return e}}function o(b){function p(a){var b=/^(.*?)(\{{2,3})(\w+)\}{2,3}(.*)$/.exec(a);return b?{pre:b[1],escaped:b[2]==="{{",name:b[3],post:b[4]}:null}function o(a,b,c){return function(d){var e=d[a],f=e.model?j.get(e.model):e,g=e.view?l(e.view,f):f;b&&(g=m(g)),c&&(g=n(g));return g}}var d=[],e=[],f=[""],g=0,h;h={input:function(a,b,c){var d,f,g;a==="value"?(d="propLazy",f="set","silent"in b&&(d="prop",f="setSilent",delete b.silent),e.push(function(a){g=[f,a[c].model,b._id||b.id,"prop","value"],i.events.bind("keyup",g),i.events.bind("keydown",g)})):d="attr";return d}},htmlParse={start:function(b,c){a.forEach(c,function(d,f){var g,i,l,m;if(g=p(f))i=g.name,a.isUndefined(c.id)&&(c.id=function(){return c._id=k()}),l=b in h?h[b](d,c,i):"attr",e.push(function(a){var b=a[i].model;b&&j.events.bind(b,[c._id||c.id,l,d])}),c[d]=o(i,g.escaped,!0)}),d.push(["start",b,c])},chars:function(b){var c,f,g,h,i,l,m;b=b.replace(/\n *$/,"");if(g=p(b))h=g.name,i=a.toInteger(g.escaped),l=g.pre,m=g.post,l&&d.push(["chars",l]),(l||m)&&d.push(["start","span",{}]),b=o(h,i),c=d[d.length-1],c[0]==="start"&&(f=c[2],a.isUndefined(f.id)&&(f.id=function(){return f._id=k()}),e.push(function(a){var b=a[h].model,c=a[h].view,d=[f._id||f.id,"html",i];b&&(c&&d.push(c),j.events.bind(b,d))}));b&&d.push(["chars",b]),(l||m)&&d.push(["end","span"]),m&&htmlParse.chars(m)},end:function(a){d.push(["end",a])}},c.parse(b,htmlParse),d.forEach(function(b){function c(b,c){a.isFunction(b)?g=f.push(b,"")-1:f[g]+=c?n(b):b}switch(b[0]){case"start":f[g]+="<"+b[1],a.forEach(b[2],function(a,b){f[g]+=" "+a+"=",c(b,!0)}),f[g]+=">";return;case"chars":c(b[1]);return;case"end":f[g]+="</"+b[1]+">"}});return function(b,c){var d=f.reduce(function(c,d){return c+(a.isFunction(d)?d(b):d)},"");e.forEach(function(a){a(b)});return d}}function n(a){return a&&a.indexOf?/[ =]/.test(a)?'"'+a+'"':a:'""'}var a=e("./utils"),c=e("./htmlParser"),d={},f="",g,h,i,j;b._link=function(a,b){i=a,j=b},b._setClientName=function(a){g=a},b._setJsFile=function(a){h=a};var k=b.uniqueId=function(){return"_"+(k._count++).toString(36)};k._count=0;var l=b._get=function(b,c){b=d[b];return b?a.isArray(c)?c.reduce(function(a,c){return a+b(c)},""):b(c):""},m=b.htmlEscape=function(a){a=String(a===null?"":a);return a.replace(/&(?!\w+;)|["'<>\\]/g,function(a){switch(a){case"&":return"&amp;";case"\\":return"\\\\";case'"':return"&quot;";case"'":return"&#39;";case"<":return"&lt;";case">":return"&gt;";default:return a}})},p=b.preLoad=function(a){f+="("+a.toString()+")();"};b.make=function(b,c,e,f){var g=f&&f.after,h=e?o(e):q(b),i=a.isFunction(c)?function(){return h(c.apply(null,arguments))}:function(){return h(c)};a.onServer?(g&&p(g),d[b]=i):d[b]=g?function(){setTimeout(g,0);return i.apply(null,arguments)}:i},a.onServer&&(b.html=function(){var b,c,d,e;j.events._names={},i.events._names={},k._count=0,b=l("Title"),c=l("Head"),d=l("Body"),e=l("Foot");return"<!DOCTYPE html><title>"+b+"</title>"+c+d+"<script>function $(s){return document.getElementById(s)}"+a.minify(f,!0)+"</script>"+"<script src="+h+"></script>"+"<script>var "+g+'=require("./'+g+'")('+k._count+","+JSON.stringify(j.get()).replace(/<\//g,"<\\/")+","+JSON.stringify(j.events.get())+","+JSON.stringify(i.events.get())+");</script>"+e})}).call(a.exports),_browserifyRequire.modules["vers/lib/view"]._cached=a.exports;return a.exports},_browserifyRequire.modules["./chat"]=function(){var a={exports:{}},b=a.exports,c=".",d="./chat.js",e=function(a){return _browserifyRequire.fromFile("./chat",a)};(function(){var d,f,g,h;f=e("vers")(a,b),h=b.utils=f.utils,d=f.model,g=f.view,h.onServer&&(d.init({users:{},messages:[],_session:{userId:0,user:d.ref("users","_session.userId"),newComment:"",title:d.func("title")}}),g.make("Title",{model:"_session.title"}),e("fs").readFile(""+c+"/chat.styl","utf8",function(a,b){return e("stylus").render(b,{compress:!0},function(a,b){return g.make("Head",'<meta name=viewport content="width=device-width">\n<style>'+b+"</style>")})}),g.make("Body",{messages:{model:"messages",view:"message"},userPicUrl:{model:"_session.user.picUrl"},userName:{model:"_session.user.name"},newComment:{model:"_session.newComment"}},"<div id=messageContainer><ul id=messageList>{{{messages}}}</ul></div>\n<div id=foot>\n  <img id=inputPic src={{{userPicUrl}}} class=pic>\n  <div id=inputs>\n    <input id=inputName value={{userName}}>\n    <form id=inputForm action=javascript:chat.postMessage()>\n      <input id=commentInput value={{newComment}} silent>\n    </form>\n  </div>\n</div>"),g.preLoad(function(){var a,b,c,d;a=$("messageContainer"),b=$("foot"),c=$("messageList"),d=function(){a.style.height=window.innerHeight-b.offsetHeight+"px";return a.scrollTop=c.offsetHeight},d(),window.onresize=d;return $("commentInput").focus()})),d.makeFunc("title",["messages","_session.user.name"],function(a,b){return"Chat ("+a.length+") - "+b}),g.make("message",function(a){return{userPicUrl:{model:"users."+a.userId+".picUrl"},userName:{model:"users."+a.userId+".name"},comment:a.comment}},"<li><img src={{{userPicUrl}}} class=pic>\n  <div class=message>\n    <p><b>{{userName}}</b>\n    <p>{{comment}}\n  </div>",{after:function(){return $("messageContainer").scrollTop=$("messageList").offsetHeight}}),b.postMessage=function(){d.push("messages",{userId:d.get("_session.userId"),comment:d.get("_session.newComment")});return d.set("_session.newComment","")}}).call(a.exports),_browserifyRequire.modules["./chat"]._cached=a.exports;return a.exports}