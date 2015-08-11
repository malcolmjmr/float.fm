module.exports = {
    'url' : 'mongodb://heroku_app34930429:62frkdrunskournnu7fb2s0h0b@ds053251.mongolab.com:53251/heroku_app34930429',
    'addTo': function(app) {
      app.db = require('../models/dbSchema');
    }
    
};