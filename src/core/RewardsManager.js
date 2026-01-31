// https://fontawesome.com/icons/pen?f=classic&s=light
// Rewards Manager
class RewardsManager {
    static STORAGE_KEY = 'mookon_rewards';

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

    static buildRewardClass(rewardName, specific) {
        return `fa-solid fa-${rewardName} ${specific}`;
    }

    static renderRewards() {
        const rewardsArea = document.getElementById('rewards-area');
        if (!rewardsArea) return;

        const rewards = this.loadRewards();
        rewardsArea.innerHTML = '';

        rewards.forEach(rewardName => {
            const icon = document.createElement('i');
            icon.className = this.buildRewardClass(rewardName, `reward-collected`);
            icon.title = rewardName;
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => {
                Dialog.show(this.getRewardContent(rewardName));
            });
            rewardsArea.appendChild(icon);
        });
    }

    static getRewardContent(rewardName) {
        return `
            <h2>Reward Unlocked!</h2>
            <div style="font-size: 3rem; margin: 20px 0; color: #ffd700; text-align: center;">
                <i class="fa-solid fa-${rewardName}"></i>
            </div>
            <h3 style="text-align: center;">${rewardName.charAt(0).toUpperCase() + rewardName.slice(1).replace(/-/g, ' ')}</h3>
            <p>Congratulations on unlocking this reward! This item has been added to your collection.</p>
            <p>Rewards are earned by solving puzzles and finding hidden secrets within the Mookon Box.</p>
            <p>Can you collect them all?</p>
            <p>Scroll down to see more information about your collection and the box simulator.</p>
            <p>Each reward represents a unique challenge you've overcome.</p>
            <p>Stay tuned for more updates and new rewards to discover!</p>
        `;
    }

    static createRewardIcon(rewardName, onClickCallback) {
        const icon = document.createElement('i');
        icon.className = this.buildRewardClass(rewardName, `reward-icon`);
        icon.title = `Click to collect: ${rewardName}`;
        icon.style.cursor = 'pointer';

        icon.addEventListener('click', () => {
            this.addReward(rewardName);
            if (onClickCallback) onClickCallback(icon);
        });

        return icon;
    }
    // Choose random reward
    static chooseReward() {
        return REWARDS[randBetween(0, REWARDS.length - 1)];
    }
};


