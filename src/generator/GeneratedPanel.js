class GeneratedPanel {
    constructor(index, totalPanels, generator) {
        this.index = index;
        this.totalPanels = totalPanels;
        // 50% chance for panel background to be themed
        this.color = COLOR_NAMES[generator ? generator.getRandomColor(0.5) : randBetween(0, COLOR_NAMES.length - 1)];
        this.elements = [];
        this.coverableElements = []; // Track elements that can be covered
        this.remoteSetsCount = 0; // Track how many sets of WASD controllers we have
        this.grid = Array(8).fill().map(() => Array(8).fill(false));
    }

    hasActiveGoal() {
        // A panel has an active goal if any of its elements are unsatisfied
        // Since we are checking configuration strings, we use the BuildElement helper
        return this.elements.some(elementStr => {
            const tokens = elementStr.split(/\s+/);
            const id = tokens[0];
            const locStr = tokens[2];
            const colorStr = tokens[4];
            const method = tokens[5] || '';
            const change = tokens[6] || '';
            const target = tokens[7] || '';

            // Elevation
            const elevation = locStr.includes('+') ? '+' : '-';

            // Target State logic
            const targetVal = parseInt(target);
            if (target !== '' && targetVal > 0 && targetVal <= 8) return true;
            if (elevation === '-' && method !== '') return true;
            if (change === 'move') return true;

            return false;
        });
    }

    addElement(element, isCoverable = false, context = '') {
        // Support both BuildElement objects and strings (for legacy/maze walls)
        const elementString = typeof element === 'string' ? element : element.toString();
        const elementObj = typeof element === 'string' ? null : element;

        if (elementObj && context) {
            elementObj.context = context;
        }

        this.elements.push(elementString);
        this.reserveGridSpace(elementString);

        if (isCoverable) {
            const tokens = elementString.split(/\s+/);
            const id = tokens[0];
            const sizeStr = tokens[1];
            const locStr = tokens[2];
            const { gridWidth, gridHeight } = parseSize(sizeStr);
            const elevation = locStr.includes('+') ? '+' : '-';
            const [xPart, yPart] = locStr.replace(/[+\-]/g, '').split('x');
            const x = parseFloat(xPart);
            const y = parseFloat(yPart);

            // Detect if element already has remote capabilities (for deduplication)
            const hasRemote = elementString.includes('remote') ||
                elementString.includes('tap state') ||
                (elementObj && (elementObj.hasRemoteControllers || elementObj.remoteId));

            const targetState = elementObj ? elementObj.targetState : 0;

            this.coverableElements.push({
                id,
                elementString,
                gridWidth,
                gridHeight,
                x,
                y,
                elevation,
                hasRemote,
                targetState,
                type: id.charAt(0).toLowerCase()
            });
        }
    }


    addPlug(plug) {
        // Register the plug as coverable so it can be hidden on the new panel
        this.addElement(plug, true, 'Plug from previous panel');
    }

    addRemoteControllers(plug) {
        // console.log(`[REMOTE-CTRL] Looking for space for ${plug.id}`);

        if (this.remoteSetsCount >= 2) {
            // console.log(`[REMOTE-CTRL] Rejected: already have 2 remote sets`);
            return false;
        }

        // Create T-shaped directional controllers (like WASD layout)
        // Layout:     U
        //           L S R
        //             D
        // Occupies a 3x3 area
        const controllerSize = 1;
        const controllerColor = generator.getRandomColor(0.5);

        // Define T-shape positions: [direction, baseX_offset, baseY_offset, remoteAction]
        const controller1Sets = [
            [
                ['u', 1, 0, '0x-.5'],        // T Up: center-top
                ['l', 0, 1, '-.5x0'],        // Left: middle-left
                ['d', 1, 2, '0x.5'],          // Down: center-bottom
                ['r', 2, 1, '.5x0'],         // Right: middle-right
            ],
            [
                ['u', 1, 0, '0x-.5'],        // + Up: center-top
                ['l', 0, 1, '-.5x0'],        // Left: middle-left
                ['d', 1, 1, '0x.5'],          // Down: center-bottom
                ['r', 2, 1, '.5x0'],         // Right: middle-right
            ],
            [
                ['u', 1, 0, '0x-.5'],        // | Up: center-top
                ['l', 0, 1, '-.5x0'],        // Left: middle-left
                ['d', 1, 2, '0x.5'],          // Down: center-bottom
                ['r', 0, 3, '.5x0'],         // Right: middle-right
            ],
            [
                ['u', 0, 0, '0x-.5'],        // --- Up: center-top
                ['l', 1, 1, '-.5x0'],        // Left: middle-left
                ['d', 2, 0, '0x.5'],          // Down: center-bottom
                ['r', 3, 1, '.5x0'],         // Right: middle-right
            ]
        ];

        const controllers = controller1Sets[randBetween(0, controller1Sets.length - 1)];
        // console.log(`[REMOTE-CTRL] Grid state:`, this.grid.map((row, y) => `Row ${y}: ${row.map((v, x) => v ? 'X' : '.').join('')}`).join('\n'));

        // Try to find a position where the entire controller layout fits without overlapping
        const basePos = this.findControllerPosition(controllers, controllerSize);
        // console.log(`[REMOTE-CTRL] findControllerPosition returned:`, basePos);

        // If no valid position found, don't add controllers
        if (!basePos) return false;

        for (const [direction, offsetX, offsetY, action] of controllers) {
            const controller = new BuildElement('rectangle');
            controller.gridWidth = controllerSize;
            controller.gridHeight = controllerSize;
            controller.color = controllerColor;
            controller.elevation = '+';
            controller.method = 'tap';
            controller.remoteActions = [{
                id: plug.id,
                type: action.includes('x') ? 'move_step' : 'configure'
            }];

            if (controller.remoteActions[0].type === 'move_step') {
                const parts = action.split('x');
                controller.remoteActions[0].vector = { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
            } else {
                const parts = action.split(/\s+/);
                controller.remoteActions[0].method = parts[0];
                controller.remoteActions[0].change = parts[1] || 'none';
                controller.remoteActions[0].target = parseInt(parts[2]) || 0;
            }

            controller.title = `Remote for ${plug.id} (${direction})`;

            controller.x = basePos.x + offsetX;
            controller.y = basePos.y + offsetY;
            controller.context = `Controller for ${plug.id}`;

            // Reserve grid space for this controller
            this.addElement(controller);
        }
        this.remoteSetsCount++;
        return true;
    }

    addSizeController(plug) {
        // console.log(`[SIZE-CTRL] Looking for space for ${plug.id}`);
        // console.log(`[SIZE-CTRL] Grid state:`, this.grid.map((row, y) => `Row ${y}: ${row.map((v, x) => v ? 'X' : '.').join('')}`).join('\n'));

        const pos = this.findFreeSpace(1, 1, 'circle');
        // console.log(`[SIZE-CTRL] findFreeSpace returned:`, pos);

        if (!pos) return false;

        const controller = new BuildElement('circle');
        controller.gridWidth = controller.gridHeight = 1;
        controller.color = generator.getRandomColor(0.5);
        controller.elevation = '+';
        controller.method = 'tap';
        controller.remoteActions = [{
            id: plug.id,
            type: 'size'
        }];
        controller.x = pos.x;
        controller.y = pos.y;
        controller.title = `Size controller for ${plug.id}`;
        controller.context = `Size controller for ${plug.id}`;

        this.addElement(controller);
        return true;
    }

    findControllerPosition(controllers, controllerSize) {
        // Calculate the bounding box of the controller layout
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const [_, offsetX, offsetY] of controllers) {
            minX = Math.min(minX, offsetX);
            maxX = Math.max(maxX, offsetX + controllerSize);
            minY = Math.min(minY, offsetY);
            maxY = Math.max(maxY, offsetY + controllerSize);
        }

        const layoutWidth = Math.ceil(maxX - minX);
        const layoutHeight = Math.ceil(maxY - minY);

        // Try random positions first for performance
        for (let attempt = 0; attempt < 20; attempt++) {
            const baseX = randBetween(0, 8 - layoutWidth);
            const baseY = randBetween(0, 8 - layoutHeight);

            if (this.isControllerAreaFree(baseX, baseY, controllers, controllerSize)) {
                return { x: baseX, y: baseY };
            }
        }

        // Fallback to systematic search
        for (let baseY = 0; baseY <= 8 - layoutHeight; baseY++) {
            for (let baseX = 0; baseX <= 8 - layoutWidth; baseX++) {
                if (this.isControllerAreaFree(baseX, baseY, controllers, controllerSize)) {
                    return { x: baseX, y: baseY };
                }
            }
        }

        return null;
    }

    isControllerAreaFree(baseX, baseY, controllers, controllerSize) {
        // Check if all controller positions are free by checking against existing elements
        for (const [_, offsetX, offsetY] of controllers) {
            const controllerX = baseX + offsetX;
            const controllerY = baseY + offsetY;

            // Check against grid first
            if (!this.checkFree(controllerX, controllerY, controllerSize, controllerSize)) {
                return false;
            }

            // Also check directly against all existing elements to account for their actual dimensions
            for (const elementString of this.elements) {
                const tokens = elementString.split(/\s+/);
                if (tokens.length < 3) continue;

                const elementId = tokens[0];
                const sizeStr = tokens[1];
                const locStr = tokens[2];

                const { gridWidth, gridHeight } = parseSize(sizeStr);
                // Switches are 1 unit wider
                let elementWidth = gridWidth;
                if (elementId.toLowerCase().startsWith('w')) {
                    elementWidth += 1;
                }

                const [xPart, yPart] = locStr.replace(/[+\-]/g, '').split('x');
                const elementX = parseFloat(xPart);
                const elementY = parseFloat(yPart);

                // Use scaled dimensions for overlap check
                const shapeName = SHAPE_PREFIX_MAP[elementId[0].toLowerCase()] || 'circle';
                const scale = SHAPES[shapeName]?.scale || 1;
                const visualWidth = elementWidth * scale;
                const visualHeight = gridHeight * scale;

                // Check for overlap: controller at (controllerX, controllerY) is 1x1
                if (this.rectsOverlap(
                    controllerX, controllerY, controllerSize, controllerSize,
                    elementX, elementY, visualWidth, visualHeight
                )) {
                    return false;
                }
            }
        }
        return true;
    }

    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        // Check if two rectangles overlap
        const x1End = Math.ceil(x1 + w1);
        const y1End = Math.ceil(y1 + h1);
        const x2End = Math.ceil(x2 + w2);
        const y2End = Math.ceil(y2 + h2);

        return !(x1End <= x2 || x2End <= x1 || y1End <= y2 || y2End <= y1);
    }

    addCoverings(panel, generator, probability = 0.33) {
        if (!this.coverManager) {
            this.coverManager = new CoverManager();
        }
        this.coverManager.addCoverings(this, panel, generator, probability);
    }

    reserveGridSpace(elementString) {
        try {
            const tokens = elementString.split(/\s+/);
            const sizeStr = tokens[1];
            const locStr = tokens[2];

            let { gridWidth, gridHeight } = parseSize(sizeStr);
            if (tokens[0].toLowerCase().startsWith('w')) gridWidth += 1;

            // Remove elevation markers (+ or -) from location string
            const cleanLocStr = locStr.replace(/[+\-]/g, '');
            const parts = cleanLocStr.split('x');

            if (parts.length !== 2) {
                console.warn("Error parsing element for grid: Invalid location format:", elementString);
                return;
            }

            const xPart = parts[0];
            const yPart = parts[1];
            const x = Math.floor(parseFloat(xPart));
            const y = Math.floor(parseFloat(yPart));

            if (isNaN(x) || isNaN(y)) {
                console.warn("Error parsing element for grid: Invalid coordinates:", elementString);
                return;
            }

            // Factor in shape scale for grid reservation
            const shapeName = SHAPE_PREFIX_MAP[tokens[0][0].toLowerCase()] || 'circle';
            const scale = SHAPES[shapeName]?.scale || 1;
            const w = Math.ceil(gridWidth * scale);
            const h = Math.ceil(gridHeight * scale);

            for (let dy = 0; dy < h; dy++) {
                for (let dx = 0; dx < w; dx++) {
                    if (y + dy < 8 && x + dx < 8) {
                        this.grid[y + dy][x + dx] = true;
                    }
                }
            }
        } catch (e) {
            console.warn("Error parsing element for grid:", elementString, "Exception:", e.message);
        }
    }

    findFreeSpace(w, h, shape = 'circle') {
        const scale = SHAPES[shape]?.scale || 1;
        const width = w * scale;
        const height = h * scale;

        for (let attempt = 0; attempt < 20; attempt++) {
            const rx = randBetween(0, Math.floor(8 - width));
            const ry = randBetween(0, Math.floor(8 - height));
            if (this.checkFree(rx, ry, width, height)) {
                return { x: rx, y: ry };
            }
        }

        for (let y = 0; y <= 8 - Math.ceil(height); y++) {
            for (let x = 0; x <= 8 - Math.ceil(width); x++) {
                if (this.checkFree(x, y, width, height)) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    checkFree(x, y, w, h) {
        // Enforce panel boundaries strictly
        if (x < 0 || y < 0 || x + w > 8 || y + h > 8) return false;

        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const endX = Math.ceil(x + w);
        const endY = Math.ceil(y + h);

        for (let iy = startY; iy < endY; iy++) {
            for (let ix = startX; ix < endX; ix++) {
                if (this.grid[iy][ix]) return false;
            }
        }
        return true;
    }

    toString() {
        const sorted = [...this.elements].sort((a, b) => {
            const aRaised = a.includes('+');
            const bRaised = b.includes('+');
            return aRaised - bRaised;
        });
        return `${this.color}:\n${sorted.join(',\n')}`;
    }
};
