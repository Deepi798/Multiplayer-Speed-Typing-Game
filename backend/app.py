"""
TypeRush Arena - Backend Server
File: app.py
"""

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room as socket_join_room, leave_room as socket_leave_room
import random
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-super-secret-key-change-in-production'

# Enable CORS for Socket.IO to prevent connection issues on deployment platforms like Render
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage for active rooms
# Structure: { "ROOM_ID": { "players": {}, "state": "waiting", "settings": {} } }
rooms = {}

# Fallback sentences in case sentences.txt is missing
DEFAULT_SENTENCES = [
    "The quick brown fox jumps over the lazy dog.",
    "A journey of a thousand miles begins with a single step.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "Technology is best when it brings people together."
]

def get_random_sentence():
    try:
        with open('sentences.txt', 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
            if lines:
                return random.choice(lines)
    except FileNotFoundError:
        pass
    return random.choice(DEFAULT_SENTENCES)

# ==========================================
# HTTP ROUTES
# ==========================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

# ==========================================
# HELPER FUNCTIONS
# ==========================================

def get_room_players_list(room_id):
    if room_id not in rooms:
        return []
    players = []
    for sid, data in rooms[room_id]['players'].items():
        players.append({
            'id': sid,
            'name': data['name'],
            'is_host': data['is_host'],
            'score': data.get('score', 0),
            'wpm': data.get('wpm', 0)
        })
    return players

def calculate_points(wpm, accuracy):
    # Simple scoring algorithm prioritizing speed, penalized heavily by bad accuracy
    return int(wpm * (accuracy / 100.0) * 10)

# ==========================================
# SOCKET.IO EVENTS
# ==========================================

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room')
    name = data.get('name')
    is_host_claim = data.get('is_host', False)

    if not room or not name:
        emit('error', {'msg': 'Missing room code or name.'})
        return

    # Initialize room if it doesn't exist
    if room not in rooms:
        rooms[room] = {
            'players': {},
            'state': 'waiting',
            'host_sid': request.sid,
            'settings': {'total_rounds': 5}
        }
    
    # If the room is already playing, prevent joining
    if rooms[room]['state'] != 'waiting':
        emit('error', {'msg': 'Game already in progress.'})
        return

    # Determine if this player is actually the host 
    # (If they claim host and room has no players, or their sid matches host_sid)
    is_actual_host = (len(rooms[room]['players']) == 0) or (rooms[room].get('host_sid') == request.sid)
    
    if is_actual_host:
        rooms[room]['host_sid'] = request.sid

    rooms[room]['players'][request.sid] = {
        'name': name,
        'is_host': is_actual_host,
        'score': 0,
        'wpm': 0,
        'accuracy': 100,
        'is_complete': False
    }

    socket_join_room(room)
    
    # Broadcast updated player list to everyone in the room
    emit('room_update', {'players': get_room_players_list(room)}, to=room)

@socketio.on('disconnect')
def handle_disconnect():
    for room_id, room_data in list(rooms.items()):
        if request.sid in room_data['players']:
            was_host = room_data['players'][request.sid]['is_host']
            del room_data['players'][request.sid]
            
            # If room is empty, delete it entirely
            if not room_data['players']:
                del rooms[room_id]
            else:
                # If host left, assign a new host randomly
                if was_host:
                    new_host_sid = next(iter(room_data['players']))
                    room_data['players'][new_host_sid]['is_host'] = True
                    room_data['host_sid'] = new_host_sid
                
                # Notify remaining players
                emit('room_update', {'players': get_room_players_list(room_id)}, to=room_id)
            break

@socketio.on('start_game')
def handle_start_game(data):
    room = data.get('room')
    if room in rooms and request.sid == rooms[room].get('host_sid'):
        rounds = int(data.get('rounds', 5))
        rooms[room]['settings']['total_rounds'] = rounds
        rooms[room]['state'] = 'playing'
        
        # Start the background game loop task for this room
        socketio.start_background_task(game_loop, room)

@socketio.on('player_progress')
def handle_player_progress(data):
    room = data.get('room')
    if room in rooms and request.sid in rooms[room]['players']:
        player = rooms[room]['players'][request.sid]
        
        player['wpm'] = data.get('wpm', 0)
        player['accuracy'] = data.get('accuracy', 100)
        
        if data.get('is_complete') and not player['is_complete']:
            player['is_complete'] = True
            # Award points for this round
            player['score'] += calculate_points(player['wpm'], player['accuracy'])

        # Broadcast live leaderboard updates
        emit('leaderboard_update', {'players': get_room_players_list(room)}, to=room)

@socketio.on('play_again')
def handle_play_again(data):
    room = data.get('room')
    if room in rooms and request.sid == rooms[room].get('host_sid'):
        rooms[room]['state'] = 'waiting'
        # Reset scores
        for p_data in rooms[room]['players'].values():
            p_data['score'] = 0
            p_data['wpm'] = 0
            p_data['is_complete'] = False
            
        emit('reset_room', {}, to=room)
        emit('room_update', {'players': get_room_players_list(room)}, to=room)

# ==========================================
# GAME LOOP (Runs asynchronously)
# ==========================================

def game_loop(room):
    # Notify clients to show 3-2-1 countdown
    socketio.emit('game_starting', {}, to=room)
    socketio.sleep(3.5) # Wait for UI countdown to finish
    
    total_rounds = rooms[room]['settings']['total_rounds']
    
    for current_round in range(1, total_rounds + 1):
        # Stop loop if room was deleted or everyone left
        if room not in rooms or not rooms[room]['players']:
            break
            
        # Reset round status for all players
        for p in rooms[room]['players'].values():
            p['is_complete'] = False
            p['wpm'] = 0
            
        sentence = get_random_sentence()
        time_limit = min(60, max(15, len(sentence) // 2)) # Dynamic time based on length
        
        socketio.emit('round_started', {
            'current_round': current_round,
            'total_rounds': total_rounds,
            'sentence': sentence,
            'time_limit': time_limit
        }, to=room)
        
        # Timer Loop
        time_left = time_limit
        while time_left > 0:
            if room not in rooms or rooms[room]['state'] != 'playing':
                return
                
            socketio.emit('timer_update', {'time_left': time_left}, to=room)
            socketio.sleep(1)
            time_left -= 1
            
            # Check if everyone finished early
            all_finished = all(p.get('is_complete') for p in rooms[room]['players'].values())
            if all_finished:
                break
                
        # Round Over
        socketio.emit('timer_update', {'time_left': 0}, to=room)
        socketio.emit('round_ended', {}, to=room)
        
        # Wait 3 seconds before next round
        socketio.sleep(3)
        
    # Game Finished
    if room in rooms:
        rooms[room]['state'] = 'finished'
        socketio.emit('game_finished', {'players': get_room_players_list(room)}, to=room)

if __name__ == '__main__':
    # Use eventlet or gevent in production. Standard run is fine for development.
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)