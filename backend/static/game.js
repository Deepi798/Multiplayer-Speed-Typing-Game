/**
 * TypeRush Arena - Client-Side Multiplayer Logic
 * File: static/js/game.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Initialization & Auth Check ---
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    const playerName = sessionStorage.getItem('playerName');
    const isHost = sessionStorage.getItem('isHost') === 'true';

    // If missing data, boot them back to the landing page
    if (!roomCode || !playerName) {
        window.location.href = '/';
        return;
    }

    // --- 2. DOM Elements ---
    // Screens
    const waitingScreen = document.getElementById('waitingScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    
    // Status & Notifications
    const statusBanner = document.getElementById('statusBanner');
    const notificationArea = document.getElementById('notificationArea');
    
    // Waiting Room Elements
    const displayRoomCode = document.getElementById('displayRoomCode');
    const playerList = document.getElementById('playerList');
    const copyInviteBtn = document.getElementById('copyInviteBtn');
    const hostControls = document.getElementById('hostControls');
    const guestMessage = document.getElementById('guestMessage');
    const startGameBtn = document.getElementById('startGameBtn');
    const roundsSelect = document.getElementById('roundsSelect');
    
    // Game Elements
    const countdownOverlay = document.getElementById('countdownOverlay');
    const countdownText = document.getElementById('countdownText');
    const currentRoundEl = document.getElementById('currentRound');
    const totalRoundsEl = document.getElementById('totalRounds');
    const timeRemainingEl = document.getElementById('timeRemaining');
    const progressBar = document.getElementById('progressBar');
    const targetTextContainer = document.getElementById('targetText');
    const gameInput = document.getElementById('gameInput');
    const accuracyDisplay = document.getElementById('accuracyDisplay');
    const wpmDisplay = document.getElementById('wpmDisplay');
    const liveLeaderboard = document.getElementById('liveLeaderboard');
    
    // Results Elements
    const winnerText = document.getElementById('winnerText');
    const winnerScore = document.getElementById('winnerScore');
    const finalLeaderboard = document.getElementById('finalLeaderboard');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const returnHomeBtn = document.getElementById('returnHomeBtn');

    // Game State Variables
    let currentSentence = "";
    let gameStartTime = 0;
    let roundTimeLimit = 0;

    // --- 3. UI Helpers ---
    displayRoomCode.textContent = roomCode;

    if (isHost) {
        hostControls.classList.remove('hidden');
        guestMessage.classList.add('hidden');
        playAgainBtn.classList.remove('hidden'); // Show play again on end screen
    } else {
        hostControls.classList.add('hidden');
        guestMessage.classList.remove('hidden');
        playAgainBtn.classList.add('hidden');
    }

    function switchScreen(screen) {
        waitingScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        screen.classList.remove('hidden');
    }

    function showNotification(msg) {
        notificationArea.textContent = msg;
        notificationArea.classList.remove('hidden');
        setTimeout(() => notificationArea.classList.add('hidden'), 3000);
    }

    // --- 4. Socket.IO Connection ---
    const socket = io();

    socket.on('connect', () => {
        statusBanner.textContent = "Connected";
        statusBanner.className = "status-banner success";
        setTimeout(() => statusBanner.style.display = 'none', 2000);
        
        // Request to join the room
        socket.emit('join_room', { room: roomCode, name: playerName, is_host: isHost });
    });

    socket.on('disconnect', () => {
        statusBanner.textContent = "Disconnected. Reconnecting...";
        statusBanner.className = "status-banner error";
        statusBanner.style.display = 'block';
    });

    socket.on('error', (data) => {
        alert(data.msg);
        window.location.href = '/';
    });

    // --- 5. Event Listeners ---
    
    // Copy Invite Link
    copyInviteBtn.addEventListener('click', () => {
        const inviteLink = `${window.location.origin}/?room=${roomCode}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            copyInviteBtn.textContent = "Copied!";
            setTimeout(() => copyInviteBtn.textContent = "Copy Invite Link", 2000);
        });
    });

    // Start Game (Host Only)
    startGameBtn.addEventListener('click', () => {
        const totalRounds = roundsSelect.value;
        socket.emit('start_game', { room: roomCode, rounds: totalRounds });
    });

    // Navigation Buttons
    returnHomeBtn.addEventListener('click', () => window.location.href = '/');
    playAgainBtn.addEventListener('click', () => {
        socket.emit('play_again', { room: roomCode });
    });

    // --- 6. Socket Events (Game Flow) ---

    // Room Update (Players joining/leaving)
    socket.on('room_update', (data) => {
        playerList.innerHTML = '';
        data.players.forEach(p => {
            const li = document.createElement('li');
            li.className = 'player-item';
            li.innerHTML = `
                <span class="player-name">
                    ${p.name} ${p.is_host ? '<span class="host-badge">(Host)</span>' : ''}
                </span>
                <span class="player-status">Ready</span>
            `;
            playerList.appendChild(li);
        });
    });

    // Game Countdown
    socket.on('game_starting', (data) => {
        switchScreen(gameScreen);
        countdownOverlay.classList.remove('hidden');
        let count = 3;
        countdownText.textContent = count;
        
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.textContent = count;
            } else if (count === 0) {
                countdownText.textContent = "GO!";
            } else {
                clearInterval(interval);
                countdownOverlay.classList.add('hidden');
            }
        }, 1000);
    });

    // New Round Started
    socket.on('round_started', (data) => {
        currentSentence = data.sentence;
        currentRoundEl.textContent = data.current_round;
        totalRoundsEl.textContent = data.total_rounds;
        roundTimeLimit = data.time_limit;
        
        // Reset typing area
        gameInput.value = '';
        gameInput.disabled = false;
        gameInput.focus();
        
        accuracyDisplay.textContent = "100%";
        wpmDisplay.textContent = "0 WPM";
        
        renderSentence(); // Draw initial text
        gameStartTime = Date.now();
    });

    // Timer Update
    socket.on('timer_update', (data) => {
        timeRemainingEl.textContent = data.time_left;
        const progressPercentage = (data.time_left / roundTimeLimit) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        
        if (data.time_left <= 5) {
            progressBar.style.backgroundColor = 'var(--error)';
        } else {
            progressBar.style.backgroundColor = 'var(--primary)';
        }
    });

    // Leaderboard Update
    socket.on('leaderboard_update', (data) => {
        updateLeaderboardUI(data.players, liveLeaderboard);
    });

    // Round Ended
    socket.on('round_ended', () => {
        gameInput.disabled = true;
        showNotification("Round Over! Get ready...");
    });

    // Game Finished
    socket.on('game_finished', (data) => {
        switchScreen(resultsScreen);
        
        const sortedPlayers = data.players.sort((a, b) => b.score - a.score);
        if (sortedPlayers.length > 0) {
            winnerText.textContent = sortedPlayers[0].name;
            winnerScore.textContent = `${sortedPlayers[0].score} Points`;
        }
        
        updateLeaderboardUI(sortedPlayers, finalLeaderboard);
    });

    // Reset to Waiting Room (if host clicked Play Again)
    socket.on('reset_room', () => {
        switchScreen(waitingScreen);
    });

    // --- 7. Typing Engine & Stats Calculation ---
    gameInput.addEventListener('input', () => {
        const inputVal = gameInput.value;
        renderSentence();
        calculateAndEmitStats(inputVal);
        
        // Auto-complete if they type the whole thing correctly
        if (inputVal === currentSentence) {
            gameInput.disabled = true;
            showNotification("Finished sentence!");
        }
    });

    function renderSentence() {
        const inputChars = gameInput.value.split('');
        const targetChars = currentSentence.split('');
        
        targetTextContainer.innerHTML = '';
        
        targetChars.forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            
            if (inputChars[index] == null) {
                // Not typed yet
                span.className = 'char-untyped';
            } else if (inputChars[index] === char) {
                // Typed correctly
                span.className = 'char-correct';
            } else {
                // Typed incorrectly
                span.className = 'char-incorrect';
            }
            
            targetTextContainer.appendChild(span);
        });
    }

    function calculateAndEmitStats(inputVal) {
        // Calculate Accuracy
        let correctChars = 0;
        for (let i = 0; i < inputVal.length; i++) {
            if (inputVal[i] === currentSentence[i]) {
                correctChars++;
            }
        }
        const accuracy = inputVal.length === 0 ? 100 : Math.round((correctChars / inputVal.length) * 100);
        
        // Calculate WPM
        const timeElapsedMinutes = (Date.now() - gameStartTime) / 60000;
        // Standard WPM formula: (Characters / 5) / Time in minutes
        const wpm = timeElapsedMinutes > 0 ? Math.round((inputVal.length / 5) / timeElapsedMinutes) : 0;
        
        // Update UI locally
        accuracyDisplay.textContent = `${accuracy}%`;
        wpmDisplay.textContent = `${wpm} WPM`;
        
        // Send to server
        socket.emit('player_progress', {
            room: roomCode,
            wpm: wpm,
            accuracy: accuracy,
            chars_typed: inputVal.length,
            is_complete: inputVal === currentSentence
        });
    }

    function updateLeaderboardUI(players, container) {
        container.innerHTML = '';
        players.forEach((p, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            li.innerHTML = `
                <div class="leader-info">
                    <span class="leader-rank">${index + 1}</span>
                    <span class="leader-name">${p.name}</span>
                </div>
                <div class="leader-stats">
                    ${p.score !== undefined ? `<span class="score-badge">${p.score} pts</span>` : ''}
                    <span class="wpm-badge">${p.wpm || 0} WPM</span>
                </div>
            `;
            container.appendChild(li);
        });
    }
});