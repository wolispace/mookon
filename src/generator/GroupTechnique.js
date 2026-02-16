class GroupTechnique {
    constructor() {
        this.hasPlugAndSocket = false;
        this.priority = 50;
    }
    apply(panel, generator) {
        // Try to get a plug to use as a template
        // Reject switches since they can't be moved to reveal things underneath
        let plug = generator.getPlug();
        if (plug && plug.type === 'w') {
            generator.setPlug(plug);
            plug = null;
        }

        const templateShape = plug ? SHAPE_PREFIX_MAP[plug.type] || 'rectangle' : DRAGGABLE_SHAPES[randBetween(0, DRAGGABLE_SHAPES.length - 1)];
        const templateWidth = plug ? plug.gridWidth : randDecimal(1, 2);
        const templateHeight = plug ? plug.gridHeight : randDecimal(1, 2);

        const keyColor = plug ? plug.color : randBetween(0, COLOR_ARRAY.length - 1);
        let baseColor = randBetween(0, COLOR_ARRAY.length - 1);
        while (baseColor === keyColor) {
            baseColor = randBetween(0, COLOR_ARRAY.length - 1);
        }

        const pendingPlugsCount = generator.availablePlugs.length;
        const greedinessReduction = pendingPlugsCount > 1 ? 2 : 0;

        // Calculate grid dimensions
        const maxCols = Math.max(2, Math.floor(PANEL_GRID_SIZE / templateWidth) - greedinessReduction);
        const maxRows = Math.max(2, Math.floor(PANEL_GRID_SIZE / templateHeight) - greedinessReduction);
        const cols = Math.min(randBetween(3, 5), maxCols);
        const rows = Math.min(randBetween(2, 4), maxRows);

        // Find space for the whole grid
        const gridWidth = cols * templateWidth;
        const gridHeight = rows * templateHeight;
        const gridPos = panel.findFreeSpace(gridWidth, gridHeight, templateShape);

        if (!gridPos) {
            // Fallback: if we had a plug, put it back or try to place it alone
            if (plug) generator.setPlug(plug);
            return;
        }

        // Patterns: 0=All, 1=Checkerboard, 2=Random
        const pattern = randBetween(0, 2);
        const candidates = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let keep = true;
                if (pattern === 1) keep = (r + c) % 2 === 0;
                else if (pattern === 2) keep = Math.random() < 0.7;

                if (keep) {
                    const el = new BuildElement(templateShape);
                    el.gridWidth = templateWidth;
                    el.gridHeight = templateHeight;
                    el.x = gridPos.x + c * templateWidth;
                    el.y = gridPos.y + r * templateHeight;
                    el.color = baseColor;
                    el.elevation = ''; // Start flat to avoid collisions/traps
                    el.elevationTarget = '+'; // Gain raised status when dragged
                    candidates.push(el);
                }
            }
        }

        if (candidates.length === 0) {
            if (plug) generator.setPlug(plug);
            return;
        }

        // Pick 1-2 key elements
        const numKeys = Math.min(candidates.length, randBetween(1, 2));
        const keyIndices = new Set();
        while (keyIndices.size < numKeys) {
            keyIndices.add(randBetween(0, candidates.length - 1));
        }

        candidates.forEach((el, index) => {
            if (keyIndices.has(index)) {
                el.method = 'tap';
                el.change = 'color';
                el.targetState = keyColor;
                el.remoteActions = [{
                    id: el.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'move',
                    target: 1
                }];
            } else {
                el.method = 'none';
            }
            panel.addElement(el, false, 'Group Element');
        });
    }
};
