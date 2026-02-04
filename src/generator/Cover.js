class Cover {
    constructor() {
        if (this.constructor === Cover) {
            throw new Error("Abstract class 'Cover' cannot be instantiated.");
        }
    }

    /**
     * Applies this cover to an element on a panel.
     * @param {GeneratedPanel} currentPanel - The panel being generated.
     * @param {Object} element - The coverable element object.
     * @param {GeneratedPanel} targetPanel - The panel where the element stays (usually the same).
     * @param {PuzzleGenerator} generator - The generator instance.
     * @returns {boolean} - True if the cover was successfully applied.
     */
    apply(currentPanel, element, targetPanel, generator) {
        throw new Error("Method 'apply()' must be implemented.");
    }

    applyMovementToCover(cover, movementType, elementId) {
        cover.title = `Cover for ${elementId} using ${movementType}`;
        switch (movementType) {
            case 'drag':
                cover.method = 'drag';
                cover.change = 'none';
                break;
            case 'tap':
                cover.method = 'tap';
                cover.change = 'color';
                cover.targetState = randBetween(0, 5);
                cover.remoteActions = [{
                    id: cover.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'none',
                    target: 0
                }];
                break;
            case 'screw':
                cover.method = 'hold';
                cover.change = 'rotate';
                cover.targetState = randBetween(1, 8);
                cover.remoteActions = [{
                    id: cover.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'none',
                    target: 0
                }];
                break;
            case 'remote':
                cover.method = 'none';
                cover.hasRemoteControllers = true;
                break;
        }
    }
}
