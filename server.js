var express = require('express'),
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
    newUserId = 0;

app.use(express.static('public'));
app.use(express.cookieParser());
app.use(express.session({ secret: 'steve_urkel' }));

app.get('/', function(req, res) {
  var userId = req.session.userId = _.isNumber(req.session.userId) ?
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