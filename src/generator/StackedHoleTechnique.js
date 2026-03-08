class StackedHoleTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
        this.priority = 60;
        this.minDifficulty = 2; // Medium and Hard only
    }

    apply(panel, generator) {
        // Find a shape for the stacked hole
        const shapes = ['circle', 'rectangle', 'triangle', 'plus', 'diamond'];
        const shape = shapes[randBetween(0, shapes.length - 1)];

        // Sequence of 2-3 colors
        const sequenceLength = randBetween(2, 3);
        const colorSequence = [];
        for (let i = 0; i < sequenceLength; i++) {
            colorSequence.push(generator.getRandomColor(0.2));
        }

        // The socket initially shows the first color in the sequence
        const initialColor = colorSequence[0];

        // Find space for the socket
        const socketSize = 2; // Stacked holes should be significant
        const pos = panel.findFreeSpace(socketSize, socketSize, shape);
        if (!pos) return;

        // Create the socket element
        const socket = new BuildElement(shape);
        socket.x = pos.x;
        socket.y = pos.y;
        socket.gridWidth = socketSize;
        socket.gridHeight = socketSize;
        socket.color = initialColor;
        socket.elevation = '-';
        socket.method = ''; // Parser will infer strict matching from the '#' sequence marker
        socket.sizeComparison = '#';

        // Add the color sequence data for the parser
        // Format: # c1 c2 c3
        socket.stackedColors = colorSequence;

        socket.title = `Stacked ${shape} Socket`;
        socket.context = 'Stacked_Hole_Technique';

        panel.addElement(socket, false, 'Stacked Socket');

        // Create the plugs for each stage of the sequence
        for (let i = 0; i < sequenceLength; i++) {
            const plug = new BuildElement(shape);
            plug.gridWidth = socketSize;
            plug.gridHeight = socketSize;
            plug.color = colorSequence[i];
            plug.method = 'drag';
            plug.title = `Sequence Plug ${i + 1}`;
            plug.context = 'Stacked_Hole_Technique';

            // Placed on the same panel or a future one
            // First plug is often same panel, later ones are likely future
            if (i === 0 || Math.random() < 0.3) {
                // Try to place on same panel
                const plugPos = panel.findFreeSpace(socketSize, socketSize, shape);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;
                    panel.addPlug(plug);
                    plug.placed = true;
                } else {
                    generator.setPlug(plug);
                }
            } else {
                generator.setPlug(plug);
            }
        }
    }
}
