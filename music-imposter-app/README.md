# Music Imposter Game

A multiplayer game where friends listen to music, but one person hears a different song. Find the imposter!

## Prerequisites
- Node.js installed

## Setup & Run

### 1. Start the Backend Server
Open a terminal in the `music-imposter-app/server` folder:
```bash
cd music-imposter-app/server
npm install
npm start
```
The server will run on `http://localhost:3001`.

### 2. Start the Frontend Client
Open a new terminal in the `client` folder (located in the root folder `oneoffv2/client`):
```bash
cd ../client
npm install
npm run dev
```
The client will run on `http://localhost:3000`.

**Note:** Do not use `npm start` as it is for production mode. Use `npm run dev` for development.

## How to Play
1. Open `http://localhost:3000` in your browser.
2. Enter your name and click "Create New Lobby".
3. Share the Room Code with friends.
4. Friends join using the code.
5. Host clicks "Start Game".
6. Listen to the music! If you are the Imposter, try to blend in.
7. Vote for who you think the Imposter is.
