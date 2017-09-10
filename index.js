const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const fs = require('fs');
let creds = '';

const redis = require('redis');
let client='';
const port = process.env.PORT || 8080;

//Express Middleware for serving static files and parsing the request body
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended:true
}))

//Start the Server
http.listen(port, function(){
  console.log('Server Started. Listening on *:' + port)
})

//Store people in chatroom
let chatters=[];

//Sotre messages in chatroom
let chat_messages = [];

//Read credentials from JSON
fs.readFile('creds.json', 'utf-8', function(err, data){
  if(err) throw err;
  creds= JSON.parse(data);
  client = redis.createClient(creds.host);

  //Redis CLient Ready
  client.once('ready', function(){
    //Flush Redis DB
    //client.flushdb();

    //Initialize chatters
    client.get('chat_users', function(err, reply){
      if(reply){
        chatters = JSON.parse(reply);
      }
    });

    //Initialize messages
    client.get('chat_app_messages', function(err, reply){
      if(reply){
        chat_messages = JSON.parse(reply);
      }
    })
  })
});

//API - Join Chat
app.post('/join', function(req, res){
  let username = req.body.username;
  if(chatters.indexOf(username) === -1){
    chatters.push(username);
    client.set('chat_users', JSON.stringify(chatters));
    res.send({
      'chatters': chatters,
      'status': 'OK'
    });
  }else{
    res.send({
      'status': 'FAILED'
    });
  }
});

//API - Leave chat
app.post('/leave', function(req, res){
  let username = req.body.username;
  chatters.splice(chatters.indexOf(username), 1);
  client.set('chat_users', JSON.stringify(chatters));
  res.send({
    'status':'OK'
  })
});

//API - Send & Store messages
app.post('/send_message', function(req,res){
  let username = req.body.username;
  let message = req.body.message;
   chat_messages.push({
     'sender': username,
     'message':message
   });
   client.set('chat_app_messages', JSON.stringify(chat_messages));
   res.send({
     'status': 'OK'
   });
});

//Render Main File
app.get('/', function(req,res){
  res.sendFile('views/index.html', {
    root:__dirname
  });
});

//API - Get messages
app.get('/get_messages', function(req, res){
  res.send(chat_messages);
});

//API - Get chatters
app.get('/get_chatters', function(req, res){
  res.send(chatters);
});

//Socket Connection
io.on('connection', function(socket){

  //Fire 'send' event for updating Message list in UI
  socket.on('message', function(data){
    io.emit('send',data);
  });

  //Fire 'count_chatters' for updating Chatter Count
  socket.on('update_chatter_count', function(data){
    io.emit('count_chatters', data)
  })
})
