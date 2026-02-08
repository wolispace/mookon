class ResetCover extends Cover {
    apply(currentPanel, element, targetPanel, generator) {
        // Find a random remote target on the same panel
        const potentialRemotes = currentPanel.coverableElements.filter(e => e.id !== element.id);
        if (potentialRemotes.length === 0) return false;

        const remote = potentialRemotes[randBetween(0, potentialRemotes.length - 1)];

        // Randomly decide the trap type: Switch (0) or Button/Circle (1)
        const trapType = randBetween(0, 1);

        if (trapType === 0) {
            // Option A: Random Switch Trap with varying length
            const swSize = randBetween(1, 3);
            // Switches need swSize + 1 space for the ball
            const swPos = currentPanel.findFreeSpace(swSize + 1, 1);

            if (swPos) {
                const sw = new BuildElement('switch');
                sw.gridWidth = swSize;
                sw.gridHeight = 1;
                sw.x = swPos.x;
                sw.y = swPos.y;

                const ballColor = randBetween(1, 8);
                const unsatisfiedPillColor = randBetween(1, 8);
                let satisfiedPillColor = randBetween(1, 8);
                while (satisfiedPillColor === unsatisfiedPillColor) {
                    satisfiedPillColor = randBetween(1, 8);
                }
                sw.color = `${unsatisfiedPillColor}-${satisfiedPillColor}-${ballColor}`;
                sw.method = 'tap';
                sw.change = 'state';
                sw.targetState = 9;
                sw.remoteActions = [{
                    id: remote.id,
                    type: 'reset'
                }];

                sw.title = `Reset ${remote.id}`;
                currentPanel.addElement(sw, false, `Reset switch (${swSize}) for ${remote.id}`);
                return true;
            }
        }

        // Option B: Button (Rectangle) or Circle
        const shape = randBetween(0, 1) === 0 ? 'rectangle' : 'circle';
        const pos = currentPanel.findFreeSpace(1, 1);

        if (pos) {
            const trap = new BuildElement(shape);
            trap.gridWidth = 1;
            trap.gridHeight = 1;
            trap.x = pos.x;
            trap.y = pos.y;
            trap.color = randBetween(0, 7);
            trap.elevation = '+';
            trap.method = 'tap';
            trap.remoteActions = [{
                id: remote.id,
                type: 'reset'
            }];
            trap.title = `Reset ${remote.id}`;
            currentPanel.addElement(trap, false, `Reset ${shape} for ${remote.id}`);
            return true;
        }

        return false;
    }
}
