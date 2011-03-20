var dom = this.dom = require('./dom'),
    model = this.model = require('./model'),
    view = this.view = require('./view');

view.setModel(model);
view.setDom(dom);