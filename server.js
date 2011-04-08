var dbUri = (process.env.MONGODB_PATH || 'mongodb://127.0.0.1:27017') + '/chat',
    mongo = require('mongodb'),
    mongoStore = require('connect-mongodb'),
    express = require('express'),
    connect = require('connect'),
    app = express.createServer(),
    chat = require('./src/chat')(app),
    _ = chat.utils,
    userImages = [
      '/images/user_red.png',
      '/images/user_blue.png',
      '/images/user_green.png',
      '/images/user_light_gray.png',
      '/images/user_yellow.png',
      '/images/user_purple.png',
      '/images/user_orange.png',
      '/images/user_magenta.png',
      '/images/user_cyan.png',
      '/images/user_dark_gray.png',
    ],
    newUserId = 0,
    MAX_MESSAGES = 100,
    db, messages, users;

function skipMessages(count) {
  return Math.max(count - MAX_MESSAGES, 0);
}

function loadDb() {
  messages.count(function(err, count) {
    messages.find({}, { skip: skipMessages(count) }, function(err, cursor) {
      cursor.toArray(function(err, a) {
        a.forEach(function(item) {
          delete item._id;
        });
        chat.model.set('messages', a);
      });
    });
  });
  users.find(function(err, cursor) {
    cursor.each(function(err, user) {
      if (user && _.isDefined(user.userId)) {
        delete user._id;
        newUserId = Math.max(user.userId + 1, newUserId);
        chat.model.set('users.' + user.userId, user);
      }
    });
  });
}

mongo.connect(dbUri, function(err, obj) {
  db = obj;
  db.collection('messages', function(err, obj) {
    messages = obj;
    db.collection('users', function(err, obj) {
      users = obj;
      loadDb();
    });
  });
});

chat.socket.on('connection', function(client) {      
  client.on('message', function(message) {
    var data = JSON.parse(message),
        method = data[0],
        args = data[1],
        modelPath = args[0].split('.'),
        value = args[1],
        userId, user;
    if (method === 'push' && modelPath[0] === 'messages') {
      messages.insert(value);
    }
    if (method === 'set' && modelPath[0] === 'users' && (userId = modelPath[1])) {
      user = chat.model.get('users.' + userId);
      users.update({ userId: user.userId }, user);
    }
  });
});

function parseConnectionURL(url) {
  var config = require('url').parse(url),
      auth = null;

  if (!config.protocol.match(/^mongo/)) {
    throw new Error("URL must be in the format mongo://user:pass@host:port/dbname");
  }

  if (config.auth) {
    auth = config.auth.split(':', 2);
  }

  return {
    host: config.hostname || defaults.host,
    port: config.port || defaults.port,
    dbname: config.pathname.replace(/^\//, '') || defaults.dbname,
    username: auth && auth[0],
    password: auth && auth[1]
  };
}

app.use(express.static('public'));
app.use(express.cookieParser());
app.use(express.session({
  secret: 'steve_urkel',
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 * 10 }, // 10 years
  store: mongoStore(parseConnectionURL(dbUri))
}));

app.get('/', function(req, res) {
  var userId = req.session.userId = _.isNumber(req.session.userId) ?
        req.session.userId : newUserId++,
      modelName = 'users.' + userId,
      newUser, messagesModel;
  if (chat.model.get(modelName) === null) {
    newUser = {
      name: 'User ' + (userId + 1),
      picUrl: userImages[userId % userImages.length],
      userId: userId
    };
    chat.model.set(modelName, newUser, true);
    users.update({ userId: userId }, newUser, { upsert: true });
  };
  chat.model.set('_session.userId', userId);
  messagesModel = chat.model.get('messages');
  // TODO: There should be a model method to remove elements from an array.
  // I'm just splicing the messages list in the server's model, since I don't intend
  // to update connected clients
  messagesModel.splice(0, skipMessages(messagesModel.length));
  res.send(chat.view.html());
});

// This should work with Joyent
app.listen(process.env.PORT || 8001);