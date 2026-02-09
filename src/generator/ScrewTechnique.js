class ScrewTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
    }
    apply(panel, generator) {
        // Decide whether to use a pattern or random placement
        const usePattern = randBetween(1, 10) <= 8; // 80% chance of a pattern
        const patterns = ['corners_4', 'corners_2_side', 'corners_2_diag'];
        const selectedPattern = usePattern ? patterns[randBetween(0, patterns.length - 1)] : 'random';

        const screwSize = randBetween(1, 2); // Favoring 1x1 or 2x2 screws for patterns
        const colorIndex = (randBetween(1, 10) <= 7) ? 0 : randBetween(0, COLOR_ARRAY.length - 1); // 70% chance of Grey 0

        let screwPositions = [];
        if (selectedPattern === 'corners_4') {
            screwPositions = [
                { x: 0, y: 0 },
                { x: 8 - screwSize, y: 0 },
                { x: 0, y: 8 - screwSize },
                { x: 8 - screwSize, y: 8 - screwSize }
            ];
        } else if (selectedPattern === 'corners_2_side') {
            const side = randBetween(0, 3); // 0: Top, 1: Bottom, 2: Left, 3: Right
            if (side === 0) screwPositions = [{ x: 0, y: 0 }, { x: 8 - screwSize, y: 0 }];
            else if (side === 1) screwPositions = [{ x: 0, y: 8 - screwSize }, { x: 8 - screwSize, y: 8 - screwSize }];
            else if (side === 2) screwPositions = [{ x: 0, y: 0 }, { x: 0, y: 8 - screwSize }];
            else if (side === 3) screwPositions = [{ x: 8 - screwSize, y: 0 }, { x: 8 - screwSize, y: 8 - screwSize }];
        } else if (selectedPattern === 'corners_2_diag') {
            const diag = randBetween(0, 1);
            if (diag === 0) screwPositions = [{ x: 0, y: 0 }, { x: 8 - screwSize, y: 8 - screwSize }];
            else screwPositions = [{ x: 8 - screwSize, y: 0 }, { x: 0, y: 8 - screwSize }];
        } else {
            // Random placement logic (fallback or deliberate random)
            const numScrews = randBetween(2, 4);
            for (let i = 0; i < numScrews; i++) {
                const pos = panel.findFreeSpace(screwSize, screwSize, 'screw');
                if (pos) screwPositions.push(pos);
            }
        }

        screwPositions.forEach(pos => {
            if (!panel.checkFree(pos.x, pos.y, screwSize, screwSize)) return;

            const screw = new BuildElement('screw');
            const hole = new BuildElement('circle');

            const holeSize = screwSize / 2;

            screw.x = pos.x;
            screw.y = pos.y;
            screw.setSize(screwSize);
            screw.color = colorIndex;
            screw.method = 'hold';
            screw.change = 'rotate';
            screw.targetState = 3;
            screw.remoteActions = [{
                id: screw.id,
                type: 'configure',
                method: 'drag',
                change: 'move',
                target: 1
            }];
            screw.elevation = '+';

            hole.setSize(holeSize);
            hole.color = 1; // whiteish-grey for hole
            hole.elevation = '-';
            hole.x = screw.x + (screwSize - holeSize) / 2;
            hole.y = screw.y + (screwSize - holeSize) / 2;

            if (holeSize >= 1.0) {
                if (randBetween(1, 3) === 1 || generator.isFinalPanel()) {
                    const isEasy = PUZZLE_CONFIG.DIFFICULTY === 1 || DEBUG_CONFIG.enabled;

                    if (isEasy) {
                        // In Easy mode, only add a plug if there's room on this panel
                        const plugPos = panel.findFreeSpace(holeSize, holeSize, 'circle');
                        if (!plugPos) {
                            // Don't add a plug requirement if it won't fit
                            panel.addElement(hole, true, 'Screw Hole (Empty)');
                            panel.addElement(screw, true, 'Screw');
                            return;
                        }
                    }

                    const chanceOfStrict = (hole.color === 1) ? 0.1 : 0.5;
                    hole.method = Math.random() < chanceOfStrict ? '#' : '=';

                    const plug = new BuildElement('circle');
                    plug.setSize(holeSize);
                    plug.color = (hole.method === '#') ? hole.color : 2;
                    plug.elevation = '+';

                    plug.method = 'drag';
                    generator.setPlug(plug);
                }
            }

            panel.addElement(hole, true, 'Screw Hole');
            panel.addElement(screw, true, 'Screw');
        });
    }
};
