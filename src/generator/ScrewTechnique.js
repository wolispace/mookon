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

            const pos = panel.findFreeSpace(screwSize, screwSize);
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
            if (holeSize >= 1) {
                // If it's a plug/socket pair, force '=' method
                if (randBetween(1, 3) === 1 || generator.isFinalPanel()) {
                    hole.method = '=';

                    const plug = new BuildElement('circle');
                    plug.setSize(holeSize);
                    plug.color = 2; // blue plug
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
}
