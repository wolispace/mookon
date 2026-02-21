// Semicircle sockets require two matching semicircle plugs to be satisfied
class SemicircleTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
        this.priority = 40;
    }

    apply(panel, generator) {
        // Choose size for the circle socket (must fit on panel)
        const size = randBetween(1, 2);
        const color = generator.getRandomColor(0.5);

        // Find space for the circle socket
        const socketPos = panel.findFreeSpace(size, size, 'circle');
        if (!socketPos) return;

        // Choose bipartite type: c (X), u (Y)
        // Upper case versions imply strict color matching
        const types = [
            COMPARISON_BIPARTITE_X,
            COMPARISON_BIPARTITE_Y,
            COMPARISON_BIPARTITE_X_STRICT,
            COMPARISON_BIPARTITE_Y_STRICT
        ];
        const typeSelect = randBetween(0, types.length - 1);
        const type = types[typeSelect];

        // Create the socket
        const socket = new BuildElement('circle');
        socket.gridWidth = socket.gridHeight = size;
        socket.color = color;
        socket.elevation = '-';
        socket.method = type; // The comparison method/type
        socket.x = socketPos.x;
        socket.y = socketPos.y;
        socket.title = `Semicircle Socket (${type})`;
        socket.context = 'Semicircle Technique';

        panel.addElement(socket, true, 'Semicircle Socket');

        // Create the two semicircle plugs
        let shape1, shape2;
        if (type === COMPARISON_BIPARTITE_X || type === COMPARISON_BIPARTITE_X_STRICT) {
            shape1 = 'semicircle_left';
            shape2 = 'semicircle_right';
        } else {
            shape1 = 'semicircle_down';
            shape2 = 'semicircle_up';
        }

        const plugs = [new BuildElement(shape1), new BuildElement(shape2)];
        const isStrict = (type === COMPARISON_BIPARTITE_X_STRICT || type === COMPARISON_BIPARTITE_Y_STRICT);

        plugs.forEach(plug => {
            // Semicircles are half-size in one dimension
            if (plug.type === 'q' || plug.type === 'p') {
                plug.gridWidth = size / 2;
                plug.gridHeight = size;
            } else if (plug.type === 'u' || plug.type === 'n') {
                plug.gridWidth = size;
                plug.gridHeight = size / 2;
            } else {
                plug.gridWidth = plug.gridHeight = size;
            }

            // If type is strict, plugs MUST match socket color
            // If not, we still favor the socket color (70% chance) but allow random variants
            plug.color = isStrict ? color : (Math.random() < 0.7 ? color : generator.getRandomColor(0.5));
            plug.elevation = '+';
            plug.method = 'drag';
            plug.title = `${plug.type} piece for ${socket.id}`;
            plug.context = 'Semicircle Technique';
            generator.setPlug(plug);
        });
    }
}
