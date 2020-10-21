const express = require('express');
const nunjunks = require('nunjucks');
const generateUniqueId = require("generate-unique-id");

//Implémentation des modules
const app = express();

nunjunks.configure('views', {
    autoescape: true,
    express: app
});

//Implémentation des fichiers
app.use('/css', express.static(__dirname + '/webroots/css'));
app.use('/js', express.static(__dirname + '/webroots/js'));
app.use('/views', express.static(__dirname + '/views'));

//route
app.get('/', (req, res, next)=> {
    res.render('login-form.html');
});

app.get('/chat/:id/:pseudo', (req, res, next)=> {
    res.render('chat.html');
})

const http = require('http').createServer(app);

const port = process.env.PORT || 8080;

http.listen(port, ()=> {
    console.log("Listen at port:" + port);
});

const io = require('socket.io').listen(http);

class User {
    constructor(id, pseudo, socketId) {
        this.id = id,
        this.pseudo = pseudo,
        this.socketId = socketId      
    }
}

let users = [];
const connections = [];

io.sockets.on('connection', function (socket) {
    connections.push(socket.id);
    const id = generateUniqueId ({length: 13});
    console.log(id);
    io.sockets.emit('new_connection', {
        nbrConnection: connections.length,
    });
    socket.emit('my_id', {
        myId: id
    });
    console.log('user connected');

    socket.on('login', function (user) {     
        users.push(new User( user.id, user.pseudo, socket.id));
        console.log(users);
        //io.sockets.emit("new_demande");
        
    });

    socket.on('new_message', function(message) {
        console.log('tableau');
        let userName = '';
        for (let i = 0; i < users.length; i++) {
            if(users[i].id == message.id) {
                userName = users[i].pseudo;
            }            
        }

        io.sockets.emit('send_message', {
            message: message.message,
            userName: userName
        });


    });

    socket.on('user_disc', function () {
        connections.splice(connections[0], 1);
    })

    socket.on('disconnect', function () {          
        console.log('[socket io]: user disconnection');       
        connections.splice(connections[0], 1);
       
        io.sockets.emit('new_connection', {
            nbrConnection: connections.length
        });
    });

});
