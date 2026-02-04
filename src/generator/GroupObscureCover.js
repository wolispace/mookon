class GroupObscureCover extends Cover {
    apply(currentPanel, element, targetPanel, generator) {
        let shapeName = SHAPE_PREFIX_MAP[element.type] || 'rectangle';
        if (shapeName === 'switch') shapeName = 'rectangle';

        if (element.type === 'w') {
            // Switch cover
            const cover = new BuildElement(shapeName);
            cover.gridWidth = element.gridWidth + randDecimal(0.2, 0.8);
            cover.gridHeight = element.gridHeight + randDecimal(0.2, 0.8);
            cover.setRandomColor();
            cover.elevation = '+';
            cover.x = element.x - 0.1;
            cover.y = element.y - 0.1;

            const activeTypes = ['drag', 'tap'];
            if (currentPanel.remoteSetsCount < 2) activeTypes.push('remote');
            let movementType = shapeName === 'screw' ? 'screw' : activeTypes[randBetween(0, activeTypes.length - 1)];

            if (movementType === 'remote') {
                if (targetPanel && targetPanel.addRemoteControllers(cover)) {
                    this.applyMovementToCover(cover, 'remote', element.id);
                    cover.clampToPanel();
                    currentPanel.addElement(cover, false, `Remote Switch Cover for ${element.id}`);
                    return true;
                } else {
                    this.applyMovementToCover(cover, 'drag', element.id);
                    cover.clampToPanel();
                    currentPanel.addElement(cover, false, `Switch Cover for ${element.id} (remote failed)`);
                    return true;
                }
            } else {
                this.applyMovementToCover(cover, movementType, element.id);
                cover.clampToPanel();
                currentPanel.addElement(cover, false, `Switch Cover for ${element.id}`);
                return true;
            }
        } else {
            // Group pattern for non-switches
            const scale = SHAPES[shapeName]?.scale || 1;
            const groupCols = randBetween(2, 3);
            const groupRows = randBetween(1, 2);
            const targetCol = randBetween(0, groupCols - 1);
            const targetRow = randBetween(0, groupRows - 1);

            // Space distractors based on exact scaled dimensions for a seamless visual pattern
            const spacingX = element.gridWidth * scale;
            const spacingY = element.gridHeight * scale;

            const originX = element.x - (targetCol * spacingX);
            const originY = element.y - (targetRow * spacingY);

            let addedAtLeastOne = false;
            for (let r = 0; r < groupRows; r++) {
                for (let c = 0; c < groupCols; c++) {
                    if (r === targetRow && c === targetCol) continue;

                    const dx = originX + (c * spacingX);
                    const dy = originY + (r * spacingY);

                    const visualW = element.gridWidth * scale;
                    const visualH = element.gridHeight * scale;

                    if (dx >= 0 && dx + visualW <= 8 && dy >= 0 && dy + visualH <= 8) {
                        if (currentPanel.checkFree(dx, dy, visualW, visualH)) {
                            const distractor = new BuildElement(shapeName);
                            distractor.gridWidth = element.gridWidth;
                            distractor.gridHeight = element.gridHeight;
                            distractor.x = dx;
                            distractor.y = dy;
                            distractor.color = randBetween(0, 8);
                            distractor.elevation = '+';
                            distractor.method = 'drag';
                            distractor.title = `Group distractor for ${element.id}`;
                            currentPanel.addElement(distractor, false, `Group Distractor for ${element.id}`);
                            addedAtLeastOne = true;
                        }
                    }
                }
            }
            return addedAtLeastOne;
        }
    }
}
