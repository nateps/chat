var fs = require('fs'),
    express = require('express'),
    app = express.createServer(),
    chat = require('./src/chat')(app),
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
    newUserId = 0;

chat.model.init({
  users: {},
  messages: [],
  _session: {
    userId: 0,
    user: chat.model.ref('users', '_session.userId'),
    newComment: ''
  }
});

app.use(express.static('public'));
app.use(express.cookieParser());
app.use(express.session({ secret: 'steve_urkel' }));

app.get('/', function(req, res) {
  var userId = req.session.userId = (typeof req.session.userId === 'number') ?
        req.session.userId : newUserId++,
      modelName = 'users.' + userId;
  if (chat.model.get(modelName) === null) {
    chat.model.set(modelName, {
      name: 'User ' + (userId + 1),
      picUrl: userImages[userId % userImages.length]
    }, true);
  };
  chat.model.set('_session.userId', userId);
  res.send(chat.view.html());
});

app.listen(8001);