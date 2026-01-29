
// Global instance

let globalZIndex = 1000;

const generator = new PuzzleGenerator();
function generateRandomPuzzle() {
    generator.generate();
    return generator.toString();
}

const panelOverrides = []; // ['screw', 'switch', 'hunt'
let currentGame = null;
let currentPuzzleIndex = 0;
let sharedPuzzle = null;
let randomPuzzle = null; // Generate on demand, not at module load
let thisPuzzle = '';

function loadPuzzle(index) {
    clearArea('puzzle');
    clearArea('storage');

    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedPuzzle = urlParams.get('p');

    if (hasSharedPuzzle && index === 0) {
        thisPuzzle = sharedPuzzle;
    } else if ((!hasSharedPuzzle && index === 0) || (hasSharedPuzzle && index === 1)) {
        if (!randomPuzzle) {
            randomPuzzle = generateRandomPuzzle(panelOverrides);
        }
        thisPuzzle = randomPuzzle;
    } else {
        const staticIndex = hasSharedPuzzle ? index - 2 : index - 1;
        thisPuzzle = puzzleConfigs[staticIndex];
    }

    // console.log("Loading\n:", thisPuzzle, "\n");
    currentGame = new Game(thisPuzzle);
    currentPuzzleIndex = index;

    // Log request to server (silent)
    fetch(`server.php?p=${currentPuzzleIndex}`).catch(() => { });
}

function clearArea(areaName) {
    const area = document.getElementById(`${areaName}-area`);
    area.innerHTML = '';
}

function populatePuzzleSelect() {
    const select = document.getElementById("puzzle-select");
    select.innerHTML = "";

    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedPuzzle = urlParams.get('p');

    let optionIndex = 0;

    // Add Shared option if present
    if (hasSharedPuzzle) {
        const option = document.createElement("option");
        option.value = optionIndex++;
        option.textContent = "Shared";
        select.appendChild(option);
    }

    // Add Random option
    const randomOption = document.createElement("option");
    randomOption.value = optionIndex++;
    randomOption.textContent = "Random";
    select.appendChild(randomOption);

    // Add static puzzles
    puzzleConfigs.forEach((config, index) => {
        const option = document.createElement("option");
        option.value = optionIndex++;
        option.textContent = `Puzzle ${index + 1}`;
        select.appendChild(option);
    });
}


// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Initialize SVG factory for filters
    if (typeof SVGFactory !== 'undefined') SVGFactory.init();

    // Load and render saved rewards
    RewardsManager.renderRewards();

    populatePuzzleSelect();
    const selector = document.getElementById('puzzle-select');

    selector.addEventListener('change', (e) => {
        const newIndex = parseInt(e.target.value);
        if (newIndex !== currentPuzzleIndex) {
            loadPuzzle(newIndex);
        }
    });

    // Only load default puzzle if no shared puzzle parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('p')) {
        loadPuzzle(0);
    }
    populatePuzzleSelect();
});


// Info dialog functionality
document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('info-button');
    const infoDialog = document.getElementById('info-dialog');
    const infoClose = document.getElementById('info-close');
    const reloadButton = document.getElementById('reload-button');
    const newButton = document.getElementById('new-button');

    if (infoButton) {
        infoButton.addEventListener('click', () => {
            infoDialog.classList.remove('hidden');
            console.log("This puzzle:\n", thisPuzzle, "\n");
        });
    }

    if (infoClose) {
        infoClose.addEventListener('click', () => {
            infoDialog.classList.add('hidden');
        });
    }

    if (infoDialog) {
        infoDialog.addEventListener('click', (e) => {
            if (e.target === infoDialog) {
                infoDialog.classList.add('hidden');
            }
        });
    }

    if (reloadButton) {
        reloadButton.addEventListener('click', () => {
            loadPuzzle(currentPuzzleIndex);
        });
    }

    if (newButton) {
        newButton.addEventListener('click', () => {
            location.reload();
        });
    }

});
// Encode/decode functions with separate message and puzzle encoding
const PUZZLE_CHARSET = 'ctswr0123456789abdefghiABCDEFGHI .,:/-><=jkmnopuvxyz';
const MESSAGE_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ !.0123456789+-,';
const MESSAGE_DELIMITER = '|';
const ROT_STEP = 9;
const WORD_MAP = {
    'tap': 'a', 'drag': 'b', 'hold': 'd', 'color': 'e', 'state': 'f', 'rotation': 'g', 'none': 'h', 'move': 'i'
};

function encodePuzzle(puzzleString) {
    const parts = puzzleString.split('/');
    const message = parts[0].trim();
    const puzzleData = parts.slice(1).join('/');

    // Encode message with full charset
    const encodedMessage = message.split('').map(char => {
        const index = MESSAGE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return MESSAGE_CHARSET[(index + ROT_STEP) % MESSAGE_CHARSET.length];
    }).join('');

    // Encode puzzle data with compact charset
    let compressedPuzzle = puzzleData.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');

    Object.entries(WORD_MAP).forEach(([word, symbol]) => {
        compressedPuzzle = compressedPuzzle.replace(new RegExp(word, 'g'), symbol);
    });

    const encodedPuzzle = compressedPuzzle.split('').map(char => {
        const index = PUZZLE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return PUZZLE_CHARSET[(index + ROT_STEP) % PUZZLE_CHARSET.length];
    }).join('');

    const combined = encodedMessage + MESSAGE_DELIMITER + encodedPuzzle;
    return LZString.compressToEncodedURIComponent(combined);
}

function decodePuzzle(encodedString) {
    const decompressed = LZString.decompressFromEncodedURIComponent(encodedString);
    const [encodedMessage, encodedPuzzleData] = decompressed.split(MESSAGE_DELIMITER);

    // Decode message (no word decompression)
    const message = encodedMessage.split('').map(char => {
        const index = MESSAGE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return MESSAGE_CHARSET[(index - ROT_STEP + MESSAGE_CHARSET.length) % MESSAGE_CHARSET.length];
    }).join('');

    // Decode puzzle data
    let puzzleData = encodedPuzzleData.split('').map(char => {
        const index = PUZZLE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return PUZZLE_CHARSET[(index - ROT_STEP + PUZZLE_CHARSET.length) % PUZZLE_CHARSET.length];
    }).join('');

    // Decompress words ONLY in puzzle data (not message)
    puzzleData = puzzleData.replace(/\bg\b/g, 'rotation');
    puzzleData = puzzleData.replace(/\be\b/g, 'color');
    puzzleData = puzzleData.replace(/\bf\b/g, 'state');
    puzzleData = puzzleData.replace(/\bd\b/g, 'hold');
    puzzleData = puzzleData.replace(/\bb\b/g, 'drag');
    puzzleData = puzzleData.replace(/\ba\b/g, 'tap');
    puzzleData = puzzleData.replace(/\bh\b/g, 'none');
    puzzleData = puzzleData.replace(/\bi\b/g, 'move');

    return message + '/' + puzzleData;
}

// Share functionality
document.addEventListener('DOMContentLoaded', () => {
    const shareButton = document.getElementById('share-button');

    if (shareButton) {
        shareButton.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const hasSharedPuzzle = urlParams.get('p');

            let currentPuzzle = '';
            if (hasSharedPuzzle && currentPuzzleIndex === 0) {
                currentPuzzle = sharedPuzzle;
            } else if ((!hasSharedPuzzle && currentPuzzleIndex === 0) || (hasSharedPuzzle && currentPuzzleIndex === 1)) {
                currentPuzzle = randomPuzzle;
            } else {
                const staticIndex = hasSharedPuzzle ? currentPuzzleIndex - 2 : currentPuzzleIndex - 1;
                currentPuzzle = puzzleConfigs[staticIndex];
            }

            const encoded = encodePuzzle(currentPuzzle);
            const shareUrl = `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(encoded)}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                shareButton.textContent = 'Copied';
            }).catch(() => {
                alert('Unable to add to clipboard: ', shareUrl);
            });
        });
    }
});

// Check for puzzle parameter on load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleParam = urlParams.get('p');

    if (puzzleParam) {
        try {
            sharedPuzzle = decodePuzzle(decodeURIComponent(puzzleParam));
            currentPuzzleIndex = 0;
            populatePuzzleSelect();
            loadPuzzle(0);
        } catch (e) {
        }
    }
});
