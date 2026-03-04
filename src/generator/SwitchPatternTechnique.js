// SwitchPatternTechnique: A set of switches with hidden targets + a master switch
// The master switch can only be satisfied when ALL linked switches are at their target states.
class SwitchPatternTechnique {
    constructor() {
        this.hasPlugAndSocket = false;
        this.priority = 50;
    }

    apply(panel, generator) {
        let numSwitches = randBetween(2, 4);

        // Pick a strategy for target states
        const strategies = ['identical', 'increasing', 'decreasing', 'theme'];
        const strategy = strategies[randBetween(0, strategies.length - 1)];

        const themeColor = generator.significantColor;

        // Determine base target state for the strategy
        let baseTarget;
        if (strategy === 'theme') {
            baseTarget = themeColor;
        } else {
            baseTarget = numSwitches;
        }

        // Pick a hint strategy to give the player a clue about the target state
        // switch_count only works for identical/theme where all targets are the same
        const isUniformTarget = (strategy === 'identical' || strategy === 'theme');
        let hintStrategies = ['ball_color', 'hint_dots', 'panel_color'];
        if (isUniformTarget) {
            hintStrategies.push('switch_count');
        }
        const hintStrategy = hintStrategies[randBetween(0, hintStrategies.length - 1)];

        // Apply switch_count hint: force numSwitches to equal baseTarget
        if (hintStrategy === 'switch_count' && isUniformTarget) {
            numSwitches = Math.max(2, Math.min(baseTarget, 4));
            if (strategy !== 'theme') {
                baseTarget = numSwitches; // keep in sync for identical
            }
        }

        // Determine ball color: use target color for ball_color hint, random otherwise
        const ballColor = (hintStrategy === 'ball_color') ? themeColor : generator.getRandomColor(0.5);

        // Apply panel_color hint: set panel background to target color
        if (hintStrategy === 'panel_color') {
            panel.color = COLOR_NAMES[themeColor];
        }

        // Build switch configs (max switch width is 6)
        const MAX_SWITCH_WIDTH = 6;
        const switchConfigs = [];
        for (let i = 0; i < numSwitches; i++) {
            let targetState;
            if (strategy === 'identical' || strategy === 'theme') {
                targetState = Math.min(baseTarget, MAX_SWITCH_WIDTH);
            } else if (strategy === 'increasing') {
                targetState = Math.min(baseTarget + i, MAX_SWITCH_WIDTH);
            } else { // decreasing
                targetState = Math.max(1, baseTarget - i);
            }

            // Width must accommodate the target state
            const minWidth = targetState; // need at least target+1 positions (0..target)
            const width = randBetween(minWidth, Math.min(minWidth + 1, MAX_SWITCH_WIDTH));

            switchConfigs.push({ targetState, width });
        }

        // Need room for all switches + the master switch
        const maxWidth = switchConfigs.reduce((m, c) => Math.max(m, c.width), 1);
        const totalHeight = numSwitches + 1; // +1 for master switch

        const stackPos = panel.findFreeSpace(maxWidth + 1, totalHeight, 'switch'); // +1 for switch visual overflow
        if (!stackPos) return;

        const startX = stackPos.x;
        const startY = stackPos.y;

        // Create each linked switch
        const switchIds = [];
        for (let i = 0; i < numSwitches; i++) {
            const { targetState, width } = switchConfigs[i];

            const sw = new BuildElement('switch');
            sw.gridWidth = width;
            sw.gridHeight = 1;
            sw.x = startX;
            sw.y = startY + i;

            // x-<targetColor>-<ballColor> triggers color-cycling mode
            sw.color = `x-${themeColor}-${ballColor}`;
            sw.method = 'tap';
            sw.change = 'state';
            sw.targetState = targetState;
            sw.remoteActions = [];
            sw.title = `Linked Switch ${sw.id}`;
            sw.context = 'Switch_Pattern_Technique';

            switchIds.push(sw.id);
            panel.addElement(sw, true, 'Pattern Switch');
        }

        // Create master switch
        const master = new BuildElement('master_switch');
        master.gridWidth = 1;
        master.gridHeight = 1;
        master.x = startX;
        master.y = startY + numSwitches;

        // Use a distinct color pair: unsatisfied-satisfied-ball
        let unsatisfiedColor = generator.getRandomColor(0.5);
        let satisfiedColor = generator.getRandomColor(0.5);
        while (satisfiedColor === unsatisfiedColor) {
            satisfiedColor = generator.getRandomColor(0.5);
        }
        master.color = `${unsatisfiedColor}-${satisfiedColor}-${ballColor}`;
        master.method = 'tap';
        master.change = 'state';
        master.targetState = 1;
        master.linkedSwitches = switchIds; // Stored for toString serialization
        master.remoteActions = [];
        master.title = `Master Switch ${master.id}`;
        master.context = 'Switch_Pattern_Technique';

        panel.addElement(master, true, 'Master Switch');

        // Apply hint_dots: place decorative circles in the target color as a count clue
        if (hintStrategy === 'hint_dots') {
            const dotCount = baseTarget;
            for (let d = 0; d < dotCount; d++) {
                const dot = new BuildElement('circle');
                dot.gridWidth = 1;
                dot.gridHeight = 1;
                dot.color = themeColor;
                dot.method = '';
                dot.change = '';
                dot.targetState = 0;
                dot.remoteActions = [];
                dot.elevation = '+';
                dot.context = 'Switch_Pattern_Hint';

                const dotPos = panel.findFreeSpace(1, 1, 'circle');
                if (dotPos) {
                    dot.x = dotPos.x;
                    dot.y = dotPos.y;
                    panel.addElement(dot, false, 'Hint Dot');
                }
            }
        }
    }
}
