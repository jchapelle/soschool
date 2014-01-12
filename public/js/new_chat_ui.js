
function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket, texteAreaId) {
  var message = $('#'+texteAreaId).val();
  var chatBoxIdDest = $('#'+texteAreaId).parents().eq(2).attr('id');
  
  var systemMessage;

 /* if (message.charAt(0) == '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
  */
  
    chatApp.sendMessage(chatBoxIdDest, myself, message);
	message = "<p class='triangle-border left Chatbubble grey'>"+message+"</p> ";
	
    $('#'+chatBoxIdDest+' .chatContent').append(message);
   
	//$('.chatContent').append(divEscapedContentElement(message));
    // $('#messages').scrollTop($('#messages').prop('scrollHeight'));
 // }

  $('#'+texteAreaId).val('');
}

var socket = io.connect();
var chatApp ;
var myself ;

$(document).ready(function() {
  chatApp = new Chat(socket);

    socket.on('connect', function(){
		// call the server-side function 'adduser' and send one parameter (value of prompt)
		socket.emit('addUser', myself=prompt("What's your name?"));
    });

  
  socket.on('nameResult', function(result) {
    var message;

    if (result.success) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }
    $('#messages').append(divSystemContentElement(message));
  });

  socket.on('joinResult', function(result) {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  socket.on('message', function (message) {
	console.log('Message received');
	console.log('	To : '+message.destination);
	console.log('	Message : '+message.text);
	console.log('#'+message.destination+'-chatBox .chatContent');
	console.log($('#'+message.destination+'-chatBox .chatContent'));
	console.log($('.chatContent'));
	
	chat.openChatBox(message.destination);
	
	var messageText = "<p class='triangle-border right Chatbubble blue'>"+message.text+"</p> ";	
	
	/*
	console.log(messageText);
    $('#'+message.destination+'-chatBox .chatContent').append(messageText);
	$('.chatContent').append(messageText);
	$('#'+message.destination+'-chatBox .chatContent').append(messageText);
	*/
	$('#'+message.destination+'-chatContent').append(messageText);
	
	console.log('#'+message.destination+'-chatContent');
  });

  socket.on('addConnectedUser', function(message) {
	var newUser = "	<div class='chatContactContainer' id='"+message.name+"'>"+
					"	<div class='row'> "+
					"		<div class='col-xs-2 feed-img'> "+
					"			<img class='' src='https://fbcdn-profile-a.akamaihd.net/hprofile-ak-prn2/s32x32/1119297_1239916588_1327344374_q.jpg' alt=''> "+
					"		</div> "+
					"		<div class='col-xs-8'> "+
					"			<span class='chatName'>"+message.name+"</span>  "+
					"		</div> "+
					"		<div class='col-xs-1'> "+
					"			<div class='circle green connected'> </div> "+
					"		</div> "+							
					"	</div> "+
					"</div>	";
			
	$('.chatContactsContainer .content').append(newUser);
	
	// If the user click a user name, open the corresponding chatBox
	$('.chatContactContainer').click(function() {	
		chat.openChatBox($(this).attr('id'));
	});	
  });
 
	socket.on('updateUsers', function(data) {
		$('.chatContactsContainer .content').empty();
		$.each(data, function(key, value) {
			if (value != '' && value !=myself) {
				var newUser = "	<div class='chatContactContainer' id='"+value+"'>"+
				"	<div class='row'> "+
				"		<div class='col-xs-2 feed-img'> "+
				"			<img class='' src='https://fbcdn-profile-a.akamaihd.net/hprofile-ak-prn2/s32x32/1119297_1239916588_1327344374_q.jpg' alt=''> "+
				"		</div> "+
				"		<div class='col-xs-8'> "+
				"			<span class='chatName'>"+value+"</span>  "+
				"		</div> "+
				"		<div class='col-xs-1'> "+
				"			<div class='circle green connected'> </div> "+
				"		</div> "+							
				"	</div> "+
				"</div>	";		
		
			
			   $('.chatContactsContainer .content').append(newUser);
			   
				// If the user click a user name, open the corresponding chatBox
				$('.chatContactContainer').click(function() {	
					chat.openChatBox($(this).attr('id'));
				});				   
			}
		});
	});

 
  socket.on('rooms', function(rooms) {
    $('#room-list').empty();
	//console.log('Socket on listConnectedUsers='+room);
    for(var room in rooms) {
		//console.log('room='+room);
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(function() {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  
    socket.on('listConnectedUsers', function(connectedUsersSockets) {
    
		//console.log('Socket on listConnectedUsers='+connectedUsersSockets);
		for(var connectedUserSocket in connectedUsersSockets) {
		  //console.log('Socket on listConnectedUsers='+connectedUserSocket);
		}

  });
  
  
  
  setInterval(function() {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
  
  
});
