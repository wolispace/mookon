

const grid = document.getElementById("reward-grid");
let count = 1;

TEST_REWARDS.forEach(name => {
  const wrapper = document.createElement("div");
  wrapper.className = "";

  wrapper.innerHTML = `
    <i class="fas fa-${name} reward-icon"></i>
    <div class="label">${name} ${count++}</div>
  `;

  grid.appendChild(wrapper);
});