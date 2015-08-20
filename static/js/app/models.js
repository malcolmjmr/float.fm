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
      hosted: "Unknown"
    };
    this.coverLocation = {
      local: "Unknown",
      hosted: "Unknown"
    };
    this.hashtags = [];
    this.upvotes =  [app.user._id];
    this.downvotes =  [];
    this.playCount =  [];
    this.palyedBy = [];
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
  group: function(options) {
    this.name = "Unknown";
    this.createdBy = app.user._id || "Unknown";
    this.createdOn = new Date(Date.now());
    this.admins = [app.user._id];
    this.members = [app.user._id];
    this.following = [app.user._id];
    this.playlists = [];
    this.stations = [];
    this.hashtags = [];
    this.upvotes = [app.user._id];
    this.downvotes = [];
    this.type = 'group';
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
    this.following = [app.user._id];
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
  station: function(options) {
    this.name = "Unknown";
    this.createdBy = app.user._id || "Unknown";
    this.createdOn = new Date(Date.now());
    this.songs = [];
    this.following = [app.user._id];
    this.hashtags = [];
    this.upvotes = [app.user._id];
    this.downvotes = [];
    this.type = 'station';
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

