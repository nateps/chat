SPRITE_URL = 'img/s.png'

# The local "module" and "exports" objects are passed to Vers, so that it can
# expose certain functions on this module for the server or client code.
vers = require('vers')(module, exports)
_ = exports.utils = vers.utils
model = vers.model
view = vers.view

if _.onServer
  
  # MODEL INITIALIZATION #
  
  # Sets up the default contents of the model. There is no need to specify
  # schemas in advance. Anything added to the model gets synced between the
  # server, clients, and database. When the server restarts, the previous state
  # of the model is loaded from the database.
  model.init {
    users: {}
    messages: []
    # Any path name that starts with an underscore is private to the current
    # client. Nothing set under that path is synced with other clients or saved
    # to the database.
    _session: {
      userId: 0
      # All model objects are JSON, which makes client initialization faster
      # and syncing simpler. References are indicated by a special JSON format.
      user: model.ref 'users', '_session.userId'
      newComment: ''
      # Model functions are evaluated when any of their inputs change. This is
      # useful, since fields in views must be tied to a single model object.
      title: model.func 'title'
    }
  }
  
  
  # SERVER ONLY VIEW DEFINITION #
  
  # There are a handful of reserved view names -- Title, Head, Body, and Foot.
  # These are rendered when the view.html function is called by the server.
  # The rendering order is doctype, Title, Head, Body, preLoad scripts,
  # external JS, model and event initialization scripts, and then Foot.
  
  # There are a few ways to specifiy views. The Title must be a simple view,
  # which means that it is tied to the value of one model object, a string,
  # or a function that returns a string.
  view.make 'Title', {model: '_session.title'}
  
  # Head and Foot are typically simple views that output a string.
  require('fs').readFile "#{__dirname}/chat.styl", 'utf8', (err, styl) ->
    require('stylus').render styl, {compress: true}, (err, css) ->
      view.make 'Head', """
        <meta name=viewport content="width=device-width">
        <style>#{css}</style>
        """.replace /\n/g, ''
  
  # The Body and user defined views can be a function of multiple model objects.
  # The template fields can be specified by an object literal or function that
  # returns a similarly formatted object. The template must be a string of HTML,
  # which is parsed when the view is created. Fields in double braces are
  # escaped and fields in triple braces are not. Note that this template does
  # not only specify the initial HTML rendering; event handlers are created to
  # update the DOM when the model changes and update the model when certain
  # user events occur.
  view.make 'Body', {
      # A field can be output by another view function tied to a model object.
      # If the model object is an array, the view function will be called for
      # each item in the array, and the outputs will be concatenated together.
      messages: {model: 'messages', view: 'message'}
      userPicClass: {model: '_session.user.picClass'}
      userName: {model: '_session.user.name'}
      newComment: {model: '_session.newComment'}
    }, """
    <div id=messageContainer><ul id=messageList>{{{messages}}}</ul></div>
    <div id=foot>
      <img id=inputPic src=#{SPRITE_URL} class={{{userPicClass}}}>
      <div id=inputs>
        <!-- By default, user changes to input values update the model. -->
        <input id=inputName value={{userName}}>
        <!-- The postMessage function is defined below. -->
        <form id=inputForm action=javascript:chat.postMessage()>
          <!-- "silent" is a special attribute that prevents the model from
          generating update events when the user edits an input field. Thus,
          the model is updated but not synced with the server or view. -->
          <input id=commentInput value={{newComment}} silent>
        </form>
      </div>
    </div>
    """
  
  # Scripts required to properly render the document can be passed in an
  # anonymous function to view.preLoad. These scripts will be executed before
  # any external scripts are downloaded, so they will typically happen before
  # the browser paints. For conciseness, document.getElementById is aliased
  # as $, but no other special functions are provided by default.
  view.preLoad ->
    container = $('messageContainer')
    foot = $('foot')
    messageList = $('messageList')
    winResize = ->
      container.style.height = (window.innerHeight - foot.offsetHeight) + 'px'
      container.scrollTop = messageList.offsetHeight
    winResize()
    window.onresize = winResize
    $('commentInput').focus()
else # Workaround for uglify


# MODEL FUNCTION DEFINITION #

# Model functions must be defined on both the server and client, since only
# the name of the model function is stored in the model itself. The inputs to
# model functions are defined via an array of names. The function is called
# with their values as arguments after any of the inputs are modified.
model.makeFunc 'title', ['messages', '_session.user.name'],
  (messages, userName) -> "Chat (#{messages.length}) - #{userName}"


# SERVER & CLIENT VIEW DEFINITION #

# This is an example of a custom view. Since it is bound to an array, each item
# in the array is passed as an argument.
view.make 'message', (item) -> {
      userPicClass: {model: "users.#{item.userId}.picClass"}
      userName: {model: "users.#{item.userId}.name"}
      comment: item.comment
    },
  """
  <li><img src=#{SPRITE_URL} class={{{userPicClass}}}>
    <div class=message>
      <p><b>{{userName}}</b>
      <p>{{comment}}
    </div>
  """, {
    # The "after" option specifies a function to execute after the view is
    # rendered. If a view that has an after function is rendered on the server,
    # the after function will be added to the preLoad functions.
    after: -> $('messageContainer').scrollTop = $('messageList').offsetHeight
  }


# USER FUNCTIONS DEFINITION #

# Exported functions are exposed to the client on a global object with the same
# name as this module. This function is called by the form submission action.
exports.postMessage = ->
  model.push 'messages', {
    userId: model.get '_session.userId'
    comment: model.get '_session.newComment'
  }
  model.set '_session.newComment', ''