// cards.js: shared card rendering (packs + club)

const versionColors = {
  "Futties": "#d859d4ff",
  "Gold": "#FFD700",
  "Gold_Non-rare": "#D2B48C",
  "IF": "#b19703ff",
  "Legend": "#f0f0caff",
  "MOTM": "#f39420ff",
  "POTY": "#6527c9ff",
  "RB": "#ff7772be",
  "TOTS": "#f5db47e1",
  "TOTY": "#127eebff"
};

function cardPrice(player) {
  const p = Number.isFinite(player.price)
    ? player.price
    : parseFloat(String(player.Coins).replace(',', '.'));
  return Number.isFinite(p) ? Math.round(p) : 0;
}

function formatCoins(value) {
  const price = Number.isFinite(value) ? Math.round(value) : 0;
  if (price >= 1000000) return (price / 1000000).toFixed(2) + "M coins";
  if (price >= 1000) return Math.round(price / 1000) + "k coins";
  return price + " coins";
}

function buildCardStats(player) {
  const stats = document.createElement('div');
  stats.className = 'stats';

  [[['PAC', 'SHO', 'PAS']], [['DRI', 'DEF', 'PHY']]].forEach(groups => {
    const col = document.createElement('div');
    col.className = 'col';
    groups[0].forEach(key => {
      const stat = document.createElement('div');
      stat.className = 'stat';
      stat.textContent = `${player[key]} `;
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = key;
      stat.appendChild(label);
      col.appendChild(stat);
    });
    stats.appendChild(col);
  });

  return stats;
}

// renderCard(player, { isNew }) -> card DOM element
function renderCard(player, options) {
  const opts = options || {};
  const card = document.createElement('div');
  card.className = 'card';
  card.style.backgroundImage = `url('assets/cards/${player.VER}.png')`;
  card.dataset.cardId = player.card_id;
  card.setAttribute('role', 'img');
  card.setAttribute('aria-label', `${player.Surname}, ${player.RAT}, ${player.POS}, ${player.VER}`);

  const face = document.createElement('img');
  face.className = 'face';
  face.src = `assets/players/${player.player_id}.png`;
  face.alt = '';
  card.appendChild(face);

  const club = document.createElement('img');
  club.className = 'club';
  club.src = `assets/clubs/${player.club_id}.png`;
  club.alt = '';
  card.appendChild(club);

  const nation = document.createElement('img');
  nation.className = 'nation';
  nation.src = `assets/nations/${player.nation_id}.png`;
  nation.alt = '';
  card.appendChild(nation);

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = player.Surname;
  card.appendChild(name);

  const rating = document.createElement('div');
  rating.className = 'rating';
  rating.textContent = player.RAT;
  card.appendChild(rating);

  const position = document.createElement('div');
  position.className = 'position';
  position.textContent = player.POS;
  card.appendChild(position);

  card.appendChild(buildCardStats(player));

  const coins = document.createElement('div');
  coins.className = 'coins';
  coins.textContent = formatCoins(cardPrice(player));
  card.appendChild(coins);

  if (opts.isNew) {
    const badge = document.createElement('span');
    badge.className = 'new-badge';
    badge.textContent = 'NEW';
    card.appendChild(badge);
  }

  const isLegend = player.VER === 'Legend';
  card.style.setProperty('--card-color', versionColors[player.VER] || '#FFD700');
  card.querySelectorAll('.name, .rating, .position, .stat, .stat .label').forEach(el => {
    el.style.color = isLegend ? '#b67e2bff' : '#FFFFFF';
  });

  return card;
}