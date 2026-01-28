let globalZIndex = 1000;

const PANEL_GRID_SIZE = 8;

// Timing constants
const ROTATION_DEGREES = 45; // Degrees per rotation step
const INTERACTION_TIMEOUT = 300; // ms to restore styles after interacting

// Color constants - single source of truth
const COLORS = {
    'grey': { index: 0, hex: '#c0c0c0' },
    'black': { index: 1, hex: '#1e1b1bff' },
    'red': { index: 2, hex: '#e36a6aff' },
    'blue': { index: 3, hex: '#5958a2ff' },
    'teal': { index: 4, hex: '#1abcb1ff' },
    'green': { index: 5, hex: '#09dd73ff' },
    'yellow': { index: 6, hex: '#f6ef6bff' },
    'orange': { index: 7, hex: '#f99924ff' },
    'white': { index: 8, hex: '#fff' }
};

// Derived color constants
const COLOR_NAMES = Object.keys(COLORS);
const COLOR_ARRAY = Object.entries(COLORS)
    .sort(([, a], [, b]) => a.index - b.index)
    .map(([name]) => name);
const getColor = (name) => COLORS[name]?.hex || name || COLORS.grey.hex;

// Shape constants - single source of truth
const SHAPES = {
    'circle': { code: 'c', draggable: true },
    'rectangle': { code: 'r', draggable: true },
    'triangle': { code: 't', draggable: true },
    'screw': { code: 's', draggable: true },
    'switch': { code: 'w', draggable: false }
};

// Derived shape constants
const SHAPE_NAMES = Object.keys(SHAPES);
const SHAPE_PREFIX_MAP = Object.fromEntries(
    Object.entries(SHAPES).map(([name, props]) => [props.code, name])
);
const SHAPE_TO_PREFIX = Object.fromEntries(
    Object.entries(SHAPES).map(([name, props]) => [name, props.code])
);
const DRAGGABLE_SHAPES = Object.entries(SHAPES)
    .filter(([_, props]) => props.draggable)
    .map(([name, _]) => name);

// Interaction method constants
const METHOD_TAP = 'tap';
const METHOD_HOLD = 'hold';
const METHOD_DRAG = 'drag';
const METHOD_NONE = 'none';

const METHOD_NAMES = [METHOD_TAP, METHOD_HOLD, METHOD_DRAG, METHOD_NONE];
const METHOD_PATTERN = new RegExp(`^(${METHOD_NAMES.join('|')})$`);

// Change type constants
const CHANGE_COLOR = 'color';
const CHANGE_ROTATION = 'rotate';
const CHANGE_STATE = 'state';
const CHANGE_MOVE = 'move';
const CHANGE_NONE = 'none';

const CHANGE_NAMES = [CHANGE_COLOR, CHANGE_ROTATION, CHANGE_STATE, CHANGE_MOVE, CHANGE_NONE];
const CHANGE_PATTERN = new RegExp(`^(${CHANGE_NAMES.filter(c => c !== CHANGE_NONE).join('|')})$`);

// Size comparison constants
const COMPARISON_EQUAL = '=';
const COMPARISON_GREATER = '>';
const COMPARISON_LESS = '<';

const COMPARISON_NAMES = [COMPARISON_EQUAL, COMPARISON_GREATER, COMPARISON_LESS];
const COMPARISON_PATTERN = new RegExp(`^[${COMPARISON_NAMES.join('')}]$`);

// Pattern constants
const ELEMENT_ID_PATTERN = /^[ctswr]\d+$/;
const NUMERIC_PATTERN = /^\d+$/;

// Configuration Parser
class PuzzleParser {
    static parse(puzzleString) {
        try {
            const sections = puzzleString.split('/').map(s => s.trim());
            let messageText = sections[0] || '';
            let reward = null;

            // Extract reward from square brackets if present
            const rewardMatch = messageText.match(/\[([^\]]+)\]/);
            if (rewardMatch) {
                reward = rewardMatch[1].trim();
                messageText = messageText.replace(/\[([^\]]+)\]/, '').trim();
            }

            const panels = sections.slice(1).filter(s => s);
            if (panels.length === 0) throw new Error("No panels defined.");
            return { message: messageText, reward, panels };
        } catch (error) {
            PuzzleParser.showError(error.message);
            throw error;
        }
    }

    static parsePanel(panelString) {
        const colonIndex = panelString.indexOf(':');
        if (colonIndex === -1) throw new Error(`Invalid panel: "${panelString}"`);

        const color = panelString.substring(0, colonIndex).trim();
        const elementSection = panelString.substring(colonIndex + 1).trim();
        const elements = elementSection.split(',').map(s => s.trim()).filter(s => s);

        return { color, elements };
    }

    static parseElement(elementString, panel) {
        const tokens = elementString.split(/\s+/).filter(t => t);
        const element = new UIElement(panel);
        PuzzleParser.parseFormat(tokens, element);
        return element;
    }

    static parseFormat(tokens, element) {
        // Strip title attribute from tokens if present
        const filteredTokens = tokens.filter(t => !t.startsWith('title='));
        const [id, sizeStr, locationStr, rotationStr, colorStr] = filteredTokens;

        // Set basic properties
        element.id = id;
        element.shape = SHAPE_PREFIX_MAP[id[0].toLowerCase()] || 'circle';

        // Parse size - check for WIDTHxHEIGHT format for all shapes
        if (sizeStr.includes('x')) {
            const sizeParts = sizeStr.split('x');
            if (sizeParts.length === 2) {
                element.rectWidth = parseFloat(sizeParts[0]);
                element.rectHeight = parseFloat(sizeParts[1]);
                element.size = Math.max(element.rectWidth, element.rectHeight);
                // console.log(`Parsed ${element.id}: sizeStr="${sizeStr}" -> rectWidth=${element.rectWidth}, rectHeight=${element.rectHeight}, size=${element.size}`);
            } else {
                element.size = parseFloat(sizeStr);
                // console.log(`Parsed ${element.id}: sizeStr="${sizeStr}" -> size=${element.size} (no x found)`);
            }
        } else {
            element.size = parseFloat(sizeStr);
            // console.log(`Parsed ${element.id}: sizeStr="${sizeStr}" -> size=${element.size} (no x in string)`);
        }

        const [x, y, height] = PuzzleParser.parseLocation(locationStr);
        element.x = x;
        element.y = y;
        element.height = height;
        element.rotation = parseInt(rotationStr) || 0;
        element.initialRotation = element.rotation;

        // Handle dual/triple colors for switches
        let initialState, secondaryColorIndex = null, ballColorIndex = null;
        if (colorStr.includes('-')) {
            const colors = colorStr.split('-');
            initialState = parseInt(colors[0]) || 0;
            secondaryColorIndex = parseInt(colors[1]) || 0;
            ballColorIndex = colors[2] !== undefined ? parseInt(colors[2]) : null;
        } else {
            initialState = parseInt(colorStr) || 0;
        }
        element.color = initialState;
        element.secondaryColor = secondaryColorIndex;
        element.ballColor = ballColorIndex;

        // Set defaults
        element.method = METHOD_NONE;
        element.change = CHANGE_NONE;
        element.targetState = 0;
        element.finalRotation = null;
        element.remoteActions = [];

        // Process remaining tokens sequentially
        let i = 5;
        while (i < filteredTokens.length) {
            const token = filteredTokens[i];

            if (token === METHOD_DRAG) {
                element.method = METHOD_DRAG;
                element.draggable = true;
                i++;

                // Check for move requirement
                if (i < filteredTokens.length && filteredTokens[i] === CHANGE_MOVE) {
                    element.change = CHANGE_MOVE;
                    element.targetState = 1;
                    i++;
                }
                break;
            } else if (METHOD_PATTERN.test(token)) {
                element.method = token;
                i++;

                // Get change type
                if (i < filteredTokens.length && CHANGE_PATTERN.test(filteredTokens[i])) {
                    element.change = filteredTokens[i];
                    i++;
                }

                // Get target state
                if (i < filteredTokens.length && /^\d+$/.test(filteredTokens[i])) {
                    element.targetState = parseInt(filteredTokens[i]);
                    i++;
                }

                // Check for remote element ID
                if (i < filteredTokens.length && ELEMENT_ID_PATTERN.test(filteredTokens[i])) {
                    const remoteId = filteredTokens[i];
                    i++;

                    // Check for vector pattern (remote move)
                    // Supports: 1x0, -1x0, 0.5x0.5, .5x0, -.5x.5
                    const vectorMatch = filteredTokens[i].match(/^([+\-]?(:?\d+(?:\.\d+)?|\.\d+))x([+\-]?(:?\d+(?:\.\d+)?|\.\d+))$/);

                    if (vectorMatch) {
                        const vx = parseFloat(vectorMatch[1]);
                        const vy = parseFloat(vectorMatch[3]); // Group 3 because group 2 is the inner non-capturing or alternation of group 1 
                        // Actually regex groups:
                        // 0: full match
                        // 1: x value
                        // 2: inner group (ignore)
                        // 3: y value

                        i++;

                        //console.log(`Parsed Remote Move: ID=${remoteId}, Vector=${vx}x${vy} for Element=${element.id}`);

                        element.remoteActions.push({
                            id: remoteId,
                            type: 'move_step',
                            vector: { x: vx, y: vy }
                        });

                    } else if (i < filteredTokens.length && METHOD_PATTERN.test(filteredTokens[i])) {
                        const remoteMethod = filteredTokens[i];
                        i++;

                        // Get remote change type and target
                        let remoteChange = CHANGE_NONE;
                        let remoteTarget = 0;

                        if (i < filteredTokens.length && CHANGE_PATTERN.test(filteredTokens[i])) {
                            if (filteredTokens[i] === CHANGE_MOVE) {
                                remoteChange = CHANGE_MOVE;
                                remoteTarget = 1;
                                i++;
                            } else {
                                remoteChange = filteredTokens[i];
                                i++;

                                // Get target value for change type
                                if (i < filteredTokens.length && NUMERIC_PATTERN.test(filteredTokens[i])) {
                                    remoteTarget = parseInt(filteredTokens[i]);
                                    i++;
                                }
                            }
                        }

                        element.remoteActions.push({
                            id: remoteId,
                            type: 'configure',
                            method: remoteMethod,
                            change: remoteChange,
                            target: remoteTarget
                        });
                    }
                }

                if (i < filteredTokens.length) {
                    console.log(`Configuration Error Element ${element.id}: Unrecognized token '${filteredTokens[i]}'. Expected change type, target state, or remote action.`, "color:red;font-weight:bold;");
                }
                break;
            } else if (COMPARISON_PATTERN.test(token)) {
                element.sizeComparison = token;
                i++;
            } else {
                i++;
            }
        }

        // Apply logic after all tokens processed
        element.state = element.change === CHANGE_COLOR ? initialState : 0;
        element.maxState = element.shape === 'switch' ? element.size : 8;

        if (element.method === METHOD_DRAG) {
            element.draggable = true;
        }
    }

    static parseLocation(locStr) {
        const parts = locStr.split('x');
        if (parts.length !== 2) throw new Error(`Invalid location format: "${locStr}"`);

        const x = parseFloat(parts[0]);

        let yStr = parts[1];
        let height = 0;
        if (yStr.endsWith('+')) {
            height = 1;
            yStr = yStr.slice(0, -1);
        } else if (yStr.endsWith('-')) {
            height = -1;
            yStr = yStr.slice(0, -1);
        } else if (yStr.endsWith('^')) {
            height = 2; // Shorthand for "start flat, target raised"
            yStr = yStr.slice(0, -1);
        } else if (yStr.endsWith('_')) {
            height = -2; // Shorthand for "start flat, target sunken"
            yStr = yStr.slice(0, -1);
        }
        const y = parseFloat(yStr);

        return [x, y, height];
    }

    static showError(msg) {
        const area = document.getElementById('puzzle-area');
        if (area) area.innerHTML = `<div style="color:#ff6b6b;padding:20px;">Error: ${msg}</div>`;
    }
}

const PADDING = 12;
const BORDER = 3;

// Calculate actual element size in pixels
function getElementSize() {
    const maxAvailable = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.45);
    const cellSize = Math.floor((maxAvailable - (PADDING + BORDER) * 2) / 8);

    // Set CSS variable for use in styles
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);

    return cellSize;
}

// SVG Factory Class
class SVGFactory {
    static init() {
        const svgNS = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(svgNS, 'defs');

        // Shared sunken filter (inset shadow)
        const filter = document.createElementNS(svgNS, 'filter');
        filter.id = 'sunken-filter';
        filter.setAttribute('x', '-20%');
        filter.setAttribute('y', '-20%');
        filter.setAttribute('width', '140%');
        filter.setAttribute('height', '140%');

        const blur = document.createElementNS(svgNS, 'feGaussianBlur');
        blur.setAttribute('in', 'SourceAlpha');
        blur.setAttribute('stdDeviation', '2');
        blur.setAttribute('result', 'blur');

        const offset = document.createElementNS(svgNS, 'feOffset');
        offset.setAttribute('in', 'blur');
        offset.setAttribute('dx', '4');
        offset.setAttribute('dy', '4');
        offset.setAttribute('result', 'offsetBlur');

        const composite = document.createElementNS(svgNS, 'feComposite');
        composite.setAttribute('operator', 'out');
        composite.setAttribute('in', 'SourceGraphic');
        composite.setAttribute('in2', 'offsetBlur');
        composite.setAttribute('result', 'inverse');

        const flood = document.createElementNS(svgNS, 'feFlood');
        flood.setAttribute('flood-color', 'black');
        flood.setAttribute('flood-opacity', '1');
        flood.setAttribute('result', 'color');

        const composite2 = document.createElementNS(svgNS, 'feComposite');
        composite2.setAttribute('operator', 'in');
        composite2.setAttribute('in', 'color');
        composite2.setAttribute('in2', 'inverse');
        composite2.setAttribute('result', 'shadow');

        const merge = document.createElementNS(svgNS, 'feMerge');
        const m1 = document.createElementNS(svgNS, 'feMergeNode');
        m1.setAttribute('in', 'SourceGraphic');
        const m2 = document.createElementNS(svgNS, 'feMergeNode');
        m2.setAttribute('in', 'shadow');
        merge.appendChild(m1);
        merge.appendChild(m2);

        filter.append(blur, offset, composite, flood, composite2, merge);
        defs.appendChild(filter);

        const svg = document.createElementNS(svgNS, 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.appendChild(defs);
        document.body.appendChild(svg);
    }

    static create(element) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        const base = getElementSize();
        // Use element.size as a direct scale factor for most shapes
        // For switches, it still represents the number of steps (1-8)
        const size = element.shape === 'switch' ? base : Math.round(base * element.size);

        svg.style.display = 'block';
        svg.style.transformOrigin = 'center';
        svg.style.color = getColor(COLOR_ARRAY[element.color]);

        if (element.height === -1) {
            svg.style.filter = 'url(#sunken-filter) drop-shadow(-1px -1px 1px rgba(0, 0, 0, 1)) drop-shadow(1px 1px 1px rgba(255, 255, 255, 0.5))';
        }

        const draw = (tag, attrs = {}) => {
            const el = document.createElementNS(svgNS, tag);
            Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
            svg.appendChild(el);
            return el;
        };

        switch (element.shape) {
            case 'circle':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    const radius = Math.min(rectWidth, rectHeight) / 2;
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    draw('ellipse', { cx: rectWidth / 2, cy: rectHeight / 2, rx: rectWidth / 2, ry: rectHeight / 2, fill: 'currentColor' });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    draw('circle', { cx: size / 2, cy: size / 2, r: size / 2, fill: 'currentColor' });
                }
                break;
            case 'rectangle':
                //console.log(`SVG Create ${element.id}: shape=${element.shape}, rectWidth=${element.rectWidth}, rectHeight=${element.rectHeight}, size=${element.size}`);
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    // console.log(`SVG Create ${element.id}: Using rectWidth/rectHeight -> rectWidth=${rectWidth}, rectHeight=${rectHeight}`);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    draw('rect', { width: rectWidth, height: rectHeight, fill: 'currentColor' });
                } else {
                    //console.log(`SVG Create ${element.id}: Using size -> size=${size}`);
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    draw('rect', { width: size, height: size, fill: 'currentColor' });
                }
                break;
            case 'triangle':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    const pts = `${rectWidth / 2},${rectHeight * 0.1} ${rectWidth * 0.1},${rectHeight * 0.9} ${rectWidth * 0.9},${rectHeight * 0.9}`;
                    draw('polygon', { points: pts, fill: 'currentColor' });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    const pts = `${size / 2},${size * 0.1} ${size * 0.1},${size * 0.9} ${size * 0.9},${size * 0.9}`;
                    draw('polygon', { points: pts, fill: 'currentColor' });
                }
                break;
            case 'screw':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    draw('ellipse', { cx: rectWidth / 2, cy: rectHeight / 2, rx: rectWidth / 2, ry: rectHeight / 2, fill: 'currentColor' });
                    const sw = Math.max(2, Math.min(rectWidth, rectHeight) * 0.1);
                    draw('line', { x1: rectWidth / 2, y1: rectHeight * 0.2, x2: rectWidth / 2, y2: rectHeight * 0.8, stroke: '#333', 'stroke-width': sw });
                    draw('line', { x1: rectWidth * 0.2, y1: rectHeight / 2, x2: rectWidth * 0.8, y2: rectHeight / 2, stroke: '#333', 'stroke-width': sw });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    draw('circle', { cx: size / 2, cy: size / 2, r: size / 2, fill: 'currentColor' });
                    const sw = Math.max(2, size * 0.1);
                    draw('line', { x1: size / 2, y1: size * 0.2, x2: size / 2, y2: size * 0.8, stroke: '#333', 'stroke-width': sw });
                    draw('line', { x1: size * 0.2, y1: size / 2, x2: size * 0.8, y2: size / 2, stroke: '#333', 'stroke-width': sw });
                }
                break;
            case 'switch':
                const swW = Math.round(base * (1 + element.size));
                const swH = base;
                svg.setAttribute('viewBox', `0 0 ${swW} ${swH}`);
                svg.style.width = `${swW}px`;
                svg.style.height = `${swH}px`;
                const pill = draw('rect', { x: 2, y: 2, width: swW - 4, height: swH - 4, rx: (swH - 4) / 2, fill: 'currentColor' });
                pill.classList.add('switch-pill', 'sunken');
                pill.style.pointerEvents = 'none';
                const br = Math.round(base * 0.95) / 2;
                const ballColor = element.ballColor !== null ? getColor(COLOR_ARRAY[element.ballColor]) : getColor(COLOR_ARRAY[0]);
                const b = draw('circle', { cx: br + 2, cy: swH / 2, r: br, fill: ballColor });
                b.classList.add('switch-ball', 'raised');
                b.style.pointerEvents = 'auto';
                b.style.cursor = 'pointer';
                break;
        }
        return svg;
    }
}

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

// when generating puzzle these confirm elements are within bounds and have matching elements for satisfaction.
class BuildElement extends BaseElement {
    constructor(id) {
        super(id);
    }

    // Adjust width and height to fit within the 8x8 panel grid
    clampToPanel() {
        if (this.x + this.width > 8) this.width = Math.max(0.5, 8 - this.x);
        if (this.y + this.height > 8) this.height = Math.max(0.5, 8 - this.y);
    }

    // assign a location but make sure its not out of bounds of the panel
    keepInBounds() {
        if (randBetween(1, 3) < 2) {
            this.x = randBetween(0, 1) === 0 ? 0 : Math.max(0, 8 - this.width);
            this.y = randBetween(0, 1) === 0 ? 0 : Math.max(0, 8 - this.height);
        } else {
            this.x = randBetween(0, Math.max(0, 8 - this.width));
            this.y = randBetween(0, Math.max(0, 8 - this.height));
        }

        this.clampToPanel();
    }

    toString() {
        const round = (val) => Math.round(val * 100) / 100;
        const w = round(this.width);
        const h = round(this.height);
        const x = round(this.x);
        const y = round(this.y);

        // For switches, preserve color string format (e.g., "1-2-5")
        // For other elements, ensure color is a number
        let color = this.color;
        if (this.type !== 'w') {
            // Not a switch - convert to number
            color = typeof this.color === 'number' ? this.color : (parseInt(this.color) || 0);
        } else if (typeof this.color === 'number') {
            // Switch with numeric color - shouldn't happen but handle it
            color = this.color;
        }

        let configString = `${this.id} ${w}x${h} ${x}x${y}${this.elevation} 0 ${color}`;
        configString += this.method === '' ? '' : ` ${this.method}`;

        // Only add change and target if meaningful
        if (this.change !== '' && this.change !== 'none') {
            configString += ` ${this.change}`;
            // 'move' implies target state 1, don't print it. Others need it.
            if (this.change !== 'move') {
                configString += ` ${this.targetState}`;
            }
        }

        this.remoteActions.forEach(action => {
            configString += ` ${action.id}`;
            if (action.type === 'move_step') {
                configString += ` ${action.vector.x}x${action.vector.y}`;
            } else {
                configString += ` ${action.method}`;
                if (action.change !== 'none') {
                    configString += ` ${action.change}`;
                    if (action.change !== 'move') {
                        configString += ` ${action.target}`;
                    }
                }
            }
        });

        // Add elevation target if present (shorthand ^ in location)
        if (this.elevationTarget === '+') {
            configString = configString.replace(`${this.x}x${this.y}${this.elevation}`, `${this.x}x${this.y}^`);
        } else if (this.elevationTarget === '-') {
            configString = configString.replace(`${this.x}x${this.y}${this.elevation}`, `${this.x}x${this.y}_`); // Using _ for sunken target maybe? User only asked for raised.
        }

        if (this.title !== '') {
            // console.log(`${this.id} [${this.context}] ${this.title}`);
        } else if (this.context !== '') {
            // console.log(`${this.id} Context: ${this.context}`);
        }

        return configString;
    }

    hasActiveGoal() {
        // Mimic UIElement.isSatisfied logic to detect if this element is a "goal"
        // 1. Switches/elements with non-zero target state
        if (this.targetState !== '' && parseInt(this.targetState) > 0) return true;
        // 2. Sockets (sunken with method)
        if (this.elevation === '-' && this.method !== '') return true;
        // 3. Remote controlled move targets (if they have a goal, but usually it's the socket)
        if (this.change === 'move') return true;

        return false;
    }

}

// Elements build from config to end up in the UI
class UIElement extends BaseElement {
    constructor(panel, shape) {
        super(shape);
        this.panel = panel;
        this.filled = false;
    }

    toString() {
        if (!this.isSatisfied()) {
            //console.log(`${this.id}: method=${this.method}, change=${this.change}, targetState=${this.targetState}, state=${this.state}, remoteActions=${JSON.stringify(this.remoteActions)}`);
        }
    }

    initialize() {
        // Create SVG element using new factory
        this.element = SVGFactory.create(this);
        this.svg = this.element;

        // Set ID and classes on SVG
        this.element.id = this.id;
        this.element.classList.add('element');

        // Restore elevationTarget if it was encoded in height (shorthand)
        if (this.height === 2) {
            this.elevation = '';
            this.elevationTarget = '+';
        } else if (this.height === -2) {
            this.elevation = '';
            this.elevationTarget = '-';
        }

        if (this.height > 0 && this.height < 2) {
            // Apply 'controller' class instead of 'raised' for remote control buttons
            // to prevent them from blocking draggable elements.
            // A 'controller' is an element that has remote actions but isn't draggable itself.
            const isController = this.remoteActions.length > 0 && !this.draggable;
            if (isController) {
                this.element.classList.add('controller');
            } else {
                this.element.classList.add('raised');
            }
        }
        if (this.height < 0) {
            this.element.classList.add('sunken');
        }

        // For switches, disable pointer events on the SVG container
        if (this.shape === 'switch') {
            this.element.style.pointerEvents = 'none';
        }

        // Position in 8x8 grid using absolute positioning with 12px padding offset
        const cellSize = getElementSize();
        this.element.style.position = 'absolute';
        this.element.style.left = `${PADDING + (this.x * cellSize)}px`;
        this.element.style.top = `${PADDING + (this.y * cellSize)}px`;
        this.element.style.cursor = 'pointer';
        this.element.style.zIndex = '2';

        // Handle switch width spanning
        if (this.shape === 'switch') {
            const switchWidth = 1 + this.size;
            this.element.style.width = `calc(var(--cell-size) * ${switchWidth})`;
        }

        // Set up event handlers
        this.setupEvents();

        // Update initial visuals
        this.updateVisuals();

        // Auto-unlock all draggable elements
        if (this.method === METHOD_DRAG) {
            this.element.classList.add('draggable', 'raised', 'unlocked');
        }
    }

    setupEvents() {
        if (this.method === METHOD_NONE) return;

        // For switches, attach events to the ball element
        const target = this.shape === 'switch' ? this.element.querySelector('.switch-ball') : this.element;

        // Remove existing event listeners to prevent duplicates
        target.removeEventListener('mousedown', this.boundHandleStart);
        target.removeEventListener('touchstart', this.boundHandleStart);
        target.removeEventListener('click', this.boundHandleClick);

        // Create bound methods for removal later
        this.boundHandleStart = e => this.handleStart(e);
        this.boundHandleClick = e => this.handleClick(e);

        //console.log(`[setupEvents] ${this.id} method=${this.method} remoteId=${this.remoteId || 'none'}`);

        target.addEventListener('mousedown', this.boundHandleStart);
        target.addEventListener('touchstart', this.boundHandleStart, { passive: false });

        if (this.method !== METHOD_DRAG) {
            target.addEventListener('click', this.boundHandleClick);
        }

        window.addEventListener('mouseup', () => this.handleEnd());
        window.addEventListener('touchend', () => this.handleEnd());
    }

    handleClick(e) {
        if (this.method === METHOD_DRAG) return; // Don't handle clicks when draggable

        e.stopPropagation();

        if (this.method === METHOD_TAP) {
            this.progressState();
        }
    }

    handleStart(e) {
        if (this.method === METHOD_DRAG) {
            this.setupDrag(e);
            return;
        }

        if (this.method === METHOD_HOLD) {
            this.isHolding = true;
            this.holdTimer = setTimeout(() => this.holdStep(), 300);
        }
    }

    handleEnd() {
        this.isHolding = false;
        if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
    }

    holdStep() {
        if (!this.isHolding) return;

        this.progressState();

        // Check for final rotation condition
        if (this.finalRotation !== null && this.change === CHANGE_ROTATION) {
            const currentRotation = this.rotation * ROTATION_DEGREES; // Convert to degrees
            if ((this.finalRotation < 0 && currentRotation <= this.finalRotation) ||
                (this.finalRotation > 0 && currentRotation >= this.finalRotation)) {
                this.isHolding = false;

                // For screws, stop rotation updates after unlocking
                if (this.shape === 'screw' && this.draggable) {
                    this.change = CHANGE_NONE; // Prevent further rotation updates
                }

                this.checkTargetState();
                return;
            }
        }

        if (this.isHolding && !this.unlocked) {
            this.holdTimer = setTimeout(() => this.holdStep(), 200);
        }
    }

    progressState() {
        if (this.change !== CHANGE_NONE) {
            this.state = (this.state + 1) % (this.maxState + 1);
        }

        if (this.change === CHANGE_COLOR) {
            this.element.classList.remove('raised', 'unlocked', 'sunken');
            this.color = this.state;
            this.updateVisuals();
            // Restore styling after animation completes
            setTimeout(() => {
                if (this.height > 0) this.element.classList.add('raised');
                if (this.height < 0) this.element.classList.add('sunken');
                if (this.unlocked) this.element.classList.add('unlocked');
            }, INTERACTION_TIMEOUT);
        } else if (this.change === CHANGE_ROTATION) {
            // Remove raised/sunken styling before rotation
            this.element.classList.remove('raised', 'unlocked', 'sunken');
            this.rotation = this.state;
            this.updateVisuals();
            // Restore styling after animation completes
            setTimeout(() => {
                if (this.height > 0) this.element.classList.add('raised');
                if (this.height < 0) this.element.classList.add('sunken');
                if (this.unlocked) this.element.classList.add('unlocked');
            }, INTERACTION_TIMEOUT);
        } else {
            this.updateVisuals();
        }

        this.checkTargetState();
    }

    checkTargetState() {
        // Check if we should trigger remote actions
        // console.log(`${this.id} checking target state: current=${this.state}, target=${this.targetState}, method=${this.method}, change=${this.change}`);

        let shouldTrigger = false;

        // Standard trigger: state matches target
        if (this.state === this.targetState) {
            shouldTrigger = true;
        }
        // Strict Remote Control Trigger:
        // If the element is purely a controller (no self-change), we want to trigger on every interaction (tap/hold).
        // Condition:
        // 1. Has remote actions
        // 2. Self-change is NONE (it's just a button)
        // 3. Method is TAP or HOLD (user interaction)
        else if (this.remoteActions && this.remoteActions.length > 0 &&
            this.change === CHANGE_NONE &&
            (this.method === METHOD_TAP || this.method === METHOD_HOLD)) {
            shouldTrigger = true;
        }

        if (shouldTrigger) {
            // console.log(`${this.id} reached target state or triggered!`);

            // Stop current method only if there are remote actions to execute
            if (this.remoteActions && this.remoteActions.length > 0) {
                if (this.method === METHOD_HOLD) {
                    this.isHolding = false;
                    if (this.holdTimer) {
                        clearTimeout(this.holdTimer);
                        this.holdTimer = null;
                    }
                }

                // console.log(`${this.id} executing ${this.remoteActions.length} remote actions`);
                for (const remoteAction of this.remoteActions) {
                    for (const panel of this.panel.game.panels) {
                        const targetElement = panel.elements.find(el => el.id === remoteAction.id);
                        if (targetElement) {
                            if (remoteAction.type === 'move_step') {
                                // Execute remote move
                                const cellSize = getElementSize();
                                // Calculate target position in VIEWPORT coordinates
                                // This is critical because calculateConstrainedPosition uses getBoundingClientRect() (viewport)
                                // to check for collisions against other elements.

                                // 1. Get current viewport position
                                const currentRect = targetElement.element.getBoundingClientRect();

                                // UPDATE: Bring to front (simulate drag behavior)
                                targetElement.element.style.zIndex = ++globalZIndex;

                                const width = currentRect.width;
                                const height = currentRect.height;

                                // 2. Calculate target viewport position
                                // Note: remove distance param, it's now embedded in vector magnitude or ignored if simplified
                                // But previous code used remoteAction.vector.x * remoteAction.distance
                                // We simplified it to just vector.x * cellSize.
                                // Wait, line 652 in view showed `remoteAction.vector.x * remoteAction.distance`
                                // I must have missed replacing that line in the previous "simplification" step or it failed silently?
                                // Ah, I see line 652 in the view output ABOVE has `* remoteAction.distance`.
                                // So my previous "Simplify Syntax" didn't fully stick or I viewed an old version?
                                // No, I see line 652.
                                // Okay, I will fix BOTH the coordinate space AND the vector calculation here.

                                const dx = remoteAction.vector.x * cellSize;
                                const dy = remoteAction.vector.y * cellSize;

                                const targetViewportLeft = currentRect.left + dx;
                                const targetViewportTop = currentRect.top + dy;

                                // 3. Check for collisions in Viewport space
                                // Pass currentRect.left/top as current position to allow sliding logic to work correctly
                                const result = targetElement.calculateConstrainedPosition(
                                    targetViewportLeft,
                                    targetViewportTop,
                                    width,
                                    height,
                                    currentRect.left,
                                    currentRect.top
                                );

                                // 4. Convert resulting Viewport coordinates back to Relative coordinates for style application
                                // Use delta between screen (rect) and style to be safe.

                                let currentLeft = parseFloat(targetElement.element.style.left);
                                let currentTop = parseFloat(targetElement.element.style.top);
                                if (isNaN(currentLeft)) currentLeft = targetElement.element.offsetLeft;
                                if (isNaN(currentTop)) currentTop = targetElement.element.offsetTop;

                                const screenToStyleDeltaX = currentRect.left - currentLeft;
                                const screenToStyleDeltaY = currentRect.top - currentTop;

                                const newStyleLeft = result.x - screenToStyleDeltaX;
                                const newStyleTop = result.y - screenToStyleDeltaY;

                                targetElement.element.style.left = `${newStyleLeft}px`;
                                targetElement.element.style.top = `${newStyleTop}px`;

                                // Ensure element is on the frontmost panel at its new location
                                targetElement.reparentToTopmost();

                                // Check for dropping into holes
                                targetElement.checkSnapping();

                            } else {
                                // Existing Configure Logic
                                // Existing Configure Logic
                                targetElement.method = remoteAction.method;
                                if (remoteAction.change !== CHANGE_NONE) {
                                    targetElement.change = remoteAction.change;
                                    targetElement.targetState = remoteAction.target;

                                    if (remoteAction.change === CHANGE_MOVE) {
                                        targetElement.state = 0;
                                    }
                                } else {
                                    targetElement.change = CHANGE_NONE;
                                    targetElement.targetState = 0;
                                }
                                if (remoteAction.method === METHOD_DRAG) {
                                    targetElement.element.classList.add('draggable', 'raised', 'unlocked', 'jump');
                                    if (targetElement.shape === 'screw') {
                                        targetElement.rotation = 0;
                                        targetElement.updateVisuals();
                                    }
                                    targetElement.setupEvents();
                                }
                            }
                        }
                    }
                }
            }

            this.panel.checkCompletion();
        }
    }



    updateVisuals() {
        if (!this.svg) return;

        // Update color
        const currentColor = getColor(COLOR_ARRAY[this.color]);
        this.svg.style.color = currentColor;

        // Update rotation
        const rotationDegrees = this.shape === 'screw' ? -this.rotation * ROTATION_DEGREES : this.rotation * ROTATION_DEGREES;
        this.svg.style.transform = `rotate(${rotationDegrees}deg)`;

        // Handle switch-specific visuals
        if (this.shape === 'switch') {
            const ball = this.svg.querySelector('.switch-ball');
            const bg = this.svg.querySelector('rect');
            if (ball && bg) {
                const baseSize = getElementSize();
                const switchWidth = 1 + this.size;
                const swWidth = Math.round(baseSize * switchWidth);
                const ballSize = Math.round(baseSize * 0.95);
                const ballRadius = ballSize / 2;
                const leftPos = ballRadius + 2;
                const rightPos = swWidth - ballRadius - 2;
                const range = rightPos - leftPos;
                const position = leftPos + (this.state * range / this.maxState);
                ball.setAttribute('cx', position);

                // Set background color based on state match
                if (this.state === this.targetState && this.secondaryColor !== null) {
                    bg.setAttribute('fill', getColor(COLOR_ARRAY[this.secondaryColor]));
                } else {
                    bg.setAttribute('fill', 'currentColor');
                }
            }
        }
    }
    calculateConstrainedPosition(newLeft, newTop, width, height, currentLeft, currentTop) {
        let constrainedLeft = newLeft;
        let constrainedTop = newTop;
        let collisionDetected = false;

        const raisedElements = document.querySelectorAll('.element.raised');

        for (const raised of raisedElements) {
            if (raised === this.element) continue;


            const raisedRect = raised.getBoundingClientRect();

            // define bounds at the POTENTIAL new position
            const potentialLeft = constrainedLeft;
            const potentialRight = constrainedLeft + width;
            const potentialTop = constrainedTop;
            const potentialBottom = constrainedTop + height;

            // Check for overlap at potential position
            if (potentialLeft < raisedRect.right && potentialRight > raisedRect.left &&
                potentialTop < raisedRect.bottom && potentialBottom > raisedRect.top) {

                // Check if raised element is actually visible (not covered)
                if (!this.isElementCovered(raised)) {
                    collisionDetected = true;

                    // Calculate overlap on each side
                    const overlapLeft = potentialRight - raisedRect.left;   // Push Left
                    const overlapRight = raisedRect.right - potentialLeft;  // Push Right
                    const overlapTop = potentialBottom - raisedRect.top;    // Push Up
                    const overlapBottom = raisedRect.bottom - potentialTop; // Push Down

                    // Find minimum overlap to determine slide direction
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    if (minOverlap === overlapLeft) constrainedLeft -= overlapLeft;
                    else if (minOverlap === overlapRight) constrainedLeft += overlapRight;
                    else if (minOverlap === overlapTop) constrainedTop -= overlapTop;
                    else if (minOverlap === overlapBottom) constrainedTop += overlapBottom;
                }
            }
        }

        return { x: constrainedLeft, y: constrainedTop, collision: collisionDetected };
    }

    setupDrag(e) {
        e.preventDefault();

        const getCoord = (ev, prop) => ev[prop] !== undefined ? ev[prop] : (ev.touches && ev.touches[0] ? ev.touches[0][prop] : 0);

        const startX = getCoord(e, 'clientX');
        const startY = getCoord(e, 'clientY');
        const initPos = this.element.getBoundingClientRect();
        const panelRect = this.element.parentElement.getBoundingClientRect();
        const COLLISION_THRESHOLD = 50;

        // Check overlap with other raised elements to determine "flying" state
        let isFlying = false;
        const raisedElements = document.querySelectorAll('.element.raised');

        // Helper to check intersection
        const isIntersecting = (r1, r2) => {
            return !(r2.left >= r1.right ||
                r2.right <= r1.left ||
                r2.top >= r1.bottom ||
                r2.bottom <= r1.top);
        };

        for (const raised of raisedElements) {
            if (raised === this.element) continue;
            if (isIntersecting(initPos, raised.getBoundingClientRect())) {
                isFlying = true;
                break;
            }
        }

        if (isFlying) {
            this.element.classList.add('flying');
        }

        let collisionX = null;
        let collisionY = null;

        const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('mouseup', up);
            window.removeEventListener('touchend', up);
            this.element.classList.remove('flying');
            this.onDragEnd();
        };

        const move = me => {
            const cx = getCoord(me, 'clientX');
            const cy = getCoord(me, 'clientY');

            if (!this.isDragging && Math.hypot(cx - startX, cy - startY) > 5) {
                this.isDragging = true;
                this.element.classList.add('dragging');
                this.element.style.position = 'fixed';
                this.element.style.zIndex = ++globalZIndex;
                this.element.style.left = `${initPos.left}px`;
                this.element.style.top = `${initPos.top}px`;

                // If element has a target elevation, apply it now that it's being dragged
                if (this.elevationTarget) {
                    this.elevation = this.elevationTarget;
                    this.elevationTarget = ''; // Clear target once applied

                    this.element.classList.remove('raised', 'sunken');
                    if (this.elevation === '+') this.element.classList.add('raised');
                    else if (this.elevation === '-') this.element.classList.add('sunken');
                }

                this.lastAppliedLeft = initPos.left;
                this.lastAppliedTop = initPos.top;
                document.getElementById('storage-area').appendChild(this.element);
            }

            if (this.isDragging) {
                let newLeft = initPos.left + (cx - startX);
                let newTop = initPos.top + (cy - startY);

                // Track where the element actually is (from last frame, or initial)
                const currentLeft = this.lastAppliedLeft;
                const currentTop = this.lastAppliedTop;

                // Simple Tether Check
                const distFromElement = Math.hypot(newLeft - currentLeft, newTop - currentTop);

                if (distFromElement > 20) { // Strict 20px threshold
                    up();
                    return;
                }

                const width = initPos.width;
                const height = initPos.height;

                let result = { x: newLeft, y: newTop, collision: false };

                // Only check collision if NOT flying
                // If we are flying, we bypass collision detection entirely for this drag session
                if (!isFlying) {
                    result = this.calculateConstrainedPosition(newLeft, newTop, width, height, currentLeft, currentTop);
                }

                if (result.collision) {
                    this.element.style.left = `${result.x}px`;
                    this.element.style.top = `${result.y}px`;
                    this.lastAppliedLeft = result.x;
                    this.lastAppliedTop = result.y;
                } else {
                    this.element.style.left = `${newLeft}px`;
                    this.element.style.top = `${newTop}px`;
                    this.lastAppliedLeft = newLeft;
                    this.lastAppliedTop = newTop;
                }
            }
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('mouseup', up);
        window.removeEventListener('touchend', up);
        window.addEventListener('touchend', up);
    }

    onDragEnd() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.element.classList.remove('dragging');
        this.element.classList.remove('draggable', 'unlocked');

        // Update state for move change type
        if (this.change === CHANGE_MOVE) {
            this.state = 1;
        }

        // Reparent element to topmost container at drop location
        this.reparentToTopmost();

        // Check for snapping to sunken matching shapes
        this.checkSnapping();

        this.panel.checkCompletion();
    }

    reparentToTopmost() {
        const currentRect = this.element.getBoundingClientRect();
        const cx = currentRect.left + currentRect.width / 2;
        const cy = currentRect.top + currentRect.height / 2;

        // Find topmost panel at element center (highest z-index)
        const panels = document.querySelectorAll('.panel');
        let targetPanel = null;
        let highestZIndex = -1;

        for (const panel of panels) {
            const panelRect = panel.getBoundingClientRect();
            const zIndex = parseInt(panel.style.zIndex) || 0;

            // Check if center is within panel bounds
            if (cx >= panelRect.left && cx <= panelRect.right &&
                cy >= panelRect.top && cy <= panelRect.bottom) {

                if (zIndex > highestZIndex) {
                    highestZIndex = zIndex;
                    targetPanel = panel;
                }
            }
        }

        const storageArea = document.getElementById('storage-area');
        const currentParent = this.element.parentElement;

        if (targetPanel && currentParent !== targetPanel) {
            // Move element to new panel and preserve visibility
            const targetRect = targetPanel.getBoundingClientRect();

            // Disable transitions to prevent jump animation
            this.element.style.transition = 'none';

            targetPanel.appendChild(this.element);

            // Convert global position to panel-relative position
            const cellSize = getElementSize();
            const relativeX = (currentRect.left - (targetRect.left + BORDER + PADDING)) / cellSize;
            const relativeY = (currentRect.top - (targetRect.top + BORDER + PADDING)) / cellSize;

            this.element.style.position = 'absolute';
            this.element.style.left = `${PADDING + (relativeX * cellSize)}px`;
            this.element.style.top = `${PADDING + (relativeY * cellSize)}px`;
            this.element.style.zIndex = '2';

            // Re-enable transitions after a frame
            requestAnimationFrame(() => {
                this.element.style.transition = '';
            });
        } else if (!targetPanel && currentParent !== storageArea) {
            // Move to storage area
            const storageRect = storageArea.getBoundingClientRect();

            this.element.style.transition = 'none';
            storageArea.appendChild(this.element);

            this.element.style.position = 'absolute';
            this.element.style.left = `${currentRect.left - storageRect.left}px`;
            this.element.style.top = `${currentRect.top - storageRect.top}px`;
            this.element.style.zIndex = '2';

            requestAnimationFrame(() => {
                this.element.style.transition = '';
            });
        }
    }

    checkSnapping() {
        const dragRect = this.element.getBoundingClientRect();
        const sunkenElements = document.querySelectorAll('.element:not(.raised)');

        for (const sunken of sunkenElements) {
            if (sunken === this.element) continue;

            // Find the element object for this DOM element
            let sunkenElement = null;
            let sunkenPanel = null;
            for (const panel of this.panel.game.panels) {
                sunkenElement = panel.elements.find(el => el.element === sunken);
                if (sunkenElement) {
                    sunkenPanel = panel;
                    break;
                }
            }

            if (!sunkenElement || sunkenElement.filled) continue;

            // Skip sunken elements without size comparison (they don't accept drops)
            if (!sunkenElement.sizeComparison) continue;

            const sunkenRect = sunken.getBoundingClientRect();

            // Check if shapes match and size comparison
            if (sunkenElement.shape === 'circle' && this.shape === 'screw') {
                // Screws can fill circle holes
            } else if (sunkenElement.shape !== this.shape) {
                continue;
            }

            // Check size comparison if specified
            if (sunkenElement.sizeComparison) {
                const sunkenSize = sunkenElement.size;
                const draggedSize = this.size;

                if (sunkenElement.sizeComparison === COMPARISON_EQUAL && draggedSize !== sunkenSize) {
                    continue;
                }
                if (sunkenElement.sizeComparison === COMPARISON_GREATER && draggedSize < sunkenSize) {
                    continue;
                }
                if (sunkenElement.sizeComparison === COMPARISON_LESS && draggedSize > sunkenSize) {
                    continue;
                }
            }

            // Check if dragged element overlaps with sunken element
            const overlap = (dragRect.left < sunkenRect.right && dragRect.right > sunkenRect.left &&
                dragRect.top < sunkenRect.bottom && dragRect.bottom > sunkenRect.top);

            if (overlap) {

                const isCovered = this.isElementCovered(sunken);
                if (isCovered) {
                    continue;
                }

                // Calculate proper position within the sunken element's panel
                const cellSize = getElementSize();
                const sunkenCenterX = PADDING + (sunkenElement.x * cellSize) + (sunkenElement.size * cellSize / 2);
                const sunkenCenterY = PADDING + (sunkenElement.y * cellSize) + (sunkenElement.size * cellSize / 2);
                const draggedCenterX = this.size * cellSize / 2;
                const draggedCenterY = this.size * cellSize / 2;
                const targetX = sunkenCenterX - draggedCenterX;
                const targetY = sunkenCenterY - draggedCenterY;

                // Snap to position
                this.element.style.left = `${targetX}px`;
                this.element.style.top = `${targetY}px`;

                // Remove drag styling and disable interaction
                this.element.classList.remove('raised');
                this.element.classList.remove('unlocked');
                this.element.classList.remove('draggable');

                // Return element to the sunken element's panel
                sunkenPanel.container.appendChild(this.element);
                this.element.style.position = 'absolute';
                this.element.style.left = `${targetX}px`;
                this.element.style.top = `${targetY}px`;

                // Mark sunken element as filled
                sunkenElement.filled = true;

                // Disable any remote controllers that were controlling this dropped element (c0)
                this.disableRemoteControllers();

                // Check completion of the sunken element's panel
                sunkenElement.panel.checkCompletion();

                break;
            }
        }
    }

    isElementCovered(el) {
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Temporarily hide the dragged element to check what's underneath
        const wasVisible = this.element.style.pointerEvents;
        this.element.style.pointerEvents = 'none';

        const topElement = document.elementFromPoint(x, y);

        this.element.style.pointerEvents = wasVisible;

        return !(el === topElement || el.contains(topElement));
    }

    isSatisfied() {
        // Elements with no target state (no value after color) are auto-satisfied
        if (this.targetState === 0 && this.method === METHOD_NONE && !this.draggable && !this.sizeComparison) {
            return true;
        }
        // Purely draggable elements (method='drag' with nothing after it) are auto-satisfied
        if (this.method === METHOD_DRAG && this.change === CHANGE_NONE && this.targetState === 0) {
            return true;
        }
        // Purely draggable elements (method='drag' with no prior interaction) are auto-satisfied
        if (this.method === METHOD_DRAG && this.targetState === 0) {
            return true;
        }

        // Non-interactive decorative elements are always satisfied
        if (this.method === METHOD_NONE && this.height >= 0) {
            return true;
        }

        // Draggable elements that have been snapped lose draggable status but are still satisfied
        if (this.method === METHOD_NONE && this.shape === 'switch') {
            return true;
        }
        if (this.method === METHOD_DRAG) {
            // Elements with move requirement must reach target state
            if (this.change === CHANGE_MOVE) {
                return this.state === this.targetState;
            }
            // Auto-satisfied draggable elements (no move requirement)
            return this.targetState === 0;
        }
        // Sunken shapes with size comparison are satisfied when filled
        // Sunken shapes without size comparison and no method are decorative (auto-complete)
        if (this.height < 0) {
            if (this.sizeComparison || this.method === '=') {
                return this.filled;
            } else if (this.method === METHOD_NONE) {
                return true;
            }
        }
        return this.state === this.targetState;
    }

    disableRemoteControllers() {
        // Find all remote controller elements that target this element and disable them
        for (const panel of this.panel.game.panels) {
            for (const element of panel.elements) {
                if (element.remoteActions.length > 0 && element.remoteActions[0].id === this.id) {
                    // This element controls us - disable it
                    element.remoteActions = []; // Clear the actions array so nothing executes
                    // Remove all event listeners
                    if (element.boundHandleStart) {
                        const target = element.shape === 'switch' ? element.element.querySelector('.switch-ball') : element.element;
                        if (target) {
                            target.removeEventListener('mousedown', element.boundHandleStart);
                            target.removeEventListener('touchstart', element.boundHandleStart);
                        }
                    }
                    if (element.boundHandleClick) {
                        const target = element.shape === 'switch' ? element.element.querySelector('.switch-ball') : element.element;
                        if (target) {
                            target.removeEventListener('click', element.boundHandleClick);
                        }
                    }
                }
            }
        }
    }
}

class Panel {
    constructor(config, game, index) {
        this.config = config;
        this.game = game;
        this.elements = [];
        this.isUnlocked = false;
        this.isConstructing = true; // Prevent completion checks during construction

        this.container = document.createElement('div');
        this.container.className = `panel panel-${config.color}`;
        this.container.style.zIndex = index;

        if (config.color === 'victory') {
            this.container.className += ' panel-victory';

            // Create message text
            const messageSpan = document.createElement('span');
            messageSpan.textContent = config.message;
            messageSpan.className = 'victory-message';
            this.container.appendChild(messageSpan);

            // Add reward icon if present
            if (config.reward) {
                const rewardIcon = RewardsManager.createRewardIcon(config.reward, (icon) => {
                    // Animate icon moving to rewards area
                    const rewardsArea = document.getElementById('rewards-area');
                    const iconRect = icon.getBoundingClientRect();
                    const rewardsRect = rewardsArea.getBoundingClientRect();

                    // Create a clone for animation
                    const clone = icon.cloneNode(true);
                    clone.style.position = 'fixed';
                    clone.style.left = `${iconRect.left}px`;
                    clone.style.top = `${iconRect.top}px`;
                    clone.style.transition = 'all 0.6s ease-in-out';
                    clone.style.zIndex = '9999';
                    document.body.appendChild(clone);

                    // Remove original icon
                    icon.remove();

                    // Animate to rewards area
                    requestAnimationFrame(() => {
                        clone.style.left = `${rewardsRect.left + rewardsRect.width / 2 - 12}px`;
                        clone.style.top = `${rewardsRect.top + 10}px`;
                        clone.style.transform = 'scale(0.8)';
                        clone.style.opacity = '0.5';
                    });

                    // Remove clone after animation
                    setTimeout(() => {
                        clone.remove();
                    }, 600);
                });

                this.container.appendChild(rewardIcon);
            }

            return;
        }

        // Create elements
        config.elements.forEach(elementString => {
            const element = PuzzleParser.parseElement(elementString, this);
            element.initialize();
            this.container.appendChild(element.element);
            this.elements.push(element);
        });

        // Add immediate z-index raising on click/touch (if not on an element)
        const bringToFront = (e) => {
            if (!e.target.closest('.element')) {
                this.container.style.zIndex = ++globalZIndex;
            }
        };
        this.container.addEventListener('mousedown', bringToFront);
        this.container.addEventListener('touchstart', bringToFront, { passive: true });

        this.toString();

        // Construction complete, allow completion checks
        this.isConstructing = false;

        // Now check completion once all elements are created
        this.checkCompletion();
    }

    toString() {
        for (const element of this.elements) {
            element.toString();
        }
    }

    checkCompletion() {
        if (this.config.color === 'victory' || this.isConstructing) return;

        // console.log("Panel " + this.config.color + " checkCompletion");
        this.elements.forEach(el => el.toString());

        const allSatisfied = this.elements.every(el => el.isSatisfied());

        if (allSatisfied && this.elements.length > 0 && !this.isUnlocked) {
            this.isUnlocked = true;
            this.container.classList.add('wiggle');

            // Decrement incomplete panels counter
            this.game.incompletePanels--;

            setTimeout(() => {
                this.unlockPanel();
                // Check if all panels are complete
                if (this.game.incompletePanels === 0) {
                    confettiBurst();
                    fetch(`server.php?p=${currentPuzzleIndex}&s=1`).catch(() => { });
                }
            }, 1000);
        } else if (!allSatisfied && this.isUnlocked) {
            // Re-lock panel if elements become unsatisfied
            this.isUnlocked = false;
            this.game.incompletePanels++;
            this.container.style.cursor = 'default';
        }
    }

    unlockPanel() {
        this.container.style.cursor = 'grab';

        const start = e => {
            if (e.target.closest('.element')) return;

            // Move any fixed-position elements above storage area to storage area
            const storageArea = document.getElementById('storage-area');
            const storageTop = storageArea.getBoundingClientRect().top;
            const fixedElements = document.querySelectorAll('.element[style*="position: fixed"]');

            fixedElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < storageTop) {
                    el.style.top = `${storageTop + 10}px`;
                }
            });

            e.preventDefault();
            const sx = e.clientX || e.touches[0].clientX;
            const sy = e.clientY || e.touches[0].clientY;
            let moved = false;
            let startRect = null;

            const move = me => {
                const cx = me.clientX || me.touches[0].clientX;
                const cy = me.clientY || me.touches[0].clientY;

                if (!moved && Math.hypot(cx - sx, cy - sy) > 5) {
                    moved = true;
                    startRect = this.container.getBoundingClientRect();
                    this.container.style.position = 'fixed';
                    this.container.style.width = `${startRect.width}px`;
                    this.container.style.height = `${startRect.height}px`;
                }

                if (moved) {
                    this.container.style.left = `${startRect.left + (cx - sx)}px`;
                    this.container.style.top = `${startRect.top + (cy - sy)}px`;
                }
            };

            const up = () => {
                window.removeEventListener('mousemove', move);
                window.removeEventListener('touchmove', move);

                if (moved) {
                    const r = this.container.getBoundingClientRect();
                    this.game.checkNextPanel(this, r.left + r.width / 2, r.top + r.height / 2);
                }
            };

            window.addEventListener('mousemove', move);
            window.addEventListener('touchmove', move, { passive: false });
            window.addEventListener('mouseup', up);
            window.addEventListener('touchend', up);
        };

        this.container.addEventListener('mousedown', start);
        this.container.addEventListener('touchstart', start, { passive: false });
    }
}

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
}


// Random Puzzle Generation - Class Based System

const PUZZLE_CONFIG = {
    MIN_PANELS: 2,
    MAX_PANELS: 5,
    MIN_TECHNIQUES: 1, // Per panel
    MAX_TECHNIQUES: 1,
    FORCE_MAZE: false // Option to favor maze generation
};

const VICTORY_MESSAGES = [
    "Well done!",
    "You did it!",
    "Congratulations!",
    "Great job!",
    "Nicely done!",
    "Success!",
    "Puzzle Solved!",
    "Amazing!",
    "Way to go!",
    "You're a wiz!"
];

const REWARDS = [
    "book",
    "pencil",
    "dice",
    "coin",
    "key",
    "wand",
    "shield",
    "wand",
    "wand",
    "wand"
];

// Debug configuration - set to override random generation
const DEBUG_CONFIG = {
    enabled: false,                          // Master debug flag
    forcePanelTypes: true,                 // Use panelTypes array instead of random
    forcePlugsToNextPanel: true,           // Force plugs onto next panel instead of current
    panelTypes: ['maze', 'screw', 'screw'], // Panel type sequence when forcePanelTypes is true
    forceCoversOnAllElements: false,        // Force covers on every coverable element
    forceCoverStyle: 3                      // Force Style 3 (Switch Release) for testing
};

// Utilities
function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDecimal(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

// Parse size string ("1x2" or "1") into {width, height}
function parseSize(sizeStr) {
    let width = 1, height = 1;
    if (sizeStr.includes('x')) {
        const parts = sizeStr.split('x');
        width = parseFloat(parts[0]);
        height = parseFloat(parts[1]);
    } else {
        width = height = parseFloat(sizeStr);
    }
    return { width, height };
}

let elementIdCounter = 1;

class GeneratedPanel {
    constructor(index, totalPanels) {
        this.index = index;
        this.totalPanels = totalPanels;
        this.color = COLOR_NAMES[randBetween(0, COLOR_NAMES.length - 1)];
        this.elements = [];
        this.coverableElements = []; // Track elements that can be covered
        this.remoteSetsCount = 0; // Track how many sets of WASD controllers we have
        this.grid = Array(8).fill().map(() => Array(8).fill(false));
    }

    hasActiveGoal() {
        // A panel has an active goal if any of its elements are unsatisfied
        // Since we are checking configuration strings, we use the BuildElement helper
        return this.elements.some(elementStr => {
            const tokens = elementStr.split(/\s+/);
            const id = tokens[0];
            const locStr = tokens[2];
            const colorStr = tokens[4];
            const method = tokens[5] || '';
            const change = tokens[6] || '';
            const target = tokens[7] || '';

            // Elevation
            const elevation = locStr.includes('+') ? '+' : '-';

            // Target State logic
            if (target !== '' && parseInt(target) > 0) return true;
            if (elevation === '-' && method !== '') return true;
            if (change === 'move') return true;

            return false;
        });
    }

    addElement(element, isCoverable = false, context = '') {
        // Support both BuildElement objects and strings (for legacy/maze walls)
        const elementString = typeof element === 'string' ? element : element.toString();
        const elementObj = typeof element === 'string' ? null : element;

        if (elementObj && context) {
            elementObj.context = context;
        }

        this.elements.push(elementString);
        this.reserveGridSpace(elementString);

        if (isCoverable) {
            const tokens = elementString.split(/\s+/);
            const id = tokens[0];
            const sizeStr = tokens[1];
            const locStr = tokens[2];
            const { width, height } = parseSize(sizeStr);
            const elevation = locStr.includes('+') ? '+' : '-';
            const [xPart, yPart] = locStr.replace(/[+\-]/g, '').split('x');
            const x = parseFloat(xPart);
            const y = parseFloat(yPart);

            // Detect if element already has remote capabilities (for deduplication)
            const hasRemote = elementString.includes('remote') ||
                elementString.includes('tap state') ||
                (elementObj && (elementObj.hasRemoteControllers || elementObj.remoteId));

            this.coverableElements.push({
                id,
                elementString,
                width,
                height,
                x,
                y,
                elevation,
                hasRemote,
                type: id.charAt(0).toLowerCase()
            });
        }
    }


    addPlug(plug) {
        // Register the plug as coverable so it can be hidden on the new panel
        this.addElement(plug, true, 'Plug from previous panel');
    }

    addRemoteControllers(plug) {
        if (this.remoteSetsCount >= 2) return false; // Hard limit

        // Create T-shaped directional controllers (like WASD layout)
        // Layout:     U
        //           L S R
        //             D
        // Occupies a 3x3 area
        const controllerSize = 1;
        const controllerColor = randBetween(0, 6);

        // Define T-shape positions: [direction, baseX_offset, baseY_offset, remoteAction]
        const controller1Sets = [
            [
                ['u', 1, 0, '0x-.5'],        // T Up: center-top
                ['l', 0, 1, '-.5x0'],        // Left: middle-left
                ['d', 1, 2, '0x.5'],          // Down: center-bottom
                ['r', 2, 1, '.5x0'],         // Right: middle-right
            ],
            [
                ['u', 1, 0, '0x-.5'],        // + Up: center-top
                ['l', 0, 1, '-.5x0'],        // Left: middle-left
                ['d', 1, 1, '0x.5'],          // Down: center-bottom
                ['r', 2, 1, '.5x0'],         // Right: middle-right
            ],
            [
                ['u', 1, 0, '0x-.5'],        // | Up: center-top
                ['l', 0, 1, '-.5x0'],        // Left: middle-left
                ['d', 1, 2, '0x.5'],          // Down: center-bottom
                ['r', 0, 3, '.5x0'],         // Right: middle-right
            ],
            [
                ['u', 0, 0, '0x-.5'],        // --- Up: center-top
                ['l', 1, 1, '-.5x0'],        // Left: middle-left
                ['d', 2, 0, '0x.5'],          // Down: center-bottom
                ['r', 3, 1, '.5x0'],         // Right: middle-right
            ]
        ];

        const controllers = controller1Sets[randBetween(0, controller1Sets.length - 1)];

        // Try to find a position where the entire controller layout fits without overlapping
        const basePos = this.findControllerPosition(controllers, controllerSize);

        // If no valid position found, don't add controllers
        if (!basePos) return false;

        for (const [direction, offsetX, offsetY, action] of controllers) {
            const controller = new BuildElement('rectangle');
            controller.width = controllerSize;
            controller.height = controllerSize;
            controller.color = controllerColor;
            controller.elevation = '+';
            controller.method = 'tap';
            controller.remoteActions = [{
                id: plug.id,
                type: action.includes('x') ? 'move_step' : 'configure'
            }];

            if (controller.remoteActions[0].type === 'move_step') {
                const parts = action.split('x');
                controller.remoteActions[0].vector = { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
            } else {
                const parts = action.split(/\s+/);
                controller.remoteActions[0].method = parts[0];
                controller.remoteActions[0].change = parts[1] || 'none';
                controller.remoteActions[0].target = parseInt(parts[2]) || 0;
            }

            controller.title = `Remote for ${plug.id} (${direction})`;

            controller.x = basePos.x + offsetX;
            controller.y = basePos.y + offsetY;
            controller.context = `Controller for ${plug.id}`;

            // Reserve grid space for this controller
            this.addElement(controller);
        }
        this.remoteSetsCount++;
        return true;
    }

    findControllerPosition(controllers, controllerSize) {
        // Calculate the bounding box of the controller layout
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const [_, offsetX, offsetY] of controllers) {
            minX = Math.min(minX, offsetX);
            maxX = Math.max(maxX, offsetX + controllerSize);
            minY = Math.min(minY, offsetY);
            maxY = Math.max(maxY, offsetY + controllerSize);
        }

        const layoutWidth = Math.ceil(maxX - minX);
        const layoutHeight = Math.ceil(maxY - minY);

        // Try random positions first for performance
        for (let attempt = 0; attempt < 20; attempt++) {
            const baseX = randBetween(0, 8 - layoutWidth);
            const baseY = randBetween(0, 8 - layoutHeight);

            if (this.isControllerAreaFree(baseX, baseY, controllers, controllerSize)) {
                return { x: baseX, y: baseY };
            }
        }

        // Fallback to systematic search
        for (let baseY = 0; baseY <= 8 - layoutHeight; baseY++) {
            for (let baseX = 0; baseX <= 8 - layoutWidth; baseX++) {
                if (this.isControllerAreaFree(baseX, baseY, controllers, controllerSize)) {
                    return { x: baseX, y: baseY };
                }
            }
        }

        return null;
    }

    isControllerAreaFree(baseX, baseY, controllers, controllerSize) {
        // Check if all controller positions are free by checking against existing elements
        for (const [_, offsetX, offsetY] of controllers) {
            const controllerX = baseX + offsetX;
            const controllerY = baseY + offsetY;

            // Check against grid first
            if (!this.checkFree(controllerX, controllerY, controllerSize, controllerSize)) {
                return false;
            }

            // Also check directly against all existing elements to account for their actual dimensions
            for (const elementString of this.elements) {
                const tokens = elementString.split(/\s+/);
                if (tokens.length < 3) continue;

                const elementId = tokens[0];
                const sizeStr = tokens[1];
                const locStr = tokens[2];

                const { width, height } = parseSize(sizeStr);
                // Switches are 1 unit wider
                let elementWidth = width;
                if (elementId.toLowerCase().startsWith('w')) {
                    elementWidth += 1;
                }

                const [xPart, yPart] = locStr.replace(/[+\-]/g, '').split('x');
                const elementX = Math.floor(parseFloat(xPart));
                const elementY = Math.floor(parseFloat(yPart));

                // Check for overlap: controller at (controllerX, controllerY) is 1x1
                // Element spans from (elementX, elementY) to (elementX + elementWidth, elementY + height)
                if (this.rectsOverlap(
                    controllerX, controllerY, controllerSize, controllerSize,
                    elementX, elementY, elementWidth, height
                )) {
                    return false;
                }
            }
        }
        return true;
    }

    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        // Check if two rectangles overlap
        const x1End = Math.ceil(x1 + w1);
        const y1End = Math.ceil(y1 + h1);
        const x2End = Math.ceil(x2 + w2);
        const y2End = Math.ceil(y2 + h2);

        return !(x1End <= x2 || x2End <= x1 || y1End <= y2 || y2End <= y1);
    }

    addCoverings(panel, generator, probability = 0.33) {
        // Limit total covers per panel to prevent overcrowding
        let coversAdded = 0;
        const MAX_COVERS = 4;

        // For each coverable element, decide randomly if it should be covered
        for (const element of this.coverableElements) {
            if (coversAdded >= MAX_COVERS) break;

            // Debug: force covers on all elements
            const shouldCover = DEBUG_CONFIG.enabled && DEBUG_CONFIG.forceCoversOnAllElements
                ? true
                : Math.random() > probability;

            if (!shouldCover) continue;

            // Decide covering style: 0=Physical Cover, 1=Group Obscure, 2=Remote-Only, 3=Switch Release
            // Limit Style 2 and 3 to panels that don't already have too many remotes
            // AND ensure the target element is raised ('+'). Sunken elements ('-') MUST NOT MOVE.
            // AND ensure the element doesn't already have remote capabilities.
            let maxStyle = 1;
            if (this.remoteSetsCount < 2 && element.elevation === '+' && !element.hasRemote) {
                maxStyle = 3;
            }

            let coverStyle;
            if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.forceCoverStyle !== undefined && DEBUG_CONFIG.forceCoverStyle !== null) {
                if (DEBUG_CONFIG.forceCoverStyle > maxStyle) {
                    // console.log(`%c[Debug] Capping forceCoverStyle from ${DEBUG_CONFIG.forceCoverStyle} to ${maxStyle} for element ${element.id} (elevation=${element.elevation}, hasRemote=${element.hasRemote}, remotes=${this.remoteSetsCount})`, 'color: #888');
                }
                coverStyle = Math.min(DEBUG_CONFIG.forceCoverStyle, maxStyle);
            } else {
                coverStyle = randBetween(0, maxStyle);
            }

            if (coverStyle === 0) {
                // Style 0: Physical Cover
                const shapes = ['rectangle', 'circle', 'screw'];
                const coverShape = shapes[randBetween(0, 2)];
                const cover = new BuildElement(coverShape);
                cover.width = element.width + randDecimal(0.4, 1.5);
                cover.height = element.height + randDecimal(0.4, 1.5);

                if (coverShape === 'screw') {
                    const size = Math.max(cover.width, cover.height);
                    cover.width = cover.height = size;
                }

                cover.setRandomColor();
                cover.elevation = '+';
                cover.x = element.x - 0.2;
                cover.y = element.y - 0.2;

                // Randomly choose movement type for cover
                let movementType;
                if (coverShape === 'screw') {
                    movementType = 'screw';
                } else {
                    const movementTypes = ['drag', 'tap', 'drag', 'tap', 'drag', 'tap'];
                    if (this.remoteSetsCount < 2) {
                        movementTypes.push('remote');
                    }
                    movementType = movementTypes[randBetween(0, movementTypes.length - 1)];
                }

                if (movementType === 'remote') {
                    if (panel && panel.addRemoteControllers(cover)) {
                        this.applyMovementToCover(cover, 'remote', element.id);
                        cover.clampToPanel();
                        this.addElement(cover, false, `Remote Cover for ${element.id}`);
                        coversAdded++;
                    } else {
                        // Fallback to drag if remote placement failed
                        this.applyMovementToCover(cover, 'drag', element.id);
                        cover.clampToPanel();
                        this.addElement(cover, false, `Cover for ${element.id} (remote failed)`);
                        coversAdded++;
                    }
                } else {
                    this.applyMovementToCover(cover, movementType, element.id);
                    cover.clampToPanel();
                    this.addElement(cover, false, `Cover for ${element.id}`);
                    coversAdded++;
                }
            } else if (coverStyle === 1) {
                // Style 1: Group Obscure
                let shapeName = SHAPE_PREFIX_MAP[element.type] || 'rectangle';
                if (shapeName === 'switch') shapeName = 'rectangle';

                if (element.type === 'w') {
                    // Switch cover
                    const cover = new BuildElement(shapeName);
                    cover.width = element.width + randDecimal(0.2, 0.8);
                    cover.height = element.height + randDecimal(0.2, 0.8);
                    cover.setRandomColor();
                    cover.elevation = '+';
                    cover.x = element.x - 0.1;
                    cover.y = element.y - 0.1;

                    const activeTypes = ['drag', 'tap'];
                    if (this.remoteSetsCount < 2) activeTypes.push('remote');
                    let movementType = shapeName === 'screw' ? 'screw' : activeTypes[randBetween(0, activeTypes.length - 1)];

                    if (movementType === 'remote') {
                        if (panel && panel.addRemoteControllers(cover)) {
                            this.applyMovementToCover(cover, 'remote', element.id);
                            cover.clampToPanel();
                            this.addElement(cover, false, `Remote Switch Cover for ${element.id}`);
                            coversAdded++;
                        } else {
                            this.applyMovementToCover(cover, 'drag', element.id);
                            cover.clampToPanel();
                            this.addElement(cover, false, `Switch Cover for ${element.id} (remote failed)`);
                            coversAdded++;
                        }
                    } else {
                        this.applyMovementToCover(cover, movementType, element.id);
                        cover.clampToPanel();
                        this.addElement(cover, false, `Switch Cover for ${element.id}`);
                        coversAdded++;
                    }
                } else {
                    // Group pattern for non-switches
                    const groupCols = randBetween(2, 3);
                    const groupRows = randBetween(1, 2);
                    const targetCol = randBetween(0, groupCols - 1);
                    const targetRow = randBetween(0, groupRows - 1);
                    const originX = element.x - (targetCol * element.width);
                    const originY = element.y - (targetRow * element.height);

                    for (let r = 0; r < groupRows; r++) {
                        for (let c = 0; c < groupCols; c++) {
                            if (r === targetRow && c === targetCol) continue;

                            const dx = originX + (c * element.width);
                            const dy = originY + (r * element.height);

                            if (dx >= 0 && dx + element.width <= 8 && dy >= 0 && dy + element.height <= 8) {
                                if (this.checkFree(dx, dy, element.width, element.height)) {
                                    const distractor = new BuildElement(shapeName);
                                    distractor.width = element.width;
                                    distractor.height = element.height;
                                    distractor.x = dx;
                                    distractor.y = dy;
                                    distractor.color = randBetween(0, 8);
                                    distractor.elevation = '+';
                                    distractor.method = 'drag';
                                    distractor.title = `Group distractor for ${element.id}`;
                                    this.addElement(distractor, false, `Group Distractor for ${element.id}`);
                                }
                            }
                        }
                    }
                    coversAdded++;
                }
            } else if (coverStyle === 2) {
                // Style 2: Remote-Only Element
                // Use ID-based matching for finding the element in this.elements
                const idx = this.elements.findIndex(e => e.split(/\s+/)[0] === element.id);
                if (idx !== -1 && ['c', 'r', 't', 's'].includes(element.type)) {
                    const tokens = element.elementString.split(/\s+/);
                    const modified = new BuildElement(SHAPE_PREFIX_MAP[element.type]);
                    modified.id = tokens[0];
                    modified.width = element.width;
                    modified.height = element.height;
                    modified.x = element.x;
                    modified.y = element.y;
                    modified.color = tokens[4]; // Use index 4 to stay before any method/target tokens
                    modified.elevation = element.elevation;
                    modified.method = 'none'; // No direct interaction initially
                    modified.title = `Remote-only ${element.id}`;
                    modified.context = `Modified ${element.id} to be remote-only`;

                    // Only apply modification if controllers are successfully added
                    if (panel && panel.addRemoteControllers(modified)) {
                        this.elements[idx] = modified.toString();
                        coversAdded++;
                    }
                }
            } else if (coverStyle === 3) {
                // Style 3: Switch Release
                const idx = this.elements.findIndex(e => e.split(/\s+/)[0] === element.id);
                if (idx !== -1 && ['c', 'r', 't', 's', 'w'].includes(element.type)) {
                    const tokens = element.elementString.split(/\s+/);
                    // Find space for the release switch before modifying the target
                    // Account for extra width: switches need swSize + 1 space for the ball
                    const swSize = 1;
                    const swPos = this.findFreeSpace(swSize + 1, 1);
                    if (swPos) {
                        const modified = new BuildElement(SHAPE_PREFIX_MAP[element.type] || 'circle');
                        modified.id = tokens[0];
                        modified.width = element.width;
                        modified.height = element.height;
                        modified.x = element.x;
                        modified.y = element.y;
                        modified.color = tokens[4]; // Use index 4 to stay before any method/target tokens
                        modified.elevation = element.elevation;
                        modified.method = 'none'; // Disabled initially
                        modified.context = `Released by switch`;

                        const sw = new BuildElement('switch');
                        sw.width = swSize;
                        sw.height = 1;
                        sw.x = swPos.x;
                        sw.y = swPos.y;

                        const ballColor = randBetween(1, 8);
                        const unsatisfiedPillColor = randBetween(1, 8);
                        let satisfiedPillColor = randBetween(1, 8);
                        while (satisfiedPillColor === unsatisfiedPillColor) {
                            satisfiedPillColor = randBetween(1, 8);
                        }
                        sw.color = `${unsatisfiedPillColor}-${satisfiedPillColor}-${ballColor}`;
                        sw.method = 'tap';
                        sw.change = 'state';
                        sw.targetState = 1;
                        sw.remoteActions = [{
                            id: modified.id,
                            type: 'configure',
                            method: 'drag',
                            change: 'none',
                            target: 0
                        }];

                        this.elements[idx] = modified.toString();
                        this.addElement(sw, false, `Release for ${modified.id}`);
                        coversAdded++;
                        this.remoteSetsCount++;
                    }
                }
            }
        }
    }
    applyMovementToCover(cover, movementType, elementId) {
        cover.title = `Cover for ${elementId} using ${movementType}`;
        switch (movementType) {
            case 'drag':
                cover.method = 'drag';
                cover.change = 'none';
                break;
            case 'tap':
                cover.method = 'tap';
                cover.change = 'color';
                cover.targetState = randBetween(0, 5);
                cover.remoteActions = [{
                    id: cover.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'none',
                    target: 0
                }];
                break;
            case 'screw':
                cover.method = 'hold';
                cover.change = 'rotate';
                cover.targetState = randBetween(1, 8);
                cover.remoteActions = [{
                    id: cover.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'none',
                    target: 0
                }];
                break;
            case 'remote':
                cover.method = 'none';
                cover.hasRemoteControllers = true;
                break;
        }
    }

    reserveGridSpace(elementString) {
        try {
            const tokens = elementString.split(/\s+/);
            const sizeStr = tokens[1];
            const locStr = tokens[2];

            let { width, height } = parseSize(sizeStr);
            if (tokens[0].toLowerCase().startsWith('w')) width += 1;

            // Remove elevation markers (+ or -) from location string
            const cleanLocStr = locStr.replace(/[+\-]/g, '');
            const parts = cleanLocStr.split('x');

            if (parts.length !== 2) {
                console.warn("Error parsing element for grid: Invalid location format:", elementString);
                return;
            }

            const xPart = parts[0];
            const yPart = parts[1];
            const x = Math.floor(parseFloat(xPart));
            const y = Math.floor(parseFloat(yPart));

            if (isNaN(x) || isNaN(y)) {
                console.warn("Error parsing element for grid: Invalid coordinates:", elementString);
                return;
            }

            const w = Math.ceil(width);
            const h = Math.ceil(height);

            for (let dy = 0; dy < h; dy++) {
                for (let dx = 0; dx < w; dx++) {
                    if (y + dy < 8 && x + dx < 8) {
                        this.grid[y + dy][x + dx] = true;
                    }
                }
            }
        } catch (e) {
            console.warn("Error parsing element for grid:", elementString, "Exception:", e.message);
        }
    }

    findFreeSpace(w, h) {
        const width = Math.ceil(w);
        const height = Math.ceil(h);

        for (let attempt = 0; attempt < 20; attempt++) {
            const rx = randBetween(0, 8 - width);
            const ry = randBetween(0, 8 - height);
            if (this.checkFree(rx, ry, width, height)) {
                return { x: rx, y: ry };
            }
        }

        for (let y = 0; y <= PANEL_GRID_SIZE - height; y++) {
            for (let x = 0; x <= PANEL_GRID_SIZE - width; x++) {
                if (this.checkFree(x, y, width, height)) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    checkFree(x, y, w, h) {
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        const endX = Math.ceil(x + w);
        const endY = Math.ceil(y + h);

        for (let iy = startY; iy < endY; iy++) {
            for (let ix = startX; ix < endX; ix++) {
                if (!this.grid[iy] || this.grid[iy][ix]) return false;
            }
        }
        return true;
    }

    toString() {
        const sorted = [...this.elements].sort((a, b) => {
            const aRaised = a.includes('+');
            const bRaised = b.includes('+');
            return aRaised - bRaised;
        });
        return `${this.color}:\n${sorted.join(',\n')}`;
    }

}


class ScrewTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
    }
    apply(panel, generator) {
        const numScrews = randBetween(1, 3);
        let elementsAdded = 0;

        for (let i = 0; i < numScrews; i++) {
            const screw = new BuildElement('screw');
            const hole = new BuildElement('circle');

            const screwSize = randBetween(1, 3);
            const holeSize = screwSize / 2;

            const pos = panel.findFreeSpace(screwSize, screwSize);
            if (!pos) continue;

            screw.x = pos.x;
            screw.y = pos.y;
            screw.setSize(screwSize);
            screw.setRandomColor();
            screw.method = 'hold';
            screw.change = 'rotate';
            screw.targetState = 3;
            screw.remoteActions = [{
                id: screw.id,
                type: 'configure',
                method: 'drag',
                change: 'move',
                target: 1
            }];
            screw.elevation = '+';

            hole.setSize(holeSize);
            hole.color = 1; // whiteish-grey for hole
            hole.elevation = '-';
            hole.x = screw.x + (screwSize - holeSize) / 2;
            hole.y = screw.y + (screwSize - holeSize) / 2;


            // Ensure the hole becomes a socket if it's meant to be interactable
            if (holeSize >= 1) {
                // If it's a plug/socket pair, force '=' method
                if (randBetween(1, 3) === 1 || generator.isFinalPanel()) {
                    hole.method = '=';

                    const plug = new BuildElement('circle');
                    plug.setSize(holeSize);
                    plug.color = 2; // blue plug
                    plug.elevation = '+';

                    // Randomly decide: drag method or remote controllers
                    const useRemoteControllers = randBetween(1, 3) === 1;
                    if (useRemoteControllers) {
                        plug.method = 'none';
                        plug.hasRemoteControllers = true;
                    } else {
                        plug.method = 'drag';
                    }

                    generator.setPlug(plug);
                }
            }

            // Element addition
            panel.addElement(hole, true, 'Screw Hole');
            panel.addElement(screw, true, 'Screw');
            elementsAdded++;
        }
    }
}


// Holes have sockets (sunken shapes) and plugs (draggable shapes to fill them)
class HoleTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
    }
    apply(panel, generator) {
        const numHoles = randBetween(1, 3);
        let holesCreated = 0;

        for (let i = 0; i < numHoles; i++) {
            const shape = DRAGGABLE_SHAPES[randBetween(0, DRAGGABLE_SHAPES.length - 1)];
            const size = randBetween(1, 2);
            const color = randBetween(0, 6);

            // Find space for socket first
            const socketPos = panel.findFreeSpace(size, size);
            if (!socketPos) continue; // Skip if no space for socket

            // Create socket (hole - sunken shape) only if we have space
            const hole = new BuildElement(shape);
            hole.width = hole.height = size;
            hole.color = color;
            hole.elevation = '-';
            hole.elevationTarget = ''; // Target elevation to apply when dragged
            hole.method = '='; // ALWAYS set method to '=' for HoleTechnique to ensure it's a socket
            hole.x = socketPos.x;
            hole.y = socketPos.y;

            panel.addElement(hole, true, 'Hole Socket');
            holesCreated++;

            // Create corresponding plug (draggable shape)
            const plug = new BuildElement(shape);
            plug.width = plug.height = size;
            plug.color = color;
            plug.elevation = '+';

            // Randomly decide: drag method or remote controllers
            const useRemoteControllers = randBetween(1, 5) === 1;
            if (useRemoteControllers) {
                // Don't set a method - it will have remote controllers instead
                plug.method = 'none';
                plug.hasRemoteControllers = true;
            } else {
                plug.method = 'drag';
                plug.hasRemoteControllers = false;
            }

            generator.setPlug(plug);
        }
    }
}

// Switches are self-contained (no plugs/sockets)
class SwitchTechnique {
    constructor() {
        this.hasPlugAndSocket = false;
    }
    apply(panel, generator) {
        const baseColor = randBetween(1, 6);
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

        // Determine valid startX based on max width
        const maxX = 7 - maxSwitchSize;
        const startX = randBetween(0, maxX);

        // Ensure switches fit vertically
        const maxStartY = 8 - numSwitches;
        const startY = randBetween(1, Math.max(1, maxStartY));

        // Consistent colors for the entire set of switches
        const setBallColor = randBetween(1, 8); // All switches use the same ball color
        const setUnsatisfiedColor = baseColor; // Base unsatisfied color
        let setSatisfiedColor = baseColor; // Satisfied color must differ from unsatisfied
        while (setSatisfiedColor === setUnsatisfiedColor) {
            setSatisfiedColor = randBetween(1, 8);
        }

        // Randomly decide if all switches get same unsatisfied background or random ones
        const uniformUnsatisfied = randBetween(0, 1) === 0; // 50% chance

        // Track switches for selective covering
        const switchElements = [];

        for (let i = 0; i < numSwitches; i++) {
            const { size, targetState } = switchConfigs[i];
            const sw = new BuildElement('switch');
            sw.width = size;
            sw.height = 1;
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
                unsatisfiedPillColor = randBetween(1, 8);
                while (unsatisfiedPillColor === setSatisfiedColor) {
                    unsatisfiedPillColor = randBetween(1, 8);
                }
            }

            // Satisfied background: consistent across set
            const satisfiedPillColor = setSatisfiedColor;

            sw.color = `${unsatisfiedPillColor}-${satisfiedPillColor}-${ballColor}`;
            sw.method = 'tap';
            sw.change = 'state';
            sw.targetState = targetState;
            sw.remoteActions = [];

            panel.addElement(sw, true, 'Switch');
        }

        // Randomly decide if each switch in the set should be covered
        for (const sw of switchElements) {
            if (randBetween(0, 1) === 0) {
                generator.setPlug(sw);
            }
        }
    }
}

class MazeTechnique {
    constructor() {
        this.hasPlugAndSocket = true;
    }
    apply(panel, generator) {
        let GRID_X = randBetween(5, 7);
        let GRID_Y = randBetween(5, 6); // Cap at 6 to always leave at least one row for buffer
        if (GRID_X % 2 === 0) GRID_X--;
        if (GRID_Y % 2 === 0) GRID_Y--;

        const { maze, entrance } = this.generateMaze(GRID_X, GRID_Y);
        const mazeColor = randBetween(0, COLOR_NAMES.length - 1);
        const size = 1;

        const mazeElements = [];
        let exitElement = null;
        let ballElement = null;

        for (let y = 0; y < GRID_Y; y++) {
            for (let x = 0; x < GRID_X; x++) {
                const shape = maze[y][x] ?? '_';
                if (shape === 'r') {
                    const wall = new BuildElement('rectangle');
                    wall.setSize(size);
                    wall.x = x;
                    wall.y = y;
                    wall.color = mazeColor;
                    wall.elevation = '+';
                    panel.addElement(wall, false, 'Maze Wall');
                } else if (shape === 'X') {
                    const exit = new BuildElement('circle');
                    exit.setSize(size);
                    exit.x = x;
                    exit.y = y;
                    exit.color = 1;
                    exit.elevation = '-';
                    exit.method = '='; // ALWAYS set method to '=' for Maze Exit to ensure it's a socket
                    exit.placed = true;
                    panel.addElement(exit, true, 'Maze Exit');
                    exitElement = exit;
                } else if (shape === 'O') {
                    const ball = new BuildElement('circle');
                    ball.setSize(size);
                    ball.x = x;
                    ball.y = y;
                    ball.color = 2; // blue
                    ball.elevation = '+';
                    ball.method = 'drag';

                    // Always put the ball in the plug pool if this is the final panel (i=0)
                    // otherwise 50% chance to put the ball in the plug pool instead of on the panel
                    if (panel.index === 0 || randBetween(0, 1) === 0) {
                        ballElement = ball;
                    } else {
                        panel.addElement(ball, true, 'Maze Ball');
                        ballElement = ball;
                    }
                } else if (shape === '_') {
                    // This is an empty passage cell ("gap")
                    // Collect coordinates for optional covering, but don't add as a physical element
                    mazeElements.push({ x, y });
                }
            }
        }

        // Decide what to cover in the maze
        // We always flag the socket and ball (if on panel) as coverable.
        // We also pick ONE random gap to be coverable as a VIRTUAL element.

        // If ball became a plug, it wasn't added to panel yet
        if (ballElement && !panel.elements.some(e => e.includes(ballElement.id))) {
            generator.setPlug(ballElement);
        }

        if (mazeElements.length > 0) {
            const gapPos = mazeElements[randBetween(0, mazeElements.length - 1)];
            // Register as a virtual coverable element
            panel.coverableElements.push({
                id: `gap-${gapPos.x}-${gapPos.y}`,
                elementString: `r 1x1 ${gapPos.x}x${gapPos.y}- 0 0 none`, // virtual string for parsing if needed
                width: 1,
                height: 1,
                x: gapPos.x,
                y: gapPos.y,
                elevation: '-',
                hasRemote: false,
                type: 'r'
            });
        }

        // Buffer Zone: Reserve space in panel grid directly below the maze entrance
        // This prevents remote controllers or distractors from blocking the path.
        const bufferY = GRID_Y; // Row directly below maze
        if (bufferY < 8) {
            for (let bx = 0; bx < GRID_X; bx++) {
                panel.grid[bufferY][bx] = true;
            }
            // console.log(`%c[Technique] Maze: Reserved row ${bufferY} (cols 0-${GRID_X - 1}) as buffer zone`, 'color: #999; font-style: italic;');
        }
    }

    generateMaze(width, height) {
        // Fill with walls
        const maze = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => "r")
        );

        const dirs = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];

        function shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = randBetween(0, i);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // DFS on odd cells, carving 2 steps at a time
        function carve(y, x) {
            maze[y][x] = "_";
            const shuffled = shuffle([...dirs]);
            for (const [dy, dx] of shuffled) {
                const ny = y + dy * 2;
                const nx = x + dx * 2;
                if (
                    ny >= 1 && ny < height - 1 &&
                    nx >= 1 && nx < width - 1 &&
                    maze[ny][nx] === "r"
                ) {
                    maze[y + dy][x + dx] = "_";
                    carve(ny, nx);
                }
            }
        }

        const startY = 1 + (randBetween(0, Math.floor((height - 2) / 2) - 1) * 2);
        const startX = 1 + (randBetween(0, Math.floor((width - 2) / 2) - 1) * 2);
        carve(startY, startX);

        // Choose entrance on an edge, adjacent to a passage
        let entranceY, entranceX;
        const edgeCandidates = [];

        // Only consider bottom edge for entrance
        for (let x = 1; x < width - 1; x++) {
            if (maze[height - 2][x] === "_") edgeCandidates.push([height - 1, x]);
        }

        if (edgeCandidates.length === 0) {
            // Fallback: pick a random internal passage and tunnel straight to bottom edge
            const internal = [];
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    if (maze[y][x] === "_") internal.push([y, x]);
                }
            }

            // Pick random internal point
            const [iy, ix] = internal[randBetween(0, internal.length - 1)];

            // Force tunnel to bottom
            for (let y = iy; y < height; y++) maze[y][ix] = "_";
            entranceY = height - 1; entranceX = ix;
        } else {
            [entranceY, entranceX] = edgeCandidates[randBetween(0, edgeCandidates.length - 1)];
            maze[entranceY][entranceX] = "O";
        }

        // BFS from entrance to find farthest internal passage for exit
        const dist = Array.from({ length: height }, () =>
            Array.from({ length: width }, () => -1)
        );
        const queue = [];
        dist[entranceY][entranceX] = 0;
        queue.push([entranceY, entranceX]);

        while (queue.length) {
            const [y, x] = queue.shift();
            for (const [dy, dx] of dirs) {
                const ny = y + dy;
                const nx = x + dx;
                if (
                    ny >= 0 && ny < height &&
                    nx >= 0 && nx < width &&
                    maze[ny][nx] === "_" &&
                    dist[ny][nx] === -1
                ) {
                    dist[ny][nx] = dist[y][x] + 1;
                    queue.push([ny, nx]);
                }
            }
        }

        // Farthest internal cell as exit
        let exitY = -1, exitX = -1, maxD = -1;
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (maze[y][x] === "_" && dist[y][x] > maxD) {
                    maxD = dist[y][x];
                    exitY = y;
                    exitX = x;
                }
            }
        }

        if (exitY !== -1) {
            maze[exitY][exitX] = "X";
        }

        return { maze, entrance: { x: entranceX, y: entranceY } };
    }
}

class GroupTechnique {
    constructor() {
        this.hasPlugAndSocket = false;
    }
    apply(panel, generator) {
        // Try to get a plug to use as a template
        // Reject switches since they can't be moved to reveal things underneath
        let plug = generator.getPlug();
        if (plug && plug.type === 'w') {
            generator.setPlug(plug);
            plug = null;
        }

        const templateShape = plug ? SHAPE_PREFIX_MAP[plug.type] || 'rectangle' : DRAGGABLE_SHAPES[randBetween(0, DRAGGABLE_SHAPES.length - 1)];
        const templateWidth = plug ? plug.width : randDecimal(1, 2);
        const templateHeight = plug ? plug.height : randDecimal(1, 2);

        const keyColor = plug ? plug.color : randBetween(0, COLOR_ARRAY.length - 1);
        let baseColor = randBetween(0, COLOR_ARRAY.length - 1);
        while (baseColor === keyColor) {
            baseColor = randBetween(0, COLOR_ARRAY.length - 1);
        }

        const pendingPlugsCount = generator.availablePlugs.length;
        const greedinessReduction = pendingPlugsCount > 1 ? 2 : 0;

        // Calculate grid dimensions
        const maxCols = Math.max(2, Math.floor(PANEL_GRID_SIZE / templateWidth) - greedinessReduction);
        const maxRows = Math.max(2, Math.floor(PANEL_GRID_SIZE / templateHeight) - greedinessReduction);
        const cols = Math.min(randBetween(3, 5), maxCols);
        const rows = Math.min(randBetween(2, 4), maxRows);

        // Find space for the whole grid
        const gridWidth = cols * templateWidth;
        const gridHeight = rows * templateHeight;
        const gridPos = panel.findFreeSpace(gridWidth, gridHeight);

        if (!gridPos) {
            // Fallback: if we had a plug, put it back or try to place it alone
            if (plug) generator.setPlug(plug);
            return;
        }

        // Patterns: 0=All, 1=Checkerboard, 2=Random
        const pattern = randBetween(0, 2);
        const candidates = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let keep = true;
                if (pattern === 1) keep = (r + c) % 2 === 0;
                else if (pattern === 2) keep = Math.random() < 0.7;

                if (keep) {
                    const el = new BuildElement(templateShape);
                    el.width = templateWidth;
                    el.height = templateHeight;
                    el.x = gridPos.x + c * templateWidth;
                    el.y = gridPos.y + r * templateHeight;
                    el.color = baseColor;
                    el.elevation = ''; // Start flat to avoid collisions/traps
                    el.elevationTarget = '+'; // Gain raised status when dragged
                    candidates.push(el);
                }
            }
        }

        if (candidates.length === 0) {
            if (plug) generator.setPlug(plug);
            return;
        }

        // Pick 1-2 key elements
        const numKeys = Math.min(candidates.length, randBetween(1, 2));
        const keyIndices = new Set();
        while (keyIndices.size < numKeys) {
            keyIndices.add(randBetween(0, candidates.length - 1));
        }

        candidates.forEach((el, index) => {
            if (keyIndices.has(index)) {
                el.method = 'tap';
                el.change = 'color';
                el.targetState = keyColor;
                el.remoteActions = [{
                    id: el.id,
                    type: 'configure',
                    method: 'drag',
                    change: 'move',
                    target: 1
                }];
            } else {
                el.method = 'none';
            }
            panel.addElement(el, false, 'Group Element');
        });
    }
}



class PuzzleGenerator {
    constructor() {
        this.techniques = {
            'screw': new ScrewTechnique(),
            'hole': new HoleTechnique(),
            'switch': new SwitchTechnique(),
            'maze': new MazeTechnique(),
            'group': new GroupTechnique()
        };
        this.techniquesList = Object.values(this.techniques);
        this.plugAndSocketTechniques = this.techniquesList.filter(t => t.hasPlugAndSocket);
        this.otherTechniques = this.techniquesList.filter(t => !t.hasPlugAndSocket);

        this.availablePlugs = []; // Pool of plugs available for placement
        this.panels = []; // Generated panels
        this.currentPanelIndex = 0; // Track the index of the panel currently being generated
    }

    getTechnique(name) {
        return this.techniques[name] || this.techniquesList[randBetween(0, this.techniquesList.length - 1)];
    }

    setPlug(plug) {
        this.availablePlugs.push(plug);
    }

    getPlug() {
        if (this.availablePlugs.length === 0) return null;
        const plugIndex = randBetween(0, this.availablePlugs.length - 1);
        const plug = this.availablePlugs[plugIndex];
        this.availablePlugs.splice(plugIndex, 1);
        return plug;
    }

    isFinalPanel() {
        return this.currentPanelIndex === 0;
    }

    generate() {
        elementIdCounter = 1;
        this.availablePlugs = [];
        this.panels = [];
        const panelCount = randBetween(PUZZLE_CONFIG.MIN_PANELS, PUZZLE_CONFIG.MAX_PANELS);

        for (let i = 0; i < panelCount; i++) {
            const panel = new GeneratedPanel(i, panelCount);
            this.currentPanelIndex = i; // Track current panel index for techniques

            // Apply techniques to generate sockets and plugs
            let techCount = randBetween(PUZZLE_CONFIG.MIN_TECHNIQUES, PUZZLE_CONFIG.MAX_TECHNIQUES);

            // SPECIAL CASE: The first panel generated (i=0) is the LAST panel seen by the user.
            // We want it to HAVE a socket that requires a plug from a PREVIOUS panel.
            if (i === 0) {
                // Force a technique that has a plug and socket
                const tech = this.plugAndSocketTechniques[randBetween(0, this.plugAndSocketTechniques.length - 1)];
                tech.apply(panel, this);
                // console.log(`%c[Generator] Final Panel (i=0): Forced plug technique (${tech.constructor.name})`, 'color: #33cc33');
            } else if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.forcePanelTypes && DEBUG_CONFIG.panelTypes[i]) {
                const technique = this.getTechnique(DEBUG_CONFIG.panelTypes[i]);
                technique.apply(panel, this);
            } else {
                // Random technique selection (normally 1)
                for (let j = 0; j < techCount; j++) {
                    const randomTech = this.techniquesList[randBetween(0, this.techniquesList.length - 1)];
                    randomTech.apply(panel, this);
                }
            }

            // Add plugs from pool to appropriate panel
            // On final panel, add all remaining plugs to ensure every socket can be completed
            let numPlugsToAdd;
            if (i === panelCount - 1) {
                numPlugsToAdd = this.availablePlugs.length;
            } else if (i === 0) {
                // For the VERY FIRST generated panel (the final one user sees),
                // we strictly EXCLUDE all plugs. This forces them to be found on previous panels.
                numPlugsToAdd = 0;
                // console.log(`%c[Generator] Final Panel (i=0): Strictly excluding all ${this.availablePlugs.length} plug(s) for previous panels`, 'color: #3399ff; font-weight: bold;');
            } else if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.forcePlugsToNextPanel) {
                // In debug mode with forced next-panel: skip plugs, they'll go to next panel
                numPlugsToAdd = 0;
            } else {
                numPlugsToAdd = Math.min(
                    randBetween(0, Math.max(1, this.availablePlugs.length)),
                    panel.findFreeSpace(1, 1) ? randBetween(0, 2) : 0
                );
            }

            // Place plugs on current panel
            for (let j = 0; j < numPlugsToAdd; j++) {
                const plug = this.getPlug();
                if (!plug) break;
                if (plug.placed) break;

                const plugPos = panel.findFreeSpace(plug.width, plug.height);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;

                    // If plug has remote controllers, try to add them
                    if (plug.hasRemoteControllers) {
                        const success = panel.addRemoteControllers(plug);
                        if (!success) {
                            // Panel limit reached or no space: reset plug to draggable to keep puzzle solvable
                            plug.method = 'drag';
                            plug.hasRemoteControllers = false;
                            // console.log(`%c[Generator] Remote limit reached for panel ${panel.index}, resetting plug ${plug.id} to drag`, 'color: #888');
                        }
                    }

                    panel.addPlug(plug);
                } else {
                    // Put it back if no space
                    this.setPlug(plug);
                    break;
                }
            }

            // Optionally add covers over some elements (30% chance per panel)
            if (randBetween(1, 4) <= 3) {
                panel.addCoverings(panel, this, .6);
            }

            this.panels.push(panel);

            // FINAL CHECK: Ensure the panel is not auto-completed.
            // If it has no active goals (only decorative elements and satisfied plugs), force a switch technique.
            if (!panel.hasActiveGoal()) {
                // console.log(`%c[Generator] Panel ${panel.index}: No active goals detected, forcing SwitchTechnique`, 'color: #888');
                this.techniques.switch.apply(panel, this);
            }
        }

        // LAST RESORT: If we still have plugs that weren't placed, add more panels
        let salt = 0;
        while (this.availablePlugs.length > 0 && salt < 5) {
            // console.log(`%c[Generator] Last Resort: Adding panel ${this.panels.length} for ${this.availablePlugs.length} remaining plug(s)`, 'color: #ff9900; font-weight: bold;');
            const panel = new GeneratedPanel(this.panels.length, this.panels.length + 1);
            this.currentPanelIndex = panel.index;

            // Place as many plugs as we can fit
            const initialPlugCount = this.availablePlugs.length;
            for (let j = 0; j < initialPlugCount; j++) {
                const plug = this.getPlug();
                if (!plug) break;

                const plugPos = panel.findFreeSpace(plug.width, plug.height);
                if (plugPos) {
                    plug.x = plugPos.x;
                    plug.y = plugPos.y;
                    panel.addPlug(plug);
                } else {
                    this.setPlug(plug); // Put back
                }
            }

            // If we placed nothing, force a technique to make space or just stop
            if (this.availablePlugs.length === initialPlugCount) {
                // console.log(`%c[Generator] Last Resort: Could not place any plugs on new panel, stopping.`, 'color: #ff0000');
                break;
            }

            this.panels.push(panel);
            salt++;
        }

        // Final normalization of panel total counts
        this.panels.forEach(p => p.totalPanels = this.panels.length);
    }

    toString() {
        const message = VICTORY_MESSAGES[randBetween(0, VICTORY_MESSAGES.length - 1)];
        const reward = chooseReward();
        const panelsStr = this.panels.map(p => p.toString()).join('\n/\n');
        return `${message} [${reward}]\n/\n${panelsStr}`;
    }
}

function chooseReward() {
    return REWARDS[randBetween(0, REWARDS.length - 1)];
}

function buildReward(reward) {
    return `<div class="reward" title="Reward ${reward}">
                <i class="fa-solid fa-${reward}"></i>
            </div>`;
}

// Global instance
const generator = new PuzzleGenerator();
function generateRandomPuzzle() {
    generator.generate();
    return generator.toString();
}

const panelOverrides = []; // ['screw', 'switch', 'hunt'
let currentGame = null;
let currentPuzzleIndex = 0;
let sharedPuzzle = null;
let randomPuzzle = null; // Generate on demand, not at module load
let thisPuzzle = '';

function loadPuzzle(index) {
    clearArea('puzzle');
    clearArea('storage');

    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedPuzzle = urlParams.get('p');

    if (hasSharedPuzzle && index === 0) {
        thisPuzzle = sharedPuzzle;
    } else if ((!hasSharedPuzzle && index === 0) || (hasSharedPuzzle && index === 1)) {
        if (!randomPuzzle) {
            randomPuzzle = generateRandomPuzzle(panelOverrides);
        }
        thisPuzzle = randomPuzzle;
    } else {
        const staticIndex = hasSharedPuzzle ? index - 2 : index - 1;
        thisPuzzle = puzzleConfigs[staticIndex];
    }

    // console.log("Loading\n:", thisPuzzle, "\n");
    currentGame = new Game(thisPuzzle);
    currentPuzzleIndex = index;

    // Log request to server (silent)
    fetch(`server.php?p=${currentPuzzleIndex}`).catch(() => { });
}

function clearArea(areaName) {
    const area = document.getElementById(`${areaName}-area`);
    area.innerHTML = '';
}

function populatePuzzleSelect() {
    const select = document.getElementById("puzzle-select");
    select.innerHTML = "";

    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedPuzzle = urlParams.get('p');

    let optionIndex = 0;

    // Add Shared option if present
    if (hasSharedPuzzle) {
        const option = document.createElement("option");
        option.value = optionIndex++;
        option.textContent = "Shared";
        select.appendChild(option);
    }

    // Add Random option
    const randomOption = document.createElement("option");
    randomOption.value = optionIndex++;
    randomOption.textContent = "Random";
    select.appendChild(randomOption);

    // Add static puzzles
    puzzleConfigs.forEach((config, index) => {
        const option = document.createElement("option");
        option.value = optionIndex++;
        option.textContent = `Puzzle ${index + 1}`;
        select.appendChild(option);
    });
}

// Rewards Manager
class RewardsManager {
    static STORAGE_KEY = 'mookon_rewards';

    // Map reward names to Font Awesome icon classes
    static ICON_MAP = {
        'pencil': 'fa-pencil',
        'book': 'fa-book',
        'dice': 'fa-dice',
        'star': 'fa-star',
        'trophy': 'fa-trophy',
        'key': 'fa-key',
        'gem': 'fa-gem',
        'crown': 'fa-crown',
        'heart': 'fa-heart',
        'flag': 'fa-flag',
        'medal': 'fa-medal',
        'award': 'fa-award',
        'gift': 'fa-gift',
        'lightbulb': 'fa-lightbulb',
        'compass': 'fa-compass',
        'map': 'fa-map',
        'scroll': 'fa-scroll',
        'feather': 'fa-feather',
        'shield': 'fa-shield',
        'wand': 'fa-wand-magic-sparkles'
    };

    static loadRewards() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load rewards:', e);
            return [];
        }
    }

    static saveRewards(rewards) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rewards));
        } catch (e) {
            console.error('Failed to save rewards:', e);
        }
    }

    static addReward(rewardName) {
        const rewards = this.loadRewards();
        if (!rewards.includes(rewardName)) {
            rewards.push(rewardName);
            this.saveRewards(rewards);
        }
        this.renderRewards();
    }

    static renderRewards() {
        const rewardsArea = document.getElementById('rewards-area');
        if (!rewardsArea) return;

        const rewards = this.loadRewards();
        rewardsArea.innerHTML = '';

        rewards.forEach(rewardName => {
            const icon = document.createElement('i');
            icon.className = `fas ${this.getIconClass(rewardName)} reward-collected`;
            icon.title = rewardName;
            rewardsArea.appendChild(icon);
        });
    }

    static getIconClass(rewardName) {
        const normalized = rewardName.toLowerCase().trim();
        return this.ICON_MAP[normalized] || 'fa-star'; // Default to star if unknown
    }

    static createRewardIcon(rewardName, onClickCallback) {
        const icon = document.createElement('i');
        icon.className = `fas ${this.getIconClass(rewardName)} reward-icon`;
        icon.title = `Click to collect: ${rewardName}`;
        icon.style.cursor = 'pointer';

        icon.addEventListener('click', () => {
            this.addReward(rewardName);
            if (onClickCallback) onClickCallback(icon);
        });

        return icon;
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Initialize SVG factory for filters
    if (typeof SVGFactory !== 'undefined') SVGFactory.init();

    // Load and render saved rewards
    RewardsManager.renderRewards();

    populatePuzzleSelect();
    const selector = document.getElementById('puzzle-select');

    selector.addEventListener('change', (e) => {
        const newIndex = parseInt(e.target.value);
        if (newIndex !== currentPuzzleIndex) {
            loadPuzzle(newIndex);
        }
    });

    // Only load default puzzle if no shared puzzle parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('p')) {
        loadPuzzle(0);
    }
    populatePuzzleSelect();
});


function confettiBurst() {
    const colors = ["#ff4757", "#1e90ff", "#2ed573", "#ffa502", "#eccc68"];
    const numPieces = 80;

    for (let i = 0; i < numPieces; i++) {
        const piece = document.createElement("div");
        piece.classList.add("confetti-piece");

        // Random color
        piece.style.backgroundColor = colors[randBetween(0, colors.length - 1)];

        // Random horizontal start
        piece.style.left = randDecimal(0, 100) + "vw";

        // Random size
        const w = randDecimal(6, 12);
        const h = randDecimal(4, 8);
        piece.style.width = w + "px";
        piece.style.height = h + "px";

        // Random rotation
        piece.style.transform = `rotate(${randBetween(0, 360)}deg)`;

        // Random delay + random speed
        const delay = randDecimal(0, 500);
        const duration = randDecimal(1500, 3500); // 0.7s â†’ 1.9s

        piece.style.animationDelay = delay + "ms";
        piece.style.animationDuration = duration + "ms";

        document.body.appendChild(piece);

        // Clean up
        setTimeout(() => piece.remove(), duration + delay + 50);
    }
}

// Info dialog functionality
document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('info-button');
    const infoDialog = document.getElementById('info-dialog');
    const infoClose = document.getElementById('info-close');
    const reloadButton = document.getElementById('reload-button');
    const newButton = document.getElementById('new-button');

    if (infoButton) {
        infoButton.addEventListener('click', () => {
            infoDialog.classList.remove('hidden');
            console.log("This puzzle:\n", thisPuzzle, "\n");
        });
    }

    if (infoClose) {
        infoClose.addEventListener('click', () => {
            infoDialog.classList.add('hidden');
        });
    }

    if (infoDialog) {
        infoDialog.addEventListener('click', (e) => {
            if (e.target === infoDialog) {
                infoDialog.classList.add('hidden');
            }
        });
    }

    if (reloadButton) {
        reloadButton.addEventListener('click', () => {
            loadPuzzle(currentPuzzleIndex);
        });
    }

    if (newButton) {
        newButton.addEventListener('click', () => {
            location.reload();
        });
    }

});
// Encode/decode functions with separate message and puzzle encoding
const PUZZLE_CHARSET = 'ctswr0123456789abdefghiABCDEFGHI .,:/-><=jkmnopuvxyz';
const MESSAGE_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ !.0123456789+-,';
const MESSAGE_DELIMITER = '|';
const ROT_STEP = 9;
const WORD_MAP = {
    'tap': 'a', 'drag': 'b', 'hold': 'd', 'color': 'e', 'state': 'f', 'rotation': 'g', 'none': 'h', 'move': 'i'
};

function encodePuzzle(puzzleString) {
    const parts = puzzleString.split('/');
    const message = parts[0].trim();
    const puzzleData = parts.slice(1).join('/');

    // Encode message with full charset
    const encodedMessage = message.split('').map(char => {
        const index = MESSAGE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return MESSAGE_CHARSET[(index + ROT_STEP) % MESSAGE_CHARSET.length];
    }).join('');

    // Encode puzzle data with compact charset
    let compressedPuzzle = puzzleData.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');

    Object.entries(WORD_MAP).forEach(([word, symbol]) => {
        compressedPuzzle = compressedPuzzle.replace(new RegExp(word, 'g'), symbol);
    });

    const encodedPuzzle = compressedPuzzle.split('').map(char => {
        const index = PUZZLE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return PUZZLE_CHARSET[(index + ROT_STEP) % PUZZLE_CHARSET.length];
    }).join('');

    const combined = encodedMessage + MESSAGE_DELIMITER + encodedPuzzle;
    return LZString.compressToEncodedURIComponent(combined);
}

function decodePuzzle(encodedString) {
    const decompressed = LZString.decompressFromEncodedURIComponent(encodedString);
    const [encodedMessage, encodedPuzzleData] = decompressed.split(MESSAGE_DELIMITER);

    // Decode message (no word decompression)
    const message = encodedMessage.split('').map(char => {
        const index = MESSAGE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return MESSAGE_CHARSET[(index - ROT_STEP + MESSAGE_CHARSET.length) % MESSAGE_CHARSET.length];
    }).join('');

    // Decode puzzle data
    let puzzleData = encodedPuzzleData.split('').map(char => {
        const index = PUZZLE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return PUZZLE_CHARSET[(index - ROT_STEP + PUZZLE_CHARSET.length) % PUZZLE_CHARSET.length];
    }).join('');

    // Decompress words ONLY in puzzle data (not message)
    puzzleData = puzzleData.replace(/\bg\b/g, 'rotation');
    puzzleData = puzzleData.replace(/\be\b/g, 'color');
    puzzleData = puzzleData.replace(/\bf\b/g, 'state');
    puzzleData = puzzleData.replace(/\bd\b/g, 'hold');
    puzzleData = puzzleData.replace(/\bb\b/g, 'drag');
    puzzleData = puzzleData.replace(/\ba\b/g, 'tap');
    puzzleData = puzzleData.replace(/\bh\b/g, 'none');
    puzzleData = puzzleData.replace(/\bi\b/g, 'move');

    return message + '/' + puzzleData;
}

// Share functionality
document.addEventListener('DOMContentLoaded', () => {
    const shareButton = document.getElementById('share-button');

    if (shareButton) {
        shareButton.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const hasSharedPuzzle = urlParams.get('p');

            let currentPuzzle = '';
            if (hasSharedPuzzle && currentPuzzleIndex === 0) {
                currentPuzzle = sharedPuzzle;
            } else if ((!hasSharedPuzzle && currentPuzzleIndex === 0) || (hasSharedPuzzle && currentPuzzleIndex === 1)) {
                currentPuzzle = randomPuzzle;
            } else {
                const staticIndex = hasSharedPuzzle ? currentPuzzleIndex - 2 : currentPuzzleIndex - 1;
                currentPuzzle = puzzleConfigs[staticIndex];
            }

            const encoded = encodePuzzle(currentPuzzle);
            const shareUrl = `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(encoded)}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                shareButton.textContent = 'Copied';
            }).catch(() => {
                alert('Unable to add to clipboard: ', shareUrl);
            });
        });
    }
});

// Check for puzzle parameter on load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleParam = urlParams.get('p');

    if (puzzleParam) {
        try {
            sharedPuzzle = decodePuzzle(decodeURIComponent(puzzleParam));
            currentPuzzleIndex = 0;
            populatePuzzleSelect();
            loadPuzzle(0);
        } catch (e) {
        }
    }
});
