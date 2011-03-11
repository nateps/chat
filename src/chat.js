if (typeof window === 'undefined') {
  var vers = require('./vers');
  exports.model = vers.model;
  exports.view = vers.view;
  exports.setSocket = vers.setSocket;
}
var model = vers.model,
    view = vers.view;

if (typeof window === 'undefined') {
  model.init({
    users: {},
    messages: [],
    _session: {
      userId: 0,
      user: model.ref('users', '_session.userId'),
      newComment: ''
    }
  });
}

for (var i = 0; i < 1000; i++) {
view.make('message',
  function(item, index) {
    return {
      userPicUrl: { model: 'users.' + item.userId + '.picUrl' },
      userName: { model: 'users.' + item.userId + '.name' },
      comment: { model: 'messages.' + index + '.comment' }
    };
  },
  '<li><img src="{{{userPicUrl}}}" class=pic>' +
    '<div class=message>' +
      '<p><b>{{userName}}</b>' +
      '<p>{{comment}}' +
    '</div>',
  function() { window.scrollBy(0,9999); }
);

view.make('body', {
    messages: { model: 'messages', view: 'message' },
    userPicUrl: { model: '_session.user.picUrl' },
    userName: { model: '_session.user.name' },
    newComment: { model: '_session.newComment' }
  },
  '<ul id=messageList>{{{messages}}}</ul>' +
    '<div id=foot>' +
      '<img id=inputPic src="{{{userPicUrl}}}" class=pic>' +
      '<div id=inputs>' +
        '<input id=inputName value="{{userName}}">' +
        '<form id=inputForm action=javascript:postMessage()>' +
          '<input id=commentInput value="{{newComment}}" silent>' +
        '</form>' +
      '</div>' +
    '</div>'
);
}

function postMessage() {
  model.push('messages', {
    userId: model.get('_session.userId'),
    comment: model.get('_session.newComment')
  });
  model.set('_session.newComment', '');
}