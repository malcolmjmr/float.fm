// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

var musicSchema = mongoose.Schema({
  title   : String,
  artist    : String,
  album   : String,
  genre   : String,
  location  : String,
  cover   : String
});

var librarySchema = mongoose.Schema({
  db_id: String
});

// expose models to app
module.exports = {
  user    : mongoose.model('User', userSchema),
  song    : mongoose.model('Song', musicSchema),
  userLibrary : mongoose.model('UserLibary', librarySchema)
};