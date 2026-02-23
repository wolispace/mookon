// SwitchPatternTechnique: A set of switches with hidden targets + a master switch
// The master switch can only be satisfied when ALL linked switches are at their target states.
class SwitchPatternTechnique {
    constructor() {
        this.hasPlugAndSocket = false;
        this.priority = 50;
    }

    apply(panel, generator) {
        const numSwitches = randBetween(2, 4);

        // Pick a strategy for target states
        const strategies = ['identical', 'increasing', 'decreasing', 'theme'];
        const strategy = strategies[randBetween(0, strategies.length - 1)];

        const themeColor = generator.significantColor;

        // Determine base target state for the strategy
        let baseTarget;
        if (strategy === 'theme') {
            baseTarget = themeColor;
        } else {
            baseTarget = randBetween(1, 4); // Keep targets modest so switches aren't too wide
        }

        // Build switch configs
        const switchConfigs = [];
        for (let i = 0; i < numSwitches; i++) {
            let targetState;
            if (strategy === 'identical' || strategy === 'theme') {
                targetState = baseTarget;
            } else if (strategy === 'increasing') {
                targetState = baseTarget + i;
            } else { // decreasing
                targetState = Math.max(1, baseTarget - i);
            }

            // Width must accommodate the target state
            const minWidth = targetState + 1; // need at least target+1 positions (0..target)
            const width = randBetween(minWidth, Math.min(minWidth + 2, 5));

            switchConfigs.push({ targetState, width });
        }

        // Need room for all switches + the master switch
        const maxWidth = switchConfigs.reduce((m, c) => Math.max(m, c.width), 1);
        const totalHeight = numSwitches + 1; // +1 for master switch

        const stackPos = panel.findFreeSpace(maxWidth + 1, totalHeight, 'switch'); // +1 for switch visual overflow
        if (!stackPos) return;

        const startX = stackPos.x;
        const startY = stackPos.y;

        // Consistent colors
        const ballColor = generator.getRandomColor(0.5);

        // Create each linked switch
        const switchIds = [];
        for (let i = 0; i < numSwitches; i++) {
            const { targetState, width } = switchConfigs[i];

            const sw = new BuildElement('switch');
            sw.gridWidth = width;
            sw.gridHeight = 1;
            sw.x = startX;
            sw.y = startY + i;

            // x-<targetState>-<ballColor> triggers color-cycling mode
            sw.color = `x-${targetState}-${ballColor}`;
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
    }
}
