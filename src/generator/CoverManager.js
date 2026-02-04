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
        // Limit total covers per panel to prevent overcrowding
        let coversAdded = 0;
        const MAX_COVERS = 4;

        // For each coverable element, decide randomly if it should be covered
        for (const element of currentPanel.coverableElements) {
            if (coversAdded >= MAX_COVERS) break;

            // Debug: force covers on all elements if enabled
            const shouldCover = (DEBUG_CONFIG.enabled)
                ? true
                : Math.random() > probability;

            if (!shouldCover) continue;

            // Decide covering style
            // Style 2 and 3 require raised elements and no existing remotes
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
                } else if (styleIndex === 4) {
                    // Fallback for Size Obscure if it failed
                    this.styles[0].apply(currentPanel, element, targetPanel, generator);
                    coversAdded++;
                }
            }
        }
    }
}
