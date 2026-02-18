const INFO_CONTENT = `
    <p><strong>A sequential puzzle box simulator.</strong></p>
    <p>A Mookon box is made of several panels.</p>
    <p>Find the reward.</p>
    <p>Tap, hold and drag elements to unlock some.</p>
    <p>Unlock panels to reveal the next.</p>
    <p>Elements may be required on other panels.</p>
    <p><i class="fas fa-rotate-right"></i> resets the current puzzle.</p>
    <p><i class="fas fa-dice"></i> a new random puzzle.</p>
    <p>Don't use external tools or force.</p>
    <p><span class="settings-toggle" onclick="toggleBackgroundFlash();">Background flash is <strong id="background-state">ON</strong></span></p>
    <p><button id="share-button">Copy current puzzle to clipboard</button></p>
`;

let backgroundFlashEnabled = true;

function toggleBackgroundFlash() {
    backgroundFlashEnabled = !backgroundFlashEnabled;
    document.getElementById('background-state').textContent = backgroundFlashEnabled ? 'ON' : 'OFF';
}

function triggerBackgroundFlash() {
    if (!backgroundFlashEnabled) return;
    document.body.style.animation = 'satisfaction-flash 0.4s ease';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 400);
}
