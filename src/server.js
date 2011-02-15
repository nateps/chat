var express = require('express');
var fs = require('fs');
var io = require('socket.io');
var _ = require('underscore');
var chat = require('./src/chat');

// var mongo = require('../lib/node-mongodb-native/lib/mongodb');
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

var app = express.createServer();

var underscore = fs.readFileSync('lib/underscore_1.1.4.js');
var vers = fs.readFileSync('src/vers.js');

var userImages = [
  '/images/user_red.png',
  '/images/user_green.png',
  '/images/user_blue.png',
  '/images/user_gray.png',
];
var newUserId = 0;

app.use(express.staticProvider('public'));
app.use(express.cookieDecoder());
app.use(express.session({ secret: 'steve_urkel' }));

app.get('/', function(req, res) {
  var userId = req.session.userId;
  req.session.userId = userId = _.isUndefined(userId) ? newUserId++ : userId;
  fs.readFile('src/chat.html', 'utf8', function(err, html) {
    fs.readFile('src/chat.js', 'utf8', function(err, js) {
      var out, body;
      if (chat.model.get('users.' + userId) === null) {
        chat.model.set('users.' + userId, {
          name: 'User ' + (userId + 1),
          picUrl: userImages[userId % 4]
        }, true);
      };
      chat.model.set('_session.userId', userId);
      out = chat.view.server();
      html = html.replace('{{body}}', out.body)
        .replace('{{script}}', underscore + vers + js + out.script);
      res.send(html);
    });
  });
});

var socket = io.listen(app, {transports:
  ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
});
socket.on('connection', function(client) {      
  client.on('message', function(message) {
    var data = JSON.parse(message),
        method = data[0],
        args = data[1];
    // Don't store or send to other clients if the model path contains a name
    // that starts with an underscore
    if (!/(^_)|(\._)/.test(args[0])) {
      chat.model[method].apply(null, args);
      client.broadcast(message);
    }
  });
});
chat.setSocket(socket);

app.listen(8001);