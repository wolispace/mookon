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
};
