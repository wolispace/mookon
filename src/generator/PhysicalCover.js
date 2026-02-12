class PhysicalCover extends Cover {
    apply(currentPanel, element, targetPanel, generator) {
        const coverShape = DRAGGABLE_SHAPES[randBetween(0, DRAGGABLE_SHAPES.length - 1)];
        const cover = new BuildElement(coverShape);
        const targetScale = SHAPES[SHAPE_PREFIX_MAP[element.type]]?.scale || 1;
        const coverScale = SHAPES[coverShape]?.scale || 1;

        // Ensure cover is visualy larger than target.
        // We calculate unscaled size needed to achieve covering visualy.
        const w = (element.gridWidth * targetScale / coverScale) + randDecimal(0.5, 1.0);
        const h = (element.gridHeight * targetScale / coverScale) + randDecimal(0.5, 1.0);

        // Enforce minimum interaction size as per user request (1.0)
        cover.gridWidth = Math.max(1.0, w);
        cover.gridHeight = Math.max(1.0, h);

        if (coverShape === 'screw') {
            const size = Math.max(cover.gridWidth, cover.gridHeight);
            cover.gridWidth = cover.gridHeight = size;
        }

        cover.color = randBetween(0, COLOR_NAMES.length - 1);
        cover.elevation = '+';
        // Center visually
        cover.x = element.x - (cover.gridWidth * coverScale - element.gridWidth * targetScale) / 2;
        cover.y = element.y - (cover.gridHeight * coverScale - element.gridHeight * targetScale) / 2;
        cover.clampToPanel();

        // Randomly choose movement type for cover
        let movementType;
        if (coverShape === 'screw') {
            movementType = 'screw';
        } else {
            const movementTypes = ['drag', 'tap', 'drag', 'tap', 'drag', 'tap'];
            if (currentPanel.remoteSetsCount < 2) {
                movementTypes.push('remote');
            }
            movementType = movementTypes[randBetween(0, movementTypes.length - 1)];
        }

        if (movementType === 'remote') {
            if (targetPanel && targetPanel.addRemoteControllers(cover)) {
                this.applyMovementToCover(cover, 'remote', element.id);
                cover.clampToPanel();
                currentPanel.addElement(cover, false, `Remote Cover for ${element.id}`);
                return true;
            } else {
                // Fallback to drag if remote placement failed
                this.applyMovementToCover(cover, 'drag', element.id);
                cover.clampToPanel();
                currentPanel.addElement(cover, false, `Cover for ${element.id} (remote failed)`);
                return true;
            }
        } else {
            this.applyMovementToCover(cover, movementType, element.id);
            cover.clampToPanel();
            currentPanel.addElement(cover, false, `Cover for ${element.id}`);
            return true;
        }
    }
}
