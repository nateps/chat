NUM_USER_IMAGES = 10
MAX_MESSAGES = 100
MAX_AGE_ONE_YEAR = {maxAge: 1000 * 60 * 60 * 24 * 365}

dbUrl = (process.env.MONGODB_PATH || 'mongodb://127.0.0.1:27017') + '/chat'
mongoStore = require 'connect-mongodb'
express = require 'express'
app = express.createServer()
chat = require('./lib/chat')(app, dbUrl)
_ = chat.utils
model = chat.model
newUserId = 0

# This function is called after the database reloads the model.
chat.load = ->
  # Figure out what the largest assigned userId is, and start assigning new IDs
  # after that.
  ids = Object.keys model.get 'users'
  if ids.length then newUserId = _.arrayMax(ids) + 1

# Use Express to serve the image sprite and deal with session tracking.
app.use express.static 'public', MAX_AGE_ONE_YEAR
app.use express.cookieParser()
app.use express.session {
  secret: '89-Black$turtLE@woRk'
  cookie: MAX_AGE_ONE_YEAR
  store: mongoStore {url: dbUrl}
}

app.get '/', (req, res) ->
  # If the client already has a session cookie with a userId set, use that.
  # Otherwise, set to a new ID value
  session = req.session
  session.userId = userId =
    if _.isNumber(session.userId) then session.userId else newUserId++
  
  userPath = 'users.' + userId
  if model.get(userPath) is null
    # Model updates on the server are pushed to all connected clients
    model.set userPath, {
      name: 'User ' + (userId + 1)
      picClass: 'pic' + (userId % NUM_USER_IMAGES)
      userId: userId
    }
  # This value is under a private path (starts with an underscore), so it won't
  # update the model of any connected clients
  model.set '_session.userId', userId
  
  # Limit the number of messages sent on page load to MAX_MESSAGES.
  # This splices the messages list in the server's internal model object
  # directly, so it does not update the model of any connected clients.
  messagesModel = model.get 'messages'
  messagesModel.splice 0, Math.max(messagesModel.length - MAX_MESSAGES, 0);
  
  # The view.html function performs rendering and returns the page
  res.send chat.view.html()

app.listen process.env.PORT || 8001