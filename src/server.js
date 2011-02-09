var HOST = null; // localhost
var PORT = 8001;

var http = require('http');
var fs = require('fs');
var sys = require('sys');
var url = require('url');
var qs = require('querystring');
// var mongo = require('../lib/node-mongodb-native/lib/mongodb');
var io = require('../lib/socket.io/lib/socket.io');
var _ = require('../lib/underscore_1.1.4');
var chat = require('./chat');

// var mongoHost = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
// var mongoPort = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;

// console.log('Connecting to ' + mongoHost + ':' + mongoPort);
// var db = new mongo.Db('vers', new mongo.Server(mongoHost, mongoPort, {}), {});
// var dbItems;
// db.open(function(err, db) {
//   db.collection('items', function(err, collection) {
//     dbItems = collection;
//     collection.findOne({u:'sys'}, function(err, result) {
//       for (var key in result) {
//         client.setItem(key, result[key]);
//       }
//     });
//   });
// });
// var updateItem = function(key, value) {
//   if (dbItems) {
//     client.setItem(key, value);
//     var obj = {};
//     obj[key] = value;
//     dbItems.update({u:'sys'}, {$set:obj});
//   }
// };

var underscore = fs.readFileSync('../lib/underscore_1.1.4.js');

var getMap = {
  '/': function(req, res) {
    fs.readFile('chat.html', 'utf8', function(err, html) {
      fs.readFile('chat.js', 'utf8', function(err, js) {
        var out = chat.out._server();
        var body = out.body + '<script>' + js + out.script + '</script>';
        html = html.replace('{{body}}', out.body)
          .replace('{{script}}', underscore + js + out.script);
        res.htmlResponse(html);
      });
    });
  },
};
var postMap = {
  // '/set': function(req, res) {
  //   var data = '';
  //   req.addListener('data', function(chunk) {
  //     data += chunk;
  //   });
  //   req.addListener('end', function() {
  //     res.noContent();
  //     var query = qs.parse(data);
  //     for (var key in query) {
  //       updateItem(key, query[key]);
  //     }
  //   })
  // },
};
var requestMap = {GET:getMap, HEAD:getMap, POST:postMap};

var textResponse = function(body, type, code) {
  if (!code) code = 200;
  this.writeHead(code, {
    'Content-Length': body.length,
    'Content-Type': type + '; charset=utf-8'
  });
  this.write(body, 'utf8');
  this.end();
};
var notFound = function(req, res) {
  textResponse.call(res, 'Not found\n', 'text/plain', 404);
};
http.ServerResponse.prototype.noContent = function() {
  this.writeHead(204, {});
  this.end();
};
http.ServerResponse.prototype.htmlResponse = function(body, code) {
  textResponse.call(this, body, 'text/html', code);
};
http.ServerResponse.prototype.textResponse = function(body, code) {
  textResponse.call(this, body, 'text/plain', code);
};
http.ServerResponse.prototype.manifestResponse = function(body, code) {
  textResponse.call(this, body, 'text/cache-manifest', code);
};
http.ServerResponse.prototype.jsResponse = function(body, code) {
  textResponse.call(this, body, 'application/javascript', code);
};
http.ServerResponse.prototype.jsonResponse = function(obj, code) {
  var body = JSON.stringify(obj);
  textResponse.call(this, body, 'application/json', code);
};

var server = http.createServer(function(req, res) {
  var parsedUrl = url.parse(req.url);
  var handler = requestMap[req.method][parsedUrl.pathname] || notFound;
  handler(req, res);
});

var socket = io.listen(server, {transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']});
socket.on('connection', function(client) {      
  client.on('message', function(message) {
    var data = JSON.parse(message);
    chat.model[data[0]].apply(null, data[1]);
    client.broadcast(message);
  });
});

server.listen(PORT, HOST);
console.log('Server at http://' + (HOST || '127.0.0.1') + ':' + PORT.toString() + '/');