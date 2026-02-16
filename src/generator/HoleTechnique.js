// Holes have sockets (sunken shapes) and plugs (draggable shapes to fill them)
class HoleTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
        this.priority = 50;
    }
    apply(panel, generator) {
        const numHoles = randBetween(1, 3);
        let holesCreated = 0;

        for (let i = 0; i < numHoles; i++) {
            const shape = DRAGGABLE_SHAPES[randBetween(0, DRAGGABLE_SHAPES.length - 1)];
            const size = randBetween(1, 2);
            const color = randBetween(0, 6);

            // Find space for socket first
            const socketPos = panel.findFreeSpace(size, size, shape);
            if (!socketPos) continue; // Skip if no space for socket

            const isEasy = PUZZLE_CONFIG.DIFFICULTY === 1 || DEBUG_CONFIG.enabled;

            // In Easy mode, we MUST also have space for the plug on this same panel
            if (isEasy) {
                // Temporarily reserve socket space to check if plug also fits
                const tempHole = new BuildElement(shape);
                tempHole.gridWidth = tempHole.gridHeight = size;
                tempHole.x = socketPos.x;
                tempHole.y = socketPos.y;

                // We use reserveGridSpace then check then un-reserve (crude but effective)
                panel.reserveGridSpace(tempHole.toString());
                const plugPos = panel.findFreeSpace(size, size, shape);

                // Back out the reservation
                for (let dy = 0; dy < Math.ceil(size); dy++) {
                    for (let dx = 0; dx < Math.ceil(size); dx++) {
                        const iy = Math.floor(tempHole.y) + dy;
                        const ix = Math.floor(tempHole.x) + dx;
                        if (iy < 8 && ix < 8) panel.grid[iy][ix] = false;
                    }
                }

                if (!plugPos) continue; // No room for both on one panel
            }

            // Create socket (hole - sunken shape)
            const hole = new BuildElement(shape);
            hole.gridWidth = hole.gridHeight = size;
            hole.color = color;
            hole.elevation = '-';
            hole.elevationTarget = ''; // Target elevation to apply when dragged
            // Black (1) has a high chance of '='. Others are 50/50.
            const chanceOfStrict = (color === 1) ? 0.1 : 0.5;
            hole.method = Math.random() < chanceOfStrict ? '#' : '=';
            hole.x = socketPos.x;
            hole.y = socketPos.y;

            panel.addElement(hole, true, 'Hole Socket');
            holesCreated++;

            // Create corresponding plug (draggable shape)
            const plug = new BuildElement(shape);
            plug.gridWidth = plug.gridHeight = size;
            plug.color = color;
            plug.elevation = '+';

            plug.method = 'drag';
            plug.hasRemoteControllers = false;

            generator.setPlug(plug);
        }
    }
};
