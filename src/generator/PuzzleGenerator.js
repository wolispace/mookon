
class PuzzleGenerator {
    constructor() {
        this.techniques = {
            'screw': new ScrewTechnique(),
            'hole': new HoleTechnique(),
            'switch': new SwitchTechnique(),
            'maze': new MazeTechnique(),
            'group': new GroupTechnique()
        };
        this.techniquesList = Object.values(this.techniques);
        this.plugAndSocketTechniques = this.techniquesList.filter(t => t.hasPlugAndSocket);
        this.otherTechniques = this.techniquesList.filter(t => !t.hasPlugAndSocket);

        this.availablePlugs = []; // Pool of plugs available for placement
        this.panels = []; // Generated panels
        this.currentPanelIndex = 0; // Track the index of the panel currently being generated
    }

    getTechnique(name) {
        return this.techniques[name] || this.techniquesList[randBetween(0, this.techniquesList.length - 1)];
    }

    setPlug(plug) {
        this.availablePlugs.push(plug);
    }

    getPlug() {
        if (this.availablePlugs.length === 0) return null;
        const plugIndex = randBetween(0, this.availablePlugs.length - 1);
        const plug = this.availablePlugs[plugIndex];
        this.availablePlugs.splice(plugIndex, 1);
        return plug;
    }

    isFinalPanel() {
        return this.currentPanelIndex === 0;
    }

    generate() {
        elementIdCounter = 1;
        this.availablePlugs = [];
        this.panels = [];

        // STRICT DEBUG MODE: Force a single panel with specific tech/cover
        if (DEBUG_CONFIG.enabled) {
            const panel = new GeneratedPanel(0, 1);
            this.currentPanelIndex = 0;

            // Apply forced technique
            const tech = this.getTechnique(DEBUG_CONFIG.technique);
            tech.apply(panel, this);

            // Place all generated plugs immediately on the same panel
            while (this.availablePlugs.length > 0) {
                const plug = this.getPlug();
                if (!plug) break;
                const shape = SHAPE_PREFIX_MAP[plug.type] || 'circle';
                const plugPos = panel.findFreeSpace(plug.gridWidth, plug.gridHeight, shape);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;
                    panel.addPlug(plug);
                }
            }

            // Always add covers in debug mode using forced style
            panel.addCoverings(panel, this, 0); // probability 0 means force covers if debug is on

            this.panels.push(panel);
            return;
        }

        // --- Standard Random Generation ---
        const diff = DIFFICULTY_SETTINGS[PUZZLE_CONFIG.DIFFICULTY] || DIFFICULTY_SETTINGS[2];
        const panelCount = randBetween(diff.minPanels, diff.maxPanels);

        const isEasy = PUZZLE_CONFIG.DIFFICULTY === 1 || DEBUG_CONFIG.enabled;

        for (let i = 0; i < panelCount; i++) {
            const panel = new GeneratedPanel(i, panelCount);
            this.currentPanelIndex = i;

            let techCount = randBetween(PUZZLE_CONFIG.MIN_TECHNIQUES, PUZZLE_CONFIG.MAX_TECHNIQUES);

            if (i === 0) {
                const tech = this.plugAndSocketTechniques[randBetween(0, this.plugAndSocketTechniques.length - 1)];
                tech.apply(panel, this);
            } else {
                for (let j = 0; j < techCount; j++) {
                    const randomTech = this.techniquesList[randBetween(0, this.techniquesList.length - 1)];
                    randomTech.apply(panel, this);
                }
            }

            // Standard plug placement logic
            let numPlugsToAdd;
            if (isEasy) {
                // In Easy mode, always try to place plugs on the same panel as their target socket
                numPlugsToAdd = this.availablePlugs.length;
            } else if (i === panelCount - 1) {
                numPlugsToAdd = this.availablePlugs.length;
            } else if (i === 0) {
                numPlugsToAdd = 0;
            } else {
                numPlugsToAdd = Math.min(
                    randBetween(0, Math.max(1, this.availablePlugs.length)),
                    panel.findFreeSpace(1, 1) ? randBetween(0, 2) : 0
                );
            }

            for (let j = 0; j < numPlugsToAdd; j++) {
                const plug = this.getPlug();
                if (!plug || plug.placed) break;

                const shape = SHAPE_PREFIX_MAP[plug.type] || 'circle';
                const plugPos = panel.findFreeSpace(plug.gridWidth, plug.gridHeight, shape);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;
                    if (plug.hasRemoteControllers) {
                        const success = panel.addRemoteControllers(plug);
                        if (!success) {
                            // SAFEGUARD: If controllers couldn't be added, MUST revert to drag
                            plug.method = 'drag';
                            plug.hasRemoteControllers = false;
                        }
                    }
                    panel.addPlug(plug);
                    plug.placed = true;
                } else {
                    this.setPlug(plug);
                    // Don't break, try next plug maybe? Or break if panel is full.
                    // For now, break to move to next panel.
                    break;
                }
            }

            if (randBetween(1, 10) <= diff.coverProb * 10) {
                panel.addCoverings(panel, this, diff.coverProb);
            }

            this.panels.push(panel);

            if (!panel.hasActiveGoal()) {
                this.techniques.switch.apply(panel, this);
            }
        }

        // LAST RESORT: Keep creating panels until all plugs are placed
        if (isEasy && this.availablePlugs.length > 0) {
            // In Easy mode, we failed to place some plugs on the single panel.
            // Since we can't add more panels, we just have to drop them.
            // (The techniques should have prevented this, but this is a safety)
            this.availablePlugs = [];
            return;
        }

        let salt = 0;
        const fallbackTechniques = this.techniquesList.filter(t => t.constructor.name !== 'MazeTechnique' && t.constructor.name !== 'GroupTechnique');

        while (this.availablePlugs.length > 0 && salt < 10) { // Increased salt limit
            const panel = new GeneratedPanel(this.panels.length, this.panels.length + 1);
            this.currentPanelIndex = panel.index;

            // Add a simple technique to ensure panel has a goal
            const tech = this.techniques.switch; // Switches are compact
            tech.apply(panel, this);

            let placedAny = false;
            let plugsToTry = [...this.availablePlugs];
            this.availablePlugs = []; // Clear to repopulate if failed

            for (const plug of plugsToTry) {
                const shape = SHAPE_PREFIX_MAP[plug.type] || 'circle';
                const plugPos = panel.findFreeSpace(plug.gridWidth, plug.gridHeight, shape);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;
                    if (plug.hasRemoteControllers) {
                        const success = panel.addRemoteControllers(plug);
                        if (!success) {
                            plug.method = 'drag';
                            plug.hasRemoteControllers = false;
                        }
                    }
                    panel.addPlug(plug);
                    plug.placed = true;
                    placedAny = true;
                } else {
                    this.setPlug(plug);
                }
            }

            if (panel.elements.length > 0) {
                this.panels.push(panel);
            }
            if (!placedAny && this.availablePlugs.length > 0) {
                salt++; // Panel was too full to even fit one plug? Should be rare for empty panel.
            }
        }

        this.panels.forEach(p => p.totalPanels = this.panels.length);
    }

    toString() {
        const message = VICTORY_MESSAGES[randBetween(0, VICTORY_MESSAGES.length - 1)];
        const reward = RewardsManager.chooseReward();

        // Build a summary of what's in the puzzle for diagnostics
        const notes = [];
        this.panels.forEach((p, i) => {
            notes.push(`Panel ${i} (${p.color}):`);
            p.elements.forEach(e => {
                const titleMatch = e.match(/title=([^\s,]+)/);
                const contextMatch = e.match(/context=([^\s,]+)/);
                if (titleMatch || contextMatch) {
                    const id = e.split(/\s+/)[0];
                    const title = titleMatch ? titleMatch[1].replace(/_/g, ' ') : '';
                    const context = contextMatch ? contextMatch[1].replace(/_/g, ' ') : '';
                    notes.push(`  - ${id}: ${title}${context ? ` [${context}]` : ''}`);
                }
            });
        });

        const summary = `\n--- GENERATION SUMMARY ---\n${notes.join('\n')}\n------------------------\n`;
        const panelsStr = this.panels.map(p => p.toString()).join('\n/\n');

        // console.log(summary);
        // We prepend the summary to the victory message so it's visible in the console/output 
        // without affecting the panel parsing logic.
        return `${message} [${reward}]\n/\n${panelsStr}`;
    }
}
