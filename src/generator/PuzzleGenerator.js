
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
        const panelCount = randBetween(PUZZLE_CONFIG.MIN_PANELS, PUZZLE_CONFIG.MAX_PANELS);

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
            if (i === panelCount - 1) {
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
                            plug.method = 'drag';
                            plug.hasRemoteControllers = false;
                        }
                    }
                    panel.addPlug(plug);
                } else {
                    this.setPlug(plug);
                    break;
                }
            }

            if (randBetween(1, 4) <= 3) {
                panel.addCoverings(panel, this, .6);
            }

            this.panels.push(panel);

            if (!panel.hasActiveGoal()) {
                this.techniques.switch.apply(panel, this);
            }
        }

        // LAST RESORT
        let salt = 0;
        while (this.availablePlugs.length > 0 && salt < 5) {
            const panel = new GeneratedPanel(this.panels.length, this.panels.length + 1);
            this.currentPanelIndex = panel.index;
            const initialPlugCount = this.availablePlugs.length;
            for (let j = 0; j < initialPlugCount; j++) {
                const plug = this.getPlug();
                if (!plug) break;
                const shape = SHAPE_PREFIX_MAP[plug.type] || 'circle';
                const plugPos = panel.findFreeSpace(plug.gridWidth, plug.gridHeight, shape);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;
                    panel.addPlug(plug);
                } else {
                    this.setPlug(plug);
                }
            }
            if (this.availablePlugs.length === initialPlugCount) break;
            this.panels.push(panel);
            salt++;
        }

        this.panels.forEach(p => p.totalPanels = this.panels.length);
    }

    toString() {
        const message = VICTORY_MESSAGES[randBetween(0, VICTORY_MESSAGES.length - 1)];
        const reward = chooseReward();
        const panelsStr = this.panels.map(p => p.toString()).join('\n/\n');
        return `${message} [${reward}]\n/\n${panelsStr}`;
    }
}
