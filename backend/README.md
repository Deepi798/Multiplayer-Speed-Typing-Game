# Speed Typing Game - Backend

Flask-SocketIO backend server for the real-time multiplayer typing game.

## Features
- Real-time WebSocket communication
- Room-based multiplayer system
- Progressive difficulty (Easy → Medium → Hard)
- Configurable rounds (5, 10, 15, 20)
- Score calculation based on speed and accuracy
- Auto-advance round logic

## Installation

```bash
pip install -r requirements.txt
```

## Run Locally

```bash
python app.py
```

Server runs on `http://localhost:5000`

## Deployment

Configured for deployment on:
- Render
- Railway
- Vercel

See `Procfile` and `runtime.txt` for deployment configuration.

## Tech Stack
- Flask 3.0.0
- Flask-SocketIO 5.3.5
- Python-SocketIO 5.10.0
- Gunicorn 21.2.0
