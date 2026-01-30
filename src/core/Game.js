class Game {
    constructor(config) {
        const puzzleConfig = config;
        const { message, reward, panels } = PuzzleParser.parse(config);
        const rootArea = document.getElementById('puzzle-area');
        rootArea.style.position = 'relative';

        this.panelConfigs = panels.map(p => PuzzleParser.parsePanel(p));
        // Add victory pseudo-panel at the bottom (index 0)
        this.panelConfigs.unshift({ color: 'victory', message: message, reward: reward, elements: [] });

        this.panels = [];
        this.incompletePanels = 0; // Counter for incomplete panels
        this.panelConfigs.forEach((p, i) => {
            const panel = new Panel(p, this, i);
            rootArea.appendChild(panel.container);
            this.panels.push(panel);
            if (p.color !== 'victory' && p.elements.length > 0) {
                this.incompletePanels++;
            }
        });

        this.currentIdx = this.panels.length - 1; // Start with the top-most panel
    }

    checkNextPanel(panel, cx, cy) {
        const ar = document.getElementById('puzzle-area').getBoundingClientRect();

        if (cx < ar.left || cx > ar.right || cy < ar.top || cy > ar.bottom) {
            if (this.currentIdx > 0) {
                this.currentIdx--;
            }
        }
    }
};
