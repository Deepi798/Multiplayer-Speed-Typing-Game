/**
 * TypeRush Arena - Landing Page Logic
 * File: static/js/main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playerNameInput = document.getElementById('playerName');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const roomCodeInput = document.getElementById('roomCode');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const notificationArea = document.getElementById('notificationArea');

    // Check if user arrived via an invite link (e.g., /?room=ABCDEF)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('room');
    
    if (inviteCode) {
        roomCodeInput.value = inviteCode.toUpperCase();
        showNotification('Invite code applied! Enter your name to join.', 'success');
        playerNameInput.focus();
    }

    // Helper: Show UI Notifications
    function showNotification(message, type = 'error') {
        notificationArea.textContent = message;
        notificationArea.className = `notification ${type}`;
        notificationArea.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notificationArea.classList.add('hidden');
        }, 3000);
    }

    // Helper: Generate a random 6-character room code
    function generateRoomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Create Room Flow
    createRoomBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        
        if (!playerName) {
            showNotification('Please enter your name first.');
            playerNameInput.focus();
            return;
        }

        const roomCode = generateRoomCode();
        
        // Save player details in session storage so the game page can read them
        sessionStorage.setItem('playerName', playerName);
        sessionStorage.setItem('isHost', 'true'); // The creator is the host
        
        // Redirect to game page
        window.location.href = `/game?room=${roomCode}`;
    });

    // Join Room Flow
    joinRoomBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        const roomCode = roomCodeInput.value.trim().toUpperCase();

        if (!playerName) {
            showNotification('Please enter your name first.');
            playerNameInput.focus();
            return;
        }

        if (!roomCode || roomCode.length !== 6) {
            showNotification('Please enter a valid 6-character room code.');
            roomCodeInput.focus();
            return;
        }

        // Save player details
        sessionStorage.setItem('playerName', playerName);
        sessionStorage.setItem('isHost', 'false'); // Joiners are guests
        
        // Redirect to game page
        window.location.href = `/game?room=${roomCode}`;
    });

    // Quality of Life: Allow pressing "Enter" in inputs
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (roomCodeInput.value.length === 6) {
                joinRoomBtn.click();
            } else {
                createRoomBtn.click();
            }
        }
    });

    roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinRoomBtn.click();
        }
    });

    // Force uppercase formatting on room code input
    roomCodeInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});