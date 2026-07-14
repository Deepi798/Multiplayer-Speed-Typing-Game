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
        showMessage('Hey there! We need your name to get started', 'error');
        return;
    }
    
    showMessage('Creating your awesome typing arena...');
    socket.emit('create_room', { player_name: playerName });
}

function joinRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim();
    
    if (!playerName || !roomCode) {
        showMessage('Oops! Please enter both your name and the room code', 'error');
        return;
    }
    
    showMessage('Joining the typing challenge...');
    
    // Store player name in sessionStorage
    sessionStorage.setItem('playerName', playerName);
    
    // Redirect to room
    window.location.href = `/room/${roomCode}`;
}

socket.on('room_created', (data) => {
    showMessage('Arena created! Redirecting you now...');
    window.location.href = `/room/${data.room_id}`;
});

socket.on('error', (data) => {
    showMessage(data.message, 'error');
});
