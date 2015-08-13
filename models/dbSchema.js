// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    first_name       : String,
    last_name        : String,
    age              : String,
    groups           : Array,
    stations         : Array,
    txn_history      : Array, 
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

var songSchema = mongoose.Schema({
  title   : String,
  artist  : String,
  album   : String,
  genre   : String,
  location  : String,
  cover   : String,
  upvotes : String,
  downvotes: String,
  stations : String
});

var groupSchema = mongoose.Schema({
  createdBy   : String,
  createdOn   : String,
  admins      : Array,
  members     : Array,
  following   : Array,
  stations    : Array,
  txn_history : Array
});

var stationSchema = mongoose.Schema({
  createdBy     : String,
  createdOn     : String,
  admins        : Array,
  members       : Array,
  following     : Array,
  songs         : Array,
  acceptedSongs : Array,
  pendingSongs  : Array
});

var librarySchema = mongoose.Schema({
  db_id: String
});

// expose models to app
module.exports = {
  User    : mongoose.model('User', userSchema),
  Group   : mongoose.model('Group', groupSchema),
  Song    : mongoose.model('Song', songSchema),
  Station : mongoose.model('Station', stationSchema)
};