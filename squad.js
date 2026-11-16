// squad.js: ekran zespołu (SQD-01, SQD-02, SQD-06)
// Wiele drużyn, każda z własną formacją i składem; klik na pozycję otwiera wybór zawodnika.

const SQUAD_DEFAULT_FORMATION = (typeof Save !== 'undefined' && Save.DEFAULT_FORMATION) || '4-3-3';
const PICKER_PAGE = 60;

// team.png: 1672x941, zewnętrzne linie boiska na y=238 (górna) i y=754 (dolna)
const SQUAD_BG = { width: 1672, height: 941, top: 238, bottom: 754 };
// karty w zespole 20% mniejsze niż w klubie (w klubie: transform: scale(0.6))
const SQUAD_CARD_SCALE = 0.48;
// Na niskich ekranach pasmo boiska jest za krótkie na karty 0.48 - wtedy zmniejszamy je
// tak, by między tą samą kolumną (np. GK/CB) został prześwit. Na 1080p limit nie obowiązuje.
const SQUAD_CARD_FIT = 0.29;
function squadCardScale(rect) {
  return Math.min(SQUAD_CARD_SCALE, (rect.height * SQUAD_CARD_FIT) / 353);
}

// Na krótkich ekranach dolna karta (GK) może wejść pod przyciski #nav.
// Przesuwamy wtedy całe pasmo boiska (razem z tłem) w górę o nadmiar,
// zostawiając 4 px kontrolowanego nachodzenia.
const SQUAD_NAV_OVERLAP = 4;
function squadNavShift(rect) {
  const nav = document.getElementById('nav');
  if (!nav || getComputedStyle(nav).display === 'none') return 0;
  const navTop = nav.getBoundingClientRect().top;
  const half = (353 * squadCardScale(rect)) / 2;
  const bottom = rect.top + rect.height + half;
  const shift = Math.max(0, (bottom - navTop) - SQUAD_NAV_OVERLAP);
  // nie wypychaj górnej linii nad ekran
  return Math.min(shift, Math.max(0, rect.top - 8));
}

// x: 0-100 w poziomie, y: 0-100 pasma boiska (0 = górna zewnętrzna linia, 100 = dolna).
// y=100 to dolna linia boiska - środek karty GK leży dokładnie na niej.
// 1 "cm" = 1% szerokości boiska (x) / 1% pasma boiska (y).
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

// Kolejność przycisków wyboru formacji (SQD-01).
const FORMATION_ORDER = ['4-4-2', '4-1-2-1-2', '4-3-2-1', '4-3-3', '4-5-1', '5-4-1', '5-3-2', '3-5-2', '3-4-1-2'];

// Formacje ukryte w selektorze — definicje pozostają w FORMATIONS/FORMATION_LINKS (SQD-01).
const HIDDEN_FORMATIONS = ['3-4-1-2'];

// Akceptowane pozycje zawodnika na danej pozycji formacji (SQD-03).
// 1 = dokładnie ta sama pozycja (zielony), 2 = dopuszczalna alternatywa (żółty),
// brak = niedopuszczalne (czerwony).
const SLOT_COMPAT = {
  GK: [],
  RB: ['RWB', 'RM', 'CB'],
  LB: ['LWB', 'LM', 'CB'],
  CB: ['CDM', 'LB', 'RB'],
  RWB: ['RB', 'RM'],
  LWB: ['LB', 'LM'],
  CDM: ['CM', 'CB'],
  CM: ['CDM', 'CAM'],
  CAM: ['CM', 'CF'],
  RM: ['RW', 'RB', 'LM', 'RWB'],
  LM: ['LW', 'LB', 'RM', 'LWB'],
  RW: ['RM', 'LW', 'RF'],
  LW: ['LM', 'RW', 'LF'],
  LF: ['LW', 'LM', 'CF'],
  RF: ['RW', 'RM', 'CF'],
  CF: ['ST', 'CAM', 'RF', 'LF'],
  ST: ['CF']
};

// ---------- linie zgrania (SQD-13) ----------

// Wartość połączenia między dwiema kartami (jak w FIFA 14-18):
//   3 = ten sam klub i ta sama nacja (hyper)
//   2 = ten sam klub  LUB  ta sama nacja i liga (strong)
//   1 = ta sama nacja  LUB  ta sama liga (weak)
//   0 = nic wspólnego (dead)
function squadLinkValue(a, b) {
  if (!a || !b) return 0;
  const sameClub = a.club_id != null && b.club_id != null && a.club_id === b.club_id;
  const sameNation = a.nation_id != null && b.nation_id != null && a.nation_id === b.nation_id;
  const sameLeague = a.league_id != null && b.league_id != null && a.league_id === b.league_id;
  if (sameClub && sameNation) return 3;
  if (sameClub) return 2;
  if (sameNation && sameLeague) return 2;
  if (sameNation || sameLeague) return 1;
  return 0;
}

// Połączenia slotów per formacja. Pary [a, b] to indeksy w tablicy formacji.
// Wzorzec FIFA 15: GK–obrońcy, obrońcy między sobą i z linią pomocy,
// pomoc między sobą i z atakiem, atak między sobą.
// Łatwa edycja: dodaj/usuń/zmień parę [a, b] poniżej.
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

// Zabezpieczenie: formacja bez definicji dostaje połączenia z geometrii
// (najbliżsi sąsiedzi w tej samej i sąsiednich liniach).
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

const pickerState = { squadId: null, index: -1, query: '', onlyFit: true, shown: PICKER_PAGE, league: '', club: '', nation: '' };

// Współrzędne z FORMATIONS są już w 0-100 pasma boiska (0 = górna linia, 100 = dolna).
function squadSlots(formation) {
  const list = FORMATIONS[formation] || FORMATIONS[SQUAD_DEFAULT_FORMATION];
  return list.map(slot => ({
    pos: slot.pos,
    x: slot.x,
    y: Math.max(0, Math.min(100, slot.y))
  }));
}

// Nieznana formacja w zapisie nie może rozjechać podsumowania z boiskiem.
function squadFormation(squad) {
  if (!squad) return SQUAD_DEFAULT_FORMATION;
  return FORMATIONS[squad.formation] ? squad.formation : SQUAD_DEFAULT_FORMATION;
}

// 'exact' = ta sama pozycja (zielony), 'alt' = akceptowalna (żółty), 'bad' = zła (czerwony)
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

// Chemistry w stylu FIFA 14-18 (uproszczony):
// - indywidualna chemia gracza (0-10) = pułap pozycji (exact 10 / alt 6 / bad 3) × osiągnięcie z linii.
// - osiągnięcie: baza 0.7 (same żółte), +0.15 za zieloną (liczą się do 2), -0.15 za czerwoną;
//   >=2 zielone i brak czerwonych => 1.0 (maks. z danego zakresu). Tylko czerwone obniżają.
// - chemia drużyny = średnia indywidualnych (0-10) × 10, czyli maksimum 100.
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

// Rating = średnia RAT wypełnionych slotów.
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

  // Escape i klik w tło zamykają wybór zawodnika
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

/* ---------- drużyny ---------- */

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

/* ---------- boisko ---------- */

// team.png rysowany jest w formacie "cover" (wyśrodkowany), więc pasmo boiska
// między zewnętrznymi liniami liczymy z naturalnych wymiarów obrazka.
// Na wąskich ekranach obraz jest szerszy niż ekran - wtedy skład mieścimy w widocznej części.
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

// Ustawia boisko dokładnie na narysowanych liniach i ustala rozmiar kart.
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

  // tło team.png musi być przesunięte razem z pasmem boiska
  const container = document.getElementById('squad-container');
  if (container) {
    const bgScale = rect.height / (SQUAD_BG.bottom - SQUAD_BG.top);
    const imageTop = top - SQUAD_BG.top * bgScale;
    container.style.backgroundPosition = 'center ' + imageTop.toFixed(1) + 'px';
  }

  return { left: rect.left, top: top, width: rect.width, height: rect.height };
}

// SVG z liniami zgrania (SQD-13). Rysowane tylko między wypełnionymi slotami.
// Kolor zależy od squadLinkValue: 0 = czerwony, 1 = brudnożółty, 2/3 = jasnozielony.
function squadLinksSvg(formation, squad, centers, rect) {
  const NS = 'http://www.w3.org/2000/svg';
  // połowa wysokości karty - do niej przesuwamy punkty linii na dolną krawędź
  const scale = squadCardScale(rect);
  const half = (353 * scale) / 2;
  // dodatkowo podnosimy koniec linii o połowę wysokości czcionki statystyk
  // (stats: 19px w CSS) w skali zespołu - nad dolną krawędź karty
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

    // linia nie celuje w centrum karty, tylko w dolną krawędź karty
    // (podniesioną o połowę wysokości czcionki statystyk, ale 1 px niżej)
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

  // boisko na narysowanych liniach; gdy widok jest ukryty, zostaje % z CSS
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
  // y slotów to % pasma boiska; środek karty ląduje na tej wysokości.
  // Górna linia zostawia margines (karta nie wchodzi pod górny pasek),
  // dół nie jest przycinany - środek karty GK leży dokładnie na dolnej linii.
  const half = (353 * squadCardScale(rect)) / 2;
  const margin = 4;
  const minCenter = half + margin;
  const maxCenter = rect ? rect.height : 0;

  // centra slotów w pikselach boiska - wspólne dla kart i linii zgrania
  const centers = slots.map(slot => ({
    x: (slot.x / 100) * (rect ? rect.width : 0),
    y: rect ? Math.max(minCenter, Math.min(maxCenter, (slot.y / 100) * rect.height)) : 0
  }));

  // linie zgrania rysowane pod kartami (SQD-13)
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

/* ---------- wybór zawodnika ---------- */

const PICKER_FILTER_DIMS = [
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

function pickerFillSelect(dim, filters) {
  const select = document.getElementById(dim.id);
  if (!select) return;
  const current = pickerState[dim.filter] || '';
  const display = value => (dim.nameMap && dim.nameMap[value]) ? dim.nameMap[value] : value;

  const values = new Set();
  pickerOwnedCards().forEach(card => {
    if (!pickerCatMatch(card, filters, dim.filter)) return;
    const value = pickerCatValue(card, dim.field);
    if (dim.nameMap && !dim.nameMap[value]) return;
    values.add(value);
  });

  const sorted = [...values].sort((a, b) => display(a).localeCompare(display(b), 'pl'));

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
  pickerState.league = '';
  pickerState.club = '';
  pickerState.nation = '';
  pickerState.shown = PICKER_PAGE;
  pickerApplyState();
  pickerRebuildFilters(null);
}

// Pamięć filtrów pickera per drużyna: po zmianie drużyny filtry wracają do
// stanu wybranego wcześniej dla tej drużyny (domyślnie puste).
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
  const usedPlayerIds = {};

  Save.getSquads().forEach(s => {
    s.slots.forEach((cardId, i) => {
      if (!cardId) return;
      if (s.id === squad.id) {
        if (i !== pickerState.index) {
          const card = squadCard(cardId);
          if (card) usedPlayerIds[card.player_id] = true;
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
    if (usedElsewhere[cardId] || usedPlayerIds[card.player_id]) return;
    if (query) {
      const surname = String(card.Surname).toLowerCase('pl');
      if (surname.indexOf(query) === -1 && cardId.toLowerCase().indexOf(query) === -1) return;
    }
    if (pickerState.league && String(card.league_id) !== pickerState.league) return;
    if (pickerState.club && String(card.club_id) !== pickerState.club) return;
    if (pickerState.nation && String(card.nation_id) !== pickerState.nation) return;
    if (pickerState.onlyFit && !fitsSlot(slot.pos, card.POS)) return;

    entries.push({ card, cardId });
  });

  entries.sort((a, b) => b.card.RAT - a.card.RAT || String(a.card.Surname).localeCompare(String(b.card.Surname), 'pl'));
  return entries;
}

function pickerTile(entry, slot, squad) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'picker-tile';

  const fits = fitsSlot(slot.pos, entry.card.POS);
  if (!fits) {
    tile.classList.add('off-position');
    tile.title = `${entry.card.POS} does not fit ${slot.pos}`;
  }

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

  tile.addEventListener('click', () => {
    Save.assignSlot(squad.id, pickerState.index, entry.cardId);
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