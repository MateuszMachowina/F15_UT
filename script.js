let players = [];        // load player data from JSON
let cardsById = {};      // card_id -> card (TECH-02)

const PACK_PRICE = 10000; // koszt otwarcia jednej paczki

// TECH-02: price as a number ("1133,333333" -> 1133), used by selling/market
function parsePrice(value) {
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// fetch player data on start
fetch('players.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(p => { p.price = parsePrice(p.Coins); });
    players = data;
    cardsById = Object.fromEntries(data.map(p => [p.card_id, p]));
    updateHud();
    if (typeof clubOnDataLoaded === 'function') clubOnDataLoaded();
    if (typeof renderSquad === 'function') renderSquad();
  });

// --- HUD: coins + club size (ECO-01, CLB-01) ---
function updateHud() {
  const coinsEl = document.getElementById('hud-coins');
  const clubEl = document.getElementById('hud-club');
  const warnEl = document.getElementById('hud-warn');
  if (!coinsEl || !clubEl || typeof Save === 'undefined') return;

  const size = Save.clubSize();
  coinsEl.textContent = Save.getCoins().toLocaleString('en-US');
  clubEl.textContent = players.length
    ? `${size.unique} / ${players.length}`
    : `${size.unique}`;
  clubEl.title = `${size.total} cards total (including duplicates)`;
  if (warnEl) warnEl.style.display = Save.isAvailable() ? 'none' : 'block';
}

if (typeof Save !== 'undefined') Save.onChange(updateHud);
document.addEventListener('DOMContentLoaded', updateHud);

// --- views: menu (pack), pack (opened pack), club (TECH-04) ---
function showView(view) {
  const menu = document.getElementById('menu');
  menu.style.display = view === 'menu' ? 'flex' : 'none';
  if (view === 'menu') {
    menu.style.justifyContent = 'center';
    menu.style.alignItems = 'center';
    menu.style.height = '100vh';
  }

  document.getElementById('pack-container').style.display = view === 'pack' ? 'flex' : 'none';
  document.getElementById('club-container').style.display = view === 'club' ? 'flex' : 'none';
  document.getElementById('squad-container').style.display = view === 'squad' ? 'flex' : 'none';

  // the logo stays visible behind an opened pack (it is part of the screenshot)
  const logo = document.getElementById('main-logo');
  logo.style.visibility = (view === 'club' || view === 'squad') ? 'hidden' : 'visible';

  // bottom navigation: hidden while a pack is open (Back/Save buttons are used there)
  document.getElementById('nav').style.display = view === 'pack' ? 'none' : 'flex';

  // dark bar behind the nav is shown only on the Club screen
  const navBackdrop = document.getElementById('nav-backdrop');
  if (navBackdrop) navBackdrop.style.display = view === 'club' ? 'block' : 'none';
  document.getElementById('nav-menu').classList.toggle('active', view === 'menu');
  document.getElementById('nav-club').classList.toggle('active', view === 'club');
  document.getElementById('nav-squad').classList.toggle('active', view === 'squad');
}

// function to pick a single player with rating-based weighting and rarity adjustment
function weightedRandomPlayer(playersArray) {
  const weighted = [];

  playersArray.forEach(player => {
    // basic weight based on rating
    let weight = Math.max(1, 101 - player.RAT);

    // rarity multiplier to make some versions rarer
    let rarityMultiplier = 1;
    if (["IF", "MOTM", "POTY", "RB", "Futties"].includes(player.VER)) {
      rarityMultiplier = 0.5; // harder to pull
    } else if (["TOTS", "TOTY", "Legend"].includes(player.VER)) {
      rarityMultiplier = 0.3; // rarest cards
    }

    weight = Math.max(1, Math.floor(weight * rarityMultiplier));

    // push the player multiple times according to weight for probability
    for (let i = 0; i < weight; i++) {
      weighted.push(player);
    }
  });

  // random selection from weighted array
  const index = Math.floor(Math.random() * weighted.length);
  return weighted[index];
}

// Draw a set of unique players, avoiding any duplicates by player_id
function drawUniquePlayers(count) {
  if (players.length < count) return [];

  const result = [];
  const copy = [...players];

  while (result.length < count) {
    const player = weightedRandomPlayer(copy);
    result.push(player);

    // remove all entries with the same player_id, regardless of VER
    for (let i = copy.length - 1; i >= 0; i--) {
      if (copy[i].player_id === player.player_id) {
        copy.splice(i, 1);
      }
    }
  }

  return result;
}

// --- openPack function ---
function openPack() {
  if (!players.length) {
    alert("Player data not loaded yet!");
    return;
  }

  if (typeof Save !== 'undefined' && Save.getCoins() < PACK_PRICE) {
    alert(`Not enough coins! Opening a pack costs ${PACK_PRICE.toLocaleString('en-US')} coins.`);
    updateHud();
    return;
  }

  showView('pack');

  const cardsDiv = document.getElementById('cards');
  cardsDiv.innerHTML = '';

  const drawnPlayers = drawUniquePlayers(6); // draw 6 unique players per pack - here you can modify amt of players per pack

  // PCK-01: add the drawn cards to the club (saved in localStorage)
  // PCK-02: isNew = card was not in the club before this pack
  const added = Save.addCards(drawnPlayers.map(p => p.card_id));
  Save.addCoins(-PACK_PRICE);
  Save.recordPack();

  drawnPlayers.forEach((player, i) => {
    const card = renderCard(player, { isNew: added[i].isNew });
    cardsDiv.appendChild(card);

    // sequential animation delay for cards
    setTimeout(() => card.classList.add('show'), i * 200 + 50);
  });
}

// function to reset pack view back to menu
function resetPack() {
  document.getElementById('cards').innerHTML = '';
  showView('menu');
}