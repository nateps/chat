var mongolian = new (require('./lib/mongolian'))(),
    db = mongolian.db('chat'),
    messages = db.collection('messages'),
    users = db.collection('users'),
    mongoStore = require('connect-mongodb'),
    express = require('express'),
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
    MAX_MESSAGES = 100;

function skipMessages(count) {
  return Math.max(count - MAX_MESSAGES, 0);
}

messages.count(function(err, count) {
  messages.find().skip(skipMessages(count)).toArray(function(err, array) {
    array.forEach(function(item) {
      delete item._id;
    });
    chat.model.set('messages', array);
  });
});
users.find().forEach(function(user) {
  delete user._id;
  newUserId = Math.max(user.userId + 1, newUserId);
  chat.model.set('users.' + user.userId, user);
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

app.use(express.static('public'));
app.use(express.cookieParser());
app.use(express.session({
  secret: 'steve_urkel',
  store: mongoStore({
    dbname: 'chat'
  })
}));

app.get('/', function(req, res) {
  var userId = req.session.userId = _.isNumber(req.session.userId) ?
        req.session.userId : newUserId++,
      modelName = 'users.' + userId,
      newUser, messages;
  if (chat.model.get(modelName) === null) {
    newUser = {
      name: 'User ' + (userId + 1),
      picUrl: userImages[userId % userImages.length],
      userId: userId
    };
    chat.model.set(modelName, newUser, true);
    users.upsert({ userId: userId }, newUser);
  };
  chat.model.set('_session.userId', userId);
  messages = chat.model.get('messages');
  // TODO: There should be a model method to remove elements from an array.
  // I'm just splicing the messages list in the server's model, since I don't intend
  // to update connected clients
  messages.splice(0, skipMessages(messages.length));
  res.send(chat.view.html());
});

// Using this port, since it supports websockets on duostack
app.listen(9980);