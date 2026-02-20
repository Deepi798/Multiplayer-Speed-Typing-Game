from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import time
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'typing-game-secret'
socketio = SocketIO(app, cors_allowed_origins="*")

# Game state
rooms = {}
words = []

# Load sentences by difficulty
def load_sentences():
    global words
    sentences = {'easy': [], 'medium': [], 'hard': []}
    
    try:
        with open('sentences.txt', 'r') as f:
            current_difficulty = None
            for line in f:
                line = line.strip()
                if line.startswith('# EASY'):
                    current_difficulty = 'easy'
                elif line.startswith('# MEDIUM'):
                    current_difficulty = 'medium'
                elif line.startswith('# HARD'):
                    current_difficulty = 'hard'
                elif line and not line.startswith('#') and current_difficulty:
                    sentences[current_difficulty].append(line)
        
        # Combine all for backwards compatibility
        words = sentences['easy'] + sentences['medium'] + sentences['hard']
        return sentences
    except FileNotFoundError:
        default = ['The cat sat on the mat.', 'I like to eat pizza.']
        return {'easy': default, 'medium': default, 'hard': default}

sentences_by_difficulty = load_sentences()
load_sentences()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/room/<room_id>')
def room(room_id):
    return render_template('game.html', room_id=room_id)

@socketio.on('create_room')
def handle_create_room(data):
    room_id = str(uuid.uuid4())[:8]
    player_name = data.get('player_name', 'Player')
    
    rooms[room_id] = {
        'players': {},
        'game_started': False,
        'current_round': 0,
        'total_rounds': 15,  # Default 15 rounds, can be changed by host
        'word_list': [],
        'current_word': None,
        'word_sent_time': None,
        'round_submissions': {},
        'round_duration': 30,
        'round_timer_id': None
    }
    
    emit('room_created', {'room_id': room_id, 'player_name': player_name})

@socketio.on('join_room')
def handle_join_room(data):
    room_id = data['room_id']
    player_name = data['player_name']
    
    if room_id not in rooms:
        emit('error', {'message': 'Room not found'})
        return
    
    if rooms[room_id]['game_started']:
        emit('error', {'message': 'Game already in progress'})
        return
    
    join_room(room_id)
    
    player_id = request.sid
    rooms[room_id]['players'][player_id] = {
        'name': player_name,
        'score': 0,
        'sid': player_id
    }
    
    emit('joined_room', {'player_name': player_name, 'room_id': room_id})
    emit('player_list', {'players': list(rooms[room_id]['players'].values())}, room=room_id)

@socketio.on('start_game')
def handle_start_game(data):
    room_id = data['room_id']
    total_rounds = data.get('total_rounds', 15)  # Default to 15 if not specified
    
    if room_id not in rooms:
        return
    
    room = rooms[room_id]
    room['game_started'] = True
    room['current_round'] = 0
    room['total_rounds'] = total_rounds
    
    # Calculate rounds per difficulty based on total rounds
    rounds_per_difficulty = total_rounds // 3
    remaining_rounds = total_rounds % 3
    
    # Distribute rounds: easy, medium, hard (with any remainder going to hard)
    easy_count = rounds_per_difficulty
    medium_count = rounds_per_difficulty
    hard_count = rounds_per_difficulty + remaining_rounds
    
    # Get sentences for each difficulty
    easy_sentences = random.sample(sentences_by_difficulty['easy'], min(easy_count, len(sentences_by_difficulty['easy'])))
    medium_sentences = random.sample(sentences_by_difficulty['medium'], min(medium_count, len(sentences_by_difficulty['medium'])))
    hard_sentences = random.sample(sentences_by_difficulty['hard'], min(hard_count, len(sentences_by_difficulty['hard'])))
    
    # Combine in order: easy first, then medium, then hard
    room['word_list'] = easy_sentences + medium_sentences + hard_sentences
    
    for player_id in room['players']:
        room['players'][player_id]['score'] = 0
    
    emit('game_started', {'total_rounds': room['total_rounds']}, room=room_id)
    socketio.sleep(2)
    send_next_word(room_id)

def send_next_word(room_id):
    if room_id not in rooms:
        return
        
    room = rooms[room_id]
    room['current_round'] += 1
    
    if room['current_round'] > room['total_rounds']:
        end_game(room_id)
        return
    
    word = room['word_list'][room['current_round'] - 1]
    room['current_word'] = word
    room['word_sent_time'] = time.time()
    room['round_submissions'] = {}
    
    # Create unique timer ID for this round
    timer_id = f"{room_id}_{room['current_round']}"
    room['round_timer_id'] = timer_id
    
    socketio.emit('new_word', {
        'word': word,
        'round': room['current_round'],
        'total_rounds': room['total_rounds'],
        'duration': room['round_duration']
    }, room=room_id)
    
    # Auto-advance after round duration
    socketio.start_background_task(auto_advance_round, room_id, room['round_duration'], timer_id)

@socketio.on('submit_word')
def handle_submit_word(data):
    room_id = data['room_id']
    typed_word = data['word']
    player_id = request.sid
    
    if room_id not in rooms or player_id not in rooms[room_id]['players']:
        return
    
    room = rooms[room_id]
    
    # Check if already submitted correctly
    if player_id in room['round_submissions']:
        return
    
    submission_time = time.time()
    reaction_time = submission_time - room['word_sent_time']
    correct = typed_word.lower().strip() == room['current_word'].lower().strip()
    
    points = 0
    if correct:
        # Points based on speed: 1000 base - 100 per second
        points = max(100, int(1000 - (reaction_time * 100)))
        room['players'][player_id]['score'] += points
        
        # Mark as submitted only if correct
        room['round_submissions'][player_id] = {
            'word': typed_word,
            'correct': correct,
            'time': reaction_time,
            'points': points
        }
        
        # Broadcast who submitted correctly
        socketio.emit('player_submitted', {
            'player_name': room['players'][player_id]['name'],
            'correct': correct,
            'points': points,
            'time': round(reaction_time, 2)
        }, room=room_id)
        
        # Update leaderboard
        socketio.emit('player_list', {
            'players': sorted(room['players'].values(), key=lambda x: x['score'], reverse=True)
        }, room=room_id)
        
        # If all players submitted correctly, cancel timer and show countdown
        if len(room['round_submissions']) == len(room['players']):
            room['round_timer_id'] = None
            socketio.emit('round_complete', {'word': room['current_word']}, room=room_id)
            socketio.sleep(5)  # Wait 5 seconds to show results
            send_next_word(room_id)
    
    # Send result to the player
    emit('submission_result', {
        'correct': correct,
        'points': points,
        'reaction_time': round(reaction_time, 2)
    })

def auto_advance_round(room_id, duration, timer_id):
    """Auto-advance to next round after time expires"""
    socketio.sleep(duration)
    
    if room_id not in rooms:
        return
    
    room = rooms[room_id]
    
    # Check if this timer is still valid (not cancelled by all players submitting)
    if room.get('round_timer_id') != timer_id:
        return  # Timer was cancelled, don't advance
    
    # Show timeout message with the correct answer
    socketio.emit('round_timeout', {
        'word': room['current_word']
    }, room=room_id)
    
    # Wait 5 seconds so players can see the answer
    socketio.sleep(5)
    
    # Then advance to next round
    send_next_word(room_id)

def end_game(room_id):
    room = rooms[room_id]
    players = sorted(room['players'].values(), key=lambda x: x['score'], reverse=True)
    
    winner = players[0] if players else None
    
    socketio.emit('game_ended', {
        'winner': winner,
        'final_scores': players
    }, room=room_id)
    
    room['game_started'] = False

@socketio.on('disconnect')
def handle_disconnect():
    player_id = request.sid
    for room_id, room in rooms.items():
        if player_id in room['players']:
            del room['players'][player_id]
            socketio.emit('player_list', {
                'players': list(room['players'].values())
            }, room=room_id)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

@socketio.on('skip_round')
def handle_skip_round(data):
    room_id = data['room_id']
    player_id = request.sid
    
    if room_id not in rooms or player_id not in rooms[room_id]['players']:
        return
    
    room = rooms[room_id]
    
    # Mark player as skipped
    if player_id not in room['round_submissions']:
        room['round_submissions'][player_id] = {
            'word': '',
            'correct': False,
            'time': 0,
            'points': 0
        }
    
    emit('submission_result', {
        'correct': False,
        'points': 0,
        'reaction_time': 0
    })
    
    # If all players submitted/skipped, move to next round
    if len(room['round_submissions']) == len(room['players']):
        room['round_timer_id'] = None
        socketio.sleep(3)  # Show results for 3 seconds
        send_next_word(room_id)
