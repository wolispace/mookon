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
                Dialog.show('Rewards', this.getRewardContent(rewardName));
            });
            rewardsArea.appendChild(icon);
        });
    }

    static getRewardContent(rewardName) {
        const rewards = this.loadRewards();
        let content = `<p>You have found ${rewards.length} of ${REWARDS.length}.<p>`;
        content += '<div class="reward-dialog-content">';

        rewards.forEach(rewardName => {
            content += `<div style="font-size: 3rem; color: #ffd700; text-align: center;">
                <i class="fa-solid fa-${rewardName} reward-icon"></i>
            </div>`
        });

        content += '</div>';

        return content;
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
    // Choose random reward they dont have yet
    static chooseReward() {
        const rewards = this.loadRewards();
        // exclude rewards from REWARDS before selecting a rnadom one  
        const availableRewards = REWARDS.filter(reward => !rewards.includes(reward));
        return availableRewards[randBetween(0, availableRewards.length - 1)];
    }
};


