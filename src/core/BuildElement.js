// when generating puzzle these confirm elements are within bounds and have matching elements for satisfaction.
class BuildElement extends BaseElement {
    constructor(id) {
        super(id);
    }

    // Adjust width and height to fit within the 8x8 panel grid
    clampToPanel() {
        const scale = SHAPES[SHAPE_PREFIX_MAP[this.type]]?.scale || 1;

        // Handle negative coordinates
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;

        // Clamp width/height based on visual scale
        if (this.x + (this.gridWidth * scale) > 8) {
            this.gridWidth = Math.max(0.2, (8 - this.x) / scale);
        }
        if (this.y + (this.gridHeight * scale) > 8) {
            this.gridHeight = Math.max(0.2, (8 - this.y) / scale);
        }
    }

    // assign a location but make sure its not out of bounds of the panel
    keepInBounds() {
        if (randBetween(1, 3) < 2) {
            this.x = randBetween(0, 1) === 0 ? 0 : Math.max(0, 8 - this.gridWidth);
            this.y = randBetween(0, 1) === 0 ? 0 : Math.max(0, 8 - this.gridHeight);
        } else {
            this.x = randBetween(0, Math.max(0, 8 - this.gridWidth));
            this.y = randBetween(0, Math.max(0, 8 - this.gridHeight));
        }

        this.clampToPanel();
    }

    toString() {
        this.clampToPanel(); // Guarantee valid configuration before stringifying

        const round = (val) => Math.round(val * 100) / 100;
        const w = round(this.gridWidth);
        const h = round(this.gridHeight);
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

        // Global safeguard: No interactive elements smaller than minimum size
        // User requested NOT to strip interactivity based on size.
        // "I dont think you should strip interactivity from anything based on its size."
        // Instead, we will ensure generated elements are large enough in the generators.

        const effectiveMethod = this.method;

        let configString = `${this.id} ${w}x${h} ${x}x${y}${this.elevation} 0 ${color}`;
        configString += effectiveMethod === '' ? '' : ` ${effectiveMethod}`;

        if (this.state && this.state !== 0) {
            configString += ` state ${this.state}`;
        }

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
            if (action.type === 'reset') {
                configString += ` reset`;
            } else if (action.type === 'size') {
                configString += ` size`;
            } else if (action.type === 'cycle') {
                configString += ` cycle`;
            } else if (action.type === 'move_step') {
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
};
