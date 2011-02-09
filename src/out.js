out._parse = function(data, template) {
  var modelEvents = [],
      domEvents = [],
      output = [];
  
  htmlParser(template, {
    start: function(tag, attrs, unary) {},
    end: function(tag) {},
    chars: function(text) {},
    comment: function(text) {}
  });
  
  this = function(data, template) {
    _.each(modelEvents, function(item) {
      model.events.bind.apply(null, item);
    });
    _.each(domEvents, function(item) {
      dom.events.bind.apply(null, item);
    });
    return output.join('');
  };
  return this(data, template);
};

out.message = function(message, index) {
  return out._parse({
      userPicUrl: { model: 'users.' + message.userId + '.picUrl' },
      userName: { model: 'users.' + message.userId + '.name' },
      comment: { model: 'messages.' + index + '.comment' }
    },
    '<li><img src="{{{userPicUrl}}}" class=userPic>' +
      '<div class=message>' +
        '<p><b>{{userName}}</b>' +
        '<p>{{comment}}' +
      '</div>'
  );
};

out.body = function() {
  return out._parse({
      messages: { model: 'messages', transform: 'message' },
      userPicUrl: { model: 'session.user.picUrl' },
      userName: { model: 'session.user.name' },
      newComment: { model: 'session.newComment', silent: true }
    },
    '<ul id=messageList>{{messages}}</ul>' +
      '<div id=foot>' +
        '<img id=inputPic src="{{{userPicUrl}}}" class=pic>' +
        '<div id=inputs>' +
          '<input id=inputName value="{{userName}}"> <b>(your nickname)</b>' +
          '<form id=inputForm action=javascript:postMessage()>' +
            '<input id=commentInput value="{{newComment}}">' +
          '</form>' +
        '</div>' +
      '</div>'
  );
};

var postMessage = function() {
  model.push('messages', {
    userId: model.get('session.userId'),
    comment: model.get('session.newComment')
  });
  model.set('session.newComment', '');
}