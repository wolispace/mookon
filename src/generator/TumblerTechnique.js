class TumblerTechnique {
    constructor() {
        this.hasPlugAndSocket = false;
    }

    apply(panel, generator) {
        // Tumbler is always size 2
        const tumblerSize = 2;

        // Find space for the tumbler
        const tumblerPos = panel.findFreeSpace(tumblerSize, tumblerSize, 'tumbler');
        if (!tumblerPos) return;

        // Create the tumbler
        const tumbler = new BuildElement('tumbler');
        tumbler.gridWidth = tumbler.gridHeight = tumblerSize;
        tumbler.x = tumblerPos.x;
        tumbler.y = tumblerPos.y;
        tumbler.color = randBetween(0, COLOR_ARRAY.length - 1);
        tumbler.elevation = ''; // Flat (not raised)
        tumbler.method = 'hold';
        tumbler.change = 'rotate';
        tumbler.targetState = 4; // Target is 180 degrees
        tumbler.title = `Tumbler ${tumbler.id}`;
        tumbler.context = 'Tumbler Technique';

        tumbler.color = tumbler.color === 1 ? 0 : tumbler.color;

        panel.addElement(tumbler, false, 'Tumbler');

        // Create the matching key
        // Key is double the original keyhole size (0.15*2 x 0.4*2 of tumbler size 2)
        const keyWidth = tumblerSize * 0.15 * 2;  // 0.6
        const keyHeight = tumblerSize * 0.4 * 2;  // 1.6

        const keyPos = panel.findFreeSpace(keyWidth, keyHeight, 'key');
        if (!keyPos) {
            // Remove tumbler if we can't place the key
            const idx = panel.elements.findIndex(e => e.split(/\\s+/)[0] === tumbler.id);
            if (idx !== -1) panel.elements.splice(idx, 1);
            return;
        }

        const key = new BuildElement('key');
        key.gridWidth = keyWidth;
        key.gridHeight = keyHeight;
        key.x = keyPos.x;
        key.y = keyPos.y;
        key.color = tumbler.color; // Match tumbler color
        key.elevation = '+'; // Raised
        key.method = 'drag'; // Explicitly draggable
        key.change = ''; // No change type
        key.targetState = 0; // No target state
        key.title = `Key for ${tumbler.id}`;
        key.context = 'Tumbler Technique';

        panel.addElement(key, true, 'Key'); // Mark as plug so it can be tracked
    }
}
