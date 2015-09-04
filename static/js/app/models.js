 /* reqData: function(reqType) {
    switch (reqType) {
      case 'create': item obj
      required:
        item.type 
      case 'update': label and updates 
      required: 
        createLabel
        updates = []
      case 'get_item': label
      required: 
        createLabel
      case 'get_collection': collectionName
      required:
        collectionName
      case 'download': song item
        item.from
        item.location.origin 
      default:

    }
  }
*/ 

var Models = {
  song: function(options) {   
    this.title = "Unknown";
    this.artist = "Unknown";
    this.album = "Unknown";
    this.genre = "Unknown";
    this.location = {
      local: null,
      hosted: null,
      origin: null
    };
    this.coverLocation = {
      local: null,
      hosted: null,
      origin: null
    };
    this.isPublic = true;
    this.hashtags = [];
    this.votes = [createLabel(app.user)+':1'];
    this.txnHistory = [];
    this.playCount =  [];
    this.palyedBy = [createLabel(app.user)+':0'];
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
    this.followers = [createLabel(app.user)];
    this.playlists = [];
    this.stations = [];
    this.hashtags = [];
    this.txnHistory = [];
    this.votes = [{_id: createLabel(app.user), vote: 1}];
    this.type = 'hashtag';
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }
  },
  playlist: function(options) {
    this.name = "Unknown";
    this.songs = [];
    this.followers = [createLabel(app.user)];
    this.hashtags = [];
    this.upvotes = [createLabel(app.user)];
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
    this.admins = [createLabel(app.user)];
    this.members = [createLabel(app.user)];
    this.pendingMembers = [];
    this.songs = [];
    this.followers = [createLabel(app.user)];
    this.hashtags = [];
    this.votes = [createLabel(app.user)+':1'];
    this.type = 'group';
    this.txnHistory = [];
    this.settings = {
      viewableByPublic: ['songs','followers','hashtags','votes']
    },
    this.isPublic = false;
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }    
  },
  station: function (options) {
    this.name = "Unknown";
    this.state = {
      changed: false,
      currentSongIndex: null,
      currentSongDuration: null,
      currentLocation: 0,
      currentVolume: 100,
      currentStationIndex: null,
      isPlaying: false,
      queue: [],
      queueOrder: [],
      queueUpdates: [],
      repeat: 'none',
      shuffle: 'none'  
    };
    if (options) {
      for (option in options) {
        this[option] = options[option];
      }
    }

  }
}
