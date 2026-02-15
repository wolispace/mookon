/**
 * Global event listener initialization
 */
function initEventListeners() {
    // Puzzle selection change
    const selector = document.getElementById('puzzle-select');
    if (selector) {
        selector.addEventListener('change', (e) => {
            const newIndex = parseInt(e.target.value);
            if (newIndex !== currentPuzzleIndex) {
                loadPuzzle(newIndex);
            }
        });
    }

    // Info dialog button
    const infoButton = document.getElementById('info-button');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            Dialog.show('Mookon Box', INFO_CONTENT);
            console.log("This puzzle:\n", thisPuzzle, "\n");
        });
    }

    // Reload puzzle button
    const reloadButton = document.getElementById('reload-button');
    if (reloadButton) {
        reloadButton.addEventListener('click', () => {
            loadPuzzle(currentPuzzleIndex, false);
        });
    }

    // New random puzzle button
    const newButton = document.getElementById('new-button');
    if (newButton) {
        newButton.addEventListener('click', () => {
            loadPuzzle(currentPuzzleIndex, true);
        });
    }

    // Share button listener
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', () => handleShare(shareButton));
    }

    // Prevent context menu globally
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * Global share handler
 * @param {HTMLElement} buttonElement - The button that triggered the share
 */
function handleShare(buttonElement) {
    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedPuzzle = urlParams.get('p');

    let currentPuzzle = '';

    // Corrected logic to determine which puzzle string to share
    if (hasSharedPuzzle) {
        if (currentPuzzleIndex === 0) {
            currentPuzzle = sharedPuzzle;
        } else if (currentPuzzleIndex >= 1 && currentPuzzleIndex <= 3) {
            currentPuzzle = randomPuzzle;
        } else {
            // Static puzzles start at index 4 when shared is present
            currentPuzzle = puzzleConfigs[currentPuzzleIndex - 4];
        }
    } else {
        if (currentPuzzleIndex >= 0 && currentPuzzleIndex <= 2) {
            currentPuzzle = randomPuzzle;
        } else {
            // Static puzzles start at index 3 when no shared is present
            currentPuzzle = puzzleConfigs[currentPuzzleIndex - 3];
        }
    }

    if (!currentPuzzle) {
        console.error("No puzzle content to share.");
        return;
    }

    const encoded = encodePuzzle(currentPuzzle);
    const shareUrl = `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(encoded)}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        if (buttonElement) {
            const originalText = buttonElement.textContent || 'Share';
            buttonElement.textContent = 'Copied';
            setTimeout(() => {
                buttonElement.textContent = originalText;
            }, 2000);
        }
    }).catch((err) => {
        console.error('Unable to add to clipboard: ', err);
        alert('Share link: ' + shareUrl);
    });
}
