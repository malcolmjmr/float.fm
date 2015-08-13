module.exports = {
  'url' : 'mongodb://localhost/float',
  'addTo': function(app) {
    app.db = require('../models/dbSchema');
  }  
};