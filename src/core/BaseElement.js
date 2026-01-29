class BaseElement {
    static nextId = 1;   // shared across all instances

    id = '';
    x = 0;
    y = 0;
    type = 'c';
    width = 1;
    height = 1;
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
            this.width = parseFloat(parts[0]);
            this.height = parseFloat(parts[1]);
        } else {
            this.width = this.height = parseFloat(sizeStr);
        }
    }

    setRandomColor() {
        this.color = randBetween(0, COLOR_ARRAY.length);
    }
}