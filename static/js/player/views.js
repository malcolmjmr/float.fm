var NavbarView = Backbone.View.extend({
  template: '#navbar_main_template',
  render: function(){
  	this.$el.html($(this.template).html());
  	return this;
  },
  events: {
   'click #library': 'viewLibrary',
   'click #sign_out': 'signOut',
  },
  viewLibrary: function() {
    Ui.showPlaylist();
  },
  signOut: function() {
    socket.emit('log_out');
    window.location = window.location.hostname;
  }
});

var PlaylistView = Backbone.View.extend({
  songs: [],
  template: '#playlist_template',
  render: function(songs){
    var display = _.template($(this.template).html(), {songs: this.songs});
  	this.$el.html(display);
  	return this;
  },
  events: {
    'click .song_row': 'addToQue'
  },
  addToQue: function(event) {
    var songRow = $(event.currentTarget);
    var id = songRow.attr('id');
    this.songs.forEach(function(song) {
      if (song._id === id) {
      var group = App.User.groups.current._id;
        var data = {
          group: group,
          playlist: "party rock",
          song: song
        }
        
        socket.emit('add_to_group_playlist', data);
      }
    });
  }
});

var SongQueView = Backbone.View.extend({
  template: '#que_template',
  render: function(){
  	this.$el.html(this.template);
  	return this;
  },
  events: {}
});

var BottomBarView = Backbone.View.extend({
  template: '#bottom_bar_template',
  render: function(){
  	this.$el.html(this.template);
  	return this;
  },
  events: {}
});

