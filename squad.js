// squad.js: squad screen (SQD-01, SQD-02, SQD-06)
// Multiple squads, each with its own formation and lineup; clicking a slot opens the player picker.

const SQUAD_DEFAULT_FORMATION = (typeof Save !== 'undefined' && Save.DEFAULT_FORMATION) || '4-3-3';
const PICKER_PAGE = 60;

// team.png: 1672x941, pitch outer lines at y=238 (top) and y=754 (bottom)
const SQUAD_BG = { width: 1672, height: 941, top: 238, bottom: 754 };
// Squad cards are 20% smaller than in the club (club uses transform: scale(0.6))
const SQUAD_CARD_SCALE = 0.48;
// On short screens the pitch band is too short for 0.48 cards, so they are scaled down
// to keep a gap within the same column (e.g. GK/CB). The limit does not apply at 1080p.
const SQUAD_CARD_FIT = 0.29;
function squadCardScale(rect) {
  return Math.min(SQUAD_CARD_SCALE, (rect.height * SQUAD_CARD_FIT) / 353);
}

// On short screens the bottom card (GK) may overlap the #nav buttons.
// Shift the whole pitch band (with its background) up by the overflow,
// leaving 4 px of controlled overlap.
const SQUAD_NAV_OVERLAP = 4;
function squadNavShift(rect) {
  const nav = document.getElementById('nav');
  if (!nav || getComputedStyle(nav).display === 'none') return 0;
  const navTop = nav.getBoundingClientRect().top;
  const half = (353 * squadCardScale(rect)) / 2;
  const bottom = rect.top + rect.height + half;
  const shift = Math.max(0, (bottom - navTop) - SQUAD_NAV_OVERLAP);
  // do not push the top line off-screen
  return Math.min(shift, Math.max(0, rect.top - 8));
}

// x: 0-100 horizontally, y: 0-100 of the pitch band (0 = top outer line, 100 = bottom).
// y=100 is the bottom pitch line - the GK card center sits exactly on it.
// 1 "cm" = 1% of pitch width (x) / 1% of pitch band (y).
const FORMATIONS = {
  '4-3-2-1': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LB', x: 12, y: 68 }, { pos: 'CB', x: 38, y: 71 }, { pos: 'CB', x: 62, y: 71 }, { pos: 'RB', x: 88, y: 68 },
    { pos: 'CM', x: 25, y: 46 }, { pos: 'CM', x: 50, y: 46 }, { pos: 'CM', x: 75, y: 46 },
    { pos: 'LF', x: 35, y: 28 }, { pos: 'RF', x: 65, y: 28 },
    { pos: 'ST', x: 50, y: 4 }
  ],
  '4-1-2-1-2': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LB', x: 12, y: 68 }, { pos: 'CB', x: 38, y: 71 }, { pos: 'CB', x: 62, y: 71 }, { pos: 'RB', x: 88, y: 68 },
    { pos: 'LM', x: 25, y: 46 }, { pos: 'CDM', x: 50, y: 57 }, { pos: 'RM', x: 75, y: 46 },
    { pos: 'CAM', x: 50, y: 28 },
    { pos: 'ST', x: 34, y: 6 }, { pos: 'ST', x: 66, y: 6 }
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LB', x: 12, y: 68 }, { pos: 'CB', x: 38, y: 71 }, { pos: 'CB', x: 62, y: 71 }, { pos: 'RB', x: 88, y: 68 },
    { pos: 'LM', x: 12, y: 37 }, { pos: 'CM', x: 31, y: 43 }, { pos: 'CM', x: 69, y: 43 }, { pos: 'RM', x: 88, y: 37 },
    { pos: 'ST', x: 38, y: 6 }, { pos: 'ST', x: 62, y: 6 }
  ],
  '4-3-3': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LB', x: 12, y: 68 }, { pos: 'CB', x: 38, y: 71 }, { pos: 'CB', x: 62, y: 71 }, { pos: 'RB', x: 88, y: 68 },
    { pos: 'CM', x: 24, y: 46 }, { pos: 'CM', x: 50, y: 46 }, { pos: 'CM', x: 76, y: 46 },
    { pos: 'LW', x: 17, y: 20 }, { pos: 'ST', x: 50, y: 4 }, { pos: 'RW', x: 82, y: 20 }
  ],
  '4-5-1': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LB', x: 10, y: 67 }, { pos: 'CB', x: 35, y: 71 }, { pos: 'CB', x: 65, y: 71 }, { pos: 'RB', x: 90, y: 67 },
    { pos: 'LM', x: 10, y: 37 }, { pos: 'CAM', x: 28, y: 22 }, { pos: 'CM', x: 50, y: 47.5 }, { pos: 'CAM', x: 72, y: 22 }, { pos: 'RM', x: 90, y: 37 },
    { pos: 'ST', x: 50, y: 6 }
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'CB', x: 24, y: 67 }, { pos: 'CB', x: 50, y: 71 }, { pos: 'CB', x: 76, y: 67 },
    { pos: 'LWB', x: 10, y: 34 }, { pos: 'CM', x: 31, y: 40 }, { pos: 'CAM', x: 50, y: 28 }, { pos: 'CM', x: 69, y: 40 }, { pos: 'RWB', x: 90, y: 34 },
    { pos: 'ST', x: 38, y: 8 }, { pos: 'ST', x: 62, y: 8 }
  ],
  '3-4-1-2': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'CB', x: 24, y: 67 }, { pos: 'CB', x: 50, y: 71 }, { pos: 'CB', x: 76, y: 67 },
    { pos: 'LM', x: 12, y: 38 }, { pos: 'CM', x: 31, y: 44 }, { pos: 'CM', x: 69, y: 44 }, { pos: 'RM', x: 88, y: 38 },
    { pos: 'CAM', x: 50, y: 24 },
    { pos: 'ST', x: 38, y: 6 }, { pos: 'ST', x: 62, y: 6 }
  ],
  '5-4-1': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LWB', x: 8, y: 60 }, { pos: 'CB', x: 28, y: 65 }, { pos: 'CB', x: 50, y: 68 }, { pos: 'CB', x: 72, y: 65 }, { pos: 'RWB', x: 92, y: 60 },
    { pos: 'LM', x: 15, y: 36 }, { pos: 'CM', x: 38, y: 44 }, { pos: 'CM', x: 62, y: 44 }, { pos: 'RM', x: 85, y: 36 },
    { pos: 'ST', x: 50, y: 8 }
  ],
  '5-3-2': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LWB', x: 8, y: 60 }, { pos: 'CB', x: 28, y: 65 }, { pos: 'CB', x: 50, y: 68 }, { pos: 'CB', x: 72, y: 65 }, { pos: 'RWB', x: 92, y: 60 },
    { pos: 'CM', x: 24, y: 36 }, { pos: 'CM', x: 50, y: 39 }, { pos: 'CM', x: 76, y: 36 },
    { pos: 'ST', x: 38, y: 8 }, { pos: 'ST', x: 62, y: 8 }
  ]
};

// Formation picker button order (SQD-01).
const FORMATION_ORDER = ['4-4-2', '4-1-2-1-2', '4-3-2-1', '4-3-3', '4-5-1', '5-4-1', '5-3-2', '3-5-2', '3-4-1-2'];

// Formations hidden from the picker — definitions remain in FORMATIONS/FORMATION_LINKS (SQD-01).
const HIDDEN_FORMATIONS = ['3-4-1-2'];

// Accepted player positions for a formation slot (SQD-03).
// exact = same position (green), alt = acceptable alternative (yellow),
// missing = not allowed (red).
const SLOT_COMPAT = {
  GK: [],
  RB: ['RWB', 'RM', 'CB'],
  LB: ['LWB', 'LM', 'CB'],
  CB: ['CDM', 'LB', 'RB'],
  RWB: ['RB', 'RM'],
  LWB: ['LB', 'LM'],
  CDM: ['CM', 'CB'],
  CM: ['CDM', 'CAM', 'RM', 'LM'],
  CAM: ['CM', 'CF'],
  RM: ['RW', 'RB', 'LM', 'RWB', 'CM'],
  LM: ['LW', 'LB', 'RM', 'LWB', 'CM'],
  RW: ['RM', 'LW', 'RF'],
  LW: ['LM', 'RW', 'LF'],
  LF: ['LW', 'CF', 'RF'],
  RF: ['RW', 'CF', 'LF'],
  CF: ['ST', 'CAM', 'RF', 'LF'],
  ST: ['CF']
};

// ---------- chemistry links (SQD-13) ----------

// Link value between two cards (as in FIFA 14-18):
//   3 = same club and same nation (hyper)
//   2 = same club OR (same nation and league) (strong)
//   1 = same nation OR same league (weak)
//   0 = nothing in common (dead)
// Legends (the "Legends" league) override these rules:
//   - two Legends cards: 2, or 3 with the same nation
//   - a Legend with any other card: at least 1, or 2 with the same nation
const LEGENDS_LEAGUE_ID = 8;
function squadLinkValue(a, b) {
  if (!a || !b) return 0;
  const sameNation = a.nation_id != null && b.nation_id != null && a.nation_id === b.nation_id;
  const aLegend = a.league_id != null && String(a.league_id) === String(LEGENDS_LEAGUE_ID);
  const bLegend = b.league_id != null && String(b.league_id) === String(LEGENDS_LEAGUE_ID);
  if (aLegend && bLegend) return sameNation ? 3 : 2;
  if (aLegend || bLegend) return sameNation ? 2 : 1;
  const sameClub = a.club_id != null && b.club_id != null && a.club_id === b.club_id;
  const sameLeague = a.league_id != null && b.league_id != null && a.league_id === b.league_id;
  if (sameClub && sameNation) return 3;
  if (sameClub) return 2;
  if (sameNation && sameLeague) return 2;
  if (sameNation || sameLeague) return 1;
  return 0;
}

// Slot links per formation. Pairs [a, b] are indices in the formation array.
// FIFA 15 pattern: GK–defenders, defenders among themselves and with midfield,
// midfield among themselves and with the attack, attackers among themselves.
// Easy to edit: add/remove/change a [a, b] pair below.
const FORMATION_LINKS = {
  '4-3-2-1': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 5], [3, 7], [4, 7],
    [5, 6], [6, 7],
    [5, 8], [7, 9], [6, 8], [6, 9],
    [8, 10], [9, 10]
  ],
  '4-1-2-1-2': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 6], [3, 6], [4, 7],
    [5, 6], [6, 7],
    [5, 8], [7, 8], [6, 8],
    [8, 9], [8, 10], [9, 10],
    [5, 9], [7, 10]
  ],
  '4-4-2': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 6], [3, 7], [4, 8],
    [5, 6], [6, 7], [7, 8],
    [5, 9], [6, 9], [7, 10], [8, 10],
    [9, 10]
  ],
  '4-3-3': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 6], [3, 6], [4, 7],
    [5, 6], [6, 7],
    [5, 8], [7, 10], [6, 9],
    [8, 9], [9, 10]
  ],
  '4-5-1': [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4],
    [1, 5], [2, 7], [3, 7], [4, 9],
    [5, 6], [6, 7], [7, 8], [8, 9],
    [6, 8],
    [6, 10], [8, 10]
  ],
  '3-5-2': [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [2, 3],
    [1, 4], [1, 5], [2, 5], [2, 7], [3, 7], [3, 8],
    [4, 5], [5, 6], [6, 7], [7, 8],
    [6, 9], [6, 10],
    [4, 9], [8, 10],
    [9, 10]
  ],
  '3-4-1-2': [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [2, 3],
    [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [3, 7],
    [4, 5], [5, 6], [6, 7],
    [5, 8], [6, 8],
    [8, 9], [8, 10], [9, 10],
    [4, 9], [7, 10]
  ],
  '5-4-1': [
    [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 5],
    [1, 6], [2, 7], [3, 7], [3, 8], [4, 8], [5, 9],
    [6, 7], [7, 8], [8, 9],
    [6, 10], [7, 10], [8, 10], [9, 10]
  ],
  '5-3-2': [
    [0, 2], [0, 3], [0, 4],
    [1, 2], [2, 3], [3, 4], [4, 5],
    [1, 6], [2, 6], [3, 7], [4, 8], [5, 8],
    [6, 7], [7, 8],
    [6, 9], [7, 9], [7, 10], [8, 10],
    [9, 10]
  ]
};

// Fallback: a formation without a definition gets links from geometry
// (nearest neighbours in the same and adjacent lines).
function autoFormationLinks(slots) {
  const links = [];
  slots.forEach((a, i) => {
    slots.forEach((b, j) => {
      if (j <= i) return;
      const dy = Math.abs(a.y - b.y);
      const dx = Math.abs(a.x - b.x);
      if ((dy <= 9 && dx <= 40) || (dy <= 32 && dx <= 20)) links.push([i, j]);
    });
  });
  return links;
}

function squadFormationLinks(formation) {
  return FORMATION_LINKS[formation] || autoFormationLinks(squadSlots(formation));
}

const pickerState = { squadId: null, index: -1, query: '', onlyFit: true, shown: PICKER_PAGE, position: '', league: '', club: '', nation: '' };

// FORMATIONS coordinates are already 0-100 of the pitch band (0 = top, 100 = bottom).
function squadSlots(formation) {
  const list = FORMATIONS[formation] || FORMATIONS[SQUAD_DEFAULT_FORMATION];
  return list.map(slot => ({
    pos: slot.pos,
    x: slot.x,
    y: Math.max(0, Math.min(100, slot.y))
  }));
}

// An unknown formation in the save must not desync the summary from the pitch.
function squadFormation(squad) {
  if (!squad) return SQUAD_DEFAULT_FORMATION;
  return FORMATIONS[squad.formation] ? squad.formation : SQUAD_DEFAULT_FORMATION;
}

// 'exact' = same position (green), 'alt' = acceptable (yellow), 'bad' = wrong (red)
function slotMatch(slotPos, playerPos) {
  if (slotPos === playerPos) return 'exact';
  const list = SLOT_COMPAT[slotPos];
  return list && list.indexOf(playerPos) !== -1 ? 'alt' : 'bad';
}

function fitsSlot(slotPos, playerPos) {
  return slotMatch(slotPos, playerPos) !== 'bad';
}

function squadCard(cardId) {
  return typeof cardsById !== 'undefined' && cardsById[cardId] ? cardsById[cardId] : null;
}

// Chemistry in the style of FIFA 14-18 (simplified):
// - Individual player chemistry (0-10) = position ceiling (exact 10 / alt 6 / bad 3) × link achievement.
// - Achievement: base 0.7 (all yellow), +0.15 per green (up to 2), -0.15 per red;
//   >=2 green and no red => 1.0 (max for the given range). Only red lowers it.
// - Team chemistry = average individual (0-10) × 10, i.e. a maximum of 100.
function squadLinkCounts(squad, index) {
  const counts = { green: 0, yellow: 0, red: 0 };
  const self = squad.slots[index] ? squadCard(squad.slots[index]) : null;
  if (!self) return counts;
  squadFormationLinks(squadFormation(squad)).forEach(pair => {
    let other = -1;
    if (pair[0] === index) other = pair[1];
    else if (pair[1] === index) other = pair[0];
    if (other < 0) return;
    const mate = squad.slots[other] ? squadCard(squad.slots[other]) : null;
    if (!mate) return;
    const value = squadLinkValue(self, mate);
    if (value >= 2) counts.green++;
    else if (value === 1) counts.yellow++;
    else counts.red++;
  });
  return counts;
}

function squadLinkAchievement(green, yellow, red) {
  if (green + yellow + red === 0) return 1;
  if (green >= 2 && red === 0) return 1;
  return Math.max(0, Math.min(1, 0.7 + 0.15 * Math.min(green, 2) - 0.15 * red));
}

// Rating = average RAT of filled slots.
function squadStats(squad) {
  if (!squad) return { rating: 0, chemistry: 0, filled: 0, alt: 0, bad: 0 };
  const slots = squadSlots(squadFormation(squad));
  let sum = 0;
  let filled = 0;
  let alt = 0;
  let bad = 0;
  let chemSum = 0;
  squad.slots.forEach((cardId, i) => {
    const player = cardId ? squadCard(cardId) : null;
    const slot = slots[i];
    if (!player || !slot) return;
    const match = slotMatch(slot.pos, player.POS);
    if (match === 'alt') alt++;
    else if (match === 'bad') bad++;
    sum += Number(player.RAT) || 0;
    filled++;
    const ceiling = match === 'exact' ? 10 : match === 'alt' ? 6 : 3;
    const links = squadLinkCounts(squad, i);
    chemSum += ceiling * squadLinkAchievement(links.green, links.yellow, links.red);
  });
  return {
    rating: filled ? Math.round(sum / filled) : 0,
    chemistry: Math.max(0, Math.min(100, Math.round((chemSum / (slots.length || 11)) * 10))),
    filled,
    alt,
    bad
  };
}

/* ---------- init ---------- */

function squadInit() {
  const wrap = document.getElementById('squad-formations');
  if (wrap && !wrap.childElementCount) {
    const order = FORMATION_ORDER.filter(name => FORMATIONS[name] && HIDDEN_FORMATIONS.indexOf(name) === -1);
    Object.keys(FORMATIONS).forEach(name => {
      if (order.indexOf(name) === -1 && HIDDEN_FORMATIONS.indexOf(name) === -1) order.push(name);
    });
    order.forEach(name => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'formation-btn';
      button.dataset.formation = name;
      button.textContent = name;
      button.addEventListener('click', () => {
        const squad = Save.getActiveSquad();
        if (!squad) return;
        Save.setSquadFormation(squad.id, name);
        renderTeams();
        renderSquad();
      });
      wrap.appendChild(button);
    });
  }

  const newBtn = document.getElementById('squad-new');
  if (newBtn) newBtn.addEventListener('click', createTeam);

  const closeBtn = document.getElementById('picker-close');
  if (closeBtn) closeBtn.addEventListener('click', closePicker);

  const search = document.getElementById('picker-search');
  if (search) {
    search.addEventListener('input', () => {
      pickerState.query = search.value;
      pickerState.shown = PICKER_PAGE;
      renderPicker();
    });
  }

  const onlyFit = document.getElementById('picker-only-fit');
  if (onlyFit) {
    onlyFit.addEventListener('change', () => {
      pickerState.onlyFit = onlyFit.checked;
      pickerState.shown = PICKER_PAGE;
      renderPicker();
    });
  }

  PICKER_FILTER_DIMS.forEach(dim => {
    const el = document.getElementById(dim.id);
    if (!el) return;
    el.addEventListener('change', () => {
      pickerState[dim.filter] = el.value;
      pickerState.shown = PICKER_PAGE;
      pickerRebuildFilters(dim.filter);
      renderPicker();
    });
  });

  const more = document.getElementById('picker-more');
  if (more) {
    more.addEventListener('click', () => {
      pickerState.shown += PICKER_PAGE;
      renderPicker();
    });
  }

  const clear = document.getElementById('picker-clear');
  if (clear) {
    clear.addEventListener('click', () => {
      const squad = Save.getSquad(pickerState.squadId);
      if (!squad) return;
      Save.assignSlot(squad.id, pickerState.index, null);
      closePicker();
      renderSquad();
      renderTeams();
    });
  }

  // Escape and a backdrop click close the player picker
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePicker();
  });

  const overlay = document.getElementById('squad-picker');
  if (overlay) {
    overlay.addEventListener('mousedown', e => {
      if (e.target === overlay) closePicker();
    });
  }

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      squadLayout();
      renderSquad();
    });
  });

  ensureTeam();
  renderTeams();
  renderSquad();
}

/* ---------- teams ---------- */

function ensureTeam() {
  if (Save.getSquads().length) return;
  Save.createSquad('Team 1');
}

function nextTeamName() {
  const taken = {};
  Save.getSquads().forEach(s => { taken[s.name] = true; });
  let n = Save.getSquads().length + 1;
  while (taken['Team ' + n]) n++;
  return 'Team ' + n;
}

function createTeam() {
  pickerRemember();
  Save.createSquad(nextTeamName());
  pickerRestore();
  renderTeams();
  renderSquad();
}

function deleteTeam(squad) {
  const assigned = squad.slots.filter(Boolean).length;
  const extra = assigned ? ` ${assigned} assigned cards will return to the club.` : '';
  if (!window.confirm(`Delete team "${squad.name}"?${extra}`)) return;
  pickerRemember();
  Save.deleteSquad(squad.id);
  ensureTeam();
  pickerRestore();
  renderTeams();
  renderSquad();
}

function teamRow(squad, isActive) {
  const row = document.createElement('div');
  row.className = 'team-item' + (isActive ? ' active' : '');
  row.dataset.id = squad.id;

  const badge = document.createElement('span');
  badge.className = 'team-badge';
  badge.textContent = isActive ? '✓' : '○';
  row.appendChild(badge);

  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'team-name';
  name.value = squad.name;
  name.maxLength = 24;
  name.title = 'Click to rename';
  name.addEventListener('click', e => e.stopPropagation());
  name.addEventListener('change', () => {
    if (!Save.renameSquad(squad.id, name.value)) {
      name.value = squad.name;
    } else {
      name.value = squad.name;
      renderTeams();
      renderSquad();
    }
  });
  name.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); name.blur(); }
  });

  const stats = squadStats(squad);
  const statsEl = document.createElement('span');
  statsEl.className = 'team-stats';
  const rat = document.createElement('span');
  rat.className = 'team-rat';
  rat.title = 'Average rating';
  rat.textContent = 'RAT ' + stats.rating;
  const chem = document.createElement('span');
  chem.className = 'team-chem';
  chem.title = 'Chemistry';
  chem.textContent = 'CHEM ' + stats.chemistry;
  statsEl.appendChild(rat);
  statsEl.appendChild(chem);

  const main = document.createElement('span');
  main.className = 'team-main';
  main.appendChild(name);
  main.appendChild(statsEl);
  row.appendChild(main);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'team-del';
  del.textContent = '✕';
  del.title = 'Delete team';
  del.addEventListener('click', e => {
    e.stopPropagation();
    deleteTeam(squad);
  });
  row.appendChild(del);

  if (!isActive) {
    row.addEventListener('click', () => {
      pickerRemember();
      Save.setActiveSquad(squad.id);
      pickerRestore();
      renderTeams();
      renderSquad();
    });
  }

  return row;
}

function renderTeams() {
  const list = document.getElementById('squad-list');
  if (!list) return;

  const activeId = Save.getActiveSquadId();
  list.innerHTML = '';
  Save.getSquads().forEach(squad => list.appendChild(teamRow(squad, squad.id === activeId)));
}

/* ---------- pitch ---------- */

// team.png is drawn in "cover" mode (centered), so the pitch band between the
// outer lines is computed from the image's natural dimensions.
// On narrow screens the image is wider than the viewport, so the lineup fits the visible area.
function squadPitchRect() {
  const box = document.getElementById('squad-container');
  const vw = box && box.clientHeight ? box.clientWidth : window.innerWidth;
  const vh = box && box.clientHeight ? box.clientHeight : window.innerHeight;
  const scale = Math.max(vw / SQUAD_BG.width, vh / SQUAD_BG.height);
  const drawW = SQUAD_BG.width * scale;
  const width = Math.min(drawW, vw);
  return {
    left: (vw - width) / 2,
    top: (vh - SQUAD_BG.height * scale) / 2 + SQUAD_BG.top * scale,
    width: width,
    height: (SQUAD_BG.bottom - SQUAD_BG.top) * scale
  };
}

// Aligns the pitch exactly to the drawn lines and sets the card size.
function squadLayout() {
  const pitch = document.getElementById('squad-pitch');
  if (!pitch) return null;
  const rect = squadPitchRect();
  if (!rect.height) return null;
  const shift = squadNavShift(rect);
  const top = rect.top - shift;
  pitch.style.left = rect.left + 'px';
  pitch.style.top = top + 'px';
  pitch.style.width = rect.width + 'px';
  pitch.style.height = rect.height + 'px';
  pitch.style.setProperty('--squad-card-scale', squadCardScale(rect));

  // the team.png background must shift together with the pitch band
  const container = document.getElementById('squad-container');
  if (container) {
    const bgScale = rect.height / (SQUAD_BG.bottom - SQUAD_BG.top);
    const imageTop = top - SQUAD_BG.top * bgScale;
    container.style.backgroundPosition = 'center ' + imageTop.toFixed(1) + 'px';
  }

  return { left: rect.left, top: top, width: rect.width, height: rect.height };
}

// Chemistry link SVG (SQD-13). Drawn only between filled slots.
// Color depends on squadLinkValue: 0 = red, 1 = dirty yellow, 2/3 = light green.
function squadLinksSvg(formation, squad, centers, rect) {
  const NS = 'http://www.w3.org/2000/svg';
  // half the card height - line endpoints are shifted to the card's bottom edge
  const scale = squadCardScale(rect);
  const half = (353 * scale) / 2;
  // also raise the line endpoint by half the stats font height
  // (stats: 19px in CSS) in squad scale - above the card's bottom edge
  const raise = (19 * scale) / 2;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'squad-links');
  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);
  svg.setAttribute('aria-hidden', 'true');

  squadFormationLinks(formation).forEach(pair => {
    const a = pair[0];
    const b = pair[1];
    if (a === b) return;
    const cardA = squad.slots[a] ? squadCard(squad.slots[a]) : null;
    const cardB = squad.slots[b] ? squadCard(squad.slots[b]) : null;
    if (!cardA || !cardB) return;
    const p1 = centers[a];
    const p2 = centers[b];
    if (!p1 || !p2) return;

    // the line targets the card's bottom edge, not its center
    // (raised by half the stats font height, but 1 px lower)
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', p1.x.toFixed(1));
    line.setAttribute('y1', (p1.y + half - raise + 1).toFixed(1));
    line.setAttribute('x2', p2.x.toFixed(1));
    line.setAttribute('y2', (p2.y + half - raise + 1).toFixed(1));
    line.setAttribute('class', 'link-' + squadLinkValue(cardA, cardB));
    svg.appendChild(line);
  });

  return svg.childElementCount ? svg : null;
}

function renderSquad() {
  const pitch = document.getElementById('squad-pitch');
  if (!pitch) return;

  // pitch on the drawn lines; when the view is hidden, the CSS percentage remains
  const rect = squadLayout();

  const squad = Save.getActiveSquad();
  const formation = squadFormation(squad);

  document.querySelectorAll('#squad-formations .formation-btn').forEach(button => {
    button.classList.toggle('active', !!squad && button.dataset.formation === formation);
    button.disabled = !squad;
  });

  const summary = document.getElementById('squad-summary');
  if (summary) {
    const stats = squadStats(squad);
    summary.textContent = squad
      ? `${squad.name} · ${formation} · ${stats.filled}/11 slots filled · RAT ${stats.rating} · CHEM ${stats.chemistry}`
      : 'No team — click "Create team".';
  }

  pitch.innerHTML = '';

  if (!squad) {
    const empty = document.createElement('div');
    empty.className = 'squad-empty';
    empty.textContent = 'Create a team to set up your lineup.';
    pitch.appendChild(empty);
    return;
  }

  const slots = squadSlots(formation);
  // slot y is a percentage of the pitch band; the card center lands at that height.
  // The top line keeps a margin (the card does not go under the top bar),
  // the bottom is not clipped - the GK card center sits exactly on the bottom line.
  const half = (353 * squadCardScale(rect)) / 2;
  const margin = 4;
  const minCenter = half + margin;
  const maxCenter = rect ? rect.height : 0;

  // slot centers in pitch pixels - shared by cards and chemistry lines
  const centers = slots.map(slot => ({
    x: (slot.x / 100) * (rect ? rect.width : 0),
    y: rect ? Math.max(minCenter, Math.min(maxCenter, (slot.y / 100) * rect.height)) : 0
  }));

  // chemistry lines drawn under the cards (SQD-13)
  if (rect) {
    const links = squadLinksSvg(formation, squad, centers, rect);
    if (links) pitch.appendChild(links);
  }

  slots.forEach((slot, i) => {
    const cardId = squad.slots[i];
    const player = cardId ? squadCard(cardId) : null;

    const el = document.createElement('div');
    el.className = 'squad-slot' + (player ? ' filled' : '');
    if (player) {
      const match = slotMatch(slot.pos, player.POS);
      if (match === 'exact') el.classList.add('exact');
      if (match === 'alt') el.classList.add('compatible');
      if (match === 'bad') el.classList.add('misplaced');
    }
    el.style.left = slot.x + '%';
    el.style.top = rect
      ? centers[i].y.toFixed(1) + 'px'
      : slot.y + '%';
    el.dataset.index = i;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${slot.pos}: ${player ? player.Surname : 'empty'}`);

    if (player) {
      const cardWrap = document.createElement('div');
      cardWrap.className = 'slot-card';
      const card = renderCard(player);
      card.classList.add('show');
      cardWrap.appendChild(card);
      el.appendChild(cardWrap);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'slot-placeholder';
      placeholder.textContent = '+';
      el.appendChild(placeholder);
    }

    const pos = document.createElement('span');
    pos.className = 'slot-pos';
    pos.textContent = slot.pos;
    el.appendChild(pos);

    el.addEventListener('click', () => openPicker(i));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPicker(i);
      }
    });

    pitch.appendChild(el);
  });
}

function openSquad() {
  showView('squad');
  pickerRestore();
  renderTeams();
  renderSquad();
  requestAnimationFrame(() => {
    squadLayout();
    renderSquad();
  });
}

/* ---------- player picker ---------- */

const PICKER_FILTER_DIMS = [
  { id: 'picker-position', filter: 'position', field: 'POS', label: 'Any position' },
  { id: 'picker-league', filter: 'league', field: 'league_id', label: 'Any league', nameMap: LEAGUE_NAMES },
  { id: 'picker-club', filter: 'club', field: 'club_id', label: 'Any club', nameMap: CLUB_NAMES },
  { id: 'picker-nation', filter: 'nation', field: 'nation_id', label: 'Any nation', nameMap: NATION_NAMES }
];

function pickerOwnedCards() {
  const cards = [];
  Object.keys(Save.get().club).forEach(cardId => {
    const card = squadCard(cardId);
    if (card) cards.push(card);
  });
  return cards;
}

function pickerCatValue(card, field) {
  return String(card[field]);
}

function pickerCatMatch(card, filters, ignore) {
  for (const dim of PICKER_FILTER_DIMS) {
    if (dim.filter === ignore) continue;
    const selected = filters[dim.filter];
    if (selected && pickerCatValue(card, dim.field) !== selected) return false;
  }
  return true;
}

function pickerReadFilters() {
  const filters = {};
  PICKER_FILTER_DIMS.forEach(dim => { filters[dim.filter] = pickerState[dim.filter] || ''; });
  return filters;
}

function pickerDimHasSupport(filter, filters) {
  const selected = filters[filter];
  if (!selected) return true;
  const dim = PICKER_FILTER_DIMS.find(d => d.filter === filter);
  return pickerOwnedCards().some(card =>
    pickerCatMatch(card, filters, filter)
    && pickerCatValue(card, dim.field) === selected
  );
}

function pickerNormalize(anchor) {
  const filters = pickerReadFilters();
  let changed = true;
  while (changed) {
    changed = false;
    PICKER_FILTER_DIMS.forEach(dim => {
      if (dim.filter === anchor) return;
      if (filters[dim.filter] && !pickerDimHasSupport(dim.filter, filters)) {
        filters[dim.filter] = '';
        pickerState[dim.filter] = '';
        changed = true;
      }
    });
  }
}

function pickerRebuildFilters(anchor) {
  pickerNormalize(anchor);
  const filters = pickerReadFilters();
  PICKER_FILTER_DIMS.forEach(dim => pickerFillSelect(dim, filters));
}

// Allowed positions in the picker filter: the slot's primary position plus
// compatible positions (SLOT_COMPAT). Returns null for an unknown slot.
function pickerSlotPositions() {
  const squad = Save.getSquad(pickerState.squadId);
  if (!squad) return null;
  const slot = squadSlots(squadFormation(squad))[pickerState.index];
  if (!slot) return null;
  const list = [slot.pos];
  (SLOT_COMPAT[slot.pos] || []).forEach(p => {
    if (list.indexOf(p) === -1) list.push(p);
  });
  return list;
}

function pickerFillSelect(dim, filters) {
  const select = document.getElementById(dim.id);
  if (!select) return;
  const current = pickerState[dim.filter] || '';
  const display = value => (dim.nameMap && dim.nameMap[value]) ? dim.nameMap[value] : value;

  const allowed = dim.filter === 'position' ? pickerSlotPositions() : null;

  const values = new Set();
  pickerOwnedCards().forEach(card => {
    if (!pickerCatMatch(card, filters, dim.filter)) return;
    const value = pickerCatValue(card, dim.field);
    if (dim.nameMap && !dim.nameMap[value]) return;
    if (allowed && allowed.indexOf(value) === -1) return;
    values.add(value);
  });

  let sorted = [...values].sort((a, b) => display(a).localeCompare(display(b), 'pl'));

  // The slot's primary position is always first in the list (e.g. LW, then LM and RW).
  if (dim.filter === 'position' && allowed && allowed.length) {
    const main = allowed[0];
    const at = sorted.indexOf(main);
    if (at > 0) {
      sorted.splice(at, 1);
      sorted.unshift(main);
    }
  }

  select.innerHTML = '';
  const all = document.createElement('option');
  all.value = '';
  all.textContent = dim.label;
  select.appendChild(all);
  sorted.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = display(value);
    select.appendChild(option);
  });

  const next = sorted.includes(current) ? current : '';
  pickerState[dim.filter] = next;
  select.value = next;
}

function pickerApplyState() {
  const search = document.getElementById('picker-search');
  if (search) search.value = pickerState.query;
  const onlyFit = document.getElementById('picker-only-fit');
  if (onlyFit) onlyFit.checked = pickerState.onlyFit;
}

function pickerResetFilters() {
  pickerState.query = '';
  pickerState.onlyFit = true;
  pickerState.position = '';
  pickerState.league = '';
  pickerState.club = '';
  pickerState.nation = '';
  pickerState.shown = PICKER_PAGE;
  pickerApplyState();
  pickerRebuildFilters(null);
}

// Per-squad picker filter memory: switching squads restores the filters
// previously chosen for that squad (empty by default).
const pickerFilterMemory = {};

function pickerActiveId() {
  return (typeof Save !== 'undefined' && Save.getActiveSquadId) ? Save.getActiveSquadId() : null;
}

function pickerSnapshot() {
  return {
    query: pickerState.query,
    onlyFit: pickerState.onlyFit,
    league: pickerState.league,
    club: pickerState.club,
    nation: pickerState.nation
  };
}

function pickerApplySnapshot(snap) {
  pickerState.query = snap ? snap.query : '';
  pickerState.onlyFit = snap ? snap.onlyFit : true;
  pickerState.league = snap ? snap.league : '';
  pickerState.club = snap ? snap.club : '';
  pickerState.nation = snap ? snap.nation : '';
  pickerState.shown = PICKER_PAGE;
}

function pickerRemember() {
  const id = pickerActiveId();
  if (id) pickerFilterMemory[id] = pickerSnapshot();
}

function pickerRestore() {
  const id = pickerActiveId();
  pickerApplySnapshot(id ? pickerFilterMemory[id] : null);
  // Position is not part of the remembered state.
  pickerState.position = '';
  pickerApplyState();
  pickerRebuildFilters(null);
}

function pickerClearMemory() {
  Object.keys(pickerFilterMemory).forEach(k => { delete pickerFilterMemory[k]; });
  pickerResetFilters();
}

function openPicker(index) {
  const squad = Save.getActiveSquad();
  if (!squad) return;

  pickerState.squadId = squad.id;
  pickerState.index = index;
  pickerState.shown = PICKER_PAGE;
  // The position filter is not remembered - every slot opens without it.
  pickerState.position = '';

  const slot = squadSlots(squadFormation(squad))[index];
  const title = document.getElementById('picker-title');
  if (title) title.textContent = `${slot.pos} · ${squad.name}`;

  pickerApplyState();
  pickerRebuildFilters(null);

  const clear = document.getElementById('picker-clear');
  if (clear) clear.style.display = squad.slots[index] ? 'inline-block' : 'none';

  const overlay = document.getElementById('squad-picker');
  if (overlay) overlay.classList.add('open');

  renderPicker();
}

function closePicker() {
  const overlay = document.getElementById('squad-picker');
  if (overlay) overlay.classList.remove('open');
}

function pickerPool(slot, squad) {
  const usedElsewhere = {};
  const inSquad = {};
  const squadPlayerIds = {};

  Save.getSquads().forEach(s => {
    s.slots.forEach((cardId, i) => {
      if (!cardId) return;
      if (s.id === squad.id) {
        if (i !== pickerState.index) {
          inSquad[cardId] = true;
          const card = squadCard(cardId);
          if (card) squadPlayerIds[card.player_id] = true;
        }
      } else {
        usedElsewhere[cardId] = true;
      }
    });
  });

  const query = pickerState.query.trim().toLowerCase('pl');
  const entries = [];

  Object.keys(Save.get().club).forEach(cardId => {
    const card = squadCard(cardId);
    if (!card) return;
    if (usedElsewhere[cardId]) return;
    // A card from this squad is an option - selecting it moves it from its current slot.
    // Only a second card of the same player (different version) is blocked.
    if (squadPlayerIds[card.player_id] && !inSquad[cardId]) return;
    if (query) {
      const surname = String(card.Surname).toLowerCase('pl');
      if (surname.indexOf(query) === -1 && cardId.toLowerCase().indexOf(query) === -1) return;
    }
    if (pickerState.position && String(card.POS) !== pickerState.position) return;
    if (pickerState.league && String(card.league_id) !== pickerState.league) return;
    if (pickerState.club && String(card.club_id) !== pickerState.club) return;
    if (pickerState.nation && String(card.nation_id) !== pickerState.nation) return;
    if (pickerState.onlyFit && !fitsSlot(slot.pos, card.POS)) return;

    entries.push({ card, cardId, inSquad: !!inSquad[cardId] });
  });

  entries.sort((a, b) => b.card.RAT - a.card.RAT || String(a.card.Surname).localeCompare(String(b.card.Surname), 'pl'));
  return entries;
}

function pickerTile(entry, slot, squad) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'picker-tile';

  const notes = [];
  const fits = fitsSlot(slot.pos, entry.card.POS);
  if (!fits) {
    tile.classList.add('off-position');
    notes.push(`${entry.card.POS} does not fit ${slot.pos}`);
  }
  if (entry.inSquad) {
    tile.classList.add('in-squad');
    notes.push('Already in this squad - click to move here');
  }
  tile.title = notes.join(' · ');

  const wrap = document.createElement('div');
  wrap.className = 'club-card-wrap picker-card-wrap';
  const card = renderCard(entry.card);
  card.classList.add('show');
  wrap.appendChild(card);
  tile.appendChild(wrap);

  const label = document.createElement('span');
  label.className = 'picker-label';
  label.textContent = entry.card.POS;
  tile.appendChild(label);

  const name = document.createElement('span');
  name.className = 'picker-name';
  name.textContent = `${entry.card.Surname} · ${entry.card.RAT}`;
  tile.appendChild(name);

  if (entry.inSquad) {
    const badge = document.createElement('span');
    badge.className = 'picker-in-squad';
    badge.textContent = 'IN SQUAD';
    tile.appendChild(badge);
  }

  tile.addEventListener('click', () => {
    Save.assignSlotMoving(squad.id, pickerState.index, entry.cardId);
    closePicker();
    renderTeams();
    renderSquad();
  });

  return tile;
}

function renderPicker() {
  const grid = document.getElementById('picker-grid');
  if (!grid) return;

  const squad = Save.getSquad(pickerState.squadId);
  if (!squad) { closePicker(); return; }

  const slot = squadSlots(squadFormation(squad))[pickerState.index];
  if (!slot) { closePicker(); return; }

  const entries = pickerPool(slot, squad);
  grid.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'picker-empty';
    const clubEmpty = Object.keys(Save.get().club).length === 0;
    empty.textContent = clubEmpty ? 'No cards in the club.' : 'No players match the filters.';
    grid.appendChild(empty);
  } else {
    entries.slice(0, pickerState.shown).forEach(entry => grid.appendChild(pickerTile(entry, slot, squad)));
  }

  const more = document.getElementById('picker-more');
  if (more) more.style.display = entries.length > pickerState.shown ? 'block' : 'none';

  const clear = document.getElementById('picker-clear');
  if (clear) clear.style.display = squad.slots[pickerState.index] ? 'inline-block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  squadInit();
});