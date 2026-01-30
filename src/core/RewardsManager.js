// https://fontawesome.com/icons/pen?f=classic&s=light
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
        icon.className = `fa-solid ${this.getIconClass(rewardName)} reward-icon`;
        icon.title = `Click to collect: ${rewardName}`;
        icon.style.cursor = 'pointer';

        icon.addEventListener('click', () => {
            this.addReward(rewardName);
            if (onClickCallback) onClickCallback(icon);
        });

        return icon;
    }
};
