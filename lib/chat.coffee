SPRITE_URL = 'img/s.png'

vers = require('vers')(module, exports)
_ = exports.utils = vers.utils
model = vers.model
view = vers.view

if _.onServer
  model.init {
    users: {}
    messages: []
    _session: {
      userId: 0
      user: model.ref 'users', '_session.userId'
      newComment: ''
      title: model.func 'title'
    }
  }
  
  view.make 'Title', {model: '_session.title'}
  
  require('fs').readFile "#{__dirname}/chat.styl", 'utf8', (err, styl) ->
    require('stylus').render styl, {compress: true}, (err, css) ->
      view.make 'Head', """
        <meta name=viewport content="width=device-width">
        <style>#{css}</style>
        """.replace /\n/g, ''
  
  view.make 'Body', {
      messages: {model: 'messages', view: 'message'}
      userPicClass: {model: '_session.user.picClass'}
      userName: {model: '_session.user.name'}
      newComment: {model: '_session.newComment'}
    }, """
    <pre id=messageContainer><ul id=messageList>{{{messages}}}</ul></pre>
    <div id=foot>
      <img id=inputPic src=#{SPRITE_URL} class={{{userPicClass}}}>
      <div id=inputs>
        <input id=inputName value={{userName}}>
        <form id=inputForm action=javascript:chat.postMessage()>
          <input id=commentInput value={{newComment}} silent>
        </form>
      </div>
    </div>
    """
  
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

model.makeFunc 'title', ['messages', '_session.user.name'],
  (messages, userName) -> "Chat (#{messages.length}) - #{userName}"

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
    after: -> $('messageContainer').scrollTop = $('messageList').offsetHeight
  }

exports.postMessage = ->
  model.push 'messages', {
    userId: model.get '_session.userId'
    comment: model.get '_session.newComment'
  }
  model.set '_session.newComment', ''