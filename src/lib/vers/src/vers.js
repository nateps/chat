var dom = exports.dom = require('./dom'),
    model = exports.model = require('./model'),
    view = exports.view = require('./view');

view.setModel(model);
view.setDom(dom);
dom.setModel(model);
model.setView(view);

module.exports = function(clientModule, clientExports) {
  if (process.title === 'node') {
    clientExports.dom = dom;
    clientExports.model = model;
    clientExports.view = view;
    clientExports.setSocket = model.setSocket;
    view.setClientName(/\/([^\/]+)\.js$/.exec(clientModule.filename)[1]);
  } else {
    clientModule.exports = function(count, modelData, modelEvents, domEvents) {
      view.uniqueId._count = count;
      model.init(modelData);
      model.events._names = modelEvents;
      dom.events._names = domEvents;
      return clientExports;
    }
  }
  return exports;
}