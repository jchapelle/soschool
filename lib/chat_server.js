var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
var socketsIdList = [];
var connectedUsersSockets = {};
var usernames = {};

exports.listen = function(server) {
  console.log("Chat_server exports.listen");
  io = socketio.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', function (socket) {
	console.log("connection");

    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
	//console.log(socket);

	socket.on('addUser', function(username){
        // we store the username in the socket session for this client
        socket.username = username;
		socket.set('id', username);
        // add the client's username to the global list
        usernames[username] = username;
		connectedUsersSockets[username] = socket.id ;
        // update the list of users in chat, client-side
        io.sockets.emit('updateUsers', usernames);
    });
	  
	socket.on('rooms', function() {
		//console.log('room');		
      socket.emit('rooms', io.sockets.manager.rooms);	  
	  //console.log('Emit listConnectedUsers='+io.sockets.sockets);	  	  
	  var clients = io.sockets.sockets;	  	  
	  for (client in clients){
		//console.log('client='+client);
	  }	  
	  //socket.emit('listConnectedUsers', JSON.stringify(io.sockets.sockets));  
    });
	
	
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
}

function joinChat(socket) {
  
 }

function joinRoom(socket, room) {
  socket.join(room);
  
  currentRoom[socket.id] = room;
  socketsIdList.push(socket.id);
  
  console.log('emit message to : '+socketsIdList[0]);
  //io.sockets.socket(socketsIdList[0]).emit('message', {text: 'Message de Test0'});
  //io.sockets.socket(socketsIdList[0]).emit('message', 'Message de Test0');
  console.log('emit message to : '+socketsIdList);
  io.sockets.socket(socketsIdList).emit('message', {text: 'Message de Test :'+ socketsIdList});
  //io.sockets.socket(socketsIdList).emit('message', 'Message de Test1');
  console.log('emit message to : '+socketsIdList);
 // socket.broadcast.to('Lobby').emit('message', {text: 'Message de Test'});

  
  socket.emit('joinResult', {room: room});
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });

  var usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
  }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function (message) {
  
	console.log('Message received');
	//io.sockets.socket(socketsIdList).emit('message', {text: 'Message de Test :'+ socketsIdList});
	console.log('   To : '+message.chatBoxIdDst.split('-')[0]);
	console.log('   Tom : '+connectedUsersSockets[message.chatBoxIdDst.split('-')[0]]);
	console.log('   From : '+message.chatBoxIdSrc);
	console.log('   Text : '+message.text);

	io.sockets.socket(connectedUsersSockets[message.chatBoxIdDst.split('-')[0]]).emit('message', {
		destination: message.chatBoxIdSrc,
		text: message.text
	});
	
	// socket.get('id', function (err, name) {
    // console.log('Chat message by ', name);
    //});
	
    //socket.broadcast.to(message.room).emit('message', {
    //  text: nickNames[socket.id] + ': ' + message.text
    //});
  });
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}
