# Multiplayer Testing Checklist

## Before Deployment Testing (Local)
Test on your local network first: http://localhost:5000

### Basic Functionality
- [ ] Home page loads correctly
- [ ] Can enter player name
- [ ] Can create a new room
- [ ] Room code is generated
- [ ] Can copy room link
- [ ] Can join room with code

### Solo Play (1 Player)
- [ ] Can start game alone
- [ ] Words display correctly
- [ ] Timer counts down (30 seconds)
- [ ] Can type and submit answers
- [ ] Correct answers give points
- [ ] Wrong answers allow retry
- [ ] Timeout shows "YOU FAILED" message
- [ ] Progresses through all 15 rounds
- [ ] Easy → Medium → Hard progression works
- [ ] Final scores display correctly
- [ ] Winner announcement shows

### Multiplayer (2+ Players)
Test with multiple browser windows:

#### Room Management
- [ ] Multiple players can join same room
- [ ] Player list updates in real-time
- [ ] All players see each other in waiting area
- [ ] Only host can start game (or any player?)

#### Game Synchronization
- [ ] All players see the same word simultaneously
- [ ] Timer syncs across all players
- [ ] Round number is same for everyone
- [ ] Leaderboard updates in real-time for all players

#### Gameplay
- [ ] Each player can type independently
- [ ] Correct answers update leaderboard immediately
- [ ] Wrong answers don't affect other players
- [ ] Fast typers get more points
- [ ] Submission feed shows who finished

#### Round Progression
- [ ] When all players finish → Wait 5 seconds → Next round
- [ ] When timer expires → Show results → Next round
- [ ] If one player finishes early → They wait for others
- [ ] Round doesn't advance until all finish OR timeout

#### End Game
- [ ] Game ends after 15 rounds
- [ ] Final leaderboard shows all players
- [ ] Winner is announced correctly
- [ ] Can return to home page

---

## After Deployment Testing (Public URL)

### Cross-Device Testing
Test with different devices on different networks:

- [ ] Desktop browser (Chrome)
- [ ] Desktop browser (Firefox)
- [ ] Desktop browser (Edge)
- [ ] Mobile browser (iPhone Safari)
- [ ] Mobile browser (Android Chrome)
- [ ] Tablet

### Network Testing
- [ ] Works on WiFi
- [ ] Works on mobile data (4G/5G)
- [ ] Works across different ISPs
- [ ] WebSocket connections stable
- [ ] No disconnections during gameplay

### Performance Testing
- [ ] Page loads in under 3 seconds
- [ ] No lag when typing
- [ ] Real-time updates are instant
- [ ] Timer is accurate
- [ ] No delays between rounds

### Stress Testing
- [ ] 2 players work smoothly
- [ ] 3-4 players work smoothly
- [ ] 5+ players (if supported)
- [ ] Multiple rooms simultaneously
- [ ] Long gaming sessions (30+ minutes)

---

## Common Issues to Check

### WebSocket Issues
If real-time features don't work:
- [ ] Check browser console for errors (F12)
- [ ] Verify WebSocket connection established
- [ ] Check if CORS is configured correctly
- [ ] Ensure deployment supports WebSockets

### Deployment-Specific Issues
- [ ] App doesn't sleep/timeout during game
- [ ] Environment variables set correctly
- [ ] All static files (CSS/JS) load
- [ ] Database/storage works (if used)

### Mobile-Specific Issues
- [ ] Submit button works on touch
- [ ] Keyboard doesn't cover input
- [ ] Text is readable on small screens
- [ ] Buttons are large enough to tap
- [ ] No horizontal scrolling

---

## Quick Test Script

### Test 1: Solo Play (2 minutes)
1. Open URL
2. Enter name → Create room
3. Start game immediately
4. Type 3 rounds correctly
5. Let 2 rounds timeout
6. Check final scores

### Test 2: Multiplayer (5 minutes)
1. Open URL in 3 browser windows
2. Player1 creates room
3. Player2 & Player3 join with code
4. Start game
5. Player1 types fast
6. Player2 types slow
7. Player3 makes mistakes
8. Complete 5 rounds
9. Verify leaderboard is correct

### Test 3: Edge Cases (3 minutes)
1. Join with empty name (should fail)
2. Join with invalid room code (should fail)
3. Try to join game in progress (should fail)
4. Refresh page during game (what happens?)
5. Close browser and rejoin (what happens?)

---

## Deployment Platform Specific

### Render
- [ ] App wakes up from sleep (first load may be slow)
- [ ] WebSockets work correctly
- [ ] No 502 errors

### Railway
- [ ] Environment variables set
- [ ] Build completes successfully
- [ ] Logs show no errors

### Vercel
- [ ] Serverless functions work
- [ ] WebSocket connections stable
- [ ] No timeout issues

---

## Success Criteria

✅ **Minimum Requirements:**
- Solo play works perfectly
- 2 players can play together smoothly
- Real-time updates work
- No crashes or errors
- Mobile-friendly

✅ **Ideal Performance:**
- 5+ players can play simultaneously
- Zero lag or delays
- Works on all devices
- No disconnections
- Fast page loads

---

## Reporting Issues

If you find bugs, note:
1. What were you doing?
2. What device/browser?
3. What happened vs what should happen?
4. Can you reproduce it?
5. Any error messages?

Check browser console (F12) for error messages.
