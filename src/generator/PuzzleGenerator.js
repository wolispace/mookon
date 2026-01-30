
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
        const panelCount = randBetween(PUZZLE_CONFIG.MIN_PANELS, PUZZLE_CONFIG.MAX_PANELS);

        for (let i = 0; i < panelCount; i++) {
            const panel = new GeneratedPanel(i, panelCount);
            this.currentPanelIndex = i; // Track current panel index for techniques

            // Apply techniques to generate sockets and plugs
            let techCount = randBetween(PUZZLE_CONFIG.MIN_TECHNIQUES, PUZZLE_CONFIG.MAX_TECHNIQUES);

            // SPECIAL CASE: The first panel generated (i=0) is the LAST panel seen by the user.
            // We want it to HAVE a socket that requires a plug from a PREVIOUS panel.
            if (i === 0) {
                // Force a technique that has a plug and socket
                const tech = this.plugAndSocketTechniques[randBetween(0, this.plugAndSocketTechniques.length - 1)];
                tech.apply(panel, this);
                // console.log(`%c[Generator] Final Panel (i=0): Forced plug technique (${tech.constructor.name})`, 'color: #33cc33');
            } else if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.forcePanelTypes && DEBUG_CONFIG.panelTypes[i]) {
                const technique = this.getTechnique(DEBUG_CONFIG.panelTypes[i]);
                technique.apply(panel, this);
            } else {
                // Random technique selection (normally 1)
                for (let j = 0; j < techCount; j++) {
                    const randomTech = this.techniquesList[randBetween(0, this.techniquesList.length - 1)];
                    randomTech.apply(panel, this);
                }
            }

            // Add plugs from pool to appropriate panel
            // On final panel, add all remaining plugs to ensure every socket can be completed
            let numPlugsToAdd;
            if (i === panelCount - 1) {
                numPlugsToAdd = this.availablePlugs.length;
            } else if (i === 0) {
                // For the VERY FIRST generated panel (the final one user sees),
                // we strictly EXCLUDE all plugs. This forces them to be found on previous panels.
                numPlugsToAdd = 0;
                // console.log(`%c[Generator] Final Panel (i=0): Strictly excluding all ${this.availablePlugs.length} plug(s) for previous panels`, 'color: #3399ff; font-weight: bold;');
            } else if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.forcePlugsToNextPanel) {
                // In debug mode with forced next-panel: skip plugs, they'll go to next panel
                numPlugsToAdd = 0;
            } else {
                numPlugsToAdd = Math.min(
                    randBetween(0, Math.max(1, this.availablePlugs.length)),
                    panel.findFreeSpace(1, 1) ? randBetween(0, 2) : 0
                );
            }

            // Place plugs on current panel
            for (let j = 0; j < numPlugsToAdd; j++) {
                const plug = this.getPlug();
                if (!plug) break;
                if (plug.placed) break;

                const shape = SHAPE_PREFIX_MAP[plug.type] || 'circle';
                const plugPos = panel.findFreeSpace(plug.gridWidth, plug.gridHeight, shape);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;

                    // If plug has remote controllers, try to add them
                    if (plug.hasRemoteControllers) {
                        const success = panel.addRemoteControllers(plug);
                        if (!success) {
                            // Panel limit reached or no space: reset plug to draggable to keep puzzle solvable
                            plug.method = 'drag';
                            plug.hasRemoteControllers = false;
                            // console.log(`%c[Generator] Remote limit reached for panel ${panel.index}, resetting plug ${plug.id} to drag`, 'color: #888');
                        }
                    }

                    panel.addPlug(plug);
                } else {
                    // Put it back if no space
                    this.setPlug(plug);
                    break;
                }
            }

            // Optionally add covers over some elements (30% chance per panel)
            if (randBetween(1, 4) <= 3) {
                panel.addCoverings(panel, this, .6);
            }

            this.panels.push(panel);

            // FINAL CHECK: Ensure the panel is not auto-completed.
            // If it has no active goals (only decorative elements and satisfied plugs), force a switch technique.
            if (!panel.hasActiveGoal()) {
                // console.log(`%c[Generator] Panel ${panel.index}: No active goals detected, forcing SwitchTechnique`, 'color: #888');
                this.techniques.switch.apply(panel, this);
            }
        }

        // LAST RESORT: If we still have plugs that weren't placed, add more panels
        let salt = 0;
        while (this.availablePlugs.length > 0 && salt < 5) {
            // console.log(`%c[Generator] Last Resort: Adding panel ${this.panels.length} for ${this.availablePlugs.length} remaining plug(s)`, 'color: #ff9900; font-weight: bold;');
            const panel = new GeneratedPanel(this.panels.length, this.panels.length + 1);
            this.currentPanelIndex = panel.index;

            // Place as many plugs as we can fit
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
                    this.setPlug(plug); // Put back
                }
            }

            // If we placed nothing, force a technique to make space or just stop
            if (this.availablePlugs.length === initialPlugCount) {
                // console.log(`%c[Generator] Last Resort: Could not place any plugs on new panel, stopping.`, 'color: #ff0000');
                break;
            }

            this.panels.push(panel);
            salt++;
        }

        // Final normalization of panel total counts
        this.panels.forEach(p => p.totalPanels = this.panels.length);
    }

    toString() {
        const message = VICTORY_MESSAGES[randBetween(0, VICTORY_MESSAGES.length - 1)];
        const reward = chooseReward();
        const panelsStr = this.panels.map(p => p.toString()).join('\n/\n');
        return `${message} [${reward}]\n/\n${panelsStr}`;
    }
};
