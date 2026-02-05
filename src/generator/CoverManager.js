class CoverManager {
    constructor() {
        this.styles = {
            0: new PhysicalCover(),
            1: new GroupObscureCover(),
            2: new RemoteOnlyCover(),
            3: new SwitchReleaseCover(),
            4: new SizeObscureCover()
        };
    }

    /**
     * Adds coverings to a panel.
     * @param {GeneratedPanel} currentPanel - The panel to add coverings to.
     * @param {GeneratedPanel} targetPanel - The panel where remote controllers might go.
     * @param {PuzzleGenerator} generator - The generator instance.
     * @param {number} probability - Probability of covering each element.
     */
    addCoverings(currentPanel, targetPanel, generator, probability = 0.33) {
        const diff = DIFFICULTY_SETTINGS[PUZZLE_CONFIG.DIFFICULTY] || DIFFICULTY_SETTINGS[2];

        // Limit total cover applications per panel to prevent overcrowding
        let coversAdded = 0;
        const MAX_COVERS = diff.maxCovers;

        // Iterate through all coverable elements
        for (const element of currentPanel.coverableElements) {
            if (coversAdded >= MAX_COVERS) break;

            // Decision: Should we cover this element at all?
            const shouldCover = (DEBUG_CONFIG.enabled) ? true : Math.random() > probability;
            if (!shouldCover) continue;

            // Stack multiple covers on this specific element
            const stackLimit = DEBUG_CONFIG.enabled ? 3 : diff.stackLimit;
            let stackCount = 0;

            for (let i = 0; i < stackLimit; i++) {
                if (coversAdded >= MAX_COVERS) break;

                // Decide covering style index
                // Style 2 (RemoteOnly) and 3 (SwitchRelease) require no existing remotes
                let maxStyle = 1;
                if (currentPanel.remoteSetsCount < 2 && element.elevation === '+' && !element.hasRemote) {
                    maxStyle = 4;
                }

                let styleIndex;
                if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.coverStyle !== undefined && DEBUG_CONFIG.coverStyle !== null) {
                    styleIndex = DEBUG_CONFIG.coverStyle;
                } else {
                    styleIndex = randBetween(0, maxStyle);
                }

                const style = this.styles[styleIndex];
                if (style) {
                    const success = style.apply(currentPanel, element, targetPanel, generator);
                    if (success) {
                        coversAdded++;
                        stackCount++;

                        // Update hasRemote to affect style selection in next loop iteration
                        if (styleIndex === 2 || styleIndex === 3) {
                            element.hasRemote = true;
                        }
                    } else if (styleIndex === 4 && stackCount === 0) {
                        // Fallback only if it's the first cover being applied and it failed
                        this.styles[0].apply(currentPanel, element, targetPanel, generator);
                        coversAdded++;
                        break; // Stop stacking if fallback was used
                    }
                }
            }
        }
    }
}
