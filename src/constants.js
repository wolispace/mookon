// Global constants and configuration

// Panel and element sizing
const PANEL_GRID_SIZE = 8;
const PADDING = 12;
const BORDER = 3;

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
    'circle': { code: 'c', draggable: true, scale: 1 },
    'rectangle': { code: 'r', draggable: true, scale: 1 },
    'triangle': { code: 't', draggable: true, scale: 1.5 },
    'screw': { code: 's', draggable: true, scale: 1 },
    'plus': { code: 'p', draggable: true, scale: 1.5 },
    'diamond': { code: 'd', draggable: true, scale: 1.5 },
    'switch': { code: 'w', draggable: false, scale: 1 }
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
const CHANGE_SIZE = 'size';
const CHANGE_MOVE = 'move';
const CHANGE_NONE = 'none';

const CHANGE_NAMES = [CHANGE_COLOR, CHANGE_ROTATION, CHANGE_STATE, CHANGE_SIZE, CHANGE_MOVE, CHANGE_NONE];
const CHANGE_PATTERN = new RegExp(`^(${CHANGE_NAMES.filter(c => c !== CHANGE_NONE).join('|')})$`);

// Size comparison constants
const COMPARISON_EQUAL = '=';
const COMPARISON_STRICT = '#';
const COMPARISON_GREATER = '>';
const COMPARISON_LESS = '<';

const COMPARISON_NAMES = [COMPARISON_EQUAL, COMPARISON_STRICT, COMPARISON_GREATER, COMPARISON_LESS];
const COMPARISON_PATTERN = new RegExp(`^[${COMPARISON_NAMES.join('')}]$`);

// Pattern constants
const ELEMENT_ID_PATTERN = /^[ctswrpd]\d+$/;
const NUMERIC_PATTERN = /^\d+$/;

// Puzzle generation configuration
const PUZZLE_CONFIG = {
    MIN_PANELS: 2,
    MAX_PANELS: 5,
    MIN_TECHNIQUES: 1, // Per panel
    MAX_TECHNIQUES: 1,
    FORCE_MAZE: false // Option to favor maze generation
};

// Debug configuration - set to override random generation
const DEBUG_CONFIG = {
    enabled: false,
    technique: 'hole', // forced technique: 'screw', 'hole', 'switch', 'maze', 'group'
    coverStyle: null      // Set to null to allow random stacking in debug mode
};

let elementIdCounter = 1;


let globalZIndex = 1000;



const panelOverrides = []; // ['screw', 'switch', 'hunt'
let currentGame = null;
let currentPuzzleIndex = 0;
let sharedPuzzle = null;
let randomPuzzle = null; // Generate on demand, not at module load
let thisPuzzle = '';

//end const
