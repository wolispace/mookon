class GeneratedPanel {
    constructor(index, totalPanels) {
        this.index = index;
        this.totalPanels = totalPanels;
        this.color = COLOR_NAMES[randBetween(0, COLOR_NAMES.length - 1)];
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
            if (target !== '' && parseInt(target) > 0) return true;
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
            const { width, height } = parseSize(sizeStr);
            const elevation = locStr.includes('+') ? '+' : '-';
            const [xPart, yPart] = locStr.replace(/[+\-]/g, '').split('x');
            const x = parseFloat(xPart);
            const y = parseFloat(yPart);

            // Detect if element already has remote capabilities (for deduplication)
            const hasRemote = elementString.includes('remote') ||
                elementString.includes('tap state') ||
                (elementObj && (elementObj.hasRemoteControllers || elementObj.remoteId));

            this.coverableElements.push({
                id,
                elementString,
                width,
                height,
                x,
                y,
                elevation,
                hasRemote,
                type: id.charAt(0).toLowerCase()
            });
        }
    }


    addPlug(plug) {
        // Register the plug as coverable so it can be hidden on the new panel
        this.addElement(plug, true, 'Plug from previous panel');
    }

    addRemoteControllers(plug) {
        if (this.remoteSetsCount >= 2) return false; // Hard limit

        // Create T-shaped directional controllers (like WASD layout)
        // Layout:     U
        //           L S R
        //             D
        // Occupies a 3x3 area
        const controllerSize = 1;
        const controllerColor = randBetween(0, 6);

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

        // Try to find a position where the entire controller layout fits without overlapping
        const basePos = this.findControllerPosition(controllers, controllerSize);

        // If no valid position found, don't add controllers
        if (!basePos) return false;

        for (const [direction, offsetX, offsetY, action] of controllers) {
            const controller = new BuildElement('rectangle');
            controller.width = controllerSize;
            controller.height = controllerSize;
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

                const { width, height } = parseSize(sizeStr);
                // Switches are 1 unit wider
                let elementWidth = width;
                if (elementId.toLowerCase().startsWith('w')) {
                    elementWidth += 1;
                }

                const [xPart, yPart] = locStr.replace(/[+\-]/g, '').split('x');
                const elementX = Math.floor(parseFloat(xPart));
                const elementY = Math.floor(parseFloat(yPart));

                // Check for overlap: controller at (controllerX, controllerY) is 1x1
                // Element spans from (elementX, elementY) to (elementX + elementWidth, elementY + height)
                if (this.rectsOverlap(
                    controllerX, controllerY, controllerSize, controllerSize,
                    elementX, elementY, elementWidth, height
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
        // Limit total covers per panel to prevent overcrowding
        let coversAdded = 0;
        const MAX_COVERS = 4;

        // For each coverable element, decide randomly if it should be covered
        for (const element of this.coverableElements) {
            if (coversAdded >= MAX_COVERS) break;

            // Debug: force covers on all elements
            const shouldCover = DEBUG_CONFIG.enabled && DEBUG_CONFIG.forceCoversOnAllElements
                ? true
                : Math.random() > probability;

            if (!shouldCover) continue;

            // Decide covering style: 0=Physical Cover, 1=Group Obscure, 2=Remote-Only, 3=Switch Release
            // Limit Style 2 and 3 to panels that don't already have too many remotes
            // AND ensure the target element is raised ('+'). Sunken elements ('-') MUST NOT MOVE.
            // AND ensure the element doesn't already have remote capabilities.
            let maxStyle = 1;
            if (this.remoteSetsCount < 2 && element.elevation === '+' && !element.hasRemote) {
                maxStyle = 3;
            }

            let coverStyle;
            if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.forceCoverStyle !== undefined && DEBUG_CONFIG.forceCoverStyle !== null) {
                if (DEBUG_CONFIG.forceCoverStyle > maxStyle) {
                    // console.log(`%c[Debug] Capping forceCoverStyle from ${DEBUG_CONFIG.forceCoverStyle} to ${maxStyle} for element ${element.id} (elevation=${element.elevation}, hasRemote=${element.hasRemote}, remotes=${this.remoteSetsCount})`, 'color: #888');
                }
                coverStyle = Math.min(DEBUG_CONFIG.forceCoverStyle, maxStyle);
            } else {
                coverStyle = randBetween(0, maxStyle);
            }

            if (coverStyle === 0) {
                // Style 0: Physical Cover
                const shapes = ['rectangle', 'circle', 'screw'];
                const coverShape = shapes[randBetween(0, 2)];
                const cover = new BuildElement(coverShape);
                cover.width = element.width + randDecimal(0.4, 1.5);
                cover.height = element.height + randDecimal(0.4, 1.5);

                if (coverShape === 'screw') {
                    const size = Math.max(cover.width, cover.height);
                    cover.width = cover.height = size;
                }

                cover.setRandomColor();
                cover.elevation = '+';
                cover.x = element.x - 0.2;
                cover.y = element.y - 0.2;

                // Randomly choose movement type for cover
                let movementType;
                if (coverShape === 'screw') {
                    movementType = 'screw';
                } else {
                    const movementTypes = ['drag', 'tap', 'drag', 'tap', 'drag', 'tap'];
                    if (this.remoteSetsCount < 2) {
                        movementTypes.push('remote');
                    }
                    movementType = movementTypes[randBetween(0, movementTypes.length - 1)];
                }

                if (movementType === 'remote') {
                    if (panel && panel.addRemoteControllers(cover)) {
                        this.applyMovementToCover(cover, 'remote', element.id);
                        cover.clampToPanel();
                        this.addElement(cover, false, `Remote Cover for ${element.id}`);
                        coversAdded++;
                    } else {
                        // Fallback to drag if remote placement failed
                        this.applyMovementToCover(cover, 'drag', element.id);
                        cover.clampToPanel();
                        this.addElement(cover, false, `Cover for ${element.id} (remote failed)`);
                        coversAdded++;
                    }
                } else {
                    this.applyMovementToCover(cover, movementType, element.id);
                    cover.clampToPanel();
                    this.addElement(cover, false, `Cover for ${element.id}`);
                    coversAdded++;
                }
            } else if (coverStyle === 1) {
                // Style 1: Group Obscure
                let shapeName = SHAPE_PREFIX_MAP[element.type] || 'rectangle';
                if (shapeName === 'switch') shapeName = 'rectangle';

                if (element.type === 'w') {
                    // Switch cover
                    const cover = new BuildElement(shapeName);
                    cover.width = element.width + randDecimal(0.2, 0.8);
                    cover.height = element.height + randDecimal(0.2, 0.8);
                    cover.setRandomColor();
                    cover.elevation = '+';
                    cover.x = element.x - 0.1;
                    cover.y = element.y - 0.1;

                    const activeTypes = ['drag', 'tap'];
                    if (this.remoteSetsCount < 2) activeTypes.push('remote');
                    let movementType = shapeName === 'screw' ? 'screw' : activeTypes[randBetween(0, activeTypes.length - 1)];

                    if (movementType === 'remote') {
                        if (panel && panel.addRemoteControllers(cover)) {
                            this.applyMovementToCover(cover, 'remote', element.id);
                            cover.clampToPanel();
                            this.addElement(cover, false, `Remote Switch Cover for ${element.id}`);
                            coversAdded++;
                        } else {
                            this.applyMovementToCover(cover, 'drag', element.id);
                            cover.clampToPanel();
                            this.addElement(cover, false, `Switch Cover for ${element.id} (remote failed)`);
                            coversAdded++;
                        }
                    } else {
                        this.applyMovementToCover(cover, movementType, element.id);
                        cover.clampToPanel();
                        this.addElement(cover, false, `Switch Cover for ${element.id}`);
                        coversAdded++;
                    }
                } else {
                    // Group pattern for non-switches
                    const groupCols = randBetween(2, 3);
                    const groupRows = randBetween(1, 2);
                    const targetCol = randBetween(0, groupCols - 1);
                    const targetRow = randBetween(0, groupRows - 1);
                    const originX = element.x - (targetCol * element.width);
                    const originY = element.y - (targetRow * element.height);

                    for (let r = 0; r < groupRows; r++) {
                        for (let c = 0; c < groupCols; c++) {
                            if (r === targetRow && c === targetCol) continue;

                            const dx = originX + (c * element.width);
                            const dy = originY + (r * element.height);

                            if (dx >= 0 && dx + element.width <= 8 && dy >= 0 && dy + element.height <= 8) {
                                if (this.checkFree(dx, dy, element.width, element.height)) {
                                    const distractor = new BuildElement(shapeName);
                                    distractor.width = element.width;
                                    distractor.height = element.height;
                                    distractor.x = dx;
                                    distractor.y = dy;
                                    distractor.color = randBetween(0, 8);
                                    distractor.elevation = '+';
                                    distractor.method = 'drag';
                                    distractor.title = `Group distractor for ${element.id}`;
                                    this.addElement(distractor, false, `Group Distractor for ${element.id}`);
                                }
                            }
                        }
                    }
                    coversAdded++;
                }
            } else if (coverStyle === 2) {
                // Style 2: Remote-Only Element
                // Use ID-based matching for finding the element in this.elements
                const idx = this.elements.findIndex(e => e.split(/\s+/)[0] === element.id);
                if (idx !== -1 && ['c', 'r', 't', 's'].includes(element.type)) {
                    const tokens = element.elementString.split(/\s+/);
                    const modified = new BuildElement(SHAPE_PREFIX_MAP[element.type]);
                    modified.id = tokens[0];
                    modified.width = element.width;
                    modified.height = element.height;
                    modified.x = element.x;
                    modified.y = element.y;
                    modified.color = tokens[4]; // Use index 4 to stay before any method/target tokens
                    modified.elevation = element.elevation;
                    modified.method = 'none'; // No direct interaction initially
                    modified.title = `Remote-only ${element.id}`;
                    modified.context = `Modified ${element.id} to be remote-only`;

                    // Only apply modification if controllers are successfully added
                    if (panel && panel.addRemoteControllers(modified)) {
                        this.elements[idx] = modified.toString();
                        coversAdded++;
                    }
                }
            } else if (coverStyle === 3) {
                // Style 3: Switch Release
                const idx = this.elements.findIndex(e => e.split(/\s+/)[0] === element.id);
                if (idx !== -1 && ['c', 'r', 't', 's', 'w'].includes(element.type)) {
                    const tokens = element.elementString.split(/\s+/);
                    // Find space for the release switch before modifying the target
                    // Account for extra width: switches need swSize + 1 space for the ball
                    const swSize = 1;
                    const swPos = this.findFreeSpace(swSize + 1, 1);
                    if (swPos) {
                        const modified = new BuildElement(SHAPE_PREFIX_MAP[element.type] || 'circle');
                        modified.id = tokens[0];
                        modified.width = element.width;
                        modified.height = element.height;
                        modified.x = element.x;
                        modified.y = element.y;
                        modified.color = tokens[4]; // Use index 4 to stay before any method/target tokens
                        modified.elevation = element.elevation;
                        modified.method = 'none'; // Disabled initially
                        modified.context = `Released by switch`;

                        const sw = new BuildElement('switch');
                        sw.width = swSize;
                        sw.height = 1;
                        sw.x = swPos.x;
                        sw.y = swPos.y;

                        const ballColor = randBetween(1, 8);
                        const unsatisfiedPillColor = randBetween(1, 8);
                        let satisfiedPillColor = randBetween(1, 8);
                        while (satisfiedPillColor === unsatisfiedPillColor) {
                            satisfiedPillColor = randBetween(1, 8);
                        }
                        sw.color = `${unsatisfiedPillColor}-${satisfiedPillColor}-${ballColor}`;
                        sw.method = 'tap';
                        sw.change = 'state';
                        sw.targetState = 1;
                        sw.remoteActions = [{
                            id: modified.id,
                            type: 'configure',
                            method: 'drag',
                            change: 'none',
                            target: 0
                        }];

                        this.elements[idx] = modified.toString();
                        this.addElement(sw, false, `Release for ${modified.id}`);
                        coversAdded++;
                        this.remoteSetsCount++;
                    }
                }
            }
        }
    }
    applyMovementToCover(cover, movementType, elementId) {
        cover.title = `Cover for ${elementId} using ${movementType}`;
        switch (movementType) {
            case 'drag':
                cover.method = 'drag';
                cover.change = 'none';
                break;
            case 'tap':
                cover.method = 'tap';
                cover.change = 'color';
                cover.targetState = randBetween(0, 5);
                cover.remoteActions = [{
                    id: cover.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'none',
                    target: 0
                }];
                break;
            case 'screw':
                cover.method = 'hold';
                cover.change = 'rotate';
                cover.targetState = randBetween(1, 8);
                cover.remoteActions = [{
                    id: cover.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'none',
                    target: 0
                }];
                break;
            case 'remote':
                cover.method = 'none';
                cover.hasRemoteControllers = true;
                break;
        }
    }

    reserveGridSpace(elementString) {
        try {
            const tokens = elementString.split(/\s+/);
            const sizeStr = tokens[1];
            const locStr = tokens[2];

            let { width, height } = parseSize(sizeStr);
            if (tokens[0].toLowerCase().startsWith('w')) width += 1;

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

            const w = Math.ceil(width);
            const h = Math.ceil(height);

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

    findFreeSpace(w, h) {
        const width = Math.ceil(w);
        const height = Math.ceil(h);

        for (let attempt = 0; attempt < 20; attempt++) {
            const rx = randBetween(0, 8 - width);
            const ry = randBetween(0, 8 - height);
            if (this.checkFree(rx, ry, width, height)) {
                return { x: rx, y: ry };
            }
        }

        for (let y = 0; y <= PANEL_GRID_SIZE - height; y++) {
            for (let x = 0; x <= PANEL_GRID_SIZE - width; x++) {
                if (this.checkFree(x, y, width, height)) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    checkFree(x, y, w, h) {
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const endX = Math.ceil(x + w);
        const endY = Math.ceil(y + h);

        for (let iy = startY; iy < endY; iy++) {
            for (let ix = startX; ix < endX; ix++) {
                if (!this.grid[iy] || this.grid[iy][ix]) return false;
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
