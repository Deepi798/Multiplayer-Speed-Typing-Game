const socket = io();

function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.style.background = type === 'error' ? '#fed7d7' : '#c6f6d5';
    messageDiv.style.color = type === 'error' ? '#742a2a' : '#22543d';
}

function createRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        showMessage('Please enter your name', 'error');
        return;
    }
    
    socket.emit('create_room', { player_name: playerName });
}

function joinRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim();
    
    if (!playerName || !roomCode) {
        showMessage('Please enter your name and room code', 'error');
        return;
    }
    
    // Store player name in sessionStorage
    sessionStorage.setItem('playerName', playerName);
    
    // Redirect to room
    window.location.href = `/room/${roomCode}`;
}

socket.on('room_created', (data) => {
    window.location.href = `/room/${data.room_id}`;
});

socket.on('error', (data) => {
    showMessage(data.message, 'error');
});
