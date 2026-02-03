class BaseElement {
    static nextId = 1;   // shared across all instances

    id = '';
    x = 0;
    y = 0;
    type = 'c';
    gridWidth = 1;
    gridHeight = 1;
    size = 1;
    color = 0;
    elevation = ''; // +|-
    elevationTarget = ''; // Target elevation to apply when dragged
    method = ''; // 'hold'
    change = ''; // 'rotate'
    targetState = ''; // target state|color|rotation
    remoteActions = [];
    title = ''; // debug hint for element identification
    context = ''; // Debug context: why was this element created?

    constructor(shape) {
        this.type = SHAPES[shape]?.code ?? 'c';
        this.id = `${this.type}${BaseElement.nextId++}`;
    }

    setSize(size) {
        const sizeStr = `${size}`;
        if (sizeStr.includes('x')) {
            const parts = sizeStr.split('x');
            this.gridWidth = parseFloat(parts[0]);
            this.gridHeight = parseFloat(parts[1]);
            this.size = Math.max(this.gridWidth, this.gridHeight);
        } else {
            const newSize = parseFloat(sizeStr);
            if (this.size > 0 && this.rectWidth !== undefined && this.rectHeight !== undefined) {
                const ratio = newSize / this.size;
                this.rectWidth *= ratio;
                this.rectHeight *= ratio;
                this.gridWidth = this.rectWidth;
                this.gridHeight = this.rectHeight;
            } else {
                this.gridWidth = this.gridHeight = newSize;
            }
            this.size = newSize;
        }
    }

    setRandomColor() {
        this.color = randBetween(0, COLOR_ARRAY.length);
    }
};
