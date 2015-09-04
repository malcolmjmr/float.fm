var socket;

var SocketConfig = function() {
  return io.connect('http://'+window.location.host)

  .on('connect', function(){
    console.log("Socket connected");
    this.emit('ready');
  })


  .on('db_item_details', function(item) {
    if (item.type) {

      var collectionName = item.type+'s';
      var itemLabel = item.type+':'+item._id;

      if (collectionName === 'users') {
        if (app.user === undefined) {
          app.user = item;
          app.initiate();
        } else {
          if (app.user._id === item._id) {
            app.user = item
          } else {
            app[collectionName][itemLabel] = item;
          }
        }
      } else {
        app[collectionName][itemLabel] = item;
      }
    } 
  })

  .on('db_collection', function (collection) {
    var collectionName = collection.name+'s';
    app[collectionName] = collection.items;
  })

  .on('error', function (error) {
    console.log(error);
  })

  .on('message', function(data) {
    var itemType = data.room.split(':')[0];
    var item = app[itemType+'s'][data.room];
    var name = null;

    switch(itemType) {
      case 'song': 
        name = item.title
        break;
      case 'hashtag':
      case 'group':
        name = item.name;
        break;
      case 'user':
        name = item.local.email;
        break;
      default:
    }
    console.log(name+'| '+data.from+': '+data.message);
  })

  .on('update_player_state', function (data) {
    if (app.player.playingFrom.station) {
      if ((data.from !== app.user._id)
      && app.player.playingFrom === data.room) {
        var latency = (Date.now() - data.time) / 1000;
        data.state.currentLocation +=  1 + latency;
        app.player.state = data.state;
        app.player.state.changed = true;
      }
    }
  })

  .on('item_update', function (itemLabel) {
    console.log(itemLabel);
    this.emit('get_item', itemLabel);
  });

}
