let players = [];
let selected = [];
let mode = "oneToOne";
let currentGroup = "";

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registered"));
}

// Initialize app on load
window.onload = function () {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark");
  }

  const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
  if (savedPlayers.length > 0) {
    players = savedPlayers;
    renderPlayers();
  }
};

// Toggle dark mode
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
}

// Add player input fields
function addPlayerField() {
  const container = document.getElementById("player-form");
  const div = document.createElement("div");
  div.className = "player-entry flex gap-2 mb-2";
  div.innerHTML = `
    <input type="text" placeholder="Name" class="player-name flex-1 p-2 border rounded" />
    <input type="text" placeholder="Avatar (emoji)" class="player-avatar flex-1 p-2 border rounded" />
  `;
  container.appendChild(div);
}

// Create a new group
function createGroup() {
  const name = document.getElementById("group-name").value.trim();
  const nameFields = document.querySelectorAll(".player-name");
  const avatarFields = document.querySelectorAll(".player-avatar");

  if (!name || nameFields.length < 2) return alert("Enter a group name and at least 2 players.");

  players = [];
  for (let i = 0; i < nameFields.length; i++) {
    const playerName = nameFields[i].value.trim();
    const avatar = avatarFields[i].value.trim();
    if (playerName) {
      players.push({
        name: playerName,
        avatar: avatar !== "" ? avatar : "🙂",
        score: 10,
        wins: 0,
        losses: 0
      });
    }
  }

  currentGroup = name;
  selected = [];
  renderPlayers();
}

// Render player grid
function renderPlayers() {
  const grid = document.getElementById("player-grid");
  grid.innerHTML = "";
  players.forEach((player, index) => {
    const div = document.createElement("div");
    div.className = "bg-white dark:bg-gray-800 border border-gray-800 p-4 text-center rounded shadow transform transition duration-300 hover:scale-105";
    div.innerHTML = `
      <div class="text-3xl mb-2">${player.avatar}</div>
      <strong>${player.name}</strong><br>
      Score: ${player.score}<br>
      🏆 Wins: ${player.wins || 0} | ❌ Losses: ${player.losses || 0}
    `;
    div.onclick = () => handleClick(index);
    grid.appendChild(div);
  });
}

// Set scoring mode
function setMode(m) {
  mode = m;
  selected = [];
}

// Handle player clicks
function handleClick(index) {
  selected.push(index);
  if (mode === "oneToOne" && selected.length === 2) {
    players[selected[0]].score--;
    players[selected[1]].score++;
    selected = [];
  } else if (mode === "oneToMany" && selected.length === 1) {
    players[selected[0]].score -= (players.length - 1);
    players.forEach((p, i) => {
      if (i !== selected[0]) p.score++;
    });
    selected = [];
  } else if (mode === "manyToOne" && selected.length === 1) {
    players[selected[0]].score += (players.length - 1);
    players.forEach((p, i) => {
      if (i !== selected[0]) p.score--;
    });
    selected = [];
  }
  renderPlayers();
}

// Sort and rank players
function rateAndRank() {
  players.sort((a, b) => b.score - a.score);
  renderPlayers();
}

// Save session and update stats
function saveSession() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const winner = [...players].sort((a, b) => b.score - a.score)[0];

  if (!winner || !winner.name) {
    alert("No winner could be determined.");
    return;
  }

  players.forEach(p => {
    if (p.name === winner.name) {
      p.wins += 1;
    } else {
      p.losses += 1;
    }
  });

  const session = {
    group: currentGroup,
    date: new Date().toLocaleString(),
    players: [...players],
    winner: winner.name
  };

  history.push(session);
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("players", JSON.stringify(players));
  alert(`Session saved! Winner: ${winner.name}`);
  renderPlayers();
}

// Load session history
function loadHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const log = document.getElementById("history-log");
  log.innerHTML = "<h3 class='text-xl font-bold mb-4'>Session History</h3>";

  if (history.length === 0) {
    log.innerHTML += "<p>No sessions saved yet.</p>";
    return;
  }

  history.forEach((session, index) => {
    const div = document.createElement("div");
    div.className = "bg-white dark:bg-gray-800 p-4 rounded shadow mb-4";
    div.innerHTML = `
      <strong class="text-lg">${session.group}</strong>
      <p class="text-sm text-gray-600 dark:text-gray-400">${session.date}</p>
      <p class="mt-2">🏆 Winner: <strong>${session.winner}</strong></p>
      <button onclick="loadSession(${index})" class="mt-2 bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded">Load Session</button>
    `;
    log.appendChild(div);
  });
}

// Load a previous session
function loadSession(index) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const session = history[index];
  currentGroup = session.group;
  players = session.players;
  renderPlayers();
}

// Export session history
function exportHistory() {
  const history = localStorage.getItem("history");
  if (!history) return alert("No history to export.");

  const blob = new Blob([history], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "scoremaster-history.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Show leaderboard sorted by wins
function showLeaderboard() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const leaderboard = {};

  history.forEach(session => {
    session.players.forEach(p => {
      if (!leaderboard[p.name]) {
        leaderboard[p.name] = { wins: 0, losses: 0 };
      }
      leaderboard[p.name].wins += p.wins || 0;
      leaderboard[p.name].losses += p.losses || 0;
    });
  });

  const log = document.getElementById("history-log");
  log.innerHTML = "<h3 class='text-xl font-bold mb-4'>Leaderboard</h3>";

  if (Object.keys(leaderboard).length === 0) {
    log.innerHTML += "<p>No sessions saved yet. Play and save a session to see the leaderboard.</p>";
    return;
  }

  const sorted = Object.entries(leaderboard).sort((a, b) => b[1].wins - a[1].wins);

  sorted.forEach(([name, stats]) => {
    const div = document.createElement("div");
    div.className = "bg-white dark:bg-gray-800 p-4 rounded shadow mb-2";
    div.innerHTML = `<strong>${name}</strong><br>🏆 Wins: ${stats.wins} | ❌ Losses: ${stats.losses}`;
    log.appendChild(div);
  });
}
