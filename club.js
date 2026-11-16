// club.js: ekran klubu (CLB-02..06), szybka sprzedaż (ECO-02, ECO-03)

const CLUB_PAGE_SIZE = 60;

const LEAGUE_NAMES = {
  1: '2. Bundesliga',
  2: 'Argentine Primera División',
  3: 'Austrian Bundesliga',
  4: 'Bundesliga',
  5: 'Danish Superliga',
  6: 'Eredivisie',
  7: 'LaLiga',
  8: 'Legends',
  9: 'Liga MX',
  10: 'Ligue 1',
  11: 'MLS',
  12: 'Premier League',
  13: 'Primeira Liga',
  14: 'Russian Premier League',
  15: 'Saudi Pro League',
  16: 'Serie A',
  17: 'Super League Greece',
  18: 'Süper Lig',
  19: 'Ukrainian Premier League'
};

const CLUB_NAMES = {
  1: 'Arsenal',
  2: 'Aston Villa',
  5: 'Chelsea',
  7: 'Everton',
  9: 'Liverpool',
  10: 'Manchester City',
  11: 'Manchester United',
  17: 'Southampton',
  18: 'Tottenham Hotspur',
  19: 'West Ham',
  21: 'FC Bayern München',
  22: 'Borussia Dortmund',
  23: 'Borussia Mönchengladbach',
  28: 'Hamburger SV',
  32: 'Bayer 04 Leverkusen',
  34: 'FC Schalke 04',
  38: 'Werder Bremen',
  44: 'Inter',
  45: 'Juventus',
  46: 'Lazio',
  47: 'AC Milan',
  48: 'Napoli',
  52: 'Roma',
  54: 'Torino',
  59: 'FC Girondins de Bordeaux',
  65: 'Lille OSC',
  66: 'Olympique Lyonnais',
  69: 'AS Monaco',
  73: 'Paris Saint-Germain',
  106: 'Sunderland',
  175: 'VfL Wolfsburg',
  191: 'RB Salzburg',
  219: 'Olympique de Marseille',
  234: 'SL Benfica',
  236: 'FC Porto',
  237: 'Sporting CP',
  240: 'Atlético Madrid',
  241: 'FC Barcelona',
  243: 'Real Madrid',
  245: 'Ajax',
  247: 'PSV',
  269: 'Brøndby IF',
  280: 'Olympiacos FC',
  312: 'FC Dynamo Moscow',
  315: 'PFC CSKA',
  325: 'Galatasaray SK',
  326: 'Fenerbahçe SK',
  327: 'Besiktas JK',
  436: 'Trabzonspor',
  448: 'Athletic Club',
  449: 'Real Betis Balompié',
  450: 'RC Celta',
  452: 'RCD Espanyol',
  457: 'Real Sociedad',
  461: 'Valencia CF',
  481: 'Sevilla FC',
  483: 'Villarreal CF',
  573: 'Málaga CF',
  605: 'Al-Hilal',
  697: 'LA Galaxy',
  999: 'Legends',
  1799: 'Crystal Palace',
  1819: 'AS Saint-Étienne',
  1824: 'Eintracht Frankfurt',
  1837: 'Sampdoria',
  1877: 'Boca Juniors',
  1960: 'Swansea City',
  10029: 'TSG 1899 Hoffenheim',
  100765: 'FC Lokomotiv',
  100767: 'Spartak Moskva',
  100769: 'Zenit',
  101059: 'Shakhtar Donetsk',
  110150: 'Querétaro',
  110231: 'FC Rostov',
  110374: 'Fiorentina',
  110556: 'Genoa',
  111139: 'CF Montréal',
  111144: 'Seattle Sounders FC',
  111651: 'Toronto FC',
  112139: 'Al-Nassr',
  112606: 'Orlando City SC',
  112828: 'New York City FC'
};

const NATION_NAMES = {
  3: 'Armenia',
  4: 'Austria',
  7: 'Belgium',
  8: 'Bosnia Herzegovina',
  9: 'Bulgaria',
  10: 'Croatia',
  12: 'Czech',
  13: 'Denmark',
  14: 'England',
  15: 'Montenegro',
  17: 'Finland',
  18: 'France',
  21: 'Germany',
  22: 'Greece',
  25: 'Ireland',
  27: 'Italy',
  34: 'Netherlands',
  37: 'Poland',
  38: 'Portugal',
  39: 'Romania',
  40: 'Russia',
  43: 'Slovakia',
  44: 'Slovenia',
  45: 'Spain',
  46: 'Sweden',
  47: 'Switzerland',
  48: 'Turkey',
  49: 'Ukraine',
  50: 'Wales',
  51: 'Serbia',
  52: 'Argentina',
  54: 'Brazil',
  55: 'Chile',
  56: 'Colombia',
  57: 'Ecuador',
  59: 'Peru',
  60: 'Uruguay',
  61: 'Venezuela',
  83: 'Mexico',
  95: 'USA',
  97: 'Algeria',
  103: 'Cameroon',
  108: 'Ivory Coast',
  110: 'DR Congo',
  115: 'Gabon',
  117: 'Ghana',
  122: 'Liberia',
  129: 'Morocco',
  133: 'Nigeria',
  136: 'Senegal',
  144: 'Togo',
  145: 'Tunisia',
  163: 'Japan'
};

const CLUB_FILTER_DIMS = [
  { select: 'club-pos', filter: 'pos', label: 'Any position', nameMap: null },
  { select: 'club-ver', filter: 'ver', label: 'Any version', nameMap: null },
  { select: 'club-league', filter: 'league', label: 'Any league', nameMap: LEAGUE_NAMES },
  { select: 'club-club', filter: 'club', label: 'Any club', nameMap: CLUB_NAMES },
  { select: 'club-nation', filter: 'nation', label: 'Any nation', nameMap: NATION_NAMES }
];

const clubState = {
  entries: [],
  visible: [],
  shown: CLUB_PAGE_SIZE
};

const clubEls = {};
const confirmTimers = new WeakMap();

function clubInit() {
  [
    'club-container', 'club-search', 'club-pos', 'club-ver', 'club-rat', 'club-sort',
    'club-league', 'club-club', 'club-nation', 'club-reset', 'club-dupes', 'club-sell-dupes', 'club-info', 'club-grid', 'club-empty', 'club-more'
  ].forEach(id => { clubEls[id] = document.getElementById(id); });

  const onFilterChange = () => {
    clubState.shown = CLUB_PAGE_SIZE;
    clubRender();
  };

  clubEls['club-search'].addEventListener('input', onFilterChange);
  ['club-rat', 'club-sort', 'club-dupes'].forEach(id => {
    clubEls[id].addEventListener('change', onFilterChange);
  });

  CLUB_FILTER_DIMS.forEach(dim => {
    clubEls[dim.select].addEventListener('change', () => {
      clubState.shown = CLUB_PAGE_SIZE;
      clubRebuildFilterSelects(dim.filter);
      clubRender();
    });
  });

  clubEls['club-more'].addEventListener('click', () => {
    clubState.shown += CLUB_PAGE_SIZE;
    clubRender();
  });

  clubEls['club-sell-dupes'].addEventListener('click', () => {
    const button = clubEls['club-sell-dupes'];
    if (button.dataset.armed !== '1') {
      armConfirm(button, 'Confirm duplicate sale', 4000);
      return;
    }
    disarmConfirm(button);
    clubSellDupes();
  });

  clubEls['club-reset'].addEventListener('click', () => {
    clubEls['club-search'].value = '';
    CLUB_FILTER_DIMS.forEach(dim => { clubEls[dim.select].value = ''; });
    clubEls['club-rat'].value = '';
    clubEls['club-dupes'].checked = false;
    clubState.shown = CLUB_PAGE_SIZE;
    clubRebuildFilterSelects(null);
    clubRender();
  });

  clubRebuildFilterSelects(null);
}

function clubPlayerCatValue(player, filter) {
  switch (filter) {
    case 'pos': return player.POS;
    case 'ver': return player.VER;
    case 'league': return String(player.league_id);
    case 'club': return String(player.club_id);
    case 'nation': return String(player.nation_id);
    default: return '';
  }
}

function clubCatMatch(player, filters, ignore) {
  for (const dim of CLUB_FILTER_DIMS) {
    if (dim.filter === ignore) continue;
    const selected = filters[dim.filter];
    if (selected && clubPlayerCatValue(player, dim.filter) !== selected) return false;
  }
  return true;
}

function clubReadCatFilters() {
  const filters = {};
  CLUB_FILTER_DIMS.forEach(dim => { filters[dim.filter] = clubEls[dim.select].value; });
  return filters;
}

function clubDimHasSupport(filter, filters) {
  const selected = filters[filter];
  if (!selected) return true;
  return clubBuildEntries().some(entry =>
    clubCatMatch(entry.player, filters, filter)
    && clubPlayerCatValue(entry.player, filter) === selected
  );
}

function clubNormalizeSelection(anchor) {
  const filters = clubReadCatFilters();
  let changed = true;
  while (changed) {
    changed = false;
    CLUB_FILTER_DIMS.forEach(dim => {
      if (dim.filter === anchor) return;
      if (filters[dim.filter] && !clubDimHasSupport(dim.filter, filters)) {
        filters[dim.filter] = '';
        clubEls[dim.select].value = '';
        changed = true;
      }
    });
  }
}

function clubRebuildFilterSelects(anchor) {
  clubNormalizeSelection(anchor);
  const filters = clubReadCatFilters();
  CLUB_FILTER_DIMS.forEach(dim => clubFillSelect(dim, filters));
}

function clubFillSelect(dim, filters) {
  const select = clubEls[dim.select];
  const current = select.value;
  const display = value => (dim.nameMap && dim.nameMap[value]) ? dim.nameMap[value] : value;

  const values = new Set();
  clubBuildEntries().forEach(entry => {
    if (!clubCatMatch(entry.player, filters, dim.filter)) return;
    const value = clubPlayerCatValue(entry.player, dim.filter);
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

  select.value = sorted.includes(current) ? current : '';
}

function clubOnDataLoaded() {
  clubRebuildFilterSelects(null);
  clubRender();
}

function clubMatches(player, query) {
  if (!query) return true;
  return player.Surname.toLocaleLowerCase('pl').includes(query)
    || player.card_id.toLocaleLowerCase('pl').includes(query)
    || String(player.player_id) === query;
}

function clubSortCompare(a, b) {
  switch (clubEls['club-sort'].value) {
    case 'rat-asc': return a.player.RAT - b.player.RAT || a.player.Surname.localeCompare(b.player.Surname, 'pl');
    case 'price-desc': return b.player.price - a.player.price;
    case 'price-asc': return a.player.price - b.player.price;
    case 'name': return a.player.Surname.localeCompare(b.player.Surname, 'pl');
    case 'count-desc': return b.count - a.count || b.player.RAT - a.player.RAT;
    default: return b.player.RAT - a.player.RAT || a.player.Surname.localeCompare(b.player.Surname, 'pl');
  }
}

function clubBuildEntries() {
  const entries = [];
  Object.keys(Save.get().club).forEach(cardId => {
    const player = cardsById[cardId];
    if (!player) return;
    entries.push({ player, count: Save.getCount(cardId) });
  });
  return entries;
}

function clubHasActiveFilters() {
  if (clubEls['club-search'].value.trim()) return true;
  if (clubEls['club-rat'].value) return true;
  if (clubEls['club-dupes'].checked) return true;
  return CLUB_FILTER_DIMS.some(dim => clubEls[dim.select].value);
}

function clubRender() {
  if (!clubEls['club-grid']) return;

  const query = clubEls['club-search'].value.trim().toLocaleLowerCase('pl');
  const filters = clubReadCatFilters();
  const minRat = clubEls['club-rat'].value ? Number(clubEls['club-rat'].value) : 0;
  const dupesOnly = clubEls['club-dupes'].checked;

  let entries = clubBuildEntries();
  const totalCopies = entries.reduce((sum, e) => sum + e.count, 0);

  entries = entries.filter(e =>
    clubMatches(e.player, query)
    && clubCatMatch(e.player, filters, null)
    && e.player.RAT >= minRat
    && (!dupesOnly || e.count > 1)
  );

  entries.sort(clubSortCompare);
  clubState.entries = entries;
  clubState.visible = entries.slice(0, clubState.shown);

  const grid = clubEls['club-grid'];
  grid.innerHTML = '';

  clubState.visible.forEach(entry => grid.appendChild(clubTile(entry)));

  const hasAnyCards = totalCopies > 0;
  clubEls['club-empty'].style.display = entries.length ? 'none' : 'block';
  clubEls['club-empty'].textContent = hasAnyCards
    ? 'No cards match the filters.'
    : 'Your club is empty. Open your first pack!';

  const filteredCopies = entries.reduce((sum, e) => sum + e.count, 0);
  const value = entries.reduce((sum, e) => sum + cardPrice(e.player) * e.count, 0);
  clubEls['club-info'].textContent = hasAnyCards
    ? `${entries.length} cards in results (${filteredCopies} copies) · club value ${value.toLocaleString('en-US')} coins`
    : '';

  const dupes = clubBuildEntries().some(e => e.count > 1);
  clubEls['club-sell-dupes'].disabled = !dupes;
  if (!dupes) disarmConfirm(clubEls['club-sell-dupes']);

  clubEls['club-reset'].disabled = !clubHasActiveFilters();

  clubEls['club-more'].style.display = entries.length > clubState.visible.length ? 'block' : 'none';
}

function clubTile(entry) {
  const tile = document.createElement('div');
  tile.className = 'club-tile';

  const wrap = document.createElement('div');
  wrap.className = 'club-card-wrap';

  const card = renderCard(entry.player);
  card.classList.add('show');
  wrap.appendChild(card);

  if (entry.count > 1) {
    const badge = document.createElement('span');
    badge.className = 'count-badge';
    badge.textContent = `x${entry.count}`;
    wrap.appendChild(badge);
  }

  tile.appendChild(wrap);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sell-btn';
  button.dataset.cardId = entry.player.card_id;

  const sellValue = cardPrice(entry.player);
  const priceLabel = formatCoins(sellValue);
  button.textContent = entry.count > 1
    ? `Sell 1 · ${priceLabel}`
    : `Sell · ${priceLabel}`;

  button.addEventListener('click', () => {
    if (button.dataset.armed !== '1') {
      armConfirm(button, `Confirm (${priceLabel})`, 3000);
      return;
    }
    disarmConfirm(button);
    sellOne(entry.player.card_id, sellValue);
  });

  tile.appendChild(button);
  return tile;
}

function sellOne(cardId, coins) {
  if (!Save.sellCards({ [cardId]: 1 }, coins)) return;
  clubRebuildFilterSelects(null);
  clubRender();
  updateHud();
}

function clubSellDupes() {
  const items = {};
  let coins = 0;

  clubBuildEntries().forEach(({ player, count }) => {
    if (count < 2) return;
    const extra = count - 1;
    items[player.card_id] = extra;
    coins += cardPrice(player) * extra;
  });

  if (!Save.sellCards(items, coins)) return;
  clubRebuildFilterSelects(null);
  clubRender();
  updateHud();
}

function armConfirm(button, label, timeout) {
  clearTimeout(confirmTimers.get(button));
  button.dataset.label = button.textContent;
  button.dataset.armed = '1';
  button.classList.add('confirm');
  button.textContent = label;
  confirmTimers.set(button, setTimeout(() => disarmConfirm(button), timeout));
}

function disarmConfirm(button) {
  clearTimeout(confirmTimers.get(button));
  confirmTimers.delete(button);
  delete button.dataset.armed;
  button.classList.remove('confirm');
  if (button.dataset.label) {
    button.textContent = button.dataset.label;
    delete button.dataset.label;
  }
}

function openClub() {
  if (!players.length) {
    clubEls['club-container'].style.display = 'flex';
    showView('club');
    clubEls['club-info'].textContent = 'Loading card data...';
    return;
  }
  clubState.shown = CLUB_PAGE_SIZE;
  showView('club');
  clubRender();
}

document.addEventListener('DOMContentLoaded', () => {
  clubInit();
  clubRender();
});