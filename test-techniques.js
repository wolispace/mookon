// Test: Generate one panel per technique with one random cover per panel

function generateTechniqueTest() {
    const generator = new PuzzleGenerator();
    
    // Fixed order: techniques that create holes/plugs first
    const techniqueOrder = ['hole', 'screw', 'group', 'maze', 'switch'];
    // Fixed order: Physical for switch, Remote for maze
    const coverOrder = [4, 4, 4, 2, 0]; // SizeObscure for hole/screw/group, Remote for maze, Physical for switch
    
    elementIdCounter = 1;
    generator.availablePlugs = [];
    generator.panels = [];
    
    techniqueOrder.forEach((techName, index) => {
        const panel = new GeneratedPanel(index, techniqueOrder.length);
        generator.currentPanelIndex = index;
        
        // Apply the technique
        const technique = generator.techniques[techName];
        if (!technique) {
            console.error(`Technique '${techName}' not found!`);
            console.log('Available techniques:', Object.keys(generator.techniques));
            return;
        }
        technique.apply(panel, generator);
        
        // Place any plugs generated on the same panel
        while (generator.availablePlugs.length > 0) {
            const plug = generator.getPlug();
            if (!plug) break;
            const shape = SHAPE_PREFIX_MAP[plug.type] || 'circle';
            const plugPos = panel.findFreeSpace(plug.gridWidth, plug.gridHeight, shape);
            if (plugPos) {
                plug.x = plugPos.x;
                plug.y = plugPos.y;
                panel.addPlug(plug);
            }
        }
        
        // Add one cover using fixed order
        if (panel.coverableElements.length > 0) {
            const coverStyle = coverOrder[index];
            const elementIndex = randBetween(0, panel.coverableElements.length - 1);
            const element = panel.coverableElements[elementIndex];
            
            console.log(`Panel ${index} (${techName}):`);
            console.log('  Covering element:', element.elementString);
            console.log('  Cover type:', coverStyle, '-', ['Physical', 'GroupObscure', 'RemoteOnly', 'SwitchRelease', 'SizeObscure', 'Reset'][coverStyle]);
            console.log('  Panel has', panel.elements.length, 'elements,', panel.coverableElements.length, 'coverable');
            
            const coverManager = new CoverManager();
            const style = coverManager.styles[coverStyle];
            if (style) {
                const success = style.apply(panel, element, panel, generator);
                console.log('  Cover applied:', success);
                if (!success && coverStyle === 4) {
                    console.log('  SizeObscure failed - likely no space for controller');
                }
            }
        }
        
        generator.panels.push(panel);
    });
    
    return generator.toString();
}

// Initialize game with test puzzle
function initTest() {
    const testPuzzle = generateTechniqueTest();
    console.log('Generated test puzzle:', testPuzzle);
    
    if (currentGame) {
        currentGame.destroy();
    }
    
    currentGame = new Game(testPuzzle);
}

// Reload button handler
document.getElementById('reload-button').addEventListener('click', () => {
    initTest();
});

// Start test on load
initTest();
