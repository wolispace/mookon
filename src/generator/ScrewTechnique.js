class ScrewTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
    }
    apply(panel, generator) {
        const numScrews = randBetween(1, 3);
        let elementsAdded = 0;

        for (let i = 0; i < numScrews; i++) {
            const screw = new BuildElement('screw');
            const hole = new BuildElement('circle');

            const screwSize = randBetween(1, 3);
            const holeSize = screwSize / 2;

            const pos = panel.findFreeSpace(screwSize, screwSize, 'screw');
            if (!pos) continue;

            screw.x = pos.x;
            screw.y = pos.y;
            screw.setSize(screwSize);
            screw.setRandomColor();
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


            // Ensure the hole becomes a socket if it's meant to be interactable
            // No interactable elements (sockets/plugs) should be smaller than 1x1
            if (holeSize >= 1.0) {
                // If it's a plug/socket pair, force matching method
                if (randBetween(1, 3) === 1 || generator.isFinalPanel()) {
                    const chanceOfStrict = (hole.color === 1) ? 0.1 : 0.5;
                    hole.method = Math.random() < chanceOfStrict ? '#' : '=';

                    const plug = new BuildElement('circle');
                    plug.setSize(holeSize);
                    // Match socket color if strict matching is used, otherwise the usual blue
                    plug.color = (hole.method === '#') ? hole.color : 2;
                    plug.elevation = '+';

                    // Randomly decide: drag method or remote controllers
                    const useRemoteControllers = randBetween(1, 3) === 1;
                    if (useRemoteControllers) {
                        plug.method = 'none';
                        plug.hasRemoteControllers = true;
                    } else {
                        plug.method = 'drag';
                    }

                    generator.setPlug(plug);
                }
            }

            // Element addition
            panel.addElement(hole, true, 'Screw Hole');
            panel.addElement(screw, true, 'Screw');
            elementsAdded++;
        }
    }
};
