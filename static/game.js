const socket = io();
let hasJoined = false;
let timerInterval = null;
let timeRemaining = 0;

// Auto-join if coming from home page with stored name
window.addEventListener('DOMContentLoaded', () => {
    const storedName = sessionStorage.getItem('playerName');
    if (storedName && !hasJoined) {
        document.getElementById('playerName').value = storedName;
        sessionStorage.removeItem('playerName');
        // Auto-join after a short delay
        setTimeout(() => {
            joinGame();
        }, 500);
    }
});

function copyRoomLink() {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
        alert('Room link copied to clipboard!');
    });
}

function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    
    socket.emit('join_room', {
        room_id: ROOM_ID,
        player_name: playerName
    });
}

function startGame() {
    const rounds = parseInt(document.getElementById('roundsSelect').value);
    socket.emit('start_game', { room_id: ROOM_ID, total_rounds: rounds });
}

socket.on('joined_room', (data) => {
    hasJoined = true;
    document.getElementById('playerName').disabled = true;
    document.querySelector('.waiting-area .btn-primary').disabled = true;
    document.getElementById('startBtn').style.display = 'block';
});

// Player avatar symbols - face emojis
const playerSymbols = ['😀', '😎', '🤓', '😊', '🥳', '😇', '🤩', '😺', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸'];
const playerColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
const playerAvatars = {};
const playerColorMap = {};

function getPlayerAvatar(playerName, index) {
    if (!playerAvatars[playerName]) {
        playerAvatars[playerName] = playerSymbols[index % playerSymbols.length];
        playerColorMap[playerName] = playerColors[index % playerColors.length];
    }
    return playerAvatars[playerName];
}

function getPlayerColor(playerName) {
    return playerColorMap[playerName] || playerColors[0];
}

socket.on('player_list', (data) => {
    const playersList = document.getElementById('playersList');
    if (playersList) {
        playersList.innerHTML = '<h3>Players in room:</h3>';
        data.players.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'player-item';
            const avatar = getPlayerAvatar(player.name, index);
            const color = getPlayerColor(player.name);
            div.innerHTML = `
                <span class="player-avatar-card" style="background: ${color};">${avatar}</span>
                <span class="player-info">
                    <span class="player-name-text">${player.name}</span>
                    <span class="player-score-text">${player.score} points</span>
                </span>
            `;
            playersList.appendChild(div);
        });
    }
    
    const scoresDiv = document.getElementById('scores');
    if (scoresDiv) {
        scoresDiv.innerHTML = '';
        data.players.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'score-item';
            const avatar = getPlayerAvatar(player.name, index);
            const color = getPlayerColor(player.name);
            div.innerHTML = `
                <span class="score-rank">#${index + 1}</span>
                <span class="player-avatar-card" style="background: ${color};">${avatar}</span>
                <span class="score-name">${player.name}</span>
                <span class="score-points">${player.score}</span>
            `;
            scoresDiv.appendChild(div);
        });
    }
});

socket.on('game_started', (data) => {
    document.getElementById('waitingArea').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
});

socket.on('new_word', (data) => {
    document.getElementById('roundNumber').textContent = `Round ${data.round}/${data.total_rounds}`;
    document.getElementById('currentWord').textContent = data.word;
    document.getElementById('wordInput').value = '';
    document.getElementById('wordInput').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('wordInput').focus();
    document.getElementById('feedback').textContent = 'Type the sentence as fast as you can!';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('submissionFeed').innerHTML = '';
    
    // Start countdown timer
    timeRemaining = data.duration;
    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimer();
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
});

function updateTimer() {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerEl.textContent = `⏱️ ${timeRemaining}s`;
        if (timeRemaining <= 5) {
            timerEl.style.color = '#e53e3e';
        } else if (timeRemaining <= 10) {
            timerEl.style.color = '#dd6b20';
        } else {
            timerEl.style.color = '#667eea';
        }
    }
}

function submitAnswer() {
    const input = document.getElementById('wordInput');
    const word = input.value.trim();
    if (word && !input.disabled) {
        socket.emit('submit_word', {
            room_id: ROOM_ID,
            word: word
        });
    }
}

document.getElementById('wordInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitAnswer();
    }
});

socket.on('submission_result', (data) => {
    const feedback = document.getElementById('feedback');
    const input = document.getElementById('wordInput');
    
    if (data.correct) {
        feedback.textContent = `Correct! +${data.points} points (${data.reaction_time}s)`;
        feedback.className = 'feedback correct';
        input.disabled = true;
        document.getElementById('submitBtn').disabled = true;
        if (timerInterval) clearInterval(timerInterval);
    } else {
        // Wrong answer - let them try again
        feedback.textContent = `Incorrect! Try again...`;
        feedback.className = 'feedback incorrect';
        input.value = '';
        input.focus();
        
        // Clear the error message after 2 seconds
        setTimeout(() => {
            if (feedback.textContent.includes('Incorrect')) {
                feedback.textContent = 'Type the sentence as fast as you can!';
                feedback.className = 'feedback';
            }
        }, 2000);
    }
});

socket.on('round_complete', (data) => {
    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Round complete! Next round starting soon...';
    feedback.className = 'feedback';
    feedback.style.background = '#064e3b';
    feedback.style.color = '#6ee7b7';
    feedback.style.border = '1px solid #10b981';
    
    if (timerInterval) clearInterval(timerInterval);
});

socket.on('round_timeout', (data) => {
    const feedback = document.getElementById('feedback');
    const wordDisplay = document.getElementById('currentWord');
    
    // Show the correct sentence
    wordDisplay.textContent = data.word;
    feedback.textContent = `YOU FAILED! Time's up! The sentence was shown above.`;
    feedback.className = 'feedback';
    feedback.style.background = '#7f1d1d';
    feedback.style.color = '#fca5a5';
    feedback.style.fontSize = '1.2em';
    feedback.style.fontWeight = 'bold';
    feedback.style.border = '1px solid #ef4444';
    
    // Disable input
    document.getElementById('wordInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    
    // Clear timer
    if (timerInterval) clearInterval(timerInterval);
    
    // Show "Next round starting..." after 3 seconds
    setTimeout(() => {
        feedback.textContent = 'Next round starting...';
        feedback.style.background = '#064e3b';
        feedback.style.color = '#6ee7b7';
        feedback.style.fontSize = '1em';
        feedback.style.border = '1px solid #10b981';
    }, 3000);
});

socket.on('player_submitted', (data) => {
    const feed = document.getElementById('submissionFeed');
    const msg = document.createElement('div');
    msg.className = data.correct ? 'submission-msg correct' : 'submission-msg incorrect';
    msg.innerHTML = `
        <span>${data.player_name}</span>
        <span>${data.correct ? '✓' : '✗'} ${data.points} pts (${data.time}s)</span>
    `;
    feed.appendChild(msg);
    feed.scrollTop = feed.scrollHeight;
});

socket.on('game_ended', (data) => {
    document.getElementById('gameArea').style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';
    
    if (data.winner) {
        document.getElementById('winnerAnnouncement').textContent = 
            `${data.winner.name} wins with ${data.winner.score} points!`;
    }
    
    const finalScores = document.getElementById('finalScores');
    finalScores.innerHTML = '<h3>Final Scores:</h3>';
    data.final_scores.forEach((player, index) => {
        const div = document.createElement('div');
        div.className = 'score-item';
        div.innerHTML = `
            <span>${index + 1}. ${player.name}</span>
            <span>${player.score} pts</span>
        `;
        finalScores.appendChild(div);
    });
});

socket.on('error', (data) => {
    alert(data.message);
});
