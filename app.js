/* ========================================
   MARCH MADNESS WITH SKILL — 2026 Edition
   Frontend — talks to server API
   ======================================== */

const ROUNDS = [
  { id: 'first-four', name: 'First Four', shortName: 'FF' },
  { id: 'round-1', name: 'First Round', shortName: 'R1' },
  { id: 'round-2', name: 'Second Round', shortName: 'R2' },
  { id: 'sweet-16', name: 'Sweet 16', shortName: 'S16' },
  { id: 'elite-8', name: 'Elite 8', shortName: 'E8' },
  { id: 'final-4', name: 'Final Four', shortName: 'F4' },
  { id: 'championship', name: 'Championship', shortName: 'CHMP' },
];

const REGIONS = ['East', 'West', 'South', 'Midwest'];

const TEAMS_DATA = {
  East: [
    { seed: 1, name: 'Duke', conference: 'ACC' },
    { seed: 2, name: 'UConn', conference: 'Big East' },
    { seed: 3, name: 'Michigan St', conference: 'Big Ten' },
    { seed: 4, name: 'Kansas', conference: 'Big 12' },
    { seed: 5, name: "St. John's", conference: 'Big East' },
    { seed: 6, name: 'Louisville', conference: 'ACC' },
    { seed: 7, name: 'UCLA', conference: 'Big Ten' },
    { seed: 8, name: 'Ohio State', conference: 'Big Ten' },
    { seed: 9, name: 'TCU', conference: 'Big 12' },
    { seed: 10, name: 'UCF', conference: 'Big 12' },
    { seed: 11, name: 'South Florida', conference: 'AAC' },
    { seed: 12, name: 'Northern Iowa', conference: 'MVC' },
    { seed: 13, name: 'CA Baptist', conference: 'WAC' },
    { seed: 14, name: 'N Dakota St', conference: 'Summit' },
    { seed: 15, name: 'Furman', conference: 'SoCon' },
    { seed: 16, name: 'Siena', conference: 'MAAC' },
  ],
  West: [
    { seed: 1, name: 'Arizona', conference: 'Big 12' },
    { seed: 2, name: 'Purdue', conference: 'Big Ten' },
    { seed: 3, name: 'Gonzaga', conference: 'WCC' },
    { seed: 4, name: 'Arkansas', conference: 'SEC' },
    { seed: 5, name: 'Wisconsin', conference: 'Big Ten' },
    { seed: 6, name: 'BYU', conference: 'Big 12' },
    { seed: 7, name: 'Miami', conference: 'ACC' },
    { seed: 8, name: 'Villanova', conference: 'Big East' },
    { seed: 9, name: 'Utah State', conference: 'MWC' },
    { seed: 10, name: 'Missouri', conference: 'SEC' },
    { seed: 11, name: 'Texas', conference: 'SEC' },
    { seed: 12, name: 'High Point', conference: 'Big South' },
    { seed: 13, name: "Hawai'i", conference: 'Big West' },
    { seed: 14, name: 'Kennesaw St', conference: 'ASUN' },
    { seed: 15, name: 'Queens', conference: 'ASUN' },
    { seed: 16, name: 'Long Island', conference: 'NEC' },
  ],
  South: [
    { seed: 1, name: 'Florida', conference: 'SEC' },
    { seed: 2, name: 'Houston', conference: 'Big 12' },
    { seed: 3, name: 'Illinois', conference: 'Big Ten' },
    { seed: 4, name: 'Nebraska', conference: 'Big Ten' },
    { seed: 5, name: 'Vanderbilt', conference: 'SEC' },
    { seed: 6, name: 'North Carolina', conference: 'ACC' },
    { seed: 7, name: "Saint Mary's", conference: 'WCC' },
    { seed: 8, name: 'Clemson', conference: 'ACC' },
    { seed: 9, name: 'Iowa', conference: 'Big Ten' },
    { seed: 10, name: 'Texas A&M', conference: 'SEC' },
    { seed: 11, name: 'VCU', conference: 'A-10' },
    { seed: 12, name: 'McNeese', conference: 'Southland' },
    { seed: 13, name: 'Troy', conference: 'Sun Belt' },
    { seed: 14, name: 'Penn', conference: 'Ivy' },
    { seed: 15, name: 'Idaho', conference: 'Big Sky' },
    { seed: 16, name: 'Prairie View', conference: 'SWAC' },
  ],
  Midwest: [
    { seed: 1, name: 'Michigan', conference: 'Big Ten' },
    { seed: 2, name: 'Iowa State', conference: 'Big 12' },
    { seed: 3, name: 'Virginia', conference: 'ACC' },
    { seed: 4, name: 'Alabama', conference: 'SEC' },
    { seed: 5, name: 'Texas Tech', conference: 'Big 12' },
    { seed: 6, name: 'Tennessee', conference: 'SEC' },
    { seed: 7, name: 'Kentucky', conference: 'SEC' },
    { seed: 8, name: 'Georgia', conference: 'SEC' },
    { seed: 9, name: 'Saint Louis', conference: 'A-10' },
    { seed: 10, name: 'Santa Clara', conference: 'WCC' },
    { seed: 11, name: 'Miami OH', conference: 'MAC' },
    { seed: 12, name: 'Akron', conference: 'MAC' },
    { seed: 13, name: 'Hofstra', conference: 'CAA' },
    { seed: 14, name: 'Wright St', conference: 'Horizon' },
    { seed: 15, name: 'Tennessee St', conference: 'OVC' },
    { seed: 16, name: 'Howard', conference: 'MEAC' },
  ],
};

// ========== STATE ==========

let state = {
  view: 'home',
  league: null,
  playerId: null,
  currentPlayer: null,
  selectedTeam: null,
  activeTab: 'dashboard',
  _willAdvance: true,
  loading: false,
  pollTimer: null,
};

// ========== SESSION (local only — remembers which leagues/players you are in) ==========

function loadAllSessions() {
  try {
    const raw = localStorage.getItem('mm_sessions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  // Migrate old single-session format
  try {
    const old = JSON.parse(localStorage.getItem('mm_session'));
    if (old && old.code && old.playerId) {
      const sessions = [{ code: old.code, playerId: old.playerId }];
      localStorage.setItem('mm_sessions', JSON.stringify(sessions));
      localStorage.removeItem('mm_session');
      return sessions;
    }
  } catch {}
  return [];
}

function saveSession() {
  if (state.league && state.playerId) {
    const sessions = loadAllSessions();
    const entry = {
      code: state.league.code,
      playerId: state.playerId,
      playerName: state.currentPlayer ? state.currentPlayer.name : '',
      leagueName: state.league.name,
      teamId: state.currentPlayer ? state.currentPlayer.teamId : null,
    };
    const idx = sessions.findIndex(s => s.code === entry.code && s.playerId === entry.playerId);
    if (idx >= 0) sessions[idx] = entry;
    else sessions.push(entry);
    localStorage.setItem('mm_sessions', JSON.stringify(sessions));
  }
}

function loadSession() {
  const sessions = loadAllSessions();
  return sessions.length > 0 ? sessions[0] : null;
}

function clearSession() {
  if (state.league && state.playerId) {
    removeSession(state.league.code, state.playerId);
  } else {
    localStorage.removeItem('mm_sessions');
    localStorage.removeItem('mm_session');
  }
}

function removeSession(code, playerId) {
  let sessions = loadAllSessions();
  sessions = sessions.filter(s => !(s.code === code && s.playerId === playerId));
  localStorage.setItem('mm_sessions', JSON.stringify(sessions));
}

// ========== API HELPERS ==========

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

async function refreshLeague() {
  if (!state.league) return;
  try {
    const league = await api('GET', `/league/${state.league.code}`);
    state.league = league;
    state.currentPlayer = league.players.find(p => p.id === state.playerId);
    // Preserve chat input value and focus across re-render
    const chatInput = document.getElementById('chatInput');
    const savedText = chatInput ? chatInput.value : '';
    const wasFocused = chatInput && document.activeElement === chatInput;
    render();
    if (savedText || wasFocused) {
      const newInput = document.getElementById('chatInput');
      if (newInput) {
        newInput.value = savedText;
        if (wasFocused) newInput.focus();
      }
    }
  } catch (e) {
    console.error('Refresh failed:', e);
  }
}

function startPolling() {
  stopPolling();
  state.pollTimer = setInterval(refreshLeague, 15000); // every 15 seconds
}

function stopPolling() {
  if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
}

// ========== HELPERS ==========

function findTeamByFullId(fullId) {
  if (!fullId) return null;
  const [region, seedStr] = fullId.split('-');
  const seed = parseInt(seedStr);
  const team = (TEAMS_DATA[region] || []).find(t => t.seed === seed);
  return team ? { ...team, region } : null;
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function calculateScore(predicted, actual) {
  const diff = Math.abs(predicted - actual);
  if (diff === 0) return 10;
  if (diff <= 2) return 8;
  if (diff <= 5) return 6;
  if (diff <= 8) return 4;
  if (diff <= 12) return 2;
  return 0;
}

function getAccuracyClass(score) {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'average';
  return 'poor';
}

function getTotalPlayerScore(player) {
  let total = 0;
  for (const r of (player.results || [])) {
    total += (r.totalScore || 0) + (r.spreadScore || 0) + (r.advanceBonus || 0);
  }
  return total;
}

function getPlayerRank(playerId) {
  const sorted = [...state.league.players].sort((a, b) => getTotalPlayerScore(b) - getTotalPlayerScore(a));
  return sorted.findIndex(p => p.id === playerId) + 1;
}

function hasPredictedCurrentRound(player) {
  return (player.predictions || []).some(p => p.round === state.league.currentRound);
}

function getAliveTeams() {
  const league = state.league;
  const alive = new Set();
  // All teams in current round matchups (both sides)
  const roundId = ROUNDS[league.currentRound].id;
  const matchups = league.bracket[roundId] || [];
  for (const m of matchups) {
    if (m.result) {
      alive.add(m.result.winner); // only winner is alive
    } else {
      alive.add(m.team1);
      alive.add(m.team2);
    }
  }
  return alive;
}

// ========== SVG ==========

function basketballSVG(size = 180) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="ballGrad" cx="40%" cy="35%" r="60%">
      <stop offset="0%" style="stop-color:#FF8B3D"/><stop offset="50%" style="stop-color:#E35205"/>
      <stop offset="100%" style="stop-color:#A03000"/></radialGradient>
      <filter id="ballShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#E35205" flood-opacity="0.4"/></filter></defs>
    <circle cx="100" cy="100" r="90" fill="url(#ballGrad)" filter="url(#ballShadow)"/>
    <path d="M 100 10 Q 100 100, 100 190" stroke="#8B3000" stroke-width="2.5" fill="none" opacity="0.6"/>
    <path d="M 10 100 Q 100 100, 190 100" stroke="#8B3000" stroke-width="2.5" fill="none" opacity="0.6"/>
    <path d="M 30 30 Q 100 80, 170 30" stroke="#8B3000" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M 30 170 Q 100 120, 170 170" stroke="#8B3000" stroke-width="2" fill="none" opacity="0.5"/>
    <ellipse cx="72" cy="65" rx="25" ry="18" fill="white" opacity="0.12" transform="rotate(-20 72 65)"/></svg>`;
}

function miniBasketballSVG(s=24) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#E35205"/>
    <path d="M 100 10 Q 100 100,100 190" stroke="#8B3000" stroke-width="4" fill="none" opacity="0.5"/>
    <path d="M 10 100 Q 100 100,190 100" stroke="#8B3000" stroke-width="4" fill="none" opacity="0.5"/></svg>`;
}

function sendIconSVG() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>`;
}

function renderBackground() {
  return `<div class="bg-court"><div class="court-line"></div><div class="court-line"></div><div class="court-line"></div></div>`;
}

// ========== RENDER ENGINE ==========

function render() {
  const app = document.getElementById('app');
  switch (state.view) {
    case 'home': app.innerHTML = renderHome(); break;
    case 'create-league': app.innerHTML = renderCreateLeague(); break;
    case 'join-league': app.innerHTML = renderJoinLeague(); break;
    case 'select-team': app.innerHTML = renderTeamSelection(); break;
    case 'app': app.innerHTML = renderAppShell(); break;
    default: app.innerHTML = renderHome();
  }
  if (state.view === 'app' && state.activeTab === 'messages') {
    setTimeout(() => {
      const c = document.getElementById('chatMessages');
      if (c) c.scrollTop = c.scrollHeight;
    }, 50);
  }
}

// ========== HOME ==========

function renderHome() {
  const sessions = loadAllSessions();

  let yourGamesHtml = '';
  if (sessions.length > 0) {
    let gameCards = '';
    for (const s of sessions) {
      const team = s.teamId ? findTeamByFullId(s.teamId) : null;
      const teamLabel = team ? `(${team.seed}) ${team.name}` : 'No team yet';
      const teamBadge = team
        ? `<span style="background:rgba(227,82,5,0.15); color:var(--ball-orange); font-size:0.75rem; font-weight:700;
                padding:0.2rem 0.6rem; border-radius:6px;">${teamLabel}</span>`
        : `<span style="background:rgba(255,255,255,0.05); color:var(--text-muted); font-size:0.75rem;
                padding:0.2rem 0.6rem; border-radius:6px;">No team yet</span>`;
      gameCards += `
        <div class="card game-session-card" style="cursor:pointer; padding:1rem 1.25rem; margin-bottom:0.75rem; transition:border-color 0.2s, transform 0.15s;"
             onclick="rejoinSpecificSession('${escapeHtml(s.code)}','${escapeHtml(s.playerId)}')"
             onmouseenter="this.style.borderColor='var(--ball-orange)';this.style.transform='translateY(-2px)';"
             onmouseleave="this.style.borderColor='';this.style.transform='';">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <div style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; letter-spacing:2px; color:var(--text-primary);">
                ${escapeHtml(s.leagueName || 'League')}</div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.35rem;">
                <span style="font-size:0.8rem; color:var(--text-secondary);">Playing as <strong style="color:var(--text-primary);">${escapeHtml(s.playerName || 'Player')}</strong></span>
                <span style="color:var(--text-muted);">&bull;</span>
                ${teamBadge}
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span style="font-family:'Bebas Neue',sans-serif; font-size:0.9rem; letter-spacing:2px; color:var(--text-muted);
                    background:rgba(255,255,255,0.05); padding:0.25rem 0.6rem; border-radius:6px;">${escapeHtml(s.code)}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ball-orange)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>`;
    }
    yourGamesHtml = `
      <div style="max-width:500px; width:100%; margin-bottom:2rem;">
        <div style="font-family:'Bebas Neue',sans-serif; font-size:1.4rem; color:var(--success); letter-spacing:2px; text-align:center; margin-bottom:1rem;">
          YOUR GAMES</div>
        ${gameCards}
      </div>
      <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">— or start something new —</div>
    `;
  }

  return `${renderBackground()}
    <div class="hero fade-in">
      <div class="hero-basketball">${basketballSVG(180)}</div>
      <h1>MARCH MADNESS</h1>
      <h2>WITH SKILL</h2>
      <p>The 2026 NCAA Tournament is LIVE. Pick your team, predict the scores, and outsmart your friends.</p>
      <div style="background:rgba(227,82,5,0.1); border:1px solid rgba(227,82,5,0.3); border-radius:12px;
           padding:0.75rem 1.5rem; margin-bottom:2rem; font-size:0.9rem; color:var(--ball-orange);">
        <strong>Multiplayer enabled</strong> — share your league code so friends can join from anywhere
      </div>
      ${yourGamesHtml}
      <div class="btn-group">
        <button class="btn btn-primary btn-lg" onclick="navigate('create-league')">Create League</button>
        <button class="btn btn-secondary btn-lg" onclick="navigate('join-league')">Join League</button>
      </div>

      <div style="margin-top:3rem; max-width:700px; width:100%; text-align:left;">
        <div class="card" style="padding:2rem;">
          <h3 style="font-family:'Bebas Neue',sans-serif; font-size:1.8rem; letter-spacing:3px; color:var(--ball-orange); text-align:center; margin-bottom:1.5rem;">
            HOW TO PLAY</h3>

          <div style="display:flex; gap:1rem; margin-bottom:1.25rem; align-items:flex-start;">
            <div style="min-width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--ball-orange),var(--ball-dark));
                 display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">1</div>
            <div><div style="font-weight:700; margin-bottom:0.25rem;">Create or Join a League</div>
              <div style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">
                Create a league and share the 6-letter code with your friends. They can join from anywhere using the code — everyone plays on their own device.</div></div>
          </div>

          <div style="display:flex; gap:1rem; margin-bottom:1.25rem; align-items:flex-start;">
            <div style="min-width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--ball-orange),var(--ball-dark));
                 display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">2</div>
            <div><div style="font-weight:700; margin-bottom:0.25rem;">Pick Your Team</div>
              <div style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">
                Choose one of the teams still alive in the 2026 NCAA Tournament. Your fate rides with them — if they get knocked out, your predictions are over. Choose wisely!</div></div>
          </div>

          <div style="display:flex; gap:1rem; margin-bottom:1.25rem; align-items:flex-start;">
            <div style="min-width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--ball-orange),var(--ball-dark));
                 display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">3</div>
            <div><div style="font-weight:700; margin-bottom:0.25rem;">Predict Each Round</div>
              <div style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">
                Before your team plays, lock in three predictions:<br>
                <strong style="color:var(--ball-orange);">The Total</strong> — the combined points both teams will score<br>
                <strong style="color:var(--ball-orange);">The Spread</strong> — how many points your team wins (or loses) by<br>
                <strong style="color:var(--ball-orange);">Win or Lose</strong> — will your team advance or get eliminated?</div></div>
          </div>

          <div style="display:flex; gap:1rem; margin-bottom:1.25rem; align-items:flex-start;">
            <div style="min-width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--ball-orange),var(--ball-dark));
                 display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">4</div>
            <div><div style="font-weight:700; margin-bottom:0.25rem;">Score Points for Accuracy</div>
              <div style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">
                After the game, your prediction is scored based on how close you were:</div>
              <div style="margin-top:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                <div style="background:rgba(15,15,35,0.5); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.8rem;">
                  <span style="color:var(--success); font-weight:700;">10 pts</span> <span style="color:var(--text-muted);">— spot on</span></div>
                <div style="background:rgba(15,15,35,0.5); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.8rem;">
                  <span style="color:var(--ball-orange); font-weight:700;">8 pts</span> <span style="color:var(--text-muted);">— within 2</span></div>
                <div style="background:rgba(15,15,35,0.5); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.8rem;">
                  <span style="color:var(--warning); font-weight:700;">6 pts</span> <span style="color:var(--text-muted);">— within 5</span></div>
                <div style="background:rgba(15,15,35,0.5); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.8rem;">
                  <span style="font-weight:700;">4 pts</span> <span style="color:var(--text-muted);">— within 8</span></div>
                <div style="background:rgba(15,15,35,0.5); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.8rem;">
                  <span style="font-weight:700;">2 pts</span> <span style="color:var(--text-muted);">— within 12</span></div>
                <div style="background:rgba(46,204,113,0.1); border:1px solid rgba(46,204,113,0.2); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.8rem;">
                  <span style="color:var(--success); font-weight:700;">+5 bonus</span> <span style="color:var(--text-muted);">— correct W/L</span></div>
              </div>
              <div style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.5rem;">
                Scored for <strong>both</strong> Total and Spread, so you can earn up to <strong style="color:var(--ball-orange);">25 points per round</strong>.</div>
            </div>
          </div>

          <div style="display:flex; gap:1rem; margin-bottom:1.25rem; align-items:flex-start;">
            <div style="min-width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--ball-orange),var(--ball-dark));
                 display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">5</div>
            <div><div style="font-weight:700; margin-bottom:0.25rem;">Climb the Leaderboard</div>
              <div style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">
                Your points accumulate round by round. The leaderboard ranks all players by total score — watch yourself rise and fall as predictions land or miss. If your team gets eliminated, your run is over, but your score stands.</div></div>
          </div>

          <div style="display:flex; gap:1rem; align-items:flex-start;">
            <div style="min-width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--ball-orange),var(--ball-dark));
                 display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem;">6</div>
            <div><div style="font-weight:700; margin-bottom:0.25rem;">Talk Trash</div>
              <div style="color:var(--text-secondary); font-size:0.9rem; line-height:1.5;">
                Use the group chat to brag about your picks, call out bad predictions, and keep the competition heated. It's March Madness — act accordingly.</div></div>
          </div>

          <div style="margin-top:1.5rem; padding:1rem; background:rgba(227,82,5,0.08); border-radius:12px; border:1px solid rgba(227,82,5,0.15); text-align:center;">
            <div style="font-family:'Bebas Neue',sans-serif; font-size:1.1rem; letter-spacing:2px; color:var(--ball-orange); margin-bottom:0.25rem;">
              THE DEEPER YOUR TEAM GOES, THE MORE YOU CAN SCORE</div>
            <div style="color:var(--text-secondary); font-size:0.85rem;">
              Pick a Cinderella and ride the wave, or back a powerhouse and stack points every round.</div>
          </div>
        </div>
      </div>

    </div>
    <div class="toast-container" id="toasts"></div>`;
}

// ========== CREATE / JOIN ==========

function renderCreateLeague() {
  return `${renderBackground()}
    <div class="hero fade-in" style="justify-content:flex-start; padding-top:6rem;">
      <div class="hero-basketball" style="width:80px;height:80px;">${basketballSVG(80)}</div>
      <h1 style="font-size:2.5rem; margin-bottom:2rem;">CREATE YOUR LEAGUE</h1>
      <div class="card" style="max-width:450px; width:100%; text-align:left;">
        <div class="form-group"><label>League Name</label>
          <input type="text" class="form-input" id="leagueName" placeholder="e.g. The Bracket Busters" maxlength="30"></div>
        <div class="form-group"><label>Your Name</label>
          <input type="text" class="form-input" id="playerName" placeholder="Your display name" maxlength="20"></div>
        <div class="btn-group" style="justify-content:flex-start; margin-top:1.5rem;">
          <button class="btn btn-primary" id="createBtn" onclick="doCreateLeague()">Create & Pick Team</button>
          <button class="btn btn-secondary" onclick="navigate('home')">Back</button>
        </div>
      </div>
    </div><div class="toast-container" id="toasts"></div>`;
}

function renderJoinLeague() {
  return `${renderBackground()}
    <div class="hero fade-in" style="justify-content:flex-start; padding-top:6rem;">
      <div class="hero-basketball" style="width:80px;height:80px;">${basketballSVG(80)}</div>
      <h1 style="font-size:2.5rem; margin-bottom:2rem;">JOIN A LEAGUE</h1>
      <div class="card" style="max-width:450px; width:100%; text-align:left;">
        <div class="form-group"><label>League Code</label>
          <input type="text" class="form-input" id="leagueCode" placeholder="XXXXXX" maxlength="6"
                 style="text-transform:uppercase; text-align:center; font-family:'Bebas Neue',sans-serif; font-size:1.5rem; letter-spacing:4px;"></div>
        <div class="form-group"><label>Your Name</label>
          <input type="text" class="form-input" id="joinPlayerName" placeholder="Your display name" maxlength="20"></div>
        <div class="btn-group" style="justify-content:flex-start; margin-top:1.5rem;">
          <button class="btn btn-primary" id="joinBtn" onclick="doJoinLeague()">Join & Pick Team</button>
          <button class="btn btn-secondary" onclick="navigate('home')">Back</button>
        </div>
      </div>
    </div><div class="toast-container" id="toasts"></div>`;
}

// ========== TEAM SELECTION ==========

function renderTeamSelection() {
  const takenTeams = state.league ? state.league.players
    .filter(p => p.id !== state.playerId && p.teamId).map(p => p.teamId) : [];
  const alive = getAliveTeams();

  let html = `${renderBackground()}
    <div class="main-content fade-in" style="padding-top:2rem; position:relative; z-index:1;">
      <div style="text-align:center; margin-bottom:1rem;">
        <h1 style="font-family:'Bebas Neue',sans-serif; font-size:2.5rem; letter-spacing:3px;
            background:linear-gradient(135deg,#E35205,#C8842A); -webkit-background-clip:text;
            -webkit-text-fill-color:transparent; background-clip:text;">CHOOSE YOUR TEAM</h1>
        <p style="color:var(--text-secondary); margin-top:0.5rem;">
          Only teams still alive can be picked. Eliminated teams are greyed out.</p>
      </div>`;

  for (const region of REGIONS) {
    html += `<div class="region-header"><span>${miniBasketballSVG(28)}</span> ${region.toUpperCase()} REGION</div><div class="team-grid">`;
    for (const team of TEAMS_DATA[region]) {
      const fullId = `${region}-${team.seed}`;
      const isTaken = takenTeams.includes(fullId);
      const isElim = !alive.has(fullId);
      const isSelected = state.selectedTeam === fullId;
      const disabled = isTaken || isElim;
      let badge = '';
      if (isElim) badge = '<span style="color:var(--danger); font-size:0.7rem; font-weight:700;">ELIMINATED</span>';
      else if (isTaken) badge = '<span style="color:var(--warning); font-size:0.7rem; font-weight:700;">TAKEN</span>';
      html += `<div class="team-card ${isSelected?'selected':''}" style="${disabled?'opacity:0.3;pointer-events:none;':''}"
                    onclick="selectTeam('${fullId}')">
        <div class="team-seed">${team.seed}</div>
        <div><div class="team-name">${team.name} ${badge}</div><div class="team-conference">${team.conference}</div></div>
      </div>`;
    }
    html += '</div>';
  }

  html += `<div style="text-align:center; margin:2rem 0 4rem; position:sticky; bottom:1rem;">
    <button class="btn btn-primary btn-lg" onclick="doPickTeam()" ${!state.selectedTeam?'disabled style="opacity:0.4;cursor:not-allowed;"':''}>
      Lock In My Team</button>
  </div></div><div class="toast-container" id="toasts"></div>`;
  return html;
}

// ========== APP SHELL ==========

function renderAppShell() {
  const tabs = ['dashboard','bracket','predict','leaderboard','results','messages','admin'];
  const player = state.currentPlayer;
  const totalScore = getTotalPlayerScore(player);

  let tabContent;
  switch (state.activeTab) {
    case 'dashboard': tabContent = renderDashboard(); break;
    case 'bracket': tabContent = renderBracketView(); break;
    case 'predict': tabContent = renderPrediction(); break;
    case 'leaderboard': tabContent = renderLeaderboard(); break;
    case 'results': tabContent = renderResults(); break;
    case 'messages': tabContent = renderMessages(); break;
    case 'admin': tabContent = renderAdmin(); break;
    default: tabContent = renderDashboard();
  }

  const mobileNavIcons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    predict: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    leaderboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
    bracket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    results: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  };
  const mobileLabels = { dashboard:'Home', predict:'Predict', leaderboard:'Ranks', bracket:'Bracket', messages:'Chat', results:'Results', admin:'Admin' };
  const mobileOrder = ['dashboard','predict','leaderboard','messages','admin'];

  return `${renderBackground()}
    <div class="app-header">
      <div class="logo" onclick="goHome()" title="Back to all games" style="cursor:pointer;">
        <span class="ball-icon">${miniBasketballSVG(24)}</span> MM WITH SKILL</div>
      <div class="nav-tabs">
        ${tabs.map(t => `<button class="nav-tab ${state.activeTab===t?'active':''}" onclick="switchTab('${t}')">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
      </div>
      <div class="user-info">
        <div class="user-score">${totalScore} PTS</div>
        <div class="user-avatar">${getInitials(player.name)}</div>
      </div>
    </div>
    <div class="main-content fade-in">${tabContent}</div>
    <nav class="mobile-nav">
      <div class="mobile-nav-items">
        ${mobileOrder.map(t => `<button class="mobile-nav-btn ${state.activeTab===t?'active':''}" onclick="switchTab('${t}')">
          ${mobileNavIcons[t]}<span>${mobileLabels[t]}</span></button>`).join('')}
      </div>
    </nav>
    <div class="toast-container" id="toasts"></div>`;
}

// ========== DASHBOARD ==========

function renderDashboard() {
  const player = state.currentPlayer;
  const league = state.league;
  const team = findTeamByFullId(player.teamId);
  const roundIdx = league.currentRound;

  let progressHtml = '<div class="round-progress">';
  for (let i = 1; i < ROUNDS.length; i++) {
    const r = ROUNDS[i];
    let cls = '';
    if (i < roundIdx) cls = 'completed';
    else if (i === roundIdx) cls = player.eliminated ? 'eliminated' : 'active';
    if (player.eliminated && i === player.eliminatedRound) cls = 'eliminated';
    progressHtml += `<div class="round-step ${cls}">
      <div class="round-dot">${i < roundIdx ? '&#10003;' : (cls==='eliminated' ? '&#10007;' : r.shortName)}</div>
      <div class="round-label">${r.name}</div></div>`;
  }
  progressHtml += '</div>';

  const totalScore = getTotalPlayerScore(player);
  const maxP = player.results ? player.results.length * 25 : 0;
  const accuracy = maxP > 0 ? Math.round((totalScore / maxP) * 100) : 0;
  const rank = getPlayerRank(player.id);

  const roundId = ROUNDS[roundIdx].id;
  const matchups = league.bracket[roundId] || [];
  let myGame = matchups.find(m => m.team1 === player.teamId || m.team2 === player.teamId);
  const gamePlayed = myGame && myGame.result;
  const predicted = hasPredictedCurrentRound(player);

  let html = `${progressHtml}
    <div class="grid-3" style="margin-bottom:1.5rem;">
      <div class="card" style="text-align:center;">
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">Your Team</div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:1.8rem; color:var(--ball-orange); letter-spacing:2px;">(${team.seed}) ${team.name}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">${team.region} Region &bull; ${team.conference}</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">Total Score</div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:2.5rem; color:var(--ball-orange);">${totalScore}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">${accuracy}% accuracy</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">League Rank</div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:2.5rem; color:var(--ball-orange);">#${rank}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">of ${league.players.length} players</div>
      </div>
    </div>`;

  html += `<div class="card" style="margin-bottom:1.5rem;">
    <div class="card-header">
      <h3>LEAGUE: ${league.name.toUpperCase()}</h3>
      <span style="color:var(--text-muted); font-size:0.85rem;">${ROUNDS[roundIdx].name}</span>
    </div>
    <div class="invite-code">
      <div class="code">${league.code}</div>
      <div class="hint">Share this code so friends can join from anywhere</div>
      <div class="share-actions">
        <button class="share-btn" onclick="copyInviteCode()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Code</button>
        <button class="share-btn" onclick="shareInvite()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share Link</button>
      </div>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:1rem;">
      ${league.players.map(p => {
        const pt = findTeamByFullId(p.teamId);
        return `<div style="display:flex; align-items:center; gap:0.5rem; padding:0.4rem 0.75rem;
             background:rgba(227,82,5,0.08); border-radius:20px; font-size:0.85rem;">
          <div class="user-avatar" style="width:24px;height:24px;font-size:0.65rem;">${getInitials(p.name)}</div>
          <span>${p.name}</span>
          <span style="color:var(--text-muted); font-size:0.75rem;">${pt ? `(${pt.seed}) ${pt.name}` : 'picking...'}</span>
          ${p.eliminated ? '<span style="color:var(--danger); font-size:0.7rem;">OUT</span>' :
            '<span style="color:var(--success); font-size:0.7rem;">IN</span>'}
        </div>`;
      }).join('')}
    </div>
  </div>`;

  if (player.eliminated) {
    html += `<div class="eliminated-overlay"><h2>YOUR TEAM WAS ELIMINATED</h2>
      <p>${team.name} went down in the ${ROUNDS[player.eliminatedRound].name}. You can still watch the leaderboard and chat!</p></div>`;
  } else if (gamePlayed) {
    html += `<div class="card" style="text-align:center; border-color:var(--success); padding:1.5rem;">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; color:var(--success); letter-spacing:2px;">${team.name} ADVANCED!</div>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-top:0.5rem;">Waiting for remaining games to finish.</p></div>`;
  } else if (!predicted) {
    html += `<div class="card" style="text-align:center; border-color:var(--ball-orange); padding:2rem;">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:1.5rem; color:var(--ball-orange); letter-spacing:2px; margin-bottom:0.75rem;">PREDICTIONS OPEN</div>
      <p style="color:var(--text-secondary); margin-bottom:1.25rem;">Make your prediction for ${team.name}'s next game!</p>
      <button class="btn btn-primary" onclick="switchTab('predict')">Make Prediction</button></div>`;
  } else {
    html += `<div class="card" style="text-align:center; padding:1.5rem;">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:1.2rem; color:var(--success); letter-spacing:2px;">PREDICTION LOCKED IN</div>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-top:0.5rem;">Waiting for the game to finish...</p></div>`;
  }

  return html;
}

// ========== BRACKET ==========

function renderBracketView() {
  const league = state.league;
  let html = `<div style="margin-bottom:1.5rem;">
    <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2rem; letter-spacing:3px; color:var(--ball-orange);">2026 TOURNAMENT BRACKET</h2></div>`;

  for (let ri = 1; ri <= league.currentRound && ri < ROUNDS.length; ri++) {
    const round = ROUNDS[ri];
    const matchups = league.bracket[round.id] || [];
    if (!matchups.length) continue;

    html += `<div class="region-header" style="font-size:1.5rem;">${round.name.toUpperCase()}</div>`;
    const grouped = {};
    for (const m of matchups) {
      const t1 = findTeamByFullId(m.team1);
      const rk = t1 ? t1.region : (m.region || 'Other');
      if (!grouped[rk]) grouped[rk] = [];
      grouped[rk].push(m);
    }

    for (const region of REGIONS) {
      if (!grouped[region]) continue;
      html += `<div style="font-family:'Bebas Neue',sans-serif; font-size:1.1rem; color:var(--text-secondary);
                   letter-spacing:2px; margin:1rem 0 0.5rem;">${region.toUpperCase()}</div>`;
      for (const m of grouped[region]) {
        const t1 = findTeamByFullId(m.team1), t2 = findTeamByFullId(m.team2);
        if (m.result) {
          const w1 = m.result.winner === m.team1;
          html += `<div class="card" style="margin-bottom:0.5rem; padding:0.75rem 1rem;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div style="flex:1;"><span style="font-weight:${w1?'800':'400'}; color:${w1?'var(--success)':'var(--text-muted)'};">
                (${t1.seed}) ${t1.name}</span> <span style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; margin-left:0.5rem;
                color:${w1?'var(--white)':'var(--text-muted)'};">${m.result.score1}</span></div>
              <div style="color:var(--text-muted); margin:0 0.75rem; font-size:0.8rem;">FINAL</div>
              <div style="flex:1; text-align:right;"><span style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; margin-right:0.5rem;
                color:${!w1?'var(--white)':'var(--text-muted)'};">${m.result.score2}</span>
                <span style="font-weight:${!w1?'800':'400'}; color:${!w1?'var(--success)':'var(--text-muted)'};">
                (${t2.seed}) ${t2.name}</span></div>
            </div></div>`;
        } else {
          html += `<div class="card" style="margin-bottom:0.5rem; padding:0.75rem 1rem; border-color:rgba(243,156,18,0.3);">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div style="flex:1; font-weight:600;">(${t1.seed}) ${t1.name}</div>
              <div style="color:var(--warning); font-size:0.8rem; font-weight:700; margin:0 0.75rem;">PENDING</div>
              <div style="flex:1; text-align:right; font-weight:600;">(${t2.seed}) ${t2.name}</div>
            </div></div>`;
        }
      }
    }
  }
  return html;
}

// ========== PREDICTION ==========

function renderPrediction() {
  const player = state.currentPlayer, league = state.league;
  const roundIdx = league.currentRound, round = ROUNDS[roundIdx];
  const team = findTeamByFullId(player.teamId);

  if (player.eliminated) {
    return `<div class="eliminated-overlay"><h2>ELIMINATED</h2>
      <p>Your team was knocked out. Follow on the Bracket, Leaderboard, and Chat tabs.</p></div>`;
  }

  const matchups = league.bracket[round.id] || [];
  let matchup = matchups.find(m => m.team1 === player.teamId || m.team2 === player.teamId);
  if (!matchup) return `<div class="empty-state"><p>Matchups for ${round.name} haven't been set yet.</p></div>`;

  const oppId = matchup.team1 === player.teamId ? matchup.team2 : matchup.team1;
  const opponent = findTeamByFullId(oppId);

  if (matchup.result) {
    return `<div class="card" style="text-align:center; padding:2rem;">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; color:var(--text-secondary); letter-spacing:2px;">
        THIS GAME HAS BEEN PLAYED</div><p style="color:var(--text-muted); margin-top:0.5rem;">Check the Results tab.</p></div>`;
  }

  const existing = (player.predictions || []).find(p => p.round === roundIdx);
  if (existing) {
    return `<div class="prediction-panel">
      <div style="text-align:center; margin-bottom:1rem;">
        <div style="font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:2px; color:var(--text-muted);">${round.name.toUpperCase()}</div></div>
      <div class="matchup-display"><div class="matchup-teams">
        <div class="matchup-team user-team"><div class="seed-badge">${team.seed}</div><div class="team-label">${team.name}</div></div>
        <div class="matchup-vs">VS</div>
        <div class="matchup-team"><div class="seed-badge">${opponent.seed}</div><div class="team-label">${opponent.name}</div></div>
      </div></div>
      <div style="text-align:center; padding:2rem; background:rgba(46,204,113,0.05); border-radius:14px; border:1px solid rgba(46,204,113,0.2);">
        <div style="font-family:'Bebas Neue',sans-serif; font-size:1.3rem; color:var(--success); letter-spacing:2px; margin-bottom:1rem;">PREDICTION LOCKED IN</div>
        <div class="score-breakdown">
          <div class="score-item"><div class="score-label">Total Points</div><div class="score-value">${existing.total}</div></div>
          <div class="score-item"><div class="score-label">Win Margin</div><div class="score-value">${existing.spread>0?'+':''}${existing.spread}</div></div>
          <div class="score-item"><div class="score-label">Outcome</div><div class="score-value" style="color:${existing.willAdvance?'var(--success)':'var(--danger)'}">${existing.willAdvance?'WIN':'LOSS'}</div></div>
        </div>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:1.25rem;">Waiting for the game to finish...</p>
      </div></div>`;
  }

  return `<div class="prediction-panel slide-up">
    <div style="text-align:center; margin-bottom:0.5rem;">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:2px; color:var(--text-muted);">${round.name.toUpperCase()}</div></div>
    <div class="matchup-display"><div class="matchup-teams">
      <div class="matchup-team user-team"><div class="seed-badge">${team.seed}</div><div class="team-label">${team.name}</div></div>
      <div class="matchup-vs">VS</div>
      <div class="matchup-team"><div class="seed-badge">${opponent.seed}</div><div class="team-label">${opponent.name}</div></div>
    </div></div>
    <div class="prediction-inputs">
      <div class="prediction-field">
        <label>Combined Total Points</label>
        <div class="number-input">
          <button onclick="adjustNumber('totalInput',-5)">-</button>
          <input type="number" id="totalInput" value="140" min="50" max="250">
          <button onclick="adjustNumber('totalInput',5)">+</button></div>
        <div class="helper-text">Both teams' scores combined</div>
      </div>
      <div class="prediction-field">
        <label>Your Team's Win Margin</label>
        <div class="number-input">
          <button onclick="adjustNumber('spreadInput',-1)">-</button>
          <input type="number" id="spreadInput" value="5" min="-50" max="50">
          <button onclick="adjustNumber('spreadInput',1)">+</button></div>
        <div class="helper-text">Positive = your team wins by X</div>
      </div>
    </div>
    <div style="text-align:center;">
      <label style="display:block; font-size:0.8rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:var(--text-secondary); margin-bottom:0.75rem;">Will ${team.name} advance?</label>
      <div class="will-advance-toggle">
        <button class="toggle-btn win active" id="toggleWin" onclick="toggleAdvance(true)">WIN & ADVANCE</button>
        <button class="toggle-btn lose" id="toggleLose" onclick="toggleAdvance(false)">ELIMINATED</button>
      </div>
    </div>
    <div style="text-align:center; margin-top:1.5rem;">
      <button class="btn btn-primary btn-lg" onclick="doSubmitPrediction()">Lock In Prediction</button></div>
  </div>
  <div class="card" style="margin-top:1.5rem;">
    <div class="card-header"><h3>SCORING GUIDE</h3></div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
      <div style="padding:0.75rem; background:rgba(15,15,35,0.5); border-radius:10px;">
        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total & Spread</div>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.5rem; line-height:1.6;">
          Spot on: <strong style="color:var(--success);">10 pts</strong><br>Within 2: <strong style="color:var(--ball-orange);">8 pts</strong><br>
          Within 5: <strong style="color:var(--warning);">6 pts</strong><br>Within 8: <strong>4 pts</strong><br>Within 12: <strong>2 pts</strong></div></div>
      <div style="padding:0.75rem; background:rgba(15,15,35,0.5); border-radius:10px;">
        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Bonus</div>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.5rem; line-height:1.6;">
          <strong style="color:var(--success);">+5 pts</strong> for correct<br>win/loss prediction<br><br>
          <strong style="color:var(--ball-orange);">Max 25 pts</strong> per round</div></div>
    </div></div>`;
}

// ========== LEADERBOARD ==========

function renderLeaderboard() {
  const league = state.league;
  const players = [...league.players].sort((a, b) => getTotalPlayerScore(b) - getTotalPlayerScore(a));

  let html = `<div style="margin-bottom:1.5rem;">
    <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2rem; letter-spacing:3px; color:var(--ball-orange);">LEADERBOARD</h2>
    <p style="color:var(--text-secondary); font-size:0.9rem;">${league.name} &bull; ${ROUNDS[league.currentRound].name}</p></div>
    <table class="leaderboard-table"><thead><tr>
      <th style="width:60px;">Rank</th><th>Player</th><th>Team</th>
      <th style="text-align:center;">Status</th><th style="text-align:center;">Accuracy</th>
      <th style="text-align:right;">Score</th></tr></thead><tbody>`;

  players.forEach((p, i) => {
    const rank = i + 1, team = findTeamByFullId(p.teamId);
    const score = getTotalPlayerScore(p);
    const maxP = p.results ? p.results.length * 25 : 0;
    const acc = maxP > 0 ? Math.round((score / maxP) * 100) : 0;
    const isMe = p.id === state.playerId;
    const prev = p.previousRank || rank, change = prev - rank;
    let ch = '<span class="rank-same">-</span>';
    if (change > 0) ch = `<span class="rank-up">&uarr;${change}</span>`;
    else if (change < 0) ch = `<span class="rank-down">&darr;${Math.abs(change)}</span>`;

    html += `<tr class="${isMe?'current-user':''}">
      <td><div class="rank ${rank<=3?'rank-'+rank:''}">${rank}</div><div style="text-align:center;">${ch}</div></td>
      <td><div class="player-cell">
        <div class="user-avatar" style="width:32px;height:32px;font-size:0.75rem;">${getInitials(p.name)}</div>
        <div><div style="font-weight:600;">${p.name}${isMe?' (You)':''}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${p.results?p.results.length:0} rounds played</div></div></div></td>
      <td><span class="player-team-badge">${team?`(${team.seed}) ${team.name}`:'picking...'}</span></td>
      <td style="text-align:center;">${p.eliminated?'<span class="status-eliminated">Eliminated</span>':'<span class="status-active">Active</span>'}</td>
      <td style="text-align:center;"><div>${acc}%</div>
        <div class="accuracy-bar" style="width:80px; margin:0 auto;">
          <div class="fill ${getAccuracyClass(acc/10)}" style="width:${acc}%;"></div></div></td>
      <td class="score-cell" style="text-align:right;">${score}</td></tr>`;
  });

  return html + '</tbody></table>';
}

// ========== RESULTS ==========

function renderResults() {
  const player = state.currentPlayer, results = player.results || [];
  let html = `<div style="margin-bottom:1.5rem;">
    <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2rem; letter-spacing:3px; color:var(--ball-orange);">YOUR RESULTS</h2></div>`;
  if (!results.length) return html + `<div class="empty-state"><div style="font-size:3rem; margin-bottom:1rem;">&#127936;</div><p>No results yet.</p></div>`;

  for (const r of [...results].reverse()) {
    const round = ROUNDS[r.round], team = findTeamByFullId(player.teamId), opp = findTeamByFullId(r.opponentId);
    const tp = r.totalScore||0, sp = r.spreadScore||0, bp = r.advanceBonus||0;
    html += `<div class="result-card ${r.teamAdvanced?'win':'loss'} fade-in">
      <div class="result-header"><div class="result-round">${round.name}</div>
        <div class="result-outcome ${r.teamAdvanced?'win':'loss'}">${r.teamAdvanced?'ADVANCED':'ELIMINATED'}</div></div>
      <div style="display:flex; justify-content:center; align-items:center; gap:1.5rem; margin-bottom:1rem;">
        <div style="text-align:center; font-weight:700;">(${team.seed}) ${team.name}</div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:2rem; color:var(--ball-orange);">${r.actualScore1} - ${r.actualScore2}</div>
        <div style="text-align:center; font-weight:700;">(${opp?opp.seed:'?'}) ${opp?opp.name:'TBD'}</div></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
        <div style="background:rgba(15,15,35,0.5); border-radius:10px; padding:0.75rem; text-align:center;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Your Total Prediction</div>
          <div style="font-family:'Bebas Neue',sans-serif; font-size:1.5rem;">${r.predictedTotal}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">Actual: ${r.actualTotal}</div></div>
        <div style="background:rgba(15,15,35,0.5); border-radius:10px; padding:0.75rem; text-align:center;">
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Your Spread Prediction</div>
          <div style="font-family:'Bebas Neue',sans-serif; font-size:1.5rem;">${r.predictedSpread>0?'+':''}${r.predictedSpread}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">Actual: ${r.actualSpread>0?'+':''}${r.actualSpread}</div></div></div>
      <div class="score-breakdown">
        <div class="score-item"><div class="score-label">Total</div><div class="score-value">${tp}/10</div>
          <div class="accuracy-bar"><div class="fill ${getAccuracyClass(tp)}" style="width:${tp*10}%;"></div></div></div>
        <div class="score-item"><div class="score-label">Spread</div><div class="score-value">${sp}/10</div>
          <div class="accuracy-bar"><div class="fill ${getAccuracyClass(sp)}" style="width:${sp*10}%;"></div></div></div>
        <div class="score-item"><div class="score-label">Bonus</div><div class="score-value">${bp}/5</div>
          <div class="accuracy-bar"><div class="fill ${bp>0?'excellent':'poor'}" style="width:${bp*20}%;"></div></div></div></div>
      <div style="text-align:center; margin-top:1rem; font-family:'Bebas Neue',sans-serif; font-size:1.3rem; letter-spacing:2px;">
        ROUND SCORE: <span style="color:var(--ball-orange);">${tp+sp+bp} / 25</span></div></div>`;
  }
  return html;
}

// ========== MESSAGES ==========

function renderMessages() {
  const league = state.league, player = state.currentPlayer;
  const msgs = (league.messages || []).filter(m => m.channel === 'group');

  return `<div class="messages-container">
    <div class="players-list">
      <div class="players-list-header">PLAYERS</div>
      <div class="player-list-item active">
        <div class="user-avatar" style="width:32px;height:32px;font-size:0.65rem;background:linear-gradient(135deg,var(--ball-orange),var(--leather));">ALL</div>
        <div><div style="font-weight:600; font-size:0.9rem;">Group Chat</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${league.players.length} members</div></div></div>
      ${league.players.filter(p => p.id !== player.id).map(p => {
        const pt = findTeamByFullId(p.teamId);
        return `<div class="player-list-item">
          <div class="user-avatar" style="width:32px;height:32px;font-size:0.7rem;">${getInitials(p.name)}</div>
          <div><div style="font-weight:600; font-size:0.9rem;">${p.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${pt?`(${pt.seed}) ${pt.name}`:''}</div></div></div>`;
      }).join('')}
    </div>
    <div class="chat-panel group-chat">
      <div class="chat-header">
        <div class="user-avatar" style="width:28px;height:28px;font-size:0.6rem;background:linear-gradient(135deg,var(--ball-orange),var(--leather));">ALL</div>
        <div><div style="font-weight:700;">${league.name} — Group Chat</div></div></div>
      <div class="chat-messages" id="chatMessages">
        ${msgs.length === 0 ?
          '<div class="empty-state" style="padding:2rem;"><div style="font-size:2rem; margin-bottom:0.5rem;">&#128172;</div><p>No messages yet. Talk some trash!</p></div>'
          : msgs.map(m => {
            const sent = m.senderId === player.id;
            const sender = league.players.find(p => p.id === m.senderId);
            return `<div class="chat-message ${sent?'sent':'received'}">
              <div class="msg-sender">${sent?'You':(sender?sender.name:'Unknown')}</div>
              <div>${escapeHtml(m.text)}</div>
              <div class="msg-time">${timeAgo(m.timestamp)}</div></div>`;
          }).join('')}
      </div>
      <div class="chat-input-area">
        <input type="text" id="chatInput" placeholder="Type a message..." onkeydown="if(event.key==='Enter')doSendMessage()">
        <button onclick="doSendMessage()">${sendIconSVG()}</button>
      </div>
    </div></div>`;
}

// ========== ADMIN ==========

function renderAdmin() {
  const league = state.league, roundIdx = league.currentRound, round = ROUNDS[roundIdx];
  const matchups = league.bracket[round.id] || [];
  const done = matchups.filter(m => m.result).length, pending = matchups.length - done;

  let html = `<div style="margin-bottom:1.5rem;">
    <h2 style="font-family:'Bebas Neue',sans-serif; font-size:2rem; letter-spacing:3px; color:var(--ball-orange);">ADMIN — ENTER RESULTS</h2>
    <p style="color:var(--text-secondary); font-size:0.9rem;">${round.name}: ${done} of ${matchups.length} games complete</p></div>

    <div style="margin-bottom:1.5rem;">
      <button class="btn btn-primary btn-lg" id="checkScoresBtn" onclick="doCheckScores()" style="width:100%;">
        &#127936; Check Scores from ESPN
      </button>
      <p style="color:var(--text-muted); font-size:0.8rem; text-align:center; margin-top:0.5rem;">
        Automatically fetches final scores for completed games and scores all predictions</p>
    </div>

    <div id="scoreCheckResult"></div>

    <div class="admin-section" style="border-color:var(--glass-border); background:var(--card-bg);">
      <h3 style="color:var(--ball-orange);">${round.name.toUpperCase()} MATCHUPS</h3>`;

  matchups.forEach((m, idx) => {
    const t1 = findTeamByFullId(m.team1), t2 = findTeamByFullId(m.team2);
    if (m.result) {
      const w = findTeamByFullId(m.result.winner);
      html += `<div class="card" style="margin-bottom:0.5rem; opacity:0.7;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
          <span style="font-weight:700;">(${t1.seed}) ${t1.name} ${m.result.score1} - ${m.result.score2} (${t2.seed}) ${t2.name}</span>
          <span style="color:var(--success); font-weight:700; font-size:0.85rem;">${w.name} wins</span></div></div>`;
    } else {
      html += `<div class="card" style="margin-bottom:0.75rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.75rem;">
          <div><span style="font-weight:700;">(${t1.seed}) ${t1.name}</span>
            <span style="color:var(--text-muted); margin:0 0.5rem;">vs</span>
            <span style="font-weight:700;">(${t2.seed}) ${t2.name}</span></div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input type="number" class="form-input" style="width:70px; padding:0.5rem; text-align:center;" id="score1_${idx}" placeholder="${t1.name}" min="0">
            <span style="color:var(--text-muted);">-</span>
            <input type="number" class="form-input" style="width:70px; padding:0.5rem; text-align:center;" id="score2_${idx}" placeholder="${t2.name}" min="0">
            <button class="btn btn-sm btn-primary" onclick="doEnterResult(${idx})">Save</button></div></div></div>`;
    }
  });

  const allDone = matchups.length > 0 && matchups.every(m => m.result);
  if (allDone && roundIdx < ROUNDS.length - 1) {
    html += `<div style="text-align:center; margin-top:1.5rem;">
      <button class="btn btn-primary btn-lg" onclick="doAdvance()">Advance to ${ROUNDS[roundIdx+1].name}</button></div>`;
  } else if (allDone && roundIdx === ROUNDS.length - 1) {
    html += `<div style="text-align:center; margin-top:1.5rem; padding:2rem;">
      <div style="font-family:'Bebas Neue',sans-serif; font-size:2.5rem; color:var(--ball-orange);">TOURNAMENT COMPLETE!</div></div>`;
  }

  return html + '</div>';
}

// ========== ACTIONS (all async, hit server) ==========

function navigate(view) { state.view = view; render(); }
function switchTab(tab) { state.activeTab = tab; render(); }
function goHome() { stopPolling(); state.view = 'home'; state.league = null; state.playerId = null; state.currentPlayer = null; render(); }

async function doCreateLeague() {
  const leagueName = document.getElementById('leagueName').value.trim();
  const playerName = document.getElementById('playerName').value.trim();
  if (!leagueName || !playerName) { showToast('Fill in both fields', 'error'); return; }

  try {
    const btn = document.getElementById('createBtn');
    btn.disabled = true; btn.textContent = 'Creating...';
    const { league, playerId } = await api('POST', '/league', { leagueName, playerName });
    state.league = league;
    state.playerId = playerId;
    state.currentPlayer = league.players.find(p => p.id === playerId);
    state.selectedTeam = null;
    state.view = 'select-team';
    saveSession();
    startPolling();
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

async function doJoinLeague() {
  const code = document.getElementById('leagueCode').value.trim().toUpperCase();
  const playerName = document.getElementById('joinPlayerName').value.trim();
  if (!code || !playerName) { showToast('Fill in both fields', 'error'); return; }

  try {
    const btn = document.getElementById('joinBtn');
    btn.disabled = true; btn.textContent = 'Joining...';
    const { league, playerId } = await api('POST', `/league/${code}/join`, { playerName });
    state.league = league;
    state.playerId = playerId;
    state.currentPlayer = league.players.find(p => p.id === playerId);
    state.selectedTeam = null;
    state.view = 'select-team';
    saveSession();
    startPolling();
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

function selectTeam(fullId) { state.selectedTeam = fullId; render(); }

async function doPickTeam() {
  if (!state.selectedTeam) return;
  try {
    const { league } = await api('POST', `/league/${state.league.code}/pick-team`, {
      playerId: state.playerId, teamId: state.selectedTeam,
    });
    state.league = league;
    state.currentPlayer = league.players.find(p => p.id === state.playerId);
    state.view = 'app';
    state.activeTab = 'dashboard';
    saveSession();
    render();
    showToast('Team locked in! Good luck!', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

function adjustNumber(id, delta) {
  const el = document.getElementById(id);
  if (el) el.value = parseInt(el.value || 0) + delta;
}

function toggleAdvance(win) {
  const w = document.getElementById('toggleWin'), l = document.getElementById('toggleLose');
  if (w && l) { w.classList.toggle('active', win); l.classList.toggle('active', !win); }
  state._willAdvance = win;
}

async function doSubmitPrediction() {
  const total = parseInt(document.getElementById('totalInput').value) || 0;
  const spread = parseInt(document.getElementById('spreadInput').value) || 0;
  if (total < 50 || total > 250) { showToast('Total should be 50-250', 'error'); return; }

  try {
    const { league } = await api('POST', `/league/${state.league.code}/predict`, {
      playerId: state.playerId, total, spread, willAdvance: state._willAdvance,
    });
    state.league = league;
    state.currentPlayer = league.players.find(p => p.id === state.playerId);
    state._willAdvance = true;
    render();
    showToast('Prediction locked in!', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doEnterResult(idx) {
  const s1 = parseInt(document.getElementById(`score1_${idx}`).value);
  const s2 = parseInt(document.getElementById(`score2_${idx}`).value);
  if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) { showToast('Enter valid scores', 'error'); return; }
  if (s1 === s2) { showToast('No ties in March Madness!', 'error'); return; }

  try {
    const { league } = await api('POST', `/league/${state.league.code}/enter-result`, {
      matchupIdx: idx, score1: s1, score2: s2,
    });
    state.league = league;
    state.currentPlayer = league.players.find(p => p.id === state.playerId);
    render();
    showToast('Result saved & predictions scored!', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doCheckScores() {
  const btn = document.getElementById('checkScoresBtn');
  const resultDiv = document.getElementById('scoreCheckResult');
  btn.disabled = true;
  btn.innerHTML = '&#8987; Checking ESPN for scores...';

  try {
    const { league, newResults, espnGamesFound } = await api('POST', `/league/${state.league.code}/check-scores`);
    state.league = league;
    state.currentPlayer = league.players.find(p => p.id === state.playerId);

    if (resultDiv) {
      resultDiv.innerHTML = `<div class="card" style="margin-bottom:1rem; border-color:${newResults > 0 ? 'var(--success)' : 'var(--glass-border)'};">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:1.5rem;">${newResults > 0 ? '&#9989;' : '&#8505;'}</span>
          <div>
            <div style="font-weight:700; color:${newResults > 0 ? 'var(--success)' : 'var(--text-secondary)'};">
              ${newResults > 0 ? `Found ${newResults} new result${newResults > 1 ? 's' : ''}!` : 'No new results found'}
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted);">
              ${espnGamesFound} tournament games found on ESPN &bull; Checked last 7 days</div>
          </div>
        </div></div>`;
    }

    render();
    if (newResults > 0) showToast(`${newResults} new score${newResults>1?'s':''} found & applied!`, 'success');
    else showToast('No new final scores yet. Games may still be in progress.', 'info');
  } catch (e) {
    showToast('Failed to fetch scores: ' + e.message, 'error');
  }
}

async function doAdvance() {
  try {
    const { league } = await api('POST', `/league/${state.league.code}/advance`);
    state.league = league;
    state.currentPlayer = league.players.find(p => p.id === state.playerId);
    render();
    showToast(`Advanced to ${ROUNDS[league.currentRound].name}!`, 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function doSendMessage() {
  const input = document.getElementById('chatInput');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  try {
    const { league } = await api('POST', `/league/${state.league.code}/message`, {
      playerId: state.playerId, text,
    });
    state.league = league;
    state.currentPlayer = league.players.find(p => p.id === state.playerId);
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

function copyInviteCode() {
  if (!state.league) return;
  navigator.clipboard.writeText(state.league.code)
    .then(() => showToast('Code copied! Send it to your friends.', 'success'))
    .catch(() => showToast(`Code: ${state.league.code}`, 'info'));
}

function shareInvite() {
  if (!state.league) return;
  const url = window.location.origin;
  const text = `Join my March Madness With Skill league! Go to ${url} and use code: ${state.league.code}`;

  if (navigator.share) {
    navigator.share({ title: 'March Madness With Skill', text })
      .catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Invite message copied! Paste it to your friends.', 'success'))
      .catch(() => showToast(text, 'info'));
  }
}

async function rejoinSession() {
  const session = loadSession();
  if (!session) { showToast('No saved session found', 'error'); return; }
  await rejoinSpecificSession(session.code, session.playerId);
}

async function rejoinSpecificSession(code, playerId) {
  try {
    const league = await api('GET', `/league/${code}`);
    state.league = league;
    state.playerId = playerId;
    state.currentPlayer = league.players.find(p => p.id === playerId);
    if (state.currentPlayer) {
      if (!state.currentPlayer.teamId) {
        state.view = 'select-team';
        state.selectedTeam = null;
      } else {
        state.view = 'app';
        state.activeTab = 'dashboard';
      }
      saveSession(); // update cached info (team, names)
      startPolling();
      render();
    } else {
      removeSession(code, playerId);
      showToast('Session expired. Please join again.', 'error');
      render();
    }
  } catch {
    removeSession(code, playerId);
    showToast('League not found. It may have been reset.', 'error');
    render();
  }
}

// ========== TOASTS ==========

function showToast(message, type = 'info') {
  const c = document.getElementById('toasts');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span style="font-size:1.1rem;">${type==='success'?'&#10003;':type==='error'?'&#10007;':'&#8505;'}</span>
    <span style="font-size:0.9rem;">${message}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100px)'; t.style.transition='all 0.3s';
    setTimeout(() => t.remove(), 300); }, 3000);
}

// ========== PARTICLES ==========

function createParticles() {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    const s = Math.random() * 6 + 2;
    Object.assign(p.style, { width:`${s}px`, height:`${s}px`,
      background:`rgba(227,82,5,${Math.random()*0.15+0.05})`,
      left:`${Math.random()*100}%`, top:`${Math.random()*100}%`,
      animation:`float${i%3} ${Math.random()*10+15}s ease-in-out infinite`,
      animationDelay:`${Math.random()*5}s` });
    document.body.appendChild(p);
  }
  const st = document.createElement('style');
  st.textContent = `@keyframes float0{0%,100%{transform:translate(0,0)}25%{transform:translate(30px,-40px)}50%{transform:translate(-20px,-80px)}75%{transform:translate(40px,-40px)}}
    @keyframes float1{0%,100%{transform:translate(0,0)}33%{transform:translate(-40px,-30px)}66%{transform:translate(20px,-60px)}}
    @keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-50px)}}`;
  document.head.appendChild(st);
}

// ========== BOOT ==========

document.addEventListener('DOMContentLoaded', async () => {
  createParticles();
  // Always show home page — user picks which game to rejoin
  // Migrate old single-session format on first load
  loadAllSessions();
  state.view = 'home';
  render();
});
