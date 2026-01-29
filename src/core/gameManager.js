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

function generateRandomPuzzle() {
    generator.generate();
    return generator.toString();
}