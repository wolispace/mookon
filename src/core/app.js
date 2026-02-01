
// Global instance

const generator = new PuzzleGenerator();


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
    const reloadButton = document.getElementById('reload-button');
    const newButton = document.getElementById('new-button');

    if (infoButton) {
        infoButton.addEventListener('click', () => {
            Dialog.show('Mookon Box', INFO_CONTENT);
            console.log("This puzzle:\n", thisPuzzle, "\n");
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

// Global share handler
function handleShare(buttonElement) {
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
        if (buttonElement) buttonElement.textContent = 'Copied';
    }).catch(() => {
        alert('Unable to add to clipboard: ', shareUrl);
    });
}

// Initial share button listener (for index.html/dev.html initial load if button exists)
document.addEventListener('DOMContentLoaded', () => {
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', () => handleShare(shareButton));
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
