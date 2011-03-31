var express = require('express'),
    fs = require('fs'),
    io = require('socket.io'),
    browserify = require('browserify'),
    jsmin = require('jsmin').jsmin,
    chat = require('./src/chat');

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

chat.model.init({
  users: {},
  messages: [],
  _session: {
    userId: 0,
    user: chat.model.ref('users', '_session.userId'),
    newComment: ''
  }
});

var userImages = [
  '/images/user_red.png',
  '/images/user_green.png',
  '/images/user_blue.png',
  '/images/user_gray.png',
  '/images/user_darkpurple.png',
  '/images/user_grey.png',
  '/images/user_lightblue.png',
  '/images/user_orange.png',
  '/images/user_pink.png',
  '/images/user_yellow.png',
];
var newUserId = 0;

var app = express.createServer();
app.use(express.static('public'));
app.use(express.cookieParser());
app.use(express.session({ secret: 'steve_urkel' }));
app.use(browserify({
  base: __dirname + '/src',
  mount: '/browserify.js',
  filter: jsmin
}));

app.get('/', function(req, res) {
  var userId = req.session.userId;
  req.session.userId = userId = (typeof userId === 'undefined') ? newUserId++ : userId;
  fs.readFile('src/chat.html', 'utf8', function(err, html) {
    fs.readFile('src/chat.js', 'utf8', function(err, js) {
      if (chat.model.get('users.' + userId) === null) {
        chat.model.set('users.' + userId, {
          name: 'User ' + (userId + 1),
          picUrl: userImages[userId % 10]
        }, true);
      };
      chat.model.set('_session.userId', userId);
      html = html.replace('{{body}}', chat.view.server());
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
chat.model.setSocket(socket);

app.listen(8001);