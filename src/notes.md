# Socket Map

## Server

io.to(data.roomId).emit('enterRoom', {})
io.to(data.roomId).emit('leaveRoom', {})

## Rooms

socket.emit('close');
socket.emit('open', config.roomId, (msg) =>
   alert(msg.msg)
);
socket.emit('newMessage', { }

socket.on('enterRoom', (msg) => this.handleMessage(msg));
socket.on('leaveRoom', (msg) => this.handleMessage(msg));

## Visitors

socket.on('alert', (msg)=> {
    alert('alert', msg)
});
socket.on('enterRoom', (roomId) => {})
socket.on('leaveRoom', (msg) => this.handleMessage(msg));
socket.on('addRoom', (msg) => {})

socket.emit('removeVisitor');
socket.emit('newMessage', {})
socket.emit('enterRoom', {}, fn())
socket.emit('leaveRoom', {}, fn())
socket.emit('leaveRoom', this.yourId, function(msg) { })
