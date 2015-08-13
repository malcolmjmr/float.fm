// setup the backbone app and router
App = new Backbone.Marionette.Application();

App.addRegions({
  topRegion: "#navbar",
  leftRegion: "#left_sidebar",
  rightRegion: "#right_sidebar",
  bottomRegion: "#bottom_bar",
});
var Ui = {
  navbar: null,
  playlists: null,
  que: null,
  bottomBar: null,
  showNavbar: function(options){
    this.navbar = new NavbarView();
    App.topRegion.show(this.navbar);
  },
  showPlaylists: function(songs){
    this.playlists = new PlaylistView();
    this.playlists.songs = songs;
    App.leftRegion.show(this.playlists)
  },
  showQue: function(){
    this.redrawQue();
    setInterval(function() {
	  if (App.User.groups.current.playlist.changed) {
	    this.redrawQue();
	  }
    }, 50);
  },
  redrawQue : function() {
	var songs = App.User.groups.current.playlist.songs
	this.que = new PlaylistView();
	this.que.songs = songs;
	App.rightRegion.show(this.que);
  },
  showBottomBar: function(){
    this.bottomBar = new BottomBarView();
    App.bottomRegion.show(this.bottomBar);
  }
};

App.addInitializer(function(user){
  this.router = null;
  // setup the settings bar section
  this.User = user;
  this.Player = new PlayState();
  this.Player.init();
  this.Player.library;
  this.Ui = Ui;
  this.Ui.showNavbar();
  this.Ui.showPlaylists([]);
  this.Ui.showQue();
  this.Ui.showBottomBar();
  // load the history api
  Backbone.history.start({pushState: false});
});
 
