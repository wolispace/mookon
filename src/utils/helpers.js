// Utility helper functions

// Calculate actual element size in pixels
function getElementSize() {
    const maxAvailable = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.45);
    const cellSize = Math.floor((maxAvailable - (PADDING + BORDER) * 2) / 8);

    // Set CSS variable for use in styles
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);

    return cellSize;
}

// Random number utilities
function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDecimal(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

// Parse size string ("1x2" or "1") into {width, height}
function parseSize(sizeStr) {
    let width = 1, height = 1;
    if (sizeStr.includes('x')) {
        const parts = sizeStr.split('x');
        width = parseFloat(parts[0]);
        height = parseFloat(parts[1]);
    } else {
        width = height = parseFloat(sizeStr);
    }
    return { width, height };
}

// Confetti burst animation
function confettiBurst() {
    const colors = ["#ff4757", "#1e90ff", "#2ed573", "#ffa502", "#eccc68"];
    const confettiCount = 100;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.animationDuration = `${Math.random() * 0.5 + 1}s`;
        confetti.style.animationDelay = `${Math.random() * 0.3}s`;

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 1500);
    }
}

// Puzzle encoding/decoding utilities
function encodePuzzle(puzzleString) {
    return LZString.compressToEncodedURIComponent(puzzleString);
}

function decodePuzzle(encodedString) {
    return LZString.decompressFromEncodedURIComponent(encodedString);
}

// Choose random reward
function chooseReward() {
    return REWARDS[randBetween(0, REWARDS.length - 1)];
}

// Build reward HTML
function buildReward(reward) {
    return `<div class="reward" title="Reward ${reward}">
                <i class="fa-solid fa-${reward}"></i>
            </div>`;
}
