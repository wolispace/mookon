// Switches are self-contained (no plugs/sockets)
class SwitchTechnique {
    constructor() {
        this.hasPlugAndSocket = false;
        this.priority = 50;
    }
    apply(panel, generator) {
        const baseColor = generator.getRandomColor(0.5);
        const numSwitches = randBetween(1, 4);

        // generate sizes first to determine valid X range
        const switchConfigs = [];
        let maxSwitchSize = 1;
        for (let i = 0; i < numSwitches; i++) {
            const size = randBetween(1, 5);
            if (size > maxSwitchSize) maxSwitchSize = size;
            switchConfigs.push({
                size,
                targetState: randBetween(1, size)
            });
        }

        // Find space for the entire vertical stack
        const stackWidth = maxSwitchSize + 1; // Switches are 1 unit wider visually
        const stackHeight = numSwitches;
        const stackPos = panel.findFreeSpace(stackWidth, stackHeight, 'switch');

        if (!stackPos) return;

        const startX = stackPos.x;
        const startY = stackPos.y;

        // Consistent colors for the entire set of switches
        const setBallColor = generator.getRandomColor(0.5); // All switches use the same ball color
        const setUnsatisfiedColor = baseColor; // Base unsatisfied color
        let setSatisfiedColor = baseColor; // Satisfied color must differ from unsatisfied
        while (setSatisfiedColor === setUnsatisfiedColor) {
            setSatisfiedColor = generator.getRandomColor(0.5);
        }

        // Randomly decide if all switches get same unsatisfied background or random ones
        const uniformUnsatisfied = randBetween(0, 1) === 0; // 50% chance

        // Track switches for selective covering
        const switchElements = [];

        for (let i = 0; i < numSwitches; i++) {
            const { size, targetState } = switchConfigs[i];
            const sw = new BuildElement('switch');
            sw.gridWidth = size;
            sw.gridHeight = 1;
            sw.x = startX;
            sw.y = startY + i; // Vertical stack

            // Create three colors: ballColor-unsatisfiedPillColor-satisfiedPillColor
            // Ball: consistent across set
            const ballColor = setBallColor;

            // Unsatisfied background: either uniform or random per switch
            let unsatisfiedPillColor;
            if (uniformUnsatisfied) {
                unsatisfiedPillColor = setUnsatisfiedColor;
            } else {
                // Random color but ensure it's different from satisfied color
                unsatisfiedPillColor = generator.getRandomColor(0.5);
                while (unsatisfiedPillColor === setSatisfiedColor) {
                    unsatisfiedPillColor = generator.getRandomColor(0.5);
                }
            }

            // Satisfied background: consistent across set
            const satisfiedPillColor = setSatisfiedColor;

            sw.color = `${unsatisfiedPillColor}-${satisfiedPillColor}-${ballColor}`;
            sw.method = 'tap';
            sw.change = 'state';
            sw.targetState = targetState;
            sw.remoteActions = [];
            switchElements.push(sw);
            panel.addElement(sw, true, 'Switch');
        }

        // Randomly decide if each switch in the set should be covered
        for (const sw of switchElements) {
            if (randBetween(0, 1) === 0) {
                generator.setPlug(sw);
            }
        }
    }
};
