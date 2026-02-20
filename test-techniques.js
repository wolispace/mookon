// Generate 25 test puzzles covering all techniques and covers

const testDefinitions = [
    { name: 'Hole: Basic', tech: 'hole', cover: null },
    { name: 'Hole: Color Match', tech: 'hole', cover: null },
    { name: 'Screw: Corners', tech: 'screw', cover: null },
    { name: 'Switch: States', tech: 'switch', cover: null },
    { name: 'Maze: Navigate', tech: 'maze', cover: null },
    { name: 'Group: Find Key', tech: 'group', cover: null },
    { name: 'Tumbler: Unlock', tech: 'tumbler', cover: null },
    { name: 'Cover: Physical', tech: 'hole', cover: 0 },
    { name: 'Cover: Group Obscure', tech: 'switch', cover: 1 },
    { name: 'Cover: Remote Only', tech: 'hole', cover: 2 },
    { name: 'Cover: Switch Release', tech: 'screw', cover: 3 },
    { name: 'Cover: Size Obscure', tech: 'hole', cover: 4 },
    { name: 'Cover: Reset Trap', tech: 'hole', cover: 5 },
    { name: 'Multi: Hole + Screw', tech: ['hole', 'screw'], cover: null },
    { name: 'Multi: Switch + Maze', tech: ['switch', 'maze'], cover: null },
    { name: 'Stack: Physical + Remote', tech: 'hole', cover: [0, 2] },
    { name: 'Shapes: All Types', tech: 'hole', cover: null },
    { name: 'Multi-panel 1', tech: 'hole', cover: null },
    { name: 'Multi-panel 2', tech: 'hole', cover: null },
    { name: 'Group: All Fill', tech: 'group', cover: null },
    { name: 'Maze: Multi-Socket', tech: 'maze', cover: null },
    { name: 'Screw: Hide Holes', tech: 'screw', cover: null },
    { name: 'Switch + Tumbler', tech: ['switch', 'tumbler'], cover: null },
    { name: 'Size: Multiple', tech: 'hole', cover: 4 },
    { name: 'Reset: Maze Ball', tech: 'maze', cover: 5 }
];

function generateTestPuzzle(def) {
    const generator = new PuzzleGenerator();
    elementIdCounter = 1;
    generator.availablePlugs = [];
    generator.panels = [];

    const panel = new GeneratedPanel(0, 1, generator);
    generator.currentPanelIndex = 0;

    const techs = Array.isArray(def.tech) ? def.tech : [def.tech];
    techs.forEach(techName => {
        const technique = generator.techniques[techName];
        if (technique) technique.apply(panel, generator);
    });

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

    if (def.cover !== null && panel.coverableElements.length > 0) {
        const covers = Array.isArray(def.cover) ? def.cover : [def.cover];
        covers.forEach(coverStyle => {
            let compatibleElements = panel.coverableElements.filter(el => !el.hasRemote);

            // Assuming the intent was to continue the filter for coverStyle 4:
            if (coverStyle === 4) {
                compatibleElements = compatibleElements.filter(el =>
                    el.elevation === '+' && !['s', 'w'].includes(el.type)
                );
            }
            if (compatibleElements.length > 0) {
                const element = compatibleElements[0];
                const coverManager = new CoverManager();
                const style = coverManager.styles[coverStyle];
                if (style) style.apply(panel, element, panel, generator);
            }
        });
    }

    generator.panels.push(panel);
    return generator.toString();
}

function generateAllTests() {
    const output = ['const debugPuzzleConfigs = ['];
    testDefinitions.forEach((def, i) => {
        const puzzle = generateTestPuzzle(def);
        output.push(`    // ${i + 1}. ${def.name}`);
        output.push(`    \`${puzzle}\`,`);
        output.push('');
    });
    output.push('];');
    console.log(output.join('\n'));
}

function initTest() {
    generateAllTests();
}

document.getElementById('reload-button').addEventListener('click', () => {
    initTest();
});

initTest();
