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
        alert('Room link copied! Share it with your friends to challenge them!');
    });
}

function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Hold up! We need your name to join the typing battle');
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
        playersList.innerHTML = '<h3>Typing Warriors Ready for Battle:</h3>';
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
    document.getElementById('feedback').textContent = 'Type as fast as lightning! Show off those finger skills!';
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
        const encouragements = [
            'Blazing fast!', 'Lightning speed!', 'Rocket fingers!', 
            'Stellar typing!', 'Perfect shot!', 'Typing royalty!'
        ];
        const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
        feedback.textContent = `${randomEncouragement} +${data.points} points (${data.reaction_time}s)`;
        feedback.className = 'feedback correct';
        input.disabled = true;
        document.getElementById('submitBtn').disabled = true;
        if (timerInterval) clearInterval(timerInterval);
    } else {
        const tryAgainMessages = [
            'Oops! Give it another shot!', 'You got this! Try again!', 
            'Close one! One more time!', 'Almost there! Keep going!'
        ];
        const randomMessage = tryAgainMessages[Math.floor(Math.random() * tryAgainMessages.length)];
        feedback.textContent = randomMessage;
        feedback.className = 'feedback incorrect';
        input.value = '';
        input.focus();
        
        // Clear the error message after 2 seconds
        setTimeout(() => {
            if (feedback.textContent.includes('Oops') || feedback.textContent.includes('got this') || 
                feedback.textContent.includes('Close') || feedback.textContent.includes('Almost')) {
                feedback.textContent = 'Type as fast as lightning! Show off those finger skills!';
                feedback.className = 'feedback';
            }
        }, 2000);
    }
});

socket.on('round_complete', (data) => {
    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Round complete! Get ready for the next challenge...';
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
    feedback.textContent = `Time's up! The sentence was: "${data.word}" - Don't worry, you'll get the next one!`;
    feedback.className = 'feedback';
    feedback.style.background = '#7f1d1d';
    feedback.style.color = '#fca5a5';
    feedback.style.fontSize = '1em';
    feedback.style.fontWeight = 'bold';
    feedback.style.border = '1px solid #ef4444';
    
    // Disable input
    document.getElementById('wordInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    
    // Clear timer
    if (timerInterval) clearInterval(timerInterval);
    
    // Show "Next round starting..." after 3 seconds
    setTimeout(() => {
        feedback.textContent = 'Next round loading... Get those fingers ready!';
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
        const winnerMessages = [
            `Congratulations ${data.winner.name}! You're the typing champion with ${data.winner.score} points!`,
            `All hail ${data.winner.name}! The typing master with ${data.winner.score} points!`,
            `Victory goes to ${data.winner.name}! Amazing ${data.winner.score} points!`
        ];
        const randomWinnerMessage = winnerMessages[Math.floor(Math.random() * winnerMessages.length)];
        document.getElementById('winnerAnnouncement').textContent = randomWinnerMessage;
    }
    
    const finalScores = document.getElementById('finalScores');
    finalScores.innerHTML = '<h3>Final Hall of Fame:</h3>';
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
