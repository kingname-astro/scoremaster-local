let players = [];
let selected = [];
let mode = "oneToOne";
let currentGroup = "";
let currentSession = null;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registered"));
}


// Add this function to dynamically add player fields
function addPlayerField() {
  const container = document.getElementById("player-form");
  const div = document.createElement("div");
  div.className = "player-entry";
  div.innerHTML = `
    <input type="text" placeholder="Name" class="player-name" />
    <input type="text" placeholder="Avatar (emoji)" class="player-avatar" />
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
    // const avatar = avatarFields[i].value.trim() || "🙂";
    const avatar = avatarFields[i].value.trim();
      players.push({
        name: playerName,
        avatar: avatar !== "" ? avatar : "🙂",
        score: 10,
        wins: 0,
        losses: 0
      });

    
    if (playerName) {
      players.push({ name: playerName, avatar, score: 10, wins: 0, losses: 0 });
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
    div.className = "player";
    div.innerHTML = `
      <div style="font-size: 2em">${player.avatar}</div>
      <strong>${player.name}</strong><br>
      Score: ${player.score}<br>
      🏆 Wins: ${player.wins || 0} | ❌ Losses: ${player.losses || 0}
    `;
    div.onclick = () => handleClick(index);
    grid.appendChild(div);
  });
}


// Set point transfer mode
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

// Save session to localStorage
function saveSession() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const winner = [...players].sort((a, b) => b.score - a.score)[0];

  const session = {
    group: currentGroup,
    date: new Date().toLocaleString(),
    players: [...players],
    winner: winner.name
  };

  // Update win/loss stats
  players.forEach(p => {
    if (p.name === winner.name) {
      p.wins += 1;
    } else {
      p.losses += 1;
    }
  });

  history.push(session);
  localStorage.setItem("history", JSON.stringify(history));
  alert(`Session saved! Winner: ${winner.name}`);
  renderPlayers(); // Refresh display with updated stats
}


// Load session history
function loadHistory() {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const log = document.getElementById("history-log");
  log.innerHTML = "<h3>Session History</h3>";

  history.forEach((session, index) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${session.group}</strong> (${session.date})<br>
      Winner: ${session.winner}<br>
      <button onclick="loadSession(${index})">Load Session</button>
      <hr>
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

// Export session history as JSON file
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

// Initial render
renderPlayers();
