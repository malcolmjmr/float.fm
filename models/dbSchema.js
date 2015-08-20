// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    firstName       : String,
    lastName        : String,
    age              : String,
    groups           : Array,
    songs            : Array,
    playlists        : Array,
    stations         : Array,
    txnHistory      : Array, 
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
    },
    active           : Boolean

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
  hashtags: Array,
  upvotes : Array,
  downvotes: Array,
  stations : Array,
  playCount: Array,
  playedBy: Array,
  type: String
});

var groupSchema = mongoose.Schema({
  name        : String,
  createdBy   : String,
  createdOn   : String,
  admins      : Array,
  members     : Array,
  following   : Array,
  playlists   : Array,
  stations    : Array,
  hashtags    : Array,
  txnHistory  : Array,
  upvotes     : Array,
  downvotes   : Array,
  type        : String,
  active      : Boolean
});

var stationSchema = mongoose.Schema({
  name          : String,
  createdBy     : String,
  createdOn     : String,
  admins        : Array,
  members       : Array,
  following     : Array,
  songs         : Array,
  hashtags      : Array,
  upvotes       : Array,
  downvotes     : Array,
  type          : String,
  status        : Boolean
});

var sessionSchema = mongoose.Schema({
  _id : String,
  session : Object,
  expires : Date 
});

// expose models to app
module.exports = {
  user    : mongoose.model('user', userSchema),
  group   : mongoose.model('group', groupSchema),
  song    : mongoose.model('song', songSchema),
  station : mongoose.model('station', stationSchema),
  session : mongoose.model('session', sessionSchema)
};