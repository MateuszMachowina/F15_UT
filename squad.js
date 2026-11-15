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
    { pos: 'CM', x: 25, y: 46 }, { pos: 'CDM', x: 50, y: 57 }, { pos: 'CM', x: 75, y: 46 },
    { pos: 'CAM', x: 35, y: 28 }, { pos: 'CAM', x: 65, y: 28 },
    { pos: 'ST', x: 50, y: 4 }
  ],
  '4-3-1-2': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LB', x: 12, y: 68 }, { pos: 'CB', x: 38, y: 71 }, { pos: 'CB', x: 62, y: 71 }, { pos: 'RB', x: 88, y: 68 },
    { pos: 'CM', x: 25, y: 46 }, { pos: 'CDM', x: 50, y: 57 }, { pos: 'CM', x: 75, y: 46 },
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
    { pos: 'CM', x: 27, y: 46 }, { pos: 'CDM', x: 50, y: 56 }, { pos: 'CM', x: 73, y: 46 },
    { pos: 'LW', x: 17, y: 26 }, { pos: 'ST', x: 50, y: 4 }, { pos: 'RW', x: 83, y: 26 }
  ],
  '4-5-1': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'LB', x: 10, y: 67 }, { pos: 'CB', x: 35, y: 71 }, { pos: 'CB', x: 65, y: 71 }, { pos: 'RB', x: 90, y: 67 },
    { pos: 'LM', x: 10, y: 37 }, { pos: 'CM', x: 28, y: 43 }, { pos: 'CDM', x: 50, y: 57 }, { pos: 'CM', x: 72, y: 43 }, { pos: 'RM', x: 90, y: 37 },
    { pos: 'ST', x: 50, y: 6 }
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 100 },
    { pos: 'CB', x: 24, y: 67 }, { pos: 'CB', x: 50, y: 71 }, { pos: 'CB', x: 76, y: 67 },
    { pos: 'LWB', x: 10, y: 34 }, { pos: 'CM', x: 31, y: 40 }, { pos: 'CDM', x: 50, y: 42 }, { pos: 'CM', x: 69, y: 40 }, { pos: 'RWB', x: 90, y: 34 },
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
    { pos: 'CM', x: 24, y: 36 }, { pos: 'CDM', x: 50, y: 39 }, { pos: 'CM', x: 76, y: 36 },
    { pos: 'ST', x: 38, y: 8 }, { pos: 'ST', x: 62, y: 8 }
  ]
};

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
  RW: ['RM', 'LW'],
  LW: ['LM', 'RW'],
  CF: ['ST', 'CAM'],
  ST: ['CF']
};

const pickerState = { squadId: null, index: -1, query: '', onlyFit: true, shown: PICKER_PAGE };

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

// Rating = średnia RAT wypełnionych slotów; Chemistry = 100 - 3*alt - 8*bad.
function squadStats(squad) {
  if (!squad) return { rating: 0, chemistry: 100, filled: 0, alt: 0, bad: 0 };
  const slots = squadSlots(squadFormation(squad));
  let sum = 0;
  let filled = 0;
  let alt = 0;
  let bad = 0;
  squad.slots.forEach((cardId, i) => {
    const player = cardId ? squadCard(cardId) : null;
    const slot = slots[i];
    if (!player || !slot) return;
    const match = slotMatch(slot.pos, player.POS);
    if (match === 'alt') alt++;
    else if (match === 'bad') bad++;
    sum += Number(player.RAT) || 0;
    filled++;
  });
  return {
    rating: filled ? Math.round(sum / filled) : 0,
    chemistry: Math.max(0, 100 - alt * 3 - bad * 8),
    filled,
    alt,
    bad
  };
}

/* ---------- init ---------- */

function squadInit() {
  const wrap = document.getElementById('squad-formations');
  if (wrap && !wrap.childElementCount) {
    Object.keys(FORMATIONS).forEach(name => {
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
  ensureTeam();
  Save.createSquad(nextTeamName());
  renderTeams();
  renderSquad();
}

function deleteTeam(squad) {
  const assigned = squad.slots.filter(Boolean).length;
  const extra = assigned ? ` ${assigned} assigned cards will return to the club.` : '';
  if (!window.confirm(`Delete team "${squad.name}"?${extra}`)) return;
  Save.deleteSquad(squad.id);
  ensureTeam();
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
      Save.setActiveSquad(squad.id);
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
      ? Math.max(minCenter, Math.min(maxCenter, (slot.y / 100) * rect.height)).toFixed(1) + 'px'
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
  renderTeams();
  renderSquad();
  requestAnimationFrame(() => {
    squadLayout();
    renderSquad();
  });
}

/* ---------- wybór zawodnika ---------- */

function openPicker(index) {
  const squad = Save.getActiveSquad();
  if (!squad) return;

  pickerState.squadId = squad.id;
  pickerState.index = index;
  pickerState.query = '';
  pickerState.onlyFit = true;
  pickerState.shown = PICKER_PAGE;

  const slot = squadSlots(squadFormation(squad))[index];
  const title = document.getElementById('picker-title');
  if (title) title.textContent = `${slot.pos} · ${squad.name}`;

  const search = document.getElementById('picker-search');
  if (search) search.value = '';

  const onlyFit = document.getElementById('picker-only-fit');
  if (onlyFit) onlyFit.checked = true;

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
  const usedHere = {};
  const usedElsewhere = {};

  Save.getSquads().forEach(s => {
    s.slots.forEach((cardId, i) => {
      if (!cardId) return;
      if (s.id === squad.id) {
        if (i !== pickerState.index) usedHere[cardId] = true;
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
    if (usedHere[cardId] || usedElsewhere[cardId]) return;
    if (query) {
      const surname = String(card.Surname).toLowerCase('pl');
      if (surname.indexOf(query) === -1 && cardId.toLowerCase().indexOf(query) === -1) return;
    }
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