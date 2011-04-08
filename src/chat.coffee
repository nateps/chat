vers = require("./lib/vers")(module, exports)
_ = exports.utils = vers.utils
model = vers.model
view = vers.view

if _.onServer
  model.init {
    users: {}
    messages: []
    _session: {
      userId: 0
      user: model.ref "users", "_session.userId"
      newComment: ""
      title: model.func "title"
    }
  }
  
  view.make "Title", {model: "_session.title"}
  
  require("fs").readFile "#{__dirname}/chat.styl", "utf8", (err, styl) ->
    require("stylus").render styl, {compress: true}, (err, css) ->
      view.make "Head", """
        <meta name=viewport content="width=device-width">
        <style>#{css}</style>
        """
  
  view.make "Body", {
      messages: {model: "messages", view: "message"}
      userPicUrl: {model: "_session.user.picUrl"}
      userName: {model: "_session.user.name"}
      newComment: {model: "_session.newComment"}
    }, """
    <div id=messageContainer><ul id=messageList>{{{messages}}}</ul></div>
    <div id=foot>
      <img id=inputPic src={{{userPicUrl}}} class=pic>
      <div id=inputs>
        <input id=inputName value={{userName}}>
        <form id=inputForm action=javascript:chat.postMessage()>
          <input id=commentInput value={{newComment}} silent>
        </form>
      </div>
    </div>
    """
  
  view.preLoad ->
    container = $("messageContainer")
    foot = $("foot")
    messageList = $("messageList")
    winResize = ->
      container.style.height = (window.innerHeight - foot.offsetHeight) + "px"
      container.scrollTop = messageList.offsetHeight
    winResize()
    window.onresize = winResize
    $("commentInput").focus()


model.makeFunc "title", ["messages", "_session.user.name"],
  (messages, userName) -> "Chat (#{messages.length}) - #{userName}"

view.make "message", (item) -> {
      userPicUrl: {model: "users.#{item.userId}.picUrl"}
      userName: {model: "users.#{item.userId}.name"}
      comment: item.comment
    },
  """
  <li><img src={{{userPicUrl}}} class=pic>
    <div class=message>
      <p><b>{{userName}}</b>
      <p>{{comment}}
    </div>
  """, {
    after: -> $("messageContainer").scrollTop = $("messageList").offsetHeight
  }

exports.postMessage = ->
  model.push "messages", {
    userId: model.get "_session.userId"
    comment: model.get "_session.newComment"
  }
  model.set "_session.newComment", ""