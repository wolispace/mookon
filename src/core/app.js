const generator = new PuzzleGenerator();

// Initialize application
window.addEventListener('DOMContentLoaded', () => {
    // Initialize core components
    if (typeof SVGFactory !== 'undefined') SVGFactory.init();
    RewardsManager.renderRewards();

    // Check for shared puzzle via URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleParam = urlParams.get('p');

    if (puzzleParam) {
        try {
            sharedPuzzle = decodePuzzle(decodeURIComponent(puzzleParam));
            currentPuzzleIndex = 0;
            populatePuzzleSelect();
            loadPuzzle(0);
        } catch (e) {
            console.error("Failed to load shared puzzle:", e);
            // Fallback to default
            loadInitialPuzzle();
        }
    } else {
        loadInitialPuzzle();
    }

    // Set up global event listeners from events.js
    initEventListeners();
});

/**
 * Loads the initial puzzle based on availability of shared or default options
 */
function loadInitialPuzzle() {
    populatePuzzleSelect();
    loadPuzzle(0);
}
