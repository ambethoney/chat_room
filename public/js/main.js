$(function(){
  const socket = io();
  let chatter_count;

  $.get('/get_chatters', function(response){
    $('.chat-info').text("There are currently "+ response.length + "people in the chat room");
    chatter_count = response.length;
  })

  //To Join Chat
  $('#join-chat').click(function(){
    let username = $.trim($('#username').val());
    $.ajax({
      url:'/join',
      type:'POST',
      data:{
        username: username
      },
      success: function(response){
        if(response.status == 'OK'){
          socket.emit('update_chatter_count',{
            'action': 'increase'
          });
          $('.chat').show();
          $('#leave-chat').data('username', username);
          $('#send-message').data('username', username);
          $.get('/get_messages', function(response){
            if(response.length > 0){
              let message_count = response.length;
              var html = '';
              for (let x= 0; x < message_count; x++){
                html += "<div class='msg'><div class='user'>" + response[x]['sender'] + "</div><div class='txt'>"+response[x]['message']+ "</div></div>"
              }
              $('.messages').html(html);
            }
          });
          $('.join-chat').hide();
        }else if(response == 'FAILED'){
          alert('Sorry, but that user name already exists. Please try another username.')
          $('#username').val('').focus();
        }
      }
    });
  });

  //To Leave Chat
  $('#leave-chat').click(function(){
    let username=$(this).data('username');
    $.ajax({
      url:'/leave',
      type:'POST',
      dataType:'json',
      data: {
        username: username
      },
      success: function(response){
        console.log(username)
        if(response.status == 'OK'){
          socket.emit('message',{
            'username': username,
            'message': username + ' has left the room.'
          });
          socket.emit('update_chatter_count', {
            'action': 'decrease'
          });
          $('.chat').hide();
          $('.join-chat').show();
          $('#username').val('');
          alert('You have successfully left the chat room.')
        }
      }
    });
  });

  //To Send a Message
  $('#send-message').click(function(){
    var username =  $(this).data('username');
    var message = $.trim($('#message').val());
    $.ajax({
      url: '/send_message',
      type: 'POST',
      dataType: 'json',
      data:{
        'username' : username,
        'message': message
      },
      success: function(response){
        if(response.status =='OK'){
            socket.emit('message', {
              'username': username,
              'message': message
            })
            $('#message').val('');
        }
      }
    });
  });


  socket.on('send', function(data){
    let username = data.username;
    let message = data.message;
    let html = "<div class='msg'><div class='user'>" + username + "</div><div class='txt'>" + message + "</div></div>";
    $('.messages').append(html);
  });

  socket.on('count_chatters', function(data){
    if(data.action == 'increase'){
      chatter_count++;
    }else{
      chatter_count--;
    }
    $('.chat-info').text('There are currently ' + chatter_count + ' people in the chat.')
  })
})
