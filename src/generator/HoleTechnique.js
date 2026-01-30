// Holes have sockets (sunken shapes) and plugs (draggable shapes to fill them)
class HoleTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
    }
    apply(panel, generator) {
        const numHoles = randBetween(1, 3);
        let holesCreated = 0;

        for (let i = 0; i < numHoles; i++) {
            const shape = DRAGGABLE_SHAPES[randBetween(0, DRAGGABLE_SHAPES.length - 1)];
            const size = randBetween(1, 2);
            const color = randBetween(0, 6);

            // Find space for socket first
            const socketPos = panel.findFreeSpace(size, size);
            if (!socketPos) continue; // Skip if no space for socket

            // Create socket (hole - sunken shape) only if we have space
            const hole = new BuildElement(shape);
            hole.width = hole.height = size;
            hole.color = color;
            hole.elevation = '-';
            hole.elevationTarget = ''; // Target elevation to apply when dragged
            hole.method = '='; // ALWAYS set method to '=' for HoleTechnique to ensure it's a socket
            hole.x = socketPos.x;
            hole.y = socketPos.y;

            panel.addElement(hole, true, 'Hole Socket');
            holesCreated++;

            // Create corresponding plug (draggable shape)
            const plug = new BuildElement(shape);
            plug.width = plug.height = size;
            plug.color = color;
            plug.elevation = '+';

            // Randomly decide: drag method or remote controllers
            const useRemoteControllers = randBetween(1, 5) === 1;
            if (useRemoteControllers) {
                // Don't set a method - it will have remote controllers instead
                plug.method = 'none';
                plug.hasRemoteControllers = true;
            } else {
                plug.method = 'drag';
                plug.hasRemoteControllers = false;
            }

            generator.setPlug(plug);
        }
    }
};
