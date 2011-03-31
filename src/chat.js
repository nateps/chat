var vers = require('./lib/vers'),
    dom = exports.dom = vers.dom,
    model = exports.model = vers.model,
    view = exports.view = vers.view;
exports.setSocket = vers.setSocket;

view.make('message',
  function(item) {
    return {
      userPicUrl: { model: 'users.' + item.userId + '.picUrl' },
      userName: { model: 'users.' + item.userId + '.name' },
      comment: item.comment
    };
  },
  '<li><img src="{{{userPicUrl}}}" class=pic>' +
    '<div class=message>' +
      '<p><b>{{userName}}</b>' +
      '<p>{{comment}}' +
    '</div>',
  function() {
    $('messageContainer').scrollTop = $('messageList').offsetHeight;
  }
);

view.make('body', {
    messages: { model: 'messages', view: 'message' },
    userPicUrl: { model: '_session.user.picUrl' },
    userName: { model: '_session.user.name' },
    newComment: { model: '_session.newComment' }
  },
  '<div id=messageContainer><ul id=messageList>{{{messages}}}</ul></div>' +
    '<div id=foot>' +
      '<img id=inputPic src="{{{userPicUrl}}}" class=pic>' +
      '<div id=inputs>' +
        '<input id=inputName value="{{userName}}">' +
        '<form id=inputForm action=javascript:chat.postMessage()>' +
          '<input id=commentInput value="{{newComment}}" silent>' +
        '</form>' +
      '</div>' +
    '</div>'
);

exports.postMessage = function() {
  model.push('messages', {
    userId: model.get('_session.userId'),
    comment: model.get('_session.newComment')
  });
  model.set('_session.newComment', '');
};