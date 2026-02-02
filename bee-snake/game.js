// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 100; // milliseconds

// Flower types with different values and spawn rates
const FLOWER_TYPES = [
    { color: '#FF1493', emoji: '🌺', points: 10, spawnRate: 0.50 },  // Pink - 50% chance
    { color: '#87CEEB', emoji: '💙', points: 20, spawnRate: 0.30 },  // Blue - 30% chance
    { color: '#9370DB', emoji: '💜', points: 30, spawnRate: 0.15 },  // Purple - 15% chance
    { color: '#FF8C00', emoji: '🌻', points: 50, spawnRate: 0.05 }   // Orange - 5% chance (Rare!)
];

// Game state
let snake = [];
let snakeLength = 3;
let headX = 15;
let headY = 15;
let velocityX = 0;
let velocityY = 0;
let flower = null;
let score = 0;
let highScore = 0;
let gameRunning = false;
let gameLoop = null;

// UI elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const gameOverScreen = document.getElementById('gameOver');

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('beeSnakeHighScore');
    highScore = saved ? parseInt(saved) : 0;
    highScoreElement.textContent = highScore;
}

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('beeSnakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

// Initialize game
function initGame() {
    snake = [];
    snakeLength = 3;
    headX = 15;
    headY = 15;
    velocityX = 0;
    velocityY = 0;
    score = 0;
    scoreElement.textContent = score;
    gameOverScreen.style.display = 'none';
    spawnFlower();
}

// Spawn a new flower with weighted random selection
function spawnFlower() {
    // Select flower type based on spawn rates
    const random = Math.random();
    let cumulativeRate = 0;
    let selectedType = FLOWER_TYPES[0];

    for (const type of FLOWER_TYPES) {
        cumulativeRate += type.spawnRate;
        if (random <= cumulativeRate) {
            selectedType = type;
            break;
        }
    }

    // Find a position not occupied by snake
    let validPosition = false;
    let newX, newY;

    while (!validPosition) {
        newX = Math.floor(Math.random() * TILE_COUNT);
        newY = Math.floor(Math.random() * TILE_COUNT);

        validPosition = true;
        for (let segment of snake) {
            if (segment.x === newX && segment.y === newY) {
                validPosition = false;
                break;
            }
        }
    }

    flower = {
        x: newX,
        y: newY,
        type: selectedType
    };
}

// Start the game loop
function startGameLoop() {
    if (gameLoop) return;
    gameLoop = setInterval(updateGame, GAME_SPEED);
}

// Start the game
function startGame() {
    if (gameRunning) return;

    initGame();
    gameRunning = true;
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';

    // Don't start the loop until player makes first move
}

// Stop the game
function stopGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    saveHighScore();
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'block';
}

// Restart the game
function restartGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    startGame();
}

// Update game state
function updateGame() {
    // Only update if moving
    if (velocityX === 0 && velocityY === 0) return;

    // Move head
    headX += velocityX;
    headY += velocityY;

    // Check wall collision
    if (headX < 0 || headX >= TILE_COUNT || headY < 0 || headY >= TILE_COUNT) {
        stopGame();
        return;
    }

    // Check self collision
    for (let segment of snake) {
        if (segment.x === headX && segment.y === headY) {
            stopGame();
            return;
        }
    }

    // Add new head position
    snake.unshift({ x: headX, y: headY });

    // Check flower collision
    if (headX === flower.x && headY === flower.y) {
        score += flower.type.points;
        scoreElement.textContent = score;
        snakeLength++;
        spawnFlower();
    }

    // Remove tail if snake is too long
    while (snake.length > snakeLength) {
        snake.pop();
    }

    // Draw everything
    draw();
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern (grass)
    ctx.strokeStyle = 'rgba(0, 100, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw flower
    if (flower) {
        const x = flower.x * GRID_SIZE;
        const y = flower.y * GRID_SIZE;

        // Draw flower emoji
        ctx.font = `${GRID_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(flower.type.emoji, x + GRID_SIZE / 2, y + GRID_SIZE / 2);
    }

    // Draw snake with bee stripes
    snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;

        // Alternate between yellow and black for bee stripes
        const isYellow = index % 2 === 0;

        if (index === 0) {
            // Head - draw as a bee face
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

            // Add black stripes on head
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 5, y + 1, 3, GRID_SIZE - 2);
            ctx.fillRect(x + 12, y + 1, 3, GRID_SIZE - 2);

            // Eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(x + 7, y + 8, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 13, y + 8, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + 7, y + 8, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 13, y + 8, 1.5, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Body segments - alternate yellow and black
            ctx.fillStyle = isYellow ? '#FFD700' : '#000';
            ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

            // Add slight border for definition
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
    });
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    const isFirstMove = velocityX === 0 && velocityY === 0;

    switch(e.key) {
        case 'ArrowUp':
            if (velocityY === 0) {
                velocityX = 0;
                velocityY = -1;
                if (isFirstMove) startGameLoop();
            }
            e.preventDefault();
            break;
        case 'ArrowDown':
            if (velocityY === 0) {
                velocityX = 0;
                velocityY = 1;
                if (isFirstMove) startGameLoop();
            }
            e.preventDefault();
            break;
        case 'ArrowLeft':
            if (velocityX === 0) {
                velocityX = -1;
                velocityY = 0;
                if (isFirstMove) startGameLoop();
            }
            e.preventDefault();
            break;
        case 'ArrowRight':
            if (velocityX === 0) {
                velocityX = 1;
                velocityY = 0;
                if (isFirstMove) startGameLoop();
            }
            e.preventDefault();
            break;
    }
});

// Button event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startGame();
});

// Initialize
loadHighScore();
initGame();
draw();
