var dom = exports.dom = require('./dom'),
    model = exports.model = require('./model'),
    view = exports.view = require('./view'),
    _ = exports.utils = require('./utils');

dom._link(model);
model._link(view);
view._link(dom, model);

module.exports = function(clientModule, clientExports) {
  if (_.onServer) {
    clientExports.dom = dom;
    clientExports.model = model;
    clientExports.view = view;
    clientExports.setSocket = model.setSocket;
    view.setClientName(/\/([^\/]+)\.js$/.exec(clientModule.filename)[1]);

    clientModule.exports = function(app) {
      var io = require('socket.io'),
          browserify = require('browserify'),
          jsmin = require('jsmin').jsmin,
          socket = io.listen(app, {transports:
            ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
          });
      socket.on('connection', function(client) {      
        client.on('message', function(message) {
          var data = JSON.parse(message),
              method = data[0],
              args = data[1];
          // Don't store or send to other clients if the model path contains a name
          // that starts with an underscore
          if (!/(^_)|(\._)/.test(args[0])) {
            model[method].apply(null, args);
            client.broadcast(message);
          }
        });
      });
      model.setSocket(socket);

      app.use(browserify({
        base: clientModule.paths[0].replace('/node_modules', ''),
        mount: '/browserify.js',
        filter: jsmin
      }));

      return clientExports;
    };
  } else {
    clientModule.exports = function(count, modelData, modelEvents, domEvents) {
      view.uniqueId._count = count;
      model.init(modelData);
      model.events._names = modelEvents;
      dom.events._names = domEvents;
      return clientExports;
    };
  }

  return exports;
};