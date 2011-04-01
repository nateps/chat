var vers = require('./lib/vers')(module, exports),
    model = vers.model,
    view = vers.view,
    stylus, fs, styles;

if (process.title === 'node') {
  stylus = require('stylus');
  fs = require('fs');
  styles = fs.readFileSync(__dirname + '/chat.styl', 'utf8');
  
  stylus.render(styles, {compress: true}, function(err, css){
    view.head('<meta name=viewport content=width=device-width>' + 
      '<style>' + css + '</style>'
    );
  });
  
  model.init({
    users: {},
    messages: [],
    _session: {
      userId: 0,
      user: model.ref('users', '_session.userId'),
      newComment: ''
    }
  });
  
  view.preLoad(function() {
    function winResize() {
      $('messageContainer').style.height =
        (window.innerHeight - $('foot').offsetHeight) + 'px';
      $('messageContainer').scrollTop = $('messageList').offsetHeight;
    }
    winResize();
    window.onresize = winResize;
    $('commentInput').focus();
  });
}

exports.make = function() {
  
  view.make('title', { model: '_session.title' });
  model.set('_session.title', model.func('title',
    ['messages', '_session.user.name'],
    function() {
      return 'Chat (' + model.get('messages').length + ') - ' +
        model.get('_session.user.name');
    }
  ));

  view.make('message',
    function(item) {
      return {
        userPicUrl: { model: 'users.' + item.userId + '.picUrl' },
        userName: { model: 'users.' + item.userId + '.name' },
        comment: item.comment
      };
    },
    '<li><img src={{{userPicUrl}}} class=pic>' +
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
        '<img id=inputPic src={{{userPicUrl}}} class=pic>' +
        '<div id=inputs>' +
          '<input id=inputName value={{userName}}>' +
          '<form id=inputForm action=javascript:chat.postMessage()>' +
            '<input id=commentInput value={{newComment}} silent>' +
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
  
};