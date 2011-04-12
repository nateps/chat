var model, vers, view, _;
vers = require('vers')(module, exports);
_ = exports.utils = vers.utils;
model = vers.model;
view = vers.view;
if (_.onServer) {
  model.init({
    users: {},
    messages: [],
    _session: {
      userId: 0,
      user: model.ref('users', '_session.userId'),
      newComment: '',
      title: model.func('title')
    }
  });
  view.make('Title', {
    model: '_session.title'
  });
  require('fs').readFile("" + __dirname + "/chat.styl", 'utf8', function(err, styl) {
    return require('stylus').render(styl, {
      compress: true
    }, function(err, css) {
      return view.make('Head', ("<meta name=viewport content=\"width=device-width\">\n<style>" + css + "</style>").replace(/\n/g, ''));
    });
  });
  view.make('Body', {
    messages: {
      model: 'messages',
      view: 'message'
    },
    userPicUrl: {
      model: '_session.user.picUrl'
    },
    userName: {
      model: '_session.user.name'
    },
    newComment: {
      model: '_session.newComment'
    }
  }, "<div id=messageContainer><ul id=messageList>{{{messages}}}</ul></div>\n<div id=foot>\n  <img id=inputPic src={{{userPicUrl}}} class=pic>\n  <div id=inputs>\n    <input id=inputName value={{userName}}>\n    <form id=inputForm action=javascript:chat.postMessage()>\n      <input id=commentInput value={{newComment}} silent>\n    </form>\n  </div>\n</div>");
  view.preLoad(function() {
    var container, foot, messageList, winResize;
    container = $('messageContainer');
    foot = $('foot');
    messageList = $('messageList');
    winResize = function() {
      container.style.height = (window.innerHeight - foot.offsetHeight) + 'px';
      return container.scrollTop = messageList.offsetHeight;
    };
    winResize();
    window.onresize = winResize;
    return $('commentInput').focus();
  });
} else {

}
model.makeFunc('title', ['messages', '_session.user.name'], function(messages, userName) {
  return "Chat (" + messages.length + ") - " + userName;
});
view.make('message', function(item) {
  return {
    userPicUrl: {
      model: "users." + item.userId + ".picUrl"
    },
    userName: {
      model: "users." + item.userId + ".name"
    },
    comment: item.comment
  };
}, "<li><img src={{{userPicUrl}}} class=pic>\n  <div class=message>\n    <p><b>{{userName}}</b>\n    <p>{{comment}}\n  </div>", {
  after: function() {
    return $('messageContainer').scrollTop = $('messageList').offsetHeight;
  }
});
exports.postMessage = function() {
  model.push('messages', {
    userId: model.get('_session.userId'),
    comment: model.get('_session.newComment')
  });
  return model.set('_session.newComment', '');
};