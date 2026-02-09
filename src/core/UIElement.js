// Elements build from config to end up in the UI
class UIElement extends BaseElement {
    constructor(panel, shape) {
        super(shape);
        this.panel = panel;
        this.filled = false;
        this.filler = null; // Track who is filling us (for sockets)
        this.socket = null; // Track which socket we are in (for plugs)
    }

    toString() {
        if (!this.isSatisfied()) {
            // console.log(`${this.id}: method=${this.method}, change=${this.change}, targetState=${this.targetState}, state=${this.state}, remoteActions=${JSON.stringify(this.remoteActions)}`);
        }
    }

    initialize() {
        // Store initial size for cycling logic if not already set
        if (this.initialSize === undefined) {
            this.initialSize = this.size;
        }

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

        // Fix: Explicitly set elevation based on height if not already set
        if (this.height > 0 && this.height < 2) {
            this.elevation = '+';
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
        if (this.height < 0 && this.height > -2) {
            this.elevation = '-';
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

        // Store initial properties for reset capability
        // MOVED TO END to ensure all properties (like elevation) are captured after setup
        this.initialConfig = {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            state: this.state,
            elevation: this.elevation,
            elevationTarget: this.elevationTarget,
            method: this.method,
            change: this.change,
            targetState: this.targetState,
            draggable: this.draggable,
            filled: this.filled
        };
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

        // console.log(`[setupEvents] ${this.id} method=${this.method} remoteId=${this.remoteId || 'none'}`);

        target.addEventListener('mousedown', this.boundHandleStart);
        target.addEventListener('touchstart', this.boundHandleStart, { passive: false });

        if (this.method !== METHOD_DRAG) {
            target.addEventListener('click', this.boundHandleClick);
        }

        if (!this.windowEventsSet) {
            this.windowEventsSet = true;
            window.addEventListener('mouseup', () => this.handleEnd());
            window.addEventListener('touchend', () => this.handleEnd());
        }
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
            e.preventDefault();
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
        this.applyState();
        this.checkTargetState();
    }

    applyState() {
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
        } else if (this.change === CHANGE_SIZE) {
            // Fixed range: 1.0 to 2.0 in 0.25 steps, ping-pong cycle
            const sizes = [1.0, 1.25, 1.5, 1.75, 2.0, 1.75, 1.5, 1.25];
            const scale = SHAPES[this.shape]?.scale || 1;
            const newSize = sizes[this.state % sizes.length] * scale;
            this.setSize(newSize);

            // Re-initialize to update SVG and event listeners
            const oldElement = this.element;
            const parent = oldElement.parentElement;
            this.initialize();
            if (parent && oldElement.parentElement === parent) {
                parent.replaceChild(this.element, oldElement);
            }
        } else {
            this.updateVisuals();
        }
    }

    checkTargetState() {
        // Check if we should trigger remote actions
        // console.log(`${this.id} checking target state: current=${this.state}, target=${this.targetState}, method=${this.method}, change=${this.change}`);

        let shouldTrigger = false;

        // Standard trigger: state matches target
        // OR unreachable target state (allows for continuous controllers)
        if (this.state === this.targetState || (typeof this.targetState === 'number' && this.targetState > this.maxState)) {
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
                            if (remoteAction.type === 'reset') {
                                targetElement.reset();
                            } else if (remoteAction.type === 'move_step') {
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

                            } else if (remoteAction.type === 'cycle') {
                                // Simplified Cycle Action: Just progress the target's state
                                targetElement.progressState();
                            } else {
                                // Existing Configure Logic
                                targetElement.method = remoteAction.method;
                                if (remoteAction.change !== CHANGE_NONE) {
                                    targetElement.change = remoteAction.change;
                                    targetElement.targetState = remoteAction.target;

                                    if (targetElement.change === CHANGE_SIZE) {
                                        targetElement.maxState = 4;
                                    }

                                    if (remoteAction.change === CHANGE_MOVE) {
                                        targetElement.state = 0;
                                    } else {
                                        // Synchronization Logic:
                                        // If this (controller) has a change property, sync the target's state to this state.
                                        // Otherwise (if this is just a button), trigger target state progression.
                                        if (this.change !== CHANGE_NONE) {
                                            targetElement.state = this.state % (targetElement.maxState + 1);
                                            targetElement.applyState();
                                        } else {
                                            targetElement.progressState();
                                        }
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

            // Update grid coordinates for later re-initialization (e.g. on resize)
            this.x = relativeX;
            this.y = relativeY;

            // Re-enable transitions after a frame
            requestAnimationFrame(() => {
                this.element.style.transition = '';
            });
        } else if (!targetPanel && currentParent !== storageArea) {
            // Move to storage area
            const storageRect = storageArea.getBoundingClientRect();
            const cellSize = getElementSize();

            this.element.style.transition = 'none';
            storageArea.appendChild(this.element);

            const relativeX = (currentRect.left - storageRect.left) / cellSize;
            const relativeY = (currentRect.top - storageRect.top) / cellSize;

            this.element.style.position = 'absolute';
            this.element.style.left = `${currentRect.left - storageRect.left}px`;
            this.element.style.top = `${currentRect.top - storageRect.top}px`;
            this.element.style.zIndex = '2';

            this.x = relativeX;
            this.y = relativeY;

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
                if (sunkenElement.sizeComparison === COMPARISON_STRICT) {
                    if (draggedSize !== sunkenSize || this.color !== sunkenElement.color) {
                        continue;
                    }
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
                this.element.classList.add('done');

                // Return element to the sunken element's panel
                sunkenPanel.container.appendChild(this.element);
                this.element.style.position = 'absolute';
                this.element.style.left = `${targetX}px`;
                this.element.style.top = `${targetY}px`;

                // Mark sunken element as filled
                sunkenElement.filled = true;
                sunkenElement.filler = this; // Store reference to the filler
                this.socket = sunkenElement; // Store reference to the socket we are in

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

        if (this.elevation === '-') {
            return this.filled;
        }
        if (this.shape === 'switch' && this.method === METHOD_TAP) {
            const target = parseInt(this.targetState);
            // unreachable target states are satisfied (trap switches)
            if (target > this.maxState) return true;
            return this.state == target;
        }
        if (this.method === METHOD_DRAG) {
            // Elements with move requirement must reach target state
            if (this.change === CHANGE_MOVE && this.targetState !== 0) {
                return this.state == this.targetState;
            }
            return this.filled;
        }

        if (this.method === METHOD_NONE) {
            return true;
        }

        // Elements with unreachable target states (continuous controllers) are satisfied for panel completion
        const targetVal = parseInt(this.targetState);
        if (!isNaN(targetVal) && targetVal > this.maxState) {
            return true;
        }

        return this.state == this.targetState;
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
    reset() {
        // console.log(`[Reset-Trace] START reset for ${this.id} (elevation=${this.elevation})`);
        if (!this.initialConfig) {
            // console.warn(`[Reset-Trace] No initialConfig for ${this.id}, cannot reset.`);
            return;
        }

        const wasInSocket = !!this.socket;
        const isSnapped = this.element.parentElement && this.element.parentElement !== this.panel.container;
        // console.log(`[Reset-Trace] State of ${this.id}: filled=${this.filled}, filler=${this.filler ? this.filler.id : 'null'}, socket=${this.socket ? this.socket.id : 'null'}, wasInSocket=${wasInSocket}, isSnapped=${isSnapped}`);

        // If we are a socket being reset, we must also reset our filler
        if (this.elevation === '-' && this.filled && this.filler) {
            const fillerToReset = this.filler;
            // console.log(`[Reset-Trace] ! Socket ${this.id} is triggering reset on filler ${fillerToReset.id}`);
            this.filler = null;
            this.filled = false;
            fillerToReset.reset();
        }

        // If we are a plug being reset, we must tell our socket filler we are gone
        if (this.socket) {
            const socket = this.socket;
            // console.log(`[Reset-Trace] ! Plug ${this.id} is disconnecting from socket ${socket.id}`);
            socket.filled = false;
            socket.filler = null;
            this.socket = null; // Clear our own ref
            socket.element.classList.remove('done');
            socket.updateVisuals();
            socket.panel.checkCompletion();
        }

        const cellSize = getElementSize();

        // 1. Handle Socket Emptying and Reparenting
        // We need to pop out if we are a plug (elevation +) and we are currently not in our home container 
        // OR we were just in a socket (even on the same panel)
        const needsEjection = (this.elevation === '+') && (isSnapped || wasInSocket);

        if (this.filled || needsEjection) {
            if (needsEjection) {
                // console.log(`[Reset-Trace] >> Ejecting ${this.id} to ${this.panel.color} panel container`);
            }

            if (this.shape !== 'screw') {
                // Pop-out logic for plugs
                const directions = [
                    { x: 0, y: -this.size }, { x: 0, y: this.size },
                    { x: -this.size, y: 0 }, { x: this.size, y: 0 }
                ];

                let moved = false;
                for (const dir of directions) {
                    const newX = this.x + dir.x;
                    const newY = this.y + dir.y;

                    if (newX >= 0 && newX + this.size <= 8 && newY >= 0 && newY + this.size <= 8) {
                        const hasConflict = this.panel.elements.some(el => {
                            if (el === this) return false;
                            return !(newX + this.size <= el.x || newX >= el.x + el.size ||
                                newY + this.size <= el.y || newY >= el.y + el.size);
                        });

                        if (!hasConflict) {
                            this.x = newX;
                            this.y = newY;
                            moved = true;
                            break;
                        }
                    }
                }
                if (!moved) {
                    this.x = this.initialConfig.x;
                    this.y = this.initialConfig.y;
                }
            } else {
                // Screws always return to start
                this.x = this.initialConfig.x;
                this.y = this.initialConfig.y;
            }

            // Restore style and reparent
            // console.log(`[Reset-Trace] >> Positioning ${this.id} at ${this.x}x${this.y}`);
            this.element.style.left = `${PADDING + (this.x * cellSize)}px`;
            this.element.style.top = `${PADDING + (this.y * cellSize)}px`;
            this.element.style.transform = ''; // Clear any snap transforms
            this.element.style.zIndex = '';    // Restore natural z-index

            if (this.element.parentElement !== this.panel.container) {
                this.panel.container.appendChild(this.element);
                this.element.style.position = 'absolute';
            }
        } else if (this.x !== this.initialConfig.x || this.y !== this.initialConfig.y) {
            // If moved from starting position on the SAME panel, return to start
            this.x = this.initialConfig.x;
            this.y = this.initialConfig.y;
            this.element.style.left = `${PADDING + (this.x * cellSize)}px`;
            this.element.style.top = `${PADDING + (this.y * cellSize)}px`;
        }

        // 2. Restore basic properties
        this.state = this.initialConfig.state;
        this.rotation = this.initialConfig.rotation;
        this.elevation = this.initialConfig.elevation;
        this.elevationTarget = this.initialConfig.elevationTarget;
        this.method = this.initialConfig.method;
        this.change = this.initialConfig.change;
        this.targetState = this.initialConfig.targetState;
        this.draggable = this.initialConfig.draggable;
        this.filled = false;

        // 3. Update visuals and event handlers
        this.element.classList.remove('done', 'unlocked', 'draggable', 'raised', 'sunken', 'jump', 'flying', 'dragging', 'wiggle');
        // If we were hidden inside a socket, ensure we are visible again
        this.element.style.opacity = '1';
        this.element.style.display = '';

        if (this.elevation === '+') this.element.classList.add('raised');
        if (this.elevation === '-') this.element.classList.add('sunken');
        if (this.draggable) this.element.classList.add('draggable', 'unlocked');

        this.updateVisuals();
        this.setupEvents();

        // Final completion check to update panel status
        this.panel.checkCompletion();
    }
};
