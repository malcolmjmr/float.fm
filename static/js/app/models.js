var Models = {
  reqData: function(options) {
    this.userId = "";
    if (app.user) {
      this.userId = app.user._id;
    }
    this.item = null;
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }
  },
  song: function(options) {
    
    this.title = "Unknown";
    this.artist = "Unknown";
    this.album = "Unknown";
    this.genre = "Unknown";
    this.location = {
      local: "Unknown",
      hosted: "Unknown",
      origin: "Unknown"
    };
    this.coverLocation = {
      local: "Unknown",
      hosted: "Unknown",
      origin: "Unknown"
    };
    this.hashtags = [];
    this.upvotes =  [app.user._id];
    this.downvotes =  [];
    this.playCount =  [];
    this.palyedBy = [{_id: app.user._id}];
    this.type = 'song';
    this.from = "Unknown";
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }
  },
  user: function(options) {

  },
  hashtag: function(options) {
    this.name = "Unknown";
    this.createdBy = app.user._id || "Unknown";
    this.createdOn = new Date(Date.now());
    this.followers = [app.user._id];
    this.playlists = [];
    this.stations = [];
    this.hashtags = [];
    this.upvotes = [app.user._id];
    this.downvotes = [];
    this.type = 'hashtag';
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }
  },
  playlist: function(options) {
    this.name = "Unknown";
    this.createdBy = app.user._id || "Unknown";
    this.createdOn = new Date(Date.now());
    this.songs = [];
    this.followers = [app.user._id];
    this.hashtags = [];
    this.upvotes = [app.user._id];
    this.downvotes = [];
    this.type = 'playlist';
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }
  },
  group: function(options) {
    this.name = "Unknown";
    this.createdBy = app.user._id || "Unknown";
    this.createdOn = new Date(Date.now());
    this.admins = [app.user._id];
    this.members = [app.user._id];
    this.songs = [];
    this.followers = [app.user._id];
    this.hashtags = [];
    this.votes = [{ user: app.user._id, vote: 1}];
    this.type = 'group';
    this.settings = {
      viewableByPublic: ['songs','followers','hashtags','votes']
    }
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }    
  },
  txn: function(options) {
    this.createdBy = "Unknown";
    this.createdOn = "Unknown";
    this.operation = "Unknown";
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }
  }
}

