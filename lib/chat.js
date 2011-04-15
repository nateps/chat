var SPRITE_URL, model, vers, view, _;
SPRITE_URL = 'img/s.png';
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
    userPicClass: {
      model: '_session.user.picClass'
    },
    userName: {
      model: '_session.user.name'
    },
    newComment: {
      model: '_session.newComment'
    }
  }, "<pre id=messageContainer><ul id=messageList>{{{messages}}}</ul></pre>\n<div id=foot>\n  <img id=inputPic src=" + SPRITE_URL + " class={{{userPicClass}}}>\n  <div id=inputs>\n    <!-- By default, user changes to input values update the model. -->\n    <input id=inputName value={{userName}}>\n    <!-- The postMessage function is defined below. -->\n    <form id=inputForm action=javascript:chat.postMessage()>\n      <!-- \"silent\" is a special attribute that prevents the model from\n      generating update events when the user edits an input field. Thus,\n      the model is updated but not synced with the server or view. -->\n      <input id=commentInput value={{newComment}} silent>\n    </form>\n  </div>\n</div>");
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
    userPicClass: {
      model: "users." + item.userId + ".picClass"
    },
    userName: {
      model: "users." + item.userId + ".name"
    },
    comment: item.comment
  };
}, "<li><img src=" + SPRITE_URL + " class={{{userPicClass}}}>\n  <div class=message>\n    <p><b>{{userName}}</b>\n    <p>{{comment}}\n  </div>", {
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