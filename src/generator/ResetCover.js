class ResetCover extends Cover {
    apply(currentPanel, element, targetPanel, generator) {
        // Track which elements already have reset triggers on this panel
        const existingResetTargets = new Set();
        currentPanel.elements.forEach(el => {
            const tokens = el.split(/\s+/);
            // Look for "elementId reset" pattern
            for (let i = 0; i < tokens.length - 1; i++) {
                if (tokens[i + 1] === 'reset') {
                    existingResetTargets.add(tokens[i]);
                }
            }
        });

        // Refinement: Filter out non-interactive elements (like decorative holes)
        const potentialRemotes = currentPanel.coverableElements.filter(e => {
            if (e.id === element.id) return false;
            if (e.elevation !== '-') return false; // ONLY target sockets (sunken elements)

            // Skip if this element already has a reset trigger
            if (existingResetTargets.has(e.id)) return false;

            // Interaction Check: Must have a method OR a non-zero target state
            const tokens = e.elementString.split(/\s+/);
            const method = tokens[5] || '';
            const target = tokens[7] || '';

            if (method === '' && (target === '' || target === '0')) {
                // Background hole, but if it's filled it becomes an interesting target
                if (!e.filled) return false;
            }
            if (method === 'none' && (target === '' || target === '0')) {
                if (!e.filled) return false;
            }

            return true;
        });
        if (potentialRemotes.length === 0) return false;

        const remote = potentialRemotes[randBetween(0, potentialRemotes.length - 1)];

        // Randomly decide the trap type: Switch (0) or Button/Circle (1)
        const trapType = randBetween(0, 1);

        if (trapType === 0) {
            // Option A: Random Switch Trap with varying length
            const swSize = randBetween(1, 3);
            const swPos = currentPanel.findFreeSpace(swSize, 1, 'switch');

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
