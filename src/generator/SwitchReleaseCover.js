class SwitchReleaseCover extends Cover {
    apply(currentPanel, element, targetPanel, generator) {
        const idx = currentPanel.elements.findIndex(e => e.split(/\s+/)[0] === element.id);
        if (idx !== -1 && ['c', 'r', 't', 'w'].includes(element.type)) {
            const tokens = element.elementString.split(/\s+/);
            // Find space for the release switch before modifying the target
            const swSize = 1;
            const swPos = currentPanel.findFreeSpace(swSize, 1, 'switch');
            if (swPos) {
                const modified = new BuildElement(SHAPE_PREFIX_MAP[element.type] || 'circle');
                modified.id = tokens[0];
                modified.gridWidth = element.gridWidth;
                modified.gridHeight = element.gridHeight;
                modified.x = element.x;
                modified.y = element.y;
                modified.color = tokens[4]; // Use index 4 to stay before any method/target tokens
                modified.elevation = element.elevation;
                modified.method = 'none'; // Disabled initially
                modified.context = `Released by switch`;

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
                sw.targetState = 1;
                sw.remoteActions = [{
                    id: modified.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'none',
                    target: 0
                }];

                currentPanel.elements[idx] = modified.toString();
                currentPanel.addElement(sw, false, `Release for ${modified.id}`);
                currentPanel.remoteSetsCount++;
                return true;
            }
        }
        return false;
    }
}
