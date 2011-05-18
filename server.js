var MAX_AGE_ONE_YEAR, MAX_MESSAGES, NUM_USER_IMAGES, app, chat, dbUrl, express, gzip, model, mongoStore, newUserId, _;
NUM_USER_IMAGES = 10;
MAX_MESSAGES = 100;
MAX_AGE_ONE_YEAR = {
  maxAge: 1000 * 60 * 60 * 24 * 365
};
dbUrl = (process.env.MONGODB_PATH || 'mongodb://127.0.0.1:27017') + '/chat';
mongoStore = require('connect-mongodb');
gzip = require('connect-gzip');
express = require('express');
app = express.createServer();
chat = require('./lib/chat')(app, dbUrl);
_ = chat.utils;
model = chat.model;
newUserId = 0;
chat.load = function() {
  var ids;
  ids = Object.keys(model.get('users'));
  if (ids.length) {
    return newUserId = _.arrayMax(ids) + 1;
  }
};
app.use(express.static('public', MAX_AGE_ONE_YEAR));
app.use(gzip.gzip());
app.use(express.cookieParser());
app.use(express.session({
  secret: '89-Black$turtLE@woRk',
  cookie: MAX_AGE_ONE_YEAR,
  store: new mongoStore({
    url: dbUrl
  })
}));
app.get('/', function(req, res) {
  return req.session.reload(function() {
    var messagesModel, session, userId, userPath;
    session = req.session;
    session.userId = userId = _.isNumber(session.userId) ? session.userId : newUserId++;
    req.session.save();
    userPath = 'users.' + userId;
    if (model.get(userPath) === null) {
      model.set(userPath, {
        name: 'User ' + (userId + 1),
        picClass: 'pic' + (userId % NUM_USER_IMAGES),
        userId: userId
      });
    }
    model.set('_session.userId', userId);
    messagesModel = model.get('messages');
    messagesModel.splice(0, Math.max(messagesModel.length - MAX_MESSAGES, 0));
    return res.send(chat.view.html());
  });
});
app.listen(process.env.PORT || 8001);