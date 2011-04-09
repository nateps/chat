function require (path) {
    // not EXACTLY like how node does it but more appropriate for the browser
    var mod
        = require.modules[path]
        || require.modules[path + '.js']
        || require.modules[path + '/index']
        || require.modules[path + '/index.js']
    ;
    
    if (!mod) throw new Error("Cannot find module '" + path + "'");
    return mod._cached ? mod._cached : mod();
}

var _browserifyRequire = require; // scoping >_<

require.paths = [];
require.modules = {};

require.fromFile = function (filename, path) {
    // require a file with respect to a path
    var resolved = _browserifyRequire.resolve(filename, path);
    return _browserifyRequire(resolved)
};

require.resolve = function (basefile, file) {
    if (!file.match(/^[\.\/]/)) return file;
    if (file.match(/^\//)) return file;
    
    var basedir = basefile.match(/^[\.\/]/)
        ? basefile.replace(/[^\/]+$/, '')
        : basefile
    ;
    if (basedir === '') {
        basedir = '.';
    }
    
    // normalize file path.
    var r1 = /[^\/.]+\/\.\./g;
    var r2 = /\/{2,}/g;
    for(
        var norm = file;
        norm.match(r1) != null || norm.match(r2) != null;
        norm = norm.replace(r1, '').replace(r2, '/')
    );
    
    while (norm.match(/^\.\.\//)) {
        if (basedir === '/' || basedir === '') {
            throw new Error("Couldn't resolve path"
                + "'" + file + "' with respect to filename '" + basefile + "': "
                + "file can't resolve past base"
            );
        }
        norm = norm.replace(/^\.\.\//, '');
        basedir = basedir.replace(/[^\/]+\/$/, '');
    }
    
    var n = basedir.match(/\//)
        ? basedir.replace(/[^\/]+$/,'') + norm
        : norm.replace(/^\.\//, basedir + '/');
    return n.replace(/\/.\//, '/');
};
if (typeof process === 'undefined') process = {
    nextTick : function (fn) {
        setTimeout(fn, 0);
    },
    title : 'browser'
};

// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)
// -- dantman Daniel Friesen Copyright(C) 2010 XXX No License Specified
// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/

(function (undefined) {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-050.pdf
 *
 * NOTE: this is a draft, and as such, the URL is subject to change.  If the
 * link is broken, check in the parent directory for the latest TC39 PDF.
 * http://www.ecma-international.org/publications/files/drafts/
 *
 * Previous ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
 * This is a broken link to the previous draft of ES5 on which most of the
 * numbered specification references and quotes herein were taken.  Updating
 * these references and quotes to reflect the new document would be a welcome
 * volunteer project.
 * 
 * @module
 */

/*whatsupdoc*/

// this is often accessed, so avoid multiple dereference costs universally
var has = Object.prototype.hasOwnProperty;

//
// Array
// =====
//

// ES5 15.4.3.2 
if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) == "[object Array]";
    };
}

// ES5 15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach =  function(block, thisObject) {
        var len = this.length >>> 0;
        for (var i = 0; i < len; i++) {
            if (i in this) {
                block.call(thisObject, this[i], i, this);
            }
        }
    };
}

// ES5 15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
          throw new TypeError();

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                res[i] = fun.call(thisp, this[i], i, this);
        }

        return res;
    };
}

// ES5 15.4.4.20
if (!Array.prototype.filter) {
    Array.prototype.filter = function (block /*, thisp */) {
        var values = [];
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (block.call(thisp, this[i]))
                values.push(this[i]);
        return values;
    };
}

// ES5 15.4.4.16
if (!Array.prototype.every) {
    Array.prototype.every = function (block /*, thisp */) {
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (!block.call(thisp, this[i]))
                return false;
        return true;
    };
}

// ES5 15.4.4.17
if (!Array.prototype.some) {
    Array.prototype.some = function (block /*, thisp */) {
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (block.call(thisp, this[i]))
                return true;
        return false;
    };
}

// ES5 15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value and an empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = 0;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);
        }

        for (; i < len; i++) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}

// ES5 15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value, empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = len - 1;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);
        }

        for (; i >= 0; i--) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}

// ES5 15.4.4.14
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (value /*, fromIndex */ ) {
        var length = this.length;
        if (!length)
            return -1;
        var i = arguments[1] || 0;
        if (i >= length)
            return -1;
        if (i < 0)
            i += length;
        for (; i < length; i++) {
            if (!has.call(this, i))
                continue;
            if (value === this[i])
                return i;
        }
        return -1;
    };
}

// ES5 15.4.4.15
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function (value /*, fromIndex */) {
        var length = this.length;
        if (!length)
            return -1;
        var i = arguments[1] || length;
        if (i < 0)
            i += length;
        i = Math.min(i, length - 1);
        for (; i >= 0; i--) {
            if (!has.call(this, i))
                continue;
            if (value === this[i])
                return i;
        }
        return -1;
    };
}

//
// Object
// ======
// 

// ES5 15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/kriskowal/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    Object.getPrototypeOf = function (object) {
        return object.__proto__ || object.constructor.prototype;
        // or undefined if not available in this engine
    };
}

// ES5 15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    Object.getOwnPropertyDescriptor = function (object) {
        if (typeof object !== "object" && typeof object !== "function" || object === null)
            throw new TypeError("Object.getOwnPropertyDescriptor called on a non-object");

        return has.call(object, property) ? {
            value: object[property],
            enumerable: true,
            configurable: true,
            writeable: true
        } : undefined;
    };
}

// ES5 15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function (object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5 
if (!Object.create) {
    Object.create = function(prototype, properties) {
        var object;
        if (prototype === null) {
            object = {"__proto__": null};
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
        }
        if (typeof properties !== "undefined")
            Object.defineProperties(object, properties);
        return object;
    };
}

// ES5 15.2.3.6
if (!Object.defineProperty) {
    Object.defineProperty = function(object, property, descriptor) {
        if (typeof descriptor == "object" && object.__defineGetter__) {
            if (has.call(descriptor, "value")) {
                if (!object.__lookupGetter__(property) && !object.__lookupSetter__(property))
                    // data property defined and no pre-existing accessors
                    object[property] = descriptor.value;
                if (has.call(descriptor, "get") || has.call(descriptor, "set"))
                    // descriptor has a value property but accessor already exists
                    throw new TypeError("Object doesn't support this action");
            }
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(has.call(descriptor, "writable") ? descriptor.writable : true) ||
                !(has.call(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(has.call(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */
            else if (typeof descriptor.get == "function")
                object.__defineGetter__(property, descriptor.get);
            if (typeof descriptor.set == "function")
                object.__defineSetter__(property, descriptor.set);
        }
        return object;
    };
}

// ES5 15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function(object, properties) {
        for (var property in properties) {
            if (has.call(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}

// ES5 15.2.3.8
if (!Object.seal) {
    Object.seal = function (object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
if (!Object.freeze) {
    Object.freeze = function (object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function (freeze) {
        return function (object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freeze(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function (object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function (object) {
        return false;
    };
}

// ES5 15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function (object) {
        return false;
    };
}

// ES5 15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function (object) {
        return true;
    };
}

// ES5 15.2.3.14
// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
if (!Object.keys) {

    var hasDontEnumBug = true,
        dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null})
        hasDontEnumBug = false;

    Object.keys = function (object) {

        if (
            typeof object !== "object" && typeof object !== "function"
            || object === null
        )
            throw new TypeError("Object.keys called on a non-object");

        var keys = [];
        for (var name in object) {
            if (has.call(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (has.call(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }

        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// Format a Date object as a string according to a subset of the ISO-8601 standard.
// Useful in Atom, among other things.
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
        return (
            this.getUTCFullYear() + "-" +
            (this.getUTCMonth() + 1) + "-" +
            this.getUTCDate() + "T" +
            this.getUTCHours() + ":" +
            this.getUTCMinutes() + ":" +
            this.getUTCSeconds() + "Z"
        ); 
    }
}

// ES5 15.9.4.4
if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

// ES5 15.9.5.44
if (!Date.prototype.toJSON) {
    Date.prototype.toJSON = function (key) {
        // This function provides a String representation of a Date object for
        // use by JSON.stringify (15.12.3). When the toJSON method is called
        // with argument key, the following steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ToPrimitive(O, hint Number).
        // 3. If tv is a Number and is not finite, return null.
        // XXX
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof this.toISOString != "function")
            throw new TypeError();
        // 6. Return the result of calling the [[Call]] internal method of
        // toISO with O as the this value and an empty argument list.
        return this.toISOString();

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// 15.9.4.2 Date.parse (string)
// 15.9.1.15 Date Time String Format
// Date.parse
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (isNaN(Date.parse("T00:00"))) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        var Date = function(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length === 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format
        var isoDateExpression = new RegExp("^" +
            "(?:" + // optional year-month-day
                "(" + // year capture
                    "(?:[+-]\\d\\d)?" + // 15.9.1.15.1 Extended years
                    "\\d\\d\\d\\d" + // four-digit year
                ")" +
                "(?:-" + // optional month-day
                    "(\\d\\d)" + // month capture
                    "(?:-" + // optional day
                        "(\\d\\d)" + // day capture
                    ")?" +
                ")?" +
            ")?" + 
            "(?:T" + // hour:minute:second.subsecond
                "(\\d\\d)" + // hour capture
                ":(\\d\\d)" + // minute capture
                "(?::" + // optional :second.subsecond
                    "(\\d\\d)" + // second capture
                    "(?:\\.(\\d\\d\\d))?" + // milisecond capture
                ")?" +
            ")?" +
            "(?:" + // time zone
                "Z|" + // UTC capture
                "([+-])(\\d\\d):(\\d\\d)" + // timezone offset
                // capture sign, hour, minute
            ")?" +
        "$");

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate)
            Date[key] = NativeDate[key];

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle the ISO dates we use
        // TODO review specification to ascertain whether it is
        // necessary to implement partial ISO date strings.
        Date.parse = function(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                match.shift(); // kill match[0], the full match
                // recognize times without dates before normalizing the
                // numeric values, for later use
                var timeOnly = match[0] === undefined;
                // parse numerics
                for (var i = 0; i < 10; i++) {
                    // skip + or - for the timezone offset
                    if (i === 7)
                        continue;
                    // Note: parseInt would read 0-prefix numbers as
                    // octal.  Number constructor or unary + work better
                    // here:
                    match[i] = +(match[i] || (i < 3 ? 1 : 0));
                    // match[1] is the month. Months are 0-11 in JavaScript
                    // Date objects, but 1-12 in ISO notation, so we
                    // decrement.
                    if (i === 1)
                        match[i]--;
                }
                // if no year-month-date is provided, return a milisecond
                // quantity instead of a UTC date number value.
                if (timeOnly)
                    return ((match[3] * 60 + match[4]) * 60 + match[5]) * 1000 + match[6];

                // account for an explicit time zone offset if provided
                var offset = (match[8] * 60 + match[9]) * 60 * 1000;
                if (match[6] === "-")
                    offset = -offset;

                return NativeDate.UTC.apply(this, match.slice(0, 7)) + offset;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

// 
// Function
// ========
// 

// ES-5 15.3.4.5
// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
var slice = Array.prototype.slice;
if (!Function.prototype.bind) {
    Function.prototype.bind = function (that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        // XXX this gets pretty close, for all intents and purposes, letting 
        // some duck-types slide
        if (typeof target.apply != "function" || typeof target.call != "function")
            return new TypeError();
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        var args = slice.call(arguments);
        // 4. Let F be a new native ECMAScript object.
        // 9. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 10. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 11. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 12. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        // 13. The [[Scope]] internal property of F is unused and need not
        //   exist.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.

                var self = Object.create(target.prototype);
                target.apply(self, args.concat(slice.call(arguments)));
                return self;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the list
                //   boundArgs in the same order followed by the same values as
                //   the list ExtraArgs in the same order. 5.  Return the
                //   result of calling the [[Call]] internal method of target
                //   providing boundThis as the this value and providing args
                //   as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.call.apply(
                    target,
                    args.concat(slice.call(arguments))
                );

            }

        };
        // 5. Set the [[TargetFunction]] internal property of F to Target.
        // extra:
        bound.bound = target;
        // 6. Set the [[BoundThis]] internal property of F to the value of
        // thisArg.
        // extra:
        bound.boundTo = that;
        // 7. Set the [[BoundArgs]] internal property of F to A.
        // extra:
        bound.boundArgs = args;
        bound.length = (
            // 14. If the [[Class]] internal property of Target is "Function", then
            typeof target == "function" ?
            // a. Let L be the length property of Target minus the length of A.
            // b. Set the length own property of F to either 0 or L, whichever is larger.
            Math.max(target.length - args.length, 0) :
            // 15. Else set the length own property of F to 0.
            0
        )
        // 16. The length own property of F is given attributes as specified in
        //   15.3.5.1.
        // TODO
        // 17. Set the [[Extensible]] internal property of F to true.
        // TODO
        // 18. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // 19. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property.
        // XXX can't delete it in pure-js.
        return bound;
    };
}

//
// String
// ======
//

// ES5 15.5.4.20
if (!String.prototype.trim) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    var trimBeginRegexp = /^\s\s*/;
    var trimEndRegexp = /\s\s*$/;
    String.prototype.trim = function () {
        return String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    };
}

})();
_browserifyRequire.modules["events"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "events.js";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("events", path);
    };
    
    (function () {
        if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = Array.isArray;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["events"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["fs"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "fs.js";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("fs", path);
    };
    
    (function () {
        // nothing to see here... no file methods for the browser
;
    }).call(module.exports);
    
    _browserifyRequire.modules["fs"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["json_shim"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "json_shim.js";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("json_shim", path);
    };
    
    (function () {
        // https://github.com/douglascrockford/JSON-js/blob/master/json2.js

if (typeof JSON === 'undefined') {
    JSON = {};
}

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
;
    }).call(module.exports);
    
    _browserifyRequire.modules["json_shim"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["path"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "path.js";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("path", path);
    };
    
    (function () {
        // resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(resolvedPath.split('/').filter(function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(path.split('/').filter(function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(paths.filter(function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["path"]._cached = module.exports;
    return module.exports;
};
_browserifyRequire.modules["vers"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers", path);
    };
    
    (function () {
        var dom = exports.dom = require('./dom'),
    model = exports.model = require('./model'),
    view = exports.view = require('./view'),
    _ = exports.utils = require('./utils');

dom._link(model);
model._link(view);
view._link(dom, model);

module.exports = function(clientModule, clientExports) {
  if (_.onServer) {
    clientExports.dom = dom;
    clientExports.model = model;
    clientExports.view = view;

    clientModule.exports = function(app) {
      var io = require('socket.io'),
          browserify = require('browserify'),
          path = require('path'),
          clientDir = path.dirname(clientModule.filename),
          js = browserify({
            staticRoot: path.dirname(clientDir),
            base: clientDir,
            require: ['vers'],
            //filter: _.minify
          }),
          socket = io.listen(app, {transports: ['websocket', 'xhr-polling'] });
      socket.on('connection', function(client) {      
        client.on('message', function(message) {
          var data = JSON.parse(message),
              method = data[0],
              args = data[1];
          // Don't store or send to other clients if the model path contains a name
          // that starts with an underscore
          if (! /(^_)|(\._)/.test(args[0])) {
            model[method].apply(null, args);
            client.broadcast(message);
          }
        });
      });
      model._setSocket(socket);
      clientExports.socket = socket;

      view._setClientName(path.basename(clientModule.filename, '.js'));
      view._setJsFile(js.filename);
      app.use(js.handle);

      return clientExports;
    };
  } else {
    clientModule.exports = function(count, modelData, modelEvents, domEvents) {
      var io = require('./socket.io'),
          socket = new io.Socket(null);
      socket.connect();
      socket.on('message', function(message) {
        message = JSON.parse(message);
        model['_' + message[0]].apply(null, message[1]);
      });
      model._setSocket(socket);
      
      view.uniqueId._count = count;
      model.init(modelData);
      model.events.set(modelEvents);
      dom.events.set(domEvents);
      return clientExports;
    };
  }

  return exports;
};;
    }).call(module.exports);
    
    _browserifyRequire.modules["vers"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/lib/dom"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/lib/dom";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/lib/dom", path);
    };
    
    (function () {
        var _ = require('./utils'),
    EventDispatcher = require('./EventDispatcher'),
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
    },
    model;

exports._link = function(m) {
  model = m;
}

var events = exports.events = new EventDispatcher(
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
if (!_.onServer) {
  ['keyup', 'keydown'].forEach(function(item) {
    document['on' + item] = domHandler;
  });
};
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/lib/dom"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/lib/EventDispatcher"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/lib/EventDispatcher";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/lib/EventDispatcher", path);
    };
    
    (function () {
        var _ = require('./utils');

var EventDispatcher = module.exports = function(triggerCallback, bindCallback) {
  this._triggerCallback = triggerCallback;
  if (bindCallback) {
    this.bind = function(name, listener) {
      if (bindCallback(name, listener)) {
        EventDispatcher.prototype.bind.call(this, name, listener);
      }
    };
  }
  this._names = {};
}
EventDispatcher.prototype = {
  bind: function(name, listener) {
    var names = this._names,
        key = JSON.stringify(listener),
        obj = names[name] || {};
    obj[key] = true;
    names[name] = obj;
  },
  unbind: function(name, listener) {
    var names = this._names,
        key = JSON.stringify(listener);
    delete names[name][key];
  },
  trigger: function(name, value, options) {
    var names = this._names,
        listeners = names[name],
        callback = this._triggerCallback;
    if (listeners && !_.onServer) {
      Object.keys(listeners).forEach(function(key) {
        var listener = JSON.parse(key);
        if (!callback(listener, value, options)) {
          delete listeners[key];
        }
      });
    }
  },
  get: function() {
    var names = this._names,
        out = {};
    Object.keys(names).forEach(function(name) {
      out[name] = Object.keys(names[name]).map(function(item) {
        return item.replace(/"/g, "'");
      });
    });
    return out;
  },
  set: function(n) {
    var names = this._names;
    Object.keys(n).forEach(function(name) {
      var obj = names[name] = {},
          listeners = n[name];
      listeners.forEach(function(listener) {
        obj[listener.replace(/'/g, '"')] = true;
      });
    });
  }
};
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/lib/EventDispatcher"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/lib/htmlParser"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/lib/htmlParser";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/lib/htmlParser", path);
    };
    
    (function () {
        // Modified from HTML Parser By John Resig (ejohn.org)
// http://ejohn.org/blog/pure-javascript-html-parser/
// Original code by Erik Arvidsson, Mozilla Public License
// http://erik.eae.net/simplehtmlparser/simplehtmlparser.js

    // Regular Expressions for parsing
var startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
    endTag = /^<\/(\w+)[^>]*>/,
    attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,
    // Attributes that have their values filled in (Ex: disabled="disabled")
    fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected');

function makeMap(list) {
  return list.split(',').reduce(function(memo, item) {
    memo[item] = true;
    return memo;
  }, {});
}

var parse = exports.parse = function(html, handler) {
  var empty = function() {},
      charsHandler = (handler && handler.chars) || empty,
      startHandler = (handler && handler.start) || empty,
      endHandler = (handler && handler.end) || empty,
      last, index, chars, match;
  
  function parseStartTag(tag, tagName, rest) {
    var attrs = {};
    rest.replace(attr, function(match, name) {
      var value = arguments[2] ? arguments[2] :
        arguments[3] ? arguments[3] :
        arguments[4] ? arguments[4] :
        fillAttrs[name] ? name : '';
      attrs[name] = value;
    });
    startHandler(tagName, attrs);
  }

  function parseEndTag(tag, tagName) {
    endHandler(tagName);
  }
  
  // Remove all comments
  html = html.replace(/<!--(.*?)-->/g, '')
    .replace(/<!\[CDATA\[(.*?)]]>/g, '');
  
  while (html) {
    last = html;
    chars = true;
      
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
      charsHandler(text);
    }

    if (html === last) {
      throw 'Parse Error: ' + html;
    }
  }
};;
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/lib/htmlParser"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/lib/model"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/lib/model";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/lib/model", path);
    };
    
    (function () {
        var _ = require('./utils'),
    EventDispatcher = require('./EventDispatcher'),
    world = {},
    funcs = {},
    funcInputs = {},
    emptyEl = (_.onServer) ? null : document.createElement('div'),
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
      html: function(value, el, escape) {
        if (escape) el.innerHTML = view.htmlEscape(value);
      },
      appendHtml: function(value, el) {
        var child;
        emptyEl.innerHTML = value;
        while (child = emptyEl.firstChild) {
          el.appendChild(child);
        }
      }
    },
    socket, view;

exports._link = function(v) {
  view = v;
}

exports._setSocket = function(o) {
  socket = o;
}

var events = exports.events = new EventDispatcher(
  function(listener, value, options) {
    var id, method, property, viewFunc, el, s,
        oldPathName, pathName, listenerObj, modelFunc;
    if (_.isArray(listener)) {
      id = listener[0];
      method = listener[1];
      property = listener[2];
      viewFunc = listener[3];
      if (id === '__document') {
        el = document;
      } else if (id === '__window') {
        el = window;
      } else {
        el = document.getElementById(id);
      }
      // The element can't be found, so remove this handler
      if (!el) return false;
      // If this is the result of a model function assignment, keep the handler
      // but don't perform any updates
      if (value.$f) return true;
      if (options) {
        switch (options) {
          case 'push':
            s = view._get(viewFunc, value[value.length - 1]);
            setMethods.appendHtml(s, el);
            break;
        }
      } else {
        s = (viewFunc) ? view._get(viewFunc, value) : value;
        setMethods[method](s, el, property);
      }
      return true;
    } else if ((oldPathName = listener.$o) && (pathName = listener.$p) && (listenerObj = listener.$l)) {
      events.unbind(oldPathName, listenerObj);
      events.bind(pathName, listenerObj);
      // Set the object to itself to trigger change event
      set(pathName, get(pathName));
      // Remove this handler, since it will be replaced with a new handler
      // in the bind action above
      return false;
    } else if ((modelFunc = listener.$f) && (pathName = listener.$p)) {
      events.trigger(pathName, get(pathName));
      return true;
    }
    // Remove this event if it can't be handled
    return false;
  }, function(pathName, listener) {
    var obj = world,
        path, i, prop, refName, keyName, ref, key, eventPath, modelFunc, inputs;
    path = pathName.split('.');
    for (i = 0; prop = path[i++];) {
      obj = obj[prop];
      if (_.isUndefined(obj)) return false; // Remove bad event handler
      if ((refName = obj.$r) && (keyName = obj.$k)) {
        key = get(keyName);
        ref = get(refName);
        eventPath = [refName, key].concat(path.slice(i)).join('.');
        // Register an event to update the other event handler when the
        // reference key changes
        events.bind(keyName, {$o: eventPath, $p: pathName, $l: listener});
        // Bind the event to the dereferenced path
        events.bind(eventPath, listener);
        // Cancel the creation of the event to the reference itself
        return false;
      } else if ((modelFunc = obj.$f)) {
        // Bind a listener to each of the inputs to the function
        funcInputs[modelFunc].forEach(function(item) {
          events.bind(item, {$f: modelFunc, $p: pathName});
        });
      }
    }
    return true;
  }
);

var get = exports.get = function(path) {
  var obj = world,
      i, prop, ref, key, func, inputs;
  if (path) {
    path = path.split('.');
    for (i = 0; prop = path[i++];) {
      obj = obj[prop];
      if (_.isUndefined(obj)) return null; // Return null if not found
      if ((ref = obj.$r) && (key = obj.$k)) {
        ref = get(ref);
        key = get(key);
        obj = ref[key];
      } else if (func = obj.$f) {
        inputs = funcInputs[func];
        inputs = (inputs.map) ? inputs.map(get) : [];
        func = funcs[func];
        if (func) obj = func.apply(null, inputs);
      }
    }
  }
  return obj;
};

var send = function(method, args, broadcast){
  var message = JSON.stringify(
    [method, _.toArray(args)]
  );
  if (_.onServer) {
    if (broadcast && socket) {
      socket.broadcast(message);
    }
  } else {
    socket.send(message);
  }
};

var _set = exports._set = function(path, value, silent, sendUpdate, broadcast) {
  var obj = world,
      eventPath = [],
      i, prop, len, child, ref, key;
  if (path) {
    path = path.split('.');
    len = path.length;
    for (i = 0; prop = path[i++];) {
      child = obj[prop];
      if (child && (ref = child.$r) && (key = child.$k)) {
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
var set = exports.set = function(path, value, broadcast) {
  _set(path, value, false, true, broadcast);
};
var setSilent = exports.setSilent = function(path, value) {
  _set(path, value, true);
};

var _push = exports._push = function(name, value, sendUpdate, broadcast) {
  var arr = world[name];
  arr.push(value);
  events.trigger(name, arr, 'push');
  if (sendUpdate) send('push', [name, value], broadcast);
};
var push = exports.push = function(name, value, broadcast) {
  _push(name, value, true, broadcast);
};

exports.func = function(name) {
  return {$f: name};
};
exports.makeFunc = function(name, inputs, func) {
  funcs[name] = func;
  funcInputs[name] = inputs;
}
exports.ref = function(ref, key) {
  return {$r: ref, $k: key};
};
exports.init = function(w) {
  world = w;
};;
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/lib/model"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/lib/socket.io"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/lib/socket.io";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/lib/socket.io", path);
    };
    
    (function () {
        /** Socket.IO 0.6.2 - Built with build.js */
/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

var io = {};
module.exports = io;

if (typeof window != 'undefined'){
  // WEB_SOCKET_SWF_LOCATION = (document.location.protocol == 'https:' ? 'https:' : 'http:') + '//cdn.socket.io/' + this.io.version + '/WebSocketMain.swf';
  if (typeof WEB_SOCKET_SWF_LOCATION === 'undefined')
    WEB_SOCKET_SWF_LOCATION = '/socket.io/lib/vendor/web-socket-js/WebSocketMain.swf';
}

/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){

	var _pageLoaded = false;

	io.util = {

		ios: false,

		load: function(fn){
			if (/loaded|complete/.test(document.readyState) || _pageLoaded) return fn();
			if ('attachEvent' in window){
				window.attachEvent('onload', fn);
			} else {
				window.addEventListener('load', fn, false);
			}
		},

		inherit: function(ctor, superCtor){
			// no support for `instanceof` for now
			for (var i in superCtor.prototype){
				ctor.prototype[i] = superCtor.prototype[i];
			}
		},

		indexOf: function(arr, item, from){
			for (var l = arr.length, i = (from < 0) ? Math.max(0, l + from) : from || 0; i < l; i++){
				if (arr[i] === item) return i;
			}
			return -1;
		},

		isArray: function(obj){
			return Object.prototype.toString.call(obj) === '[object Array]';
		},
		
    merge: function(target, additional){
      for (var i in additional)
        if (additional.hasOwnProperty(i))
          target[i] = additional[i];
    }

	};

	io.util.ios = /iphone|ipad/i.test(navigator.userAgent);
	io.util.android = /android/i.test(navigator.userAgent);
	io.util.opera = /opera/i.test(navigator.userAgent);

	io.util.load(function(){
		_pageLoaded = true;
	});

})();

/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

// abstract

(function(){
	
	var frame = '~m~',
	
	stringify = function(message){
		if (Object.prototype.toString.call(message) == '[object Object]'){
			if (!('JSON' in window)){
				if ('console' in window && console.error) console.error('Trying to encode as JSON, but JSON.stringify is missing.');
				return '{ "$error": "Invalid message" }';
			}
			return '~j~' + JSON.stringify(message);
		} else {
			return String(message);
		}
	};
	
	Transport = io.Transport = function(base, options){
		this.base = base;
		this.options = {
			timeout: 15000 // based on heartbeat interval default
		};
		io.util.merge(this.options, options);
	};

	Transport.prototype.send = function(){
		throw new Error('Missing send() implementation');
	};

	Transport.prototype.connect = function(){
		throw new Error('Missing connect() implementation');
	};

	Transport.prototype.disconnect = function(){
		throw new Error('Missing disconnect() implementation');
	};
	
	Transport.prototype._encode = function(messages){
		var ret = '', message,
				messages = io.util.isArray(messages) ? messages : [messages];
		for (var i = 0, l = messages.length; i < l; i++){
			message = messages[i] === null || messages[i] === undefined ? '' : stringify(messages[i]);
			ret += frame + message.length + frame + message;
		}
		return ret;
	};
	
	Transport.prototype._decode = function(data){
		var messages = [], number, n;
		do {
			if (data.substr(0, 3) !== frame) return messages;
			data = data.substr(3);
			number = '', n = '';
			for (var i = 0, l = data.length; i < l; i++){
				n = Number(data.substr(i, 1));
				if (data.substr(i, 1) == n){
					number += n;
				} else {	
					data = data.substr(number.length + frame.length);
					number = Number(number);
					break;
				} 
			}
			messages.push(data.substr(0, number)); // here
			data = data.substr(number);
		} while(data !== '');
		return messages;
	};
	
	Transport.prototype._onData = function(data){
		this._setTimeout();
		var msgs = this._decode(data);
		if (msgs && msgs.length){
			for (var i = 0, l = msgs.length; i < l; i++){
				this._onMessage(msgs[i]);
			}
		}
	};
	
	Transport.prototype._setTimeout = function(){
		var self = this;
		if (this._timeout) clearTimeout(this._timeout);
		this._timeout = setTimeout(function(){
			self._onTimeout();
		}, this.options.timeout);
	};
	
	Transport.prototype._onTimeout = function(){
		this._onDisconnect();
	};
	
	Transport.prototype._onMessage = function(message){
		if (!this.sessionid){
			this.sessionid = message;
			this._onConnect();
		} else if (message.substr(0, 3) == '~h~'){
			this._onHeartbeat(message.substr(3));
		} else if (message.substr(0, 3) == '~j~'){
			this.base._onMessage(JSON.parse(message.substr(3)));
		} else {
			this.base._onMessage(message);
		}
	},
	
	Transport.prototype._onHeartbeat = function(heartbeat){
		this.send('~h~' + heartbeat); // echo
	};
	
	Transport.prototype._onConnect = function(){
		this.connected = true;
		this.connecting = false;
		this.base._onConnect();
		this._setTimeout();
	};

	Transport.prototype._onDisconnect = function(){
		this.connecting = false;
		this.connected = false;
		this.sessionid = null;
		this.base._onDisconnect();
	};

	Transport.prototype._prepareUrl = function(){
		return (this.base.options.secure ? 'https' : 'http') 
			+ '://' + this.base.host 
			+ ':' + this.base.options.port
			+ '/' + this.base.options.resource
			+ '/' + this.type
			+ (this.sessionid ? ('/' + this.sessionid) : '/');
	};

})();
/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){
	
	var empty = new Function,
	    
	XMLHttpRequestCORS = (function(){
		if (!('XMLHttpRequest' in window)) return false;
		// CORS feature detection
		var a = new XMLHttpRequest();
		return a.withCredentials != undefined;
	})(),
	
	request = function(xdomain){
		if ('XDomainRequest' in window && xdomain) return new XDomainRequest();
		if ('XMLHttpRequest' in window && (!xdomain || XMLHttpRequestCORS)) return new XMLHttpRequest();
		if (!xdomain){
			try {
				var a = new ActiveXObject('MSXML2.XMLHTTP');
				return a;
			} catch(e){}
		
			try {
				var b = new ActiveXObject('Microsoft.XMLHTTP');
				return b;
			} catch(e){}
		}
		return false;
	},
	
	XHR = io.Transport.XHR = function(){
		io.Transport.apply(this, arguments);
		this._sendBuffer = [];
	};
	
	io.util.inherit(XHR, io.Transport);
	
	XHR.prototype.connect = function(){
		this._get();
		return this;
	};
	
	XHR.prototype._checkSend = function(){
		if (!this._posting && this._sendBuffer.length){
			var encoded = this._encode(this._sendBuffer);
			this._sendBuffer = [];
			this._send(encoded);
		}
	};
	
	XHR.prototype.send = function(data){
		if (io.util.isArray(data)){
			this._sendBuffer.push.apply(this._sendBuffer, data);
		} else {
			this._sendBuffer.push(data);
		}
		this._checkSend();
		return this;
	};
	
	XHR.prototype._send = function(data){
		var self = this;
		this._posting = true;
		this._sendXhr = this._request('send', 'POST');
		this._sendXhr.onreadystatechange = function(){
			var status;
			if (self._sendXhr.readyState == 4){
				self._sendXhr.onreadystatechange = empty;
				try { status = self._sendXhr.status; } catch(e){}
				self._posting = false;
				if (status == 200){
					self._checkSend();
				} else {
					self._onDisconnect();
				}
			}
		};
		this._sendXhr.send('data=' + encodeURIComponent(data));
	};
	
	XHR.prototype.disconnect = function(){
		// send disconnection signal
		this._onDisconnect();
		return this;
	};
	
	XHR.prototype._onDisconnect = function(){
		if (this._xhr){
			this._xhr.onreadystatechange = empty;
      try {
        this._xhr.abort();
      } catch(e){}
			this._xhr = null;
		}
		if (this._sendXhr){
      this._sendXhr.onreadystatechange = empty;
      try {
        this._sendXhr.abort();
      } catch(e){}
			this._sendXhr = null;
		}
		this._sendBuffer = [];
		io.Transport.prototype._onDisconnect.call(this);
	};
	
	XHR.prototype._request = function(url, method, multipart){
		var req = request(this.base._isXDomain());
		if (multipart) req.multipart = true;
		req.open(method || 'GET', this._prepareUrl() + (url ? '/' + url : ''));
		if (method == 'POST' && 'setRequestHeader' in req){
			req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=utf-8');
		}
		return req;
	};
	
	XHR.check = function(xdomain){
		try {
			if (request(xdomain)) return true;
		} catch(e){}
		return false;
	};
	
	XHR.xdomainCheck = function(){
		return XHR.check(true);
	};
	
	XHR.request = request;
	
})();

/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){
	
	var WS = io.Transport.websocket = function(){
		io.Transport.apply(this, arguments);
	};
	
	io.util.inherit(WS, io.Transport);
	
	WS.prototype.type = 'websocket';
	
	WS.prototype.connect = function(){
		var self = this;
		this.socket = new WebSocket(this._prepareUrl());
		this.socket.onmessage = function(ev){ self._onData(ev.data); };
		this.socket.onclose = function(ev){ self._onClose(); };
    this.socket.onerror = function(e){ self._onError(e); };
		return this;
	};
	
	WS.prototype.send = function(data){
		if (this.socket) this.socket.send(this._encode(data));
		return this;
	};
	
	WS.prototype.disconnect = function(){
		if (this.socket) this.socket.close();
		return this;
	};
	
	WS.prototype._onClose = function(){
		this._onDisconnect();
		return this;
	};

  WS.prototype._onError = function(e){
    this.base.emit('error', [e]);
  };
	
	WS.prototype._prepareUrl = function(){
		return (this.base.options.secure ? 'wss' : 'ws') 
		+ '://' + this.base.host 
		+ ':' + this.base.options.port
		+ '/' + this.base.options.resource
		+ '/' + this.type
		+ (this.sessionid ? ('/' + this.sessionid) : '');
	};
	
	WS.check = function(){
		// we make sure WebSocket is not confounded with a previously loaded flash WebSocket
		return 'WebSocket' in window && WebSocket.prototype && ( WebSocket.prototype.send && !!WebSocket.prototype.send.toString().match(/native/i)) && typeof WebSocket !== "undefined";
	};

	WS.xdomainCheck = function(){
		return true;
	};
	
})();

/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){
	
	var Flashsocket = io.Transport.flashsocket = function(){
		io.Transport.websocket.apply(this, arguments);
	};
	
	io.util.inherit(Flashsocket, io.Transport.websocket);
	
	Flashsocket.prototype.type = 'flashsocket';
	
	Flashsocket.prototype.connect = function(){
		var self = this, args = arguments;
		WebSocket.__addTask(function(){
			io.Transport.websocket.prototype.connect.apply(self, args);
		});
		return this;
	};
	
	Flashsocket.prototype.send = function(){
		var self = this, args = arguments;
		WebSocket.__addTask(function(){
			io.Transport.websocket.prototype.send.apply(self, args);
		});
		return this;
	};
	
	Flashsocket.check = function(){
		if (typeof WebSocket == 'undefined' || !('__addTask' in WebSocket)) return false;
		if (io.util.opera) return false; // opera is buggy with this transport
		if ('navigator' in window && 'plugins' in navigator && navigator.plugins['Shockwave Flash']){
			return !!navigator.plugins['Shockwave Flash'].description;
	  }
		if ('ActiveXObject' in window) {
			try {
				return !!new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
			} catch (e) {}
		}
		return false;
	};
	
	Flashsocket.xdomainCheck = function(){
		return true;
	};
	
})();
/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){
	
	var HTMLFile = io.Transport.htmlfile = function(){
		io.Transport.XHR.apply(this, arguments);
	};
	
	io.util.inherit(HTMLFile, io.Transport.XHR);
	
	HTMLFile.prototype.type = 'htmlfile';
	
	HTMLFile.prototype._get = function(){
		var self = this;
		this._open();
		window.attachEvent('onunload', function(){ self._destroy(); });
	};
	
	HTMLFile.prototype._open = function(){
		this._doc = new ActiveXObject('htmlfile');
		this._doc.open();
		this._doc.write('<html></html>');
		this._doc.parentWindow.s = this;
		this._doc.close();

		var _iframeC = this._doc.createElement('div');
		this._doc.body.appendChild(_iframeC);
		this._iframe = this._doc.createElement('iframe');
		_iframeC.appendChild(this._iframe);
		this._iframe.src = this._prepareUrl() + '/' + (+ new Date);
	};
	
	HTMLFile.prototype._ = function(data, doc){
		this._onData(data);
		var script = doc.getElementsByTagName('script')[0];
		script.parentNode.removeChild(script);
	};

  HTMLFile.prototype._destroy = function(){
    if (this._iframe){
      this._iframe.src = 'about:blank';
      this._doc = null;
      CollectGarbage();
    }
  };
	
	HTMLFile.prototype.disconnect = function(){
		this._destroy();
		return io.Transport.XHR.prototype.disconnect.call(this);
	};
	
	HTMLFile.check = function(){
		if ('ActiveXObject' in window){
			try {
				var a = new ActiveXObject('htmlfile');
				return a && io.Transport.XHR.check();
			} catch(e){}
		}
		return false;
	};

	HTMLFile.xdomainCheck = function(){
		// we can probably do handling for sub-domains, we should test that it's cross domain but a subdomain here
		return false;
	};
	
})();
/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){
	
	var XHRMultipart = io.Transport['xhr-multipart'] = function(){
		io.Transport.XHR.apply(this, arguments);
	};
	
	io.util.inherit(XHRMultipart, io.Transport.XHR);
	
	XHRMultipart.prototype.type = 'xhr-multipart';
	
	XHRMultipart.prototype._get = function(){
		var self = this;
		this._xhr = this._request('', 'GET', true);
		this._xhr.onreadystatechange = function(){
			if (self._xhr.readyState == 4) self._onData(self._xhr.responseText);
		};
		this._xhr.send(null);
	};
	
	XHRMultipart.check = function(){
		return 'XMLHttpRequest' in window && 'prototype' in XMLHttpRequest && 'multipart' in XMLHttpRequest.prototype;
	};

	XHRMultipart.xdomainCheck = function(){
		return true;
	};
	
})();

/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){

	var empty = new Function(),

	XHRPolling = io.Transport['xhr-polling'] = function(){
		io.Transport.XHR.apply(this, arguments);
	};

	io.util.inherit(XHRPolling, io.Transport.XHR);

	XHRPolling.prototype.type = 'xhr-polling';

	XHRPolling.prototype.connect = function(){
		if (io.util.ios || io.util.android){
			var self = this;
			io.util.load(function(){
				setTimeout(function(){
					io.Transport.XHR.prototype.connect.call(self);
				}, 10);
			});
		} else {
			io.Transport.XHR.prototype.connect.call(this);
		}
	};

	XHRPolling.prototype._get = function(){
		var self = this;
		this._xhr = this._request(+ new Date, 'GET');
    this._xhr.onreadystatechange = function(){
      var status;
      if (self._xhr.readyState == 4){
        self._xhr.onreadystatechange = empty;
        try { status = self._xhr.status; } catch(e){}
        if (status == 200){
          self._onData(self._xhr.responseText);
          self._get();
        } else {
          self._onDisconnect();
        }
      }
    };
		this._xhr.send(null);
	};

	XHRPolling.check = function(){
		return io.Transport.XHR.check();
	};

	XHRPolling.xdomainCheck = function(){
		return io.Transport.XHR.xdomainCheck();
	};

})();

/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

io.JSONP = [];

JSONPPolling = io.Transport['jsonp-polling'] = function(){
	io.Transport.XHR.apply(this, arguments);
	this._insertAt = document.getElementsByTagName('script')[0];
	this._index = io.JSONP.length;
	io.JSONP.push(this);
};

io.util.inherit(JSONPPolling, io.Transport['xhr-polling']);

JSONPPolling.prototype.type = 'jsonp-polling';

JSONPPolling.prototype._send = function(data){
	var self = this;
	if (!('_form' in this)){
		var form = document.createElement('FORM'),
		    area = document.createElement('TEXTAREA'),
		    id = this._iframeId = 'socket_io_iframe_' + this._index,
		    iframe;

		form.style.position = 'absolute';
		form.style.top = '-1000px';
		form.style.left = '-1000px';
		form.target = id;
		form.method = 'POST';
		form.action = this._prepareUrl() + '/' + (+new Date) + '/' + this._index;
		area.name = 'data';
		form.appendChild(area);
		this._insertAt.parentNode.insertBefore(form, this._insertAt);
		document.body.appendChild(form);

		this._form = form;
		this._area = area;
	}

	function complete(){
		initIframe();
		self._posting = false;
		self._checkSend();
	};

	function initIframe(){
		if (self._iframe){
			self._form.removeChild(self._iframe);
		} 

		try {
			// ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
			iframe = document.createElement('<iframe name="'+ self._iframeId +'">');
		} catch(e){
			iframe = document.createElement('iframe');
			iframe.name = self._iframeId;
		}

		iframe.id = self._iframeId;

		self._form.appendChild(iframe);
		self._iframe = iframe;
	};

	initIframe();

	this._posting = true;
	this._area.value = data;

	try {
		this._form.submit();
	} catch(e){}

	if (this._iframe.attachEvent){
		iframe.onreadystatechange = function(){
			if (self._iframe.readyState == 'complete') complete();
		};
	} else {
		this._iframe.onload = complete;
	}
};

JSONPPolling.prototype._get = function(){
	var self = this,
			script = document.createElement('SCRIPT');
	if (this._script){
		this._script.parentNode.removeChild(this._script);
		this._script = null;
	}
	script.async = true;
	script.src = this._prepareUrl() + '/' + (+new Date) + '/' + this._index;
	script.onerror = function(){
		self._onDisconnect();
	};
	this._insertAt.parentNode.insertBefore(script, this._insertAt);
	this._script = script;
};

JSONPPolling.prototype._ = function(){
	this._onData.apply(this, arguments);
	this._get();
	return this;
};

JSONPPolling.check = function(){
	return true;
};

JSONPPolling.xdomainCheck = function(){
	return true;
};
/**
 * Socket.IO client
 * 
 * @author Guillermo Rauch <guillermo@learnboost.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 */

(function(){
	
	var Socket = io.Socket = function(host, options){
		this.host = host || document.domain;
		this.options = {
			secure: false,
			document: document,
			port: document.location.port || 80,
			resource: 'socket.io',
			transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'],
			transportOptions: {
				'xhr-polling': {
					timeout: 25000 // based on polling duration default
				},
				'jsonp-polling': {
					timeout: 25000
				}
			},
			connectTimeout: 5000,
			tryTransportsOnConnectTimeout: true,
			rememberTransport: true
		};
		io.util.merge(this.options, options);
		this.connected = false;
		this.connecting = false;
		this._events = {};
		this.transport = this.getTransport();
		if (!this.transport && 'console' in window) console.error('No transport available');
	};
	
	Socket.prototype.getTransport = function(override){
		var transports = override || this.options.transports, match;
		if (this.options.rememberTransport && !override){
			match = this.options.document.cookie.match('(?:^|;)\\s*socketio=([^;]*)');
			if (match){
				this._rememberedTransport = true;
				transports = [decodeURIComponent(match[1])];
			}
		} 
		for (var i = 0, transport; transport = transports[i]; i++){
			if (io.Transport[transport] 
				&& io.Transport[transport].check() 
				&& (!this._isXDomain() || io.Transport[transport].xdomainCheck())){
				return new io.Transport[transport](this, this.options.transportOptions[transport] || {});
			}
		}
		return null;
	};
	
	Socket.prototype.connect = function(){
		if (this.transport && !this.connected){
			if (this.connecting) this.disconnect();
			this.connecting = true;
			this.emit('connecting', [this.transport.type]);
			this.transport.connect();
			if (this.options.connectTimeout){
				var self = this;
				this.connectTimeoutTimer = setTimeout(function(){
					if (!self.connected){
						self.disconnect();
						if (self.options.tryTransportsOnConnectTimeout && !self._rememberedTransport){
							if(!self._remainingTransports) self._remainingTransports = self.options.transports.slice(0);
							var transports = self._remainingTransports;
							while(transports.length > 0 && transports.splice(0,1)[0] != self.transport.type){}
							if(transports.length){
								self.transport = self.getTransport(transports);
								self.connect();
							}
						}
						if(!self._remainingTransports || self._remainingTransports.length == 0) self.emit('connect_failed');
					}
					if(self._remainingTransports && self._remainingTransports.length == 0) delete self._remainingTransports;
				}, this.options.connectTimeout);
			}
		}
		return this;
	};
	
	Socket.prototype.send = function(data){
		if (!this.transport || !this.transport.connected) return this._queue(data);
		this.transport.send(data);
		return this;
	};
	
	Socket.prototype.disconnect = function(){
    if (this.connectTimeoutTimer) clearTimeout(this.connectTimeoutTimer);
		this.transport.disconnect();
		return this;
	};
	
	Socket.prototype.on = function(name, fn){
		if (!(name in this._events)) this._events[name] = [];
		this._events[name].push(fn);
		return this;
	};
	
  Socket.prototype.emit = function(name, args){
    if (name in this._events){
      var events = this._events[name].concat();
      for (var i = 0, ii = events.length; i < ii; i++)
        events[i].apply(this, args === undefined ? [] : args);
    }
    return this;
  };

	Socket.prototype.removeEvent = function(name, fn){
		if (name in this._events){
			for (var a = 0, l = this._events[name].length; a < l; a++)
				if (this._events[name][a] == fn) this._events[name].splice(a, 1);		
		}
		return this;
	};
	
	Socket.prototype._queue = function(message){
		if (!('_queueStack' in this)) this._queueStack = [];
		this._queueStack.push(message);
		return this;
	};
	
	Socket.prototype._doQueue = function(){
		if (!('_queueStack' in this) || !this._queueStack.length) return this;
		this.transport.send(this._queueStack);
		this._queueStack = [];
		return this;
	};
	
	Socket.prototype._isXDomain = function(){
		return this.host !== document.domain;
	};
	
	Socket.prototype._onConnect = function(){
		this.connected = true;
		this.connecting = false;
		this._doQueue();
		if (this.options.rememberTransport) this.options.document.cookie = 'socketio=' + encodeURIComponent(this.transport.type);
		this.emit('connect');
	};
	
	Socket.prototype._onMessage = function(data){
		this.emit('message', [data]);
	};
	
	Socket.prototype._onDisconnect = function(){
		var wasConnected = this.connected;
		this.connected = false;
		this.connecting = false;
		this._queueStack = [];
		if (wasConnected) this.emit('disconnect');
	};

  Socket.prototype.fire = Socket.prototype.emit;
	
	Socket.prototype.addListener = Socket.prototype.addEvent = Socket.prototype.addEventListener = Socket.prototype.on;
	
})();

/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();
/*
/*
Copyright 2006 Adobe Systems Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


/*
 * The Bridge class, responsible for navigating AS instances
 */
function FABridge(target,bridgeName)
{
    this.target = target;
    this.remoteTypeCache = {};
    this.remoteInstanceCache = {};
    this.remoteFunctionCache = {};
    this.localFunctionCache = {};
    this.bridgeID = FABridge.nextBridgeID++;
    this.name = bridgeName;
    this.nextLocalFuncID = 0;
    FABridge.instances[this.name] = this;
    FABridge.idMap[this.bridgeID] = this;

    return this;
}

// type codes for packed values
FABridge.TYPE_ASINSTANCE =  1;
FABridge.TYPE_ASFUNCTION =  2;

FABridge.TYPE_JSFUNCTION =  3;
FABridge.TYPE_ANONYMOUS =   4;

FABridge.initCallbacks = {};
FABridge.userTypes = {};

FABridge.addToUserTypes = function()
{
	for (var i = 0; i < arguments.length; i++)
	{
		FABridge.userTypes[arguments[i]] = {
			'typeName': arguments[i], 
			'enriched': false
		};
	}
}

FABridge.argsToArray = function(args)
{
    var result = [];
    for (var i = 0; i < args.length; i++)
    {
        result[i] = args[i];
    }
    return result;
}

function instanceFactory(objID)
{
    this.fb_instance_id = objID;
    return this;
}

function FABridge__invokeJSFunction(args)
{  
    var funcID = args[0];
    var throughArgs = args.concat();//FABridge.argsToArray(arguments);
    throughArgs.shift();
   
    var bridge = FABridge.extractBridgeFromID(funcID);
    return bridge.invokeLocalFunction(funcID, throughArgs);
}

FABridge.addInitializationCallback = function(bridgeName, callback)
{
    var inst = FABridge.instances[bridgeName];
    if (inst != undefined)
    {
        callback.call(inst);
        return;
    }

    var callbackList = FABridge.initCallbacks[bridgeName];
    if(callbackList == null)
    {
        FABridge.initCallbacks[bridgeName] = callbackList = [];
    }

    callbackList.push(callback);
}

// updated for changes to SWFObject2
function FABridge__bridgeInitialized(bridgeName) {
    var objects = document.getElementsByTagName("object");
    var ol = objects.length;
    var activeObjects = [];
    if (ol > 0) {
		for (var i = 0; i < ol; i++) {
			if (typeof objects[i].SetVariable != "undefined") {
				activeObjects[activeObjects.length] = objects[i];
			}
		}
	}
    var embeds = document.getElementsByTagName("embed");
    var el = embeds.length;
    var activeEmbeds = [];
    if (el > 0) {
		for (var j = 0; j < el; j++) {
			if (typeof embeds[j].SetVariable != "undefined") {
            	activeEmbeds[activeEmbeds.length] = embeds[j];
            }
        }
    }
    var aol = activeObjects.length;
    var ael = activeEmbeds.length;
    var searchStr = "bridgeName="+ bridgeName;
    if ((aol == 1 && !ael) || (aol == 1 && ael == 1)) {
    	FABridge.attachBridge(activeObjects[0], bridgeName);	 
    }
    else if (ael == 1 && !aol) {
    	FABridge.attachBridge(activeEmbeds[0], bridgeName);
        }
    else {
                var flash_found = false;
		if (aol > 1) {
			for (var k = 0; k < aol; k++) {
				 var params = activeObjects[k].childNodes;
				 for (var l = 0; l < params.length; l++) {
					var param = params[l];
					if (param.nodeType == 1 && param.tagName.toLowerCase() == "param" && param["name"].toLowerCase() == "flashvars" && param["value"].indexOf(searchStr) >= 0) {
						FABridge.attachBridge(activeObjects[k], bridgeName);
                            flash_found = true;
                            break;
                        }
                    }
                if (flash_found) {
                    break;
                }
            }
        }
		if (!flash_found && ael > 1) {
			for (var m = 0; m < ael; m++) {
				var flashVars = activeEmbeds[m].attributes.getNamedItem("flashVars").nodeValue;
				if (flashVars.indexOf(searchStr) >= 0) {
					FABridge.attachBridge(activeEmbeds[m], bridgeName);
					break;
    }
            }
        }
    }
    return true;
}

// used to track multiple bridge instances, since callbacks from AS are global across the page.

FABridge.nextBridgeID = 0;
FABridge.instances = {};
FABridge.idMap = {};
FABridge.refCount = 0;

FABridge.extractBridgeFromID = function(id)
{
    var bridgeID = (id >> 16);
    return FABridge.idMap[bridgeID];
}

FABridge.attachBridge = function(instance, bridgeName)
{
    var newBridgeInstance = new FABridge(instance, bridgeName);

    FABridge[bridgeName] = newBridgeInstance;

/*  FABridge[bridgeName] = function() {
        return newBridgeInstance.root();
    }
*/
    var callbacks = FABridge.initCallbacks[bridgeName];
    if (callbacks == null)
    {
        return;
    }
    for (var i = 0; i < callbacks.length; i++)
    {
        callbacks[i].call(newBridgeInstance);
    }
    delete FABridge.initCallbacks[bridgeName]
}

// some methods can't be proxied.  You can use the explicit get,set, and call methods if necessary.

FABridge.blockedMethods =
{
    toString: true,
    get: true,
    set: true,
    call: true
};

FABridge.prototype =
{


// bootstrapping

    root: function()
    {
        return this.deserialize(this.target.getRoot());
    },
//clears all of the AS objects in the cache maps
    releaseASObjects: function()
    {
        return this.target.releaseASObjects();
    },
//clears a specific object in AS from the type maps
    releaseNamedASObject: function(value)
    {
        if(typeof(value) != "object")
        {
            return false;
        }
        else
        {
            var ret =  this.target.releaseNamedASObject(value.fb_instance_id);
            return ret;
        }
    },
//create a new AS Object
    create: function(className)
    {
        return this.deserialize(this.target.create(className));
    },


    // utilities

    makeID: function(token)
    {
        return (this.bridgeID << 16) + token;
    },


    // low level access to the flash object

//get a named property from an AS object
    getPropertyFromAS: function(objRef, propName)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            retVal = this.target.getPropFromAS(objRef, propName);
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },
//set a named property on an AS object
    setPropertyInAS: function(objRef,propName, value)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            retVal = this.target.setPropInAS(objRef,propName, this.serialize(value));
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },

//call an AS function
    callASFunction: function(funcID, args)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            retVal = this.target.invokeASFunction(funcID, this.serialize(args));
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },
//call a method on an AS object
    callASMethod: function(objID, funcName, args)
    {
        if (FABridge.refCount > 0)
        {
            throw new Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
        }
        else
        {
            FABridge.refCount++;
            args = this.serialize(args);
            retVal = this.target.invokeASMethod(objID, funcName, args);
            retVal = this.handleError(retVal);
            FABridge.refCount--;
            return retVal;
        }
    },

    // responders to remote calls from flash

    //callback from flash that executes a local JS function
    //used mostly when setting js functions as callbacks on events
    invokeLocalFunction: function(funcID, args)
    {
        var result;
        var func = this.localFunctionCache[funcID];

        if(func != undefined)
        {
            result = this.serialize(func.apply(null, this.deserialize(args)));
        }

        return result;
    },

    // Object Types and Proxies
	
    // accepts an object reference, returns a type object matching the obj reference.
    getTypeFromName: function(objTypeName)
    {
        return this.remoteTypeCache[objTypeName];
    },
    //create an AS proxy for the given object ID and type
    createProxy: function(objID, typeName)
    {
        var objType = this.getTypeFromName(typeName);
	        instanceFactory.prototype = objType;
	        var instance = new instanceFactory(objID);
        this.remoteInstanceCache[objID] = instance;
        return instance;
    },
    //return the proxy associated with the given object ID
    getProxy: function(objID)
    {
        return this.remoteInstanceCache[objID];
    },

    // accepts a type structure, returns a constructed type
    addTypeDataToCache: function(typeData)
    {
        var newType = new ASProxy(this, typeData.name);
        var accessors = typeData.accessors;
        for (var i = 0; i < accessors.length; i++)
        {
            this.addPropertyToType(newType, accessors[i]);
        }

        var methods = typeData.methods;
        for (var i = 0; i < methods.length; i++)
        {
            if (FABridge.blockedMethods[methods[i]] == undefined)
            {
                this.addMethodToType(newType, methods[i]);
            }
        }


        this.remoteTypeCache[newType.typeName] = newType;
        return newType;
    },

    //add a property to a typename; used to define the properties that can be called on an AS proxied object
    addPropertyToType: function(ty, propName)
    {
        var c = propName.charAt(0);
        var setterName;
        var getterName;
        if(c >= "a" && c <= "z")
        {
            getterName = "get" + c.toUpperCase() + propName.substr(1);
            setterName = "set" + c.toUpperCase() + propName.substr(1);
        }
        else
        {
            getterName = "get" + propName;
            setterName = "set" + propName;
        }
        ty[setterName] = function(val)
        {
            this.bridge.setPropertyInAS(this.fb_instance_id, propName, val);
        }
        ty[getterName] = function()
        {
            return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id, propName));
        }
    },

    //add a method to a typename; used to define the methods that can be callefd on an AS proxied object
    addMethodToType: function(ty, methodName)
    {
        ty[methodName] = function()
        {
            return this.bridge.deserialize(this.bridge.callASMethod(this.fb_instance_id, methodName, FABridge.argsToArray(arguments)));
        }
    },

    // Function Proxies

    //returns the AS proxy for the specified function ID
    getFunctionProxy: function(funcID)
    {
        var bridge = this;
        if (this.remoteFunctionCache[funcID] == null)
        {
            this.remoteFunctionCache[funcID] = function()
            {
                bridge.callASFunction(funcID, FABridge.argsToArray(arguments));
            }
        }
        return this.remoteFunctionCache[funcID];
    },
    
    //reutrns the ID of the given function; if it doesnt exist it is created and added to the local cache
    getFunctionID: function(func)
    {
        if (func.__bridge_id__ == undefined)
        {
            func.__bridge_id__ = this.makeID(this.nextLocalFuncID++);
            this.localFunctionCache[func.__bridge_id__] = func;
        }
        return func.__bridge_id__;
    },

    // serialization / deserialization

    serialize: function(value)
    {
        var result = {};

        var t = typeof(value);
        //primitives are kept as such
        if (t == "number" || t == "string" || t == "boolean" || t == null || t == undefined)
        {
            result = value;
        }
        else if (value instanceof Array)
        {
            //arrays are serializesd recursively
            result = [];
            for (var i = 0; i < value.length; i++)
            {
                result[i] = this.serialize(value[i]);
            }
        }
        else if (t == "function")
        {
            //js functions are assigned an ID and stored in the local cache 
            result.type = FABridge.TYPE_JSFUNCTION;
            result.value = this.getFunctionID(value);
        }
        else if (value instanceof ASProxy)
        {
            result.type = FABridge.TYPE_ASINSTANCE;
            result.value = value.fb_instance_id;
        }
        else
        {
            result.type = FABridge.TYPE_ANONYMOUS;
            result.value = value;
        }

        return result;
    },

    //on deserialization we always check the return for the specific error code that is used to marshall NPE's into JS errors
    // the unpacking is done by returning the value on each pachet for objects/arrays 
    deserialize: function(packedValue)
    {

        var result;

        var t = typeof(packedValue);
        if (t == "number" || t == "string" || t == "boolean" || packedValue == null || packedValue == undefined)
        {
            result = this.handleError(packedValue);
        }
        else if (packedValue instanceof Array)
        {
            result = [];
            for (var i = 0; i < packedValue.length; i++)
            {
                result[i] = this.deserialize(packedValue[i]);
            }
        }
        else if (t == "object")
        {
            for(var i = 0; i < packedValue.newTypes.length; i++)
            {
                this.addTypeDataToCache(packedValue.newTypes[i]);
            }
            for (var aRefID in packedValue.newRefs)
            {
                this.createProxy(aRefID, packedValue.newRefs[aRefID]);
            }
            if (packedValue.type == FABridge.TYPE_PRIMITIVE)
            {
                result = packedValue.value;
            }
            else if (packedValue.type == FABridge.TYPE_ASFUNCTION)
            {
                result = this.getFunctionProxy(packedValue.value);
            }
            else if (packedValue.type == FABridge.TYPE_ASINSTANCE)
            {
                result = this.getProxy(packedValue.value);
            }
            else if (packedValue.type == FABridge.TYPE_ANONYMOUS)
            {
                result = packedValue.value;
            }
        }
        return result;
    },
    //increases the reference count for the given object
    addRef: function(obj)
    {
        this.target.incRef(obj.fb_instance_id);
    },
    //decrease the reference count for the given object and release it if needed
    release:function(obj)
    {
        this.target.releaseRef(obj.fb_instance_id);
    },

    // check the given value for the components of the hard-coded error code : __FLASHERROR
    // used to marshall NPE's into flash
    
    handleError: function(value)
    {
        if (typeof(value)=="string" && value.indexOf("__FLASHERROR")==0)
        {
            var myErrorMessage = value.split("||");
            if(FABridge.refCount > 0 )
            {
                FABridge.refCount--;
            }
            throw new Error(myErrorMessage[1]);
            return value;
        }
        else
        {
            return value;
        }   
    }
};

// The root ASProxy class that facades a flash object

ASProxy = function(bridge, typeName)
{
    this.bridge = bridge;
    this.typeName = typeName;
    return this;
};
//methods available on each ASProxy object
ASProxy.prototype =
{
    get: function(propName)
    {
        return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id, propName));
    },

    set: function(propName, value)
    {
        this.bridge.setPropertyInAS(this.fb_instance_id, propName, value);
    },

    call: function(funcName, args)
    {
        this.bridge.callASMethod(this.fb_instance_id, funcName, args);
    }, 
    
    addRef: function() {
        this.bridge.addRef(this);
    }, 
    
    release: function() {
        this.bridge.release(this);
    }
};

// Copyright: Hiroshi Ichikawa <http://gimite.net/en/>
// License: New BSD License
// Reference: http://dev.w3.org/html5/websockets/
// Reference: http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol

(function() {
  
  if (window.WebSocket) return;

  var console = window.console;
  if (!console || !console.log || !console.error) {
    console = {log: function(){ }, error: function(){ }};
  }
  
  if (!swfobject.hasFlashPlayerVersion("9.0.0")) {
    console.error("Flash Player is not installed.");
    return;
  }
  if (location.protocol == "file:") {
    console.error(
      "WARNING: web-socket-js doesn't work in file:///... URL " +
      "unless you set Flash Security Settings properly. " +
      "Open the page via Web server i.e. http://...");
  }

  WebSocket = function(url, protocol, proxyHost, proxyPort, headers) {
    var self = this;
    self.readyState = WebSocket.CONNECTING;
    self.bufferedAmount = 0;
    // Uses setTimeout() to make sure __createFlash() runs after the caller sets ws.onopen etc.
    // Otherwise, when onopen fires immediately, onopen is called before it is set.
    setTimeout(function() {
      WebSocket.__addTask(function() {
        self.__createFlash(url, protocol, proxyHost, proxyPort, headers);
      });
    }, 0);
  };
  
  WebSocket.prototype.__createFlash = function(url, protocol, proxyHost, proxyPort, headers) {
    var self = this;
    self.__flash =
      WebSocket.__flash.create(url, protocol, proxyHost || null, proxyPort || 0, headers || null);
    self.__flash.addEventListener("event", function(fe) {
      // Uses setTimeout() to workaround the error:
      // > You are trying to call recursively into the Flash Player which is not allowed.
      setTimeout(function() { self.__handleEvents(); }, 0);
    });
    //console.log("[WebSocket] Flash object is ready");
  };

  WebSocket.prototype.send = function(data) {
    if (!this.__flash || this.readyState == WebSocket.CONNECTING) {
      throw "INVALID_STATE_ERR: Web Socket connection has not been established";
    }
    // We use encodeURIComponent() here, because FABridge doesn't work if
    // the argument includes some characters. We don't use escape() here
    // because of this:
    // https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Functions#escape_and_unescape_Functions
    // But it looks decodeURIComponent(encodeURIComponent(s)) doesn't
    // preserve all Unicode characters either e.g. "\uffff" in Firefox.
    var result = this.__flash.send(encodeURIComponent(data));
    if (result < 0) { // success
      return true;
    } else {
      this.bufferedAmount += result;
      return false;
    }
  };

  WebSocket.prototype.close = function() {
    var self = this;
    if (!self.__flash) return;
    if (self.readyState == WebSocket.CLOSED || self.readyState == WebSocket.CLOSING) return;
    self.__flash.close();
    // Sets/calls them manually here because Flash WebSocketConnection.close cannot fire events
    // which causes weird error:
    // > You are trying to call recursively into the Flash Player which is not allowed.
    self.readyState = WebSocket.CLOSED;
    if (self.__timer) clearInterval(self.__timer);
    if (self.onclose) {
       // Make it asynchronous so that it looks more like an actual
       // close event
       setTimeout(self.onclose, 0);
     }
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture !NB Not implemented yet
   * @return void
   */
  WebSocket.prototype.addEventListener = function(type, listener, useCapture) {
    if (!('__events' in this)) {
      this.__events = {};
    }
    if (!(type in this.__events)) {
      this.__events[type] = [];
      if ('function' == typeof this['on' + type]) {
        this.__events[type].defaultHandler = this['on' + type];
        this['on' + type] = this.__createEventHandler(this, type);
      }
    }
    this.__events[type].push(listener);
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {string} type
   * @param {function} listener
   * @param {boolean} useCapture NB! Not implemented yet
   * @return void
   */
  WebSocket.prototype.removeEventListener = function(type, listener, useCapture) {
    if (!('__events' in this)) {
      this.__events = {};
    }
    if (!(type in this.__events)) return;
    for (var i = this.__events.length; i > -1; --i) {
      if (listener === this.__events[type][i]) {
        this.__events[type].splice(i, 1);
        break;
      }
    }
  };

  /**
   * Implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-registration">DOM 2 EventTarget Interface</a>}
   *
   * @param {WebSocketEvent} event
   * @return void
   */
  WebSocket.prototype.dispatchEvent = function(event) {
    if (!('__events' in this)) throw 'UNSPECIFIED_EVENT_TYPE_ERR';
    if (!(event.type in this.__events)) throw 'UNSPECIFIED_EVENT_TYPE_ERR';

    for (var i = 0, l = this.__events[event.type].length; i < l; ++ i) {
      this.__events[event.type][i](event);
      if (event.cancelBubble) break;
    }

    if (false !== event.returnValue &&
        'function' == typeof this.__events[event.type].defaultHandler)
    {
      this.__events[event.type].defaultHandler(event);
    }
  };

  WebSocket.prototype.__handleEvents = function() {
    // Gets events using receiveEvents() instead of getting it from event object
    // of Flash event. This is to make sure to keep message order.
    // It seems sometimes Flash events don't arrive in the same order as they are sent.
    var events = this.__flash.receiveEvents();
    for (var i = 0; i < events.length; i++) {
      try {
        var event = events[i];
        if ("readyState" in event) {
          this.readyState = event.readyState;
        }
        if (event.type == "open") {
          
          if (this.__timer) clearInterval(this.__timer);
          if (window.opera) {
            // Workaround for weird behavior of Opera which sometimes drops events.
            this.__timer = setInterval(function () {
              this.__handleEvents();
            }, 500);
          }
          if (this.onopen) this.onopen();
          
        } else if (event.type == "close") {
          
          if (this.__timer) clearInterval(this.__timer);
          if (this.onclose) this.onclose();
          
        } else if (event.type == "message") {
          
          if (this.onmessage) {
            var data = decodeURIComponent(event.data);
            var e;
            if (window.MessageEvent && !window.opera) {
              e = document.createEvent("MessageEvent");
              e.initMessageEvent("message", false, false, data, null, null, window, null);
            } else {
              // IE and Opera, the latter one truncates the data parameter after any 0x00 bytes.
              e = {data: data};
            }
            this.onmessage(e);
          }
          
        } else if (event.type == "error") {
          
          if (this.__timer) clearInterval(this.__timer);
          if (this.onerror) this.onerror();
          
        } else {
          throw "unknown event type: " + event.type;
        }
      } catch (e) {
        console.error(e.toString());
      }
    }
  };
  
  /**
   * @param {object} object
   * @param {string} type
   */
  WebSocket.prototype.__createEventHandler = function(object, type) {
    return function(data) {
      var event = new WebSocketEvent();
      event.initEvent(type, true, true);
      event.target = event.currentTarget = object;
      for (var key in data) {
        event[key] = data[key];
      }
      object.dispatchEvent(event, arguments);
    };
  };

  /**
   * Basic implementation of {@link <a href="http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface">DOM 2 EventInterface</a>}
   *
   * @class
   * @constructor
   */
  function WebSocketEvent(){}

  /**
   *
   * @type boolean
   */
  WebSocketEvent.prototype.cancelable = true;

  /**
   *
   * @type boolean
   */
  WebSocketEvent.prototype.cancelBubble = false;

  /**
   *
   * @return void
   */
  WebSocketEvent.prototype.preventDefault = function() {
    if (this.cancelable) {
      this.returnValue = false;
    }
  };

  /**
   *
   * @return void
   */
  WebSocketEvent.prototype.stopPropagation = function() {
    this.cancelBubble = true;
  };

  /**
   *
   * @param {string} eventTypeArg
   * @param {boolean} canBubbleArg
   * @param {boolean} cancelableArg
   * @return void
   */
  WebSocketEvent.prototype.initEvent = function(eventTypeArg, canBubbleArg, cancelableArg) {
    this.type = eventTypeArg;
    this.cancelable = cancelableArg;
    this.timeStamp = new Date();
  };


  WebSocket.CONNECTING = 0;
  WebSocket.OPEN = 1;
  WebSocket.CLOSING = 2;
  WebSocket.CLOSED = 3;

  WebSocket.__tasks = [];

  WebSocket.loadFlashPolicyFile = function(url) {
    WebSocket.__addTask(function() {
      WebSocket.__flash.loadManualPolicyFile(url);
    });
  }

  WebSocket.__initialize = function() {
    if (WebSocket.__swfLocation) {
      // For backword compatibility.
      window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation;
    }
    if (!window.WEB_SOCKET_SWF_LOCATION) {
      console.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
      return;
    }
    var container = document.createElement("div");
    container.id = "webSocketContainer";
    // Hides Flash box. We cannot use display: none or visibility: hidden because it prevents
    // Flash from loading at least in IE. So we move it out of the screen at (-100, -100).
    // But this even doesn't work with Flash Lite (e.g. in Droid Incredible). So with Flash
    // Lite, we put it at (0, 0). This shows 1x1 box visible at left-top corner but this is
    // the best we can do as far as we know now.
    container.style.position = "absolute";
    if (WebSocket.__isFlashLite()) {
      container.style.left = "0px";
      container.style.top = "0px";
    } else {
      container.style.left = "-100px";
      container.style.top = "-100px";
    }
    var holder = document.createElement("div");
    holder.id = "webSocketFlash";
    container.appendChild(holder);
    document.body.appendChild(container);
    // See this article for hasPriority:
    // http://help.adobe.com/en_US/as3/mobile/WS4bebcd66a74275c36cfb8137124318eebc6-7ffd.html
    swfobject.embedSWF(
      WEB_SOCKET_SWF_LOCATION, "webSocketFlash",
      "1" /* width */, "1" /* height */, "9.0.0" /* SWF version */,
      null, {bridgeName: "webSocket"}, {hasPriority: true, allowScriptAccess: "always"}, null,
      function(e) {
        if (!e.success) console.error("[WebSocket] swfobject.embedSWF failed");
      }
    );
    FABridge.addInitializationCallback("webSocket", function() {
      try {
        //console.log("[WebSocket] FABridge initializad");
        WebSocket.__flash = FABridge.webSocket.root();
        WebSocket.__flash.setCallerUrl(location.href);
        WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
        for (var i = 0; i < WebSocket.__tasks.length; ++i) {
          WebSocket.__tasks[i]();
        }
        WebSocket.__tasks = [];
      } catch (e) {
        console.error("[WebSocket] " + e.toString());
      }
    });
  };

  WebSocket.__addTask = function(task) {
    if (WebSocket.__flash) {
      task();
    } else {
      WebSocket.__tasks.push(task);
    }
  };
  
  WebSocket.__isFlashLite = function() {
    if (!window.navigator || !window.navigator.mimeTypes) return false;
    var mimeType = window.navigator.mimeTypes["application/x-shockwave-flash"];
    if (!mimeType || !mimeType.enabledPlugin || !mimeType.enabledPlugin.filename) return false;
    return mimeType.enabledPlugin.filename.match(/flashlite/i) ? true : false;
  };

  // called from Flash
  window.webSocketLog = function(message) {
    console.log(decodeURIComponent(message));
  };

  // called from Flash
  window.webSocketError = function(message) {
    console.error(decodeURIComponent(message));
  };

  if (!window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION) {
    if (window.addEventListener) {
      window.addEventListener("load", WebSocket.__initialize, false);
    } else {
      window.attachEvent("onload", WebSocket.__initialize);
    }
  }
  
})();

;
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/lib/socket.io"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/lib/utils"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/lib/utils";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/lib/utils", path);
    };
    
    (function () {
        var _ = exports;
    
// Based on Underscore.js:

var isArray = _.isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};
var isArguments = _.isArguments = function(obj) {
  return !!(obj && hasOwnProperty.call(obj, 'callee'));
};
_.isFunction = function(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
};
_.isString = function(obj) {
  return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
};
_.isNumber = function(obj) {
  return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
};
// NaN happens to be the only value in JavaScript that does not equal itself.
_.isNaN = function(obj) {
  return obj !== obj;
};
_.isBoolean = function(obj) {
  return obj === true || obj === false;
};
_.isDate = function(obj) {
  return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
};
_.isRegExp = function(obj) {
  return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
};
_.isNull = function(obj) {
  return obj === null;
};
_.isUndefined = function(obj) {
  return obj === void 0;
};
_.isDefined = function(obj) {
  return obj !== void 0;
};
// Safely convert anything iterable into a real, live array.
_.toArray = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  if (isArguments(iterable)) return Array.slice.call(iterable);
  if (isArray(iterable)) return iterable;
  return forEach(iterable, function(key, value) { return value; });
};

// Custom utils:

_.toInteger = function(obj) {
  return obj - 0;
};

_.onServer = typeof window === 'undefined';

var forEach = _.forEach = function(obj, iterator) {
  for (var key in obj) {
    iterator(key, obj[key]);
  }
}

if (_.onServer) {
  _.minify = (function() {
    var store = {},
        uglify = require('uglify-js')
    
    return function(js, cache) {
      if (cache && store[js]) return store[js];
      var ufuncs = uglify.uglify,
          out = uglify.parser.parse(js);
      out = ufuncs.ast_mangle(out);
      out = ufuncs.ast_squeeze(out);
      out = ufuncs.gen_code(out);
      if (cache) store[js] = out;
      return out;
    };
  })();
};
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/lib/utils"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/lib/view"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/lib/view";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/lib/view", path);
    };
    
    (function () {
        var _ = require('./utils'),
    htmlParser = require('./htmlParser'),
    views = {},
    loadFuncs = '',
    clientName, jsFile, dom, model;

exports._link = function(d, m) {
  dom = d;
  model = m;
}
exports._setClientName = function(s) {
  clientName = s;
};
exports._setJsFile = function(s) {
  jsFile = s;
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

function quoteAttr(s) {
  return (s && s.indexOf) ? (/[ =]/.test(s) ? '"' + s + '"' : s) : '""';
}

function parse(template) {
  var stack = [],
      events = [],
      html = [''],
      htmlIndex = 0,
      elementParse;

  function modelText(name, escaped, quote) {
    return function(data) {
      var datum = data[name],
          obj = datum.model ? model.get(datum.model) : datum,
          text = datum.view ? get(datum.view, obj) : obj;
      if (escaped) text = htmlEscape(text);
      if (quote) text = quoteAttr(text);
      return text;
    }
  }
  
  function extractPlaceholder(text) {
    var match = /^(.*?)(\{{2,3})(\w+)\}{2,3}(.*)$/.exec(text);
    return (match) ? {
      pre: match[1],
      escaped: match[2] === '{{',
      name: match[3],
      post: match[4]
    } : null;
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
  };
  
  htmlParse = {
    start: function(tag, attrs) {
      _.forEach(attrs, function(key, value) {
        var match, name, method, setMethod;
        if (match = extractPlaceholder(value)) {
          name = match.name;
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
          attrs[key] = modelText(name, match.escaped, true);
        }
      });
      stack.push(['start', tag, attrs]);
    },
    chars: function(text) {
      var last, attrs, match, name, escaped, pre, post;
      text = text.replace(/\n *$/, '');
      if (match = extractPlaceholder(text)) {
        name = match.name;
        escaped = _.toInteger(match.escaped);
        pre = match.pre;
        post = match.post;
        
        if (pre) stack.push(['chars', pre]);
        if (pre || post) stack.push(['start', 'span', {}]);
        
        text = modelText(name, escaped);
        last = stack[stack.length - 1];
        if (last[0] === 'start') {
          attrs = last[2];
          if (_.isUndefined(attrs.id)) {
            attrs.id = function() { return attrs._id = uniqueId(); };
          }          
          events.push(function(data) {
            var path = data[name].model,
                viewFunc = data[name].view,
                params = [attrs._id || attrs.id, 'html', escaped];
            if (path) {
              if (viewFunc) params.push(viewFunc);
              model.events.bind(path, params);
            }
          });
        }
      }
      if (text) stack.push(['chars', text]);
      if (pre || post) stack.push(['end', 'span']);
      if (post) htmlParse.chars(post);
    },
    end: function(tag) {
      stack.push(['end', tag]);
    }
  };
  
  htmlParser.parse(template, htmlParse);

  stack.forEach(function(item) {
    function pushValue(value, quote) {
      if (_.isFunction(value)) {
        htmlIndex = html.push(value, '') - 1;
      } else {
        html[htmlIndex] += quote ? quoteAttr(value) : value;
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

exports.make = function(name, data, template, options) {
  var after = options && options.after,
      render = (template) ? parse(template) : simpleView(name),
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
    var title, head, body, foot;
    model.events._names = {};
    dom.events._names = {};
    uniqueId._count = 0;
    // Note that view getter functions create event handlers on the model and
    // DOM, so they have to be called before the events are serialized below
    title = get('Title');
    head = get('Head');
    body = get('Body');
    foot = get('Foot');
    return '<!DOCTYPE html>' + '<title>' + title + '</title>' + head + body +
      '<script>function $(s){return document.getElementById(s)}' + 
      _.minify(loadFuncs, true) + '</script>' +
      '<script src=' + jsFile + '></script>' +
      '<script>var ' + clientName + '=require("./' + clientName + '")(' +
      uniqueId._count + ',' +
      JSON.stringify(model.get()).replace(/<\//g, '<\\/') + ',' +
      JSON.stringify(model.events.get()) + ',' +
      JSON.stringify(dom.events.get()) + ');</script>' + foot;
  };
}
;
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/lib/view"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["vers/index"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "vers";
    var __filename = "vers/vers/index";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("vers/index", path);
    };
    
    (function () {
        // This file is needed, since browserify only knows how to find modules by
// looking for a file named index.js in the root directory of the module name
module.exports = require("./lib/vers");;
    }).call(module.exports);
    
    _browserifyRequire.modules["vers/index"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io", path);
    };
    
    (function () {
        module.exports = require('./lib/socket.io');;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/client"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/client";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/client", path);
    };
    
    (function () {
        var urlparse = require('url').parse
  , OutgoingMessage = require('http').OutgoingMessage
  , Stream = require('net').Stream
  , options = require('./utils').options
  , encode = require('./utils').encode
  , decode = require('./utils').decode
  , merge = require('./utils').merge
  , util = require(process.binding('natives').util ? 'util' : 'sys');

var Client = module.exports = function(listener, req, res, options, head){
  process.EventEmitter.call(this);
  this.listener = listener;
  this.options(merge({
    timeout: 8000,
    heartbeatInterval: 10000,
    closeTimeout: 0
  }, this.getOptions ? this.getOptions() : {}), options);
  this.connections = 0;
  this._open = false;
  this._heartbeats = 0;
  this.connected = false;
  this.upgradeHead = head;
  this._onConnect(req, res);
};

util.inherits(Client, process.EventEmitter);

Client.prototype.send = function(message){
  if (!this._open || !(this.connection.readyState === 'open' || this.connection.readyState === 'writeOnly')){
    return this._queue(message);
  }
  this._write(encode(message));
  return this;
};

Client.prototype.broadcast = function(message){
  if (!('sessionId' in this)) return this;
  this.listener.broadcast(message, this.sessionId);
  return this;
};

Client.prototype._onMessage = function(data){
  var messages = decode(data);
  if (messages === false) return this.listener.options.log('Bad message received from client ' + this.sessionId);
  for (var i = 0, l = messages.length, frame; i < l; i++){
    frame = messages[i].substr(0, 3);
    switch (frame){
      case '~h~':
        return this._onHeartbeat(messages[i].substr(3));
      case '~j~':
        try {
          messages[i] = JSON.parse(messages[i].substr(3));
        } catch(e) {
          messages[i] = {};
        }
        break;
    }
    this.emit('message', messages[i]);
    this.listener._onClientMessage(messages[i], this);
  }
};

Client.prototype._onConnect = function(req, res){
  var self = this
    , attachConnection = !this.connection;

  this.request = req;
  this.response = res;
  this.connection = req.connection;

  if(!attachConnection) attachConnection = !attachConnection && this.connection.eventsAttached === undefined;
  this.connection.eventsAttached = true;
  
  if (attachConnection){
    function destroyConnection(){
      self._onClose();
      self.connection && self.connection.destroy()
    };
    this.connection.addListener('end', destroyConnection);
    this.connection.addListener('timeout', destroyConnection);
    this.connection.addListener('error', destroyConnection);
    }
  
  if (req){
    function destroyRequest(){
      req.destroy && req.destroy();
    };
    req.addListener('error', destroyRequest);
    req.addListener('timeout', destroyRequest);
    if (res){
      function destroyResponse(){
        res.destroy && res.destroy();
      }
      res.addListener('error', destroyResponse);
      res.addListener('timeout', destroyResponse);
    }
    if (this._disconnectTimeout) clearTimeout(this._disconnectTimeout);
  }
};


Client.prototype._payload = function(){
  var payload = [];
  
  this.connections++;
  this.connected = true;
  this._open = true;
  
  if (!this.handshaked){
    this._generateSessionId();
    payload.push(this.sessionId);
    this.handshaked = true;
  }
  
  payload = payload.concat(this._writeQueue || []);
  this._writeQueue = [];

  if (payload.length) this._write(encode(payload));
  if (this.connections === 1) this.listener._onClientConnect(this);
  if (this.options.timeout) this._heartbeat();
};
  
Client.prototype._heartbeat = function(){
  var self = this;
  this._heartbeatInterval = setTimeout(function(){
    self.send('~h~' + ++self._heartbeats);
    self._heartbeatTimeout = setTimeout(function(){
      self._onClose();
    }, self.options.timeout);
  }, self.options.heartbeatInterval);
};
  
Client.prototype._onHeartbeat = function(h){
  if (h == this._heartbeats){
    clearTimeout(this._heartbeatTimeout);
    this._heartbeat();
  }
};

Client.prototype._onClose = function(skipDisconnect){
  if (!this._open) return this;
  var self = this;
  if (this._heartbeatInterval) clearTimeout(this._heartbeatInterval);
  if (this._heartbeatTimeout) clearTimeout(this._heartbeatTimeout);
  this._open = false;
  this.request = null;
  this.response = null;
  if (skipDisconnect !== false){
    if (this.handshaked){
      this._disconnectTimeout = setTimeout(function(){
        self._onDisconnect();
      }, this.options.closeTimeout);
    } else
      this._onDisconnect();
  }
};

Client.prototype._onDisconnect = function(){
  if (this._open) this._onClose(true);
  if (this._disconnectTimeout) clearTimeout(this._disconnectTimeout);
  this._writeQueue = [];
  this.connected = false;
  if (this.handshaked){
    this.emit('disconnect');
    this.listener._onClientDisconnect(this);
    this.handshaked = false;
  }
};

Client.prototype._queue = function(message){
  this._writeQueue = this._writeQueue || [];
  this._writeQueue.push(message);
  return this;
};

Client.prototype._generateSessionId = function(){
  this.sessionId = Math.random().toString().substr(2);
  return this;
};

Client.prototype._verifyOrigin = function(origin){
  var origins = this.listener.options.origins;
  if (origins.indexOf('*:*') !== -1) {
    return true;
  }
  if (origin) {
    try {
      var parts = urlparse(origin);
      return origins.indexOf(parts.host + ':' + parts.port) !== -1 ||
          origins.indexOf(parts.host + ':*') !== -1 ||
          origins.indexOf('*:' + parts.port) !== -1;  
    } catch (ex) {}
  }
  return false;
};

for (var i in options) Client.prototype[i] = options[i];
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/client"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/index"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/index";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/index", path);
    };
    
    (function () {
        
/**
 * Listener creation shorcut
 *
 * @param {Server} node HTTP server
 * @param {Object} options
 * @api public
 */

exports.listen = function(server, options){
  return new exports.Listener(server, options);
};

/**
 * Listener constructor
 *
 * @api public
 */

exports.Listener = require('./listener');

/**
 * Version
 */

exports.version = '0.6.17';
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/index"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/listener"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/listener";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/listener", path);
    };
    
    (function () {
        var url = require('url')
  , util = require(process.binding('natives').util ? 'util' : 'sys')
  , fs = require('fs')
  , options = require('./utils').options
  , Client = require('./client')
  , clientVersion = require('./../../support/socket.io-client/lib/io').io.version
  , transports = {};

var Listener = module.exports = function(server, options){
  process.EventEmitter.call(this);
  var self = this;
  this.server = server;
  this.options({
    origins: '*:*',
    resource: 'socket.io',
    flashPolicyServer: true,
    transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart',
                 'xhr-polling', 'jsonp-polling'],
    transportOptions: {},
    log: util.log
  }, options);
  
  if (!this.options.log) this.options.log = function(){};

  this.clients = this.clientsIndex = {};
  this._clientCount = 0;
  this._clientFiles = {};
  
  var listeners = this.server.listeners('request');
  this.server.removeAllListeners('request');
  
  this.server.addListener('request', function(req, res){
    if (self.check(req, res)) return;
    for (var i = 0, len = listeners.length; i < len; i++){
      listeners[i].call(this, req, res);
    }
  });
  
  this.server.addListener('upgrade', function(req, socket, head){
    if (!self.check(req, socket, true, head)){
      socket.end();
      socket.destroy();
    }
  });
  
  this.options.transports.forEach(function(name) {
    if (!(name in transports))
      transports[name] = require('./transports/' + name);
    if ('init' in transports[name]) transports[name].init(self);
  });

  this.options.log('socket.io ready - accepting connections');
};

util.inherits(Listener, process.EventEmitter);
for (var i in options) Listener.prototype[i] = options[i];

Listener.prototype.broadcast = function(message, except){
  for (var i = 0, k = Object.keys(this.clients), l = k.length; i < l; i++){
    if (!except || ((typeof except == 'number' || typeof except == 'string') && k[i] != except)
                || (Array.isArray(except) && except.indexOf(k[i]) == -1)){
      this.clients[k[i]].send(message);
    }
  }
  return this;
};

Listener.prototype.check = function(req, res, httpUpgrade, head){
  var path = url.parse(req.url).pathname, parts, cn;
  if (path && path.indexOf('/' + this.options.resource) === 0){
    parts = path.substr(2 + this.options.resource.length).split('/');
    if (this._serveClient(parts.join('/'), req, res)) return true;
    if (!(parts[0] in transports)) return false;
    if (parts[1]){
      cn = this.clients[parts[1]];
      if (cn){
        cn._onConnect(req, res);
      } else {
        req.connection.end();
        req.connection.destroy();
        this.options.log('Couldnt find client with session id "' + parts[1] + '"');
      }
    } else {
      this._onConnection(parts[0], req, res, httpUpgrade, head);
    }
    return true;
  }
  return false;
};

Listener.prototype._serveClient = function(file, req, res){
  var self = this
    , clientPaths = {
        'socket.io.js': 'socket.io.js',
        'lib/vendor/web-socket-js/WebSocketMain.swf': 'lib/vendor/web-socket-js/WebSocketMain.swf', // for compat with old clients
        'WebSocketMain.swf': 'lib/vendor/web-socket-js/WebSocketMain.swf'
      }
    , types = {
        swf: 'application/x-shockwave-flash',
        js: 'text/javascript'
      };
  
  function write(path){
    if (req.headers['if-none-match'] == clientVersion){
      res.writeHead(304);
      res.end();
    } else {
      res.writeHead(200, self._clientFiles[path].headers);
      res.end(self._clientFiles[path].content, self._clientFiles[path].encoding);
    }
  };
  
  var path = clientPaths[file];
  
  if (req.method == 'GET' && path !== undefined){
    if (path in this._clientFiles){
      write(path);
      return true;
    }
    
    fs.readFile(__dirname + '/../../support/socket.io-client/' + path, function(err, data){
      if (err){
        res.writeHead(404);
        res.end('404');
      } else {
        var ext = path.split('.').pop();
        self._clientFiles[path] = {
          headers: {
            'Content-Length': data.length,
            'Content-Type': types[ext],
            'ETag': clientVersion
          },
          content: data,
          encoding: ext == 'swf' ? 'binary' : 'utf8'
        };
        write(path);
      }
    });
    
    return true;
  }
  
  return false;
};

Listener.prototype._onClientConnect = function(client){
  this.clients[client.sessionId] = client;
  this.options.log('Client '+ client.sessionId +' connected');
  this.emit('clientConnect', client);
  this.emit('connection', client);
};

Listener.prototype._onClientMessage = function(data, client){
  this.emit('clientMessage', data, client);
};

Listener.prototype._onClientDisconnect = function(client){
  delete this.clients[client.sessionId];
  this.options.log('Client '+ client.sessionId +' disconnected');
  this.emit('clientDisconnect', client);
};

Listener.prototype._onConnection = function(transport, req, res, httpUpgrade, head){
  this.options.log('Initializing client with transport "'+ transport +'"');
  new transports[transport](this, req, res, this.options.transportOptions[transport], head);
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/listener"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/transports/flashsocket"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/transports/flashsocket";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/transports/flashsocket", path);
    };
    
    (function () {
        var net = require('net')
  , util = require(process.binding('natives').util ? 'util' : 'sys')
  , WebSocket = require('./websocket')
  , listeners = []
  , netserver;

var Flashsocket = module.exports = function(){
  WebSocket.apply(this, arguments);
};

util.inherits(Flashsocket, WebSocket);

Flashsocket.httpUpgrade = true;

Flashsocket.init = function(listener){
  listeners.push(listener);
  
  listener.server.on('close', function(){
    listeners.splice(listeners.indexOf(listener), 1);

    if (listeners.length === 0 && netserver){
      try {
        netserver.close();
      } catch(e){
	    listener.options.log('flashsocket netserver close error - ' + e.stack)
      }
    }
  });
  
  if (listener.options.flashPolicyServer && netserver === undefined){
    netserver = net.createServer(function(socket){
      socket.addListener('error', function(err){
        if (socket && socket.end){
          socket.end();
          socket.destroy();
        }
      });

      if(socket && socket.readyState == 'open')
        socket.end(policy(listeners));
    });
    
    try {
      netserver.listen(843);
    } catch(e){
      if (e.errno == 13)
        listener.options.log('Your node instance does not have root privileges. ' 
                           + 'This means that the flash XML policy file will be '
                           + 'served inline instead of on port 843. This will slow '
                           + 'down initial connections slightly.');
      netserver = null;
    }
  }
  
  // Could not listen on port 843 so policy requests will be inline
  listener.server.addListener('connection', function(stream){
    var flashCheck = function (data) {
      // Only check the initial data
      stream.removeListener("data", flashCheck);
      if (data[0] === 60 && data.length == 23) {
        if (data == '<policy-file-request/>\0') {
          listener.options.log("Answering flash policy request inline");
          if (stream && stream.readyState == 'open'){
            var xml = policy([listener]);
            stream.write(xml);
            stream.end();
          }
        }
      }
    };
    
    stream.on('data', flashCheck);
  });
};

function policy(listeners) {
  var xml = '<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM'
          + ' "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n';

  listeners.forEach(function(l){
    [].concat(l.options.origins).forEach(function(origin){
      var parts = origin.split(':');
      xml += '<allow-access-from domain="' + parts[0] + '" to-ports="'+ parts[1] +'"/>\n';
    });
  });

  xml += '</cross-domain-policy>\n';
  return xml;
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/transports/flashsocket"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/transports/htmlfile"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/transports/htmlfile";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/transports/htmlfile", path);
    };
    
    (function () {
        var Client = require('../client')
  , util = require(process.binding('natives').util ? 'util' : 'sys')
  , qs = require('querystring');

var HTMLFile = module.exports = function(){
  Client.apply(this, arguments);
};

util.inherits(HTMLFile, Client);
  
HTMLFile.prototype._onConnect = function(req, res){
  var self = this, body = '';
  switch (req.method){
    case 'GET':
      Client.prototype._onConnect.call(this, req, res);
      this.response.useChunkedEncodingByDefault = true;
      this.response.shouldKeepAlive = true;
      this.response.writeHead(200, {
        'Content-Type': 'text/html',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
      });
      this.response.write('<html><body>' + new Array(245).join(' '));
      this._payload();
      break;
      
    case 'POST':
      req.addListener('data', function(message){
        body += message;
      });
      req.addListener('end', function(){
        try {
          var msg = qs.parse(body);
          self._onMessage(msg.data);
        } catch(e){
          self.listener.options.log('htmlfile message handler error - ' + e.stack);
        }
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('ok');
        res.end();
      });
      break;
  }
};
  
HTMLFile.prototype._write = function(message){
  if (this._open)
    this.response.write('<script>parent.s._('+ JSON.stringify(message) +', document);</script>'); //json for escaping
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/transports/htmlfile"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/transports/jsonp-polling"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/transports/jsonp-polling";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/transports/jsonp-polling", path);
    };
    
    (function () {
        var XHRPolling = require('./xhr-polling')
  , util = require(process.binding('natives').util ? 'util' : 'sys');

JSONPPolling = module.exports = function(){
  XHRPolling.apply(this, arguments);
};

util.inherits(JSONPPolling, XHRPolling);
  
JSONPPolling.prototype.getOptions = function(){
  return {
    timeout: null, // no heartbeats
    closeTimeout: 8000,
    duration: 20000
  };
};
  
JSONPPolling.prototype._onConnect = function(req, res){
  this._index = req.url.match(/\/([0-9]+)\/?$/).pop();
  XHRPolling.prototype._onConnect.call(this, req, res);
};
  
JSONPPolling.prototype._write = function(message){
  if (this._open){
    if (this.request.headers.origin && !this._verifyOrigin(this.request.headers.origin)){
      message = "alert('Cross domain security restrictions not met');";
    } else {
      message = "io.JSONP["+ this._index +"]._("+ JSON.stringify(message) +");";
    }
    this.response.writeHead(200, {'Content-Type': 'text/javascript; charset=UTF-8', 'Content-Length': Buffer.byteLength(message)});
    this.response.write(message);
    this.response.end();
    this._onClose();
  }
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/transports/jsonp-polling"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/transports/websocket"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/transports/websocket";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/transports/websocket", path);
    };
    
    (function () {
        var Client = require('../client')
  , Stream = require('net').Stream
  , EventEmitter = require('events').EventEmitter
  , url = require('url')
  , util = require(process.binding('natives').util ? 'util' : 'sys')
  , crypto = require('crypto');

WebSocket = module.exports = function(){
  Client.apply(this, arguments);
};

util.inherits(WebSocket, Client);

WebSocket.prototype._onConnect = function(req, socket){
  var self = this
    , headers = [];
  
  if (!req.connection.setTimeout){
    req.connection.end();
    return false;
  }

  this.parser = new Parser();
  this.parser.on('data', self._onMessage.bind(this));
  this.parser.on('error', self._onClose.bind(this));

  Client.prototype._onConnect.call(this, req);
    
  if (this.request.headers.upgrade !== 'WebSocket' || !this._verifyOrigin(this.request.headers.origin)){
    this.listener.options.log('WebSocket connection invalid or Origin not verified');
    this._onClose();
    return false;
  }
  
  var origin = this.request.headers.origin,
      location = (origin && origin.substr(0, 5) == 'https' ? 'wss' : 'ws')
               + '://' + this.request.headers.host + this.request.url;
  
  this.waitingForNonce = false;
  if ('sec-websocket-key1' in this.request.headers){
    /*  We need to send the 101 response immediately when using Draft 76 with
      	a load balancing proxy, such as HAProxy.  In order to protect an
      	unsuspecting non-websocket HTTP server, HAProxy will not send the
      	8-byte nonce through the connection until the Upgrade: WebSocket
      	request has been confirmed by the WebSocket server by a 101 response
      	indicating that the server can handle the upgraded protocol.  We
      	therefore must send the 101 response immediately, and then wait for
      	the nonce to be forwarded to us afterward in order to finish the
      	Draft 76 handshake.
      */
    
    // If we don't have the nonce yet, wait for it.
    if (!(this.upgradeHead && this.upgradeHead.length >= 8)) {
      this.waitingForNonce = true;
    }
    
    headers = [
      'HTTP/1.1 101 WebSocket Protocol Handshake',
      'Upgrade: WebSocket',
      'Connection: Upgrade',
      'Sec-WebSocket-Origin: ' + origin,
      'Sec-WebSocket-Location: ' + location
    ];
    
    if ('sec-websocket-protocol' in this.request.headers){
      headers.push('Sec-WebSocket-Protocol: ' + this.request.headers['sec-websocket-protocol']);
    }
  } else {
    headers = [
      'HTTP/1.1 101 Web Socket Protocol Handshake',
      'Upgrade: WebSocket',
      'Connection: Upgrade',
      'WebSocket-Origin: ' + origin,
      'WebSocket-Location: ' + location
    ];
    
  }

  try {
    this.connection.write(headers.concat('', '').join('\r\n'));
    this.connection.setTimeout(0);
    this.connection.setNoDelay(true);
    this.connection.setEncoding('utf-8');
  } catch(e){
    this._onClose();
    return;
  }
  
  if (this.waitingForNonce) {
  	// Since we will be receiving the binary nonce through the normal HTTP
  	// data event, set the connection to 'binary' temporarily
  	this.connection.setEncoding('binary');
  	this._headers = headers;
  }
  else {
  	if (this._proveReception(headers)) this._payload();
  }
  
  this.buffer = "";
  
  this.connection.addListener('data', function(data){
    if (self.waitingForNonce) {
    		self.buffer += data;

  		if (self.buffer.length < 8) { return; }
  		// Restore the connection to utf8 encoding after receiving the nonce
  		self.connection.setEncoding('utf8');
  		self.waitingForNonce = false;
  		// Stuff the nonce into the location where it's expected to be
  		self.upgradeHead = self.buffer.substr(0,8);
                self.buffer = '';
  		if (self._proveReception(self._headers)) { self._payload(); }
  		return;
  	}
  	
    self.parser.add(data);
  });

};

// http://www.whatwg.org/specs/web-apps/current-work/complete/network.html#opening-handshake
WebSocket.prototype._proveReception = function(headers){
  var self = this
    , k1 = this.request.headers['sec-websocket-key1']
    , k2 = this.request.headers['sec-websocket-key2'];
  
  if (k1 && k2){
    var md5 = crypto.createHash('md5');

    [k1, k2].forEach(function(k){
      var n = parseInt(k.replace(/[^\d]/g, '')),
          spaces = k.replace(/[^ ]/g, '').length;
          
      if (spaces === 0 || n % spaces !== 0){
        self.listener.options.log('Invalid WebSocket key: "' + k + '". Dropping connection');
        self._onClose();
        return false;
      }

      n /= spaces;
      
      md5.update(String.fromCharCode(
        n >> 24 & 0xFF,
        n >> 16 & 0xFF,
        n >> 8  & 0xFF,
        n       & 0xFF));
    });

    md5.update(this.upgradeHead.toString('binary'));
    
    try {
      this.connection.write(md5.digest('binary'), 'binary');
    } catch(e){
      this._onClose();
    }
  }
  
  return true;
};

WebSocket.prototype._write = function(message){
  try {
    this.connection.write('\u0000', 'binary');
    this.connection.write(message, 'utf8');
    this.connection.write('\uffff', 'binary');
  } catch(e){
    this._onClose();
  }
};

WebSocket.httpUpgrade = true;

function Parser(){
  this.buffer = '';
  this.i = 0;
};

Parser.prototype.__proto__ = EventEmitter.prototype;

Parser.prototype.add = function(data){
  this.buffer += data;
  this.parse();
};

Parser.prototype.parse = function(){
  for (var i = this.i, chr, l = this.buffer.length; i < l; i++){
    chr = this.buffer[i];
    if (i === 0){
      if (chr != '\u0000')
        this.error('Bad framing. Expected null byte as first frame');
      else
        continue;
    }
    if (chr == '\ufffd'){
      this.emit('data', this.buffer.substr(1, this.buffer.length - 2));
      this.buffer = this.buffer.substr(i + 1);
      this.i = 0;
      return this.parse();
    }
  }
};

Parser.prototype.error = function(reason){
  this.buffer = '';
  this.i = 0;
  this.emit('error', reason);
  return this;
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/transports/websocket"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/transports/xhr-multipart"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/transports/xhr-multipart";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/transports/xhr-multipart", path);
    };
    
    (function () {
        var Client = require('../client')
  , util = require(process.binding('natives').util ? 'util' : 'sys')
  , qs = require('querystring');

var Multipart = module.exports = function(){
  Client.apply(this, arguments);
};

util.inherits(Multipart, Client);

Multipart.prototype._onConnect = function(req, res){
  var self = this, body = '', headers = {};
  // https://developer.mozilla.org/En/HTTP_Access_Control
  if (req.headers.origin && this._verifyOrigin(req.headers.origin)){
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  if (typeof req.headers['access-control-request-method'] !== 'undefined'){
    // CORS preflight message
    headers['Access-Control-Allow-Methods'] = req.headers['access-control-request-method'];
    res.writeHead(200, headers);
    res.write('ok');
    res.end();
    return;
  }
  switch (req.method){
    case 'GET':
      Client.prototype._onConnect.apply(this, [req, res]);
      headers['Content-Type'] = 'multipart/x-mixed-replace;boundary="socketio"';
      headers['Connection'] = 'keep-alive';
      this.request.connection.addListener('end', function(){ self._onClose(); });
      this.response.useChunkedEncodingByDefault = false;
      this.response.shouldKeepAlive = true;
      this.response.writeHead(200, headers);
      this.response.write("--socketio\n");
      if ('flush' in this.response) this.response.flush();
      this._payload();
      break;
      
    case 'POST':
      headers['Content-Type'] = 'text/plain';
      req.addListener('data', function(message){
        body += message.toString();
      });
      req.addListener('end', function(){
        try {
          var msg = qs.parse(body);
          self._onMessage(msg.data);
        } catch(e){
          self.listener.options.log('xhr-multipart message handler error - ' + e.stack);
        }
        res.writeHead(200, headers);
        res.write('ok');
        res.end();
        body = '';
      });
      break;
  }
};
  
Multipart.prototype._write = function(message){
  if (this._open){
    this.response.write("Content-Type: text/plain" + (message.length === 1 && message.charCodeAt(0) === 6 ? "; charset=us-ascii" : "") + "\n\n");
    this.response.write(message + "\n");
    this.response.write("--socketio\n");
  }
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/transports/xhr-multipart"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/transports/xhr-polling"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/transports/xhr-polling";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/transports/xhr-polling", path);
    };
    
    (function () {
        var Client = require('../client')
  , util = require(process.binding('natives').util ? 'util' : 'sys')
  , qs = require('querystring');

var Polling = module.exports = function(){
  Client.apply(this, arguments);
};

util.inherits(Polling, Client);

Polling.prototype.getOptions = function(){
  return {
    timeout: null, // no heartbeats
    closeTimeout: 8000,
    duration: 20000
  };
};

Polling.prototype._onConnect = function(req, res){
  var self = this, body = '';
  switch (req.method){
    case 'GET':
      Client.prototype._onConnect.apply(this, [req, res]);
      this._closeTimeout = setTimeout(function(){
        self._write('');
      }, this.options.duration);
      this._payload();
      break;
      
    case 'POST':
      req.addListener('data', function(message){
        body += message;
      });
      req.addListener('end', function(){
        var headers = {'Content-Type': 'text/plain'};
        if (req.headers.origin){
          if (self._verifyOrigin(req.headers.origin)){
            headers['Access-Control-Allow-Origin'] = '*';
            if (req.headers.cookie) headers['Access-Control-Allow-Credentials'] = 'true';
          } else {
            res.writeHead(401);
            res.write('unauthorized');
            res.end();
            return;
          }
        }
        try {
          // optimization: just strip first 5 characters here?
          var msg = qs.parse(body);
          self._onMessage(msg.data);
        } catch(e){
          self.listener.options.log('xhr-polling message handler error - ' + e.stack);
        }
        res.writeHead(200, headers);
        res.write('ok');
        res.end();
      });
      break;
  }
};

Polling.prototype._onClose = function(){
  if (this._closeTimeout) clearTimeout(this._closeTimeout);
  return Client.prototype._onClose.call(this);
};
  
Polling.prototype._write = function(message){
  if (this._open){
    var headers = {'Content-Type': 'text/plain; charset=UTF-8', 'Content-Length': Buffer.byteLength(message)};
    // https://developer.mozilla.org/En/HTTP_Access_Control
    if (this.request.headers.origin && this._verifyOrigin(this.request.headers.origin)){
      headers['Access-Control-Allow-Origin'] = (this.request.headers.origin === 'null' ? '*' : this.request.headers.origin);
      if (this.request.headers.cookie) headers['Access-Control-Allow-Credentials'] = 'true';
    }
    this.response.writeHead(200, headers);
    this.response.write(message);
    this.response.end();
    this._onClose();
  }
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/transports/xhr-polling"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["socket.io/lib/socket.io/utils"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "socket.io";
    var __filename = "socket.io/socket.io/lib/socket.io/utils";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("socket.io/lib/socket.io/utils", path);
    };
    
    (function () {
        exports.options = {
  options: function(options, merge){
    this.options = exports.merge(options || {}, merge || {});
  }
};

exports.merge = function(source, merge){
  for (var i in merge) source[i] = merge[i];
  return source;
};

var frame = '~m~';

function stringify(message){
  if (Object.prototype.toString.call(message) == '[object Object]'){
    return '~j~' + JSON.stringify(message);
  } else {
    return String(message);
  }
};

exports.encode = function(messages){
  var ret = '', message,
      messages = Array.isArray(messages) ? messages : [messages];
  for (var i = 0, l = messages.length; i < l; i++){
    message = messages[i] === null || messages[i] === undefined ? '' : stringify(messages[i]);
    ret += frame + message.length + frame + message;
  }
  return ret;
};

exports.decode = function(data){
  var messages = [], number, n;
  do {
    if (data.substr(0, 3) !== frame) return messages;
    data = data.substr(3);
    number = '', n = '';
    for (var i = 0, l = data.length; i < l; i++){
      n = Number(data.substr(i, 1));
      if (data.substr(i, 1) == n){
        number += n;
      } else {  
        data = data.substr(number.length + frame.length)
        number = Number(number);
        break;
      } 
    }
    messages.push(data.substr(0, number)); // here
    data = data.substr(number);
  } while(data !== '');
  return messages;
};;
    }).call(module.exports);
    
    _browserifyRequire.modules["socket.io/lib/socket.io/utils"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["browserify"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "browserify";
    var __filename = "browserify/browserify";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("browserify", path);
    };
    
    (function () {
        var fs = require('fs');
var path = require('path');
var Hash = require('hashish');
var connect = require('connect');

var coffee = require('coffee-script');
var source = require('source');

exports = module.exports = function (opts) {
    var modified = new Date();
    var src = exports.bundle(opts);
    
    var maxAge = (opts && opts.maxAge) || (1000 * 60 * 60 * 24 * 365);
    var staticRoot = (opts && opts.staticRoot) ||
      path.dirname(module.parent.filename);
    var staticDir = (opts && opts.staticDir) || 'public-browserify';
    var staticPath = path.join(staticRoot, staticDir);
    var filename = parseInt(connect.utils.md5(src), 16).toString(36) + '.js';
    var filePath = path.join(staticPath, filename);
    
    if (!path.existsSync(staticPath)) {
      fs.mkdirSync(staticPath, 0777);
    }
    if (!path.existsSync(filePath)) {
      fs.writeFile(filePath, src);
    }
    return {
      handle: connect.static(staticPath, { maxAge: maxAge }),
      filename: filename
    };
};

exports.bundle = function (opts) {
    if (typeof opts === 'string') {
        opts = { base : opts };
        var opts_ = arguments[1];
        if (typeof opts_ === 'object') {
            Object.keys(opts_).forEach(function (key) {
                opts[key] = opts_[key];
            });
        }
    }
    
    var shim = 'shim' in opts ? opts.shim : true;
    var req = opts.require || [];
    if (!Array.isArray(req)) req = [req];
    
    var src = fs.readFileSync(__dirname + '/wrappers/prelude.js', 'utf8')
        + fs.readFileSync(__dirname + '/wrappers/node_compat.js', 'utf8')
        + (shim ? source.modules('es5-shim')['es5-shim'] : '')
        + builtins
        + (req.length ? exports.wrap(req, opts_).source : '')
    ;
    
    if (Array.isArray(opts.base)) {
        opts.base.forEach(function (base) {
            src += exports.wrapDir(base, Hash.merge(opts, { base : base }));
        });
    }
    else if (typeof opts.base === 'object') {
        Hash(opts.base).forEach(function (base, name) {
            src += exports.wrapDir(base, Hash.merge(opts, {
                base : base,
                name : name,
            }));
        });
    }
    else if (typeof opts.base === 'string') {
        src += exports.wrapDir(opts.base, opts);
    }
    
    if (opts.entry) {
        if (!Array.isArray(opts.entry)) {
            opts.entry = [ opts.entry ];
        }
        var entryBody = fs.readFileSync(
            __dirname + '/wrappers/entry.js', 'utf8'
        );
        
        opts.entry.forEach(function (entry) {
            src += entryBody
                .replace(/\$__filename/g, function () {
                    return JSON.stringify('./' + path.basename(entry))
                })
                .replace(/\$__dirname/g, function () {
                    return JSON.stringify('.')
                })
                .replace('$body', function () {
                    return fs.readFileSync(entry, 'utf8')
                })
            ;
        });
    }
    
    return opts.filter ? opts.filter(src) : src;
};

var wrapperBody = fs.readFileSync(__dirname + '/wrappers/body.js', 'utf8');

var builtins = fs.readdirSync(__dirname + '/builtins')
    .filter(function (file) {
        return file.match(/\.js$/)
            && !path.basename(file).match(/^\./)
    })
    .map(function (file) {
        var f = __dirname + '/builtins/' + file;
        var src = fs.readFileSync(f, 'utf8').replace(/^#![^\n]*\n/, '');
        
        return wrapperBody
            .replace(/\$filename/g, function () {
                return JSON.stringify(file.replace(/\.js$/,''));
            })
            .replace(/\$__dirname/g, function () {
                return JSON.stringify(path.dirname(file));
            })
            .replace(/\$__filename/g, function () {
                return JSON.stringify(file);
            })
            .replace('$body', function () {
                return src;
            })
        ;
    })
    .join('\n')
;

exports.wrap = function (libname, opts) {
    if (!opts) opts = {};
    if (!opts.filename) opts.filename = libname;
    
    if (opts.base && !opts.base.match(/^\//)) {
        // relative path
        if (opts.name) {
            opts.base = path.dirname(require.resolve(opts.name))
                + '/' + opts.base;
        }
        else {
            opts.base = process.cwd() + '/' + opts.base;
        }
    }
    
    if (opts.main && !opts.main.match(/^\//)) {
        opts.main = opts.base + '/' + opts.main;
    }
    
    if (Array.isArray(libname)) {
        var reqs = opts.required || [];
        
        var src = libname.map(function (name) {
            var lib = exports.wrap(name, { required : reqs });
            reqs.push(name);
            
            if (lib.dependencies.length) {
                var deps = exports.wrap(lib.dependencies, { required : reqs });
                reqs.push.apply(reqs, lib.dependencies);
                return lib.source + '\n' + deps.source;
            }
            else {
                return lib.source;
            }
        }).join('\n');
        
        return { source : src, dependencies : [] };
    }
    else if (opts.required && opts.required.indexOf(libname) >= 0) {
        return { source : '', dependencies : [] };
    }
    else if (libname.match(/^[.\/]/)) {
        var src = fs.readFileSync(opts.filename, 'utf8');
        var body = opts.filename.match(/\.coffee$/)
            ? coffee.compile(src) : src;
        
        var pkgname = ((opts.name ? opts.name + '/' : '') + libname)
            .replace(/\/\.\//g, '/')
            .replace(/\/\.$/, '')
        ;
        
        if (opts.pkgname) pkgname = opts.pkgname;
        var dirname = opts.name || '.';
        var filename = dirname + '/' + path.basename(opts.filename);
        
        return {
            source : wrapperBody
                .replace(/\$__dirname/g, function () {
                    return JSON.stringify(dirname);
                })
                .replace(/\$__filename/g, function () {
                    return JSON.stringify(filename);
                })
                .replace(/\$filename/g, function () {
                    return JSON.stringify(pkgname);
                })
                .replace('$body', function () {
                    return body.replace(/^#![^\n]*\n/, '');
                })
            ,
            dependencies : [],
        };
    }
    else if (libname.match(/\//)) {
        var resolved = require.resolve(libname);
        var body = fs.readFileSync(resolved, 'utf8');
        
        var pkgname = ((opts.name ? opts.name + '/' : '') + libname)
            .replace(/\/\.\//g, '/')
            .replace(/\/\.$/, '')
        ;
        
        if (opts.pkgname) pkgname = opts.pkgname;
        
        var src = wrapperBody
            .replace(/\$__dirname/g, function () {
                return JSON.stringify(pkgname);
            })
            .replace(/\$__filename/g, function () {
                return JSON.stringify(
                    pkgname + '/' + path.basename(resolved)
                );
            })
            .replace(/\$filename/g, function () {
                return JSON.stringify(pkgname)
            })
            .replace('$body', function () {
                return body.replace(/^#![^\n]*\n/, '');
            })
        ;
        return { source : src, dependencies : [] };
    }
    else {
        var mods = source.modules(libname);
        var pkg = mods[libname + '/package.json'];
        
        if (pkg.browserify && pkg.browserify.main) {
            var main = (libname + '/' + pkg.browserify.main)
                .replace(/\/\.\//g, '/');
            var p = pkg.browserify;
            p.filename = require.resolve(main);
            p.name = p.name || libname;
            p.pkgname = p.pkgname || libname;
            
            if (p.base && !p.base.match(/^\//)) {
                p.base = (
                    path.dirname(require.resolve(libname + '/package.json'))
                    + '/' + p.base
                ).replace(/\/\.\//g, '/');
            }
            
            return {
                'package.json' : pkg,
                dependencies : pkg.browserify.require || [],
                source : p.base
                    ? exports.wrapDir(p.base, p)
                    : exports.wrap(main, p).source
                ,
            };
        }
        
        return {
            'package.json' : pkg,
            dependencies :
                typeof pkg.browserify === 'object'
                && (pkg.browserify.main || pkg.browserify.require)
                    ? pkg.browserify.require || []
                    : Object.keys(pkg.dependencies || {})
            ,
            source : Object.keys(mods)
                .filter(function (name) {
                    return !name.match(/\/package\.json$/)
                })
                .map(function (name) {
                    var src = mods[name].toString().replace(/^#![^\n]*\n/, '');
                    return wrapperBody
                        .replace(/\$filename/g, function () {
                            return JSON.stringify(name)
                        })
                        .replace(/\$__filename/g, function () {
                            return JSON.stringify(libname + '/' + name)
                        })
                        .replace(/\$__dirname/g, function () {
                            return JSON.stringify(libname)
                        })
                        .replace('$body', function () {
                            return src;
                        })
                    ;
                })
                .join('\n')
            ,
        };
    }
};

var find = require('findit');
exports.wrapDir = function (base, opts) {
    if (!opts) opts = {};
    
    var pkg = path.existsSync(base + '/package.json')
        ? JSON.parse(fs.readFileSync(base + '/package.json', 'utf8'))
        : {}
    ;
    function params (key) {
        return opts[key]
            || (pkg.browserify && pkg.browserify[key])
            || pkg[key]
    }
    
    var main = params('main');
    
    if (main && typeof pkg.browserify === 'object'
    && !pkg.browserify.base) {
        var files = [ base + '/' + main ];
    }
    else {
        var files = find.sync(base);
    }
    
    var depSrc = pkg.browserify && pkg.browserify.require
        ? exports.wrap(pkg.browserify.require).source : '';
    
    return depSrc + files
        .filter(function (file) {
            return file.match(/\.(?:js|coffee)$/)
                && !path.basename(file).match(/^\./)
        })
        .map(function (file) {
            var libname = unext(file.slice(base.length + 1));
            if (!libname.match(/^\.\//)) libname = './' + libname;
            
            var pkgname = main && (
                unext(main) === file || unext(main) === libname
            ) ? '.' : libname;
            
            return exports.wrap(pkgname, {
                filename : file,
                name : params('name'),
            }).source;
        })
        .join('\n')
    ;
};

function unext (s) {
    return s.replace(/\.(?:js|coffee)$/,'');
}
;
    }).call(module.exports);
    
    _browserifyRequire.modules["browserify"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["findit"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "findit";
    var __filename = "findit/findit";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("findit", path);
    };
    
    (function () {
        var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var Seq = require('seq');

exports = module.exports = find;
exports.find = find;
function find (base, cb) {
    var em = new EventEmitter;
    
    (function find (dir, f) {
        Seq()
            .seq(fs.readdir, dir, Seq)
            .flatten()
            .seqEach(function (file) {
                var p = dir + '/' + file;
                fs.stat(p, this.into(p));
            })
            .seq(function () {
                this(null, Object.keys(this.vars));
            })
            .flatten()
            .seqEach(function (file) {
                var stat = this.vars[file];
                if (cb) cb(file, stat);
                em.emit('path', file, stat);
                
                if (stat.isDirectory()) {
                    em.emit('directory', file, stat);
                    find(file, this);
                }
                else {
                    em.emit('file', file, stat);
                    this(null);
                }
            })
            .seq(f.bind({}, null))
            .catch(em.emit.bind(em, 'error'))
        ;
    })(base, em.emit.bind(em, 'end'));
    
    return em;
};

exports.findSync = function findSync (dir) {
    if (!fs.statSync(dir).isDirectory()) return [dir];
    
    return fs.readdirSync(dir)
        .reduce(function (files, file) {
            var p = dir + '/' + file;
            var stat = fs.statSync(p);
            files.push(p);
            
            if (stat.isDirectory()) {
                files.push.apply(files, findSync(p));
            }
            
            return files;
        }, [])
    ;
};

exports.find.sync = exports.findSync;
;
    }).call(module.exports);
    
    _browserifyRequire.modules["findit"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["seq"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "seq";
    var __filename = "seq/seq";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("seq", path);
    };
    
    (function () {
        var EventEmitter = require('events').EventEmitter;
var Hash = require('hashish');
var Chainsaw = require('chainsaw');

module.exports = Seq;
function Seq () {
    var xs = [].slice.call(arguments);
    var ch = Chainsaw(function (saw) {
        builder.call(this, saw, xs);
    });
    
    process.nextTick(function () {
        ch['catch'](function (err) {
            console.error(err.stack ? err.stack : err)
        });
    });
    return ch;
}

Seq.ap = function (xs) {
    return Seq().extend(xs);
};

function builder (saw, xs) {
    var context = this.context = {
        vars : {},
        args : {},
        stack : xs,
        error : null,
    };
    context.stack_ = context.stack;
    
    function action (step, key, f, g) {
        var cb = function (err) {
            var args = [].slice.call(arguments, 1);
            if (err) {
                context.error = { message : err, key : key };
                saw.jump(lastPar);
                saw.down('catch');
                g();
            }
            else {
                if (typeof key == 'number') {
                    context.stack_[key] = args[0];
                    context.args[key] = args;
                }
                else {
                    context.stack_.push.apply(context.stack_, args);
                    if (key !== undefined) {
                        context.vars[key] = args[0];
                        context.args[key] = args;
                    }
                }
                if (g) g(args, key);
            }
        };
        Hash(context).forEach(function (v,k) { cb[k] = v });
        
        cb.into = function (k) {
            key = k;
            return cb;
        };
        
        cb.next = function (err, xs) {
            context.stack_.push.apply(context.stack_, xs);
            cb.apply(cb, [err].concat(context.stack));
        };
        
        cb.pass = function (err) {
            cb.apply(cb, [err].concat(context.stack));
        };
        f.apply(cb, context.stack);
    }
    
    var running = 0;
    var errors = 0;
    
    this.seq = function (key, cb) {
        var bound = [].slice.call(arguments, 2);
        
        if (typeof key === 'function') {
            if (arguments.length > 1) bound.unshift(cb);
            cb = key;
            key = undefined;
        }
        
        if (context.error) saw.next()
        else if (running === 0) {
            action(saw.step, key,
                function () {
                    context.stack_ = [];
                    var args = [].slice.call(arguments);
                    args.unshift.apply(args, bound.map((function (arg) {
                        return arg === Seq ? this : arg
                    }).bind(this)));
                    
                    cb.apply(this, args);
                }, function () {
                    context.stack = context.stack_;
                    saw.next()
                }
            );
        }
    };
    
    var lastPar = null;
    this.par = function (key, cb) {
        lastPar = saw.step;
        
        if (running == 0) {
            // empty the active stack for the first par() in a chain
            context.stack_ = [];
        }
        
        var bound = [].slice.call(arguments, 2);
        if (typeof key === 'function') {
            if (arguments.length > 1) bound.unshift(cb);
            cb = key;
            key = context.stack_.length;
            context.stack_.push(null);
        }
        var cb_ = function () {
            var args = [].slice.call(arguments);
            args.unshift.apply(args, bound.map((function (arg) {
                return arg === Seq ? this : arg
            }).bind(this)));
            
            cb.apply(this, args);
        };
        
        running ++;
        
        var step = saw.step;
        process.nextTick(function () {
            action(step, key, cb_, function (args) {
                if (!args) errors ++;
                
                running --;
                if (running == 0) {
                    context.stack = context.stack_.slice();
                    saw.step = lastPar;
                    if (errors > 0) saw.down('catch');
                    errors = 0;
                    saw.next();
                }
            });
        });
        saw.next();
    };
    
    [ 'seq', 'par' ].forEach((function (name) {
        this[name + '_'] = function (key) {
            var args = [].slice.call(arguments);
            
            var cb = typeof key === 'function'
                ? args[0] : args[1];
            
            var fn = function () {
                var argv = [].slice.call(arguments);
                argv.unshift(this);
                cb.apply(this, argv);
            };
            
            if (typeof key === 'function') {
                args[0] = fn;
            }
            else {
                args[1] = fn;
            }
            
            this[name].apply(this, args);
        };
    }).bind(this));
    
    this['catch'] = function (cb) {
        if (context.error) {
            cb.call(context, context.error.message, context.error.key);
            context.error = null;
        }
        saw.next();
    };
    
    this.forEach = function (cb) {
        this.seq(function () {
            context.stack_ = context.stack.slice();
            var end = context.stack.length;
            
            if (end === 0) this(null)
            else context.stack.forEach(function (x, i) {
                action(saw.step, i, function () {
                    cb.call(this, x, i);
                    if (i == end - 1) saw.next();
                });
            });
        });
    };
    
    this.seqEach = function (cb) {
        this.seq(function () {
            context.stack_ = context.stack.slice();
            var xs = context.stack.slice();
            if (xs.length === 0) this(null);
            else (function next (i) {
                action(
                    saw.step, i,
                    function () { cb.call(this, xs[i], i) },
                    function (args) {
                        if (!args || i === xs.length - 1) saw.next();
                        else next(i + 1);
                    }
                );
            }).bind(this)(0);
        });
    };
    
    this.parEach = function (limit, cb) {
        var xs = context.stack.slice();
        if (cb === undefined) { cb = limit; limit = xs.length }
        context.stack_ = [];
        
        var active = 0;
        var finished = 0;
        var queue = [];
        
        if (xs.length === 0) saw.next()
        else xs.forEach(function call (x, i) {
            if (active >= limit) {
                queue.push(call.bind(this, x, i));
            }
            else {
                active ++;
                action(saw.step, i,
                    function () {
                        cb.call(this, x, i);
                    },
                    function () {
                        active --;
                        finished ++;
                        if (queue.length > 0) queue.shift()();
                        else if (finished === xs.length) {
                            saw.next();
                        }
                    }
                );
            }
        });
    };
    
    this.parMap = function (limit, cb) {
        var res = [];
        var len = context.stack.length;
        if (cb === undefined) { cb = limit; limit = len }
        var res = [];
        
        Seq()
            .extend(context.stack)
            .parEach(limit, function (x, i) {
                cb.apply((function () {
                    res[i] = arguments[1];
                    this.apply(this, arguments);
                }).bind(this), arguments);
            })
            .seq(function () {
                context.stack = res;
                saw.next();
            })
        ;
    };
    
    this.seqMap = function (cb) {
        var res = [];
        var len = context.stack.length;
        
        this.seqEach(function (x, i) {
            var self = (function () {
                res[i] = arguments[1];
                if (i == len - 1) context.stack = res;
                this.apply(this, arguments);
            }).bind(this);
            cb.apply(self, arguments);
        });
    };
    
    [ 'forEach', 'seqEach', 'parEach', 'seqMap', 'parMap' ]
        .forEach((function (name) {
            this[name + '_'] = function (cb) {
                this[name].call(this, function () {
                    var args = [].slice.call(arguments);
                    args.unshift(this);
                    cb.apply(this, args);
                });
            };
        }).bind(this))
    ;
    
    ['push','pop','shift','unshift','splice']
        .forEach((function (name) {
            this[name] = function () {
                context.stack[name].apply(
                    context.stack,
                    [].slice.call(arguments)
                );
                saw.next();
                return this;
            };
        }).bind(this))
    ;
    
    this.extend = function (xs) {
        context.stack.push.apply(context.stack, xs);
        saw.next();
    };
    
    this.flatten = function (pancake) {
        var xs = [];
        // should we fully flatten this array? (default: true)
        if (pancake === undefined) { pancake = true; }
        context.stack.forEach(function f (x) {
            if (Array.isArray(x) && pancake) x.forEach(f);
            else if (Array.isArray(x)) xs = xs.concat(x);
            else xs.push(x);
        });
        context.stack = xs;
        saw.next();
    };
    
    this.empty = function () {
        context.stack = [];
        saw.next();
    };
    
    this.set = function () {
        context.stack = [].slice.call(arguments);
        saw.next();
    };
    
    this['do'] = function (cb) {
        saw.nest(cb, context);
    };
}
;
    }).call(module.exports);
    
    _browserifyRequire.modules["seq"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["chainsaw"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "chainsaw";
    var __filename = "chainsaw/chainsaw";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("chainsaw", path);
    };
    
    (function () {
        var Traverse = require('traverse');
var EventEmitter = require('events').EventEmitter;

module.exports = Chainsaw;
function Chainsaw (builder) {
    var saw = Chainsaw.saw(builder, {});
    var r = builder.call(saw.handlers, saw);
    if (r !== undefined) saw.handlers = r;
    return saw.chain();
};

Chainsaw.saw = function (builder, handlers) {
    var saw = new EventEmitter;
    saw.handlers = handlers;
    saw.actions = [];
    saw.step = 0;
    
    saw.chain = function () {
        var ch = Traverse(saw.handlers).map(function (node) {
            if (this.isRoot) return node;
            var ps = this.path;
            
            if (typeof node === 'function') {
                this.update(function () {
                    saw.actions.push({
                        path : ps,
                        args : [].slice.call(arguments),
                    });
                    return ch;
                });
            }
        });
        
        process.nextTick(function () {
            saw.emit('begin');
            saw.next();
        });
        
        return ch;
    };
    
    saw.next = function () {
        var action = saw.actions[saw.step];
        saw.step ++;
        
        if (!action) {
            saw.emit('end');
        }
        else if (!action.trap) {
            var node = saw.handlers;
            action.path.forEach(function (key) { node = node[key] });
            node.apply(saw.handlers, action.args);
        }
    };
    
    saw.nest = function (cb) {
        var args = [].slice.call(arguments, 1);
        
        var s = Chainsaw.saw(builder, {});
        var r = builder.call(s.handlers, s);
        
        if (r !== undefined) s.handlers = r;
        cb.apply(s.chain(), args);
        s.on('end', saw.next);
    };
    
    saw.trap = function (name, cb) {
        var ps = Array.isArray(name) ? name : [name];
        saw.actions.push({
            path : ps,
            step : saw.step,
            cb : cb,
            trap : true,
        });
    };
    
    saw.down = function (name) {
        var ps = (Array.isArray(name) ? name : [name]).join('/');
        var i = saw.actions.slice(saw.step).map(function (x) {
            if (x.trap && x.step <= saw.step) return false;
            return x.path.join('/') == ps;
        }).indexOf(true);
        
        if (i >= 0) saw.step += i;
        else saw.step = saw.actions.length;
        
        var act = saw.actions[saw.step - 1];
        if (act && act.trap) {
            // It's a trap!
            saw.step = act.step;
            act.cb();
        }
        else saw.next();
    };
    
    saw.jump = function (step) {
        saw.step = step;
        saw.next();
    };
    
    return saw;
}; 
;
    }).call(module.exports);
    
    _browserifyRequire.modules["chainsaw"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["traverse"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "traverse";
    var __filename = "traverse/traverse";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("traverse", path);
    };
    
    (function () {
        module.exports = Traverse;
function Traverse (obj) {
    if (!(this instanceof Traverse)) return new Traverse(obj);
    this.value = obj;
}

Traverse.prototype.map = function (cb) {
    return walk(this.clone(), cb);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = Array.isArray(src) ? [] : Object.create(src.__proto__);
            
            parents.push(src);
            nodes.push(dst);
            
            Object.keys(src).forEach(function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb) {
    var path = [];
    var parents = [];
    
    (function walker (node) {
        var modifiers = {};
        
        var state = {
            node : node,
            path : [].concat(path),
            parent : parents.slice(-1)[0],
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x) {
                if (state.isRoot) {
                    root = x;
                }
                else {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
            },
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f }
        };
        
        if (typeof node == 'object' && node !== null) {
            state.isLeaf = Object.keys(node).length == 0
            
            for (var i = 0; i < parents.length; i++) {
                if (parents[i].node === node) {
                    state.circular = parents[i];
                    break;
                }
            }
        }
        else {
            state.isLeaf = true;
        }
        
        state.notLeaf = !state.isLeaf;
        state.notRoot = !state.isRoot;
        
        // use return values to update if defined
        var ret = cb.call(state, node);
        if (ret !== undefined && state.update) state.update(ret);
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            var keys = Object.keys(state.node);
            keys.forEach(function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                child.isLast = i == keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root);
    
    return root;
}

Object.keys(Traverse.prototype).forEach(function (key) {
    Traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = Traverse(obj);
        return t[key].apply(t, args);
    };
});
;
    }).call(module.exports);
    
    _browserifyRequire.modules["traverse"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["hashish"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "hashish";
    var __filename = "hashish/hashish";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("hashish", path);
    };
    
    (function () {
        module.exports = Hash;
var Traverse = require('traverse');

function Hash (hash, xs) {
    if (Array.isArray(hash) && Array.isArray(xs)) {
        var to = Math.min(hash.length, xs.length);
        var acc = {};
        for (var i = 0; i < to; i++) {
            acc[hash[i]] = xs[i];
        }
        return Hash(acc);
    }
    
    if (hash === undefined) return Hash({});
    
    var self = {
        map : function (f) {
            var acc = { __proto__ : hash.__proto__ };
            Object.keys(hash).forEach(function (key) {
                acc[key] = f.call(self, hash[key], key);
            });
            return Hash(acc);
        },
        forEach : function (f) {
            Object.keys(hash).forEach(function (key) {
                f.call(self, hash[key], key);
            });
            return self;
        },
        filter : function (f) {
            var acc = { __proto__ : hash.__proto__ };
            Object.keys(hash).forEach(function (key) {
                if (f.call(self, hash[key], key)) {
                    acc[key] = hash[key];
                }
            });
            return Hash(acc);
        },
        detect : function (f) {
            for (var key in hash) {
                if (f.call(self, hash[key], key)) {
                    return hash[key];
                }
            }
            return undefined;
        },
        reduce : function (f, acc) {
            var keys = Object.keys(hash);
            if (acc === undefined) acc = keys.shift();
            keys.forEach(function (key) {
                acc = f.call(self, acc, hash[key], key);
            });
            return acc;
        },
        some : function (f) {
            for (var key in hash) {
                if (f.call(self, hash[key], key)) return true;
            }
            return false;
        },
        update : function (h) {
            Object.keys(h).forEach(function (key) {
                hash[key] = h[key];
            });
            return self;
        },
        merge : function (h) {
            return self.copy.update(h);
        },
        has : function (key) { // only operates on enumerables
            return Array.isArray(key)
                ? key.every(function (k) { return self.has(k) })
                : self.keys.indexOf(key.toString()) >= 0;
        },
        valuesAt : function (keys) {
            return Array.isArray(keys)
                ? keys.map(function (key) { return hash[key] })
                : hash[keys]
            ;
        },
        tap : function (f) {
            f.call(self, hash);
            return self;
        },
        extract : function (keys) {
            var acc = {};
            keys.forEach(function (key) {
                acc[key] = hash[key];
            });
            return Hash(acc);
        },
        exclude : function (keys) {
            return self.filter(function (_, key) {
                return keys.indexOf(key) < 0
            });
        },
        end : hash,
        items : hash
    };
    
    var props = {
        keys : function () { return Object.keys(hash) },
        values : function () {
            return Object.keys(hash).map(function (key) { return hash[key] });
        },
        compact : function () {
            return self.filter(function (x) { return x !== undefined });
        },
        clone : function () { return Hash(Hash.clone(hash)) },
        copy : function () { return Hash(Hash.copy(hash)) },
        length : function () { return Object.keys(hash).length },
        size : function () { return self.length }
    };
    
    if (self.__defineGetter__) {
        for (var key in props) {
            self.__defineGetter__(key, props[key]);
        }
    }
    else if (Object.defineProperty) {
        for (var key in props) {
            Object.defineProperty(self, key, { get : props[key] });
        }
    }
    else {
        // non-lazy version for browsers that suck >_<
        for (var key in props) {
            self[key] = prop();
        }
    }
    
    return self;
};

// deep copy
Hash.clone = function (ref) {
    return Traverse.clone(ref);
};

// shallow copy
Hash.copy = function (ref) {
    var hash = { __proto__ : ref.__proto__ };
    Object.keys(ref).forEach(function (key) {
        hash[key] = ref[key];
    });
    return hash;
};

Hash.map = function (ref, f) {
    return Hash(ref).map(f).items;
};

Hash.forEach = function (ref, f) {
    Hash(ref).forEach(f);
};

Hash.filter = function (ref, f) {
    return Hash(ref).filter(f).items;
};

Hash.detect = function (ref, f) {
    return Hash(ref).detect(f);
};

Hash.reduce = function (ref, f, acc) {
    return Hash(ref).reduce(f, acc);
};

Hash.some = function (ref, f) {
    return Hash(ref).some(f);
};

Hash.update = function (a, b) {
    return Hash(a).update(b).items;
};

Hash.merge = function (a, b) {
    return Hash(a).merge(b).items;
};

Hash.has = function (ref, key) {
    return Hash(ref).has(key);
};

Hash.valuesAt = function (ref, keys) {
    return Hash(ref).valuesAt(keys);
};

Hash.tap = function (ref, f) {
    return Hash(ref).tap(f).items;
};

Hash.extract = function (ref, keys) {
    return Hash(ref).extract(keys).items;
};

Hash.exclude = function (ref, keys) {
    return Hash(ref).exclude(keys).items;
};

Hash.concat = function (xs) {
    var hash = Hash({});
    xs.forEach(function (x) { hash.update(x) });
    return hash.items;
};

Hash.zip = function (xs, ys) {
    return Hash(xs, ys).items;
};

// .length is already defined for function prototypes
Hash.size = function (ref) {
    return Hash(ref).size;
};

Hash.compact = function (ref) {
    return Hash(ref).compact.items;
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["hashish"]._cached = module.exports;
    return module.exports;
};


_browserifyRequire.modules["source"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "source";
    var __filename = "source/source";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("source", path);
    };
    
    (function () {
        var fs = require('fs');
var path = require('path');
var find = require('findit');

exports.modules = function (name) {
    var pkgdir = path.dirname(require.resolve(name + '/package.json'));
    var pkg = JSON.parse(fs.readFileSync(pkgdir + '/package.json', 'utf8'));
    
    var main = require.resolve(name);
    
    var modules = {};
    modules[name] = fs.readFileSync(main);
    modules[name + '/package.json'] = pkg;
    
    if (pkg.directories && pkg.directories.lib) {
        var libdir = path.resolve(pkgdir, pkg.directories.lib);
        
        find.sync(libdir)
            .filter(function (lib) {
                return lib.match(/\.js$/)
                    && path.resolve(libdir, lib) !== main
                    && !path.basename(lib).match(/^\./)
                ;
            })
            .forEach(function (lib) {
                var src = fs.readFileSync(lib);
                var p = lib.slice(libdir.length)
                    .replace(/\.js$/,'');
                modules[name + '/lib' + p] = src;
            })
        ;
    }
    else if (path.existsSync(pkgdir + '/lib')) {
        find.sync(pkgdir + '/lib')
            .filter(function (lib) {
                return lib.match(/\.js$/)
                    && path.resolve(pkgdir + '/lib', lib) !== main
                    && !path.basename(lib).match(/^\./)
                ;
            })
            .forEach(function (lib) {
                var src = fs.readFileSync(lib);
                var p = lib.slice((pkgdir + '/lib').length)
                    .replace(/\.js$/,'');
                modules[name + '/lib' + p] = src;
            })
        ;
    }
    
    var bins = [ pkg.bin, pkg.directories && pkg.directories.bin ]
        .map(function (bin) {
            return bin && (pkgdir + '/' + bin)
        })
        .filter(function (bin) {
            return path.existsSync(bin)
        })
    ;
    
    fs.readdirSync(pkgdir)
        .filter(function (file) {
            return file.match(/\.js$/)
                && !path.basename(file).match(/^\./)
                && bins.indexOf(pkgdir + '/' + file) < 0
                && pkgdir + '/' + file !== main
            ;
        })
        .forEach(function (file) {
            var p = name + '/' + file.replace(/\.js$/, '');
            modules[p] = fs.readFileSync(pkgdir + '/' + file);
        })
    ;
    
    return modules;
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["source"]._cached = module.exports;
    return module.exports;
};


_browserifyRequire.modules["es5-shim"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "es5-shim";
    var __filename = "es5-shim/es5-shim";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("es5-shim", path);
    };
    
    (function () {
        
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)
// -- dantman Daniel Friesen Copyright(C) 2010 XXX No License Specified
// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/

(function (undefined) {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-050.pdf
 *
 * NOTE: this is a draft, and as such, the URL is subject to change.  If the
 * link is broken, check in the parent directory for the latest TC39 PDF.
 * http://www.ecma-international.org/publications/files/drafts/
 *
 * Previous ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
 * This is a broken link to the previous draft of ES5 on which most of the
 * numbered specification references and quotes herein were taken.  Updating
 * these references and quotes to reflect the new document would be a welcome
 * volunteer project.
 * 
 * @module
 */

/*whatsupdoc*/

// this is often accessed, so avoid multiple dereference costs universally
var has = Object.prototype.hasOwnProperty;

//
// Array
// =====
//

// ES5 15.4.3.2 
if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) == "[object Array]";
    };
}

// ES5 15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach =  function(block, thisObject) {
        var len = this.length >>> 0;
        for (var i = 0; i < len; i++) {
            if (i in this) {
                block.call(thisObject, this[i], i, this);
            }
        }
    };
}

// ES5 15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
          throw new TypeError();

        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                res[i] = fun.call(thisp, this[i], i, this);
        }

        return res;
    };
}

// ES5 15.4.4.20
if (!Array.prototype.filter) {
    Array.prototype.filter = function (block /*, thisp */) {
        var values = [];
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (block.call(thisp, this[i]))
                values.push(this[i]);
        return values;
    };
}

// ES5 15.4.4.16
if (!Array.prototype.every) {
    Array.prototype.every = function (block /*, thisp */) {
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (!block.call(thisp, this[i]))
                return false;
        return true;
    };
}

// ES5 15.4.4.17
if (!Array.prototype.some) {
    Array.prototype.some = function (block /*, thisp */) {
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++)
            if (block.call(thisp, this[i]))
                return true;
        return false;
    };
}

// ES5 15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value and an empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = 0;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);
        }

        for (; i < len; i++) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}

// ES5 15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value, empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = len - 1;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);
        }

        for (; i >= 0; i--) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}

// ES5 15.4.4.14
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (value /*, fromIndex */ ) {
        var length = this.length;
        if (!length)
            return -1;
        var i = arguments[1] || 0;
        if (i >= length)
            return -1;
        if (i < 0)
            i += length;
        for (; i < length; i++) {
            if (!has.call(this, i))
                continue;
            if (value === this[i])
                return i;
        }
        return -1;
    };
}

// ES5 15.4.4.15
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function (value /*, fromIndex */) {
        var length = this.length;
        if (!length)
            return -1;
        var i = arguments[1] || length;
        if (i < 0)
            i += length;
        i = Math.min(i, length - 1);
        for (; i >= 0; i--) {
            if (!has.call(this, i))
                continue;
            if (value === this[i])
                return i;
        }
        return -1;
    };
}

//
// Object
// ======
// 

// ES5 15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/kriskowal/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    Object.getPrototypeOf = function (object) {
        return object.__proto__ || object.constructor.prototype;
        // or undefined if not available in this engine
    };
}

// ES5 15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    Object.getOwnPropertyDescriptor = function (object) {
        if (typeof object !== "object" && typeof object !== "function" || object === null)
            throw new TypeError("Object.getOwnPropertyDescriptor called on a non-object");

        return has.call(object, property) ? {
            value: object[property],
            enumerable: true,
            configurable: true,
            writeable: true
        } : undefined;
    };
}

// ES5 15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function (object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5 
if (!Object.create) {
    Object.create = function(prototype, properties) {
        var object;
        if (prototype === null) {
            object = {"__proto__": null};
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
        }
        if (typeof properties !== "undefined")
            Object.defineProperties(object, properties);
        return object;
    };
}

// ES5 15.2.3.6
if (!Object.defineProperty) {
    Object.defineProperty = function(object, property, descriptor) {
        if (typeof descriptor == "object" && object.__defineGetter__) {
            if (has.call(descriptor, "value")) {
                if (!object.__lookupGetter__(property) && !object.__lookupSetter__(property))
                    // data property defined and no pre-existing accessors
                    object[property] = descriptor.value;
                if (has.call(descriptor, "get") || has.call(descriptor, "set"))
                    // descriptor has a value property but accessor already exists
                    throw new TypeError("Object doesn't support this action");
            }
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(has.call(descriptor, "writable") ? descriptor.writable : true) ||
                !(has.call(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(has.call(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */
            else if (typeof descriptor.get == "function")
                object.__defineGetter__(property, descriptor.get);
            if (typeof descriptor.set == "function")
                object.__defineSetter__(property, descriptor.set);
        }
        return object;
    };
}

// ES5 15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function(object, properties) {
        for (var property in properties) {
            if (has.call(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}

// ES5 15.2.3.8
if (!Object.seal) {
    Object.seal = function (object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
if (!Object.freeze) {
    Object.freeze = function (object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function (freeze) {
        return function (object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freeze(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function (object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function (object) {
        return false;
    };
}

// ES5 15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function (object) {
        return false;
    };
}

// ES5 15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function (object) {
        return true;
    };
}

// ES5 15.2.3.14
// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
if (!Object.keys) {

    var hasDontEnumBug = true,
        dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null})
        hasDontEnumBug = false;

    Object.keys = function (object) {

        if (
            typeof object !== "object" && typeof object !== "function"
            || object === null
        )
            throw new TypeError("Object.keys called on a non-object");

        var keys = [];
        for (var name in object) {
            if (has.call(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (has.call(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }

        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// Format a Date object as a string according to a subset of the ISO-8601 standard.
// Useful in Atom, among other things.
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
        return (
            this.getUTCFullYear() + "-" +
            (this.getUTCMonth() + 1) + "-" +
            this.getUTCDate() + "T" +
            this.getUTCHours() + ":" +
            this.getUTCMinutes() + ":" +
            this.getUTCSeconds() + "Z"
        ); 
    }
}

// ES5 15.9.4.4
if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

// ES5 15.9.5.44
if (!Date.prototype.toJSON) {
    Date.prototype.toJSON = function (key) {
        // This function provides a String representation of a Date object for
        // use by JSON.stringify (15.12.3). When the toJSON method is called
        // with argument key, the following steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ToPrimitive(O, hint Number).
        // 3. If tv is a Number and is not finite, return null.
        // XXX
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof this.toISOString != "function")
            throw new TypeError();
        // 6. Return the result of calling the [[Call]] internal method of
        // toISO with O as the this value and an empty argument list.
        return this.toISOString();

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// 15.9.4.2 Date.parse (string)
// 15.9.1.15 Date Time String Format
// Date.parse
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (isNaN(Date.parse("T00:00"))) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        var Date = function(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length === 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format
        var isoDateExpression = new RegExp("^" +
            "(?:" + // optional year-month-day
                "(" + // year capture
                    "(?:[+-]\\d\\d)?" + // 15.9.1.15.1 Extended years
                    "\\d\\d\\d\\d" + // four-digit year
                ")" +
                "(?:-" + // optional month-day
                    "(\\d\\d)" + // month capture
                    "(?:-" + // optional day
                        "(\\d\\d)" + // day capture
                    ")?" +
                ")?" +
            ")?" + 
            "(?:T" + // hour:minute:second.subsecond
                "(\\d\\d)" + // hour capture
                ":(\\d\\d)" + // minute capture
                "(?::" + // optional :second.subsecond
                    "(\\d\\d)" + // second capture
                    "(?:\\.(\\d\\d\\d))?" + // milisecond capture
                ")?" +
            ")?" +
            "(?:" + // time zone
                "Z|" + // UTC capture
                "([+-])(\\d\\d):(\\d\\d)" + // timezone offset
                // capture sign, hour, minute
            ")?" +
        "$");

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate)
            Date[key] = NativeDate[key];

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle the ISO dates we use
        // TODO review specification to ascertain whether it is
        // necessary to implement partial ISO date strings.
        Date.parse = function(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                match.shift(); // kill match[0], the full match
                // recognize times without dates before normalizing the
                // numeric values, for later use
                var timeOnly = match[0] === undefined;
                // parse numerics
                for (var i = 0; i < 10; i++) {
                    // skip + or - for the timezone offset
                    if (i === 7)
                        continue;
                    // Note: parseInt would read 0-prefix numbers as
                    // octal.  Number constructor or unary + work better
                    // here:
                    match[i] = +(match[i] || (i < 3 ? 1 : 0));
                    // match[1] is the month. Months are 0-11 in JavaScript
                    // Date objects, but 1-12 in ISO notation, so we
                    // decrement.
                    if (i === 1)
                        match[i]--;
                }
                // if no year-month-date is provided, return a milisecond
                // quantity instead of a UTC date number value.
                if (timeOnly)
                    return ((match[3] * 60 + match[4]) * 60 + match[5]) * 1000 + match[6];

                // account for an explicit time zone offset if provided
                var offset = (match[8] * 60 + match[9]) * 60 * 1000;
                if (match[6] === "-")
                    offset = -offset;

                return NativeDate.UTC.apply(this, match.slice(0, 7)) + offset;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

// 
// Function
// ========
// 

// ES-5 15.3.4.5
// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
var slice = Array.prototype.slice;
if (!Function.prototype.bind) {
    Function.prototype.bind = function (that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        // XXX this gets pretty close, for all intents and purposes, letting 
        // some duck-types slide
        if (typeof target.apply != "function" || typeof target.call != "function")
            return new TypeError();
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        var args = slice.call(arguments);
        // 4. Let F be a new native ECMAScript object.
        // 9. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 10. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 11. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 12. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        // 13. The [[Scope]] internal property of F is unused and need not
        //   exist.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.

                var self = Object.create(target.prototype);
                target.apply(self, args.concat(slice.call(arguments)));
                return self;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the list
                //   boundArgs in the same order followed by the same values as
                //   the list ExtraArgs in the same order. 5.  Return the
                //   result of calling the [[Call]] internal method of target
                //   providing boundThis as the this value and providing args
                //   as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.call.apply(
                    target,
                    args.concat(slice.call(arguments))
                );

            }

        };
        // 5. Set the [[TargetFunction]] internal property of F to Target.
        // extra:
        bound.bound = target;
        // 6. Set the [[BoundThis]] internal property of F to the value of
        // thisArg.
        // extra:
        bound.boundTo = that;
        // 7. Set the [[BoundArgs]] internal property of F to A.
        // extra:
        bound.boundArgs = args;
        bound.length = (
            // 14. If the [[Class]] internal property of Target is "Function", then
            typeof target == "function" ?
            // a. Let L be the length property of Target minus the length of A.
            // b. Set the length own property of F to either 0 or L, whichever is larger.
            Math.max(target.length - args.length, 0) :
            // 15. Else set the length own property of F to 0.
            0
        )
        // 16. The length own property of F is given attributes as specified in
        //   15.3.5.1.
        // TODO
        // 17. Set the [[Extensible]] internal property of F to true.
        // TODO
        // 18. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // 19. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property.
        // XXX can't delete it in pure-js.
        return bound;
    };
}

//
// String
// ======
//

// ES5 15.5.4.20
if (!String.prototype.trim) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    var trimBeginRegexp = /^\s\s*/;
    var trimEndRegexp = /\s\s*$/;
    String.prototype.trim = function () {
        return String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    };
}

})();
;
    }).call(module.exports);
    
    _browserifyRequire.modules["es5-shim"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["es5-shim/es5-shim-0.0.4.min"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "es5-shim";
    var __filename = "es5-shim/es5-shim/es5-shim-0.0.4.min";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("es5-shim/es5-shim-0.0.4.min", path);
    };
    
    (function () {
        (function(){var j=Object.prototype.hasOwnProperty;if(!Array.isArray)Array.isArray=function(a){return Object.prototype.toString.call(a)=="[object Array]"};if(!Array.prototype.forEach)Array.prototype.forEach=function(a,c){for(var b=this.length>>>0,d=0;d<b;d++)d in this&&a.call(c,this[d],d,this)};if(!Array.prototype.map)Array.prototype.map=function(a,c){var b=this.length>>>0;if(typeof a!="function")throw new TypeError;for(var d=Array(b),e=0;e<b;e++)if(e in this)d[e]=a.call(c,this[e],e,this);return d};
if(!Array.prototype.filter)Array.prototype.filter=function(a,c){for(var b=[],d=0;d<this.length;d++)a.call(c,this[d])&&b.push(this[d]);return b};if(!Array.prototype.every)Array.prototype.every=function(a,c){for(var b=0;b<this.length;b++)if(!a.call(c,this[b]))return false;return true};if(!Array.prototype.some)Array.prototype.some=function(a,c){for(var b=0;b<this.length;b++)if(a.call(c,this[b]))return true;return false};if(!Array.prototype.reduce)Array.prototype.reduce=function(a){var c=this.length>>>
0;if(typeof a!="function")throw new TypeError;if(c==0&&arguments.length==1)throw new TypeError;var b=0;if(arguments.length>=2)var d=arguments[1];else{do{if(b in this){d=this[b++];break}if(++b>=c)throw new TypeError;}while(1)}for(;b<c;b++)if(b in this)d=a.call(null,d,this[b],b,this);return d};if(!Array.prototype.reduceRight)Array.prototype.reduceRight=function(a){var c=this.length>>>0;if(typeof a!="function")throw new TypeError;if(c==0&&arguments.length==1)throw new TypeError;c=c-1;if(arguments.length>=
2)var b=arguments[1];else{do{if(c in this){b=this[c--];break}if(--c<0)throw new TypeError;}while(1)}for(;c>=0;c--)if(c in this)b=a.call(null,b,this[c],c,this);return b};if(!Array.prototype.indexOf)Array.prototype.indexOf=function(a,c){var b=this.length;if(!b)return-1;var d=c||0;if(d>=b)return-1;if(d<0)d+=b;for(;d<b;d++)if(j.call(this,d))if(a===this[d])return d;return-1};if(!Array.prototype.lastIndexOf)Array.prototype.lastIndexOf=function(a,c){var b=this.length;if(!b)return-1;var d=c||b;if(d<0)d+=
b;for(d=Math.min(d,b-1);d>=0;d--)if(j.call(this,d))if(a===this[d])return d;return-1};if(!Object.getPrototypeOf)Object.getPrototypeOf=function(a){return a.__proto__||a.constructor.prototype};if(!Object.getOwnPropertyDescriptor)Object.getOwnPropertyDescriptor=function(){return{}};if(!Object.getOwnPropertyNames)Object.getOwnPropertyNames=function(a){return Object.keys(a)};if(!Object.create)Object.create=function(a,c){var b;if(a===null)b={__proto__:null};else{if(typeof a!="object")throw new TypeError("typeof prototype["+
typeof a+"] != 'object'");b=function(){};b.prototype=a;b=new b}typeof c!=="undefined"&&Object.defineProperties(b,c);return b};if(!Object.defineProperty)Object.defineProperty=function(a,c,b){if(typeof b=="object"&&a.__defineGetter__){if(j.call(b,"value")){if(!a.__lookupGetter__(c)&&!a.__lookupSetter__(c))a[c]=b.value;if(j.call(b,"get")||j.call(b,"set"))throw new TypeError("Object doesn't support this action");}else typeof b.get=="function"&&a.__defineGetter__(c,b.get);typeof b.set=="function"&&a.__defineSetter__(c,
b.set)}return a};if(!Object.defineProperties)Object.defineProperties=function(a,c){for(var b in c)j.call(c,b)&&Object.defineProperty(a,b,c[b]);return a};if(!Object.seal)Object.seal=function(a){return a};if(!Object.freeze)Object.freeze=function(a){return a};try{Object.freeze(function(){})}catch(u){Object.freeze=function(a){return function(c){return typeof c=="function"?c:a(c)}}(Object.freeze)}if(!Object.preventExtensions)Object.preventExtensions=function(a){return a};if(!Object.isSealed)Object.isSealed=
function(){return false};if(!Object.isFrozen)Object.isFrozen=function(){return false};if(!Object.isExtensible)Object.isExtensible=function(){return true};if(!Object.keys){var m=true,n=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],p=n.length,q;for(q in{toString:null})m=false;Object.keys=function(a){if(typeof a!=="object"&&typeof a!=="function"||a===null)throw new TypeError("Object.keys called on a non-object");var c=[],b;for(b in a)j.call(a,
b)&&c.push(b);if(m)for(b=0;b<p;b++){var d=n[b];j.call(a,d)&&c.push(d)}return c}}if(!Date.prototype.toISOString)Date.prototype.toISOString=function(){return this.getFullYear()+"-"+(this.getMonth()+1)+"-"+this.getDate()+"T"+this.getHours()+":"+this.getMinutes()+":"+this.getSeconds()+"Z"};if(!Date.now)Date.now=function(){return(new Date).getTime()};if(!Date.prototype.toJSON)Date.prototype.toJSON=function(){if(typeof this.toISOString!="function")throw new TypeError;return this.toISOString()};if(isNaN(Date.parse("T00:00")))Date=
function(a){var c=function(e,f,h,g,k,o,r){var i=arguments.length;if(this instanceof a){i=i===1&&String(e)===e?new a(c.parse(e)):i>=7?new a(e,f,h,g,k,o,r):i>=6?new a(e,f,h,g,k,o):i>=5?new a(e,f,h,g,k):i>=4?new a(e,f,h,g):i>=3?new a(e,f,h):i>=2?new a(e,f):i>=1?new a(e):new a;i.constructor=c;return i}return a.apply(this,arguments)},b=RegExp("^(?:((?:[+-]\\d\\d)?\\d\\d\\d\\d)(?:-(\\d\\d)(?:-(\\d\\d))?)?)?(?:T(\\d\\d):(\\d\\d)(?::(\\d\\d)(?:\\.(\\d\\d\\d))?)?)?(?:Z|([+-])(\\d\\d):(\\d\\d))?$"),d;for(d in a)c[d]=
a[d];c.now=a.now;c.UTC=a.UTC;c.prototype=a.prototype;c.prototype.constructor=c;c.parse=function(e){var f=b.exec(e);if(f){f.shift();for(var h=f[0]===undefined,g=0;g<10;g++)if(g!==7){f[g]=+(f[g]||(g<3?1:0));g===1&&f[g]--}if(h)return((f[3]*60+f[4])*60+f[5])*1E3+f[6];h=(f[8]*60+f[9])*60*1E3;if(f[6]==="-")h=-h;return a.UTC.apply(this,f.slice(0,7))+h}return a.parse.apply(this,arguments)};return c}(Date);var l=Array.prototype.slice;if(!Function.prototype.bind)Function.prototype.bind=function(a){var c=this;
if(typeof c.apply!="function"||typeof c.call!="function")return new TypeError;var b=l.call(arguments),d=function(){if(this instanceof d){var e=Object.create(c.prototype);c.apply(e,b.concat(l.call(arguments)));return e}else return c.call.apply(c,b.concat(l.call(arguments)))};d.bound=c;d.boundTo=a;d.boundArgs=b;d.length=typeof c=="function"?Math.max(c.length-b.length,0):0;return d};if(!String.prototype.trim){var s=/^\s\s*/,t=/\s\s*$/;String.prototype.trim=function(){return String(this).replace(s,"").replace(t,
"")}}})();;
    }).call(module.exports);
    
    _browserifyRequire.modules["es5-shim/es5-shim-0.0.4.min"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script", path);
    };
    
    (function () {
        (function() {
  var Lexer, RESERVED, compile, fs, lexer, parser, path, _ref;
  fs = require('fs');
  path = require('path');
  _ref = require('./lexer'), Lexer = _ref.Lexer, RESERVED = _ref.RESERVED;
  parser = require('./parser').parser;
  if (require.extensions) {
    require.extensions['.coffee'] = function(module, filename) {
      var content;
      content = compile(fs.readFileSync(filename, 'utf8'));
      return module._compile(content, filename);
    };
  } else if (require.registerExtension) {
    require.registerExtension('.coffee', function(content) {
      return compile(content);
    });
  }
  exports.VERSION = '1.0.1';
  exports.RESERVED = RESERVED;
  exports.helpers = require('./helpers');
  exports.compile = compile = function(code, options) {
    if (options == null) {
      options = {};
    }
    try {
      return (parser.parse(lexer.tokenize(code))).compile(options);
    } catch (err) {
      if (options.filename) {
        err.message = "In " + options.filename + ", " + err.message;
      }
      throw err;
    }
  };
  exports.tokens = function(code, options) {
    return lexer.tokenize(code, options);
  };
  exports.nodes = function(source, options) {
    if (typeof source === 'string') {
      return parser.parse(lexer.tokenize(source, options));
    } else {
      return parser.parse(source);
    }
  };
  exports.run = function(code, options) {
    var root;
    root = module;
    while (root.parent) {
      root = root.parent;
    }
    root.filename = options.filename ? fs.realpathSync(options.filename) : '.';
    if (root.moduleCache) {
      root.moduleCache = {};
    }
    if (path.extname(root.filename) !== '.coffee' || require.extensions) {
      return root._compile(compile(code, options), root.filename);
    } else {
      return root._compile(code, root.filename);
    }
  };
  exports.eval = function(code, options) {
    var __dirname, __filename;
    __filename = module.filename = options.filename;
    __dirname = path.dirname(__filename);
    return eval(compile(code, options));
  };
  lexer = new Lexer;
  parser.lexer = {
    lex: function() {
      var tag, _ref;
      _ref = this.tokens[this.pos++] || [''], tag = _ref[0], this.yytext = _ref[1], this.yylineno = _ref[2];
      return tag;
    },
    setInput: function(tokens) {
      this.tokens = tokens;
      return this.pos = 0;
    },
    upcomingInput: function() {
      return "";
    }
  };
  parser.yy = require('./nodes');
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/browser"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/browser";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/browser", path);
    };
    
    (function () {
        (function() {
  var CoffeeScript, runScripts;
  CoffeeScript = require('./coffee-script');
  CoffeeScript.require = require;
  CoffeeScript.eval = function(code, options) {
    return eval(CoffeeScript.compile(code, options));
  };
  CoffeeScript.run = function(code, options) {
    if (options == null) {
      options = {};
    }
    options.bare = true;
    return Function(CoffeeScript.compile(code, options))();
  };
  if (typeof window == "undefined" || window === null) {
    return;
  }
  CoffeeScript.load = function(url, options) {
    var xhr;
    xhr = new (window.ActiveXObject || XMLHttpRequest)('Microsoft.XMLHTTP');
    xhr.open('GET', url, true);
    if ('overrideMimeType' in xhr) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        return CoffeeScript.run(xhr.responseText, options);
      }
    };
    return xhr.send(null);
  };
  runScripts = function() {
    var script, _i, _len, _ref;
    _ref = document.getElementsByTagName('script');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      script = _ref[_i];
      if (script.type === 'text/coffeescript') {
        if (script.src) {
          CoffeeScript.load(script.src);
        } else {
          CoffeeScript.run(script.innerHTML);
        }
      }
    }
    return null;
  };
  if (window.addEventListener) {
    addEventListener('DOMContentLoaded', runScripts, false);
  } else {
    attachEvent('onload', runScripts);
  }
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/browser"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/cake"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/cake";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/cake", path);
    };
    
    (function () {
        (function() {
  var CoffeeScript, fs, helpers, missingTask, oparse, options, optparse, path, printTasks, switches, tasks;
  fs = require('fs');
  path = require('path');
  helpers = require('./helpers');
  optparse = require('./optparse');
  CoffeeScript = require('./coffee-script');
  tasks = {};
  options = {};
  switches = [];
  oparse = null;
  helpers.extend(global, {
    task: function(name, description, action) {
      var _ref;
      if (!action) {
        _ref = [description, action], action = _ref[0], description = _ref[1];
      }
      return tasks[name] = {
        name: name,
        description: description,
        action: action
      };
    },
    option: function(letter, flag, description) {
      return switches.push([letter, flag, description]);
    },
    invoke: function(name) {
      if (!tasks[name]) {
        missingTask(name);
      }
      return tasks[name].action(options);
    }
  });
  exports.run = function() {
    return path.exists('Cakefile', function(exists) {
      var arg, args, _i, _len, _ref, _results;
      if (!exists) {
        throw new Error("Cakefile not found in " + (process.cwd()));
      }
      args = process.argv.slice(2);
      CoffeeScript.run(fs.readFileSync('Cakefile').toString(), {
        filename: 'Cakefile'
      });
      oparse = new optparse.OptionParser(switches);
      if (!args.length) {
        return printTasks();
      }
      options = oparse.parse(args);
      _ref = options.arguments;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        arg = _ref[_i];
        _results.push(invoke(arg));
      }
      return _results;
    });
  };
  printTasks = function() {
    var desc, name, spaces, task;
    console.log('');
    for (name in tasks) {
      task = tasks[name];
      spaces = 20 - name.length;
      spaces = spaces > 0 ? Array(spaces + 1).join(' ') : '';
      desc = task.description ? "# " + task.description : '';
      console.log("cake " + name + spaces + " " + desc);
    }
    if (switches.length) {
      return console.log(oparse.help());
    }
  };
  missingTask = function(task) {
    console.log("No such task: \"" + task + "\"");
    return process.exit(1);
  };
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/cake"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/command"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/command";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/command", path);
    };
    
    (function () {
        (function() {
  var BANNER, CoffeeScript, EventEmitter, SWITCHES, compileJoin, compileOptions, compileScript, compileScripts, compileStdio, contents, exec, forkNode, fs, helpers, lint, loadRequires, optionParser, optparse, opts, parseOptions, path, printLine, printTokens, printWarn, sources, spawn, usage, version, watch, writeJs, _ref;
  fs = require('fs');
  path = require('path');
  helpers = require('./helpers');
  optparse = require('./optparse');
  CoffeeScript = require('./coffee-script');
  _ref = require('child_process'), spawn = _ref.spawn, exec = _ref.exec;
  EventEmitter = require('events').EventEmitter;
  helpers.extend(CoffeeScript, new EventEmitter);
  printLine = function(line) {
    return process.stdout.write(line + '\n');
  };
  printWarn = function(line) {
    return process.binding('stdio').writeError(line + '\n');
  };
  BANNER = 'Usage: coffee [options] path/to/script.coffee';
  SWITCHES = [['-c', '--compile', 'compile to JavaScript and save as .js files'], ['-i', '--interactive', 'run an interactive CoffeeScript REPL'], ['-o', '--output [DIR]', 'set the directory for compiled JavaScript'], ['-j', '--join', 'concatenate the scripts before compiling'], ['-w', '--watch', 'watch scripts for changes, and recompile'], ['-p', '--print', 'print the compiled JavaScript to stdout'], ['-l', '--lint', 'pipe the compiled JavaScript through JSLint'], ['-s', '--stdio', 'listen for and compile scripts over stdio'], ['-e', '--eval', 'compile a string from the command line'], ['-r', '--require [FILE*]', 'require a library before executing your script'], ['-b', '--bare', 'compile without the top-level function wrapper'], ['-t', '--tokens', 'print the tokens that the lexer produces'], ['-n', '--nodes', 'print the parse tree that Jison produces'], ['--nodejs [ARGS]', 'pass options through to the "node" binary'], ['-v', '--version', 'display CoffeeScript version'], ['-h', '--help', 'display this help message']];
  opts = {};
  sources = [];
  contents = [];
  optionParser = null;
  exports.run = function() {
    parseOptions();
    if (opts.nodejs) {
      return forkNode();
    }
    if (opts.help) {
      return usage();
    }
    if (opts.version) {
      return version();
    }
    if (opts.require) {
      loadRequires();
    }
    if (opts.interactive) {
      return require('./repl');
    }
    if (opts.stdio) {
      return compileStdio();
    }
    if (opts.eval) {
      return compileScript(null, sources[0]);
    }
    if (!sources.length) {
      return require('./repl');
    }
    if (opts.run) {
      opts.literals = sources.splice(1).concat(opts.literals);
    }
    process.ARGV = process.argv = process.argv.slice(0, 2).concat(opts.literals);
    return compileScripts();
  };
  compileScripts = function() {
    var base, compile, source, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = sources.length; _i < _len; _i++) {
      source = sources[_i];
      base = path.join(source);
      compile = function(source, topLevel) {
        return path.exists(source, function(exists) {
          if (topLevel && !exists) {
            throw new Error("File not found: " + source);
          }
          return fs.stat(source, function(err, stats) {
            if (stats.isDirectory()) {
              return fs.readdir(source, function(err, files) {
                var file, _i, _len, _results;
                _results = [];
                for (_i = 0, _len = files.length; _i < _len; _i++) {
                  file = files[_i];
                  _results.push(compile(path.join(source, file)));
                }
                return _results;
              });
            } else if (topLevel || path.extname(source) === '.coffee') {
              fs.readFile(source, function(err, code) {
                if (opts.join) {
                  contents[sources.indexOf(source)] = code.toString();
                  if (helpers.compact(contents).length === sources.length) {
                    return compileJoin();
                  }
                } else {
                  return compileScript(source, code.toString(), base);
                }
              });
              if (opts.watch && !opts.join) {
                return watch(source, base);
              }
            }
          });
        });
      };
      _results.push(compile(source, true));
    }
    return _results;
  };
  compileScript = function(file, input, base) {
    var o, options, t, task;
    o = opts;
    options = compileOptions(file);
    try {
      t = task = {
        file: file,
        input: input,
        options: options
      };
      CoffeeScript.emit('compile', task);
      if (o.tokens) {
        return printTokens(CoffeeScript.tokens(t.input));
      } else if (o.nodes) {
        return printLine(CoffeeScript.nodes(t.input).toString().trim());
      } else if (o.run) {
        return CoffeeScript.run(t.input, t.options);
      } else {
        t.output = CoffeeScript.compile(t.input, t.options);
        CoffeeScript.emit('success', task);
        if (o.print) {
          return printLine(t.output.trim());
        } else if (o.compile) {
          return writeJs(t.file, t.output, base);
        } else if (o.lint) {
          return lint(t.file, t.output);
        }
      }
    } catch (err) {
      CoffeeScript.emit('failure', err, task);
      if (CoffeeScript.listeners('failure').length) {
        return;
      }
      if (o.watch) {
        return printLine(err.message);
      }
      printWarn(err.stack);
      return process.exit(1);
    }
  };
  compileStdio = function() {
    var code, stdin;
    code = '';
    stdin = process.openStdin();
    stdin.on('data', function(buffer) {
      if (buffer) {
        return code += buffer.toString();
      }
    });
    return stdin.on('end', function() {
      return compileScript(null, code);
    });
  };
  compileJoin = function() {
    var code;
    code = contents.join('\n');
    return compileScript("concatenation", code, "concatenation");
  };
  loadRequires = function() {
    var realFilename, req, _i, _len, _ref;
    realFilename = module.filename;
    module.filename = '.';
    _ref = opts.require;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      req = _ref[_i];
      require(req);
    }
    return module.filename = realFilename;
  };
  watch = function(source, base) {
    return fs.watchFile(source, {
      persistent: true,
      interval: 500
    }, function(curr, prev) {
      if (curr.size === prev.size && curr.mtime.getTime() === prev.mtime.getTime()) {
        return;
      }
      return fs.readFile(source, function(err, code) {
        if (err) {
          throw err;
        }
        return compileScript(source, code.toString(), base);
      });
    });
  };
  writeJs = function(source, js, base) {
    var baseDir, compile, dir, filename, jsPath, srcDir;
    filename = path.basename(source, path.extname(source)) + '.js';
    srcDir = path.dirname(source);
    baseDir = base === '.' ? srcDir : srcDir.substring(base.length);
    dir = opts.output ? path.join(opts.output, baseDir) : srcDir;
    jsPath = path.join(dir, filename);
    compile = function() {
      if (js.length <= 0) {
        js = ' ';
      }
      return fs.writeFile(jsPath, js, function(err) {
        if (err) {
          return printLine(err.message);
        } else if (opts.compile && opts.watch) {
          return console.log("" + ((new Date).toTimeString()) + " - compiled " + source);
        }
      });
    };
    return path.exists(dir, function(exists) {
      if (exists) {
        return compile();
      } else {
        return exec("mkdir -p " + dir, compile);
      }
    });
  };
  lint = function(file, js) {
    var conf, jsl, printIt;
    printIt = function(buffer) {
      return printLine(file + ':\t' + buffer.toString().trim());
    };
    conf = __dirname + '/../extras/jsl.conf';
    jsl = spawn('jsl', ['-nologo', '-stdin', '-conf', conf]);
    jsl.stdout.on('data', printIt);
    jsl.stderr.on('data', printIt);
    jsl.stdin.write(js);
    return jsl.stdin.end();
  };
  printTokens = function(tokens) {
    var strings, tag, token, value;
    strings = (function() {
      var _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        _ref = [token[0], token[1].toString().replace(/\n/, '\\n')], tag = _ref[0], value = _ref[1];
        _results.push("[" + tag + " " + value + "]");
      }
      return _results;
    })();
    return printLine(strings.join(' '));
  };
  parseOptions = function() {
    var o;
    optionParser = new optparse.OptionParser(SWITCHES, BANNER);
    o = opts = optionParser.parse(process.argv.slice(2));
    o.compile || (o.compile = !!o.output);
    o.run = !(o.compile || o.print || o.lint);
    o.print = !!(o.print || (o.eval || o.stdio && o.compile));
    return sources = o.arguments;
  };
  compileOptions = function(filename) {
    return {
      filename: filename,
      bare: opts.bare
    };
  };
  forkNode = function() {
    var args, nodeArgs;
    nodeArgs = opts.nodejs.split(/\s+/);
    args = process.argv.slice(1);
    args.splice(args.indexOf('--nodejs'), 2);
    return spawn(process.execPath, nodeArgs.concat(args), {
      cwd: process.cwd(),
      env: process.env,
      customFds: [0, 1, 2]
    });
  };
  usage = function() {
    return printLine((new optparse.OptionParser(SWITCHES, BANNER)).help());
  };
  version = function() {
    return printLine("CoffeeScript version " + CoffeeScript.VERSION);
  };
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/command"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/grammar"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/grammar";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/grammar", path);
    };
    
    (function () {
        (function() {
  var Parser, alt, alternatives, grammar, name, o, operators, token, tokens, unwrap;
  Parser = require('jison').Parser;
  unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;
  o = function(patternString, action, options) {
    var match;
    patternString = patternString.replace(/\s{2,}/g, ' ');
    if (!action) {
      return [patternString, '$$ = $1;', options];
    }
    action = (match = unwrap.exec(action)) ? match[1] : "(" + action + "())";
    action = action.replace(/\bnew /g, '$&yy.');
    action = action.replace(/\b(?:Block\.wrap|extend)\b/g, 'yy.$&');
    return [patternString, "$$ = " + action + ";", options];
  };
  grammar = {
    Root: [
      o('', function() {
        return new Block;
      }), o('Body'), o('Block TERMINATOR')
    ],
    Body: [
      o('Line', function() {
        return Block.wrap([$1]);
      }), o('Body TERMINATOR Line', function() {
        return $1.push($3);
      }), o('Body TERMINATOR')
    ],
    Line: [o('Expression'), o('Statement')],
    Statement: [
      o('Return'), o('Throw'), o('Comment'), o('STATEMENT', function() {
        return new Literal($1);
      })
    ],
    Expression: [o('Value'), o('Invocation'), o('Code'), o('Operation'), o('Assign'), o('If'), o('Try'), o('While'), o('For'), o('Switch'), o('Class')],
    Block: [
      o('INDENT OUTDENT', function() {
        return new Block;
      }), o('INDENT Body OUTDENT', function() {
        return $2;
      })
    ],
    Identifier: [
      o('IDENTIFIER', function() {
        return new Literal($1);
      })
    ],
    AlphaNumeric: [
      o('NUMBER', function() {
        return new Literal($1);
      }), o('STRING', function() {
        return new Literal($1);
      })
    ],
    Literal: [
      o('AlphaNumeric'), o('JS', function() {
        return new Literal($1);
      }), o('REGEX', function() {
        return new Literal($1);
      }), o('BOOL', function() {
        var val;
        val = new Literal($1);
        if ($1 === 'undefined') {
          val.isUndefined = true;
        }
        return val;
      })
    ],
    Assign: [
      o('Assignable = Expression', function() {
        return new Assign($1, $3);
      }), o('Assignable = INDENT Expression OUTDENT', function() {
        return new Assign($1, $4);
      })
    ],
    AssignObj: [
      o('ObjAssignable', function() {
        return new Value($1);
      }), o('ObjAssignable : Expression', function() {
        return new Assign(new Value($1), $3, 'object');
      }), o('ObjAssignable :\
       INDENT Expression OUTDENT', function() {
        return new Assign(new Value($1), $4, 'object');
      }), o('Comment')
    ],
    ObjAssignable: [o('Identifier'), o('AlphaNumeric'), o('ThisProperty')],
    Return: [
      o('RETURN Expression', function() {
        return new Return($2);
      }), o('RETURN', function() {
        return new Return;
      })
    ],
    Comment: [
      o('HERECOMMENT', function() {
        return new Comment($1);
      })
    ],
    Code: [
      o('PARAM_START ParamList PARAM_END FuncGlyph Block', function() {
        return new Code($2, $5, $4);
      }), o('FuncGlyph Block', function() {
        return new Code([], $2, $1);
      })
    ],
    FuncGlyph: [
      o('->', function() {
        return 'func';
      }), o('=>', function() {
        return 'boundfunc';
      })
    ],
    OptComma: [o(''), o(',')],
    ParamList: [
      o('', function() {
        return [];
      }), o('Param', function() {
        return [$1];
      }), o('ParamList , Param', function() {
        return $1.concat($3);
      })
    ],
    Param: [
      o('ParamVar', function() {
        return new Param($1);
      }), o('ParamVar ...', function() {
        return new Param($1, null, true);
      }), o('ParamVar = Expression', function() {
        return new Param($1, $3);
      })
    ],
    ParamVar: [o('Identifier'), o('ThisProperty'), o('Array'), o('Object')],
    Splat: [
      o('Expression ...', function() {
        return new Splat($1);
      })
    ],
    SimpleAssignable: [
      o('Identifier', function() {
        return new Value($1);
      }), o('Value Accessor', function() {
        return $1.push($2);
      }), o('Invocation Accessor', function() {
        return new Value($1, [$2]);
      }), o('ThisProperty')
    ],
    Assignable: [
      o('SimpleAssignable'), o('Array', function() {
        return new Value($1);
      }), o('Object', function() {
        return new Value($1);
      })
    ],
    Value: [
      o('Assignable'), o('Literal', function() {
        return new Value($1);
      }), o('Parenthetical', function() {
        return new Value($1);
      }), o('Range', function() {
        return new Value($1);
      }), o('This')
    ],
    Accessor: [
      o('.  Identifier', function() {
        return new Access($2);
      }), o('?. Identifier', function() {
        return new Access($2, 'soak');
      }), o(':: Identifier', function() {
        return new Access($2, 'proto');
      }), o('::', function() {
        return new Access(new Literal('prototype'));
      }), o('Index'), o('Slice', function() {
        return new Slice($1);
      })
    ],
    Index: [
      o('INDEX_START Expression INDEX_END', function() {
        return new Index($2);
      }), o('INDEX_SOAK  Index', function() {
        return extend($2, {
          soak: true
        });
      }), o('INDEX_PROTO Index', function() {
        return extend($2, {
          proto: true
        });
      })
    ],
    Object: [
      o('{ AssignList OptComma }', function() {
        return new Obj($2, $1.generated);
      })
    ],
    AssignList: [
      o('', function() {
        return [];
      }), o('AssignObj', function() {
        return [$1];
      }), o('AssignList , AssignObj', function() {
        return $1.concat($3);
      }), o('AssignList OptComma TERMINATOR AssignObj', function() {
        return $1.concat($4);
      }), o('AssignList OptComma INDENT AssignList OptComma OUTDENT', function() {
        return $1.concat($4);
      })
    ],
    Class: [
      o('CLASS', function() {
        return new Class;
      }), o('CLASS Block', function() {
        return new Class(null, null, $2);
      }), o('CLASS EXTENDS Value', function() {
        return new Class(null, $3);
      }), o('CLASS EXTENDS Value Block', function() {
        return new Class(null, $3, $4);
      }), o('CLASS SimpleAssignable', function() {
        return new Class($2);
      }), o('CLASS SimpleAssignable Block', function() {
        return new Class($2, null, $3);
      }), o('CLASS SimpleAssignable EXTENDS Value', function() {
        return new Class($2, $4);
      }), o('CLASS SimpleAssignable EXTENDS Value Block', function() {
        return new Class($2, $4, $5);
      })
    ],
    Invocation: [
      o('Value OptFuncExist Arguments', function() {
        return new Call($1, $3, $2);
      }), o('Invocation OptFuncExist Arguments', function() {
        return new Call($1, $3, $2);
      }), o('SUPER', function() {
        return new Call('super', [new Splat(new Literal('arguments'))]);
      }), o('SUPER Arguments', function() {
        return new Call('super', $2);
      })
    ],
    OptFuncExist: [
      o('', function() {
        return false;
      }), o('FUNC_EXIST', function() {
        return true;
      })
    ],
    Arguments: [
      o('CALL_START CALL_END', function() {
        return [];
      }), o('CALL_START ArgList OptComma CALL_END', function() {
        return $2;
      })
    ],
    This: [
      o('THIS', function() {
        return new Value(new Literal('this'));
      }), o('@', function() {
        return new Value(new Literal('this'));
      })
    ],
    ThisProperty: [
      o('@ Identifier', function() {
        return new Value(new Literal('this'), [new Access($2)], 'this');
      })
    ],
    Array: [
      o('[ ]', function() {
        return new Arr([]);
      }), o('[ ArgList OptComma ]', function() {
        return new Arr($2);
      })
    ],
    RangeDots: [
      o('..', function() {
        return 'inclusive';
      }), o('...', function() {
        return 'exclusive';
      })
    ],
    Range: [
      o('[ Expression RangeDots Expression ]', function() {
        return new Range($2, $4, $3);
      })
    ],
    Slice: [
      o('INDEX_START Expression RangeDots Expression INDEX_END', function() {
        return new Range($2, $4, $3);
      }), o('INDEX_START Expression RangeDots INDEX_END', function() {
        return new Range($2, null, $3);
      }), o('INDEX_START RangeDots Expression INDEX_END', function() {
        return new Range(null, $3, $2);
      })
    ],
    ArgList: [
      o('Arg', function() {
        return [$1];
      }), o('ArgList , Arg', function() {
        return $1.concat($3);
      }), o('ArgList OptComma TERMINATOR Arg', function() {
        return $1.concat($4);
      }), o('INDENT ArgList OptComma OUTDENT', function() {
        return $2;
      }), o('ArgList OptComma INDENT ArgList OptComma OUTDENT', function() {
        return $1.concat($4);
      })
    ],
    Arg: [o('Expression'), o('Splat')],
    SimpleArgs: [
      o('Expression'), o('SimpleArgs , Expression', function() {
        return [].concat($1, $3);
      })
    ],
    Try: [
      o('TRY Block', function() {
        return new Try($2);
      }), o('TRY Block Catch', function() {
        return new Try($2, $3[0], $3[1]);
      }), o('TRY Block FINALLY Block', function() {
        return new Try($2, null, null, $4);
      }), o('TRY Block Catch FINALLY Block', function() {
        return new Try($2, $3[0], $3[1], $5);
      })
    ],
    Catch: [
      o('CATCH Identifier Block', function() {
        return [$2, $3];
      })
    ],
    Throw: [
      o('THROW Expression', function() {
        return new Throw($2);
      })
    ],
    Parenthetical: [
      o('( Body )', function() {
        return new Parens($2);
      }), o('( INDENT Body OUTDENT )', function() {
        return new Parens($3);
      })
    ],
    WhileSource: [
      o('WHILE Expression', function() {
        return new While($2);
      }), o('WHILE Expression WHEN Expression', function() {
        return new While($2, {
          guard: $4
        });
      }), o('UNTIL Expression', function() {
        return new While($2, {
          invert: true
        });
      }), o('UNTIL Expression WHEN Expression', function() {
        return new While($2, {
          invert: true,
          guard: $4
        });
      })
    ],
    While: [
      o('WhileSource Block', function() {
        return $1.addBody($2);
      }), o('Statement  WhileSource', function() {
        return $2.addBody(Block.wrap([$1]));
      }), o('Expression WhileSource', function() {
        return $2.addBody(Block.wrap([$1]));
      }), o('Loop', function() {
        return $1;
      })
    ],
    Loop: [
      o('LOOP Block', function() {
        return new While(new Literal('true')).addBody($2);
      }), o('LOOP Expression', function() {
        return new While(new Literal('true')).addBody(Block.wrap([$2]));
      })
    ],
    For: [
      o('Statement  ForBody', function() {
        return new For($1, $2);
      }), o('Expression ForBody', function() {
        return new For($1, $2);
      }), o('ForBody    Block', function() {
        return new For($2, $1);
      })
    ],
    ForBody: [
      o('FOR Range', function() {
        return {
          source: new Value($2)
        };
      }), o('ForStart ForSource', function() {
        $2.own = $1.own;
        $2.name = $1[0];
        $2.index = $1[1];
        return $2;
      })
    ],
    ForStart: [
      o('FOR ForVariables', function() {
        return $2;
      }), o('FOR OWN ForVariables', function() {
        $3.own = true;
        return $3;
      })
    ],
    ForValue: [
      o('Identifier'), o('Array', function() {
        return new Value($1);
      }), o('Object', function() {
        return new Value($1);
      })
    ],
    ForVariables: [
      o('ForValue', function() {
        return [$1];
      }), o('ForValue , ForValue', function() {
        return [$1, $3];
      })
    ],
    ForSource: [
      o('FORIN Expression', function() {
        return {
          source: $2
        };
      }), o('FOROF Expression', function() {
        return {
          source: $2,
          object: true
        };
      }), o('FORIN Expression WHEN Expression', function() {
        return {
          source: $2,
          guard: $4
        };
      }), o('FOROF Expression WHEN Expression', function() {
        return {
          source: $2,
          guard: $4,
          object: true
        };
      }), o('FORIN Expression BY Expression', function() {
        return {
          source: $2,
          step: $4
        };
      }), o('FORIN Expression WHEN Expression BY Expression', function() {
        return {
          source: $2,
          guard: $4,
          step: $6
        };
      }), o('FORIN Expression BY Expression WHEN Expression', function() {
        return {
          source: $2,
          step: $4,
          guard: $6
        };
      })
    ],
    Switch: [
      o('SWITCH Expression INDENT Whens OUTDENT', function() {
        return new Switch($2, $4);
      }), o('SWITCH Expression INDENT Whens ELSE Block OUTDENT', function() {
        return new Switch($2, $4, $6);
      }), o('SWITCH INDENT Whens OUTDENT', function() {
        return new Switch(null, $3);
      }), o('SWITCH INDENT Whens ELSE Block OUTDENT', function() {
        return new Switch(null, $3, $5);
      })
    ],
    Whens: [
      o('When'), o('Whens When', function() {
        return $1.concat($2);
      })
    ],
    When: [
      o('LEADING_WHEN SimpleArgs Block', function() {
        return [[$2, $3]];
      }), o('LEADING_WHEN SimpleArgs Block TERMINATOR', function() {
        return [[$2, $3]];
      })
    ],
    IfBlock: [
      o('IF Expression Block', function() {
        return new If($2, $3, {
          type: $1
        });
      }), o('IfBlock ELSE IF Expression Block', function() {
        return $1.addElse(new If($4, $5, {
          type: $3
        }));
      })
    ],
    If: [
      o('IfBlock'), o('IfBlock ELSE Block', function() {
        return $1.addElse($3);
      }), o('Statement  POST_IF Expression', function() {
        return new If($3, Block.wrap([$1]), {
          type: $2,
          statement: true
        });
      }), o('Expression POST_IF Expression', function() {
        return new If($3, Block.wrap([$1]), {
          type: $2,
          statement: true
        });
      })
    ],
    Operation: [
      o('UNARY Expression', function() {
        return new Op($1, $2);
      }), o('-     Expression', (function() {
        return new Op('-', $2);
      }), {
        prec: 'UNARY'
      }), o('+     Expression', (function() {
        return new Op('+', $2);
      }), {
        prec: 'UNARY'
      }), o('-- SimpleAssignable', function() {
        return new Op('--', $2);
      }), o('++ SimpleAssignable', function() {
        return new Op('++', $2);
      }), o('SimpleAssignable --', function() {
        return new Op('--', $1, null, true);
      }), o('SimpleAssignable ++', function() {
        return new Op('++', $1, null, true);
      }), o('Expression ?', function() {
        return new Existence($1);
      }), o('Expression +  Expression', function() {
        return new Op('+', $1, $3);
      }), o('Expression -  Expression', function() {
        return new Op('-', $1, $3);
      }), o('Expression MATH     Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression SHIFT    Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression COMPARE  Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression LOGIC    Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression RELATION Expression', function() {
        if ($2.charAt(0) === '!') {
          return new Op($2.slice(1), $1, $3).invert();
        } else {
          return new Op($2, $1, $3);
        }
      }), o('SimpleAssignable COMPOUND_ASSIGN\
       Expression', function() {
        return new Assign($1, $3, $2);
      }), o('SimpleAssignable COMPOUND_ASSIGN\
       INDENT Expression OUTDENT', function() {
        return new Assign($1, $4, $2);
      }), o('SimpleAssignable EXTENDS Expression', function() {
        return new Extends($1, $3);
      })
    ]
  };
  operators = [['left', '.', '?.', '::'], ['left', 'CALL_START', 'CALL_END'], ['nonassoc', '++', '--'], ['left', '?'], ['right', 'UNARY'], ['left', 'MATH'], ['left', '+', '-'], ['left', 'SHIFT'], ['left', 'RELATION'], ['left', 'COMPARE'], ['left', 'LOGIC'], ['nonassoc', 'INDENT', 'OUTDENT'], ['right', '=', ':', 'COMPOUND_ASSIGN', 'RETURN', 'THROW', 'EXTENDS'], ['right', 'FORIN', 'FOROF', 'BY', 'WHEN'], ['right', 'IF', 'ELSE', 'FOR', 'DO', 'WHILE', 'UNTIL', 'LOOP', 'SUPER', 'CLASS'], ['right', 'POST_IF']];
  tokens = [];
  for (name in grammar) {
    alternatives = grammar[name];
    grammar[name] = (function() {
      var _i, _j, _len, _len2, _ref, _results;
      _results = [];
      for (_i = 0, _len = alternatives.length; _i < _len; _i++) {
        alt = alternatives[_i];
        _ref = alt[0].split(' ');
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          token = _ref[_j];
          if (!grammar[token]) {
            tokens.push(token);
          }
        }
        if (name === 'Root') {
          alt[1] = "return " + alt[1];
        }
        _results.push(alt);
      }
      return _results;
    })();
  }
  exports.parser = new Parser({
    tokens: tokens.join(' '),
    bnf: grammar,
    operators: operators.reverse(),
    startSymbol: 'Root'
  });
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/grammar"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/helpers"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/helpers";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/helpers", path);
    };
    
    (function () {
        (function() {
  var extend, flatten;
  exports.starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
  };
  exports.ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };
  exports.compact = function(array) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      if (item) {
        _results.push(item);
      }
    }
    return _results;
  };
  exports.count = function(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
      return 1 / 0;
    }
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };
  exports.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };
  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  exports.flatten = flatten = function(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };
  exports.del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };
  exports.last = function(array, back) {
    return array[array.length - (back || 0) - 1];
  };
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/helpers"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/index"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/index";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/index", path);
    };
    
    (function () {
        (function() {
  var key, val, _ref;
  _ref = require('./coffee-script');
  for (key in _ref) {
    val = _ref[key];
    exports[key] = val;
  }
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/index"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/lexer"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/lexer";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/lexer", path);
    };
    
    (function () {
        (function() {
  var ASSIGNED, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HEREDOC, HEREDOC_INDENT, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDEXABLE, JSTOKEN, JS_FORBIDDEN, JS_KEYWORDS, LINE_BREAK, LINE_CONTINUER, LOGIC, Lexer, MATH, MULTILINER, MULTI_DENT, NOT_REGEX, NOT_SPACED_REGEX, NO_NEWLINE, NUMBER, OPERATOR, REGEX, RELATION, RESERVED, Rewriter, SHIFT, SIMPLESTR, TRAILING_SPACES, UNARY, WHITESPACE, compact, count, last, op, starts, _ref;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  Rewriter = require('./rewriter').Rewriter;
  _ref = require('./helpers'), count = _ref.count, starts = _ref.starts, compact = _ref.compact, last = _ref.last;
  exports.Lexer = Lexer = (function() {
    function Lexer() {}
    Lexer.prototype.tokenize = function(code, opts) {
      var i;
      if (opts == null) {
        opts = {};
      }
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      this.code = code;
      this.line = opts.line || 0;
      this.indent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.tokens = [];
      i = 0;
      while (this.chunk = code.slice(i)) {
        i += this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
      }
      this.closeIndentation();
      if (opts.rewrite === false) {
        return this.tokens;
      }
      return (new Rewriter).rewrite(this.tokens);
    };
    Lexer.prototype.identifierToken = function() {
      var colon, forcedIdentifier, id, input, match, prev, tag, _ref, _ref2;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      forcedIdentifier = colon || (prev = last(this.tokens)) && !prev.spaced && ((_ref = prev[0]) === '.' || _ref === '?.' || _ref === '@' || _ref === '::');
      tag = 'IDENTIFIER';
      if (__indexOf.call(JS_KEYWORDS, id) >= 0 || !forcedIdentifier && __indexOf.call(COFFEE_KEYWORDS, id) >= 0) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (_ref2 = this.tag(), __indexOf.call(LINE_BREAK, _ref2) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (__indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (__indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (__indexOf.call(RESERVED, id) >= 0) {
          this.identifierError(id);
        }
      }
      if (!forcedIdentifier) {
        if (COFFEE_ALIASES.hasOwnProperty(id)) {
          id = COFFEE_ALIASES[id];
        }
        tag = (function() {
          switch (id) {
            case '!':
              return 'UNARY';
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
            case 'null':
            case 'undefined':
              return 'BOOL';
            case 'break':
            case 'continue':
            case 'debugger':
              return 'STATEMENT';
            default:
              return tag;
          }
        })();
      }
      this.token(tag, id);
      if (colon) {
        this.token(':', ':');
      }
      return input.length;
    };
    Lexer.prototype.numberToken = function() {
      var match, number;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      this.token('NUMBER', number);
      return number.length;
    };
    Lexer.prototype.stringToken = function() {
      var match, string;
      switch (this.chunk.charAt(0)) {
        case "'":
          if (!(match = SIMPLESTR.exec(this.chunk))) {
            return 0;
          }
          this.token('STRING', (string = match[0]).replace(MULTILINER, '\\\n'));
          break;
        case '"':
          if (!(string = this.balancedString(this.chunk, '"'))) {
            return 0;
          }
          if (0 < string.indexOf('#{', 1)) {
            this.interpolateString(string.slice(1, -1));
          } else {
            this.token('STRING', this.escapeLines(string));
          }
          break;
        default:
          return 0;
      }
      this.line += count(string, '\n');
      return string.length;
    };
    Lexer.prototype.heredocToken = function() {
      var doc, heredoc, match, quote;
      if (!(match = HEREDOC.exec(this.chunk))) {
        return 0;
      }
      heredoc = match[0];
      quote = heredoc.charAt(0);
      doc = this.sanitizeHeredoc(match[2], {
        quote: quote,
        indent: null
      });
      if (quote === '"' && 0 <= doc.indexOf('#{')) {
        this.interpolateString(doc, {
          heredoc: true
        });
      } else {
        this.token('STRING', this.makeString(doc, quote, true));
      }
      this.line += count(heredoc, '\n');
      return heredoc.length;
    };
    Lexer.prototype.commentToken = function() {
      var comment, here, match;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], here = match[1];
      this.line += count(comment, '\n');
      if (here) {
        this.token('HERECOMMENT', this.sanitizeHeredoc(here, {
          herecomment: true,
          indent: Array(this.indent + 1).join(' ')
        }));
        this.token('TERMINATOR', '\n');
      }
      return comment.length;
    };
    Lexer.prototype.jsToken = function() {
      var match, script;
      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
        return 0;
      }
      this.token('JS', (script = match[0]).slice(1, -1));
      return script.length;
    };
    Lexer.prototype.regexToken = function() {
      var match, prev, regex, _ref;
      if (this.chunk.charAt(0) !== '/') {
        return 0;
      }
      if (match = HEREGEX.exec(this.chunk)) {
        return this.heregexToken(match);
      }
      prev = last(this.tokens);
      if (prev && (_ref = prev[0], __indexOf.call((prev.spaced ? NOT_REGEX : NOT_SPACED_REGEX), _ref) >= 0)) {
        return 0;
      }
      if (!(match = REGEX.exec(this.chunk))) {
        return 0;
      }
      regex = match[0];
      this.token('REGEX', regex === '//' ? '/(?:)/' : regex);
      return regex.length;
    };
    Lexer.prototype.heregexToken = function(match) {
      var body, flags, heregex, re, tag, tokens, value, _i, _len, _ref, _ref2, _ref3, _ref4;
      heregex = match[0], body = match[1], flags = match[2];
      if (0 > body.indexOf('#{')) {
        re = body.replace(HEREGEX_OMIT, '').replace(/\//g, '\\/');
        this.token('REGEX', "/" + (re || '(?:)') + "/" + flags);
        return heregex.length;
      }
      this.token('IDENTIFIER', 'RegExp');
      this.tokens.push(['CALL_START', '(']);
      tokens = [];
      _ref = this.interpolateString(body, {
        regex: true
      });
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], tag = _ref2[0], value = _ref2[1];
        if (tag === 'TOKENS') {
          tokens.push.apply(tokens, value);
        } else {
          if (!(value = value.replace(HEREGEX_OMIT, ''))) {
            continue;
          }
          value = value.replace(/\\/g, '\\\\');
          tokens.push(['STRING', this.makeString(value, '"', true)]);
        }
        tokens.push(['+', '+']);
      }
      tokens.pop();
      if (((_ref3 = tokens[0]) != null ? _ref3[0] : void 0) !== 'STRING') {
        this.tokens.push(['STRING', '""'], ['+', '+']);
      }
      (_ref4 = this.tokens).push.apply(_ref4, tokens);
      if (flags) {
        this.tokens.push([',', ','], ['STRING', '"' + flags + '"']);
      }
      this.token(')', ')');
      return heregex.length;
    };
    Lexer.prototype.lineToken = function() {
      var diff, indent, match, noNewlines, prev, size;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      this.line += count(indent, '\n');
      prev = last(this.tokens, 1);
      size = indent.length - 1 - indent.lastIndexOf('\n');
      noNewlines = this.unfinished();
      if (size - this.indebt === this.indent) {
        if (noNewlines) {
          this.suppressNewlines();
        } else {
          this.newlineToken();
        }
        return indent.length;
      }
      if (size > this.indent) {
        if (noNewlines) {
          this.indebt = size - this.indent;
          this.suppressNewlines();
          return indent.length;
        }
        diff = size - this.indent + this.outdebt;
        this.token('INDENT', diff);
        this.indents.push(diff);
        this.outdebt = this.indebt = 0;
      } else {
        this.indebt = 0;
        this.outdentToken(this.indent - size, noNewlines);
      }
      this.indent = size;
      return indent.length;
    };
    Lexer.prototype.outdentToken = function(moveOut, noNewlines, close) {
      var dent, len;
      while (moveOut > 0) {
        len = this.indents.length - 1;
        if (this.indents[len] === void 0) {
          moveOut = 0;
        } else if (this.indents[len] === this.outdebt) {
          moveOut -= this.outdebt;
          this.outdebt = 0;
        } else if (this.indents[len] < this.outdebt) {
          this.outdebt -= this.indents[len];
          moveOut -= this.indents[len];
        } else {
          dent = this.indents.pop() - this.outdebt;
          moveOut -= dent;
          this.outdebt = 0;
          this.token('OUTDENT', dent);
        }
      }
      if (dent) {
        this.outdebt -= moveOut;
      }
      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
        this.token('TERMINATOR', '\n');
      }
      return this;
    };
    Lexer.prototype.whitespaceToken = function() {
      var match, nline, prev;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      prev = last(this.tokens);
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    };
    Lexer.prototype.newlineToken = function() {
      if (this.tag() !== 'TERMINATOR') {
        this.token('TERMINATOR', '\n');
      }
      return this;
    };
    Lexer.prototype.suppressNewlines = function() {
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    };
    Lexer.prototype.literalToken = function() {
      var match, prev, tag, value, _ref, _ref2, _ref3, _ref4;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref = prev[1], __indexOf.call(JS_FORBIDDEN, _ref) >= 0)) {
          this.assignmentError();
        }
        if ((_ref2 = prev[1]) === '||' || _ref2 === '&&') {
          prev[0] = 'COMPOUND_ASSIGN';
          prev[1] += '=';
          return value.length;
        }
      }
      if (value === ';') {
        tag = 'TERMINATOR';
      } else if (__indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
        tag = 'COMPOUND_ASSIGN';
      } else if (__indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (__indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
      } else if (__indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(' && (_ref3 = prev[0], __indexOf.call(CALLABLE, _ref3) >= 0)) {
          if (prev[0] === '?') {
            prev[0] = 'FUNC_EXIST';
          }
          tag = 'CALL_START';
        } else if (value === '[' && (_ref4 = prev[0], __indexOf.call(INDEXABLE, _ref4) >= 0)) {
          tag = 'INDEX_START';
          switch (prev[0]) {
            case '?':
              prev[0] = 'INDEX_SOAK';
              break;
            case '::':
              prev[0] = 'INDEX_PROTO';
          }
        }
      }
      this.token(tag, value);
      return value.length;
    };
    Lexer.prototype.sanitizeHeredoc = function(doc, options) {
      var attempt, herecomment, indent, match, _ref;
      indent = options.indent, herecomment = options.herecomment;
      if (herecomment && 0 > doc.indexOf('\n')) {
        return doc;
      }
      if (!herecomment) {
        while (match = HEREDOC_INDENT.exec(doc)) {
          attempt = match[1];
          if (indent === null || (0 < (_ref = attempt.length) && _ref < indent.length)) {
            indent = attempt;
          }
        }
      }
      if (indent) {
        doc = doc.replace(RegExp("\\n" + indent, "g"), '\n');
      }
      if (!herecomment) {
        doc = doc.replace(/^\n/, '');
      }
      return doc;
    };
    Lexer.prototype.tagParameters = function() {
      var i, stack, tok, tokens;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else {
              tok[0] = 'PARAM_START';
              return this;
            }
        }
      }
      return this;
    };
    Lexer.prototype.closeIndentation = function() {
      return this.outdentToken(this.indent);
    };
    Lexer.prototype.identifierError = function(word) {
      throw SyntaxError("Reserved word \"" + word + "\" on line " + (this.line + 1));
    };
    Lexer.prototype.assignmentError = function() {
      throw SyntaxError("Reserved word \"" + (this.value()) + "\" on line " + (this.line + 1) + " can't be assigned");
    };
    Lexer.prototype.balancedString = function(str, end) {
      var i, letter, prev, stack, _ref;
      stack = [end];
      for (i = 1, _ref = str.length; (1 <= _ref ? i < _ref : i > _ref); (1 <= _ref ? i += 1 : i -= 1)) {
        switch (letter = str.charAt(i)) {
          case '\\':
            i++;
            continue;
          case end:
            stack.pop();
            if (!stack.length) {
              return str.slice(0, i + 1);
            }
            end = stack[stack.length - 1];
            continue;
        }
        if (end === '}' && (letter === '"' || letter === "'")) {
          stack.push(end = letter);
        } else if (end === '}' && letter === '{') {
          stack.push(end = '}');
        } else if (end === '"' && prev === '#' && letter === '{') {
          stack.push(end = '}');
        }
        prev = letter;
      }
      throw new Error("missing " + (stack.pop()) + ", starting on line " + (this.line + 1));
    };
    Lexer.prototype.interpolateString = function(str, options) {
      var expr, heredoc, i, inner, interpolated, len, letter, nested, pi, regex, tag, tokens, value, _len, _ref, _ref2, _ref3;
      if (options == null) {
        options = {};
      }
      heredoc = options.heredoc, regex = options.regex;
      tokens = [];
      pi = 0;
      i = -1;
      while (letter = str.charAt(i += 1)) {
        if (letter === '\\') {
          i += 1;
          continue;
        }
        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
          continue;
        }
        if (pi < i) {
          tokens.push(['NEOSTRING', str.slice(pi, i)]);
        }
        inner = expr.slice(1, -1);
        if (inner.length) {
          nested = new Lexer().tokenize(inner, {
            line: this.line,
            rewrite: false
          });
          nested.pop();
          if (((_ref = nested[0]) != null ? _ref[0] : void 0) === 'TERMINATOR') {
            nested.shift();
          }
          if (len = nested.length) {
            if (len > 1) {
              nested.unshift(['(', '(']);
              nested.push([')', ')']);
            }
            tokens.push(['TOKENS', nested]);
          }
        }
        i += expr.length;
        pi = i + 1;
      }
      if ((i > pi && pi < str.length)) {
        tokens.push(['NEOSTRING', str.slice(pi)]);
      }
      if (regex) {
        return tokens;
      }
      if (!tokens.length) {
        return this.token('STRING', '""');
      }
      if (tokens[0][0] !== 'NEOSTRING') {
        tokens.unshift(['', '']);
      }
      if (interpolated = tokens.length > 1) {
        this.token('(', '(');
      }
      for (i = 0, _len = tokens.length; i < _len; i++) {
        _ref2 = tokens[i], tag = _ref2[0], value = _ref2[1];
        if (i) {
          this.token('+', '+');
        }
        if (tag === 'TOKENS') {
          (_ref3 = this.tokens).push.apply(_ref3, value);
        } else {
          this.token('STRING', this.makeString(value, '"', heredoc));
        }
      }
      if (interpolated) {
        this.token(')', ')');
      }
      return tokens;
    };
    Lexer.prototype.token = function(tag, value) {
      return this.tokens.push([tag, value, this.line]);
    };
    Lexer.prototype.tag = function(index, tag) {
      var tok;
      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
    };
    Lexer.prototype.value = function(index, val) {
      var tok;
      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
    };
    Lexer.prototype.unfinished = function() {
      var prev, value;
      return LINE_CONTINUER.test(this.chunk) || (prev = last(this.tokens, 1)) && prev[0] !== '.' && (value = this.value()) && !value.reserved && NO_NEWLINE.test(value) && !CODE.test(value) && !ASSIGNED.test(this.chunk);
    };
    Lexer.prototype.escapeLines = function(str, heredoc) {
      return str.replace(MULTILINER, heredoc ? '\\n' : '');
    };
    Lexer.prototype.makeString = function(body, quote, heredoc) {
      if (!body) {
        return quote + quote;
      }
      body = body.replace(/\\([\s\S])/g, function(match, contents) {
        if (contents === '\n' || contents === quote) {
          return contents;
        } else {
          return match;
        }
      });
      body = body.replace(RegExp("" + quote, "g"), '\\$&');
      return quote + this.escapeLines(body, heredoc) + quote;
    };
    return Lexer;
  })();
  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];
  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];
  for (op in COFFEE_ALIASES = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  }) {
    COFFEE_KEYWORDS.push(op);
  }
  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf'];
  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED);
  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS);
  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;
  NUMBER = /^0x[\da-f]+|^(?:\d+(\.\d+)?|\.\d+)(?:e[+-]?\d+)?/i;
  HEREDOC = /^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/;
  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/;
  WHITESPACE = /^[^\n\S]+/;
  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)?$)|^(?:\s*#(?!##[^#]).*)+/;
  CODE = /^[-=]>/;
  MULTI_DENT = /^(?:\n[^\n\S]*)+/;
  SIMPLESTR = /^'[^\\']*(?:\\.[^\\']*)*'/;
  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;
  REGEX = /^\/(?!\s)[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/;
  HEREGEX = /^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/;
  HEREGEX_OMIT = /\s+(?:#.*)?/g;
  MULTILINER = /\n/g;
  HEREDOC_INDENT = /\n+([^\n\S]*)/g;
  ASSIGNED = /^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/;
  LINE_CONTINUER = /^\s*(?:,|\??\.(?!\.)|::)/;
  TRAILING_SPACES = /\s+$/;
  NO_NEWLINE = /^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/;
  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|='];
  UNARY = ['!', '~', 'NEW', 'TYPEOF', 'DELETE', 'DO'];
  LOGIC = ['&&', '||', '&', '|', '^'];
  SHIFT = ['<<', '>>', '>>>'];
  COMPARE = ['==', '!=', '<', '>', '<=', '>='];
  MATH = ['*', '/', '%'];
  RELATION = ['IN', 'OF', 'INSTANCEOF'];
  BOOL = ['TRUE', 'FALSE', 'NULL', 'UNDEFINED'];
  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', '++', '--', ']'];
  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING');
  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER'];
  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL');
  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/lexer"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/nodes"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/nodes";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/nodes", path);
    };
    
    (function () {
        (function() {
  var Access, Arr, Assign, Base, Block, Call, Class, Closure, Code, Comment, Existence, Extends, For, IDENTIFIER, IS_STRING, If, In, Index, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, NEGATE, NO, Obj, Op, Param, Parens, Push, Range, Return, SIMPLENUM, Scope, Slice, Splat, Switch, TAB, THIS, TRAILING_WHITESPACE, Throw, Try, UTILITIES, Value, While, YES, compact, del, ends, extend, flatten, last, merge, multident, starts, unfoldSoak, utility, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Scope = require('./scope').Scope;
  _ref = require('./helpers'), compact = _ref.compact, flatten = _ref.flatten, extend = _ref.extend, merge = _ref.merge, del = _ref.del, starts = _ref.starts, ends = _ref.ends, last = _ref.last;
  exports.extend = extend;
  YES = function() {
    return true;
  };
  NO = function() {
    return false;
  };
  THIS = function() {
    return this;
  };
  NEGATE = function() {
    this.negated = !this.negated;
    return this;
  };
  exports.Base = Base = (function() {
    function Base() {}
    Base.prototype.compile = function(o, lvl) {
      var node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      if (o.level === LEVEL_TOP || !node.isStatement(o)) {
        return node.compileNode(o);
      } else {
        return node.compileClosure(o);
      }
    };
    Base.prototype.compileClosure = function(o) {
      if (this.jumps()) {
        throw SyntaxError('cannot use a pure statement in an expression.');
      }
      o.sharedScope = true;
      return Closure.wrap(this).compileNode(o);
    };
    Base.prototype.cache = function(o, level, reused) {
      var ref, sub;
      if (!this.isComplex()) {
        ref = level ? this.compile(o, level) : this;
        return [ref, ref];
      } else {
        ref = new Literal(reused || o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compile(o, level), ref.value];
        } else {
          return [sub, ref];
        }
      }
    };
    Base.prototype.compileLoopReference = function(o, name) {
      var src, tmp, _ref;
      src = tmp = this.compile(o, LEVEL_LIST);
      if (!((-Infinity < (_ref = +src) && _ref < Infinity) || IDENTIFIER.test(src) && o.scope.check(src, true))) {
        src = "" + (tmp = o.scope.freeVariable(name)) + " = " + src;
      }
      return [src, tmp];
    };
    Base.prototype.makeReturn = function() {
      return new Return(this);
    };
    Base.prototype.contains = function(pred) {
      var contains;
      contains = false;
      this.traverseChildren(false, function(node) {
        if (pred(node)) {
          contains = true;
          return false;
        }
      });
      return contains;
    };
    Base.prototype.containsType = function(type) {
      return this instanceof type || this.contains(function(node) {
        return node instanceof type;
      });
    };
    Base.prototype.lastNonComment = function(list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };
    Base.prototype.toString = function(idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    Base.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len2, _ref, _ref2;
      if (!this.children) {
        return this;
      }
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        if (this[attr]) {
          _ref2 = flatten([this[attr]]);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            child = _ref2[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };
    Base.prototype.traverseChildren = function(crossScope, func) {
      return this.eachChild(function(child) {
        if (func(child) === false) {
          return false;
        }
        return child.traverseChildren(crossScope, func);
      });
    };
    Base.prototype.invert = function() {
      return new Op('!', this);
    };
    Base.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };
    Base.prototype.children = [];
    Base.prototype.isStatement = NO;
    Base.prototype.jumps = NO;
    Base.prototype.isComplex = YES;
    Base.prototype.isChainable = NO;
    Base.prototype.isAssignable = NO;
    Base.prototype.unwrap = THIS;
    Base.prototype.unfoldSoak = NO;
    Base.prototype.assigns = NO;
    return Base;
  })();
  exports.Block = Block = (function() {
    __extends(Block, Base);
    function Block(nodes) {
      this.expressions = compact(flatten(nodes || []));
    }
    Block.prototype.children = ['expressions'];
    Block.prototype.push = function(node) {
      this.expressions.push(node);
      return this;
    };
    Block.prototype.pop = function() {
      return this.expressions.pop();
    };
    Block.prototype.unshift = function(node) {
      this.expressions.unshift(node);
      return this;
    };
    Block.prototype.unwrap = function() {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    };
    Block.prototype.isEmpty = function() {
      return !this.expressions.length;
    };
    Block.prototype.isStatement = function(o) {
      var exp, _i, _len, _ref;
      _ref = this.expressions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        exp = _ref[_i];
        if (exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    };
    Block.prototype.jumps = function(o) {
      var exp, _i, _len, _ref;
      _ref = this.expressions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        exp = _ref[_i];
        if (exp.jumps(o)) {
          return exp;
        }
      }
    };
    Block.prototype.makeReturn = function() {
      var expr, len;
      len = this.expressions.length;
      while (len--) {
        expr = this.expressions[len];
        if (!(expr instanceof Comment)) {
          this.expressions[len] = expr.makeReturn();
          if (expr instanceof Return && !expr.expression) {
            this.expressions.splice(len, 1);
          }
          break;
        }
      }
      return this;
    };
    Block.prototype.compile = function(o, level) {
      if (o == null) {
        o = {};
      }
      if (o.scope) {
        return Block.__super__.compile.call(this, o, level);
      } else {
        return this.compileRoot(o);
      }
    };
    Block.prototype.compileNode = function(o) {
      var code, codes, node, top, _i, _len, _ref;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      codes = [];
      _ref = this.expressions;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        node = node.unwrapAll();
        node = node.unfoldSoak(o) || node;
        if (top) {
          node.front = true;
          code = node.compile(o);
          codes.push(node.isStatement(o) ? code : this.tab + code + ';');
        } else {
          codes.push(node.compile(o, LEVEL_LIST));
        }
      }
      if (top) {
        return codes.join('\n');
      }
      code = codes.join(', ') || 'void 0';
      if (codes.length > 1 && o.level >= LEVEL_LIST) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Block.prototype.compileRoot = function(o) {
      var code;
      o.indent = this.tab = o.bare ? '' : TAB;
      o.scope = new Scope(null, this, null);
      o.level = LEVEL_TOP;
      code = this.compileWithDeclarations(o);
      code = code.replace(TRAILING_WHITESPACE, '');
      if (o.bare) {
        return code;
      } else {
        return "(function() {\n" + code + "\n}).call(this);\n";
      }
    };
    Block.prototype.compileWithDeclarations = function(o) {
      var code, exp, i, post, rest, scope, _len, _ref;
      code = post = '';
      _ref = this.expressions;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        exp = _ref[i];
        exp = exp.unwrap();
        if (!(exp instanceof Comment || exp instanceof Literal)) {
          break;
        }
      }
      o = merge(o, {
        level: LEVEL_TOP
      });
      if (i) {
        rest = this.expressions.splice(i, this.expressions.length);
        code = this.compileNode(o);
        this.expressions = rest;
      }
      post = this.compileNode(o);
      scope = o.scope;
      if (scope.expressions === this) {
        if (!o.globals && o.scope.hasDeclarations()) {
          code += "" + this.tab + "var " + (scope.declaredVariables().join(', ')) + ";\n";
        }
        if (scope.hasAssignments) {
          code += "" + this.tab + "var " + (multident(scope.assignedVariables().join(', '), this.tab)) + ";\n";
        }
      }
      return code + post;
    };
    Block.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };
    return Block;
  })();
  exports.Literal = Literal = (function() {
    __extends(Literal, Base);
    function Literal(value) {
      this.value = value;
    }
    Literal.prototype.makeReturn = function() {
      if (this.isStatement()) {
        return this;
      } else {
        return new Return(this);
      }
    };
    Literal.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };
    Literal.prototype.isStatement = function() {
      var _ref;
      return (_ref = this.value) === 'break' || _ref === 'continue' || _ref === 'debugger';
    };
    Literal.prototype.isComplex = NO;
    Literal.prototype.assigns = function(name) {
      return name === this.value;
    };
    Literal.prototype.jumps = function(o) {
      if (!this.isStatement()) {
        return false;
      }
      if (!(o && (o.loop || o.block && (this.value !== 'continue')))) {
        return this;
      } else {
        return false;
      }
    };
    Literal.prototype.compileNode = function(o) {
      var code;
      code = this.isUndefined ? o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0' : this.value.reserved ? "\"" + this.value + "\"" : this.value;
      if (this.isStatement()) {
        return "" + this.tab + code + ";";
      } else {
        return code;
      }
    };
    Literal.prototype.toString = function() {
      return ' "' + this.value + '"';
    };
    return Literal;
  })();
  exports.Return = Return = (function() {
    __extends(Return, Base);
    function Return(expr) {
      if (expr && !expr.unwrap().isUndefined) {
        this.expression = expr;
      }
    }
    Return.prototype.children = ['expression'];
    Return.prototype.isStatement = YES;
    Return.prototype.makeReturn = THIS;
    Return.prototype.jumps = THIS;
    Return.prototype.compile = function(o, level) {
      var expr, _ref;
      expr = (_ref = this.expression) != null ? _ref.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compile(o, level);
      } else {
        return Return.__super__.compile.call(this, o, level);
      }
    };
    Return.prototype.compileNode = function(o) {
      return this.tab + ("return" + (this.expression ? ' ' + this.expression.compile(o, LEVEL_PAREN) : '') + ";");
    };
    return Return;
  })();
  exports.Value = Value = (function() {
    __extends(Value, Base);
    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }
    Value.prototype.children = ['base', 'properties'];
    Value.prototype.push = function(prop) {
      this.properties.push(prop);
      return this;
    };
    Value.prototype.hasProperties = function() {
      return !!this.properties.length;
    };
    Value.prototype.isArray = function() {
      return !this.properties.length && this.base instanceof Arr;
    };
    Value.prototype.isComplex = function() {
      return this.hasProperties() || this.base.isComplex();
    };
    Value.prototype.isAssignable = function() {
      return this.hasProperties() || this.base.isAssignable();
    };
    Value.prototype.isSimpleNumber = function() {
      return this.base instanceof Literal && SIMPLENUM.test(this.base.value);
    };
    Value.prototype.isAtomic = function() {
      var node, _i, _len, _ref;
      _ref = this.properties.concat(this.base);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (node.soak || node instanceof Call) {
          return false;
        }
      }
      return true;
    };
    Value.prototype.isStatement = function(o) {
      return !this.properties.length && this.base.isStatement(o);
    };
    Value.prototype.assigns = function(name) {
      return !this.properties.length && this.base.assigns(name);
    };
    Value.prototype.jumps = function(o) {
      return !this.properties.length && this.base.jumps(o);
    };
    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };
    Value.prototype.isSplice = function() {
      return last(this.properties) instanceof Slice;
    };
    Value.prototype.makeReturn = function() {
      if (this.properties.length) {
        return Value.__super__.makeReturn.call(this);
      } else {
        return this.base.makeReturn();
      }
    };
    Value.prototype.unwrap = function() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };
    Value.prototype.cacheReference = function(o) {
      var base, bref, name, nref;
      name = last(this.properties);
      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
        return [this, this];
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.isComplex()) {
        bref = new Literal(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) {
        return [base, bref];
      }
      if (name.isComplex()) {
        nref = new Literal(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.push(name), new Value(bref || base.base, [nref || name])];
    };
    Value.prototype.compileNode = function(o) {
      var code, prop, props, _i, _len;
      this.base.front = this.front;
      props = this.properties;
      code = this.base.compile(o, props.length ? LEVEL_ACCESS : null);
      if (props[0] instanceof Access && this.isSimpleNumber()) {
        code = "(" + code + ")";
      }
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        prop = props[_i];
        code += prop.compile(o);
      }
      return code;
    };
    Value.prototype.unfoldSoak = function(o) {
      var fst, i, ifn, prop, ref, snd, _len, _ref;
      if (ifn = this.base.unfoldSoak(o)) {
        Array.prototype.push.apply(ifn.body.properties, this.properties);
        return ifn;
      }
      _ref = this.properties;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        prop = _ref[i];
        if (prop.soak) {
          prop.soak = false;
          fst = new Value(this.base, this.properties.slice(0, i));
          snd = new Value(this.base, this.properties.slice(i));
          if (fst.isComplex()) {
            ref = new Literal(o.scope.freeVariable('ref'));
            fst = new Parens(new Assign(ref, fst));
            snd.base = ref;
          }
          return new If(new Existence(fst), snd, {
            soak: true
          });
        }
      }
      return null;
    };
    return Value;
  })();
  exports.Comment = Comment = (function() {
    __extends(Comment, Base);
    function Comment(comment) {
      this.comment = comment;
    }
    Comment.prototype.isStatement = YES;
    Comment.prototype.makeReturn = THIS;
    Comment.prototype.compileNode = function(o, level) {
      var code;
      code = '/*' + multident(this.comment, this.tab) + '*/';
      if ((level || o.level) === LEVEL_TOP) {
        code = o.indent + code;
      }
      return code;
    };
    return Comment;
  })();
  exports.Call = Call = (function() {
    __extends(Call, Base);
    function Call(variable, args, soak) {
      this.args = args != null ? args : [];
      this.soak = soak;
      this.isNew = false;
      this.isSuper = variable === 'super';
      this.variable = this.isSuper ? null : variable;
    }
    Call.prototype.children = ['variable', 'args'];
    Call.prototype.newInstance = function() {
      var base;
      base = this.variable.base || this.variable;
      if (base instanceof Call) {
        base.newInstance();
      } else {
        this.isNew = true;
      }
      return this;
    };
    Call.prototype.superReference = function(o) {
      var method, name;
      method = o.scope.method;
      if (!method) {
        throw SyntaxError('cannot call super outside of a function.');
      }
      name = method.name;
      if (!name) {
        throw SyntaxError('cannot call super on an anonymous function.');
      }
      if (method.klass) {
        return "" + method.klass + ".__super__." + name;
      } else {
        return "" + name + ".__super__.constructor";
      }
    };
    Call.prototype.unfoldSoak = function(o) {
      var call, ifn, left, list, rite, _i, _len, _ref, _ref2;
      if (this.soak) {
        if (this.variable) {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          _ref = new Value(this.variable).cacheReference(o), left = _ref[0], rite = _ref[1];
        } else {
          left = new Literal(this.superReference(o));
          rite = new Value(left);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal("typeof " + (left.compile(o)) + " == \"function\"");
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      _ref2 = list.reverse();
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        call = _ref2[_i];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    };
    Call.prototype.compileNode = function(o) {
      var arg, args, code, _ref;
      if ((_ref = this.variable) != null) {
        _ref.front = this.front;
      }
      if (code = Splat.compileSplattedArray(o, this.args, true)) {
        return this.compileSplat(o, code);
      }
      args = ((function() {
        var _i, _len, _ref, _results;
        _ref = this.args;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          arg = _ref[_i];
          _results.push(arg.compile(o, LEVEL_LIST));
        }
        return _results;
      }).call(this)).join(', ');
      if (this.isSuper) {
        return this.superReference(o) + (".call(this" + (args && ', ' + args) + ")");
      } else {
        return (this.isNew ? 'new ' : '') + this.variable.compile(o, LEVEL_ACCESS) + ("(" + args + ")");
      }
    };
    Call.prototype.compileSuper = function(args, o) {
      return "" + (this.superReference(o)) + ".call(this" + (args.length ? ', ' : '') + args + ")";
    };
    Call.prototype.compileSplat = function(o, splatArgs) {
      var base, fun, idt, name, ref;
      if (this.isSuper) {
        return "" + (this.superReference(o)) + ".apply(this, " + splatArgs + ")";
      }
      if (this.isNew) {
        idt = this.tab + TAB;
        return "(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return typeof result == \"object\" ? result : child;\n" + this.tab + "})(" + (this.variable.compile(o, LEVEL_LIST)) + ", " + splatArgs + ", function() {})";
      }
      base = new Value(this.variable);
      if ((name = base.properties.pop()) && base.isComplex()) {
        ref = o.scope.freeVariable('ref');
        fun = "(" + ref + " = " + (base.compile(o, LEVEL_LIST)) + ")" + (name.compile(o));
      } else {
        fun = base.compile(o, LEVEL_ACCESS);
        if (SIMPLENUM.test(fun)) {
          fun = "(" + fun + ")";
        }
        if (name) {
          ref = fun;
          fun += name.compile(o);
        } else {
          ref = 'null';
        }
      }
      return "" + fun + ".apply(" + ref + ", " + splatArgs + ")";
    };
    return Call;
  })();
  exports.Extends = Extends = (function() {
    __extends(Extends, Base);
    function Extends(child, parent) {
      this.child = child;
      this.parent = parent;
    }
    Extends.prototype.children = ['child', 'parent'];
    Extends.prototype.compile = function(o) {
      utility('hasProp');
      return new Call(new Value(new Literal(utility('extends'))), [this.child, this.parent]).compile(o);
    };
    return Extends;
  })();
  exports.Access = Access = (function() {
    __extends(Access, Base);
    function Access(name, tag) {
      this.name = name;
      this.name.asKey = true;
      this.proto = tag === 'proto' ? '.prototype' : '';
      this.soak = tag === 'soak';
    }
    Access.prototype.children = ['name'];
    Access.prototype.compile = function(o) {
      var name;
      name = this.name.compile(o);
      return this.proto + (IS_STRING.test(name) ? "[" + name + "]" : "." + name);
    };
    Access.prototype.isComplex = NO;
    return Access;
  })();
  exports.Index = Index = (function() {
    __extends(Index, Base);
    function Index(index) {
      this.index = index;
    }
    Index.prototype.children = ['index'];
    Index.prototype.compile = function(o) {
      return (this.proto ? '.prototype' : '') + ("[" + (this.index.compile(o, LEVEL_PAREN)) + "]");
    };
    Index.prototype.isComplex = function() {
      return this.index.isComplex();
    };
    return Index;
  })();
  exports.Range = Range = (function() {
    __extends(Range, Base);
    Range.prototype.children = ['from', 'to'];
    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }
    Range.prototype.compileVariables = function(o) {
      var parts, _ref, _ref2, _ref3;
      o = merge(o, {
        top: true
      });
      _ref = this.from.cache(o, LEVEL_LIST), this.from = _ref[0], this.fromVar = _ref[1];
      _ref2 = this.to.cache(o, LEVEL_LIST), this.to = _ref2[0], this.toVar = _ref2[1];
      _ref3 = [this.fromVar.match(SIMPLENUM), this.toVar.match(SIMPLENUM)], this.fromNum = _ref3[0], this.toNum = _ref3[1];
      parts = [];
      if (this.from !== this.fromVar) {
        parts.push(this.from);
      }
      if (this.to !== this.toVar) {
        return parts.push(this.to);
      }
    };
    Range.prototype.compileNode = function(o) {
      var compare, idx, incr, intro, step, stepPart, vars;
      this.compileVariables(o);
      if (!o.index) {
        return this.compileArray(o);
      }
      if (this.fromNum && this.toNum) {
        return this.compileSimple(o);
      }
      idx = del(o, 'index');
      step = del(o, 'step');
      vars = ("" + idx + " = " + this.from) + (this.to !== this.toVar ? ", " + this.to : '');
      intro = "(" + this.fromVar + " <= " + this.toVar + " ? " + idx;
      compare = "" + intro + " <" + this.equals + " " + this.toVar + " : " + idx + " >" + this.equals + " " + this.toVar + ")";
      stepPart = step ? step.compile(o) : '1';
      incr = step ? "" + idx + " += " + stepPart : "" + intro + " += " + stepPart + " : " + idx + " -= " + stepPart + ")";
      return "" + vars + "; " + compare + "; " + incr;
    };
    Range.prototype.compileSimple = function(o) {
      var from, idx, step, to, _ref;
      _ref = [+this.fromNum, +this.toNum], from = _ref[0], to = _ref[1];
      idx = del(o, 'index');
      step = del(o, 'step');
      step && (step = "" + idx + " += " + (step.compile(o)));
      if (from <= to) {
        return "" + idx + " = " + from + "; " + idx + " <" + this.equals + " " + to + "; " + (step || ("" + idx + "++"));
      } else {
        return "" + idx + " = " + from + "; " + idx + " >" + this.equals + " " + to + "; " + (step || ("" + idx + "--"));
      }
    };
    Range.prototype.compileArray = function(o) {
      var body, clause, i, idt, post, pre, range, result, vars, _i, _ref, _ref2, _results;
      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = (function() {
          _results = [];
          for (var _i = _ref = +this.fromNum, _ref2 = +this.toNum; _ref <= _ref2 ? _i <= _ref2 : _i >= _ref2; _ref <= _ref2 ? _i += 1 : _i -= 1){ _results.push(_i); }
          return _results;
        }).apply(this, arguments);
        if (this.exclusive) {
          range.pop();
        }
        return "[" + (range.join(', ')) + "]";
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i');
      result = o.scope.freeVariable('results');
      pre = "\n" + idt + result + " = [];";
      if (this.fromNum && this.toNum) {
        o.index = i;
        body = this.compileSimple(o);
      } else {
        vars = ("" + i + " = " + this.from) + (this.to !== this.toVar ? ", " + this.to : '');
        clause = "" + this.fromVar + " <= " + this.toVar + " ?";
        body = "var " + vars + "; " + clause + " " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + clause + " " + i + " += 1 : " + i + " -= 1";
      }
      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
      return "(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this, arguments)";
    };
    return Range;
  })();
  exports.Slice = Slice = (function() {
    __extends(Slice, Base);
    Slice.prototype.children = ['range'];
    function Slice(range) {
      this.range = range;
      Slice.__super__.constructor.call(this);
    }
    Slice.prototype.compileNode = function(o) {
      var compiled, from, fromStr, to, toStr, _ref;
      _ref = this.range, to = _ref.to, from = _ref.from;
      fromStr = from && from.compile(o, LEVEL_PAREN) || '0';
      compiled = to && to.compile(o, LEVEL_PAREN);
      if (to && !(!this.range.exclusive && +compiled === -1)) {
        toStr = ', ' + (this.range.exclusive ? compiled : SIMPLENUM.test(compiled) ? (+compiled + 1).toString() : "(" + compiled + " + 1) || 9e9");
      }
      return ".slice(" + fromStr + (toStr || '') + ")";
    };
    return Slice;
  })();
  exports.Obj = Obj = (function() {
    __extends(Obj, Base);
    function Obj(props, generated) {
      this.generated = generated != null ? generated : false;
      this.objects = this.properties = props || [];
    }
    Obj.prototype.children = ['properties'];
    Obj.prototype.compileNode = function(o) {
      var i, idt, indent, join, lastNoncom, obj, prop, props;
      props = this.properties;
      if (!props.length) {
        if (this.front) {
          return '({})';
        } else {
          return '{}';
        }
      }
      idt = o.indent += TAB;
      lastNoncom = this.lastNonComment(this.properties);
      props = (function() {
        var _len, _results;
        _results = [];
        for (i = 0, _len = props.length; i < _len; i++) {
          prop = props[i];
          join = i === props.length - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
          indent = prop instanceof Comment ? '' : idt;
          if (prop instanceof Value && prop["this"]) {
            prop = new Assign(prop.properties[0].name, prop, 'object');
          }
          if (!(prop instanceof Comment)) {
            if (!(prop instanceof Assign)) {
              prop = new Assign(prop, prop, 'object');
            }
            (prop.variable.base || prop.variable).asKey = true;
          }
          _results.push(indent + prop.compile(o, LEVEL_TOP) + join);
        }
        return _results;
      })();
      props = props.join('');
      obj = "{" + (props && '\n' + props + '\n' + this.tab) + "}";
      if (this.front) {
        return "(" + obj + ")";
      } else {
        return obj;
      }
    };
    Obj.prototype.assigns = function(name) {
      var prop, _i, _len, _ref;
      _ref = this.properties;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        prop = _ref[_i];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Obj;
  })();
  exports.Arr = Arr = (function() {
    __extends(Arr, Base);
    function Arr(objs) {
      this.objects = objs || [];
    }
    Arr.prototype.children = ['objects'];
    Arr.prototype.compileNode = function(o) {
      var code, obj;
      if (!this.objects.length) {
        return '[]';
      }
      o.indent += TAB;
      if (code = Splat.compileSplattedArray(o, this.objects)) {
        return code;
      }
      code = ((function() {
        var _i, _len, _ref, _results;
        _ref = this.objects;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          _results.push(obj.compile(o, LEVEL_LIST));
        }
        return _results;
      }).call(this)).join(', ');
      if (code.indexOf('\n') >= 0) {
        return "[\n" + o.indent + code + "\n" + this.tab + "]";
      } else {
        return "[" + code + "]";
      }
    };
    Arr.prototype.assigns = function(name) {
      var obj, _i, _len, _ref;
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Arr;
  })();
  exports.Class = Class = (function() {
    __extends(Class, Base);
    function Class(variable, parent, body) {
      this.variable = variable;
      this.parent = parent;
      this.body = body != null ? body : new Block;
      this.boundFuncs = [];
      this.body.classBody = true;
    }
    Class.prototype.children = ['variable', 'parent', 'body'];
    Class.prototype.determineName = function() {
      var decl, tail;
      if (!this.variable) {
        return null;
      }
      decl = (tail = last(this.variable.properties)) ? tail instanceof Access && tail.name.value : this.variable.base.value;
      return decl && (decl = IDENTIFIER.test(decl) && decl);
    };
    Class.prototype.setContext = function(name) {
      return this.body.traverseChildren(false, function(node) {
        if (node.classBody) {
          return false;
        }
        if (node instanceof Literal && node.value === 'this') {
          return node.value = name;
        } else if (node instanceof Code) {
          node.klass = name;
          if (node.bound) {
            return node.context = name;
          }
        }
      });
    };
    Class.prototype.addBoundFunctions = function(o) {
      var bname, bvar, _i, _len, _ref, _results;
      if (this.boundFuncs.length) {
        _ref = this.boundFuncs;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bvar = _ref[_i];
          bname = bvar.compile(o);
          _results.push(this.ctor.body.unshift(new Literal("this." + bname + " = " + (utility('bind')) + "(this." + bname + ", this);")));
        }
        return _results;
      }
    };
    Class.prototype.addProperties = function(node, name) {
      var assign, base, func, props, _results;
      props = node.base.properties.slice(0);
      _results = [];
      while (assign = props.shift()) {
        if (assign instanceof Assign) {
          base = assign.variable.base;
          delete assign.context;
          func = assign.value;
          if (base.value === 'constructor') {
            if (this.ctor) {
              throw new Error('cannot define more than one constructor in a class');
            }
            if (func.bound) {
              throw new Error('cannot define a constructor as a bound function');
            }
            if (func instanceof Code) {
              assign = this.ctor = func;
            } else {
              assign = this.ctor = new Assign(new Value(new Literal(name)), func);
            }
          } else {
            if (!assign.variable["this"]) {
              assign.variable = new Value(new Literal(name), [new Access(base, 'proto')]);
            }
            if (func instanceof Code && func.bound) {
              this.boundFuncs.push(base);
              func.bound = false;
            }
          }
        }
        _results.push(assign);
      }
      return _results;
    };
    Class.prototype.walkBody = function(name) {
      return this.traverseChildren(false, __bind(function(child) {
        var exps, i, node, _len, _ref;
        if (child instanceof Class) {
          return false;
        }
        if (child instanceof Block) {
          _ref = exps = child.expressions;
          for (i = 0, _len = _ref.length; i < _len; i++) {
            node = _ref[i];
            if (node instanceof Value && node.isObject(true)) {
              exps[i] = this.addProperties(node, name);
            }
          }
          return child.expressions = exps = flatten(exps);
        }
      }, this));
    };
    Class.prototype.ensureConstructor = function(name) {
      if (!this.ctor) {
        this.ctor = new Code;
        if (this.parent) {
          this.ctor.body.push(new Call('super', [new Splat(new Literal('arguments'))]));
        }
        this.body.expressions.unshift(this.ctor);
      }
      this.ctor.ctor = this.ctor.name = name;
      this.ctor.klass = null;
      return this.ctor.noReturn = true;
    };
    Class.prototype.compileNode = function(o) {
      var decl, klass, lname, name;
      decl = this.determineName();
      name = decl || this.name || '_Class';
      lname = new Literal(name);
      this.setContext(name);
      this.walkBody(name);
      if (this.parent) {
        this.body.expressions.unshift(new Extends(lname, this.parent));
      }
      this.ensureConstructor(name);
      this.body.expressions.push(lname);
      this.addBoundFunctions(o);
      klass = new Parens(Closure.wrap(this.body), true);
      if (this.variable) {
        klass = new Assign(this.variable, klass);
      }
      return klass.compile(o);
    };
    return Class;
  })();
  exports.Assign = Assign = (function() {
    __extends(Assign, Base);
    function Assign(variable, value, context, options) {
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
    }
    Assign.prototype.METHOD_DEF = /^(?:(\S+)\.prototype\.|\S+?)?\b([$A-Za-z_][$\w\x7f-\uffff]*)$/;
    Assign.prototype.children = ['variable', 'value'];
    Assign.prototype.assigns = function(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };
    Assign.prototype.unfoldSoak = function(o) {
      return unfoldSoak(o, this, 'variable');
    };
    Assign.prototype.compileNode = function(o) {
      var isValue, match, name, val, _ref;
      if (isValue = this.variable instanceof Value) {
        if (this.variable.isArray() || this.variable.isObject()) {
          return this.compilePatternMatch(o);
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if ((_ref = this.context) === '||=' || _ref === '&&=' || _ref === '?=') {
          return this.compileConditional(o);
        }
      }
      name = this.variable.compile(o, LEVEL_LIST);
      if (this.value instanceof Code && (match = this.METHOD_DEF.exec(name))) {
        this.value.name = match[2];
        if (match[1]) {
          this.value.klass = match[1];
        }
      }
      val = this.value.compile(o, LEVEL_LIST);
      if (this.context === 'object') {
        return "" + name + ": " + val;
      }
      if (!this.variable.isAssignable()) {
        throw SyntaxError("\"" + (this.variable.compile(o)) + "\" cannot be assigned.");
      }
      if (!(this.context || isValue && (this.variable.namespaced || this.variable.hasProperties()))) {
        if (this.param) {
          o.scope.add(name, 'var');
        } else {
          o.scope.find(name);
        }
      }
      val = name + (" " + (this.context || '=') + " ") + val;
      if (o.level <= LEVEL_LIST) {
        return val;
      } else {
        return "(" + val + ")";
      }
    };
    Assign.prototype.compilePatternMatch = function(o) {
      var acc, assigns, code, i, idx, isObject, ivar, obj, objects, olen, ref, rest, splat, top, val, value, vvar, _len, _ref, _ref2, _ref3, _ref4;
      top = o.level === LEVEL_TOP;
      value = this.value;
      objects = this.variable.base.objects;
      if (!(olen = objects.length)) {
        if (top) {
          return false;
        }
        code = value.compile(o);
        if (o.level >= LEVEL_OP) {
          return "(" + code + ")";
        } else {
          return code;
        }
      }
      isObject = this.variable.isObject();
      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
        if (obj instanceof Assign) {
          _ref = obj, idx = _ref.variable.base, obj = _ref.value;
        } else {
          if (obj.base instanceof Parens) {
            _ref2 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref2[0], idx = _ref2[1];
          } else {
            idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
          }
        }
        acc = IDENTIFIER.test(idx.unwrap().value || 0);
        value = new Value(value);
        value.properties.push(new (acc ? Access : Index)(idx));
        return new Assign(obj, value).compile(o);
      }
      vvar = value.compile(o, LEVEL_LIST);
      assigns = [];
      splat = false;
      if (!IDENTIFIER.test(vvar) || this.variable.assigns(vvar)) {
        assigns.push("" + (ref = o.scope.freeVariable('ref')) + " = " + vvar);
        vvar = ref;
      }
      for (i = 0, _len = objects.length; i < _len; i++) {
        obj = objects[i];
        idx = i;
        if (isObject) {
          if (obj instanceof Assign) {
            _ref3 = obj, idx = _ref3.variable.base, obj = _ref3.value;
          } else {
            if (obj.base instanceof Parens) {
              _ref4 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref4[0], idx = _ref4[1];
            } else {
              idx = obj["this"] ? obj.properties[0].name : obj;
            }
          }
        }
        if (!splat && obj instanceof Splat) {
          val = "" + olen + " <= " + vvar + ".length ? " + (utility('slice')) + ".call(" + vvar + ", " + i;
          if (rest = olen - i - 1) {
            ivar = o.scope.freeVariable('i');
            val += ", " + ivar + " = " + vvar + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
          } else {
            val += ") : []";
          }
          val = new Literal(val);
          splat = "" + ivar + "++";
        } else {
          if (obj instanceof Splat) {
            obj = obj.name.compile(o);
            throw SyntaxError("multiple splats are disallowed in an assignment: " + obj + " ...");
          }
          if (typeof idx === 'number') {
            idx = new Literal(splat || idx);
            acc = false;
          } else {
            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
          }
          val = new Value(new Literal(vvar), [new (acc ? Access : Index)(idx)]);
        }
        assigns.push(new Assign(obj, val, null, {
          param: this.param
        }).compile(o, LEVEL_TOP));
      }
      if (!top) {
        assigns.push(vvar);
      }
      code = (compact(assigns)).join(', ');
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Assign.prototype.compileConditional = function(o) {
      var left, rite, _ref;
      _ref = this.variable.cacheReference(o), left = _ref[0], rite = _ref[1];
      return new Op(this.context.slice(0, -1), left, new Assign(rite, this.value, '=')).compile(o);
    };
    Assign.prototype.compileSplice = function(o) {
      var code, exclusive, from, fromDecl, fromRef, name, to, valDef, valRef, _ref, _ref2, _ref3;
      _ref = this.variable.properties.pop().range, from = _ref.from, to = _ref.to, exclusive = _ref.exclusive;
      name = this.variable.compile(o);
      _ref2 = (from != null ? from.cache(o, LEVEL_OP) : void 0) || ['0', '0'], fromDecl = _ref2[0], fromRef = _ref2[1];
      if (to) {
        if ((from != null ? from.isSimpleNumber() : void 0) && to.isSimpleNumber()) {
          to = +to.compile(o) - +fromRef;
          if (!exclusive) {
            to += 1;
          }
        } else {
          to = to.compile(o) + ' - ' + fromRef;
          if (!exclusive) {
            to += ' + 1';
          }
        }
      } else {
        to = "9e9";
      }
      _ref3 = this.value.cache(o, LEVEL_LIST), valDef = _ref3[0], valRef = _ref3[1];
      code = "[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat(" + valDef + ")), " + valRef;
      if (o.level > LEVEL_TOP) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    return Assign;
  })();
  exports.Code = Code = (function() {
    __extends(Code, Base);
    function Code(params, body, tag) {
      this.params = params || [];
      this.body = body || new Block;
      this.bound = tag === 'boundfunc';
      if (this.bound) {
        this.context = 'this';
      }
    }
    Code.prototype.children = ['params', 'body'];
    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };
    Code.prototype.jumps = NO;
    Code.prototype.compileNode = function(o) {
      var code, exprs, i, idt, lit, p, param, ref, splats, v, val, vars, wasEmpty, _i, _j, _len, _len2, _len3, _ref, _ref2, _ref3;
      o.scope = new Scope(o.scope, this.body, this);
      o.scope.shared = del(o, 'sharedScope');
      o.indent += TAB;
      delete o.bare;
      delete o.globals;
      vars = [];
      exprs = [];
      _ref = this.params;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        param = _ref[_i];
        if (param.splat) {
          splats = new Assign(new Value(new Arr((function() {
            var _i, _len, _ref, _results;
            _ref = this.params;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              p = _ref[_i];
              _results.push(p.asReference(o));
            }
            return _results;
          }).call(this))), new Value(new Literal('arguments')));
          break;
        }
      }
      _ref2 = this.params;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        param = _ref2[_j];
        if (param.isComplex()) {
          val = ref = param.asReference(o);
          if (param.value) {
            val = new Op('?', ref, param.value);
          }
          exprs.push(new Assign(new Value(param.name), val, '=', {
            param: true
          }));
        } else {
          ref = param;
          if (param.value) {
            lit = new Literal(ref.name.value + ' == null');
            val = new Assign(new Value(param.name), param.value, '=');
            exprs.push(new If(lit, val));
          }
        }
        if (!splats) {
          vars.push(ref);
        }
      }
      wasEmpty = this.body.isEmpty();
      if (splats) {
        exprs.unshift(splats);
      }
      if (exprs.length) {
        (_ref3 = this.body.expressions).unshift.apply(_ref3, exprs);
      }
      if (!splats) {
        for (i = 0, _len3 = vars.length; i < _len3; i++) {
          v = vars[i];
          o.scope.parameter(vars[i] = v.compile(o));
        }
      }
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      idt = o.indent;
      code = 'function';
      if (this.ctor) {
        code += ' ' + this.name;
      }
      code += '(' + vars.join(', ') + ') {';
      if (!this.body.isEmpty()) {
        code += "\n" + (this.body.compileWithDeclarations(o)) + "\n" + this.tab;
      }
      code += '}';
      if (this.ctor) {
        return this.tab + code;
      }
      if (this.bound) {
        return utility('bind') + ("(" + code + ", " + this.context + ")");
      }
      if (this.front || (o.level >= LEVEL_ACCESS)) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };
    return Code;
  })();
  exports.Param = Param = (function() {
    __extends(Param, Base);
    function Param(name, value, splat) {
      this.name = name;
      this.value = value;
      this.splat = splat;
    }
    Param.prototype.children = ['name', 'value'];
    Param.prototype.compile = function(o) {
      return this.name.compile(o, LEVEL_LIST);
    };
    Param.prototype.asReference = function(o) {
      var node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node["this"]) {
        node = node.properties[0].name;
        if (node.value.reserved) {
          node = new Literal('_' + node.value);
        }
      } else if (node.isComplex()) {
        node = new Literal(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      if (this.splat) {
        node = new Splat(node);
      }
      return this.reference = node;
    };
    Param.prototype.isComplex = function() {
      return this.name.isComplex();
    };
    return Param;
  })();
  exports.Splat = Splat = (function() {
    __extends(Splat, Base);
    Splat.prototype.children = ['name'];
    Splat.prototype.isAssignable = YES;
    function Splat(name) {
      this.name = name.compile ? name : new Literal(name);
    }
    Splat.prototype.assigns = function(name) {
      return this.name.assigns(name);
    };
    Splat.prototype.compile = function(o) {
      if (this.index != null) {
        return this.compileParam(o);
      } else {
        return this.name.compile(o);
      }
    };
    Splat.compileSplattedArray = function(o, list, apply) {
      var args, base, code, i, index, node, _len;
      index = -1;
      while ((node = list[++index]) && !(node instanceof Splat)) {
        continue;
      }
      if (index >= list.length) {
        return '';
      }
      if (list.length === 1) {
        code = list[0].compile(o, LEVEL_LIST);
        if (apply) {
          return code;
        }
        return "" + (utility('slice')) + ".call(" + code + ")";
      }
      args = list.slice(index);
      for (i = 0, _len = args.length; i < _len; i++) {
        node = args[i];
        code = node.compile(o, LEVEL_LIST);
        args[i] = node instanceof Splat ? "" + (utility('slice')) + ".call(" + code + ")" : "[" + code + "]";
      }
      if (index === 0) {
        return args[0] + (".concat(" + (args.slice(1).join(', ')) + ")");
      }
      base = (function() {
        var _i, _len, _ref, _results;
        _ref = list.slice(0, index);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push(node.compile(o, LEVEL_LIST));
        }
        return _results;
      })();
      return "[" + (base.join(', ')) + "].concat(" + (args.join(', ')) + ")";
    };
    return Splat;
  })();
  exports.While = While = (function() {
    __extends(While, Base);
    function While(condition, options) {
      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
      this.guard = options != null ? options.guard : void 0;
    }
    While.prototype.children = ['condition', 'guard', 'body'];
    While.prototype.isStatement = YES;
    While.prototype.makeReturn = function() {
      this.returns = true;
      return this;
    };
    While.prototype.addBody = function(body) {
      this.body = body;
      return this;
    };
    While.prototype.jumps = function() {
      var expressions, node, _i, _len;
      expressions = this.body.expressions;
      if (!expressions.length) {
        return false;
      }
      for (_i = 0, _len = expressions.length; _i < _len; _i++) {
        node = expressions[_i];
        if (node.jumps({
          loop: true
        })) {
          return node;
        }
      }
      return false;
    };
    While.prototype.compileNode = function(o) {
      var body, code, rvar, set;
      o.indent += TAB;
      set = '';
      body = this.body;
      if (body.isEmpty()) {
        body = '';
      } else {
        if (o.level > LEVEL_TOP || this.returns) {
          rvar = o.scope.freeVariable('results');
          set = "" + this.tab + rvar + " = [];\n";
          if (body) {
            body = Push.wrap(rvar, body);
          }
        }
        if (this.guard) {
          body = Block.wrap([new If(this.guard, body)]);
        }
        body = "\n" + (body.compile(o, LEVEL_TOP)) + "\n" + this.tab;
      }
      code = set + this.tab + ("while (" + (this.condition.compile(o, LEVEL_PAREN)) + ") {" + body + "}");
      if (this.returns) {
        code += "\n" + this.tab + "return " + rvar + ";";
      }
      return code;
    };
    return While;
  })();
  exports.Op = Op = (function() {
    var CONVERSIONS, INVERSIONS;
    __extends(Op, Base);
    function Op(op, first, second, flip) {
      if (op === 'in') {
        return new In(first, second);
      }
      if (op === 'do') {
        return new Call(first, first.params || []);
      }
      if (op === 'new') {
        if (first instanceof Call) {
          return first.newInstance();
        }
        if (first instanceof Code && first.bound) {
          first = new Parens(first);
        }
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }
    CONVERSIONS = {
      '==': '===',
      '!=': '!==',
      'of': 'in'
    };
    INVERSIONS = {
      '!==': '===',
      '===': '!=='
    };
    Op.prototype.children = ['first', 'second'];
    Op.prototype.isSimpleNumber = NO;
    Op.prototype.isUnary = function() {
      return !this.second;
    };
    Op.prototype.isChainable = function() {
      var _ref;
      return (_ref = this.operator) === '<' || _ref === '>' || _ref === '>=' || _ref === '<=' || _ref === '===' || _ref === '!==';
    };
    Op.prototype.invert = function() {
      var allInvertable, curr, fst, op, _ref;
      if (this.isChainable() && this.first.isChainable()) {
        allInvertable = true;
        curr = this;
        while (curr && curr.operator) {
          allInvertable && (allInvertable = curr.operator in INVERSIONS);
          curr = curr.first;
        }
        if (!allInvertable) {
          return new Parens(this).invert();
        }
        curr = this;
        while (curr && curr.operator) {
          curr.invert = !curr.invert;
          curr.operator = INVERSIONS[curr.operator];
          curr = curr.first;
        }
        return this;
      } else if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        if (this.first.unwrap() instanceof Op) {
          this.first.invert();
        }
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((_ref = fst.operator) === '!' || _ref === 'in' || _ref === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    };
    Op.prototype.unfoldSoak = function(o) {
      var _ref;
      return ((_ref = this.operator) === '++' || _ref === '--' || _ref === 'delete') && unfoldSoak(o, this, 'first');
    };
    Op.prototype.compileNode = function(o) {
      var code;
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (this.isChainable() && this.first.isChainable()) {
        return this.compileChain(o);
      }
      if (this.operator === '?') {
        return this.compileExistence(o);
      }
      this.first.front = this.front;
      code = this.first.compile(o, LEVEL_OP) + ' ' + this.operator + ' ' + this.second.compile(o, LEVEL_OP);
      if (o.level <= LEVEL_OP) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Op.prototype.compileChain = function(o) {
      var code, fst, shared, _ref;
      _ref = this.first.second.cache(o), this.first.second = _ref[0], shared = _ref[1];
      fst = this.first.compile(o, LEVEL_OP);
      code = "" + fst + " " + (this.invert ? '&&' : '||') + " " + (shared.compile(o)) + " " + this.operator + " " + (this.second.compile(o, LEVEL_OP));
      return "(" + code + ")";
    };
    Op.prototype.compileExistence = function(o) {
      var fst, ref;
      if (this.first.isComplex()) {
        ref = o.scope.freeVariable('ref');
        fst = new Parens(new Assign(new Literal(ref), this.first));
      } else {
        fst = this.first;
        ref = fst.compile(o);
      }
      return new Existence(fst).compile(o) + (" ? " + ref + " : " + (this.second.compile(o, LEVEL_LIST)));
    };
    Op.prototype.compileUnary = function(o) {
      var op, parts;
      parts = [op = this.operator];
      if ((op === 'new' || op === 'typeof' || op === 'delete') || (op === '+' || op === '-') && this.first instanceof Op && this.first.operator === op) {
        parts.push(' ');
      }
      parts.push(this.first.compile(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return parts.join('');
    };
    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };
    return Op;
  })();
  exports.In = In = (function() {
    __extends(In, Base);
    function In(object, array) {
      this.object = object;
      this.array = array;
    }
    In.prototype.children = ['object', 'array'];
    In.prototype.invert = NEGATE;
    In.prototype.compileNode = function(o) {
      if (this.array instanceof Value && this.array.isArray()) {
        return this.compileOrTest(o);
      } else {
        return this.compileLoopTest(o);
      }
    };
    In.prototype.compileOrTest = function(o) {
      var cmp, cnj, i, item, ref, sub, tests, _ref, _ref2;
      _ref = this.object.cache(o, LEVEL_OP), sub = _ref[0], ref = _ref[1];
      _ref2 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = _ref2[0], cnj = _ref2[1];
      tests = (function() {
        var _len, _ref, _results;
        _ref = this.array.base.objects;
        _results = [];
        for (i = 0, _len = _ref.length; i < _len; i++) {
          item = _ref[i];
          _results.push((i ? ref : sub) + cmp + item.compile(o, LEVEL_OP));
        }
        return _results;
      }).call(this);
      tests = tests.join(cnj);
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return "(" + tests + ")";
      }
    };
    In.prototype.compileLoopTest = function(o) {
      var code, ref, sub, _ref;
      _ref = this.object.cache(o, LEVEL_LIST), sub = _ref[0], ref = _ref[1];
      code = utility('indexOf') + (".call(" + (this.array.compile(o, LEVEL_LIST)) + ", " + ref + ") ") + (this.negated ? '< 0' : '>= 0');
      if (sub === ref) {
        return code;
      }
      code = sub + ', ' + code;
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    In.prototype.toString = function(idt) {
      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };
    return In;
  })();
  exports.Try = Try = (function() {
    __extends(Try, Base);
    function Try(attempt, error, recovery, ensure) {
      this.attempt = attempt;
      this.error = error;
      this.recovery = recovery;
      this.ensure = ensure;
    }
    Try.prototype.children = ['attempt', 'recovery', 'ensure'];
    Try.prototype.isStatement = YES;
    Try.prototype.jumps = function(o) {
      var _ref;
      return this.attempt.jumps(o) || ((_ref = this.recovery) != null ? _ref.jumps(o) : void 0);
    };
    Try.prototype.makeReturn = function() {
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn();
      }
      if (this.recovery) {
        this.recovery = this.recovery.makeReturn();
      }
      return this;
    };
    Try.prototype.compileNode = function(o) {
      var catchPart, errorPart;
      o.indent += TAB;
      errorPart = this.error ? " (" + (this.error.compile(o)) + ") " : ' ';
      catchPart = this.recovery ? " catch" + errorPart + "{\n" + (this.recovery.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" : !(this.ensure || this.recovery) ? ' catch (_e) {}' : void 0;
      return ("" + this.tab + "try {\n" + (this.attempt.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" + (catchPart || '')) + (this.ensure ? " finally {\n" + (this.ensure.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" : '');
    };
    return Try;
  })();
  exports.Throw = Throw = (function() {
    __extends(Throw, Base);
    function Throw(expression) {
      this.expression = expression;
    }
    Throw.prototype.children = ['expression'];
    Throw.prototype.isStatement = YES;
    Throw.prototype.jumps = NO;
    Throw.prototype.makeReturn = THIS;
    Throw.prototype.compileNode = function(o) {
      return this.tab + ("throw " + (this.expression.compile(o)) + ";");
    };
    return Throw;
  })();
  exports.Existence = Existence = (function() {
    __extends(Existence, Base);
    function Existence(expression) {
      this.expression = expression;
    }
    Existence.prototype.children = ['expression'];
    Existence.prototype.invert = NEGATE;
    Existence.prototype.compileNode = function(o) {
      var code, sym;
      code = this.expression.compile(o, LEVEL_OP);
      code = IDENTIFIER.test(code) && !o.scope.check(code) ? this.negated ? "typeof " + code + " == \"undefined\" || " + code + " === null" : "typeof " + code + " != \"undefined\" && " + code + " !== null" : (sym = this.negated ? '==' : '!=', "" + code + " " + sym + " null");
      if (o.level <= LEVEL_COND) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Existence;
  })();
  exports.Parens = Parens = (function() {
    __extends(Parens, Base);
    function Parens(body) {
      this.body = body;
    }
    Parens.prototype.children = ['body'];
    Parens.prototype.unwrap = function() {
      return this.body;
    };
    Parens.prototype.isComplex = function() {
      return this.body.isComplex();
    };
    Parens.prototype.makeReturn = function() {
      return this.body.makeReturn();
    };
    Parens.prototype.compileNode = function(o) {
      var bare, code, expr;
      expr = this.body.unwrap();
      if (expr instanceof Value && expr.isAtomic()) {
        expr.front = this.front;
        return expr.compile(o);
      }
      code = expr.compile(o, LEVEL_PAREN);
      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || (expr instanceof For && expr.returns));
      if (bare) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Parens;
  })();
  exports.For = For = (function() {
    __extends(For, Base);
    function For(body, source) {
      var _ref;
      this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
      this.body = Block.wrap([body]);
      this.own = !!source.own;
      this.object = !!source.object;
      if (this.object) {
        _ref = [this.index, this.name], this.name = _ref[0], this.index = _ref[1];
      }
      if (this.index instanceof Value) {
        throw SyntaxError('index cannot be a pattern matching expression');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
      this.pattern = this.name instanceof Value;
      if (this.range && this.index) {
        throw SyntaxError('indexes do not apply to range loops');
      }
      if (this.range && this.pattern) {
        throw SyntaxError('cannot pattern match over range loops');
      }
      this.returns = false;
    }
    For.prototype.children = ['body', 'source', 'guard', 'step'];
    For.prototype.isStatement = YES;
    For.prototype.jumps = While.prototype.jumps;
    For.prototype.makeReturn = function() {
      this.returns = true;
      return this;
    };
    For.prototype.compileNode = function(o) {
      var body, defPart, forPart, guardPart, idt1, index, ivar, lastJumps, lvar, name, namePart, ref, resultPart, returnResult, rvar, scope, source, stepPart, svar, varPart, _ref;
      body = Block.wrap([this.body]);
      lastJumps = (_ref = last(body.expressions)) != null ? _ref.jumps() : void 0;
      if (lastJumps && lastJumps instanceof Return) {
        this.returns = false;
      }
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      name = this.name && this.name.compile(o, LEVEL_LIST);
      index = this.index && this.index.compile(o, LEVEL_LIST);
      if (name && !this.pattern) {
        scope.find(name, {
          immediate: true
        });
      }
      if (index) {
        scope.find(index, {
          immediate: true
        });
      }
      if (this.returns) {
        rvar = scope.freeVariable('results');
      }
      ivar = (this.range ? name : index) || scope.freeVariable('i');
      if (this.pattern) {
        name = ivar;
      }
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPart = source.compile(merge(o, {
          index: ivar,
          step: this.step
        }));
      } else {
        svar = this.source.compile(o, LEVEL_LIST);
        if ((name || this.own) && !IDENTIFIER.test(svar)) {
          defPart = "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
          svar = ref;
        }
        if (name && !this.pattern) {
          namePart = "" + name + " = " + svar + "[" + ivar + "]";
        }
        if (!this.object) {
          lvar = scope.freeVariable('len');
          stepPart = this.step ? "" + ivar + " += " + (this.step.compile(o, LEVEL_OP)) : "" + ivar + "++";
          forPart = "" + ivar + " = 0, " + lvar + " = " + svar + ".length; " + ivar + " < " + lvar + "; " + stepPart;
        }
      }
      if (this.returns) {
        resultPart = "" + this.tab + rvar + " = [];\n";
        returnResult = "\n" + this.tab + "return " + rvar + ";";
        body = Push.wrap(rvar, body);
      }
      if (this.guard) {
        body = Block.wrap([new If(this.guard, body)]);
      }
      if (this.pattern) {
        body.expressions.unshift(new Assign(this.name, new Literal("" + svar + "[" + ivar + "]")));
      }
      defPart += this.pluckDirectCall(o, body);
      if (namePart) {
        varPart = "\n" + idt1 + namePart + ";";
      }
      if (this.object) {
        forPart = "" + ivar + " in " + svar;
        if (this.own) {
          guardPart = "\n" + idt1 + "if (!" + (utility('hasProp')) + ".call(" + svar + ", " + ivar + ")) continue;";
        }
      }
      body = body.compile(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (body) {
        body = '\n' + body + '\n';
      }
      return "" + defPart + (resultPart || '') + this.tab + "for (" + forPart + ") {" + guardPart + varPart + body + this.tab + "}" + (returnResult || '');
    };
    For.prototype.pluckDirectCall = function(o, body) {
      var base, defs, expr, fn, idx, ref, val, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
      defs = '';
      _ref = body.expressions;
      for (idx = 0, _len = _ref.length; idx < _len; idx++) {
        expr = _ref[idx];
        expr = expr.unwrapAll();
        if (!(expr instanceof Call)) {
          continue;
        }
        val = expr.variable.unwrapAll();
        if (!((val instanceof Code) || (val instanceof Value && ((_ref2 = val.base) != null ? _ref2.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((_ref3 = (_ref4 = val.properties[0].name) != null ? _ref4.value : void 0) === 'call' || _ref3 === 'apply')))) {
          continue;
        }
        fn = ((_ref5 = val.base) != null ? _ref5.unwrapAll() : void 0) || val;
        ref = new Literal(o.scope.freeVariable('fn'));
        base = new Value(ref);
        if (val.base) {
          _ref6 = [base, val], val.base = _ref6[0], base = _ref6[1];
          args.unshift(new Literal('this'));
        }
        body.expressions[idx] = new Call(base, expr.args);
        defs += this.tab + new Assign(ref, fn).compile(o, LEVEL_TOP) + ';\n';
      }
      return defs;
    };
    return For;
  })();
  exports.Switch = Switch = (function() {
    __extends(Switch, Base);
    function Switch(subject, cases, otherwise) {
      this.subject = subject;
      this.cases = cases;
      this.otherwise = otherwise;
    }
    Switch.prototype.children = ['subject', 'cases', 'otherwise'];
    Switch.prototype.isStatement = YES;
    Switch.prototype.jumps = function(o) {
      var block, conds, _i, _len, _ref, _ref2, _ref3;
      if (o == null) {
        o = {
          block: true
        };
      }
      _ref = this.cases;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], conds = _ref2[0], block = _ref2[1];
        if (block.jumps(o)) {
          return block;
        }
      }
      return (_ref3 = this.otherwise) != null ? _ref3.jumps(o) : void 0;
    };
    Switch.prototype.makeReturn = function() {
      var pair, _i, _len, _ref, _ref2;
      _ref = this.cases;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pair = _ref[_i];
        pair[1].makeReturn();
      }
      if ((_ref2 = this.otherwise) != null) {
        _ref2.makeReturn();
      }
      return this;
    };
    Switch.prototype.compileNode = function(o) {
      var block, body, code, cond, conditions, expr, i, idt1, idt2, _i, _len, _len2, _ref, _ref2, _ref3, _ref4;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      code = this.tab + ("switch (" + (((_ref = this.subject) != null ? _ref.compile(o, LEVEL_PAREN) : void 0) || false) + ") {\n");
      _ref2 = this.cases;
      for (i = 0, _len = _ref2.length; i < _len; i++) {
        _ref3 = _ref2[i], conditions = _ref3[0], block = _ref3[1];
        _ref4 = flatten([conditions]);
        for (_i = 0, _len2 = _ref4.length; _i < _len2; _i++) {
          cond = _ref4[_i];
          if (!this.subject) {
            cond = cond.invert();
          }
          code += idt1 + ("case " + (cond.compile(o, LEVEL_PAREN)) + ":\n");
        }
        if (body = block.compile(o, LEVEL_TOP)) {
          code += body + '\n';
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        expr = this.lastNonComment(block.expressions);
        if (expr instanceof Return || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
          continue;
        }
        code += idt2 + 'break;\n';
      }
      if (this.otherwise && this.otherwise.expressions.length) {
        code += idt1 + ("default:\n" + (this.otherwise.compile(o, LEVEL_TOP)) + "\n");
      }
      return code + this.tab + '}';
    };
    return Switch;
  })();
  exports.If = If = (function() {
    __extends(If, Base);
    function If(condition, body, options) {
      this.body = body;
      if (options == null) {
        options = {};
      }
      this.condition = options.type === 'unless' ? condition.invert() : condition;
      this.elseBody = null;
      this.isChain = false;
      this.soak = options.soak;
    }
    If.prototype.children = ['condition', 'body', 'elseBody'];
    If.prototype.bodyNode = function() {
      var _ref;
      return (_ref = this.body) != null ? _ref.unwrap() : void 0;
    };
    If.prototype.elseBodyNode = function() {
      var _ref;
      return (_ref = this.elseBody) != null ? _ref.unwrap() : void 0;
    };
    If.prototype.addElse = function(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
      }
      return this;
    };
    If.prototype.isStatement = function(o) {
      var _ref;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref = this.elseBodyNode()) != null ? _ref.isStatement(o) : void 0);
    };
    If.prototype.jumps = function(o) {
      var _ref;
      return this.body.jumps(o) || ((_ref = this.elseBody) != null ? _ref.jumps(o) : void 0);
    };
    If.prototype.compileNode = function(o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    };
    If.prototype.makeReturn = function() {
      this.body && (this.body = new Block([this.body.makeReturn()]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn()]));
      return this;
    };
    If.prototype.ensureBlock = function(node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    };
    If.prototype.compileStatement = function(o) {
      var body, child, cond, ifPart;
      child = del(o, 'chainChild');
      cond = this.condition.compile(o, LEVEL_PAREN);
      o.indent += TAB;
      body = this.ensureBlock(this.body).compile(o);
      if (body) {
        body = "\n" + body + "\n" + this.tab;
      }
      ifPart = "if (" + cond + ") {" + body + "}";
      if (!child) {
        ifPart = this.tab + ifPart;
      }
      if (!this.elseBody) {
        return ifPart;
      }
      return ifPart + ' else ' + (this.isChain ? (o.indent = this.tab, o.chainChild = true, this.elseBody.unwrap().compile(o, LEVEL_TOP)) : "{\n" + (this.elseBody.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}");
    };
    If.prototype.compileExpression = function(o) {
      var alt, body, code, cond;
      cond = this.condition.compile(o, LEVEL_COND);
      body = this.bodyNode().compile(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compile(o, LEVEL_LIST) : 'void 0';
      code = "" + cond + " ? " + body + " : " + alt;
      if (o.level >= LEVEL_COND) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    If.prototype.unfoldSoak = function() {
      return this.soak && this;
    };
    return If;
  })();
  Push = {
    wrap: function(name, exps) {
      if (exps.isEmpty() || last(exps.expressions).jumps()) {
        return exps;
      }
      return exps.push(new Call(new Value(new Literal(name), [new Access(new Literal('push'))]), [exps.pop()]));
    }
  };
  Closure = {
    wrap: function(expressions, statement, noReturn) {
      var args, call, func, mentionsArgs, meth;
      if (expressions.jumps()) {
        return expressions;
      }
      func = new Code([], Block.wrap([expressions]));
      args = [];
      if ((mentionsArgs = expressions.contains(this.literalArgs)) || (expressions.contains(this.literalThis))) {
        meth = new Literal(mentionsArgs ? 'apply' : 'call');
        args = [new Literal('this')];
        if (mentionsArgs) {
          args.push(new Literal('arguments'));
        }
        func = new Value(func, [new Access(meth)]);
      }
      func.noReturn = noReturn;
      call = new Call(func, args);
      if (statement) {
        return Block.wrap([call]);
      } else {
        return call;
      }
    },
    literalArgs: function(node) {
      return node instanceof Literal && node.value === 'arguments' && !node.asKey;
    },
    literalThis: function(node) {
      return (node instanceof Literal && node.value === 'this' && !node.asKey) || (node instanceof Code && node.bound);
    }
  };
  unfoldSoak = function(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
      return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
  };
  UTILITIES = {
    "extends": 'function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype;\n  child.prototype = new ctor;\n  child.__super__ = parent.prototype;\n  return child;\n}',
    bind: 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }',
    indexOf: 'Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  }\n  return -1;\n}',
    hasProp: 'Object.prototype.hasOwnProperty',
    slice: 'Array.prototype.slice'
  };
  LEVEL_TOP = 1;
  LEVEL_PAREN = 2;
  LEVEL_LIST = 3;
  LEVEL_COND = 4;
  LEVEL_OP = 5;
  LEVEL_ACCESS = 6;
  TAB = '  ';
  TRAILING_WHITESPACE = /[ \t]+$/gm;
  IDENTIFIER = /^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*$/;
  SIMPLENUM = /^[+-]?\d+$/;
  IS_STRING = /^['"]/;
  utility = function(name) {
    var ref;
    ref = "__" + name;
    Scope.root.assign(ref, UTILITIES[name]);
    return ref;
  };
  multident = function(code, tab) {
    return code.replace(/\n/g, '$&' + tab);
  };
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/nodes"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/optparse"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/optparse";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/optparse", path);
    };
    
    (function () {
        (function() {
  var LONG_FLAG, MULTI_FLAG, OPTIONAL, OptionParser, SHORT_FLAG, buildRule, buildRules, normalizeArguments;
  exports.OptionParser = OptionParser = (function() {
    function OptionParser(rules, banner) {
      this.banner = banner;
      this.rules = buildRules(rules);
    }
    OptionParser.prototype.parse = function(args) {
      var arg, i, isOption, matchedRule, options, rule, value, _i, _len, _len2, _ref;
      options = {
        arguments: [],
        literals: []
      };
      args = normalizeArguments(args);
      for (i = 0, _len = args.length; i < _len; i++) {
        arg = args[i];
        if (arg === '--') {
          options.literals = args.slice(i + 1);
          break;
        }
        isOption = !!(arg.match(LONG_FLAG) || arg.match(SHORT_FLAG));
        matchedRule = false;
        _ref = this.rules;
        for (_i = 0, _len2 = _ref.length; _i < _len2; _i++) {
          rule = _ref[_i];
          if (rule.shortFlag === arg || rule.longFlag === arg) {
            value = rule.hasArgument ? args[i += 1] : true;
            options[rule.name] = rule.isList ? (options[rule.name] || []).concat(value) : value;
            matchedRule = true;
            break;
          }
        }
        if (isOption && !matchedRule) {
          throw new Error("unrecognized option: " + arg);
        }
        if (!isOption) {
          options.arguments = args.slice(i);
          break;
        }
      }
      return options;
    };
    OptionParser.prototype.help = function() {
      var letPart, lines, rule, spaces, _i, _len, _ref;
      lines = [];
      if (this.banner) {
        lines.unshift("" + this.banner + "\n");
      }
      _ref = this.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        spaces = 15 - rule.longFlag.length;
        spaces = spaces > 0 ? Array(spaces + 1).join(' ') : '';
        letPart = rule.shortFlag ? rule.shortFlag + ', ' : '    ';
        lines.push('  ' + letPart + rule.longFlag + spaces + rule.description);
      }
      return "\n" + (lines.join('\n')) + "\n";
    };
    return OptionParser;
  })();
  LONG_FLAG = /^(--\w[\w\-]+)/;
  SHORT_FLAG = /^(-\w)/;
  MULTI_FLAG = /^-(\w{2,})/;
  OPTIONAL = /\[(\w+(\*?))\]/;
  buildRules = function(rules) {
    var tuple, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      tuple = rules[_i];
      if (tuple.length < 3) {
        tuple.unshift(null);
      }
      _results.push(buildRule.apply(null, tuple));
    }
    return _results;
  };
  buildRule = function(shortFlag, longFlag, description, options) {
    var match;
    if (options == null) {
      options = {};
    }
    match = longFlag.match(OPTIONAL);
    longFlag = longFlag.match(LONG_FLAG)[1];
    return {
      name: longFlag.substr(2),
      shortFlag: shortFlag,
      longFlag: longFlag,
      description: description,
      hasArgument: !!(match && match[1]),
      isList: !!(match && match[2])
    };
  };
  normalizeArguments = function(args) {
    var arg, l, match, result, _i, _j, _len, _len2, _ref;
    args = args.slice(0);
    result = [];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (match = arg.match(MULTI_FLAG)) {
        _ref = match[1].split('');
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          l = _ref[_j];
          result.push('-' + l);
        }
      } else {
        result.push(arg);
      }
    }
    return result;
  };
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/optparse"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/parser"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/parser";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/parser", path);
    };
    
    (function () {
        /* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"Body":4,"Block":5,"TERMINATOR":6,"Line":7,"Expression":8,"Statement":9,"Return":10,"Throw":11,"Comment":12,"STATEMENT":13,"Value":14,"Invocation":15,"Code":16,"Operation":17,"Assign":18,"If":19,"Try":20,"While":21,"For":22,"Switch":23,"Class":24,"INDENT":25,"OUTDENT":26,"Identifier":27,"IDENTIFIER":28,"AlphaNumeric":29,"NUMBER":30,"STRING":31,"Literal":32,"JS":33,"REGEX":34,"BOOL":35,"Assignable":36,"=":37,"AssignObj":38,"ObjAssignable":39,":":40,"ThisProperty":41,"RETURN":42,"HERECOMMENT":43,"PARAM_START":44,"ParamList":45,"PARAM_END":46,"FuncGlyph":47,"->":48,"=>":49,"OptComma":50,",":51,"Param":52,"ParamVar":53,"...":54,"Array":55,"Object":56,"Splat":57,"SimpleAssignable":58,"Accessor":59,"Parenthetical":60,"Range":61,"This":62,".":63,"?.":64,"::":65,"Index":66,"Slice":67,"INDEX_START":68,"INDEX_END":69,"INDEX_SOAK":70,"INDEX_PROTO":71,"{":72,"AssignList":73,"}":74,"CLASS":75,"EXTENDS":76,"OptFuncExist":77,"Arguments":78,"SUPER":79,"FUNC_EXIST":80,"CALL_START":81,"CALL_END":82,"ArgList":83,"THIS":84,"@":85,"[":86,"]":87,"RangeDots":88,"..":89,"Arg":90,"SimpleArgs":91,"TRY":92,"Catch":93,"FINALLY":94,"CATCH":95,"THROW":96,"(":97,")":98,"WhileSource":99,"WHILE":100,"WHEN":101,"UNTIL":102,"Loop":103,"LOOP":104,"ForBody":105,"FOR":106,"ForStart":107,"ForSource":108,"ForVariables":109,"OWN":110,"ForValue":111,"FORIN":112,"FOROF":113,"BY":114,"SWITCH":115,"Whens":116,"ELSE":117,"When":118,"LEADING_WHEN":119,"IfBlock":120,"IF":121,"POST_IF":122,"UNARY":123,"-":124,"+":125,"--":126,"++":127,"?":128,"MATH":129,"SHIFT":130,"COMPARE":131,"LOGIC":132,"RELATION":133,"COMPOUND_ASSIGN":134,"$accept":0,"$end":1},
terminals_: {2:"error",6:"TERMINATOR",13:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"BOOL",37:"=",40:":",42:"RETURN",43:"HERECOMMENT",44:"PARAM_START",46:"PARAM_END",48:"->",49:"=>",51:",",54:"...",63:".",64:"?.",65:"::",68:"INDEX_START",69:"INDEX_END",70:"INDEX_SOAK",71:"INDEX_PROTO",72:"{",74:"}",75:"CLASS",76:"EXTENDS",79:"SUPER",80:"FUNC_EXIST",81:"CALL_START",82:"CALL_END",84:"THIS",85:"@",86:"[",87:"]",89:"..",92:"TRY",94:"FINALLY",95:"CATCH",96:"THROW",97:"(",98:")",100:"WHILE",101:"WHEN",102:"UNTIL",104:"LOOP",106:"FOR",110:"OWN",112:"FORIN",113:"FOROF",114:"BY",115:"SWITCH",117:"ELSE",119:"LEADING_WHEN",121:"IF",122:"POST_IF",123:"UNARY",124:"-",125:"+",126:"--",127:"++",128:"?",129:"MATH",130:"SHIFT",131:"COMPARE",132:"LOGIC",133:"RELATION",134:"COMPOUND_ASSIGN"},
productions_: [0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[18,3],[18,5],[38,1],[38,3],[38,5],[38,1],[39,1],[39,1],[39,1],[10,2],[10,1],[12,1],[16,5],[16,2],[47,1],[47,1],[50,0],[50,1],[45,0],[45,1],[45,3],[52,1],[52,2],[52,3],[53,1],[53,1],[53,1],[53,1],[57,2],[58,1],[58,2],[58,2],[58,1],[36,1],[36,1],[36,1],[14,1],[14,1],[14,1],[14,1],[14,1],[59,2],[59,2],[59,2],[59,1],[59,1],[59,1],[66,3],[66,2],[66,2],[56,4],[73,0],[73,1],[73,3],[73,4],[73,6],[24,1],[24,2],[24,3],[24,4],[24,2],[24,3],[24,4],[24,5],[15,3],[15,3],[15,1],[15,2],[77,0],[77,1],[78,2],[78,4],[62,1],[62,1],[41,2],[55,2],[55,4],[88,1],[88,1],[61,5],[67,5],[67,4],[67,4],[83,1],[83,3],[83,4],[83,4],[83,6],[90,1],[90,1],[91,1],[91,3],[20,2],[20,3],[20,4],[20,5],[93,3],[11,2],[60,3],[60,5],[99,2],[99,4],[99,2],[99,4],[21,2],[21,2],[21,2],[21,1],[103,2],[103,2],[22,2],[22,2],[22,2],[105,2],[105,2],[107,2],[107,3],[111,1],[111,1],[111,1],[109,1],[109,3],[108,2],[108,2],[108,4],[108,4],[108,4],[108,6],[108,6],[23,5],[23,7],[23,4],[23,6],[116,1],[116,2],[118,3],[118,4],[120,3],[120,5],[19,1],[19,3],[19,3],[19,3],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,5],[17,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1:return this.$ = new yy.Block;
break;
case 2:return this.$ = $$[$0];
break;
case 3:return this.$ = $$[$0-1];
break;
case 4:this.$ = yy.Block.wrap([$$[$0]]);
break;
case 5:this.$ = $$[$0-2].push($$[$0]);
break;
case 6:this.$ = $$[$0-1];
break;
case 7:this.$ = $$[$0];
break;
case 8:this.$ = $$[$0];
break;
case 9:this.$ = $$[$0];
break;
case 10:this.$ = $$[$0];
break;
case 11:this.$ = $$[$0];
break;
case 12:this.$ = new yy.Literal($$[$0]);
break;
case 13:this.$ = $$[$0];
break;
case 14:this.$ = $$[$0];
break;
case 15:this.$ = $$[$0];
break;
case 16:this.$ = $$[$0];
break;
case 17:this.$ = $$[$0];
break;
case 18:this.$ = $$[$0];
break;
case 19:this.$ = $$[$0];
break;
case 20:this.$ = $$[$0];
break;
case 21:this.$ = $$[$0];
break;
case 22:this.$ = $$[$0];
break;
case 23:this.$ = $$[$0];
break;
case 24:this.$ = new yy.Block;
break;
case 25:this.$ = $$[$0-1];
break;
case 26:this.$ = new yy.Literal($$[$0]);
break;
case 27:this.$ = new yy.Literal($$[$0]);
break;
case 28:this.$ = new yy.Literal($$[$0]);
break;
case 29:this.$ = $$[$0];
break;
case 30:this.$ = new yy.Literal($$[$0]);
break;
case 31:this.$ = new yy.Literal($$[$0]);
break;
case 32:this.$ = (function () {
        var val;
        val = new yy.Literal($$[$0]);
        if ($$[$0] === 'undefined') {
          val.isUndefined = true;
        }
        return val;
      }());
break;
case 33:this.$ = new yy.Assign($$[$0-2], $$[$0]);
break;
case 34:this.$ = new yy.Assign($$[$0-4], $$[$0-1]);
break;
case 35:this.$ = new yy.Value($$[$0]);
break;
case 36:this.$ = new yy.Assign(new yy.Value($$[$0-2]), $$[$0], 'object');
break;
case 37:this.$ = new yy.Assign(new yy.Value($$[$0-4]), $$[$0-1], 'object');
break;
case 38:this.$ = $$[$0];
break;
case 39:this.$ = $$[$0];
break;
case 40:this.$ = $$[$0];
break;
case 41:this.$ = $$[$0];
break;
case 42:this.$ = new yy.Return($$[$0]);
break;
case 43:this.$ = new yy.Return;
break;
case 44:this.$ = new yy.Comment($$[$0]);
break;
case 45:this.$ = new yy.Code($$[$0-3], $$[$0], $$[$0-1]);
break;
case 46:this.$ = new yy.Code([], $$[$0], $$[$0-1]);
break;
case 47:this.$ = 'func';
break;
case 48:this.$ = 'boundfunc';
break;
case 49:this.$ = $$[$0];
break;
case 50:this.$ = $$[$0];
break;
case 51:this.$ = [];
break;
case 52:this.$ = [$$[$0]];
break;
case 53:this.$ = $$[$0-2].concat($$[$0]);
break;
case 54:this.$ = new yy.Param($$[$0]);
break;
case 55:this.$ = new yy.Param($$[$0-1], null, true);
break;
case 56:this.$ = new yy.Param($$[$0-2], $$[$0]);
break;
case 57:this.$ = $$[$0];
break;
case 58:this.$ = $$[$0];
break;
case 59:this.$ = $$[$0];
break;
case 60:this.$ = $$[$0];
break;
case 61:this.$ = new yy.Splat($$[$0-1]);
break;
case 62:this.$ = new yy.Value($$[$0]);
break;
case 63:this.$ = $$[$0-1].push($$[$0]);
break;
case 64:this.$ = new yy.Value($$[$0-1], [$$[$0]]);
break;
case 65:this.$ = $$[$0];
break;
case 66:this.$ = $$[$0];
break;
case 67:this.$ = new yy.Value($$[$0]);
break;
case 68:this.$ = new yy.Value($$[$0]);
break;
case 69:this.$ = $$[$0];
break;
case 70:this.$ = new yy.Value($$[$0]);
break;
case 71:this.$ = new yy.Value($$[$0]);
break;
case 72:this.$ = new yy.Value($$[$0]);
break;
case 73:this.$ = $$[$0];
break;
case 74:this.$ = new yy.Access($$[$0]);
break;
case 75:this.$ = new yy.Access($$[$0], 'soak');
break;
case 76:this.$ = new yy.Access($$[$0], 'proto');
break;
case 77:this.$ = new yy.Access(new yy.Literal('prototype'));
break;
case 78:this.$ = $$[$0];
break;
case 79:this.$ = new yy.Slice($$[$0]);
break;
case 80:this.$ = new yy.Index($$[$0-1]);
break;
case 81:this.$ = yy.extend($$[$0], {
          soak: true
        });
break;
case 82:this.$ = yy.extend($$[$0], {
          proto: true
        });
break;
case 83:this.$ = new yy.Obj($$[$0-2], $$[$0-3].generated);
break;
case 84:this.$ = [];
break;
case 85:this.$ = [$$[$0]];
break;
case 86:this.$ = $$[$0-2].concat($$[$0]);
break;
case 87:this.$ = $$[$0-3].concat($$[$0]);
break;
case 88:this.$ = $$[$0-5].concat($$[$0-2]);
break;
case 89:this.$ = new yy.Class;
break;
case 90:this.$ = new yy.Class(null, null, $$[$0]);
break;
case 91:this.$ = new yy.Class(null, $$[$0]);
break;
case 92:this.$ = new yy.Class(null, $$[$0-1], $$[$0]);
break;
case 93:this.$ = new yy.Class($$[$0]);
break;
case 94:this.$ = new yy.Class($$[$0-1], null, $$[$0]);
break;
case 95:this.$ = new yy.Class($$[$0-2], $$[$0]);
break;
case 96:this.$ = new yy.Class($$[$0-3], $$[$0-1], $$[$0]);
break;
case 97:this.$ = new yy.Call($$[$0-2], $$[$0], $$[$0-1]);
break;
case 98:this.$ = new yy.Call($$[$0-2], $$[$0], $$[$0-1]);
break;
case 99:this.$ = new yy.Call('super', [new yy.Splat(new yy.Literal('arguments'))]);
break;
case 100:this.$ = new yy.Call('super', $$[$0]);
break;
case 101:this.$ = false;
break;
case 102:this.$ = true;
break;
case 103:this.$ = [];
break;
case 104:this.$ = $$[$0-2];
break;
case 105:this.$ = new yy.Value(new yy.Literal('this'));
break;
case 106:this.$ = new yy.Value(new yy.Literal('this'));
break;
case 107:this.$ = new yy.Value(new yy.Literal('this'), [new yy.Access($$[$0])], 'this');
break;
case 108:this.$ = new yy.Arr([]);
break;
case 109:this.$ = new yy.Arr($$[$0-2]);
break;
case 110:this.$ = 'inclusive';
break;
case 111:this.$ = 'exclusive';
break;
case 112:this.$ = new yy.Range($$[$0-3], $$[$0-1], $$[$0-2]);
break;
case 113:this.$ = new yy.Range($$[$0-3], $$[$0-1], $$[$0-2]);
break;
case 114:this.$ = new yy.Range($$[$0-2], null, $$[$0-1]);
break;
case 115:this.$ = new yy.Range(null, $$[$0-1], $$[$0-2]);
break;
case 116:this.$ = [$$[$0]];
break;
case 117:this.$ = $$[$0-2].concat($$[$0]);
break;
case 118:this.$ = $$[$0-3].concat($$[$0]);
break;
case 119:this.$ = $$[$0-2];
break;
case 120:this.$ = $$[$0-5].concat($$[$0-2]);
break;
case 121:this.$ = $$[$0];
break;
case 122:this.$ = $$[$0];
break;
case 123:this.$ = $$[$0];
break;
case 124:this.$ = [].concat($$[$0-2], $$[$0]);
break;
case 125:this.$ = new yy.Try($$[$0]);
break;
case 126:this.$ = new yy.Try($$[$0-1], $$[$0][0], $$[$0][1]);
break;
case 127:this.$ = new yy.Try($$[$0-2], null, null, $$[$0]);
break;
case 128:this.$ = new yy.Try($$[$0-3], $$[$0-2][0], $$[$0-2][1], $$[$0]);
break;
case 129:this.$ = [$$[$0-1], $$[$0]];
break;
case 130:this.$ = new yy.Throw($$[$0]);
break;
case 131:this.$ = new yy.Parens($$[$0-1]);
break;
case 132:this.$ = new yy.Parens($$[$0-2]);
break;
case 133:this.$ = new yy.While($$[$0]);
break;
case 134:this.$ = new yy.While($$[$0-2], {
          guard: $$[$0]
        });
break;
case 135:this.$ = new yy.While($$[$0], {
          invert: true
        });
break;
case 136:this.$ = new yy.While($$[$0-2], {
          invert: true,
          guard: $$[$0]
        });
break;
case 137:this.$ = $$[$0-1].addBody($$[$0]);
break;
case 138:this.$ = $$[$0].addBody(yy.Block.wrap([$$[$0-1]]));
break;
case 139:this.$ = $$[$0].addBody(yy.Block.wrap([$$[$0-1]]));
break;
case 140:this.$ = $$[$0];
break;
case 141:this.$ = new yy.While(new yy.Literal('true')).addBody($$[$0]);
break;
case 142:this.$ = new yy.While(new yy.Literal('true')).addBody(yy.Block.wrap([$$[$0]]));
break;
case 143:this.$ = new yy.For($$[$0-1], $$[$0]);
break;
case 144:this.$ = new yy.For($$[$0-1], $$[$0]);
break;
case 145:this.$ = new yy.For($$[$0], $$[$0-1]);
break;
case 146:this.$ = {
          source: new yy.Value($$[$0])
        };
break;
case 147:this.$ = (function () {
        $$[$0].own = $$[$0-1].own;
        $$[$0].name = $$[$0-1][0];
        $$[$0].index = $$[$0-1][1];
        return $$[$0];
      }());
break;
case 148:this.$ = $$[$0];
break;
case 149:this.$ = (function () {
        $$[$0].own = true;
        return $$[$0];
      }());
break;
case 150:this.$ = $$[$0];
break;
case 151:this.$ = new yy.Value($$[$0]);
break;
case 152:this.$ = new yy.Value($$[$0]);
break;
case 153:this.$ = [$$[$0]];
break;
case 154:this.$ = [$$[$0-2], $$[$0]];
break;
case 155:this.$ = {
          source: $$[$0]
        };
break;
case 156:this.$ = {
          source: $$[$0],
          object: true
        };
break;
case 157:this.$ = {
          source: $$[$0-2],
          guard: $$[$0]
        };
break;
case 158:this.$ = {
          source: $$[$0-2],
          guard: $$[$0],
          object: true
        };
break;
case 159:this.$ = {
          source: $$[$0-2],
          step: $$[$0]
        };
break;
case 160:this.$ = {
          source: $$[$0-4],
          guard: $$[$0-2],
          step: $$[$0]
        };
break;
case 161:this.$ = {
          source: $$[$0-4],
          step: $$[$0-2],
          guard: $$[$0]
        };
break;
case 162:this.$ = new yy.Switch($$[$0-3], $$[$0-1]);
break;
case 163:this.$ = new yy.Switch($$[$0-5], $$[$0-3], $$[$0-1]);
break;
case 164:this.$ = new yy.Switch(null, $$[$0-1]);
break;
case 165:this.$ = new yy.Switch(null, $$[$0-3], $$[$0-1]);
break;
case 166:this.$ = $$[$0];
break;
case 167:this.$ = $$[$0-1].concat($$[$0]);
break;
case 168:this.$ = [[$$[$0-1], $$[$0]]];
break;
case 169:this.$ = [[$$[$0-2], $$[$0-1]]];
break;
case 170:this.$ = new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        });
break;
case 171:this.$ = $$[$0-4].addElse(new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        }));
break;
case 172:this.$ = $$[$0];
break;
case 173:this.$ = $$[$0-2].addElse($$[$0]);
break;
case 174:this.$ = new yy.If($$[$0], yy.Block.wrap([$$[$0-2]]), {
          type: $$[$0-1],
          statement: true
        });
break;
case 175:this.$ = new yy.If($$[$0], yy.Block.wrap([$$[$0-2]]), {
          type: $$[$0-1],
          statement: true
        });
break;
case 176:this.$ = new yy.Op($$[$0-1], $$[$0]);
break;
case 177:this.$ = new yy.Op('-', $$[$0]);
break;
case 178:this.$ = new yy.Op('+', $$[$0]);
break;
case 179:this.$ = new yy.Op('--', $$[$0]);
break;
case 180:this.$ = new yy.Op('++', $$[$0]);
break;
case 181:this.$ = new yy.Op('--', $$[$0-1], null, true);
break;
case 182:this.$ = new yy.Op('++', $$[$0-1], null, true);
break;
case 183:this.$ = new yy.Existence($$[$0-1]);
break;
case 184:this.$ = new yy.Op('+', $$[$0-2], $$[$0]);
break;
case 185:this.$ = new yy.Op('-', $$[$0-2], $$[$0]);
break;
case 186:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 187:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 188:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 189:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 190:this.$ = (function () {
        if ($$[$0-1].charAt(0) === '!') {
          return new yy.Op($$[$0-1].slice(1), $$[$0-2], $$[$0]).invert();
        } else {
          return new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
        }
      }());
break;
case 191:this.$ = new yy.Assign($$[$0-2], $$[$0], $$[$0-1]);
break;
case 192:this.$ = new yy.Assign($$[$0-4], $$[$0-1], $$[$0-3]);
break;
case 193:this.$ = new yy.Extends($$[$0-2], $$[$0]);
break;
}
},
table: [{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[3]},{1:[2,2],6:[1,71]},{6:[1,72]},{1:[2,4],6:[2,4],26:[2,4],98:[2,4]},{4:74,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[1,73],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,7],6:[2,7],26:[2,7],98:[2,7],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,8],6:[2,8],26:[2,8],98:[2,8],99:87,100:[1,62],102:[1,63],105:88,106:[1,65],107:66,122:[1,86]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],46:[2,13],51:[2,13],54:[2,13],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,13],70:[1,98],71:[1,99],74:[2,13],77:89,80:[1,91],81:[2,101],82:[2,13],87:[2,13],89:[2,13],98:[2,13],100:[2,13],101:[2,13],102:[2,13],106:[2,13],114:[2,13],122:[2,13],124:[2,13],125:[2,13],128:[2,13],129:[2,13],130:[2,13],131:[2,13],132:[2,13],133:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],46:[2,14],51:[2,14],54:[2,14],59:101,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,14],70:[1,98],71:[1,99],74:[2,14],77:100,80:[1,91],81:[2,101],82:[2,14],87:[2,14],89:[2,14],98:[2,14],100:[2,14],101:[2,14],102:[2,14],106:[2,14],114:[2,14],122:[2,14],124:[2,14],125:[2,14],128:[2,14],129:[2,14],130:[2,14],131:[2,14],132:[2,14],133:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],46:[2,15],51:[2,15],54:[2,15],69:[2,15],74:[2,15],82:[2,15],87:[2,15],89:[2,15],98:[2,15],100:[2,15],101:[2,15],102:[2,15],106:[2,15],114:[2,15],122:[2,15],124:[2,15],125:[2,15],128:[2,15],129:[2,15],130:[2,15],131:[2,15],132:[2,15],133:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],46:[2,16],51:[2,16],54:[2,16],69:[2,16],74:[2,16],82:[2,16],87:[2,16],89:[2,16],98:[2,16],100:[2,16],101:[2,16],102:[2,16],106:[2,16],114:[2,16],122:[2,16],124:[2,16],125:[2,16],128:[2,16],129:[2,16],130:[2,16],131:[2,16],132:[2,16],133:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],46:[2,17],51:[2,17],54:[2,17],69:[2,17],74:[2,17],82:[2,17],87:[2,17],89:[2,17],98:[2,17],100:[2,17],101:[2,17],102:[2,17],106:[2,17],114:[2,17],122:[2,17],124:[2,17],125:[2,17],128:[2,17],129:[2,17],130:[2,17],131:[2,17],132:[2,17],133:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],46:[2,18],51:[2,18],54:[2,18],69:[2,18],74:[2,18],82:[2,18],87:[2,18],89:[2,18],98:[2,18],100:[2,18],101:[2,18],102:[2,18],106:[2,18],114:[2,18],122:[2,18],124:[2,18],125:[2,18],128:[2,18],129:[2,18],130:[2,18],131:[2,18],132:[2,18],133:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],46:[2,19],51:[2,19],54:[2,19],69:[2,19],74:[2,19],82:[2,19],87:[2,19],89:[2,19],98:[2,19],100:[2,19],101:[2,19],102:[2,19],106:[2,19],114:[2,19],122:[2,19],124:[2,19],125:[2,19],128:[2,19],129:[2,19],130:[2,19],131:[2,19],132:[2,19],133:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],46:[2,20],51:[2,20],54:[2,20],69:[2,20],74:[2,20],82:[2,20],87:[2,20],89:[2,20],98:[2,20],100:[2,20],101:[2,20],102:[2,20],106:[2,20],114:[2,20],122:[2,20],124:[2,20],125:[2,20],128:[2,20],129:[2,20],130:[2,20],131:[2,20],132:[2,20],133:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],46:[2,21],51:[2,21],54:[2,21],69:[2,21],74:[2,21],82:[2,21],87:[2,21],89:[2,21],98:[2,21],100:[2,21],101:[2,21],102:[2,21],106:[2,21],114:[2,21],122:[2,21],124:[2,21],125:[2,21],128:[2,21],129:[2,21],130:[2,21],131:[2,21],132:[2,21],133:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],46:[2,22],51:[2,22],54:[2,22],69:[2,22],74:[2,22],82:[2,22],87:[2,22],89:[2,22],98:[2,22],100:[2,22],101:[2,22],102:[2,22],106:[2,22],114:[2,22],122:[2,22],124:[2,22],125:[2,22],128:[2,22],129:[2,22],130:[2,22],131:[2,22],132:[2,22],133:[2,22]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],46:[2,23],51:[2,23],54:[2,23],69:[2,23],74:[2,23],82:[2,23],87:[2,23],89:[2,23],98:[2,23],100:[2,23],101:[2,23],102:[2,23],106:[2,23],114:[2,23],122:[2,23],124:[2,23],125:[2,23],128:[2,23],129:[2,23],130:[2,23],131:[2,23],132:[2,23],133:[2,23]},{1:[2,9],6:[2,9],26:[2,9],98:[2,9],100:[2,9],102:[2,9],106:[2,9],122:[2,9]},{1:[2,10],6:[2,10],26:[2,10],98:[2,10],100:[2,10],102:[2,10],106:[2,10],122:[2,10]},{1:[2,11],6:[2,11],26:[2,11],98:[2,11],100:[2,11],102:[2,11],106:[2,11],122:[2,11]},{1:[2,12],6:[2,12],26:[2,12],98:[2,12],100:[2,12],102:[2,12],106:[2,12],122:[2,12]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],37:[1,102],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],68:[2,69],69:[2,69],70:[2,69],71:[2,69],74:[2,69],80:[2,69],81:[2,69],82:[2,69],87:[2,69],89:[2,69],98:[2,69],100:[2,69],101:[2,69],102:[2,69],106:[2,69],114:[2,69],122:[2,69],124:[2,69],125:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],46:[2,70],51:[2,70],54:[2,70],63:[2,70],64:[2,70],65:[2,70],68:[2,70],69:[2,70],70:[2,70],71:[2,70],74:[2,70],80:[2,70],81:[2,70],82:[2,70],87:[2,70],89:[2,70],98:[2,70],100:[2,70],101:[2,70],102:[2,70],106:[2,70],114:[2,70],122:[2,70],124:[2,70],125:[2,70],128:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],46:[2,71],51:[2,71],54:[2,71],63:[2,71],64:[2,71],65:[2,71],68:[2,71],69:[2,71],70:[2,71],71:[2,71],74:[2,71],80:[2,71],81:[2,71],82:[2,71],87:[2,71],89:[2,71],98:[2,71],100:[2,71],101:[2,71],102:[2,71],106:[2,71],114:[2,71],122:[2,71],124:[2,71],125:[2,71],128:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],46:[2,72],51:[2,72],54:[2,72],63:[2,72],64:[2,72],65:[2,72],68:[2,72],69:[2,72],70:[2,72],71:[2,72],74:[2,72],80:[2,72],81:[2,72],82:[2,72],87:[2,72],89:[2,72],98:[2,72],100:[2,72],101:[2,72],102:[2,72],106:[2,72],114:[2,72],122:[2,72],124:[2,72],125:[2,72],128:[2,72],129:[2,72],130:[2,72],131:[2,72],132:[2,72],133:[2,72]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],46:[2,73],51:[2,73],54:[2,73],63:[2,73],64:[2,73],65:[2,73],68:[2,73],69:[2,73],70:[2,73],71:[2,73],74:[2,73],80:[2,73],81:[2,73],82:[2,73],87:[2,73],89:[2,73],98:[2,73],100:[2,73],101:[2,73],102:[2,73],106:[2,73],114:[2,73],122:[2,73],124:[2,73],125:[2,73],128:[2,73],129:[2,73],130:[2,73],131:[2,73],132:[2,73],133:[2,73]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],46:[2,99],51:[2,99],54:[2,99],63:[2,99],64:[2,99],65:[2,99],68:[2,99],69:[2,99],70:[2,99],71:[2,99],74:[2,99],78:103,80:[2,99],81:[1,104],82:[2,99],87:[2,99],89:[2,99],98:[2,99],100:[2,99],101:[2,99],102:[2,99],106:[2,99],114:[2,99],122:[2,99],124:[2,99],125:[2,99],128:[2,99],129:[2,99],130:[2,99],131:[2,99],132:[2,99],133:[2,99]},{27:108,28:[1,70],41:109,45:105,46:[2,51],51:[2,51],52:106,53:107,55:110,56:111,72:[1,67],85:[1,112],86:[1,113]},{5:114,25:[1,5]},{8:115,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:117,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:118,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{14:120,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:119,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{14:120,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:123,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],37:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,66],70:[2,66],71:[2,66],74:[2,66],76:[1,127],80:[2,66],81:[2,66],82:[2,66],87:[2,66],89:[2,66],98:[2,66],100:[2,66],101:[2,66],102:[2,66],106:[2,66],114:[2,66],122:[2,66],124:[2,66],125:[2,66],126:[1,124],127:[1,125],128:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[1,126]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],46:[2,172],51:[2,172],54:[2,172],69:[2,172],74:[2,172],82:[2,172],87:[2,172],89:[2,172],98:[2,172],100:[2,172],101:[2,172],102:[2,172],106:[2,172],114:[2,172],117:[1,128],122:[2,172],124:[2,172],125:[2,172],128:[2,172],129:[2,172],130:[2,172],131:[2,172],132:[2,172],133:[2,172]},{5:129,25:[1,5]},{5:130,25:[1,5]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],46:[2,140],51:[2,140],54:[2,140],69:[2,140],74:[2,140],82:[2,140],87:[2,140],89:[2,140],98:[2,140],100:[2,140],101:[2,140],102:[2,140],106:[2,140],114:[2,140],122:[2,140],124:[2,140],125:[2,140],128:[2,140],129:[2,140],130:[2,140],131:[2,140],132:[2,140],133:[2,140]},{5:131,25:[1,5]},{8:132,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,133],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,89],5:134,6:[2,89],14:120,15:121,25:[1,5],26:[2,89],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,46:[2,89],51:[2,89],54:[2,89],55:47,56:48,58:136,60:25,61:26,62:27,69:[2,89],72:[1,67],74:[2,89],76:[1,135],79:[1,28],82:[2,89],84:[1,55],85:[1,56],86:[1,54],87:[2,89],89:[2,89],97:[1,53],98:[2,89],100:[2,89],101:[2,89],102:[2,89],106:[2,89],114:[2,89],122:[2,89],124:[2,89],125:[2,89],128:[2,89],129:[2,89],130:[2,89],131:[2,89],132:[2,89],133:[2,89]},{1:[2,43],6:[2,43],8:137,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,43],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],98:[2,43],99:39,100:[2,43],102:[2,43],103:40,104:[1,64],105:41,106:[2,43],107:66,115:[1,42],120:37,121:[1,61],122:[2,43],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:138,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,44],6:[2,44],25:[2,44],26:[2,44],51:[2,44],74:[2,44],98:[2,44],100:[2,44],102:[2,44],106:[2,44],122:[2,44]},{1:[2,67],6:[2,67],25:[2,67],26:[2,67],37:[2,67],46:[2,67],51:[2,67],54:[2,67],63:[2,67],64:[2,67],65:[2,67],68:[2,67],69:[2,67],70:[2,67],71:[2,67],74:[2,67],80:[2,67],81:[2,67],82:[2,67],87:[2,67],89:[2,67],98:[2,67],100:[2,67],101:[2,67],102:[2,67],106:[2,67],114:[2,67],122:[2,67],124:[2,67],125:[2,67],128:[2,67],129:[2,67],130:[2,67],131:[2,67],132:[2,67],133:[2,67]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],37:[2,68],46:[2,68],51:[2,68],54:[2,68],63:[2,68],64:[2,68],65:[2,68],68:[2,68],69:[2,68],70:[2,68],71:[2,68],74:[2,68],80:[2,68],81:[2,68],82:[2,68],87:[2,68],89:[2,68],98:[2,68],100:[2,68],101:[2,68],102:[2,68],106:[2,68],114:[2,68],122:[2,68],124:[2,68],125:[2,68],128:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],46:[2,29],51:[2,29],54:[2,29],63:[2,29],64:[2,29],65:[2,29],68:[2,29],69:[2,29],70:[2,29],71:[2,29],74:[2,29],80:[2,29],81:[2,29],82:[2,29],87:[2,29],89:[2,29],98:[2,29],100:[2,29],101:[2,29],102:[2,29],106:[2,29],114:[2,29],122:[2,29],124:[2,29],125:[2,29],128:[2,29],129:[2,29],130:[2,29],131:[2,29],132:[2,29],133:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],46:[2,30],51:[2,30],54:[2,30],63:[2,30],64:[2,30],65:[2,30],68:[2,30],69:[2,30],70:[2,30],71:[2,30],74:[2,30],80:[2,30],81:[2,30],82:[2,30],87:[2,30],89:[2,30],98:[2,30],100:[2,30],101:[2,30],102:[2,30],106:[2,30],114:[2,30],122:[2,30],124:[2,30],125:[2,30],128:[2,30],129:[2,30],130:[2,30],131:[2,30],132:[2,30],133:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],46:[2,31],51:[2,31],54:[2,31],63:[2,31],64:[2,31],65:[2,31],68:[2,31],69:[2,31],70:[2,31],71:[2,31],74:[2,31],80:[2,31],81:[2,31],82:[2,31],87:[2,31],89:[2,31],98:[2,31],100:[2,31],101:[2,31],102:[2,31],106:[2,31],114:[2,31],122:[2,31],124:[2,31],125:[2,31],128:[2,31],129:[2,31],130:[2,31],131:[2,31],132:[2,31],133:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],46:[2,32],51:[2,32],54:[2,32],63:[2,32],64:[2,32],65:[2,32],68:[2,32],69:[2,32],70:[2,32],71:[2,32],74:[2,32],80:[2,32],81:[2,32],82:[2,32],87:[2,32],89:[2,32],98:[2,32],100:[2,32],101:[2,32],102:[2,32],106:[2,32],114:[2,32],122:[2,32],124:[2,32],125:[2,32],128:[2,32],129:[2,32],130:[2,32],131:[2,32],132:[2,32],133:[2,32]},{4:139,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,140],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:141,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:143,84:[1,55],85:[1,56],86:[1,54],87:[1,142],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],46:[2,105],51:[2,105],54:[2,105],63:[2,105],64:[2,105],65:[2,105],68:[2,105],69:[2,105],70:[2,105],71:[2,105],74:[2,105],80:[2,105],81:[2,105],82:[2,105],87:[2,105],89:[2,105],98:[2,105],100:[2,105],101:[2,105],102:[2,105],106:[2,105],114:[2,105],122:[2,105],124:[2,105],125:[2,105],128:[2,105],129:[2,105],130:[2,105],131:[2,105],132:[2,105],133:[2,105]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],27:147,28:[1,70],46:[2,106],51:[2,106],54:[2,106],63:[2,106],64:[2,106],65:[2,106],68:[2,106],69:[2,106],70:[2,106],71:[2,106],74:[2,106],80:[2,106],81:[2,106],82:[2,106],87:[2,106],89:[2,106],98:[2,106],100:[2,106],101:[2,106],102:[2,106],106:[2,106],114:[2,106],122:[2,106],124:[2,106],125:[2,106],128:[2,106],129:[2,106],130:[2,106],131:[2,106],132:[2,106],133:[2,106]},{25:[2,47]},{25:[2,48]},{1:[2,62],6:[2,62],25:[2,62],26:[2,62],37:[2,62],46:[2,62],51:[2,62],54:[2,62],63:[2,62],64:[2,62],65:[2,62],68:[2,62],69:[2,62],70:[2,62],71:[2,62],74:[2,62],76:[2,62],80:[2,62],81:[2,62],82:[2,62],87:[2,62],89:[2,62],98:[2,62],100:[2,62],101:[2,62],102:[2,62],106:[2,62],114:[2,62],122:[2,62],124:[2,62],125:[2,62],126:[2,62],127:[2,62],128:[2,62],129:[2,62],130:[2,62],131:[2,62],132:[2,62],133:[2,62],134:[2,62]},{1:[2,65],6:[2,65],25:[2,65],26:[2,65],37:[2,65],46:[2,65],51:[2,65],54:[2,65],63:[2,65],64:[2,65],65:[2,65],68:[2,65],69:[2,65],70:[2,65],71:[2,65],74:[2,65],76:[2,65],80:[2,65],81:[2,65],82:[2,65],87:[2,65],89:[2,65],98:[2,65],100:[2,65],101:[2,65],102:[2,65],106:[2,65],114:[2,65],122:[2,65],124:[2,65],125:[2,65],126:[2,65],127:[2,65],128:[2,65],129:[2,65],130:[2,65],131:[2,65],132:[2,65],133:[2,65],134:[2,65]},{8:148,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:149,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:150,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{5:151,8:152,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,5],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{27:157,28:[1,70],55:158,56:159,61:153,72:[1,67],86:[1,54],109:154,110:[1,155],111:156},{108:160,112:[1,161],113:[1,162]},{6:[2,84],12:166,25:[2,84],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:164,39:165,41:169,43:[1,46],51:[2,84],73:163,74:[2,84],85:[1,112]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],40:[2,27],46:[2,27],51:[2,27],54:[2,27],63:[2,27],64:[2,27],65:[2,27],68:[2,27],69:[2,27],70:[2,27],71:[2,27],74:[2,27],80:[2,27],81:[2,27],82:[2,27],87:[2,27],89:[2,27],98:[2,27],100:[2,27],101:[2,27],102:[2,27],106:[2,27],114:[2,27],122:[2,27],124:[2,27],125:[2,27],128:[2,27],129:[2,27],130:[2,27],131:[2,27],132:[2,27],133:[2,27]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],40:[2,28],46:[2,28],51:[2,28],54:[2,28],63:[2,28],64:[2,28],65:[2,28],68:[2,28],69:[2,28],70:[2,28],71:[2,28],74:[2,28],80:[2,28],81:[2,28],82:[2,28],87:[2,28],89:[2,28],98:[2,28],100:[2,28],101:[2,28],102:[2,28],106:[2,28],114:[2,28],122:[2,28],124:[2,28],125:[2,28],128:[2,28],129:[2,28],130:[2,28],131:[2,28],132:[2,28],133:[2,28]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],37:[2,26],40:[2,26],46:[2,26],51:[2,26],54:[2,26],63:[2,26],64:[2,26],65:[2,26],68:[2,26],69:[2,26],70:[2,26],71:[2,26],74:[2,26],76:[2,26],80:[2,26],81:[2,26],82:[2,26],87:[2,26],89:[2,26],98:[2,26],100:[2,26],101:[2,26],102:[2,26],106:[2,26],112:[2,26],113:[2,26],114:[2,26],122:[2,26],124:[2,26],125:[2,26],126:[2,26],127:[2,26],128:[2,26],129:[2,26],130:[2,26],131:[2,26],132:[2,26],133:[2,26],134:[2,26]},{1:[2,6],6:[2,6],7:170,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,26:[2,6],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],98:[2,6],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,3]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],46:[2,24],51:[2,24],54:[2,24],69:[2,24],74:[2,24],82:[2,24],87:[2,24],89:[2,24],94:[2,24],95:[2,24],98:[2,24],100:[2,24],101:[2,24],102:[2,24],106:[2,24],114:[2,24],117:[2,24],119:[2,24],122:[2,24],124:[2,24],125:[2,24],128:[2,24],129:[2,24],130:[2,24],131:[2,24],132:[2,24],133:[2,24]},{6:[1,71],26:[1,171]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],46:[2,183],51:[2,183],54:[2,183],69:[2,183],74:[2,183],82:[2,183],87:[2,183],89:[2,183],98:[2,183],100:[2,183],101:[2,183],102:[2,183],106:[2,183],114:[2,183],122:[2,183],124:[2,183],125:[2,183],128:[2,183],129:[2,183],130:[2,183],131:[2,183],132:[2,183],133:[2,183]},{8:172,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:173,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:174,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:175,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:176,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:177,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:178,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:179,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],46:[2,139],51:[2,139],54:[2,139],69:[2,139],74:[2,139],82:[2,139],87:[2,139],89:[2,139],98:[2,139],100:[2,139],101:[2,139],102:[2,139],106:[2,139],114:[2,139],122:[2,139],124:[2,139],125:[2,139],128:[2,139],129:[2,139],130:[2,139],131:[2,139],132:[2,139],133:[2,139]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],46:[2,144],51:[2,144],54:[2,144],69:[2,144],74:[2,144],82:[2,144],87:[2,144],89:[2,144],98:[2,144],100:[2,144],101:[2,144],102:[2,144],106:[2,144],114:[2,144],122:[2,144],124:[2,144],125:[2,144],128:[2,144],129:[2,144],130:[2,144],131:[2,144],132:[2,144],133:[2,144]},{8:180,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],46:[2,138],51:[2,138],54:[2,138],69:[2,138],74:[2,138],82:[2,138],87:[2,138],89:[2,138],98:[2,138],100:[2,138],101:[2,138],102:[2,138],106:[2,138],114:[2,138],122:[2,138],124:[2,138],125:[2,138],128:[2,138],129:[2,138],130:[2,138],131:[2,138],132:[2,138],133:[2,138]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],46:[2,143],51:[2,143],54:[2,143],69:[2,143],74:[2,143],82:[2,143],87:[2,143],89:[2,143],98:[2,143],100:[2,143],101:[2,143],102:[2,143],106:[2,143],114:[2,143],122:[2,143],124:[2,143],125:[2,143],128:[2,143],129:[2,143],130:[2,143],131:[2,143],132:[2,143],133:[2,143]},{78:181,81:[1,104]},{1:[2,63],6:[2,63],25:[2,63],26:[2,63],37:[2,63],46:[2,63],51:[2,63],54:[2,63],63:[2,63],64:[2,63],65:[2,63],68:[2,63],69:[2,63],70:[2,63],71:[2,63],74:[2,63],76:[2,63],80:[2,63],81:[2,63],82:[2,63],87:[2,63],89:[2,63],98:[2,63],100:[2,63],101:[2,63],102:[2,63],106:[2,63],114:[2,63],122:[2,63],124:[2,63],125:[2,63],126:[2,63],127:[2,63],128:[2,63],129:[2,63],130:[2,63],131:[2,63],132:[2,63],133:[2,63],134:[2,63]},{81:[2,102]},{27:182,28:[1,70]},{27:183,28:[1,70]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],27:184,28:[1,70],37:[2,77],46:[2,77],51:[2,77],54:[2,77],63:[2,77],64:[2,77],65:[2,77],68:[2,77],69:[2,77],70:[2,77],71:[2,77],74:[2,77],76:[2,77],80:[2,77],81:[2,77],82:[2,77],87:[2,77],89:[2,77],98:[2,77],100:[2,77],101:[2,77],102:[2,77],106:[2,77],114:[2,77],122:[2,77],124:[2,77],125:[2,77],126:[2,77],127:[2,77],128:[2,77],129:[2,77],130:[2,77],131:[2,77],132:[2,77],133:[2,77],134:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],37:[2,78],46:[2,78],51:[2,78],54:[2,78],63:[2,78],64:[2,78],65:[2,78],68:[2,78],69:[2,78],70:[2,78],71:[2,78],74:[2,78],76:[2,78],80:[2,78],81:[2,78],82:[2,78],87:[2,78],89:[2,78],98:[2,78],100:[2,78],101:[2,78],102:[2,78],106:[2,78],114:[2,78],122:[2,78],124:[2,78],125:[2,78],126:[2,78],127:[2,78],128:[2,78],129:[2,78],130:[2,78],131:[2,78],132:[2,78],133:[2,78],134:[2,78]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],37:[2,79],46:[2,79],51:[2,79],54:[2,79],63:[2,79],64:[2,79],65:[2,79],68:[2,79],69:[2,79],70:[2,79],71:[2,79],74:[2,79],76:[2,79],80:[2,79],81:[2,79],82:[2,79],87:[2,79],89:[2,79],98:[2,79],100:[2,79],101:[2,79],102:[2,79],106:[2,79],114:[2,79],122:[2,79],124:[2,79],125:[2,79],126:[2,79],127:[2,79],128:[2,79],129:[2,79],130:[2,79],131:[2,79],132:[2,79],133:[2,79],134:[2,79]},{8:185,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],54:[1,188],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],88:186,89:[1,187],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{66:189,68:[1,190],70:[1,98],71:[1,99]},{66:191,68:[1,190],70:[1,98],71:[1,99]},{78:192,81:[1,104]},{1:[2,64],6:[2,64],25:[2,64],26:[2,64],37:[2,64],46:[2,64],51:[2,64],54:[2,64],63:[2,64],64:[2,64],65:[2,64],68:[2,64],69:[2,64],70:[2,64],71:[2,64],74:[2,64],76:[2,64],80:[2,64],81:[2,64],82:[2,64],87:[2,64],89:[2,64],98:[2,64],100:[2,64],101:[2,64],102:[2,64],106:[2,64],114:[2,64],122:[2,64],124:[2,64],125:[2,64],126:[2,64],127:[2,64],128:[2,64],129:[2,64],130:[2,64],131:[2,64],132:[2,64],133:[2,64],134:[2,64]},{8:193,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,194],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,100],6:[2,100],25:[2,100],26:[2,100],46:[2,100],51:[2,100],54:[2,100],63:[2,100],64:[2,100],65:[2,100],68:[2,100],69:[2,100],70:[2,100],71:[2,100],74:[2,100],80:[2,100],81:[2,100],82:[2,100],87:[2,100],89:[2,100],98:[2,100],100:[2,100],101:[2,100],102:[2,100],106:[2,100],114:[2,100],122:[2,100],124:[2,100],125:[2,100],128:[2,100],129:[2,100],130:[2,100],131:[2,100],132:[2,100],133:[2,100]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],82:[1,195],83:196,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{46:[1,198],51:[1,199]},{46:[2,52],51:[2,52]},{37:[1,201],46:[2,54],51:[2,54],54:[1,200]},{37:[2,57],46:[2,57],51:[2,57],54:[2,57]},{37:[2,58],46:[2,58],51:[2,58],54:[2,58]},{37:[2,59],46:[2,59],51:[2,59],54:[2,59]},{37:[2,60],46:[2,60],51:[2,60],54:[2,60]},{27:147,28:[1,70]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:143,84:[1,55],85:[1,56],86:[1,54],87:[1,142],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,46],6:[2,46],25:[2,46],26:[2,46],46:[2,46],51:[2,46],54:[2,46],69:[2,46],74:[2,46],82:[2,46],87:[2,46],89:[2,46],98:[2,46],100:[2,46],101:[2,46],102:[2,46],106:[2,46],114:[2,46],122:[2,46],124:[2,46],125:[2,46],128:[2,46],129:[2,46],130:[2,46],131:[2,46],132:[2,46],133:[2,46]},{1:[2,176],6:[2,176],25:[2,176],26:[2,176],46:[2,176],51:[2,176],54:[2,176],69:[2,176],74:[2,176],82:[2,176],87:[2,176],89:[2,176],98:[2,176],99:84,100:[2,176],101:[2,176],102:[2,176],105:85,106:[2,176],107:66,114:[2,176],122:[2,176],124:[2,176],125:[2,176],128:[1,75],129:[2,176],130:[2,176],131:[2,176],132:[2,176],133:[2,176]},{99:87,100:[1,62],102:[1,63],105:88,106:[1,65],107:66,122:[1,86]},{1:[2,177],6:[2,177],25:[2,177],26:[2,177],46:[2,177],51:[2,177],54:[2,177],69:[2,177],74:[2,177],82:[2,177],87:[2,177],89:[2,177],98:[2,177],99:84,100:[2,177],101:[2,177],102:[2,177],105:85,106:[2,177],107:66,114:[2,177],122:[2,177],124:[2,177],125:[2,177],128:[1,75],129:[2,177],130:[2,177],131:[2,177],132:[2,177],133:[2,177]},{1:[2,178],6:[2,178],25:[2,178],26:[2,178],46:[2,178],51:[2,178],54:[2,178],69:[2,178],74:[2,178],82:[2,178],87:[2,178],89:[2,178],98:[2,178],99:84,100:[2,178],101:[2,178],102:[2,178],105:85,106:[2,178],107:66,114:[2,178],122:[2,178],124:[2,178],125:[2,178],128:[1,75],129:[2,178],130:[2,178],131:[2,178],132:[2,178],133:[2,178]},{1:[2,179],6:[2,179],25:[2,179],26:[2,179],46:[2,179],51:[2,179],54:[2,179],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,179],70:[2,66],71:[2,66],74:[2,179],80:[2,66],81:[2,66],82:[2,179],87:[2,179],89:[2,179],98:[2,179],100:[2,179],101:[2,179],102:[2,179],106:[2,179],114:[2,179],122:[2,179],124:[2,179],125:[2,179],128:[2,179],129:[2,179],130:[2,179],131:[2,179],132:[2,179],133:[2,179]},{59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],70:[1,98],71:[1,99],77:89,80:[1,91],81:[2,101]},{59:101,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],70:[1,98],71:[1,99],77:100,80:[1,91],81:[2,101]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],46:[2,69],51:[2,69],54:[2,69],63:[2,69],64:[2,69],65:[2,69],68:[2,69],69:[2,69],70:[2,69],71:[2,69],74:[2,69],80:[2,69],81:[2,69],82:[2,69],87:[2,69],89:[2,69],98:[2,69],100:[2,69],101:[2,69],102:[2,69],106:[2,69],114:[2,69],122:[2,69],124:[2,69],125:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69]},{1:[2,180],6:[2,180],25:[2,180],26:[2,180],46:[2,180],51:[2,180],54:[2,180],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,180],70:[2,66],71:[2,66],74:[2,180],80:[2,66],81:[2,66],82:[2,180],87:[2,180],89:[2,180],98:[2,180],100:[2,180],101:[2,180],102:[2,180],106:[2,180],114:[2,180],122:[2,180],124:[2,180],125:[2,180],128:[2,180],129:[2,180],130:[2,180],131:[2,180],132:[2,180],133:[2,180]},{1:[2,181],6:[2,181],25:[2,181],26:[2,181],46:[2,181],51:[2,181],54:[2,181],69:[2,181],74:[2,181],82:[2,181],87:[2,181],89:[2,181],98:[2,181],100:[2,181],101:[2,181],102:[2,181],106:[2,181],114:[2,181],122:[2,181],124:[2,181],125:[2,181],128:[2,181],129:[2,181],130:[2,181],131:[2,181],132:[2,181],133:[2,181]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],46:[2,182],51:[2,182],54:[2,182],69:[2,182],74:[2,182],82:[2,182],87:[2,182],89:[2,182],98:[2,182],100:[2,182],101:[2,182],102:[2,182],106:[2,182],114:[2,182],122:[2,182],124:[2,182],125:[2,182],128:[2,182],129:[2,182],130:[2,182],131:[2,182],132:[2,182],133:[2,182]},{8:202,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,203],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:204,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{5:205,25:[1,5],121:[1,206]},{1:[2,125],6:[2,125],25:[2,125],26:[2,125],46:[2,125],51:[2,125],54:[2,125],69:[2,125],74:[2,125],82:[2,125],87:[2,125],89:[2,125],93:207,94:[1,208],95:[1,209],98:[2,125],100:[2,125],101:[2,125],102:[2,125],106:[2,125],114:[2,125],122:[2,125],124:[2,125],125:[2,125],128:[2,125],129:[2,125],130:[2,125],131:[2,125],132:[2,125],133:[2,125]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],46:[2,137],51:[2,137],54:[2,137],69:[2,137],74:[2,137],82:[2,137],87:[2,137],89:[2,137],98:[2,137],100:[2,137],101:[2,137],102:[2,137],106:[2,137],114:[2,137],122:[2,137],124:[2,137],125:[2,137],128:[2,137],129:[2,137],130:[2,137],131:[2,137],132:[2,137],133:[2,137]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],46:[2,145],51:[2,145],54:[2,145],69:[2,145],74:[2,145],82:[2,145],87:[2,145],89:[2,145],98:[2,145],100:[2,145],101:[2,145],102:[2,145],106:[2,145],114:[2,145],122:[2,145],124:[2,145],125:[2,145],128:[2,145],129:[2,145],130:[2,145],131:[2,145],132:[2,145],133:[2,145]},{25:[1,210],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{116:211,118:212,119:[1,213]},{1:[2,90],6:[2,90],25:[2,90],26:[2,90],46:[2,90],51:[2,90],54:[2,90],69:[2,90],74:[2,90],82:[2,90],87:[2,90],89:[2,90],98:[2,90],100:[2,90],101:[2,90],102:[2,90],106:[2,90],114:[2,90],122:[2,90],124:[2,90],125:[2,90],128:[2,90],129:[2,90],130:[2,90],131:[2,90],132:[2,90],133:[2,90]},{14:214,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:215,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,93],5:216,6:[2,93],25:[1,5],26:[2,93],46:[2,93],51:[2,93],54:[2,93],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,93],70:[2,66],71:[2,66],74:[2,93],76:[1,217],80:[2,66],81:[2,66],82:[2,93],87:[2,93],89:[2,93],98:[2,93],100:[2,93],101:[2,93],102:[2,93],106:[2,93],114:[2,93],122:[2,93],124:[2,93],125:[2,93],128:[2,93],129:[2,93],130:[2,93],131:[2,93],132:[2,93],133:[2,93]},{1:[2,42],6:[2,42],26:[2,42],98:[2,42],99:84,100:[2,42],102:[2,42],105:85,106:[2,42],107:66,122:[2,42],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,130],6:[2,130],26:[2,130],98:[2,130],99:84,100:[2,130],102:[2,130],105:85,106:[2,130],107:66,122:[2,130],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,71],98:[1,218]},{4:219,7:4,8:6,9:7,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,121],25:[2,121],51:[2,121],54:[1,221],87:[2,121],88:220,89:[1,187],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,108],6:[2,108],25:[2,108],26:[2,108],37:[2,108],46:[2,108],51:[2,108],54:[2,108],63:[2,108],64:[2,108],65:[2,108],68:[2,108],69:[2,108],70:[2,108],71:[2,108],74:[2,108],80:[2,108],81:[2,108],82:[2,108],87:[2,108],89:[2,108],98:[2,108],100:[2,108],101:[2,108],102:[2,108],106:[2,108],112:[2,108],113:[2,108],114:[2,108],122:[2,108],124:[2,108],125:[2,108],128:[2,108],129:[2,108],130:[2,108],131:[2,108],132:[2,108],133:[2,108]},{6:[2,49],25:[2,49],50:222,51:[1,223],87:[2,49]},{6:[2,116],25:[2,116],26:[2,116],51:[2,116],82:[2,116],87:[2,116]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:224,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,122],25:[2,122],26:[2,122],51:[2,122],82:[2,122],87:[2,122]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],37:[2,107],40:[2,107],46:[2,107],51:[2,107],54:[2,107],63:[2,107],64:[2,107],65:[2,107],68:[2,107],69:[2,107],70:[2,107],71:[2,107],74:[2,107],76:[2,107],80:[2,107],81:[2,107],82:[2,107],87:[2,107],89:[2,107],98:[2,107],100:[2,107],101:[2,107],102:[2,107],106:[2,107],114:[2,107],122:[2,107],124:[2,107],125:[2,107],126:[2,107],127:[2,107],128:[2,107],129:[2,107],130:[2,107],131:[2,107],132:[2,107],133:[2,107],134:[2,107]},{5:225,25:[1,5],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,133],6:[2,133],25:[2,133],26:[2,133],46:[2,133],51:[2,133],54:[2,133],69:[2,133],74:[2,133],82:[2,133],87:[2,133],89:[2,133],98:[2,133],99:84,100:[1,62],101:[1,226],102:[1,63],105:85,106:[1,65],107:66,114:[2,133],122:[2,133],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],46:[2,135],51:[2,135],54:[2,135],69:[2,135],74:[2,135],82:[2,135],87:[2,135],89:[2,135],98:[2,135],99:84,100:[1,62],101:[1,227],102:[1,63],105:85,106:[1,65],107:66,114:[2,135],122:[2,135],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],46:[2,141],51:[2,141],54:[2,141],69:[2,141],74:[2,141],82:[2,141],87:[2,141],89:[2,141],98:[2,141],100:[2,141],101:[2,141],102:[2,141],106:[2,141],114:[2,141],122:[2,141],124:[2,141],125:[2,141],128:[2,141],129:[2,141],130:[2,141],131:[2,141],132:[2,141],133:[2,141]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],46:[2,142],51:[2,142],54:[2,142],69:[2,142],74:[2,142],82:[2,142],87:[2,142],89:[2,142],98:[2,142],99:84,100:[1,62],101:[2,142],102:[1,63],105:85,106:[1,65],107:66,114:[2,142],122:[2,142],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],46:[2,146],51:[2,146],54:[2,146],69:[2,146],74:[2,146],82:[2,146],87:[2,146],89:[2,146],98:[2,146],100:[2,146],101:[2,146],102:[2,146],106:[2,146],114:[2,146],122:[2,146],124:[2,146],125:[2,146],128:[2,146],129:[2,146],130:[2,146],131:[2,146],132:[2,146],133:[2,146]},{112:[2,148],113:[2,148]},{27:157,28:[1,70],55:158,56:159,72:[1,67],86:[1,113],109:228,111:156},{51:[1,229],112:[2,153],113:[2,153]},{51:[2,150],112:[2,150],113:[2,150]},{51:[2,151],112:[2,151],113:[2,151]},{51:[2,152],112:[2,152],113:[2,152]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],46:[2,147],51:[2,147],54:[2,147],69:[2,147],74:[2,147],82:[2,147],87:[2,147],89:[2,147],98:[2,147],100:[2,147],101:[2,147],102:[2,147],106:[2,147],114:[2,147],122:[2,147],124:[2,147],125:[2,147],128:[2,147],129:[2,147],130:[2,147],131:[2,147],132:[2,147],133:[2,147]},{8:230,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:231,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,49],25:[2,49],50:232,51:[1,233],74:[2,49]},{6:[2,85],25:[2,85],26:[2,85],51:[2,85],74:[2,85]},{6:[2,35],25:[2,35],26:[2,35],40:[1,234],51:[2,35],74:[2,35]},{6:[2,38],25:[2,38],26:[2,38],51:[2,38],74:[2,38]},{6:[2,39],25:[2,39],26:[2,39],40:[2,39],51:[2,39],74:[2,39]},{6:[2,40],25:[2,40],26:[2,40],40:[2,40],51:[2,40],74:[2,40]},{6:[2,41],25:[2,41],26:[2,41],40:[2,41],51:[2,41],74:[2,41]},{1:[2,5],6:[2,5],26:[2,5],98:[2,5]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],46:[2,25],51:[2,25],54:[2,25],69:[2,25],74:[2,25],82:[2,25],87:[2,25],89:[2,25],94:[2,25],95:[2,25],98:[2,25],100:[2,25],101:[2,25],102:[2,25],106:[2,25],114:[2,25],117:[2,25],119:[2,25],122:[2,25],124:[2,25],125:[2,25],128:[2,25],129:[2,25],130:[2,25],131:[2,25],132:[2,25],133:[2,25]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],46:[2,184],51:[2,184],54:[2,184],69:[2,184],74:[2,184],82:[2,184],87:[2,184],89:[2,184],98:[2,184],99:84,100:[2,184],101:[2,184],102:[2,184],105:85,106:[2,184],107:66,114:[2,184],122:[2,184],124:[2,184],125:[2,184],128:[1,75],129:[1,78],130:[2,184],131:[2,184],132:[2,184],133:[2,184]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],46:[2,185],51:[2,185],54:[2,185],69:[2,185],74:[2,185],82:[2,185],87:[2,185],89:[2,185],98:[2,185],99:84,100:[2,185],101:[2,185],102:[2,185],105:85,106:[2,185],107:66,114:[2,185],122:[2,185],124:[2,185],125:[2,185],128:[1,75],129:[1,78],130:[2,185],131:[2,185],132:[2,185],133:[2,185]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],46:[2,186],51:[2,186],54:[2,186],69:[2,186],74:[2,186],82:[2,186],87:[2,186],89:[2,186],98:[2,186],99:84,100:[2,186],101:[2,186],102:[2,186],105:85,106:[2,186],107:66,114:[2,186],122:[2,186],124:[2,186],125:[2,186],128:[1,75],129:[2,186],130:[2,186],131:[2,186],132:[2,186],133:[2,186]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],46:[2,187],51:[2,187],54:[2,187],69:[2,187],74:[2,187],82:[2,187],87:[2,187],89:[2,187],98:[2,187],99:84,100:[2,187],101:[2,187],102:[2,187],105:85,106:[2,187],107:66,114:[2,187],122:[2,187],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[2,187],131:[2,187],132:[2,187],133:[2,187]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],46:[2,188],51:[2,188],54:[2,188],69:[2,188],74:[2,188],82:[2,188],87:[2,188],89:[2,188],98:[2,188],99:84,100:[2,188],101:[2,188],102:[2,188],105:85,106:[2,188],107:66,114:[2,188],122:[2,188],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[2,188],132:[2,188],133:[1,82]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],46:[2,189],51:[2,189],54:[2,189],69:[2,189],74:[2,189],82:[2,189],87:[2,189],89:[2,189],98:[2,189],99:84,100:[2,189],101:[2,189],102:[2,189],105:85,106:[2,189],107:66,114:[2,189],122:[2,189],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[2,189],133:[1,82]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],46:[2,190],51:[2,190],54:[2,190],69:[2,190],74:[2,190],82:[2,190],87:[2,190],89:[2,190],98:[2,190],99:84,100:[2,190],101:[2,190],102:[2,190],105:85,106:[2,190],107:66,114:[2,190],122:[2,190],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[2,190],132:[2,190],133:[2,190]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],46:[2,175],51:[2,175],54:[2,175],69:[2,175],74:[2,175],82:[2,175],87:[2,175],89:[2,175],98:[2,175],99:84,100:[1,62],101:[2,175],102:[1,63],105:85,106:[1,65],107:66,114:[2,175],122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],46:[2,174],51:[2,174],54:[2,174],69:[2,174],74:[2,174],82:[2,174],87:[2,174],89:[2,174],98:[2,174],99:84,100:[1,62],101:[2,174],102:[1,63],105:85,106:[1,65],107:66,114:[2,174],122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],46:[2,97],51:[2,97],54:[2,97],63:[2,97],64:[2,97],65:[2,97],68:[2,97],69:[2,97],70:[2,97],71:[2,97],74:[2,97],80:[2,97],81:[2,97],82:[2,97],87:[2,97],89:[2,97],98:[2,97],100:[2,97],101:[2,97],102:[2,97],106:[2,97],114:[2,97],122:[2,97],124:[2,97],125:[2,97],128:[2,97],129:[2,97],130:[2,97],131:[2,97],132:[2,97],133:[2,97]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],37:[2,74],46:[2,74],51:[2,74],54:[2,74],63:[2,74],64:[2,74],65:[2,74],68:[2,74],69:[2,74],70:[2,74],71:[2,74],74:[2,74],76:[2,74],80:[2,74],81:[2,74],82:[2,74],87:[2,74],89:[2,74],98:[2,74],100:[2,74],101:[2,74],102:[2,74],106:[2,74],114:[2,74],122:[2,74],124:[2,74],125:[2,74],126:[2,74],127:[2,74],128:[2,74],129:[2,74],130:[2,74],131:[2,74],132:[2,74],133:[2,74],134:[2,74]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],37:[2,75],46:[2,75],51:[2,75],54:[2,75],63:[2,75],64:[2,75],65:[2,75],68:[2,75],69:[2,75],70:[2,75],71:[2,75],74:[2,75],76:[2,75],80:[2,75],81:[2,75],82:[2,75],87:[2,75],89:[2,75],98:[2,75],100:[2,75],101:[2,75],102:[2,75],106:[2,75],114:[2,75],122:[2,75],124:[2,75],125:[2,75],126:[2,75],127:[2,75],128:[2,75],129:[2,75],130:[2,75],131:[2,75],132:[2,75],133:[2,75],134:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],37:[2,76],46:[2,76],51:[2,76],54:[2,76],63:[2,76],64:[2,76],65:[2,76],68:[2,76],69:[2,76],70:[2,76],71:[2,76],74:[2,76],76:[2,76],80:[2,76],81:[2,76],82:[2,76],87:[2,76],89:[2,76],98:[2,76],100:[2,76],101:[2,76],102:[2,76],106:[2,76],114:[2,76],122:[2,76],124:[2,76],125:[2,76],126:[2,76],127:[2,76],128:[2,76],129:[2,76],130:[2,76],131:[2,76],132:[2,76],133:[2,76],134:[2,76]},{54:[1,188],69:[1,235],88:236,89:[1,187],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:237,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{13:[2,110],28:[2,110],30:[2,110],31:[2,110],33:[2,110],34:[2,110],35:[2,110],42:[2,110],43:[2,110],44:[2,110],48:[2,110],49:[2,110],69:[2,110],72:[2,110],75:[2,110],79:[2,110],84:[2,110],85:[2,110],86:[2,110],92:[2,110],96:[2,110],97:[2,110],100:[2,110],102:[2,110],104:[2,110],106:[2,110],115:[2,110],121:[2,110],123:[2,110],124:[2,110],125:[2,110],126:[2,110],127:[2,110]},{13:[2,111],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],69:[2,111],72:[2,111],75:[2,111],79:[2,111],84:[2,111],85:[2,111],86:[2,111],92:[2,111],96:[2,111],97:[2,111],100:[2,111],102:[2,111],104:[2,111],106:[2,111],115:[2,111],121:[2,111],123:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],37:[2,81],46:[2,81],51:[2,81],54:[2,81],63:[2,81],64:[2,81],65:[2,81],68:[2,81],69:[2,81],70:[2,81],71:[2,81],74:[2,81],76:[2,81],80:[2,81],81:[2,81],82:[2,81],87:[2,81],89:[2,81],98:[2,81],100:[2,81],101:[2,81],102:[2,81],106:[2,81],114:[2,81],122:[2,81],124:[2,81],125:[2,81],126:[2,81],127:[2,81],128:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81]},{8:238,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,82],6:[2,82],25:[2,82],26:[2,82],37:[2,82],46:[2,82],51:[2,82],54:[2,82],63:[2,82],64:[2,82],65:[2,82],68:[2,82],69:[2,82],70:[2,82],71:[2,82],74:[2,82],76:[2,82],80:[2,82],81:[2,82],82:[2,82],87:[2,82],89:[2,82],98:[2,82],100:[2,82],101:[2,82],102:[2,82],106:[2,82],114:[2,82],122:[2,82],124:[2,82],125:[2,82],126:[2,82],127:[2,82],128:[2,82],129:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82]},{1:[2,98],6:[2,98],25:[2,98],26:[2,98],46:[2,98],51:[2,98],54:[2,98],63:[2,98],64:[2,98],65:[2,98],68:[2,98],69:[2,98],70:[2,98],71:[2,98],74:[2,98],80:[2,98],81:[2,98],82:[2,98],87:[2,98],89:[2,98],98:[2,98],100:[2,98],101:[2,98],102:[2,98],106:[2,98],114:[2,98],122:[2,98],124:[2,98],125:[2,98],128:[2,98],129:[2,98],130:[2,98],131:[2,98],132:[2,98],133:[2,98]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],46:[2,33],51:[2,33],54:[2,33],69:[2,33],74:[2,33],82:[2,33],87:[2,33],89:[2,33],98:[2,33],99:84,100:[2,33],101:[2,33],102:[2,33],105:85,106:[2,33],107:66,114:[2,33],122:[2,33],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:239,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,103],6:[2,103],25:[2,103],26:[2,103],46:[2,103],51:[2,103],54:[2,103],63:[2,103],64:[2,103],65:[2,103],68:[2,103],69:[2,103],70:[2,103],71:[2,103],74:[2,103],80:[2,103],81:[2,103],82:[2,103],87:[2,103],89:[2,103],98:[2,103],100:[2,103],101:[2,103],102:[2,103],106:[2,103],114:[2,103],122:[2,103],124:[2,103],125:[2,103],128:[2,103],129:[2,103],130:[2,103],131:[2,103],132:[2,103],133:[2,103]},{6:[2,49],25:[2,49],50:240,51:[1,223],82:[2,49]},{6:[2,121],25:[2,121],26:[2,121],51:[2,121],54:[1,241],82:[2,121],87:[2,121],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{47:242,48:[1,57],49:[1,58]},{27:108,28:[1,70],41:109,52:243,53:107,55:110,56:111,72:[1,67],85:[1,112],86:[1,113]},{46:[2,55],51:[2,55]},{8:244,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],46:[2,191],51:[2,191],54:[2,191],69:[2,191],74:[2,191],82:[2,191],87:[2,191],89:[2,191],98:[2,191],99:84,100:[2,191],101:[2,191],102:[2,191],105:85,106:[2,191],107:66,114:[2,191],122:[2,191],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:245,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],46:[2,193],51:[2,193],54:[2,193],69:[2,193],74:[2,193],82:[2,193],87:[2,193],89:[2,193],98:[2,193],99:84,100:[2,193],101:[2,193],102:[2,193],105:85,106:[2,193],107:66,114:[2,193],122:[2,193],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],46:[2,173],51:[2,173],54:[2,173],69:[2,173],74:[2,173],82:[2,173],87:[2,173],89:[2,173],98:[2,173],100:[2,173],101:[2,173],102:[2,173],106:[2,173],114:[2,173],122:[2,173],124:[2,173],125:[2,173],128:[2,173],129:[2,173],130:[2,173],131:[2,173],132:[2,173],133:[2,173]},{8:246,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,126],6:[2,126],25:[2,126],26:[2,126],46:[2,126],51:[2,126],54:[2,126],69:[2,126],74:[2,126],82:[2,126],87:[2,126],89:[2,126],94:[1,247],98:[2,126],100:[2,126],101:[2,126],102:[2,126],106:[2,126],114:[2,126],122:[2,126],124:[2,126],125:[2,126],128:[2,126],129:[2,126],130:[2,126],131:[2,126],132:[2,126],133:[2,126]},{5:248,25:[1,5]},{27:249,28:[1,70]},{116:250,118:212,119:[1,213]},{26:[1,251],117:[1,252],118:253,119:[1,213]},{26:[2,166],117:[2,166],119:[2,166]},{8:255,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],91:254,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,91],5:256,6:[2,91],25:[1,5],26:[2,91],46:[2,91],51:[2,91],54:[2,91],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,91],70:[1,98],71:[1,99],74:[2,91],77:89,80:[1,91],81:[2,101],82:[2,91],87:[2,91],89:[2,91],98:[2,91],100:[2,91],101:[2,91],102:[2,91],106:[2,91],114:[2,91],122:[2,91],124:[2,91],125:[2,91],128:[2,91],129:[2,91],130:[2,91],131:[2,91],132:[2,91],133:[2,91]},{1:[2,66],6:[2,66],25:[2,66],26:[2,66],46:[2,66],51:[2,66],54:[2,66],63:[2,66],64:[2,66],65:[2,66],68:[2,66],69:[2,66],70:[2,66],71:[2,66],74:[2,66],80:[2,66],81:[2,66],82:[2,66],87:[2,66],89:[2,66],98:[2,66],100:[2,66],101:[2,66],102:[2,66],106:[2,66],114:[2,66],122:[2,66],124:[2,66],125:[2,66],128:[2,66],129:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66]},{1:[2,94],6:[2,94],25:[2,94],26:[2,94],46:[2,94],51:[2,94],54:[2,94],69:[2,94],74:[2,94],82:[2,94],87:[2,94],89:[2,94],98:[2,94],100:[2,94],101:[2,94],102:[2,94],106:[2,94],114:[2,94],122:[2,94],124:[2,94],125:[2,94],128:[2,94],129:[2,94],130:[2,94],131:[2,94],132:[2,94],133:[2,94]},{14:257,15:121,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:122,41:60,55:47,56:48,58:215,60:25,61:26,62:27,72:[1,67],79:[1,28],84:[1,55],85:[1,56],86:[1,54],97:[1,53]},{1:[2,131],6:[2,131],25:[2,131],26:[2,131],46:[2,131],51:[2,131],54:[2,131],63:[2,131],64:[2,131],65:[2,131],68:[2,131],69:[2,131],70:[2,131],71:[2,131],74:[2,131],80:[2,131],81:[2,131],82:[2,131],87:[2,131],89:[2,131],98:[2,131],100:[2,131],101:[2,131],102:[2,131],106:[2,131],114:[2,131],122:[2,131],124:[2,131],125:[2,131],128:[2,131],129:[2,131],130:[2,131],131:[2,131],132:[2,131],133:[2,131]},{6:[1,71],26:[1,258]},{8:259,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,61],13:[2,111],25:[2,61],28:[2,111],30:[2,111],31:[2,111],33:[2,111],34:[2,111],35:[2,111],42:[2,111],43:[2,111],44:[2,111],48:[2,111],49:[2,111],51:[2,61],72:[2,111],75:[2,111],79:[2,111],84:[2,111],85:[2,111],86:[2,111],87:[2,61],92:[2,111],96:[2,111],97:[2,111],100:[2,111],102:[2,111],104:[2,111],106:[2,111],115:[2,111],121:[2,111],123:[2,111],124:[2,111],125:[2,111],126:[2,111],127:[2,111]},{6:[1,261],25:[1,262],87:[1,260]},{6:[2,50],8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[2,50],26:[2,50],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],82:[2,50],84:[1,55],85:[1,56],86:[1,54],87:[2,50],90:263,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,49],25:[2,49],26:[2,49],50:264,51:[1,223]},{1:[2,170],6:[2,170],25:[2,170],26:[2,170],46:[2,170],51:[2,170],54:[2,170],69:[2,170],74:[2,170],82:[2,170],87:[2,170],89:[2,170],98:[2,170],100:[2,170],101:[2,170],102:[2,170],106:[2,170],114:[2,170],117:[2,170],122:[2,170],124:[2,170],125:[2,170],128:[2,170],129:[2,170],130:[2,170],131:[2,170],132:[2,170],133:[2,170]},{8:265,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:266,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{112:[2,149],113:[2,149]},{27:157,28:[1,70],55:158,56:159,72:[1,67],86:[1,113],111:267},{1:[2,155],6:[2,155],25:[2,155],26:[2,155],46:[2,155],51:[2,155],54:[2,155],69:[2,155],74:[2,155],82:[2,155],87:[2,155],89:[2,155],98:[2,155],99:84,100:[2,155],101:[1,268],102:[2,155],105:85,106:[2,155],107:66,114:[1,269],122:[2,155],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],46:[2,156],51:[2,156],54:[2,156],69:[2,156],74:[2,156],82:[2,156],87:[2,156],89:[2,156],98:[2,156],99:84,100:[2,156],101:[1,270],102:[2,156],105:85,106:[2,156],107:66,114:[2,156],122:[2,156],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,272],25:[1,273],74:[1,271]},{6:[2,50],12:166,25:[2,50],26:[2,50],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:274,39:165,41:169,43:[1,46],74:[2,50],85:[1,112]},{8:275,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,276],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],37:[2,80],46:[2,80],51:[2,80],54:[2,80],63:[2,80],64:[2,80],65:[2,80],68:[2,80],69:[2,80],70:[2,80],71:[2,80],74:[2,80],76:[2,80],80:[2,80],81:[2,80],82:[2,80],87:[2,80],89:[2,80],98:[2,80],100:[2,80],101:[2,80],102:[2,80],106:[2,80],114:[2,80],122:[2,80],124:[2,80],125:[2,80],126:[2,80],127:[2,80],128:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80]},{8:277,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,69:[1,278],72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{69:[1,279],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{69:[1,235],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{26:[1,280],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,261],25:[1,262],82:[1,281]},{6:[2,61],25:[2,61],26:[2,61],51:[2,61],82:[2,61],87:[2,61]},{5:282,25:[1,5]},{46:[2,53],51:[2,53]},{46:[2,56],51:[2,56],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{26:[1,283],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{5:284,25:[1,5],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{5:285,25:[1,5]},{1:[2,127],6:[2,127],25:[2,127],26:[2,127],46:[2,127],51:[2,127],54:[2,127],69:[2,127],74:[2,127],82:[2,127],87:[2,127],89:[2,127],98:[2,127],100:[2,127],101:[2,127],102:[2,127],106:[2,127],114:[2,127],122:[2,127],124:[2,127],125:[2,127],128:[2,127],129:[2,127],130:[2,127],131:[2,127],132:[2,127],133:[2,127]},{5:286,25:[1,5]},{26:[1,287],117:[1,288],118:253,119:[1,213]},{1:[2,164],6:[2,164],25:[2,164],26:[2,164],46:[2,164],51:[2,164],54:[2,164],69:[2,164],74:[2,164],82:[2,164],87:[2,164],89:[2,164],98:[2,164],100:[2,164],101:[2,164],102:[2,164],106:[2,164],114:[2,164],122:[2,164],124:[2,164],125:[2,164],128:[2,164],129:[2,164],130:[2,164],131:[2,164],132:[2,164],133:[2,164]},{5:289,25:[1,5]},{26:[2,167],117:[2,167],119:[2,167]},{5:290,25:[1,5],51:[1,291]},{25:[2,123],51:[2,123],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,92],6:[2,92],25:[2,92],26:[2,92],46:[2,92],51:[2,92],54:[2,92],69:[2,92],74:[2,92],82:[2,92],87:[2,92],89:[2,92],98:[2,92],100:[2,92],101:[2,92],102:[2,92],106:[2,92],114:[2,92],122:[2,92],124:[2,92],125:[2,92],128:[2,92],129:[2,92],130:[2,92],131:[2,92],132:[2,92],133:[2,92]},{1:[2,95],5:292,6:[2,95],25:[1,5],26:[2,95],46:[2,95],51:[2,95],54:[2,95],59:90,63:[1,92],64:[1,93],65:[1,94],66:95,67:96,68:[1,97],69:[2,95],70:[1,98],71:[1,99],74:[2,95],77:89,80:[1,91],81:[2,101],82:[2,95],87:[2,95],89:[2,95],98:[2,95],100:[2,95],101:[2,95],102:[2,95],106:[2,95],114:[2,95],122:[2,95],124:[2,95],125:[2,95],128:[2,95],129:[2,95],130:[2,95],131:[2,95],132:[2,95],133:[2,95]},{98:[1,293]},{87:[1,294],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,109],6:[2,109],25:[2,109],26:[2,109],37:[2,109],46:[2,109],51:[2,109],54:[2,109],63:[2,109],64:[2,109],65:[2,109],68:[2,109],69:[2,109],70:[2,109],71:[2,109],74:[2,109],80:[2,109],81:[2,109],82:[2,109],87:[2,109],89:[2,109],98:[2,109],100:[2,109],101:[2,109],102:[2,109],106:[2,109],112:[2,109],113:[2,109],114:[2,109],122:[2,109],124:[2,109],125:[2,109],128:[2,109],129:[2,109],130:[2,109],131:[2,109],132:[2,109],133:[2,109]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],90:295,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:197,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:[1,145],27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,57:146,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],83:296,84:[1,55],85:[1,56],86:[1,54],90:144,92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[2,117],25:[2,117],26:[2,117],51:[2,117],82:[2,117],87:[2,117]},{6:[1,261],25:[1,262],26:[1,297]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],46:[2,134],51:[2,134],54:[2,134],69:[2,134],74:[2,134],82:[2,134],87:[2,134],89:[2,134],98:[2,134],99:84,100:[1,62],101:[2,134],102:[1,63],105:85,106:[1,65],107:66,114:[2,134],122:[2,134],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],46:[2,136],51:[2,136],54:[2,136],69:[2,136],74:[2,136],82:[2,136],87:[2,136],89:[2,136],98:[2,136],99:84,100:[1,62],101:[2,136],102:[1,63],105:85,106:[1,65],107:66,114:[2,136],122:[2,136],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{112:[2,154],113:[2,154]},{8:298,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:299,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:300,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,83],6:[2,83],25:[2,83],26:[2,83],37:[2,83],46:[2,83],51:[2,83],54:[2,83],63:[2,83],64:[2,83],65:[2,83],68:[2,83],69:[2,83],70:[2,83],71:[2,83],74:[2,83],80:[2,83],81:[2,83],82:[2,83],87:[2,83],89:[2,83],98:[2,83],100:[2,83],101:[2,83],102:[2,83],106:[2,83],112:[2,83],113:[2,83],114:[2,83],122:[2,83],124:[2,83],125:[2,83],128:[2,83],129:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83]},{12:166,27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:301,39:165,41:169,43:[1,46],85:[1,112]},{6:[2,84],12:166,25:[2,84],26:[2,84],27:167,28:[1,70],29:168,30:[1,68],31:[1,69],38:164,39:165,41:169,43:[1,46],51:[2,84],73:302,85:[1,112]},{6:[2,86],25:[2,86],26:[2,86],51:[2,86],74:[2,86]},{6:[2,36],25:[2,36],26:[2,36],51:[2,36],74:[2,36],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{8:303,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{69:[1,304],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,114],6:[2,114],25:[2,114],26:[2,114],37:[2,114],46:[2,114],51:[2,114],54:[2,114],63:[2,114],64:[2,114],65:[2,114],68:[2,114],69:[2,114],70:[2,114],71:[2,114],74:[2,114],76:[2,114],80:[2,114],81:[2,114],82:[2,114],87:[2,114],89:[2,114],98:[2,114],100:[2,114],101:[2,114],102:[2,114],106:[2,114],114:[2,114],122:[2,114],124:[2,114],125:[2,114],126:[2,114],127:[2,114],128:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114],134:[2,114]},{1:[2,115],6:[2,115],25:[2,115],26:[2,115],37:[2,115],46:[2,115],51:[2,115],54:[2,115],63:[2,115],64:[2,115],65:[2,115],68:[2,115],69:[2,115],70:[2,115],71:[2,115],74:[2,115],76:[2,115],80:[2,115],81:[2,115],82:[2,115],87:[2,115],89:[2,115],98:[2,115],100:[2,115],101:[2,115],102:[2,115],106:[2,115],114:[2,115],122:[2,115],124:[2,115],125:[2,115],126:[2,115],127:[2,115],128:[2,115],129:[2,115],130:[2,115],131:[2,115],132:[2,115],133:[2,115],134:[2,115]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],46:[2,34],51:[2,34],54:[2,34],69:[2,34],74:[2,34],82:[2,34],87:[2,34],89:[2,34],98:[2,34],100:[2,34],101:[2,34],102:[2,34],106:[2,34],114:[2,34],122:[2,34],124:[2,34],125:[2,34],128:[2,34],129:[2,34],130:[2,34],131:[2,34],132:[2,34],133:[2,34]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],46:[2,104],51:[2,104],54:[2,104],63:[2,104],64:[2,104],65:[2,104],68:[2,104],69:[2,104],70:[2,104],71:[2,104],74:[2,104],80:[2,104],81:[2,104],82:[2,104],87:[2,104],89:[2,104],98:[2,104],100:[2,104],101:[2,104],102:[2,104],106:[2,104],114:[2,104],122:[2,104],124:[2,104],125:[2,104],128:[2,104],129:[2,104],130:[2,104],131:[2,104],132:[2,104],133:[2,104]},{1:[2,45],6:[2,45],25:[2,45],26:[2,45],46:[2,45],51:[2,45],54:[2,45],69:[2,45],74:[2,45],82:[2,45],87:[2,45],89:[2,45],98:[2,45],100:[2,45],101:[2,45],102:[2,45],106:[2,45],114:[2,45],122:[2,45],124:[2,45],125:[2,45],128:[2,45],129:[2,45],130:[2,45],131:[2,45],132:[2,45],133:[2,45]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],46:[2,192],51:[2,192],54:[2,192],69:[2,192],74:[2,192],82:[2,192],87:[2,192],89:[2,192],98:[2,192],100:[2,192],101:[2,192],102:[2,192],106:[2,192],114:[2,192],122:[2,192],124:[2,192],125:[2,192],128:[2,192],129:[2,192],130:[2,192],131:[2,192],132:[2,192],133:[2,192]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],46:[2,171],51:[2,171],54:[2,171],69:[2,171],74:[2,171],82:[2,171],87:[2,171],89:[2,171],98:[2,171],100:[2,171],101:[2,171],102:[2,171],106:[2,171],114:[2,171],117:[2,171],122:[2,171],124:[2,171],125:[2,171],128:[2,171],129:[2,171],130:[2,171],131:[2,171],132:[2,171],133:[2,171]},{1:[2,128],6:[2,128],25:[2,128],26:[2,128],46:[2,128],51:[2,128],54:[2,128],69:[2,128],74:[2,128],82:[2,128],87:[2,128],89:[2,128],98:[2,128],100:[2,128],101:[2,128],102:[2,128],106:[2,128],114:[2,128],122:[2,128],124:[2,128],125:[2,128],128:[2,128],129:[2,128],130:[2,128],131:[2,128],132:[2,128],133:[2,128]},{1:[2,129],6:[2,129],25:[2,129],26:[2,129],46:[2,129],51:[2,129],54:[2,129],69:[2,129],74:[2,129],82:[2,129],87:[2,129],89:[2,129],94:[2,129],98:[2,129],100:[2,129],101:[2,129],102:[2,129],106:[2,129],114:[2,129],122:[2,129],124:[2,129],125:[2,129],128:[2,129],129:[2,129],130:[2,129],131:[2,129],132:[2,129],133:[2,129]},{1:[2,162],6:[2,162],25:[2,162],26:[2,162],46:[2,162],51:[2,162],54:[2,162],69:[2,162],74:[2,162],82:[2,162],87:[2,162],89:[2,162],98:[2,162],100:[2,162],101:[2,162],102:[2,162],106:[2,162],114:[2,162],122:[2,162],124:[2,162],125:[2,162],128:[2,162],129:[2,162],130:[2,162],131:[2,162],132:[2,162],133:[2,162]},{5:305,25:[1,5]},{26:[1,306]},{6:[1,307],26:[2,168],117:[2,168],119:[2,168]},{8:308,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{1:[2,96],6:[2,96],25:[2,96],26:[2,96],46:[2,96],51:[2,96],54:[2,96],69:[2,96],74:[2,96],82:[2,96],87:[2,96],89:[2,96],98:[2,96],100:[2,96],101:[2,96],102:[2,96],106:[2,96],114:[2,96],122:[2,96],124:[2,96],125:[2,96],128:[2,96],129:[2,96],130:[2,96],131:[2,96],132:[2,96],133:[2,96]},{1:[2,132],6:[2,132],25:[2,132],26:[2,132],46:[2,132],51:[2,132],54:[2,132],63:[2,132],64:[2,132],65:[2,132],68:[2,132],69:[2,132],70:[2,132],71:[2,132],74:[2,132],80:[2,132],81:[2,132],82:[2,132],87:[2,132],89:[2,132],98:[2,132],100:[2,132],101:[2,132],102:[2,132],106:[2,132],114:[2,132],122:[2,132],124:[2,132],125:[2,132],128:[2,132],129:[2,132],130:[2,132],131:[2,132],132:[2,132],133:[2,132]},{1:[2,112],6:[2,112],25:[2,112],26:[2,112],46:[2,112],51:[2,112],54:[2,112],63:[2,112],64:[2,112],65:[2,112],68:[2,112],69:[2,112],70:[2,112],71:[2,112],74:[2,112],80:[2,112],81:[2,112],82:[2,112],87:[2,112],89:[2,112],98:[2,112],100:[2,112],101:[2,112],102:[2,112],106:[2,112],114:[2,112],122:[2,112],124:[2,112],125:[2,112],128:[2,112],129:[2,112],130:[2,112],131:[2,112],132:[2,112],133:[2,112]},{6:[2,118],25:[2,118],26:[2,118],51:[2,118],82:[2,118],87:[2,118]},{6:[2,49],25:[2,49],26:[2,49],50:309,51:[1,223]},{6:[2,119],25:[2,119],26:[2,119],51:[2,119],82:[2,119],87:[2,119]},{1:[2,157],6:[2,157],25:[2,157],26:[2,157],46:[2,157],51:[2,157],54:[2,157],69:[2,157],74:[2,157],82:[2,157],87:[2,157],89:[2,157],98:[2,157],99:84,100:[2,157],101:[2,157],102:[2,157],105:85,106:[2,157],107:66,114:[1,310],122:[2,157],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,159],6:[2,159],25:[2,159],26:[2,159],46:[2,159],51:[2,159],54:[2,159],69:[2,159],74:[2,159],82:[2,159],87:[2,159],89:[2,159],98:[2,159],99:84,100:[2,159],101:[1,311],102:[2,159],105:85,106:[2,159],107:66,114:[2,159],122:[2,159],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,158],6:[2,158],25:[2,158],26:[2,158],46:[2,158],51:[2,158],54:[2,158],69:[2,158],74:[2,158],82:[2,158],87:[2,158],89:[2,158],98:[2,158],99:84,100:[2,158],101:[2,158],102:[2,158],105:85,106:[2,158],107:66,114:[2,158],122:[2,158],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[2,87],25:[2,87],26:[2,87],51:[2,87],74:[2,87]},{6:[2,49],25:[2,49],26:[2,49],50:312,51:[1,233]},{26:[1,313],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],37:[2,113],46:[2,113],51:[2,113],54:[2,113],63:[2,113],64:[2,113],65:[2,113],68:[2,113],69:[2,113],70:[2,113],71:[2,113],74:[2,113],76:[2,113],80:[2,113],81:[2,113],82:[2,113],87:[2,113],89:[2,113],98:[2,113],100:[2,113],101:[2,113],102:[2,113],106:[2,113],114:[2,113],122:[2,113],124:[2,113],125:[2,113],126:[2,113],127:[2,113],128:[2,113],129:[2,113],130:[2,113],131:[2,113],132:[2,113],133:[2,113],134:[2,113]},{26:[1,314]},{1:[2,165],6:[2,165],25:[2,165],26:[2,165],46:[2,165],51:[2,165],54:[2,165],69:[2,165],74:[2,165],82:[2,165],87:[2,165],89:[2,165],98:[2,165],100:[2,165],101:[2,165],102:[2,165],106:[2,165],114:[2,165],122:[2,165],124:[2,165],125:[2,165],128:[2,165],129:[2,165],130:[2,165],131:[2,165],132:[2,165],133:[2,165]},{26:[2,169],117:[2,169],119:[2,169]},{25:[2,124],51:[2,124],99:84,100:[1,62],102:[1,63],105:85,106:[1,65],107:66,122:[1,83],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[1,261],25:[1,262],26:[1,315]},{8:316,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{8:317,9:116,10:19,11:20,12:21,13:[1,22],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,27:59,28:[1,70],29:49,30:[1,68],31:[1,69],32:24,33:[1,50],34:[1,51],35:[1,52],36:23,41:60,42:[1,44],43:[1,46],44:[1,29],47:30,48:[1,57],49:[1,58],55:47,56:48,58:36,60:25,61:26,62:27,72:[1,67],75:[1,43],79:[1,28],84:[1,55],85:[1,56],86:[1,54],92:[1,38],96:[1,45],97:[1,53],99:39,100:[1,62],102:[1,63],103:40,104:[1,64],105:41,106:[1,65],107:66,115:[1,42],120:37,121:[1,61],123:[1,31],124:[1,32],125:[1,33],126:[1,34],127:[1,35]},{6:[1,272],25:[1,273],26:[1,318]},{6:[2,37],25:[2,37],26:[2,37],51:[2,37],74:[2,37]},{1:[2,163],6:[2,163],25:[2,163],26:[2,163],46:[2,163],51:[2,163],54:[2,163],69:[2,163],74:[2,163],82:[2,163],87:[2,163],89:[2,163],98:[2,163],100:[2,163],101:[2,163],102:[2,163],106:[2,163],114:[2,163],122:[2,163],124:[2,163],125:[2,163],128:[2,163],129:[2,163],130:[2,163],131:[2,163],132:[2,163],133:[2,163]},{6:[2,120],25:[2,120],26:[2,120],51:[2,120],82:[2,120],87:[2,120]},{1:[2,160],6:[2,160],25:[2,160],26:[2,160],46:[2,160],51:[2,160],54:[2,160],69:[2,160],74:[2,160],82:[2,160],87:[2,160],89:[2,160],98:[2,160],99:84,100:[2,160],101:[2,160],102:[2,160],105:85,106:[2,160],107:66,114:[2,160],122:[2,160],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{1:[2,161],6:[2,161],25:[2,161],26:[2,161],46:[2,161],51:[2,161],54:[2,161],69:[2,161],74:[2,161],82:[2,161],87:[2,161],89:[2,161],98:[2,161],99:84,100:[2,161],101:[2,161],102:[2,161],105:85,106:[2,161],107:66,114:[2,161],122:[2,161],124:[1,77],125:[1,76],128:[1,75],129:[1,78],130:[1,79],131:[1,80],132:[1,81],133:[1,82]},{6:[2,88],25:[2,88],26:[2,88],51:[2,88],74:[2,88]}],
defaultActions: {57:[2,47],58:[2,48],72:[2,3],91:[2,102]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    };

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+'\nExpecting '+expected.join(', ');
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }
            
            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};
return parser;
})();
if (typeof require !== 'undefined') {
exports.parser = parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
};
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/parser"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/repl"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/repl";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/repl", path);
    };
    
    (function () {
        (function() {
  var CoffeeScript, error, helpers, readline, repl, run, stdin, stdout;
  CoffeeScript = require('./coffee-script');
  helpers = require('./helpers');
  readline = require('readline');
  stdin = process.openStdin();
  stdout = process.stdout;
  error = function(err) {
    return stdout.write((err.stack || err.toString()) + '\n\n');
  };
  helpers.extend(global, {
    quit: function() {
      return process.exit(0);
    }
  });
  run = function(buffer) {
    var val;
    try {
      val = CoffeeScript.eval(buffer.toString(), {
        bare: true,
        globals: true,
        filename: 'repl'
      });
      if (val !== void 0) {
        process.stdout.write(val + '\n');
      }
    } catch (err) {
      error(err);
    }
    return repl.prompt();
  };
  process.on('uncaughtException', error);
  if (readline.createInterface.length < 3) {
    repl = readline.createInterface(stdin);
    stdin.on('data', function(buffer) {
      return repl.write(buffer);
    });
  } else {
    repl = readline.createInterface(stdin, stdout);
  }
  repl.setPrompt('coffee> ');
  repl.on('close', function() {
    return stdin.destroy();
  });
  repl.on('line', run);
  repl.prompt();
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/repl"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/rewriter"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/rewriter";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/rewriter", path);
    };
    
    (function () {
        (function() {
  var BALANCED_PAIRS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_BLOCK, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, SINGLE_CLOSERS, SINGLE_LINERS, left, rite, _i, _len, _ref;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __slice = Array.prototype.slice;
  exports.Rewriter = (function() {
    function Rewriter() {}
    Rewriter.prototype.rewrite = function(tokens) {
      this.tokens = tokens;
      this.removeLeadingNewlines();
      this.removeMidExpressionNewlines();
      this.closeOpenCalls();
      this.closeOpenIndexes();
      this.addImplicitIndentation();
      this.tagPostfixConditionals();
      this.addImplicitBraces();
      this.addImplicitParentheses();
      this.ensureBalance(BALANCED_PAIRS);
      this.rewriteClosingParens();
      return this.tokens;
    };
    Rewriter.prototype.scanTokens = function(block) {
      var i, token, tokens;
      tokens = this.tokens;
      i = 0;
      while (token = tokens[i]) {
        i += block.call(this, token, i, tokens);
      }
      return true;
    };
    Rewriter.prototype.detectEnd = function(i, condition, action) {
      var levels, token, tokens, _ref, _ref2;
      tokens = this.tokens;
      levels = 0;
      while (token = tokens[i]) {
        if (levels === 0 && condition.call(this, token, i)) {
          return action.call(this, token, i);
        }
        if (!token || levels < 0) {
          return action.call(this, token, i - 1);
        }
        if (_ref = token[0], __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          levels += 1;
        } else if (_ref2 = token[0], __indexOf.call(EXPRESSION_END, _ref2) >= 0) {
          levels -= 1;
        }
        i += 1;
      }
      return i - 1;
    };
    Rewriter.prototype.removeLeadingNewlines = function() {
      var i, tag, _len, _ref;
      _ref = this.tokens;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        tag = _ref[i][0];
        if (tag !== 'TERMINATOR') {
          break;
        }
      }
      if (i) {
        return this.tokens.splice(0, i);
      }
    };
    Rewriter.prototype.removeMidExpressionNewlines = function() {
      return this.scanTokens(function(token, i, tokens) {
        var _ref;
        if (!(token[0] === 'TERMINATOR' && (_ref = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref) >= 0))) {
          return 1;
        }
        tokens.splice(i, 1);
        return 0;
      });
    };
    Rewriter.prototype.closeOpenCalls = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return ((_ref = token[0]) === ')' || _ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
      };
      action = function(token, i) {
        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'CALL_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };
    Rewriter.prototype.closeOpenIndexes = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === ']' || _ref === 'INDEX_END';
      };
      action = function(token, i) {
        return token[0] = 'INDEX_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'INDEX_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };
    Rewriter.prototype.addImplicitBraces = function() {
      var action, condition, stack, start, startIndent;
      stack = [];
      start = null;
      startIndent = 0;
      condition = function(token, i) {
        var one, tag, three, two, _ref, _ref2;
        _ref = this.tokens.slice(i + 1, (i + 3 + 1) || 9e9), one = _ref[0], two = _ref[1], three = _ref[2];
        if ('HERECOMMENT' === (one != null ? one[0] : void 0)) {
          return false;
        }
        tag = token[0];
        return ((tag === 'TERMINATOR' || tag === 'OUTDENT') && !((two != null ? two[0] : void 0) === ':' || (one != null ? one[0] : void 0) === '@' && (three != null ? three[0] : void 0) === ':')) || (tag === ',' && one && ((_ref2 = one[0]) !== 'IDENTIFIER' && _ref2 !== 'NUMBER' && _ref2 !== 'STRING' && _ref2 !== '@' && _ref2 !== 'TERMINATOR' && _ref2 !== 'OUTDENT'));
      };
      action = function(token, i) {
        return this.tokens.splice(i, 0, ['}', '}', token[2]]);
      };
      return this.scanTokens(function(token, i, tokens) {
        var ago, idx, tag, tok, value, _ref, _ref2;
        if (_ref = (tag = token[0]), __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          stack.push([(tag === 'INDENT' && this.tag(i - 1) === '{' ? '{' : tag), i]);
          return 1;
        }
        if (__indexOf.call(EXPRESSION_END, tag) >= 0) {
          start = stack.pop();
          return 1;
        }
        if (!(tag === ':' && ((ago = this.tag(i - 2)) === ':' || ((_ref2 = stack[stack.length - 1]) != null ? _ref2[0] : void 0) !== '{'))) {
          return 1;
        }
        stack.push(['{']);
        idx = ago === '@' ? i - 2 : i - 1;
        while (this.tag(idx - 2) === 'HERECOMMENT') {
          idx -= 2;
        }
        value = new String('{');
        value.generated = true;
        tok = ['{', value, token[2]];
        tok.generated = true;
        tokens.splice(idx, 0, tok);
        this.detectEnd(i + 2, condition, action);
        return 2;
      });
    };
    Rewriter.prototype.addImplicitParentheses = function() {
      var action, noCall;
      noCall = false;
      action = function(token, i) {
        var idx;
        idx = token[0] === 'OUTDENT' ? i + 1 : i;
        return this.tokens.splice(idx, 0, ['CALL_END', ')', token[2]]);
      };
      return this.scanTokens(function(token, i, tokens) {
        var callObject, current, next, prev, seenSingle, tag, _ref, _ref2, _ref3;
        tag = token[0];
        if (tag === 'CLASS' || tag === 'IF') {
          noCall = true;
        }
        _ref = tokens.slice(i - 1, (i + 1 + 1) || 9e9), prev = _ref[0], current = _ref[1], next = _ref[2];
        callObject = !noCall && tag === 'INDENT' && next && next.generated && next[0] === '{' && prev && (_ref2 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref2) >= 0);
        seenSingle = false;
        if (__indexOf.call(LINEBREAKS, tag) >= 0) {
          noCall = false;
        }
        if (prev && !prev.spaced && tag === '?') {
          token.call = true;
        }
        if (!(callObject || (prev != null ? prev.spaced : void 0) && (prev.call || (_ref3 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref3) >= 0)) && (__indexOf.call(IMPLICIT_CALL, tag) >= 0 || !(token.spaced || token.newLine) && __indexOf.call(IMPLICIT_UNSPACED_CALL, tag) >= 0))) {
          return 1;
        }
        tokens.splice(i, 0, ['CALL_START', '(', token[2]]);
        this.detectEnd(i + 1, function(token, i) {
          var post, _ref;
          tag = token[0];
          if (!seenSingle && token.fromThen) {
            return true;
          }
          if (tag === 'IF' || tag === 'ELSE' || tag === '->' || tag === '=>') {
            seenSingle = true;
          }
          if ((tag === '.' || tag === '?.' || tag === '::') && this.tag(i - 1) === 'OUTDENT') {
            return true;
          }
          return !token.generated && this.tag(i - 1) !== ',' && __indexOf.call(IMPLICIT_END, tag) >= 0 && (tag !== 'INDENT' || (this.tag(i - 2) !== 'CLASS' && (_ref = this.tag(i - 1), __indexOf.call(IMPLICIT_BLOCK, _ref) < 0) && !((post = this.tokens[i + 1]) && post.generated && post[0] === '{')));
        }, action);
        if (prev[0] === '?') {
          prev[0] = 'FUNC_EXIST';
        }
        return 2;
      });
    };
    Rewriter.prototype.addImplicitIndentation = function() {
      return this.scanTokens(function(token, i, tokens) {
        var action, condition, indent, outdent, starter, tag, _ref, _ref2;
        tag = token[0];
        if (tag === 'TERMINATOR' && this.tag(i + 1) === 'THEN') {
          tokens.splice(i, 1);
          return 0;
        }
        if (tag === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
          tokens.splice.apply(tokens, [i, 0].concat(__slice.call(this.indentation(token))));
          return 2;
        }
        if (tag === 'CATCH' && ((_ref = this.tag(i + 2)) === 'OUTDENT' || _ref === 'TERMINATOR' || _ref === 'FINALLY')) {
          tokens.splice.apply(tokens, [i + 2, 0].concat(__slice.call(this.indentation(token))));
          return 4;
        }
        if (__indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
          starter = tag;
          _ref2 = this.indentation(token), indent = _ref2[0], outdent = _ref2[1];
          if (starter === 'THEN') {
            indent.fromThen = true;
          }
          indent.generated = outdent.generated = true;
          tokens.splice(i + 1, 0, indent);
          condition = function(token, i) {
            var _ref;
            return token[1] !== ';' && (_ref = token[0], __indexOf.call(SINGLE_CLOSERS, _ref) >= 0) && !(token[0] === 'ELSE' && (starter !== 'IF' && starter !== 'THEN'));
          };
          action = function(token, i) {
            return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
          };
          this.detectEnd(i + 2, condition, action);
          if (tag === 'THEN') {
            tokens.splice(i, 1);
          }
          return 1;
        }
        return 1;
      });
    };
    Rewriter.prototype.tagPostfixConditionals = function() {
      var condition;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === 'TERMINATOR' || _ref === 'INDENT';
      };
      return this.scanTokens(function(token, i) {
        var original;
        if (token[0] !== 'IF') {
          return 1;
        }
        original = token;
        this.detectEnd(i + 1, condition, function(token, i) {
          if (token[0] !== 'INDENT') {
            return original[0] = 'POST_' + original[0];
          }
        });
        return 1;
      });
    };
    Rewriter.prototype.ensureBalance = function(pairs) {
      var close, level, levels, open, openLine, tag, token, _i, _j, _len, _len2, _ref, _ref2;
      levels = {};
      openLine = {};
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        tag = token[0];
        for (_j = 0, _len2 = pairs.length; _j < _len2; _j++) {
          _ref2 = pairs[_j], open = _ref2[0], close = _ref2[1];
          levels[open] |= 0;
          if (tag === open) {
            if (levels[open]++ === 0) {
              openLine[open] = token[2];
            }
          } else if (tag === close && --levels[open] < 0) {
            throw Error("too many " + token[1] + " on line " + (token[2] + 1));
          }
        }
      }
      for (open in levels) {
        level = levels[open];
        if (level > 0) {
          throw Error("unclosed " + open + " on line " + (openLine[open] + 1));
        }
      }
      return this;
    };
    Rewriter.prototype.rewriteClosingParens = function() {
      var debt, key, stack;
      stack = [];
      debt = {};
      for (key in INVERSES) {
        debt[key] = 0;
      }
      return this.scanTokens(function(token, i, tokens) {
        var inv, match, mtag, oppos, tag, val, _ref;
        if (_ref = (tag = token[0]), __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          stack.push(token);
          return 1;
        }
        if (__indexOf.call(EXPRESSION_END, tag) < 0) {
          return 1;
        }
        if (debt[inv = INVERSES[tag]] > 0) {
          debt[inv] -= 1;
          tokens.splice(i, 1);
          return 0;
        }
        match = stack.pop();
        mtag = match[0];
        oppos = INVERSES[mtag];
        if (tag === oppos) {
          return 1;
        }
        debt[mtag] += 1;
        val = [oppos, mtag === 'INDENT' ? match[1] : oppos];
        if (this.tag(i + 2) === mtag) {
          tokens.splice(i + 3, 0, val);
          stack.push(match);
        } else {
          tokens.splice(i, 0, val);
        }
        return 1;
      });
    };
    Rewriter.prototype.indentation = function(token) {
      return [['INDENT', 2, token[2]], ['OUTDENT', 2, token[2]]];
    };
    Rewriter.prototype.tag = function(i) {
      var _ref;
      return (_ref = this.tokens[i]) != null ? _ref[0] : void 0;
    };
    return Rewriter;
  })();
  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END']];
  INVERSES = {};
  EXPRESSION_START = [];
  EXPRESSION_END = [];
  for (_i = 0, _len = BALANCED_PAIRS.length; _i < _len; _i++) {
    _ref = BALANCED_PAIRS[_i], left = _ref[0], rite = _ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
  }
  EXPRESSION_CLOSE = ['CATCH', 'WHEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);
  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];
  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'UNARY', 'SUPER', '@', '->', '=>', '[', '(', '{', '--', '++'];
  IMPLICIT_UNSPACED_CALL = ['+', '-'];
  IMPLICIT_BLOCK = ['->', '=>', '{', '[', ','];
  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR', 'INDENT'];
  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];
  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];
  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/rewriter"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["coffee-script/lib/scope"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "coffee-script";
    var __filename = "coffee-script/coffee-script/lib/scope";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("coffee-script/lib/scope", path);
    };
    
    (function () {
        (function() {
  var Scope, extend, last, _ref;
  _ref = require('./helpers'), extend = _ref.extend, last = _ref.last;
  exports.Scope = Scope = (function() {
    Scope.root = null;
    function Scope(parent, expressions, method) {
      this.parent = parent;
      this.expressions = expressions;
      this.method = method;
      this.variables = [
        {
          name: 'arguments',
          type: 'arguments'
        }
      ];
      this.positions = {};
      if (!this.parent) {
        Scope.root = this;
      }
    }
    Scope.prototype.add = function(name, type, immediate) {
      var pos;
      if (this.shared && !immediate) {
        return this.parent.add(name, type, immediate);
      }
      if (typeof (pos = this.positions[name]) === 'number') {
        return this.variables[pos].type = type;
      } else {
        return this.positions[name] = this.variables.push({
          name: name,
          type: type
        }) - 1;
      }
    };
    Scope.prototype.find = function(name, options) {
      if (this.check(name, options)) {
        return true;
      }
      this.add(name, 'var');
      return false;
    };
    Scope.prototype.parameter = function(name) {
      if (this.shared && this.parent.check(name, true)) {
        return;
      }
      return this.add(name, 'param');
    };
    Scope.prototype.check = function(name, immediate) {
      var found, _ref;
      found = !!this.type(name);
      if (found || immediate) {
        return found;
      }
      return !!((_ref = this.parent) != null ? _ref.check(name) : void 0);
    };
    Scope.prototype.temporary = function(name, index) {
      if (name.length > 1) {
        return '_' + name + (index > 1 ? index : '');
      } else {
        return '_' + (index + parseInt(name, 36)).toString(36).replace(/\d/g, 'a');
      }
    };
    Scope.prototype.type = function(name) {
      var v, _i, _len, _ref;
      _ref = this.variables;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (v.name === name) {
          return v.type;
        }
      }
      return null;
    };
    Scope.prototype.freeVariable = function(type) {
      var index, temp;
      index = 0;
      while (this.check((temp = this.temporary(type, index)), true)) {
        index++;
      }
      this.add(temp, 'var', true);
      return temp;
    };
    Scope.prototype.assign = function(name, value) {
      this.add(name, {
        value: value,
        assigned: true
      });
      return this.hasAssignments = true;
    };
    Scope.prototype.hasDeclarations = function() {
      return !!this.declaredVariables().length;
    };
    Scope.prototype.declaredVariables = function() {
      var realVars, tempVars, v, _i, _len, _ref;
      realVars = [];
      tempVars = [];
      _ref = this.variables;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (v.type === 'var') {
          (v.name.charAt(0) === '_' ? tempVars : realVars).push(v.name);
        }
      }
      return realVars.sort().concat(tempVars.sort());
    };
    Scope.prototype.assignedVariables = function() {
      var v, _i, _len, _ref, _results;
      _ref = this.variables;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (v.type.assigned) {
          _results.push("" + v.name + " = " + v.type.value);
        }
      }
      return _results;
    };
    return Scope;
  })();
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["coffee-script/lib/scope"]._cached = module.exports;
    return module.exports;
};


_browserifyRequire.modules["uglify-js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "uglify-js";
    var __filename = "uglify-js/uglify-js";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("uglify-js", path);
    };
    
    (function () {
        exports.parser = require("./lib/parse-js");
exports.uglify = require("./lib/process");
;
    }).call(module.exports);
    
    _browserifyRequire.modules["uglify-js"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["uglify-js/lib/parse-js"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "uglify-js";
    var __filename = "uglify-js/uglify-js/lib/parse-js";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("uglify-js/lib/parse-js", path);
    };
    
    (function () {
        /***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.

  This version is suitable for Node.js.  With minimal changes (the
  exports stuff) it should work on any JS platform.

  This file contains the tokenizer/parser.  It is a port to JavaScript
  of parse-js [1], a JavaScript parser library written in Common Lisp
  by Marijn Haverbeke.  Thank you Marijn!

  [1] http://marijn.haverbeke.nl/parse-js/

  Exported functions:

    - tokenizer(code) -- returns a function.  Call the returned
      function to fetch the next token.

    - parse(code) -- returns an AST of the given JavaScript code.

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>
    Based on parse-js (http://marijn.haverbeke.nl/parse-js/).

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

/* -----[ Tokenizer (constants) ]----- */

var KEYWORDS = array_to_hash([
        "break",
        "case",
        "catch",
        "const",
        "continue",
        "default",
        "delete",
        "do",
        "else",
        "finally",
        "for",
        "function",
        "if",
        "in",
        "instanceof",
        "new",
        "return",
        "switch",
        "throw",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "with"
]);

var RESERVED_WORDS = array_to_hash([
        "abstract",
        "boolean",
        "byte",
        "char",
        "class",
        "debugger",
        "double",
        "enum",
        "export",
        "extends",
        "final",
        "float",
        "goto",
        "implements",
        "import",
        "int",
        "interface",
        "long",
        "native",
        "package",
        "private",
        "protected",
        "public",
        "short",
        "static",
        "super",
        "synchronized",
        "throws",
        "transient",
        "volatile"
]);

var KEYWORDS_BEFORE_EXPRESSION = array_to_hash([
        "return",
        "new",
        "delete",
        "throw",
        "else",
        "case"
]);

var KEYWORDS_ATOM = array_to_hash([
        "false",
        "null",
        "true",
        "undefined"
]);

var OPERATOR_CHARS = array_to_hash(characters("+-*&%=<>!?|~^"));

var RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;
var RE_OCT_NUMBER = /^0[0-7]+$/;
var RE_DEC_NUMBER = /^\d*\.?\d*(?:e[+-]?\d*(?:\d\.?|\.?\d)\d*)?$/i;

var OPERATORS = array_to_hash([
        "in",
        "instanceof",
        "typeof",
        "new",
        "void",
        "delete",
        "++",
        "--",
        "+",
        "-",
        "!",
        "~",
        "&",
        "|",
        "^",
        "*",
        "/",
        "%",
        ">>",
        "<<",
        ">>>",
        "<",
        ">",
        "<=",
        ">=",
        "==",
        "===",
        "!=",
        "!==",
        "?",
        "=",
        "+=",
        "-=",
        "/=",
        "*=",
        "%=",
        ">>=",
        "<<=",
        ">>>=",
        "|=",
        "^=",
        "&=",
        "&&",
        "||"
]);

var WHITESPACE_CHARS = array_to_hash(characters(" \n\r\t\u200b"));

var PUNC_BEFORE_EXPRESSION = array_to_hash(characters("[{}(,.;:"));

var PUNC_CHARS = array_to_hash(characters("[]{}(),;:"));

var REGEXP_MODIFIERS = array_to_hash(characters("gmsiy"));

/* -----[ Tokenizer ]----- */

// regexps adapted from http://xregexp.com/plugins/#unicode
var UNICODE = {
        letter: new RegExp("[\\u0041-\\u005A\\u0061-\\u007A\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u0523\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0621-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971\\u0972\\u097B-\\u097F\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C33\\u0C35-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D28\\u0D2A-\\u0D39\\u0D3D\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC\\u0EDD\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8B\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10D0-\\u10FA\\u10FC\\u1100-\\u1159\\u115F-\\u11A2\\u11A8-\\u11F9\\u1200-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u1676\\u1681-\\u169A\\u16A0-\\u16EA\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u1900-\\u191C\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19A9\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u2094\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2183\\u2184\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2C6F\\u2C71-\\u2C7D\\u2C80-\\u2CE4\\u2D00-\\u2D25\\u2D30-\\u2D65\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005\\u3006\\u3031-\\u3035\\u303B\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31B7\\u31F0-\\u31FF\\u3400\\u4DB5\\u4E00\\u9FC3\\uA000-\\uA48C\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA65F\\uA662-\\uA66E\\uA67F-\\uA697\\uA717-\\uA71F\\uA722-\\uA788\\uA78B\\uA78C\\uA7FB-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA90A-\\uA925\\uA930-\\uA946\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAC00\\uD7A3\\uF900-\\uFA2D\\uFA30-\\uFA6A\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
        non_spacing_mark: new RegExp("[\\u0300-\\u036F\\u0483-\\u0487\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610-\\u061A\\u064B-\\u065E\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E4\\u06E7\\u06E8\\u06EA-\\u06ED\\u0711\\u0730-\\u074A\\u07A6-\\u07B0\\u07EB-\\u07F3\\u0816-\\u0819\\u081B-\\u0823\\u0825-\\u0827\\u0829-\\u082D\\u0900-\\u0902\\u093C\\u0941-\\u0948\\u094D\\u0951-\\u0955\\u0962\\u0963\\u0981\\u09BC\\u09C1-\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1-\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41-\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E-\\u0C40\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41-\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2-\\u0DD4\\u0DD6\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\u0EB1\\u0EB4-\\u0EB9\\u0EBB\\u0EBC\\u0EC8-\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71-\\u0F7E\\u0F80-\\u0F84\\u0F86\\u0F87\\u0F90-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u102D-\\u1030\\u1032-\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E-\\u1060\\u1071-\\u1074\\u1082\\u1085\\u1086\\u108D\\u109D\\u135F\\u1712-\\u1714\\u1732-\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7-\\u17BD\\u17C6\\u17C9-\\u17D3\\u17DD\\u180B-\\u180D\\u18A9\\u1920-\\u1922\\u1927\\u1928\\u1932\\u1939-\\u193B\\u1A17\\u1A18\\u1A56\\u1A58-\\u1A5E\\u1A60\\u1A62\\u1A65-\\u1A6C\\u1A73-\\u1A7C\\u1A7F\\u1B00-\\u1B03\\u1B34\\u1B36-\\u1B3A\\u1B3C\\u1B42\\u1B6B-\\u1B73\\u1B80\\u1B81\\u1BA2-\\u1BA5\\u1BA8\\u1BA9\\u1C2C-\\u1C33\\u1C36\\u1C37\\u1CD0-\\u1CD2\\u1CD4-\\u1CE0\\u1CE2-\\u1CE8\\u1CED\\u1DC0-\\u1DE6\\u1DFD-\\u1DFF\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2CEF-\\u2CF1\\u2DE0-\\u2DFF\\u302A-\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA6F0\\uA6F1\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA8E0-\\uA8F1\\uA926-\\uA92D\\uA947-\\uA951\\uA980-\\uA982\\uA9B3\\uA9B6-\\uA9B9\\uA9BC\\uAA29-\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uAAB0\\uAAB2-\\uAAB4\\uAAB7\\uAAB8\\uAABE\\uAABF\\uAAC1\\uABE5\\uABE8\\uABED\\uFB1E\\uFE00-\\uFE0F\\uFE20-\\uFE26]"),
        space_combining_mark: new RegExp("[\\u0903\\u093E-\\u0940\\u0949-\\u094C\\u094E\\u0982\\u0983\\u09BE-\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E-\\u0A40\\u0A83\\u0ABE-\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCC\\u0BD7\\u0C01-\\u0C03\\u0C41-\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0-\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E-\\u0D40\\u0D46-\\u0D48\\u0D4A-\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF-\\u0DD1\\u0DD8-\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062-\\u1064\\u1067-\\u106D\\u1083\\u1084\\u1087-\\u108C\\u108F\\u109A-\\u109C\\u17B6\\u17BE-\\u17C5\\u17C7\\u17C8\\u1923-\\u1926\\u1929-\\u192B\\u1930\\u1931\\u1933-\\u1938\\u19B0-\\u19C0\\u19C8\\u19C9\\u1A19-\\u1A1B\\u1A55\\u1A57\\u1A61\\u1A63\\u1A64\\u1A6D-\\u1A72\\u1B04\\u1B35\\u1B3B\\u1B3D-\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24-\\u1C2B\\u1C34\\u1C35\\u1CE1\\u1CF2\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4-\\uA8C3\\uA952\\uA953\\uA983\\uA9B4\\uA9B5\\uA9BA\\uA9BB\\uA9BD-\\uA9C0\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D\\uAA7B\\uABE3\\uABE4\\uABE6\\uABE7\\uABE9\\uABEA\\uABEC]"),
        connector_punctuation: new RegExp("[\\u005F\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFF3F]")
};

function is_letter(ch) {
        return UNICODE.letter.test(ch);
};

function is_digit(ch) {
        ch = ch.charCodeAt(0);
        return ch >= 48 && ch <= 57; //XXX: find out if "UnicodeDigit" means something else than 0..9
};

function is_alphanumeric_char(ch) {
        return is_digit(ch) || is_letter(ch);
};

function is_unicode_combining_mark(ch) {
        return UNICODE.non_spacing_mark.test(ch) || UNICODE.space_combining_mark.test(ch);
};

function is_unicode_connector_punctuation(ch) {
        return UNICODE.connector_punctuation.test(ch);
};

function is_identifier_start(ch) {
        return ch == "$" || ch == "_" || is_letter(ch);
};

function is_identifier_char(ch) {
        return is_identifier_start(ch)
                || is_unicode_combining_mark(ch)
                || is_digit(ch)
                || is_unicode_connector_punctuation(ch)
                || ch == "\u200c" // zero-width non-joiner <ZWNJ>
                || ch == "\u200d" // zero-width joiner <ZWJ> (in my ECMA-262 PDF, this is also 200c)
        ;
};

function parse_js_number(num) {
        if (RE_HEX_NUMBER.test(num)) {
                return parseInt(num.substr(2), 16);
        } else if (RE_OCT_NUMBER.test(num)) {
                return parseInt(num.substr(1), 8);
        } else if (RE_DEC_NUMBER.test(num)) {
                return parseFloat(num);
        }
};

function JS_Parse_Error(message, line, col, pos) {
        this.message = message;
        this.line = line;
        this.col = col;
        this.pos = pos;
        try {
                ({})();
        } catch(ex) {
                this.stack = ex.stack;
        };
};

JS_Parse_Error.prototype.toString = function() {
        return this.message + " (line: " + this.line + ", col: " + this.col + ", pos: " + this.pos + ")" + "\n\n" + this.stack;
};

function js_error(message, line, col, pos) {
        throw new JS_Parse_Error(message, line, col, pos);
};

function is_token(token, type, val) {
        return token.type == type && (val == null || token.value == val);
};

var EX_EOF = {};

function tokenizer($TEXT) {

        var S = {
                text            : $TEXT.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/^\uFEFF/, ''),
                pos             : 0,
                tokpos          : 0,
                line            : 0,
                tokline         : 0,
                col             : 0,
                tokcol          : 0,
                newline_before  : false,
                regex_allowed   : false,
                comments_before : []
        };

        function peek() { return S.text.charAt(S.pos); };

        function next(signal_eof) {
                var ch = S.text.charAt(S.pos++);
                if (signal_eof && !ch)
                        throw EX_EOF;
                if (ch == "\n") {
                        S.newline_before = true;
                        ++S.line;
                        S.col = 0;
                } else {
                        ++S.col;
                }
                return ch;
        };

        function eof() {
                return !S.peek();
        };

        function find(what, signal_eof) {
                var pos = S.text.indexOf(what, S.pos);
                if (signal_eof && pos == -1) throw EX_EOF;
                return pos;
        };

        function start_token() {
                S.tokline = S.line;
                S.tokcol = S.col;
                S.tokpos = S.pos;
        };

        function token(type, value, is_comment) {
                S.regex_allowed = ((type == "operator" && !HOP(UNARY_POSTFIX, value)) ||
                                   (type == "keyword" && HOP(KEYWORDS_BEFORE_EXPRESSION, value)) ||
                                   (type == "punc" && HOP(PUNC_BEFORE_EXPRESSION, value)));
                var ret = {
                        type  : type,
                        value : value,
                        line  : S.tokline,
                        col   : S.tokcol,
                        pos   : S.tokpos,
                        nlb   : S.newline_before
                };
                if (!is_comment) {
                        ret.comments_before = S.comments_before;
                        S.comments_before = [];
                }
                S.newline_before = false;
                return ret;
        };

        function skip_whitespace() {
                while (HOP(WHITESPACE_CHARS, peek()))
                        next();
        };

        function read_while(pred) {
                var ret = "", ch = peek(), i = 0;
                while (ch && pred(ch, i++)) {
                        ret += next();
                        ch = peek();
                }
                return ret;
        };

        function parse_error(err) {
                js_error(err, S.tokline, S.tokcol, S.tokpos);
        };

        function read_num(prefix) {
                var has_e = false, after_e = false, has_x = false, has_dot = prefix == ".";
                var num = read_while(function(ch, i){
                        if (ch == "x" || ch == "X") {
                                if (has_x) return false;
                                return has_x = true;
                        }
                        if (!has_x && (ch == "E" || ch == "e")) {
                                if (has_e) return false;
                                return has_e = after_e = true;
                        }
                        if (ch == "-") {
                                if (after_e || (i == 0 && !prefix)) return true;
                                return false;
                        }
                        if (ch == "+") return after_e;
                        after_e = false;
                        if (ch == ".") {
                                if (!has_dot && !has_x)
                                        return has_dot = true;
                                return false;
                        }
                        return is_alphanumeric_char(ch);
                });
                if (prefix)
                        num = prefix + num;
                var valid = parse_js_number(num);
                if (!isNaN(valid)) {
                        return token("num", valid);
                } else {
                        parse_error("Invalid syntax: " + num);
                }
        };

        function read_escaped_char() {
                var ch = next(true);
                switch (ch) {
                    case "n" : return "\n";
                    case "r" : return "\r";
                    case "t" : return "\t";
                    case "b" : return "\b";
                    case "v" : return "\v";
                    case "f" : return "\f";
                    case "0" : return "\0";
                    case "x" : return String.fromCharCode(hex_bytes(2));
                    case "u" : return String.fromCharCode(hex_bytes(4));
                    default  : return ch;
                }
        };

        function hex_bytes(n) {
                var num = 0;
                for (; n > 0; --n) {
                        var digit = parseInt(next(true), 16);
                        if (isNaN(digit))
                                parse_error("Invalid hex-character pattern in string");
                        num = (num << 4) | digit;
                }
                return num;
        };

        function read_string() {
                return with_eof_error("Unterminated string constant", function(){
                        var quote = next(), ret = "";
                        for (;;) {
                                var ch = next(true);
                                if (ch == "\\") ch = read_escaped_char();
                                else if (ch == quote) break;
                                ret += ch;
                        }
                        return token("string", ret);
                });
        };

        function read_line_comment() {
                next();
                var i = find("\n"), ret;
                if (i == -1) {
                        ret = S.text.substr(S.pos);
                        S.pos = S.text.length;
                } else {
                        ret = S.text.substring(S.pos, i);
                        S.pos = i;
                }
                return token("comment1", ret, true);
        };

        function read_multiline_comment() {
                next();
                return with_eof_error("Unterminated multiline comment", function(){
                        var i = find("*/", true),
                            text = S.text.substring(S.pos, i),
                            tok = token("comment2", text, true);
                        S.pos = i + 2;
                        S.line += text.split("\n").length - 1;
                        S.newline_before = text.indexOf("\n") >= 0;

                        // https://github.com/mishoo/UglifyJS/issues/#issue/100
                        if (/^@cc_on/i.test(text)) {
                                warn("WARNING: at line " + S.line);
                                warn("*** Found \"conditional comment\": " + text);
                                warn("*** UglifyJS DISCARDS ALL COMMENTS.  This means your code might no longer work properly in Internet Explorer.");
                        }

                        return tok;
                });
        };

        function read_name() {
                var backslash = false, name = "", ch;
                while ((ch = peek()) != null) {
                        if (!backslash) {
                                if (ch == "\\") backslash = true, next();
                                else if (is_identifier_char(ch)) name += next();
                                else break;
                        }
                        else {
                                if (ch != "u") parse_error("Expecting UnicodeEscapeSequence -- uXXXX");
                                ch = read_escaped_char();
                                if (!is_identifier_char(ch)) parse_error("Unicode char: " + ch.charCodeAt(0) + " is not valid in identifier");
                                name += ch;
                                backslash = false;
                        }
                }
                return name;
        };

        function read_regexp() {
                return with_eof_error("Unterminated regular expression", function(){
                        var prev_backslash = false, regexp = "", ch, in_class = false;
                        while ((ch = next(true))) if (prev_backslash) {
                                regexp += "\\" + ch;
                                prev_backslash = false;
                        } else if (ch == "[") {
                                in_class = true;
                                regexp += ch;
                        } else if (ch == "]" && in_class) {
                                in_class = false;
                                regexp += ch;
                        } else if (ch == "/" && !in_class) {
                                break;
                        } else if (ch == "\\") {
                                prev_backslash = true;
                        } else {
                                regexp += ch;
                        }
                        var mods = read_name();
                        return token("regexp", [ regexp, mods ]);
                });
        };

        function read_operator(prefix) {
                function grow(op) {
                        if (!peek()) return op;
                        var bigger = op + peek();
                        if (HOP(OPERATORS, bigger)) {
                                next();
                                return grow(bigger);
                        } else {
                                return op;
                        }
                };
                return token("operator", grow(prefix || next()));
        };

        function handle_slash() {
                next();
                var regex_allowed = S.regex_allowed;
                switch (peek()) {
                    case "/":
                        S.comments_before.push(read_line_comment());
                        S.regex_allowed = regex_allowed;
                        return next_token();
                    case "*":
                        S.comments_before.push(read_multiline_comment());
                        S.regex_allowed = regex_allowed;
                        return next_token();
                }
                return S.regex_allowed ? read_regexp() : read_operator("/");
        };

        function handle_dot() {
                next();
                return is_digit(peek())
                        ? read_num(".")
                        : token("punc", ".");
        };

        function read_word() {
                var word = read_name();
                return !HOP(KEYWORDS, word)
                        ? token("name", word)
                        : HOP(OPERATORS, word)
                        ? token("operator", word)
                        : HOP(KEYWORDS_ATOM, word)
                        ? token("atom", word)
                        : token("keyword", word);
        };

        function with_eof_error(eof_error, cont) {
                try {
                        return cont();
                } catch(ex) {
                        if (ex === EX_EOF) parse_error(eof_error);
                        else throw ex;
                }
        };

        function next_token(force_regexp) {
                if (force_regexp)
                        return read_regexp();
                skip_whitespace();
                start_token();
                var ch = peek();
                if (!ch) return token("eof");
                if (is_digit(ch)) return read_num();
                if (ch == '"' || ch == "'") return read_string();
                if (HOP(PUNC_CHARS, ch)) return token("punc", next());
                if (ch == ".") return handle_dot();
                if (ch == "/") return handle_slash();
                if (HOP(OPERATOR_CHARS, ch)) return read_operator();
                if (ch == "\\" || is_identifier_start(ch)) return read_word();
                parse_error("Unexpected character '" + ch + "'");
        };

        next_token.context = function(nc) {
                if (nc) S = nc;
                return S;
        };

        return next_token;

};

/* -----[ Parser (constants) ]----- */

var UNARY_PREFIX = array_to_hash([
        "typeof",
        "void",
        "delete",
        "--",
        "++",
        "!",
        "~",
        "-",
        "+"
]);

var UNARY_POSTFIX = array_to_hash([ "--", "++" ]);

var ASSIGNMENT = (function(a, ret, i){
        while (i < a.length) {
                ret[a[i]] = a[i].substr(0, a[i].length - 1);
                i++;
        }
        return ret;
})(
        ["+=", "-=", "/=", "*=", "%=", ">>=", "<<=", ">>>=", "|=", "^=", "&="],
        { "=": true },
        0
);

var PRECEDENCE = (function(a, ret){
        for (var i = 0, n = 1; i < a.length; ++i, ++n) {
                var b = a[i];
                for (var j = 0; j < b.length; ++j) {
                        ret[b[j]] = n;
                }
        }
        return ret;
})(
        [
                ["||"],
                ["&&"],
                ["|"],
                ["^"],
                ["&"],
                ["==", "===", "!=", "!=="],
                ["<", ">", "<=", ">=", "in", "instanceof"],
                [">>", "<<", ">>>"],
                ["+", "-"],
                ["*", "/", "%"]
        ],
        {}
);

var STATEMENTS_WITH_LABELS = array_to_hash([ "for", "do", "while", "switch" ]);

var ATOMIC_START_TOKEN = array_to_hash([ "atom", "num", "string", "regexp", "name" ]);

/* -----[ Parser ]----- */

function NodeWithToken(str, start, end) {
        this.name = str;
        this.start = start;
        this.end = end;
};

NodeWithToken.prototype.toString = function() { return this.name; };

function parse($TEXT, exigent_mode, embed_tokens) {

        var S = {
                input       : typeof $TEXT == "string" ? tokenizer($TEXT, true) : $TEXT,
                token       : null,
                prev        : null,
                peeked      : null,
                in_function : 0,
                in_loop     : 0,
                labels      : []
        };

        S.token = next();

        function is(type, value) {
                return is_token(S.token, type, value);
        };

        function peek() { return S.peeked || (S.peeked = S.input()); };

        function next() {
                S.prev = S.token;
                if (S.peeked) {
                        S.token = S.peeked;
                        S.peeked = null;
                } else {
                        S.token = S.input();
                }
                return S.token;
        };

        function prev() {
                return S.prev;
        };

        function croak(msg, line, col, pos) {
                var ctx = S.input.context();
                js_error(msg,
                         line != null ? line : ctx.tokline,
                         col != null ? col : ctx.tokcol,
                         pos != null ? pos : ctx.tokpos);
        };

        function token_error(token, msg) {
                croak(msg, token.line, token.col);
        };

        function unexpected(token) {
                if (token == null)
                        token = S.token;
                token_error(token, "Unexpected token: " + token.type + " (" + token.value + ")");
        };

        function expect_token(type, val) {
                if (is(type, val)) {
                        return next();
                }
                token_error(S.token, "Unexpected token " + S.token.type + ", expected " + type);
        };

        function expect(punc) { return expect_token("punc", punc); };

        function can_insert_semicolon() {
                return !exigent_mode && (
                        S.token.nlb || is("eof") || is("punc", "}")
                );
        };

        function semicolon() {
                if (is("punc", ";")) next();
                else if (!can_insert_semicolon()) unexpected();
        };

        function as() {
                return slice(arguments);
        };

        function parenthesised() {
                expect("(");
                var ex = expression();
                expect(")");
                return ex;
        };

        function add_tokens(str, start, end) {
                return str instanceof NodeWithToken ? str : new NodeWithToken(str, start, end);
        };

        var statement = embed_tokens ? function() {
                var start = S.token;
                var ast = $statement.apply(this, arguments);
                ast[0] = add_tokens(ast[0], start, prev());
                return ast;
        } : $statement;

        function $statement() {
                if (is("operator", "/")) {
                        S.peeked = null;
                        S.token = S.input(true); // force regexp
                }
                switch (S.token.type) {
                    case "num":
                    case "string":
                    case "regexp":
                    case "operator":
                    case "atom":
                        return simple_statement();

                    case "name":
                        return is_token(peek(), "punc", ":")
                                ? labeled_statement(prog1(S.token.value, next, next))
                                : simple_statement();

                    case "punc":
                        switch (S.token.value) {
                            case "{":
                                return as("block", block_());
                            case "[":
                            case "(":
                                return simple_statement();
                            case ";":
                                next();
                                return as("block");
                            default:
                                unexpected();
                        }

                    case "keyword":
                        switch (prog1(S.token.value, next)) {
                            case "break":
                                return break_cont("break");

                            case "continue":
                                return break_cont("continue");

                            case "debugger":
                                semicolon();
                                return as("debugger");

                            case "do":
                                return (function(body){
                                        expect_token("keyword", "while");
                                        return as("do", prog1(parenthesised, semicolon), body);
                                })(in_loop(statement));

                            case "for":
                                return for_();

                            case "function":
                                return function_(true);

                            case "if":
                                return if_();

                            case "return":
                                if (S.in_function == 0)
                                        croak("'return' outside of function");
                                return as("return",
                                          is("punc", ";")
                                          ? (next(), null)
                                          : can_insert_semicolon()
                                          ? null
                                          : prog1(expression, semicolon));

                            case "switch":
                                return as("switch", parenthesised(), switch_block_());

                            case "throw":
                                return as("throw", prog1(expression, semicolon));

                            case "try":
                                return try_();

                            case "var":
                                return prog1(var_, semicolon);

                            case "const":
                                return prog1(const_, semicolon);

                            case "while":
                                return as("while", parenthesised(), in_loop(statement));

                            case "with":
                                return as("with", parenthesised(), statement());

                            default:
                                unexpected();
                        }
                }
        };

        function labeled_statement(label) {
                S.labels.push(label);
                var start = S.token, stat = statement();
                if (exigent_mode && !HOP(STATEMENTS_WITH_LABELS, stat[0]))
                        unexpected(start);
                S.labels.pop();
                return as("label", label, stat);
        };

        function simple_statement() {
                return as("stat", prog1(expression, semicolon));
        };

        function break_cont(type) {
                var name = is("name") ? S.token.value : null;
                if (name != null) {
                        next();
                        if (!member(name, S.labels))
                                croak("Label " + name + " without matching loop or statement");
                }
                else if (S.in_loop == 0)
                        croak(type + " not inside a loop or switch");
                semicolon();
                return as(type, name);
        };

        function for_() {
                expect("(");
                var init = null;
                if (!is("punc", ";")) {
                        init = is("keyword", "var")
                                ? (next(), var_(true))
                                : expression(true, true);
                        if (is("operator", "in"))
                                return for_in(init);
                }
                return regular_for(init);
        };

        function regular_for(init) {
                expect(";");
                var test = is("punc", ";") ? null : expression();
                expect(";");
                var step = is("punc", ")") ? null : expression();
                expect(")");
                return as("for", init, test, step, in_loop(statement));
        };

        function for_in(init) {
                var lhs = init[0] == "var" ? as("name", init[1][0]) : init;
                next();
                var obj = expression();
                expect(")");
                return as("for-in", init, lhs, obj, in_loop(statement));
        };

        var function_ = embed_tokens ? function() {
                var start = prev();
                var ast = $function_.apply(this, arguments);
                ast[0] = add_tokens(ast[0], start, prev());
                return ast;
        } : $function_;

        function $function_(in_statement) {
                var name = is("name") ? prog1(S.token.value, next) : null;
                if (in_statement && !name)
                        unexpected();
                expect("(");
                return as(in_statement ? "defun" : "function",
                          name,
                          // arguments
                          (function(first, a){
                                  while (!is("punc", ")")) {
                                          if (first) first = false; else expect(",");
                                          if (!is("name")) unexpected();
                                          a.push(S.token.value);
                                          next();
                                  }
                                  next();
                                  return a;
                          })(true, []),
                          // body
                          (function(){
                                  ++S.in_function;
                                  var loop = S.in_loop;
                                  S.in_loop = 0;
                                  var a = block_();
                                  --S.in_function;
                                  S.in_loop = loop;
                                  return a;
                          })());
        };

        function if_() {
                var cond = parenthesised(), body = statement(), belse;
                if (is("keyword", "else")) {
                        next();
                        belse = statement();
                }
                return as("if", cond, body, belse);
        };

        function block_() {
                expect("{");
                var a = [];
                while (!is("punc", "}")) {
                        if (is("eof")) unexpected();
                        a.push(statement());
                }
                next();
                return a;
        };

        var switch_block_ = curry(in_loop, function(){
                expect("{");
                var a = [], cur = null;
                while (!is("punc", "}")) {
                        if (is("eof")) unexpected();
                        if (is("keyword", "case")) {
                                next();
                                cur = [];
                                a.push([ expression(), cur ]);
                                expect(":");
                        }
                        else if (is("keyword", "default")) {
                                next();
                                expect(":");
                                cur = [];
                                a.push([ null, cur ]);
                        }
                        else {
                                if (!cur) unexpected();
                                cur.push(statement());
                        }
                }
                next();
                return a;
        });

        function try_() {
                var body = block_(), bcatch, bfinally;
                if (is("keyword", "catch")) {
                        next();
                        expect("(");
                        if (!is("name"))
                                croak("Name expected");
                        var name = S.token.value;
                        next();
                        expect(")");
                        bcatch = [ name, block_() ];
                }
                if (is("keyword", "finally")) {
                        next();
                        bfinally = block_();
                }
                if (!bcatch && !bfinally)
                        croak("Missing catch/finally blocks");
                return as("try", body, bcatch, bfinally);
        };

        function vardefs(no_in) {
                var a = [];
                for (;;) {
                        if (!is("name"))
                                unexpected();
                        var name = S.token.value;
                        next();
                        if (is("operator", "=")) {
                                next();
                                a.push([ name, expression(false, no_in) ]);
                        } else {
                                a.push([ name ]);
                        }
                        if (!is("punc", ","))
                                break;
                        next();
                }
                return a;
        };

        function var_(no_in) {
                return as("var", vardefs(no_in));
        };

        function const_() {
                return as("const", vardefs());
        };

        function new_() {
                var newexp = expr_atom(false), args;
                if (is("punc", "(")) {
                        next();
                        args = expr_list(")");
                } else {
                        args = [];
                }
                return subscripts(as("new", newexp, args), true);
        };

        function expr_atom(allow_calls) {
                if (is("operator", "new")) {
                        next();
                        return new_();
                }
                if (is("operator") && HOP(UNARY_PREFIX, S.token.value)) {
                        return make_unary("unary-prefix",
                                          prog1(S.token.value, next),
                                          expr_atom(allow_calls));
                }
                if (is("punc")) {
                        switch (S.token.value) {
                            case "(":
                                next();
                                return subscripts(prog1(expression, curry(expect, ")")), allow_calls);
                            case "[":
                                next();
                                return subscripts(array_(), allow_calls);
                            case "{":
                                next();
                                return subscripts(object_(), allow_calls);
                        }
                        unexpected();
                }
                if (is("keyword", "function")) {
                        next();
                        return subscripts(function_(false), allow_calls);
                }
                if (HOP(ATOMIC_START_TOKEN, S.token.type)) {
                        var atom = S.token.type == "regexp"
                                ? as("regexp", S.token.value[0], S.token.value[1])
                                : as(S.token.type, S.token.value);
                        return subscripts(prog1(atom, next), allow_calls);
                }
                unexpected();
        };

        function expr_list(closing, allow_trailing_comma, allow_empty) {
                var first = true, a = [];
                while (!is("punc", closing)) {
                        if (first) first = false; else expect(",");
                        if (allow_trailing_comma && is("punc", closing)) break;
                        if (is("punc", ",") && allow_empty) {
                                a.push([ "atom", "undefined" ]);
                        } else {
                                a.push(expression(false));
                        }
                }
                next();
                return a;
        };

        function array_() {
                return as("array", expr_list("]", !exigent_mode, true));
        };

        function object_() {
                var first = true, a = [];
                while (!is("punc", "}")) {
                        if (first) first = false; else expect(",");
                        if (!exigent_mode && is("punc", "}"))
                                // allow trailing comma
                                break;
                        var type = S.token.type;
                        var name = as_property_name();
                        if (type == "name" && (name == "get" || name == "set") && !is("punc", ":")) {
                                a.push([ as_name(), function_(false), name ]);
                        } else {
                                expect(":");
                                a.push([ name, expression(false) ]);
                        }
                }
                next();
                return as("object", a);
        };

        function as_property_name() {
                switch (S.token.type) {
                    case "num":
                    case "string":
                        return prog1(S.token.value, next);
                }
                return as_name();
        };

        function as_name() {
                switch (S.token.type) {
                    case "name":
                    case "operator":
                    case "keyword":
                    case "atom":
                        return prog1(S.token.value, next);
                    default:
                        unexpected();
                }
        };

        function subscripts(expr, allow_calls) {
                if (is("punc", ".")) {
                        next();
                        return subscripts(as("dot", expr, as_name()), allow_calls);
                }
                if (is("punc", "[")) {
                        next();
                        return subscripts(as("sub", expr, prog1(expression, curry(expect, "]"))), allow_calls);
                }
                if (allow_calls && is("punc", "(")) {
                        next();
                        return subscripts(as("call", expr, expr_list(")")), true);
                }
                if (allow_calls && is("operator") && HOP(UNARY_POSTFIX, S.token.value)) {
                        return prog1(curry(make_unary, "unary-postfix", S.token.value, expr),
                                     next);
                }
                return expr;
        };

        function make_unary(tag, op, expr) {
                if ((op == "++" || op == "--") && !is_assignable(expr))
                        croak("Invalid use of " + op + " operator");
                return as(tag, op, expr);
        };

        function expr_op(left, min_prec, no_in) {
                var op = is("operator") ? S.token.value : null;
                if (op && op == "in" && no_in) op = null;
                var prec = op != null ? PRECEDENCE[op] : null;
                if (prec != null && prec > min_prec) {
                        next();
                        var right = expr_op(expr_atom(true), prec, no_in);
                        return expr_op(as("binary", op, left, right), min_prec, no_in);
                }
                return left;
        };

        function expr_ops(no_in) {
                return expr_op(expr_atom(true), 0, no_in);
        };

        function maybe_conditional(no_in) {
                var expr = expr_ops(no_in);
                if (is("operator", "?")) {
                        next();
                        var yes = expression(false);
                        expect(":");
                        return as("conditional", expr, yes, expression(false, no_in));
                }
                return expr;
        };

        function is_assignable(expr) {
                if (!exigent_mode) return true;
                switch (expr[0]) {
                    case "dot":
                    case "sub":
                    case "new":
                    case "call":
                        return true;
                    case "name":
                        return expr[1] != "this";
                }
        };

        function maybe_assign(no_in) {
                var left = maybe_conditional(no_in), val = S.token.value;
                if (is("operator") && HOP(ASSIGNMENT, val)) {
                        if (is_assignable(left)) {
                                next();
                                return as("assign", ASSIGNMENT[val], left, maybe_assign(no_in));
                        }
                        croak("Invalid assignment");
                }
                return left;
        };

        function expression(commas, no_in) {
                if (arguments.length == 0)
                        commas = true;
                var expr = maybe_assign(no_in);
                if (commas && is("punc", ",")) {
                        next();
                        return as("seq", expr, expression(true, no_in));
                }
                return expr;
        };

        function in_loop(cont) {
                try {
                        ++S.in_loop;
                        return cont();
                } finally {
                        --S.in_loop;
                }
        };

        return as("toplevel", (function(a){
                while (!is("eof"))
                        a.push(statement());
                return a;
        })([]));

};

/* -----[ Utilities ]----- */

function curry(f) {
        var args = slice(arguments, 1);
        return function() { return f.apply(this, args.concat(slice(arguments))); };
};

function prog1(ret) {
        if (ret instanceof Function)
                ret = ret();
        for (var i = 1, n = arguments.length; --n > 0; ++i)
                arguments[i]();
        return ret;
};

function array_to_hash(a) {
        var ret = {};
        for (var i = 0; i < a.length; ++i)
                ret[a[i]] = true;
        return ret;
};

function slice(a, start) {
        return Array.prototype.slice.call(a, start == null ? 0 : start);
};

function characters(str) {
        return str.split("");
};

function member(name, array) {
        for (var i = array.length; --i >= 0;)
                if (array[i] === name)
                        return true;
        return false;
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

var warn = function() {};

/* -----[ Exports ]----- */

exports.tokenizer = tokenizer;
exports.parse = parse;
exports.slice = slice;
exports.curry = curry;
exports.member = member;
exports.array_to_hash = array_to_hash;
exports.PRECEDENCE = PRECEDENCE;
exports.KEYWORDS_ATOM = KEYWORDS_ATOM;
exports.RESERVED_WORDS = RESERVED_WORDS;
exports.KEYWORDS = KEYWORDS;
exports.ATOMIC_START_TOKEN = ATOMIC_START_TOKEN;
exports.OPERATORS = OPERATORS;
exports.is_alphanumeric_char = is_alphanumeric_char;
exports.set_logger = function(logger) {
        warn = logger;
};
;
    }).call(module.exports);
    
    _browserifyRequire.modules["uglify-js/lib/parse-js"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["uglify-js/lib/process"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "uglify-js";
    var __filename = "uglify-js/uglify-js/lib/process";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("uglify-js/lib/process", path);
    };
    
    (function () {
        /***********************************************************************

  A JavaScript tokenizer / parser / beautifier / compressor.

  This version is suitable for Node.js.  With minimal changes (the
  exports stuff) it should work on any JS platform.

  This file implements some AST processors.  They work on data built
  by parse-js.

  Exported functions:

    - ast_mangle(ast, options) -- mangles the variable/function names
      in the AST.  Returns an AST.

    - ast_squeeze(ast) -- employs various optimizations to make the
      final generated code even smaller.  Returns an AST.

    - gen_code(ast, options) -- generates JS code from the AST.  Pass
      true (or an object, see the code for some options) as second
      argument to get "pretty" (indented) code.

  -------------------------------- (C) ---------------------------------

                           Author: Mihai Bazon
                         <mihai.bazon@gmail.com>
                       http://mihai.bazon.net/blog

  Distributed under the BSD license:

    Copyright 2010 (c) Mihai Bazon <mihai.bazon@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:

        * Redistributions of source code must retain the above
          copyright notice, this list of conditions and the following
          disclaimer.

        * Redistributions in binary form must reproduce the above
          copyright notice, this list of conditions and the following
          disclaimer in the documentation and/or other materials
          provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
    THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
    TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
    THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
    SUCH DAMAGE.

 ***********************************************************************/

var jsp = require("./parse-js"),
    slice = jsp.slice,
    member = jsp.member,
    PRECEDENCE = jsp.PRECEDENCE,
    OPERATORS = jsp.OPERATORS;

/* -----[ helper for AST traversal ]----- */

function ast_walker(ast) {
        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(def){
                        var a = [ def[0] ];
                        if (def.length > 1)
                                a[1] = walk(def[1]);
                        return a;
                }) ];
        };
        var walkers = {
                "string": function(str) {
                        return [ this[0], str ];
                },
                "num": function(num) {
                        return [ this[0], num ];
                },
                "name": function(name) {
                        return [ this[0], name ];
                },
                "toplevel": function(statements) {
                        return [ this[0], MAP(statements, walk) ];
                },
                "block": function(statements) {
                        var out = [ this[0] ];
                        if (statements != null)
                                out.push(MAP(statements, walk));
                        return out;
                },
                "var": _vardefs,
                "const": _vardefs,
                "try": function(t, c, f) {
                        return [
                                this[0],
                                MAP(t, walk),
                                c != null ? [ c[0], MAP(c[1], walk) ] : null,
                                f != null ? MAP(f, walk) : null
                        ];
                },
                "throw": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "new": function(ctor, args) {
                        return [ this[0], walk(ctor), MAP(args, walk) ];
                },
                "switch": function(expr, body) {
                        return [ this[0], walk(expr), MAP(body, function(branch){
                                return [ branch[0] ? walk(branch[0]) : null,
                                         MAP(branch[1], walk) ];
                        }) ];
                },
                "break": function(label) {
                        return [ this[0], label ];
                },
                "continue": function(label) {
                        return [ this[0], label ];
                },
                "conditional": function(cond, t, e) {
                        return [ this[0], walk(cond), walk(t), walk(e) ];
                },
                "assign": function(op, lvalue, rvalue) {
                        return [ this[0], op, walk(lvalue), walk(rvalue) ];
                },
                "dot": function(expr) {
                        return [ this[0], walk(expr) ].concat(slice(arguments, 1));
                },
                "call": function(expr, args) {
                        return [ this[0], walk(expr), MAP(args, walk) ];
                },
                "function": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "defun": function(name, args, body) {
                        return [ this[0], name, args.slice(), MAP(body, walk) ];
                },
                "if": function(conditional, t, e) {
                        return [ this[0], walk(conditional), walk(t), walk(e) ];
                },
                "for": function(init, cond, step, block) {
                        return [ this[0], walk(init), walk(cond), walk(step), walk(block) ];
                },
                "for-in": function(vvar, key, hash, block) {
                        return [ this[0], walk(vvar), walk(key), walk(hash), walk(block) ];
                },
                "while": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "do": function(cond, block) {
                        return [ this[0], walk(cond), walk(block) ];
                },
                "return": function(expr) {
                        return [ this[0], walk(expr) ];
                },
                "binary": function(op, left, right) {
                        return [ this[0], op, walk(left), walk(right) ];
                },
                "unary-prefix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "unary-postfix": function(op, expr) {
                        return [ this[0], op, walk(expr) ];
                },
                "sub": function(expr, subscript) {
                        return [ this[0], walk(expr), walk(subscript) ];
                },
                "object": function(props) {
                        return [ this[0], MAP(props, function(p){
                                return p.length == 2
                                        ? [ p[0], walk(p[1]) ]
                                        : [ p[0], walk(p[1]), p[2] ]; // get/set-ter
                        }) ];
                },
                "regexp": function(rx, mods) {
                        return [ this[0], rx, mods ];
                },
                "array": function(elements) {
                        return [ this[0], MAP(elements, walk) ];
                },
                "stat": function(stat) {
                        return [ this[0], walk(stat) ];
                },
                "seq": function() {
                        return [ this[0] ].concat(MAP(slice(arguments), walk));
                },
                "label": function(name, block) {
                        return [ this[0], name, walk(block) ];
                },
                "with": function(expr, block) {
                        return [ this[0], walk(expr), walk(block) ];
                },
                "atom": function(name) {
                        return [ this[0], name ];
                }
        };

        var user = {};
        var stack = [];
        function walk(ast) {
                if (ast == null)
                        return null;
                try {
                        stack.push(ast);
                        var type = ast[0];
                        var gen = user[type];
                        if (gen) {
                                var ret = gen.apply(ast, ast.slice(1));
                                if (ret != null)
                                        return ret;
                        }
                        gen = walkers[type];
                        return gen.apply(ast, ast.slice(1));
                } finally {
                        stack.pop();
                }
        };

        function with_walkers(walkers, cont){
                var save = {}, i;
                for (i in walkers) if (HOP(walkers, i)) {
                        save[i] = user[i];
                        user[i] = walkers[i];
                }
                var ret = cont();
                for (i in save) if (HOP(save, i)) {
                        if (!save[i]) delete user[i];
                        else user[i] = save[i];
                }
                return ret;
        };

        return {
                walk: walk,
                with_walkers: with_walkers,
                parent: function() {
                        return stack[stack.length - 2]; // last one is current node
                },
                stack: function() {
                        return stack;
                }
        };
};

/* -----[ Scope and mangling ]----- */

function Scope(parent) {
        this.names = {};        // names defined in this scope
        this.mangled = {};      // mangled names (orig.name => mangled)
        this.rev_mangled = {};  // reverse lookup (mangled => orig.name)
        this.cname = -1;        // current mangled name
        this.refs = {};         // names referenced from this scope
        this.uses_with = false; // will become TRUE if eval() is detected in this or any subscopes
        this.uses_eval = false; // will become TRUE if with() is detected in this or any subscopes
        this.parent = parent;   // parent scope
        this.children = [];     // sub-scopes
        if (parent) {
                this.level = parent.level + 1;
                parent.children.push(this);
        } else {
                this.level = 0;
        }
};

var base54 = (function(){
        var DIGITS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_";
        return function(num) {
                var ret = "";
                do {
                        ret = DIGITS.charAt(num % 54) + ret;
                        num = Math.floor(num / 54);
                } while (num > 0);
                return ret;
        };
})();

Scope.prototype = {
        has: function(name) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.names, name))
                                return s;
        },
        has_mangled: function(mname) {
                for (var s = this; s; s = s.parent)
                        if (HOP(s.rev_mangled, mname))
                                return s;
        },
        toJSON: function() {
                return {
                        names: this.names,
                        uses_eval: this.uses_eval,
                        uses_with: this.uses_with
                };
        },

        next_mangled: function() {
                // we must be careful that the new mangled name:
                //
                // 1. doesn't shadow a mangled name from a parent
                //    scope, unless we don't reference the original
                //    name from this scope OR from any sub-scopes!
                //    This will get slow.
                //
                // 2. doesn't shadow an original name from a parent
                //    scope, in the event that the name is not mangled
                //    in the parent scope and we reference that name
                //    here OR IN ANY SUBSCOPES!
                //
                // 3. doesn't shadow a name that is referenced but not
                //    defined (possibly global defined elsewhere).
                for (;;) {
                        var m = base54(++this.cname), prior;

                        // case 1.
                        prior = this.has_mangled(m);
                        if (prior && this.refs[prior.rev_mangled[m]] === prior)
                                continue;

                        // case 2.
                        prior = this.has(m);
                        if (prior && prior !== this && this.refs[m] === prior && !prior.has_mangled(m))
                                continue;

                        // case 3.
                        if (HOP(this.refs, m) && this.refs[m] == null)
                                continue;

                        // I got "do" once. :-/
                        if (!is_identifier(m))
                                continue;

                        return m;
                }
        },
        get_mangled: function(name, newMangle) {
                if (this.uses_eval || this.uses_with) return name; // no mangle if eval or with is in use
                var s = this.has(name);
                if (!s) return name; // not in visible scope, no mangle
                if (HOP(s.mangled, name)) return s.mangled[name]; // already mangled in this scope
                if (!newMangle) return name;                      // not found and no mangling requested

                var m = s.next_mangled();
                s.rev_mangled[m] = name;
                return s.mangled[name] = m;
        },
        define: function(name) {
                if (name != null)
                        return this.names[name] = name;
        }
};

function ast_add_scope(ast) {

        var current_scope = null;
        var w = ast_walker(), walk = w.walk;
        var having_eval = [];

        function with_new_scope(cont) {
                current_scope = new Scope(current_scope);
                var ret = current_scope.body = cont();
                ret.scope = current_scope;
                current_scope = current_scope.parent;
                return ret;
        };

        function define(name) {
                return current_scope.define(name);
        };

        function reference(name) {
                current_scope.refs[name] = true;
        };

        function _lambda(name, args, body) {
                return [ this[0], define(name), args, with_new_scope(function(){
                        MAP(args, define);
                        return MAP(body, walk);
                })];
        };

        return with_new_scope(function(){
                // process AST
                var ret = w.with_walkers({
                        "function": _lambda,
                        "defun": _lambda,
                        "with": function(expr, block) {
                                for (var s = current_scope; s; s = s.parent)
                                        s.uses_with = true;
                        },
                        "var": function(defs) {
                                MAP(defs, function(d){ define(d[0]) });
                        },
                        "const": function(defs) {
                                MAP(defs, function(d){ define(d[0]) });
                        },
                        "try": function(t, c, f) {
                                if (c != null) return [
                                        this[0],
                                        MAP(t, walk),
                                        [ define(c[0]), MAP(c[1], walk) ],
                                        f != null ? MAP(f, walk) : null
                                ];
                        },
                        "name": function(name) {
                                if (name == "eval")
                                        having_eval.push(current_scope);
                                reference(name);
                        }
                }, function(){
                        return walk(ast);
                });

                // the reason why we need an additional pass here is
                // that names can be used prior to their definition.

                // scopes where eval was detected and their parents
                // are marked with uses_eval, unless they define the
                // "eval" name.
                MAP(having_eval, function(scope){
                        if (!scope.has("eval")) while (scope) {
                                scope.uses_eval = true;
                                scope = scope.parent;
                        }
                });

                // for referenced names it might be useful to know
                // their origin scope.  current_scope here is the
                // toplevel one.
                function fixrefs(scope, i) {
                        // do children first; order shouldn't matter
                        for (i = scope.children.length; --i >= 0;)
                                fixrefs(scope.children[i]);
                        for (i in scope.refs) if (HOP(scope.refs, i)) {
                                // find origin scope and propagate the reference to origin
                                for (var origin = scope.has(i), s = scope; s; s = s.parent) {
                                        s.refs[i] = origin;
                                        if (s === origin) break;
                                }
                        }
                };
                fixrefs(current_scope);

                return ret;
        });

};

/* -----[ mangle names ]----- */

function ast_mangle(ast, options) {
        var w = ast_walker(), walk = w.walk, scope;
        options = options || {};

        function get_mangled(name, newMangle) {
                if (!options.toplevel && !scope.parent) return name; // don't mangle toplevel
                if (options.except && member(name, options.except))
                        return name;
                return scope.get_mangled(name, newMangle);
        };

        function _lambda(name, args, body) {
                if (name) name = get_mangled(name);
                body = with_scope(body.scope, function(){
                        args = MAP(args, function(name){ return get_mangled(name) });
                        return MAP(body, walk);
                });
                return [ this[0], name, args, body ];
        };

        function with_scope(s, cont) {
                var _scope = scope;
                scope = s;
                for (var i in s.names) if (HOP(s.names, i)) {
                        get_mangled(i, true);
                }
                var ret = cont();
                ret.scope = s;
                scope = _scope;
                return ret;
        };

        function _vardefs(defs) {
                return [ this[0], MAP(defs, function(d){
                        return [ get_mangled(d[0]), walk(d[1]) ];
                }) ];
        };

        return w.with_walkers({
                "function": _lambda,
                "defun": function() {
                        // move function declarations to the top when
                        // they are not in some block.
                        var ast = _lambda.apply(this, arguments);
                        switch (w.parent()[0]) {
                            case "toplevel":
                            case "function":
                            case "defun":
                                return MAP.at_top(ast);
                        }
                        return ast;
                },
                "var": _vardefs,
                "const": _vardefs,
                "name": function(name) {
                        return [ this[0], get_mangled(name) ];
                },
                "try": function(t, c, f) {
                        return [ this[0],
                                 MAP(t, walk),
                                 c != null ? [ get_mangled(c[0]), MAP(c[1], walk) ] : null,
                                 f != null ? MAP(f, walk) : null ];
                },
                "toplevel": function(body) {
                        var self = this;
                        return with_scope(self.scope, function(){
                                return [ self[0], MAP(body, walk) ];
                        });
                }
        }, function() {
                return walk(ast_add_scope(ast));
        });
};

/* -----[
   - compress foo["bar"] into foo.bar,
   - remove block brackets {} where possible
   - join consecutive var declarations
   - various optimizations for IFs:
     - if (cond) foo(); else bar();  ==>  cond?foo():bar();
     - if (cond) foo();  ==>  cond&&foo();
     - if (foo) return bar(); else return baz();  ==> return foo?bar():baz(); // also for throw
     - if (foo) return bar(); else something();  ==> {if(foo)return bar();something()}
   ]----- */

var warn = function(){};

function best_of(ast1, ast2) {
        return gen_code(ast1).length > gen_code(ast2[0] == "stat" ? ast2[1] : ast2).length ? ast2 : ast1;
};

function last_stat(b) {
        if (b[0] == "block" && b[1] && b[1].length > 0)
                return b[1][b[1].length - 1];
        return b;
}

function aborts(t) {
        if (t) {
                t = last_stat(t);
                if (t[0] == "return" || t[0] == "break" || t[0] == "continue" || t[0] == "throw")
                        return true;
        }
};

function boolean_expr(expr) {
        return ( (expr[0] == "unary-prefix"
                  && member(expr[1], [ "!", "delete" ])) ||

                 (expr[0] == "binary"
                  && member(expr[1], [ "in", "instanceof", "==", "!=", "===", "!==", "<", "<=", ">=", ">" ])) ||

                 (expr[0] == "binary"
                  && member(expr[1], [ "&&", "||" ])
                  && boolean_expr(expr[2])
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "conditional"
                  && boolean_expr(expr[2])
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "assign"
                  && expr[1] === true
                  && boolean_expr(expr[3])) ||

                 (expr[0] == "seq"
                  && boolean_expr(expr[expr.length - 1]))
               );
};

function make_conditional(c, t, e) {
        if (c[0] == "unary-prefix" && c[1] == "!") {
                return e ? [ "conditional", c[2], e, t ] : [ "binary", "||", c[2], t ];
        } else {
                return e ? [ "conditional", c, t, e ] : [ "binary", "&&", c, t ];
        }
};

function empty(b) {
        return !b || (b[0] == "block" && (!b[1] || b[1].length == 0));
};

function is_string(node) {
        return (node[0] == "string" ||
                node[0] == "unary-prefix" && node[1] == "typeof" ||
                node[0] == "binary" && node[1] == "+" &&
                (is_string(node[2]) || is_string(node[3])));
};

var when_constant = (function(){

        var $NOT_CONSTANT = {};

        // this can only evaluate constant expressions.  If it finds anything
        // not constant, it throws $NOT_CONSTANT.
        function evaluate(expr) {
                switch (expr[0]) {
                    case "string":
                    case "num":
                        return expr[1];
                    case "name":
                    case "atom":
                        switch (expr[1]) {
                            case "true": return true;
                            case "false": return false;
                        }
                        break;
                    case "unary-prefix":
                        switch (expr[1]) {
                            case "!": return !evaluate(expr[2]);
                            case "typeof": return typeof evaluate(expr[2]);
                            case "~": return ~evaluate(expr[2]);
                            case "-": return -evaluate(expr[2]);
                            case "+": return +evaluate(expr[2]);
                        }
                        break;
                    case "binary":
                        var left = expr[2], right = expr[3];
                        switch (expr[1]) {
                            case "&&"         : return evaluate(left) &&         evaluate(right);
                            case "||"         : return evaluate(left) ||         evaluate(right);
                            case "|"          : return evaluate(left) |          evaluate(right);
                            case "&"          : return evaluate(left) &          evaluate(right);
                            case "^"          : return evaluate(left) ^          evaluate(right);
                            case "+"          : return evaluate(left) +          evaluate(right);
                            case "*"          : return evaluate(left) *          evaluate(right);
                            case "/"          : return evaluate(left) /          evaluate(right);
                            case "-"          : return evaluate(left) -          evaluate(right);
                            case "<<"         : return evaluate(left) <<         evaluate(right);
                            case ">>"         : return evaluate(left) >>         evaluate(right);
                            case ">>>"        : return evaluate(left) >>>        evaluate(right);
                            case "=="         : return evaluate(left) ==         evaluate(right);
                            case "==="        : return evaluate(left) ===        evaluate(right);
                            case "!="         : return evaluate(left) !=         evaluate(right);
                            case "!=="        : return evaluate(left) !==        evaluate(right);
                            case "<"          : return evaluate(left) <          evaluate(right);
                            case "<="         : return evaluate(left) <=         evaluate(right);
                            case ">"          : return evaluate(left) >          evaluate(right);
                            case ">="         : return evaluate(left) >=         evaluate(right);
                            case "in"         : return evaluate(left) in         evaluate(right);
                            case "instanceof" : return evaluate(left) instanceof evaluate(right);
                        }
                }
                throw $NOT_CONSTANT;
        };

        return function(expr, yes, no) {
                try {
                        var val = evaluate(expr), ast;
                        switch (typeof val) {
                            case "string": ast =  [ "string", val ]; break;
                            case "number": ast =  [ "num", val ]; break;
                            case "boolean": ast =  [ "name", String(val) ]; break;
                            default: throw new Error("Can't handle constant of type: " + (typeof val));
                        }
                        return yes.call(expr, ast, val);
                } catch(ex) {
                        if (ex === $NOT_CONSTANT) {
                                if (expr[0] == "binary"
                                    && (expr[1] == "===" || expr[1] == "!==")
                                    && ((is_string(expr[2]) && is_string(expr[3]))
                                        || (boolean_expr(expr[2]) && boolean_expr(expr[3])))) {
                                        expr[1] = expr[1].substr(0, 2);
                                }
                                return no ? no.call(expr, expr) : null;
                        }
                        else throw ex;
                }
        };

})();

function warn_unreachable(ast) {
        if (!empty(ast))
                warn("Dropping unreachable code: " + gen_code(ast, true));
};

function ast_squeeze(ast, options) {
        options = defaults(options, {
                make_seqs   : true,
                dead_code   : true,
                keep_comps  : true,
                no_warnings : false
        });

        var w = ast_walker(), walk = w.walk, scope;

        function negate(c) {
                var not_c = [ "unary-prefix", "!", c ];
                switch (c[0]) {
                    case "unary-prefix":
                        return c[1] == "!" && boolean_expr(c[2]) ? c[2] : not_c;
                    case "seq":
                        c = slice(c);
                        c[c.length - 1] = negate(c[c.length - 1]);
                        return c;
                    case "conditional":
                        return best_of(not_c, [ "conditional", c[1], negate(c[2]), negate(c[3]) ]);
                    case "binary":
                        var op = c[1], left = c[2], right = c[3];
                        if (!options.keep_comps) switch (op) {
                            case "<="  : return [ "binary", ">", left, right ];
                            case "<"   : return [ "binary", ">=", left, right ];
                            case ">="  : return [ "binary", "<", left, right ];
                            case ">"   : return [ "binary", "<=", left, right ];
                        }
                        switch (op) {
                            case "=="  : return [ "binary", "!=", left, right ];
                            case "!="  : return [ "binary", "==", left, right ];
                            case "===" : return [ "binary", "!==", left, right ];
                            case "!==" : return [ "binary", "===", left, right ];
                            case "&&"  : return best_of(not_c, [ "binary", "||", negate(left), negate(right) ]);
                            case "||"  : return best_of(not_c, [ "binary", "&&", negate(left), negate(right) ]);
                        }
                        break;
                }
                return not_c;
        };

        function with_scope(s, cont) {
                var _scope = scope;
                scope = s;
                var ret = cont();
                ret.scope = s;
                scope = _scope;
                return ret;
        };

        function rmblock(block) {
                if (block != null && block[0] == "block" && block[1]) {
                        if (block[1].length == 1)
                                block = block[1][0];
                        else if (block[1].length == 0)
                                block = [ "block" ];
                }
                return block;
        };

        function _lambda(name, args, body) {
                return [ this[0], name, args, with_scope(body.scope, function(){
                        return tighten(MAP(body, walk), "lambda");
                }) ];
        };

        // we get here for blocks that have been already transformed.
        // this function does a few things:
        // 1. discard useless blocks
        // 2. join consecutive var declarations
        // 3. remove obviously dead code
        // 4. transform consecutive statements using the comma operator
        // 5. if block_type == "lambda" and it detects constructs like if(foo) return ... - rewrite like if (!foo) { ... }
        function tighten(statements, block_type) {
                statements = statements.reduce(function(a, stat){
                        if (stat[0] == "block") {
                                if (stat[1]) {
                                        a.push.apply(a, stat[1]);
                                }
                        } else {
                                a.push(stat);
                        }
                        return a;
                }, []);

                statements = (function(a, prev){
                        statements.forEach(function(cur){
                                if (prev && ((cur[0] == "var" && prev[0] == "var") ||
                                             (cur[0] == "const" && prev[0] == "const"))) {
                                        prev[1] = prev[1].concat(cur[1]);
                                } else {
                                        a.push(cur);
                                        prev = cur;
                                }
                        });
                        return a;
                })([]);

                if (options.dead_code) statements = (function(a, has_quit){
                        statements.forEach(function(st){
                                if (has_quit) {
                                        if (member(st[0], [ "function", "defun" , "var", "const" ])) {
                                                a.push(st);
                                        }
                                        else if (!options.no_warnings)
                                                warn_unreachable(st);
                                }
                                else {
                                        a.push(st);
                                        if (member(st[0], [ "return", "throw", "break", "continue" ]))
                                                has_quit = true;
                                }
                        });
                        return a;
                })([]);

                if (options.make_seqs) statements = (function(a, prev) {
                        statements.forEach(function(cur){
                                if (prev && prev[0] == "stat" && cur[0] == "stat") {
                                        prev[1] = [ "seq", prev[1], cur[1] ];
                                } else {
                                        a.push(cur);
                                        prev = cur;
                                }
                        });
                        return a;
                })([]);

                if (block_type == "lambda") statements = (function(i, a, stat){
                        while (i < statements.length) {
                                stat = statements[i++];
                                if (stat[0] == "if" && !stat[3]) {
                                        if (stat[2][0] == "return" && stat[2][1] == null) {
                                                a.push(make_if(negate(stat[1]), [ "block", statements.slice(i) ]));
                                                break;
                                        }
                                        var last = last_stat(stat[2]);
                                        if (last[0] == "return" && last[1] == null) {
                                                a.push(make_if(stat[1], [ "block", stat[2][1].slice(0, -1) ], [ "block", statements.slice(i) ]));
                                                break;
                                        }
                                }
                                a.push(stat);
                        }
                        return a;
                })(0, []);

                return statements;
        };

        function make_if(c, t, e) {
                return when_constant(c, function(ast, val){
                        if (val) {
                                warn_unreachable(e);
                                return t;
                        } else {
                                warn_unreachable(t);
                                return e;
                        }
                }, function() {
                        return make_real_if(c, t, e);
                });
        };

        function make_real_if(c, t, e) {
                c = walk(c);
                t = walk(t);
                e = walk(e);

                if (empty(t)) {
                        c = negate(c);
                        t = e;
                        e = null;
                } else if (empty(e)) {
                        e = null;
                } else {
                        // if we have both else and then, maybe it makes sense to switch them?
                        (function(){
                                var a = gen_code(c);
                                var n = negate(c);
                                var b = gen_code(n);
                                if (b.length < a.length) {
                                        var tmp = t;
                                        t = e;
                                        e = tmp;
                                        c = n;
                                }
                        })();
                }
                if (empty(e) && empty(t))
                        return [ "stat", c ];
                var ret = [ "if", c, t, e ];
                if (t[0] == "if" && empty(t[3]) && empty(e)) {
                        ret = best_of(ret, walk([ "if", [ "binary", "&&", c, t[1] ], t[2] ]));
                }
                else if (t[0] == "stat") {
                        if (e) {
                                if (e[0] == "stat") {
                                        ret = best_of(ret, [ "stat", make_conditional(c, t[1], e[1]) ]);
                                }
                        }
                        else {
                                ret = best_of(ret, [ "stat", make_conditional(c, t[1]) ]);
                        }
                }
                else if (e && t[0] == e[0] && (t[0] == "return" || t[0] == "throw") && t[1] && e[1]) {
                        ret = best_of(ret, [ t[0], make_conditional(c, t[1], e[1] ) ]);
                }
                else if (e && aborts(t)) {
                        ret = [ [ "if", c, t ] ];
                        if (e[0] == "block") {
                                if (e[1]) ret = ret.concat(e[1]);
                        }
                        else {
                                ret.push(e);
                        }
                        ret = walk([ "block", ret ]);
                }
                else if (t && aborts(e)) {
                        ret = [ [ "if", negate(c), e ] ];
                        if (t[0] == "block") {
                                if (t[1]) ret = ret.concat(t[1]);
                        } else {
                                ret.push(t);
                        }
                        ret = walk([ "block", ret ]);
                }
                return ret;
        };

        function _do_while(cond, body) {
                return when_constant(cond, function(cond, val){
                        if (!val) {
                                warn_unreachable(body);
                                return [ "block" ];
                        } else {
                                return [ "for", null, null, null, walk(body) ];
                        }
                });
        };

        return w.with_walkers({
                "sub": function(expr, subscript) {
                        if (subscript[0] == "string") {
                                var name = subscript[1];
                                if (is_identifier(name))
                                        return [ "dot", walk(expr), name ];
                                else if (/^[1-9][0-9]*$/.test(name) || name === "0")
                                        return [ "sub", walk(expr), [ "num", parseInt(name, 10) ] ];
                        }
                },
                "if": make_if,
                "toplevel": function(body) {
                        return [ "toplevel", with_scope(this.scope, function(){
                                return tighten(MAP(body, walk));
                        }) ];
                },
                "switch": function(expr, body) {
                        var last = body.length - 1;
                        return [ "switch", walk(expr), MAP(body, function(branch, i){
                                var block = tighten(MAP(branch[1], walk));
                                if (i == last && block.length > 0) {
                                        var node = block[block.length - 1];
                                        if (node[0] == "break" && !node[1])
                                                block.pop();
                                }
                                return [ branch[0] ? walk(branch[0]) : null, block ];
                        }) ];
                },
                "function": function() {
                        var ret = _lambda.apply(this, arguments);
                        if (ret[1] && !HOP(scope.refs, ret[1])) {
                                ret[1] = null;
                        }
                        return ret;
                },
                "defun": _lambda,
                "block": function(body) {
                        if (body) return rmblock([ "block", tighten(MAP(body, walk)) ]);
                },
                "binary": function(op, left, right) {
                        return when_constant([ "binary", op, walk(left), walk(right) ], function yes(c){
                                return best_of(walk(c), this);
                        }, function no() {
                                return this;
                        });
                },
                "conditional": function(c, t, e) {
                        return make_conditional(walk(c), walk(t), walk(e));
                },
                "try": function(t, c, f) {
                        return [
                                "try",
                                tighten(MAP(t, walk)),
                                c != null ? [ c[0], tighten(MAP(c[1], walk)) ] : null,
                                f != null ? tighten(MAP(f, walk)) : null
                        ];
                },
                "unary-prefix": function(op, expr) {
                        expr = walk(expr);
                        var ret = [ "unary-prefix", op, expr ];
                        if (op == "!")
                                ret = best_of(ret, negate(expr));
                        return when_constant(ret, function(ast, val){
                                return walk(ast); // it's either true or false, so minifies to !0 or !1
                        }, function() { return ret });
                },
                "name": function(name) {
                        switch (name) {
                            case "true": return [ "unary-prefix", "!", [ "num", 0 ]];
                            case "false": return [ "unary-prefix", "!", [ "num", 1 ]];
                        }
                },
                "new": function(ctor, args) {
                        if (ctor[0] == "name" && ctor[1] == "Array" && !scope.has("Array")) {
                                if (args.length != 1) {
                                        return [ "array", args ];
                                } else {
                                        return [ "call", [ "name", "Array" ], args ];
                                }
                        }
                },
                "call": function(expr, args) {
                        if (expr[0] == "name" && expr[1] == "Array" && args.length != 1 && !scope.has("Array")) {
                                return [ "array", args ];
                        }
                },
                "while": _do_while,
                "do": _do_while
        }, function() {
                return walk(ast_add_scope(ast));
        });
};

/* -----[ re-generate code from the AST ]----- */

var DOT_CALL_NO_PARENS = jsp.array_to_hash([
        "name",
        "array",
        "object",
        "string",
        "dot",
        "sub",
        "call",
        "regexp"
]);

function make_string(str, ascii_only) {
        var dq = 0, sq = 0;
        str = str.replace(/[\\\b\f\n\r\t\x22\x27]/g, function(s){
                switch (s) {
                    case "\\": return "\\\\";
                    case "\b": return "\\b";
                    case "\f": return "\\f";
                    case "\n": return "\\n";
                    case "\r": return "\\r";
                    case "\t": return "\\t";
                    case '"': ++dq; return '"';
                    case "'": ++sq; return "'";
                }
                return s;
        });
        if (ascii_only) str = to_ascii(str);
        if (dq > sq) return "'" + str.replace(/\x27/g, "\\'") + "'";
        else return '"' + str.replace(/\x22/g, '\\"') + '"';
};

function to_ascii(str) {
        return str.replace(/[\u0080-\uffff]/g, function(ch) {
                var code = ch.charCodeAt(0).toString(16);
                while (code.length < 4) code = "0" + code;
                return "\\u" + code;
        });
};

function gen_code(ast, options) {
        options = defaults(options, {
                indent_start : 0,
                indent_level : 4,
                quote_keys   : false,
                space_colon  : false,
                beautify     : false,
                ascii_only   : false
        });
        var beautify = !!options.beautify;
        var indentation = 0,
            newline = beautify ? "\n" : "",
            space = beautify ? " " : "";

        function encode_string(str) {
                return make_string(str, options.ascii_only);
        };

        function make_name(name) {
                name = name.toString();
                if (options.ascii_only)
                        name = to_ascii(name);
                return name;
        };

        function indent(line) {
                if (line == null)
                        line = "";
                if (beautify)
                        line = repeat_string(" ", options.indent_start + indentation * options.indent_level) + line;
                return line;
        };

        function with_indent(cont, incr) {
                if (incr == null) incr = 1;
                indentation += incr;
                try { return cont.apply(null, slice(arguments, 1)); }
                finally { indentation -= incr; }
        };

        function add_spaces(a) {
                if (beautify)
                        return a.join(" ");
                var b = [];
                for (var i = 0; i < a.length; ++i) {
                        var next = a[i + 1];
                        b.push(a[i]);
                        if (next &&
                            ((/[a-z0-9_\x24]$/i.test(a[i].toString()) && /^[a-z0-9_\x24]/i.test(next.toString())) ||
                             (/[\+\-]$/.test(a[i].toString()) && /^[\+\-]/.test(next.toString())))) {
                                b.push(" ");
                        }
                }
                return b.join("");
        };

        function add_commas(a) {
                return a.join("," + space);
        };

        function parenthesize(expr) {
                var gen = make(expr);
                for (var i = 1; i < arguments.length; ++i) {
                        var el = arguments[i];
                        if ((el instanceof Function && el(expr)) || expr[0] == el)
                                return "(" + gen + ")";
                }
                return gen;
        };

        function best_of(a) {
                if (a.length == 1) {
                        return a[0];
                }
                if (a.length == 2) {
                        var b = a[1];
                        a = a[0];
                        return a.length <= b.length ? a : b;
                }
                return best_of([ a[0], best_of(a.slice(1)) ]);
        };

        function needs_parens(expr) {
                if (expr[0] == "function" || expr[0] == "object") {
                        // dot/call on a literal function requires the
                        // function literal itself to be parenthesized
                        // only if it's the first "thing" in a
                        // statement.  This means that the parent is
                        // "stat", but it could also be a "seq" and
                        // we're the first in this "seq" and the
                        // parent is "stat", and so on.  Messy stuff,
                        // but it worths the trouble.
                        var a = slice($stack), self = a.pop(), p = a.pop();
                        while (p) {
                                if (p[0] == "stat") return true;
                                if (((p[0] == "seq" || p[0] == "call" || p[0] == "dot" || p[0] == "sub" || p[0] == "conditional") && p[1] === self) ||
                                    ((p[0] == "binary" || p[0] == "assign" || p[0] == "unary-postfix") && p[2] === self)) {
                                        self = p;
                                        p = a.pop();
                                } else {
                                        return false;
                                }
                        }
                }
                return !HOP(DOT_CALL_NO_PARENS, expr[0]);
        };

        function make_num(num) {
                var str = num.toString(10), a = [ str.replace(/^0\./, ".") ], m;
                if (Math.floor(num) === num) {
                        a.push("0x" + num.toString(16).toLowerCase(), // probably pointless
                               "0" + num.toString(8)); // same.
                        if ((m = /^(.*?)(0+)$/.exec(num))) {
                                a.push(m[1] + "e" + m[2].length);
                        }
                } else if ((m = /^0?\.(0+)(.*)$/.exec(num))) {
                        a.push(m[2] + "e-" + (m[1].length + m[2].length),
                               str.substr(str.indexOf(".")));
                }
                return best_of(a);
        };

        var generators = {
                "string": encode_string,
                "num": make_num,
                "name": make_name,
                "toplevel": function(statements) {
                        return make_block_statements(statements)
                                .join(newline + newline);
                },
                "block": make_block,
                "var": function(defs) {
                        return "var " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "const": function(defs) {
                        return "const " + add_commas(MAP(defs, make_1vardef)) + ";";
                },
                "try": function(tr, ca, fi) {
                        var out = [ "try", make_block(tr) ];
                        if (ca) out.push("catch", "(" + ca[0] + ")", make_block(ca[1]));
                        if (fi) out.push("finally", make_block(fi));
                        return add_spaces(out);
                },
                "throw": function(expr) {
                        return add_spaces([ "throw", make(expr) ]) + ";";
                },
                "new": function(ctor, args) {
                        args = args.length > 0 ? "(" + add_commas(MAP(args, make)) + ")" : "";
                        return add_spaces([ "new", parenthesize(ctor, "seq", "binary", "conditional", "assign", function(expr){
                                var w = ast_walker(), has_call = {};
                                try {
                                        w.with_walkers({
                                                "call": function() { throw has_call },
                                                "function": function() { return this }
                                        }, function(){
                                                w.walk(expr);
                                        });
                                } catch(ex) {
                                        if (ex === has_call)
                                                return true;
                                        throw ex;
                                }
                        }) + args ]);
                },
                "switch": function(expr, body) {
                        return add_spaces([ "switch", "(" + make(expr) + ")", make_switch_block(body) ]);
                },
                "break": function(label) {
                        var out = "break";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "continue": function(label) {
                        var out = "continue";
                        if (label != null)
                                out += " " + make_name(label);
                        return out + ";";
                },
                "conditional": function(co, th, el) {
                        return add_spaces([ parenthesize(co, "assign", "seq", "conditional"), "?",
                                            parenthesize(th, "seq"), ":",
                                            parenthesize(el, "seq") ]);
                },
                "assign": function(op, lvalue, rvalue) {
                        if (op && op !== true) op += "=";
                        else op = "=";
                        return add_spaces([ make(lvalue), op, parenthesize(rvalue, "seq") ]);
                },
                "dot": function(expr) {
                        var out = make(expr), i = 1;
                        if (expr[0] == "num") {
                                if (!/\./.test(expr[1]))
                                        out += ".";
                        } else if (needs_parens(expr))
                                out = "(" + out + ")";
                        while (i < arguments.length)
                                out += "." + make_name(arguments[i++]);
                        return out;
                },
                "call": function(func, args) {
                        var f = make(func);
                        if (needs_parens(func))
                                f = "(" + f + ")";
                        return f + "(" + add_commas(MAP(args, function(expr){
                                return parenthesize(expr, "seq");
                        })) + ")";
                },
                "function": make_function,
                "defun": make_function,
                "if": function(co, th, el) {
                        var out = [ "if", "(" + make(co) + ")", el ? make_then(th) : make(th) ];
                        if (el) {
                                out.push("else", make(el));
                        }
                        return add_spaces(out);
                },
                "for": function(init, cond, step, block) {
                        var out = [ "for" ];
                        init = (init != null ? make(init) : "").replace(/;*\s*$/, ";" + space);
                        cond = (cond != null ? make(cond) : "").replace(/;*\s*$/, ";" + space);
                        step = (step != null ? make(step) : "").replace(/;*\s*$/, "");
                        var args = init + cond + step;
                        if (args == "; ; ") args = ";;";
                        out.push("(" + args + ")", make(block));
                        return add_spaces(out);
                },
                "for-in": function(vvar, key, hash, block) {
                        return add_spaces([ "for", "(" +
                                            (vvar ? make(vvar).replace(/;+$/, "") : make(key)),
                                            "in",
                                            make(hash) + ")", make(block) ]);
                },
                "while": function(condition, block) {
                        return add_spaces([ "while", "(" + make(condition) + ")", make(block) ]);
                },
                "do": function(condition, block) {
                        return add_spaces([ "do", make(block), "while", "(" + make(condition) + ")" ]) + ";";
                },
                "return": function(expr) {
                        var out = [ "return" ];
                        if (expr != null) out.push(make(expr));
                        return add_spaces(out) + ";";
                },
                "binary": function(operator, lvalue, rvalue) {
                        var left = make(lvalue), right = make(rvalue);
                        // XXX: I'm pretty sure other cases will bite here.
                        //      we need to be smarter.
                        //      adding parens all the time is the safest bet.
                        if (member(lvalue[0], [ "assign", "conditional", "seq" ]) ||
                            lvalue[0] == "binary" && PRECEDENCE[operator] > PRECEDENCE[lvalue[1]]) {
                                left = "(" + left + ")";
                        }
                        if (member(rvalue[0], [ "assign", "conditional", "seq" ]) ||
                            rvalue[0] == "binary" && PRECEDENCE[operator] >= PRECEDENCE[rvalue[1]] &&
                            !(rvalue[1] == operator && member(operator, [ "&&", "||", "*" ]))) {
                                right = "(" + right + ")";
                        }
                        return add_spaces([ left, operator, right ]);
                },
                "unary-prefix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-prefix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return operator + (jsp.is_alphanumeric_char(operator.charAt(0)) ? " " : "") + val;
                },
                "unary-postfix": function(operator, expr) {
                        var val = make(expr);
                        if (!(expr[0] == "num" || (expr[0] == "unary-postfix" && !HOP(OPERATORS, operator + expr[1])) || !needs_parens(expr)))
                                val = "(" + val + ")";
                        return val + operator;
                },
                "sub": function(expr, subscript) {
                        var hash = make(expr);
                        if (needs_parens(expr))
                                hash = "(" + hash + ")";
                        return hash + "[" + make(subscript) + "]";
                },
                "object": function(props) {
                        if (props.length == 0)
                                return "{}";
                        return "{" + newline + with_indent(function(){
                                return MAP(props, function(p){
                                        if (p.length == 3) {
                                                // getter/setter.  The name is in p[0], the arg.list in p[1][2], the
                                                // body in p[1][3] and type ("get" / "set") in p[2].
                                                return indent(make_function(p[0], p[1][2], p[1][3], p[2]));
                                        }
                                        var key = p[0], val = make(p[1]);
                                        if (options.quote_keys) {
                                                key = encode_string(key);
                                        } else if ((typeof key == "number" || !beautify && +key + "" == key)
                                                   && parseFloat(key) >= 0) {
                                                key = make_num(+key);
                                        } else if (!is_identifier(key)) {
                                                key = encode_string(key);
                                        }
                                        return indent(add_spaces(beautify && options.space_colon
                                                                 ? [ key, ":", val ]
                                                                 : [ key + ":", val ]));
                                }).join("," + newline);
                        }) + newline + indent("}");
                },
                "regexp": function(rx, mods) {
                        return "/" + rx + "/" + mods;
                },
                "array": function(elements) {
                        if (elements.length == 0) return "[]";
                        return add_spaces([ "[", add_commas(MAP(elements, function(el){
                                if (!beautify && el[0] == "atom" && el[1] == "undefined") return "";
                                return parenthesize(el, "seq");
                        })), "]" ]);
                },
                "stat": function(stmt) {
                        return make(stmt).replace(/;*\s*$/, ";");
                },
                "seq": function() {
                        return add_commas(MAP(slice(arguments), make));
                },
                "label": function(name, block) {
                        return add_spaces([ make_name(name), ":", make(block) ]);
                },
                "with": function(expr, block) {
                        return add_spaces([ "with", "(" + make(expr) + ")", make(block) ]);
                },
                "atom": function(name) {
                        return make_name(name);
                }
        };

        // The squeezer replaces "block"-s that contain only a single
        // statement with the statement itself; technically, the AST
        // is correct, but this can create problems when we output an
        // IF having an ELSE clause where the THEN clause ends in an
        // IF *without* an ELSE block (then the outer ELSE would refer
        // to the inner IF).  This function checks for this case and
        // adds the block brackets if needed.
        function make_then(th) {
                if (th[0] == "do") {
                        // https://github.com/mishoo/UglifyJS/issues/#issue/57
                        // IE croaks with "syntax error" on code like this:
                        //     if (foo) do ... while(cond); else ...
                        // we need block brackets around do/while
                        return make([ "block", [ th ]]);
                }
                var b = th;
                while (true) {
                        var type = b[0];
                        if (type == "if") {
                                if (!b[3])
                                        // no else, we must add the block
                                        return make([ "block", [ th ]]);
                                b = b[3];
                        }
                        else if (type == "while" || type == "do") b = b[2];
                        else if (type == "for" || type == "for-in") b = b[4];
                        else break;
                }
                return make(th);
        };

        function make_function(name, args, body, keyword) {
                var out = keyword || "function";
                if (name) {
                        out += " " + make_name(name);
                }
                out += "(" + add_commas(MAP(args, make_name)) + ")";
                return add_spaces([ out, make_block(body) ]);
        };

        function make_block_statements(statements) {
                for (var a = [], last = statements.length - 1, i = 0; i <= last; ++i) {
                        var stat = statements[i];
                        var code = make(stat);
                        if (code != ";") {
                                if (!beautify && i == last) {
                                        if ((stat[0] == "while" && empty(stat[2])) ||
                                            (member(stat[0], [ "for", "for-in"] ) && empty(stat[4])) ||
                                            (stat[0] == "if" && empty(stat[2]) && !stat[3]) ||
                                            (stat[0] == "if" && stat[3] && empty(stat[3]))) {
                                                code = code.replace(/;*\s*$/, ";");
                                        } else {
                                                code = code.replace(/;+\s*$/, "");
                                        }
                                }
                                a.push(code);
                        }
                }
                return MAP(a, indent);
        };

        function make_switch_block(body) {
                var n = body.length;
                if (n == 0) return "{}";
                return "{" + newline + MAP(body, function(branch, i){
                        var has_body = branch[1].length > 0, code = with_indent(function(){
                                return indent(branch[0]
                                              ? add_spaces([ "case", make(branch[0]) + ":" ])
                                              : "default:");
                        }, 0.5) + (has_body ? newline + with_indent(function(){
                                return make_block_statements(branch[1]).join(newline);
                        }) : "");
                        if (!beautify && has_body && i < n - 1)
                                code += ";";
                        return code;
                }).join(newline) + newline + indent("}");
        };

        function make_block(statements) {
                if (!statements) return ";";
                if (statements.length == 0) return "{}";
                return "{" + newline + with_indent(function(){
                        return make_block_statements(statements).join(newline);
                }) + newline + indent("}");
        };

        function make_1vardef(def) {
                var name = def[0], val = def[1];
                if (val != null)
                        name = add_spaces([ make_name(name), "=", make(val) ]);
                return name;
        };

        var $stack = [];

        function make(node) {
                var type = node[0];
                var gen = generators[type];
                if (!gen)
                        throw new Error("Can't find generator for \"" + type + "\"");
                $stack.push(node);
                var ret = gen.apply(type, node.slice(1));
                $stack.pop();
                return ret;
        };

        return make(ast);
};

function split_lines(code, max_line_length) {
        var splits = [ 0 ];
        jsp.parse(function(){
                var next_token = jsp.tokenizer(code);
                var last_split = 0;
                var prev_token;
                function current_length(tok) {
                        return tok.pos - last_split;
                };
                function split_here(tok) {
                        last_split = tok.pos;
                        splits.push(last_split);
                };
                function custom(){
                        var tok = next_token.apply(this, arguments);
                        out: {
                                if (prev_token) {
                                        if (prev_token.type == "keyword") break out;
                                }
                                if (current_length(tok) > max_line_length) {
                                        switch (tok.type) {
                                            case "keyword":
                                            case "atom":
                                            case "name":
                                            case "punc":
                                                split_here(tok);
                                                break out;
                                        }
                                }
                        }
                        prev_token = tok;
                        return tok;
                };
                custom.context = function() {
                        return next_token.context.apply(this, arguments);
                };
                return custom;
        }());
        return splits.map(function(pos, i){
                return code.substring(pos, splits[i + 1] || code.length);
        }).join("\n");
};

/* -----[ Utilities ]----- */

function repeat_string(str, i) {
        if (i <= 0) return "";
        if (i == 1) return str;
        var d = repeat_string(str, i >> 1);
        d += d;
        if (i & 1) d += str;
        return d;
};

function defaults(args, defs) {
        var ret = {};
        if (args === true)
                args = {};
        for (var i in defs) if (HOP(defs, i)) {
                ret[i] = (args && HOP(args, i)) ? args[i] : defs[i];
        }
        return ret;
};

function is_identifier(name) {
        return /^[a-z_$][a-z0-9_$]*$/i.test(name)
                && name != "this"
                && !HOP(jsp.KEYWORDS_ATOM, name)
                && !HOP(jsp.RESERVED_WORDS, name)
                && !HOP(jsp.KEYWORDS, name);
};

function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
};

// some utilities

var MAP;

(function(){
        MAP = function(a, f, o) {
                var ret = [];
                for (var i = 0; i < a.length; ++i) {
                        var val = f.call(o, a[i], i);
                        if (val instanceof AtTop) ret.unshift(val.v);
                        else ret.push(val);
                }
                return ret;
        };
        MAP.at_top = function(val) { return new AtTop(val) };
        function AtTop(val) { this.v = val };
})();

/* -----[ Exports ]----- */

exports.ast_walker = ast_walker;
exports.ast_mangle = ast_mangle;
exports.ast_squeeze = ast_squeeze;
exports.gen_code = gen_code;
exports.ast_add_scope = ast_add_scope;
exports.set_logger = function(logger) { warn = logger };
exports.make_string = make_string;
exports.split_lines = split_lines;
exports.MAP = MAP;

// keep this last!
exports.ast_squeeze_more = require("./squeeze-more").ast_squeeze_more;
;
    }).call(module.exports);
    
    _browserifyRequire.modules["uglify-js/lib/process"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["uglify-js/lib/squeeze-more"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = "uglify-js";
    var __filename = "uglify-js/uglify-js/lib/squeeze-more";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("uglify-js/lib/squeeze-more", path);
    };
    
    (function () {
        var jsp = require("./parse-js"),
    pro = require("./process"),
    slice = jsp.slice,
    member = jsp.member,
    PRECEDENCE = jsp.PRECEDENCE,
    OPERATORS = jsp.OPERATORS;

function ast_squeeze_more(ast) {
        var w = pro.ast_walker(), walk = w.walk;
        return w.with_walkers({
                "call": function(expr, args) {
                        if (expr[0] == "dot" && expr[2] == "toString" && args.length == 0) {
                                // foo.toString()  ==>  foo+""
                                return [ "binary", "+", expr[1], [ "string", "" ]];
                        }
                }
        }, function() {
                return walk(ast);
        });
};

exports.ast_squeeze_more = ast_squeeze_more;
;
    }).call(module.exports);
    
    _browserifyRequire.modules["uglify-js/lib/squeeze-more"]._cached = module.exports;
    return module.exports;
};
_browserifyRequire.modules["./chat"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "./chat.coffee";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("./chat", path);
    };
    
    (function () {
        (function() {
  var model, vers, view, _;
  vers = require("./lib/vers")();
  _ = exports.utils = vers.utils;
  model = vers.model;
  view = vers.view;
  if (_.onServer) {
    model.init({
      users: {},
      messages: [],
      _session: {
        userId: 0,
        user: model.ref("users", "_session.userId"),
        newComment: "",
        title: model.func("title")
      }
    });
    view.make("Title", {
      model: "_session.title"
    });
    require("fs").readFile("" + __dirname + "/chat.styl", "utf8", function(err, styl) {
      return require("stylus").render(styl, {
        compress: true
      }, function(err, css) {
        return view.make("Head", "<meta name=viewport content=\"width=device-width\">\n<style>" + css + "</style>");
      });
    });
    view.make("Body", {
      messages: {
        model: "messages",
        view: "message"
      },
      userPicUrl: {
        model: "_session.user.picUrl"
      },
      userName: {
        model: "_session.user.name"
      },
      newComment: {
        model: "_session.newComment"
      }
    }, "<div id=messageContainer><ul id=messageList>{{{messages}}}</ul></div>\n<div id=foot>\n  <img id=inputPic src={{{userPicUrl}}} class=pic>\n  <div id=inputs>\n    <input id=inputName value={{userName}}>\n    <form id=inputForm action=javascript:chat.postMessage()>\n      <input id=commentInput value={{newComment}} silent>\n    </form>\n  </div>\n</div>");
    view.preLoad(function() {
      var container, foot, messageList, winResize;
      container = $("messageContainer");
      foot = $("foot");
      messageList = $("messageList");
      winResize = function() {
        container.style.height = (window.innerHeight - foot.offsetHeight) + "px";
        return container.scrollTop = messageList.offsetHeight;
      };
      winResize();
      window.onresize = winResize;
      return $("commentInput").focus();
    });
  }
  model.makeFunc("title", ["messages", "_session.user.name"], function(messages, userName) {
    return "Chat (" + messages.length + ") - " + userName;
  });
  view.make("message", function(item) {
    return {
      userPicUrl: {
        model: "users." + item.userId + ".picUrl"
      },
      userName: {
        model: "users." + item.userId + ".name"
      },
      comment: item.comment
    };
  }, "<li><img src={{{userPicUrl}}} class=pic>\n  <div class=message>\n    <p><b>{{userName}}</b>\n    <p>{{comment}}\n  </div>", {
    after: function() {
      return $("messageContainer").scrollTop = $("messageList").offsetHeight;
    }
  });
  exports.postMessage = function() {
    model.push("messages", {
      userId: model.get("_session.userId"),
      comment: model.get("_session.newComment")
    });
    return model.set("_session.newComment", "");
  };
}).call(this);
;
    }).call(module.exports);
    
    _browserifyRequire.modules["./chat"]._cached = module.exports;
    return module.exports;
};

_browserifyRequire.modules["./chat"] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = ".";
    var __filename = "./chat.js";
    
    var require = function (path) {
        return _browserifyRequire.fromFile("./chat", path);
    };
    
    (function () {
        var model, vers, view, _;
vers = require("vers")(module, exports);
_ = exports.utils = vers.utils;
model = vers.model;
view = vers.view;
if (_.onServer) {
  model.init({
    users: {},
    messages: [],
    _session: {
      userId: 0,
      user: model.ref("users", "_session.userId"),
      newComment: "",
      title: model.func("title")
    }
  });
  view.make("Title", {
    model: "_session.title"
  });
  require("fs").readFile("" + __dirname + "/chat.styl", "utf8", function(err, styl) {
    return require("stylus").render(styl, {
      compress: true
    }, function(err, css) {
      return view.make("Head", "<meta name=viewport content=\"width=device-width\">\n<style>" + css + "</style>");
    });
  });
  view.make("Body", {
    messages: {
      model: "messages",
      view: "message"
    },
    userPicUrl: {
      model: "_session.user.picUrl"
    },
    userName: {
      model: "_session.user.name"
    },
    newComment: {
      model: "_session.newComment"
    }
  }, "<div id=messageContainer><ul id=messageList>{{{messages}}}</ul></div>\n<div id=foot>\n  <img id=inputPic src={{{userPicUrl}}} class=pic>\n  <div id=inputs>\n    <input id=inputName value={{userName}}>\n    <form id=inputForm action=javascript:chat.postMessage()>\n      <input id=commentInput value={{newComment}} silent>\n    </form>\n  </div>\n</div>");
  view.preLoad(function() {
    var container, foot, messageList, winResize;
    container = $("messageContainer");
    foot = $("foot");
    messageList = $("messageList");
    winResize = function() {
      container.style.height = (window.innerHeight - foot.offsetHeight) + "px";
      return container.scrollTop = messageList.offsetHeight;
    };
    winResize();
    window.onresize = winResize;
    return $("commentInput").focus();
  });
}
model.makeFunc("title", ["messages", "_session.user.name"], function(messages, userName) {
  return "Chat (" + messages.length + ") - " + userName;
});
view.make("message", function(item) {
  return {
    userPicUrl: {
      model: "users." + item.userId + ".picUrl"
    },
    userName: {
      model: "users." + item.userId + ".name"
    },
    comment: item.comment
  };
}, "<li><img src={{{userPicUrl}}} class=pic>\n  <div class=message>\n    <p><b>{{userName}}</b>\n    <p>{{comment}}\n  </div>", {
  after: function() {
    return $("messageContainer").scrollTop = $("messageList").offsetHeight;
  }
});
exports.postMessage = function() {
  model.push("messages", {
    userId: model.get("_session.userId"),
    comment: model.get("_session.newComment")
  });
  return model.set("_session.newComment", "");
};;
    }).call(module.exports);
    
    _browserifyRequire.modules["./chat"]._cached = module.exports;
    return module.exports;
};
