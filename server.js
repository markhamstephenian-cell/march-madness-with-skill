/* ========================================
   MARCH MADNESS WITH SKILL — Server
   Express backend with ESPN score fetching
   ======================================== */

const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Use /tmp on Railway (ephemeral but writable), local data/ dir otherwise
const DATA_DIR = process.env.RAILWAY_ENVIRONMENT
  ? '/tmp'
  : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leagues.json');

app.use(express.json());
app.use(express.static(__dirname));

// ========== DATA PERSISTENCE ==========

// In-memory store — persisted to disk as backup
let leaguesCache = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAllLeagues() {
  if (leaguesCache) return leaguesCache;
  ensureDataDir();
  try {
    leaguesCache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    leaguesCache = {};
  }
  return leaguesCache;
}

function saveAllLeagues(data) {
  leaguesCache = data;
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('File write failed (using memory only):', e.message);
  }
}

function getLeagueByCode(code) {
  const all = loadAllLeagues();
  for (const id in all) {
    if (all[id].code === code.toUpperCase()) return all[id];
  }
  return null;
}

function saveLeague(league) {
  const all = loadAllLeagues();
  all[league.id] = league;
  saveAllLeagues(all);
}

// ========== ESPN SCORE FETCHING ==========

// Map our team names to what ESPN uses
const TEAM_NAME_MAP = {
  'Duke': ['Duke', 'Duke Blue Devils'],
  'UConn': ['UConn', 'Connecticut', 'UConn Huskies'],
  'Michigan St': ['Michigan St', 'Michigan State', 'Michigan St. Spartans'],
  'Kansas': ['Kansas', 'Kansas Jayhawks'],
  "St. John's": ["St. John's", "St. John's Red Storm", "St. John's (NY)"],
  'Louisville': ['Louisville', 'Louisville Cardinals'],
  'UCLA': ['UCLA', 'UCLA Bruins'],
  'Ohio State': ['Ohio State', 'Ohio St', 'Ohio State Buckeyes'],
  'TCU': ['TCU', 'TCU Horned Frogs'],
  'UCF': ['UCF', 'UCF Knights'],
  'South Florida': ['South Florida', 'USF', 'South Florida Bulls'],
  'Northern Iowa': ['Northern Iowa', 'N Iowa', 'Northern Iowa Panthers'],
  'CA Baptist': ['CA Baptist', 'Cal Baptist', 'California Baptist', 'CBU'],
  'N Dakota St': ['N Dakota St', 'North Dakota St', 'North Dakota State', 'NDSU'],
  'Furman': ['Furman', 'Furman Paladins'],
  'Siena': ['Siena', 'Siena Saints'],
  'Arizona': ['Arizona', 'Arizona Wildcats'],
  'Purdue': ['Purdue', 'Purdue Boilermakers'],
  'Gonzaga': ['Gonzaga', 'Gonzaga Bulldogs'],
  'Arkansas': ['Arkansas', 'Arkansas Razorbacks'],
  'Wisconsin': ['Wisconsin', 'Wisconsin Badgers'],
  'BYU': ['BYU', 'Brigham Young', 'BYU Cougars'],
  'Miami': ['Miami', 'Miami Hurricanes', 'Miami (FL)'],
  'Villanova': ['Villanova', 'Villanova Wildcats'],
  'Utah State': ['Utah State', 'Utah St', 'Utah State Aggies'],
  'Missouri': ['Missouri', 'Missouri Tigers'],
  'Texas': ['Texas', 'Texas Longhorns'],
  'High Point': ['High Point', 'High Point Panthers'],
  "Hawai'i": ["Hawai'i", "Hawaii", "Hawai'i Rainbow Warriors"],
  'Kennesaw St': ['Kennesaw St', 'Kennesaw State', 'Kennesaw St. Owls'],
  'Queens': ['Queens', 'Queens University'],
  'Long Island': ['Long Island', 'LIU', 'Long Island University'],
  'Florida': ['Florida', 'Florida Gators'],
  'Houston': ['Houston', 'Houston Cougars'],
  'Illinois': ['Illinois', 'Illinois Fighting Illini'],
  'Nebraska': ['Nebraska', 'Nebraska Cornhuskers'],
  'Vanderbilt': ['Vanderbilt', 'Vanderbilt Commodores'],
  'North Carolina': ['North Carolina', 'UNC', 'North Carolina Tar Heels'],
  "Saint Mary's": ["Saint Mary's", "St. Mary's", "Saint Mary's Gaels"],
  'Clemson': ['Clemson', 'Clemson Tigers'],
  'Iowa': ['Iowa', 'Iowa Hawkeyes'],
  'Texas A&M': ['Texas A&M', 'Texas A&M Aggies'],
  'VCU': ['VCU', 'Virginia Commonwealth'],
  'McNeese': ['McNeese', 'McNeese State', 'McNeese St'],
  'Troy': ['Troy', 'Troy Trojans'],
  'Penn': ['Penn', 'Pennsylvania', 'Penn Quakers'],
  'Idaho': ['Idaho', 'Idaho Vandals'],
  'Prairie View': ['Prairie View', 'Prairie View A&M'],
  'Michigan': ['Michigan', 'Michigan Wolverines'],
  'Iowa State': ['Iowa State', 'Iowa St', 'Iowa State Cyclones'],
  'Virginia': ['Virginia', 'Virginia Cavaliers'],
  'Alabama': ['Alabama', 'Alabama Crimson Tide'],
  'Texas Tech': ['Texas Tech', 'Texas Tech Red Raiders'],
  'Tennessee': ['Tennessee', 'Tennessee Volunteers'],
  'Kentucky': ['Kentucky', 'Kentucky Wildcats'],
  'Georgia': ['Georgia', 'Georgia Bulldogs'],
  'Saint Louis': ['Saint Louis', 'St. Louis', 'Saint Louis Billikens'],
  'Santa Clara': ['Santa Clara', 'Santa Clara Broncos'],
  'Miami OH': ['Miami (OH)', 'Miami Ohio', 'Miami OH'],
  'Akron': ['Akron', 'Akron Zips'],
  'Hofstra': ['Hofstra', 'Hofstra Pride'],
  'Wright St': ['Wright St', 'Wright State', 'Wright St. Raiders'],
  'Tennessee St': ['Tennessee St', 'Tennessee State', 'Tennessee St. Tigers'],
  'Howard': ['Howard', 'Howard Bison'],
};

const TEAMS_DATA = {
  East: [
    { seed: 1, name: 'Duke' }, { seed: 2, name: 'UConn' },
    { seed: 3, name: 'Michigan St' }, { seed: 4, name: 'Kansas' },
    { seed: 5, name: "St. John's" }, { seed: 6, name: 'Louisville' },
    { seed: 7, name: 'UCLA' }, { seed: 8, name: 'Ohio State' },
    { seed: 9, name: 'TCU' }, { seed: 10, name: 'UCF' },
    { seed: 11, name: 'South Florida' }, { seed: 12, name: 'Northern Iowa' },
    { seed: 13, name: 'CA Baptist' }, { seed: 14, name: 'N Dakota St' },
    { seed: 15, name: 'Furman' }, { seed: 16, name: 'Siena' },
  ],
  West: [
    { seed: 1, name: 'Arizona' }, { seed: 2, name: 'Purdue' },
    { seed: 3, name: 'Gonzaga' }, { seed: 4, name: 'Arkansas' },
    { seed: 5, name: 'Wisconsin' }, { seed: 6, name: 'BYU' },
    { seed: 7, name: 'Miami' }, { seed: 8, name: 'Villanova' },
    { seed: 9, name: 'Utah State' }, { seed: 10, name: 'Missouri' },
    { seed: 11, name: 'Texas' }, { seed: 12, name: 'High Point' },
    { seed: 13, name: "Hawai'i" }, { seed: 14, name: 'Kennesaw St' },
    { seed: 15, name: 'Queens' }, { seed: 16, name: 'Long Island' },
  ],
  South: [
    { seed: 1, name: 'Florida' }, { seed: 2, name: 'Houston' },
    { seed: 3, name: 'Illinois' }, { seed: 4, name: 'Nebraska' },
    { seed: 5, name: 'Vanderbilt' }, { seed: 6, name: 'North Carolina' },
    { seed: 7, name: "Saint Mary's" }, { seed: 8, name: 'Clemson' },
    { seed: 9, name: 'Iowa' }, { seed: 10, name: 'Texas A&M' },
    { seed: 11, name: 'VCU' }, { seed: 12, name: 'McNeese' },
    { seed: 13, name: 'Troy' }, { seed: 14, name: 'Penn' },
    { seed: 15, name: 'Idaho' }, { seed: 16, name: 'Prairie View' },
  ],
  Midwest: [
    { seed: 1, name: 'Michigan' }, { seed: 2, name: 'Iowa State' },
    { seed: 3, name: 'Virginia' }, { seed: 4, name: 'Alabama' },
    { seed: 5, name: 'Texas Tech' }, { seed: 6, name: 'Tennessee' },
    { seed: 7, name: 'Kentucky' }, { seed: 8, name: 'Georgia' },
    { seed: 9, name: 'Saint Louis' }, { seed: 10, name: 'Santa Clara' },
    { seed: 11, name: 'Miami OH' }, { seed: 12, name: 'Akron' },
    { seed: 13, name: 'Hofstra' }, { seed: 14, name: 'Wright St' },
    { seed: 15, name: 'Tennessee St' }, { seed: 16, name: 'Howard' },
  ],
};

function findTeamByFullId(fullId) {
  if (!fullId) return null;
  const [region, seedStr] = fullId.split('-');
  const seed = parseInt(seedStr);
  const team = (TEAMS_DATA[region] || []).find(t => t.seed === seed);
  return team ? { ...team, region } : null;
}

function matchEspnTeamToOurs(espnName) {
  // Try direct name match first
  const espnLower = espnName.toLowerCase().trim();
  for (const [ourName, aliases] of Object.entries(TEAM_NAME_MAP)) {
    for (const alias of aliases) {
      if (alias.toLowerCase() === espnLower) return ourName;
    }
  }
  // Try partial match
  for (const [ourName, aliases] of Object.entries(TEAM_NAME_MAP)) {
    for (const alias of aliases) {
      if (espnLower.includes(alias.toLowerCase()) || alias.toLowerCase().includes(espnLower)) {
        return ourName;
      }
    }
  }
  return null;
}

function findBracketTeamId(teamName) {
  for (const region of ['East', 'West', 'South', 'Midwest']) {
    for (const team of TEAMS_DATA[region]) {
      if (team.name === teamName) return `${region}-${team.seed}`;
    }
  }
  return null;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Failed to parse ESPN response')); }
      });
    }).on('error', reject);
  });
}

async function fetchEspnScores() {
  // Fetch NCAA tournament scoreboard — try multiple date ranges
  const results = [];
  const today = new Date();

  // Check the last 7 days of games (covers current round)
  for (let daysBack = 0; daysBack <= 7; daysBack++) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${dateStr}&limit=50&groups=100`;
      const data = await fetchUrl(url);

      if (data.events) {
        for (const event of data.events) {
          const competition = event.competitions?.[0];
          if (!competition) continue;

          const status = competition.status?.type?.name; // STATUS_FINAL, STATUS_IN_PROGRESS, etc.
          if (status !== 'STATUS_FINAL') continue;

          const competitors = competition.competitors || [];
          if (competitors.length !== 2) continue;

          // ESPN lists home team first sometimes — use the order given
          const team1Data = competitors[0];
          const team2Data = competitors[1];

          const team1Name = team1Data.team?.shortDisplayName || team1Data.team?.displayName || '';
          const team2Name = team2Data.team?.shortDisplayName || team2Data.team?.displayName || '';
          const score1 = parseInt(team1Data.score) || 0;
          const score2 = parseInt(team2Data.score) || 0;

          const ourTeam1 = matchEspnTeamToOurs(team1Name);
          const ourTeam2 = matchEspnTeamToOurs(team2Name);

          if (ourTeam1 && ourTeam2) {
            results.push({
              espnTeam1: team1Name,
              espnTeam2: team2Name,
              ourTeam1,
              ourTeam2,
              score1,
              score2,
              date: dateStr,
              gameId: event.id,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching ESPN scores for ${dateStr}:`, err.message);
    }
  }

  return results;
}

// ========== SCORING ==========

function calculateScore(predicted, actual) {
  const diff = Math.abs(predicted - actual);
  if (diff === 0) return 10;
  if (diff <= 2) return 8;
  if (diff <= 5) return 6;
  if (diff <= 8) return 4;
  if (diff <= 12) return 2;
  return 0;
}

// ========== HEALTH CHECK ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// ========== API ROUTES ==========

// Get league by code
app.get('/api/league/:code', (req, res) => {
  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });
  res.json(league);
});

// Create league
app.post('/api/league', (req, res) => {
  const { leagueName, playerName } = req.body;
  if (!leagueName || !playerName) return res.status(400).json({ error: 'Missing fields' });

  const generateId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const playerId = generateId();
  const league = {
    id: generateId(),
    code: generateCode(),
    name: leagueName,
    players: [{
      id: playerId, name: playerName, teamId: null,
      predictions: [], results: [],
      eliminated: false, eliminatedRound: null, previousRank: 1,
    }],
    currentRound: 2,
    bracket: generate2026Bracket(),
    messages: [],
    createdAt: Date.now(),
  };

  saveLeague(league);
  res.json({ league, playerId });
});

// Join league
app.post('/api/league/:code/join', (req, res) => {
  const { playerName } = req.body;
  if (!playerName) return res.status(400).json({ error: 'Missing name' });

  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });

  if (league.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    return res.status(409).json({ error: 'Name already taken' });
  }

  const playerId = Math.random().toString(36).substring(2, 8).toUpperCase();
  league.players.push({
    id: playerId, name: playerName, teamId: null,
    predictions: [], results: [],
    eliminated: false, eliminatedRound: null, previousRank: league.players.length + 1,
  });

  saveLeague(league);
  res.json({ league, playerId });
});

// Pick team
app.post('/api/league/:code/pick-team', (req, res) => {
  const { playerId, teamId } = req.body;
  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });

  // Check if team already taken
  if (league.players.some(p => p.teamId === teamId && p.id !== playerId)) {
    return res.status(409).json({ error: 'Team already taken' });
  }

  const player = league.players.find(p => p.id === playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  player.teamId = teamId;
  saveLeague(league);
  res.json({ league });
});

// Submit prediction
app.post('/api/league/:code/predict', (req, res) => {
  const { playerId, total, spread, willAdvance } = req.body;
  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });

  const player = league.players.find(p => p.id === playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  // Check if already predicted this round
  if ((player.predictions || []).some(p => p.round === league.currentRound)) {
    return res.status(409).json({ error: 'Already predicted this round' });
  }

  if (!player.predictions) player.predictions = [];
  player.predictions.push({
    round: league.currentRound, total, spread, willAdvance, timestamp: Date.now(),
  });

  saveLeague(league);
  res.json({ league });
});

// Send message
app.post('/api/league/:code/message', (req, res) => {
  const { playerId, text } = req.body;
  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });

  if (!league.messages) league.messages = [];
  league.messages.push({
    id: Math.random().toString(36).substring(2, 8).toUpperCase(),
    senderId: playerId,
    channel: 'group',
    text: text.substring(0, 500), // Limit message length
    timestamp: Date.now(),
  });

  saveLeague(league);
  res.json({ league });
});

// Enter result manually
app.post('/api/league/:code/enter-result', (req, res) => {
  const { matchupIdx, score1, score2 } = req.body;
  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });

  const ROUNDS = [
    { id: 'first-four' }, { id: 'round-1' }, { id: 'round-2' },
    { id: 'sweet-16' }, { id: 'elite-8' }, { id: 'final-4' }, { id: 'championship' },
  ];

  const roundId = ROUNDS[league.currentRound].id;
  const matchup = (league.bracket[roundId] || [])[matchupIdx];
  if (!matchup) return res.status(404).json({ error: 'Matchup not found' });
  if (matchup.result) return res.status(409).json({ error: 'Result already entered' });
  if (score1 === score2) return res.status(400).json({ error: 'No ties allowed' });

  applyResult(league, matchupIdx, score1, score2);
  saveLeague(league);
  res.json({ league });
});

// Check scores from ESPN
app.post('/api/league/:code/check-scores', async (req, res) => {
  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });

  try {
    const espnResults = await fetchEspnScores();
    const ROUNDS = [
      { id: 'first-four' }, { id: 'round-1' }, { id: 'round-2' },
      { id: 'sweet-16' }, { id: 'elite-8' }, { id: 'final-4' }, { id: 'championship' },
    ];

    const roundId = ROUNDS[league.currentRound].id;
    const matchups = league.bracket[roundId] || [];
    let newResults = 0;

    for (let idx = 0; idx < matchups.length; idx++) {
      const matchup = matchups[idx];
      if (matchup.result) continue; // Already has result

      const t1 = findTeamByFullId(matchup.team1);
      const t2 = findTeamByFullId(matchup.team2);
      if (!t1 || !t2) continue;

      // Find this game in ESPN results
      for (const espn of espnResults) {
        const espnTeams = [espn.ourTeam1, espn.ourTeam2];
        const matchTeams = [t1.name, t2.name];

        if (espnTeams.includes(matchTeams[0]) && espnTeams.includes(matchTeams[1])) {
          // Match found! Determine score mapping
          let s1, s2;
          if (espn.ourTeam1 === t1.name) {
            s1 = espn.score1; s2 = espn.score2;
          } else {
            s1 = espn.score2; s2 = espn.score1;
          }

          applyResult(league, idx, s1, s2);
          newResults++;
          break;
        }
      }
    }

    saveLeague(league);
    res.json({ league, newResults, espnGamesFound: espnResults.length });
  } catch (err) {
    console.error('ESPN fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch scores from ESPN', detail: err.message });
  }
});

// Advance round
app.post('/api/league/:code/advance', (req, res) => {
  const league = getLeagueByCode(req.params.code);
  if (!league) return res.status(404).json({ error: 'League not found' });

  const ROUNDS = [
    { id: 'first-four' }, { id: 'round-1' }, { id: 'round-2' },
    { id: 'sweet-16' }, { id: 'elite-8' }, { id: 'final-4' }, { id: 'championship' },
  ];

  const roundId = ROUNDS[league.currentRound].id;
  const matchups = league.bracket[roundId] || [];

  if (!matchups.every(m => m.result)) {
    return res.status(400).json({ error: 'Not all games have results yet' });
  }

  // Save previous ranks
  const sorted = [...league.players].sort((a, b) => getTotalPlayerScoreServer(b) - getTotalPlayerScoreServer(a));
  sorted.forEach((p, i) => p.previousRank = i + 1);

  // Generate next round matchups
  const nextRoundIdx = league.currentRound + 1;
  if (nextRoundIdx >= ROUNDS.length) {
    return res.status(400).json({ error: 'Tournament is over' });
  }

  const winners = matchups.filter(m => m.result).map(m => m.result.winner);
  const nextMatchups = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      nextMatchups.push({ team1: winners[i], team2: winners[i + 1], result: null });
    }
  }

  league.bracket[ROUNDS[nextRoundIdx].id] = nextMatchups;
  league.currentRound = nextRoundIdx;

  saveLeague(league);
  res.json({ league });
});

// ========== HELPER: Apply result & score predictions ==========

function applyResult(league, matchupIdx, score1, score2) {
  const ROUNDS = [
    { id: 'first-four' }, { id: 'round-1' }, { id: 'round-2' },
    { id: 'sweet-16' }, { id: 'elite-8' }, { id: 'final-4' }, { id: 'championship' },
  ];

  const roundId = ROUNDS[league.currentRound].id;
  const matchup = league.bracket[roundId][matchupIdx];
  const winner = score1 > score2 ? matchup.team1 : matchup.team2;
  const actualTotal = score1 + score2;
  const actualSpread1 = score1 - score2;

  matchup.result = { score1, score2, winner, actualTotal };

  // Score all players involved in this matchup
  for (const player of league.players) {
    if (player.teamId !== matchup.team1 && player.teamId !== matchup.team2) continue;
    const prediction = (player.predictions || []).find(p => p.round === league.currentRound);
    if (!prediction) continue;

    // Don't double-score
    if ((player.results || []).some(r => r.round === league.currentRound)) continue;

    const isTeam1 = player.teamId === matchup.team1;
    const actualSpread = isTeam1 ? actualSpread1 : -actualSpread1;
    const teamAdvanced = player.teamId === winner;

    if (!player.results) player.results = [];
    player.results.push({
      round: league.currentRound,
      opponentId: isTeam1 ? matchup.team2 : matchup.team1,
      predictedTotal: prediction.total,
      predictedSpread: prediction.spread,
      actualTotal,
      actualSpread,
      actualScore1: isTeam1 ? score1 : score2,
      actualScore2: isTeam1 ? score2 : score1,
      teamAdvanced,
      totalScore: calculateScore(prediction.total, actualTotal),
      spreadScore: calculateScore(prediction.spread, actualSpread),
      advanceBonus: (prediction.willAdvance === teamAdvanced) ? 5 : 0,
    });

    if (!teamAdvanced) {
      player.eliminated = true;
      player.eliminatedRound = league.currentRound;
    }
  }
}

function getTotalPlayerScoreServer(player) {
  let total = 0;
  for (const r of (player.results || [])) {
    total += (r.totalScore || 0) + (r.spreadScore || 0) + (r.advanceBonus || 0);
  }
  return total;
}

// ========== BRACKET GENERATOR ==========

function generate2026Bracket() {
  const bracket = {};

  bracket['round-1'] = [
    // EAST
    { team1: 'East-1', team2: 'East-16', region: 'East', result: { score1: 71, score2: 65, winner: 'East-1', actualTotal: 136 } },
    { team1: 'East-8', team2: 'East-9', region: 'East', result: { score1: 64, score2: 66, winner: 'East-9', actualTotal: 130 } },
    { team1: 'East-5', team2: 'East-12', region: 'East', result: { score1: 79, score2: 53, winner: 'East-5', actualTotal: 132 } },
    { team1: 'East-4', team2: 'East-13', region: 'East', result: { score1: 68, score2: 60, winner: 'East-4', actualTotal: 128 } },
    { team1: 'East-6', team2: 'East-11', region: 'East', result: { score1: 83, score2: 79, winner: 'East-6', actualTotal: 162 } },
    { team1: 'East-3', team2: 'East-14', region: 'East', result: { score1: 92, score2: 67, winner: 'East-3', actualTotal: 159 } },
    { team1: 'East-7', team2: 'East-10', region: 'East', result: { score1: 75, score2: 71, winner: 'East-7', actualTotal: 146 } },
    { team1: 'East-2', team2: 'East-15', region: 'East', result: { score1: 82, score2: 71, winner: 'East-2', actualTotal: 153 } },
    // WEST
    { team1: 'West-1', team2: 'West-16', region: 'West', result: { score1: 92, score2: 58, winner: 'West-1', actualTotal: 150 } },
    { team1: 'West-8', team2: 'West-9', region: 'West', result: { score1: 76, score2: 86, winner: 'West-9', actualTotal: 162 } },
    { team1: 'West-5', team2: 'West-12', region: 'West', result: { score1: 82, score2: 83, winner: 'West-12', actualTotal: 165 } },
    { team1: 'West-4', team2: 'West-13', region: 'West', result: { score1: 97, score2: 78, winner: 'West-4', actualTotal: 175 } },
    { team1: 'West-6', team2: 'West-11', region: 'West', result: { score1: 71, score2: 79, winner: 'West-11', actualTotal: 150 } },
    { team1: 'West-3', team2: 'West-14', region: 'West', result: { score1: 73, score2: 64, winner: 'West-3', actualTotal: 137 } },
    { team1: 'West-7', team2: 'West-10', region: 'West', result: { score1: 80, score2: 66, winner: 'West-7', actualTotal: 146 } },
    { team1: 'West-2', team2: 'West-15', region: 'West', result: { score1: 104, score2: 71, winner: 'West-2', actualTotal: 175 } },
    // SOUTH
    { team1: 'South-1', team2: 'South-16', region: 'South', result: { score1: 114, score2: 55, winner: 'South-1', actualTotal: 169 } },
    { team1: 'South-8', team2: 'South-9', region: 'South', result: { score1: 61, score2: 67, winner: 'South-9', actualTotal: 128 } },
    { team1: 'South-5', team2: 'South-12', region: 'South', result: { score1: 78, score2: 68, winner: 'South-5', actualTotal: 146 } },
    { team1: 'South-4', team2: 'South-13', region: 'South', result: { score1: 76, score2: 47, winner: 'South-4', actualTotal: 123 } },
    { team1: 'South-6', team2: 'South-11', region: 'South', result: { score1: 78, score2: 82, winner: 'South-11', actualTotal: 160 } },
    { team1: 'South-3', team2: 'South-14', region: 'South', result: { score1: 105, score2: 70, winner: 'South-3', actualTotal: 175 } },
    { team1: 'South-7', team2: 'South-10', region: 'South', result: { score1: 50, score2: 63, winner: 'South-10', actualTotal: 113 } },
    { team1: 'South-2', team2: 'South-15', region: 'South', result: { score1: 78, score2: 47, winner: 'South-2', actualTotal: 125 } },
    // MIDWEST
    { team1: 'Midwest-1', team2: 'Midwest-16', region: 'Midwest', result: { score1: 101, score2: 80, winner: 'Midwest-1', actualTotal: 181 } },
    { team1: 'Midwest-8', team2: 'Midwest-9', region: 'Midwest', result: { score1: 77, score2: 102, winner: 'Midwest-9', actualTotal: 179 } },
    { team1: 'Midwest-5', team2: 'Midwest-12', region: 'Midwest', result: { score1: 91, score2: 71, winner: 'Midwest-5', actualTotal: 162 } },
    { team1: 'Midwest-4', team2: 'Midwest-13', region: 'Midwest', result: { score1: 90, score2: 70, winner: 'Midwest-4', actualTotal: 160 } },
    { team1: 'Midwest-6', team2: 'Midwest-11', region: 'Midwest', result: { score1: 78, score2: 56, winner: 'Midwest-6', actualTotal: 134 } },
    { team1: 'Midwest-3', team2: 'Midwest-14', region: 'Midwest', result: { score1: 82, score2: 73, winner: 'Midwest-3', actualTotal: 155 } },
    { team1: 'Midwest-7', team2: 'Midwest-10', region: 'Midwest', result: { score1: 89, score2: 84, winner: 'Midwest-7', actualTotal: 173 } },
    { team1: 'Midwest-2', team2: 'Midwest-15', region: 'Midwest', result: { score1: 108, score2: 74, winner: 'Midwest-2', actualTotal: 182 } },
  ];

  bracket['round-2'] = [
    // EAST
    { team1: 'East-1', team2: 'East-9', region: 'East', result: { score1: 81, score2: 58, winner: 'East-1', actualTotal: 139 } },
    { team1: 'East-5', team2: 'East-4', region: 'East', result: null },
    { team1: 'East-6', team2: 'East-3', region: 'East', result: null },
    { team1: 'East-7', team2: 'East-2', region: 'East', result: null },
    // WEST
    { team1: 'West-1', team2: 'West-9', region: 'West', result: null },
    { team1: 'West-12', team2: 'West-4', region: 'West', result: { score1: 88, score2: 94, winner: 'West-4', actualTotal: 182 } },
    { team1: 'West-11', team2: 'West-3', region: 'West', result: { score1: 74, score2: 68, winner: 'West-11', actualTotal: 142 } },
    { team1: 'West-7', team2: 'West-2', region: 'West', result: null },
    // SOUTH
    { team1: 'South-1', team2: 'South-9', region: 'South', result: null },
    { team1: 'South-5', team2: 'South-4', region: 'South', result: { score1: 72, score2: 74, winner: 'South-4', actualTotal: 146 } },
    { team1: 'South-11', team2: 'South-3', region: 'South', result: { score1: 55, score2: 76, winner: 'South-3', actualTotal: 131 } },
    { team1: 'South-10', team2: 'South-2', region: 'South', result: { score1: 57, score2: 88, winner: 'South-2', actualTotal: 145 } },
    // MIDWEST
    { team1: 'Midwest-1', team2: 'Midwest-9', region: 'Midwest', result: { score1: 95, score2: 72, winner: 'Midwest-1', actualTotal: 167 } },
    { team1: 'Midwest-5', team2: 'Midwest-4', region: 'Midwest', result: null },
    { team1: 'Midwest-6', team2: 'Midwest-3', region: 'Midwest', result: null },
    { team1: 'Midwest-7', team2: 'Midwest-2', region: 'Midwest', result: null },
  ];

  return bracket;
}

// ========== START ==========

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   MARCH MADNESS WITH SKILL — 2026   ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log(`  ║   Running on ${HOST}:${PORT}             ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});
