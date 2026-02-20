# Real-Time Multiplayer Speed Typing Game

A web-based multiplayer typing game built with Flask and Flask-SocketIO where players compete to type words as fast and accurately as possible.

## Features

- Solo play mode (practice alone)
- Multiplayer mode (compete with friends)
- Real-time gameplay using WebSockets
- Reaction time calculation and scoring
- Live leaderboard updates
- Live submission feed showing who typed what
- Multiple rounds with automatic progression
- Winner announcement at game end
- Responsive design for all devices

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

## How to Play

### Solo Mode:
1. Enter your name on the home page
2. Click "Create New Room"
3. Click "Start Game" immediately
4. Type each word as fast as you can
5. Press Enter to submit
6. Try to beat your own high score!

### Multiplayer Mode:
1. Enter your name on the home page
2. Click "Create New Room" to start a new game
3. Share the room link with friends
4. Wait for players to join
5. Click "Start Game" when everyone is ready
6. Everyone sees the same word at the same time
7. Type it as fast and accurately as possible
8. Press Enter to submit
9. See who's fastest in real-time!
10. Winner is announced after all rounds

## Scoring

- Base points: 1000
- Points decrease based on reaction time (100 points per second)
- Minimum: 100 points for correct answers
- Incorrect answers receive 0 points
- Fastest and most accurate player wins!

## Game Configuration

Edit `app.py` to customize:
- `total_rounds`: Number of rounds per game (default: 5)
- Word list in `words.txt`

## Technologies Used

- Backend: Python Flask, Flask-SocketIO
- Frontend: HTML, CSS, JavaScript
- Real-time: Socket.IO
- Styling: Custom CSS with gradient design
