// Initialize application
window.addEventListener('DOMContentLoaded', () => {
    // Restore saved difficulty if exists
    const savedDiff = localStorage.getItem('mookon_difficulty');
    if (savedDiff) {
        PUZZLE_CONFIG.DIFFICULTY = parseInt(savedDiff);
    }

    // Initialize core components
    if (typeof SVGFactory !== 'undefined') SVGFactory.init();
    RewardsManager.renderRewards();

    // Check for shared puzzle via URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleParam = urlParams.get('p');

    if (puzzleParam) {
        try {
            sharedPuzzle = decodePuzzle(decodeURIComponent(puzzleParam));
            loadInitialPuzzle(true);
        } catch (e) {
            console.error("Failed to load shared puzzle:", e);
            loadInitialPuzzle(false);
        }
    } else {
        loadInitialPuzzle(false);
    }

    // Set up global event listeners from events.js
    initEventListeners();
});

/**
 * Loads the initial puzzle based on availability of shared or default options
 */
function loadInitialPuzzle(hasShared) {
    populatePuzzleSelect();

    let initialIndex = 0;
    if (!hasShared) {
        // Map DIFFICULTY back to select index (Medium=2, Easy=1, Hard=3)
        // Select order: Medium, Easy, Hard
        const currentDiff = PUZZLE_CONFIG.DIFFICULTY;
        if (currentDiff === 1) initialIndex = 1;      // Easy
        else if (currentDiff === 3) initialIndex = 2; // Hard
        else initialIndex = 0;                        // Medium (default)
    }

    loadPuzzle(initialIndex);
}
