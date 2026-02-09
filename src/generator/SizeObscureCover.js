class SizeObscureCover extends Cover {
    apply(currentPanel, element, targetPanel, generator) {
        const idx = currentPanel.elements.findIndex(e => e.split(/\s+/)[0] === element.id);
        if (idx !== -1 && element.elevation === '+' && !['s', 'w'].includes(element.type)) {
            // Re-parse the existing config to modify it
            const tokens = currentPanel.elements[idx].split(/\s+/);
            const sizeParts = tokens[1].split('x');
            const targetW = parseFloat(sizeParts[0]);
            const targetH = parseFloat(sizeParts[1]);
            const targetSize = Math.max(targetW, targetH);
            const aspectRatio = targetH / targetW;

            // The size cycle range is [1.0, 2.0] absolute grid units (unscaled).
            const pingPong = [1.0, 1.25, 1.5, 1.75, 2.0, 1.75, 1.5, 1.25];

            // Only apply if targetSize is reachable within the cycle
            const validStates = [];
            pingPong.forEach((s, i) => {
                if (Math.abs(s - targetSize) < 0.01) validStates.push(i);
            });

            if (validStates.length > 0) {
                // Store original element string in case we need to revert
                const originalElement = currentPanel.elements[idx];

                // Pick a "wrong" base size for the config string (different from targetSize)
                const potentialSizes = [1.0, 1.25, 1.5, 1.75, 2.0];
                let baseSize = potentialSizes[randBetween(0, potentialSizes.length - 1)];
                while (Math.abs(baseSize - targetSize) < 0.01) {
                    baseSize = potentialSizes[randBetween(0, potentialSizes.length - 1)];
                }

                const newW = baseSize;
                const newH = baseSize * aspectRatio;
                tokens[1] = `${Math.round(newW * 100) / 100}x${Math.round(newH * 100) / 100}`;

                // Pick an initial state that is NOT valid
                let initialState = randBetween(0, 7);
                while (validStates.includes(initialState)) {
                    initialState = randBetween(0, 7);
                }

                // Insert 'state X' after color (index 4)
                tokens.splice(5, 0, 'state', initialState);
                currentPanel.elements[idx] = tokens.join(' ');

                // Add the remote controller
                const dummyPlug = { id: element.id };
                if (currentPanel.addSizeController(dummyPlug)) {
                    return true;
                } else {
                    // CRITICAL: Revert the size change if we couldn't add the controller
                    currentPanel.elements[idx] = originalElement;
                }
            }
        }
        return false;
    }
}
