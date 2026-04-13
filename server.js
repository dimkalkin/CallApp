const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();

app.use(express.static('.'));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', ({ room, username }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;
        
        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }
        rooms.get(room).add(username);
        
        socket.to(room).emit('user-joined', { 
            username, 
            count: rooms.get(room).size 
        });
        
        console.log(`${username} joined ${room}`);
    });
    
    socket.on('offer', ({ room, offer }) => {
        socket.to(room).emit('offer', { offer, from: socket.username });
    });
    
    socket.on('answer', ({ room, answer }) => {
        socket.to(room).emit('answer', { answer });
    });
    
    socket.on('ice-candidate', ({ room, candidate }) => {
        socket.to(room).emit('ice-candidate', { candidate });
    });
    
    socket.on('leave', ({ room }) => {
        handleDisconnect(socket);
    });
    
    socket.on('disconnect', () => {
        handleDisconnect(socket);
    });
});

function handleDisconnect(socket) {
    if (socket.room && rooms.has(socket.room)) {
        rooms.get(socket.room).delete(socket.username);
        if (rooms.get(socket.room).size === 0) {
            rooms.delete(socket.room);
        }
    }
    console.log('User disconnected:', socket.username);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
