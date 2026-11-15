// club.js: ekran klubu (CLB-02..06), szybka sprzedaż (ECO-02, ECO-03)

const CLUB_PAGE_SIZE = 60;

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
    'club-dupes', 'club-sell-dupes', 'club-info', 'club-grid', 'club-empty', 'club-more'
  ].forEach(id => { clubEls[id] = document.getElementById(id); });

  const onFilterChange = () => {
    clubState.shown = CLUB_PAGE_SIZE;
    clubRender();
  };

  clubEls['club-search'].addEventListener('input', onFilterChange);
  ['club-pos', 'club-ver', 'club-rat', 'club-sort', 'club-dupes'].forEach(id => {
    clubEls[id].addEventListener('change', onFilterChange);
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

  clubBuildSelect(clubEls['club-pos'], 'POS', 'Any position');
  clubBuildSelect(clubEls['club-ver'], 'VER', 'Any version');
}

function clubBuildSelect(select, key, allLabel) {
  const current = select.value;
  const values = [...new Set(players.map(p => p[key]))].sort((a, b) => String(a).localeCompare(String(b), 'pl'));

  select.innerHTML = '';
  const all = document.createElement('option');
  all.value = '';
  all.textContent = allLabel;
  select.appendChild(all);

  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (values.includes(current)) select.value = current;
}

function clubOnDataLoaded() {
  clubBuildSelect(clubEls['club-pos'], 'POS', 'Any position');
  clubBuildSelect(clubEls['club-ver'], 'VER', 'Any version');
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

function clubRender() {
  if (!clubEls['club-grid']) return;

  const query = clubEls['club-search'].value.trim().toLocaleLowerCase('pl');
  const pos = clubEls['club-pos'].value;
  const ver = clubEls['club-ver'].value;
  const minRat = clubEls['club-rat'].value ? Number(clubEls['club-rat'].value) : 0;
  const dupesOnly = clubEls['club-dupes'].checked;

  let entries = clubBuildEntries();
  const totalCopies = entries.reduce((sum, e) => sum + e.count, 0);

  entries = entries.filter(e =>
    clubMatches(e.player, query)
    && (!pos || e.player.POS === pos)
    && (!ver || e.player.VER === ver)
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