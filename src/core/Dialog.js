class Dialog {
    static instance = null;

    static init() {
        if (this.instance) return;

        const dialogOverlay = document.createElement('div');
        dialogOverlay.id = 'info-dialog';
        dialogOverlay.className = 'hidden';

        const dialogBox = document.createElement('div');
        dialogBox.id = 'info-content';

        const closeBtn = document.createElement('div');
        closeBtn.id = 'info-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.hide());

        const scrollContainer = document.createElement('div');
        scrollContainer.id = 'dialog-scroll-container';

        dialogBox.appendChild(closeBtn);
        dialogBox.appendChild(scrollContainer);
        dialogOverlay.appendChild(dialogBox);
        document.body.appendChild(dialogOverlay);

        dialogOverlay.addEventListener('click', (e) => {
            if (e.target === dialogOverlay) {
                this.hide();
            }
        });

        this.instance = {
            overlay: dialogOverlay,
            content: scrollContainer
        };
    }

    static show(htmlContent) {
        if (!this.instance) this.init();

        this.instance.content.innerHTML = htmlContent;
        this.instance.overlay.classList.remove('hidden');

        // Re-attach share button listener if it exists in the content
        const shareBtn = document.getElementById('share-button');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                if (typeof handleShare === 'function') {
                    handleShare(shareBtn);
                }
            });
        }
    }

    static hide() {
        if (this.instance) {
            this.instance.overlay.classList.add('hidden');
        }
    }
}
