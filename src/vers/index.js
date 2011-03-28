var dom = exports.dom = require('./dom'),
    model = exports.model = require('./model'),
    view = exports.view = require('./view');

view.setModel(model);
view.setDom(dom);
dom.setModel(model);
model.setView(view);