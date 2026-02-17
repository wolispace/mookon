const generator = new PuzzleGenerator();

function loadPuzzle(index, regenerate = true) {
    clearArea('puzzle');
    clearArea('storage');

    const urlParams = new URLSearchParams(window.location.search);
    const hasShared = !!urlParams.get('p');

    // Index mapping:
    // [0]: Shared (if hasShared)
    // [0+hasShared]: Medium (Diff 2)
    // [1+hasShared]: Easy   (Diff 1)
    // [2+hasShared]: Hard   (Diff 3)
    // [3+hasShared...]: Static Puzzles

    if (hasShared && index === 0) {
        thisPuzzle = sharedPuzzle;
    } else if (index >= (hasShared ? 1 : 0) && index <= (hasShared ? 3 : 2)) {
        // Difficulty selection
        const diffIndex = hasShared ? index - 1 : index;
        const newDifficulty = [2, 1, 3][diffIndex]; // Medium, Easy, Hard

        PUZZLE_CONFIG.DIFFICULTY = newDifficulty;
        localStorage.setItem('mookon_difficulty', newDifficulty);

        if (regenerate || !randomPuzzle) {
            randomPuzzle = generateRandomPuzzle();
        }
        thisPuzzle = randomPuzzle;
    } else {
        // Static puzzles
        const staticIndex = index - (hasShared ? 4 : 3);
        const puzzleSource = DEBUG_CONFIG.enabled ? debugPuzzleConfigs : puzzleConfigs;
        thisPuzzle = puzzleSource[staticIndex];
    }

    currentGame = new Game(thisPuzzle);
    currentPuzzleIndex = index;

    // Sync select dropdown
    const selector = document.getElementById('puzzle-select');
    if (selector) selector.value = index;

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
    const hasShared = !!urlParams.get('p');

    let optionIndex = 0;

    // 1. Shared (if present)
    if (hasShared) {
        const option = document.createElement("option");
        option.value = optionIndex++;
        option.textContent = "Shared";
        select.appendChild(option);
    }

    // 2. Difficulties
    const difficulties = [
        { name: "Medium", value: 2 },
        { name: "Easy", value: 1 },
        { name: "Hard", value: 3 }
    ];

    difficulties.forEach(diff => {
        const option = document.createElement("option");
        option.value = optionIndex++;
        option.textContent = diff.name;
        // Mark as selected if it matches current config
        if (PUZZLE_CONFIG.DIFFICULTY === diff.value) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    // 3. Static puzzles
    const puzzleSource = DEBUG_CONFIG.enabled ? debugPuzzleConfigs : puzzleConfigs;
    puzzleSource.forEach((config, index) => {
        const option = document.createElement("option");
        option.value = optionIndex++;
        option.textContent = `Puzzle ${index + 1}`;
        select.appendChild(option);
    });
}

function generateRandomPuzzle() {
    generator.generate();
    return generator.toString();
};
