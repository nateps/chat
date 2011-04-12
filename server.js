var dbUrl = (process.env.MONGODB_PATH || 'mongodb://127.0.0.1:27017') + '/chat',
    mongo = require('mongodb'),
    mongoStore = require('connect-mongodb'),
    express = require('express'),
    app = express.createServer(),
    chat = require('./lib/chat')(app),
    _ = chat.utils,
    NUM_USER_IMAGES = 10,
    MAX_MESSAGES = 100,
    newUserId = 0,
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

mongo.connect(dbUrl, function(err, obj) {
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

app.use(express.static('public', { maxAge: 1000 * 60 * 60 * 24 * 365 }));
app.use(express.cookieParser());
app.use(express.session({
  secret: 'steve_urkel',
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 },
  store: mongoStore({ url: dbUrl })
}));

app.get('/', function(req, res) {
  var userId = req.session.userId = _.isNumber(req.session.userId) ?
        req.session.userId : newUserId++,
      modelName = 'users.' + userId,
      newUser, messagesModel;
  
  if (chat.model.get(modelName) === null) {
    newUser = {
      name: 'User ' + (userId + 1),
      picUrl: 'img/s.png',
      picClass: 'pic' + (userId % NUM_USER_IMAGES),
      userId: userId
    };
    chat.model.set(modelName, newUser, true);
    users.update({ userId: userId }, newUser, { upsert: true });
  };
  chat.model.set('_session.userId', userId);
  
  // This splices the messages list in the server's model, which doesn't
  // update the model of any already connected clients.
  messagesModel = chat.model.get('messages');
  messagesModel.splice(0, skipMessages(messagesModel.length));
  
  res.send(chat.view.html());
});

app.listen(process.env.PORT || 8001);
