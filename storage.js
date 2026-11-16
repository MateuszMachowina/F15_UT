// storage.js: zapis gry w localStorage (CLB-01, ECO-01, TECH-05)
// Zapisujemy tylko card_id + ilość, bez danych kart i obrazków, więc save jest bardzo mały.

(function (root) {
  const SAVE_KEY = 'pf15_save';
  const SAVE_VERSION = 1;
  const START_COINS = 200000;
  const DEFAULT_FORMATION = "4-3-3";
  // Zmiany nazw formacji: stare zapisy tłumaczymy na nowe przy wczytywaniu.
  const FORMATION_RENAMES = { '4-3-1-2': '4-1-2-1-2' };
  const SQUAD_SLOTS = 11;
  const SQUAD_NAME_MAX = 24;

  function newSquadId() {
    return 'sq_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // squad: { id, name, formation, slots: [card_id|null x11] }
  function defaultSquad(name, id) {
    return {
      id: id || newSquadId(),
      name: name || 'Team',
      formation: DEFAULT_FORMATION,
      slots: new Array(SQUAD_SLOTS).fill(null)
    };
  }

  function normalizeSquad(s, index) {
    const squad = defaultSquad(
      s && typeof s.name === 'string' && s.name.trim() ? s.name.trim().slice(0, SQUAD_NAME_MAX) : 'Team ' + (index + 1),
      s && typeof s.id === 'string' && s.id ? s.id : undefined
    );
    if (!s || typeof s !== 'object') return squad;
    if (typeof s.formation === 'string' && s.formation) squad.formation = FORMATION_RENAMES[s.formation] || s.formation;
    if (Array.isArray(s.slots)) {
      squad.slots = squad.slots.map((_, i) => {
        const id = s.slots[i];
        return typeof id === 'string' && id ? id : null;
      });
    }
    return squad;
  }

  // Zapis z jednym składem (stara wersja) -> lista drużyn.
  function normalizeSquads(rawSquads, legacySquad) {
    if (Array.isArray(rawSquads) && rawSquads.length) return rawSquads.map(normalizeSquad);
    if (legacySquad && typeof legacySquad === 'object') {
      return [normalizeSquad({ name: 'Team 1', formation: legacySquad.formation, slots: legacySquad.slots }, 0)];
    }
    return [];
  }

  function defaultSave() {
    return {
      version: SAVE_VERSION,
      coins: START_COINS,
      club: {},               // { card_id: ilość }
      squads: [],             // [{ id, name, formation, slots }]
      activeSquadId: null,    // aktualnie wybrana drużyna
      stats: { packsOpened: 0 },
      lastDaily: null         // miejsce na ECO-04
    };
  }

  // Migracja starych zapisów do aktualnej wersji (TECH-05).
  // Dziś tylko uzupełnia brakujące pola; kolejne wersje dopiszemy tutaj.
  function migrate(d) {
    const base = defaultSave();
    if (!d || typeof d !== 'object') return base;

    const squads = normalizeSquads(d.squads, d.squad);
    const activeSquadId = squads.some(s => s.id === d.activeSquadId)
      ? d.activeSquadId
      : (squads[0] ? squads[0].id : null);

    const out = {
      version: SAVE_VERSION,
      coins: Number.isFinite(d.coins) ? Math.max(0, Math.floor(d.coins)) : base.coins,
      club: {},
      squads: squads,
      activeSquadId: activeSquadId,
      stats: Object.assign({}, base.stats, d.stats && typeof d.stats === 'object' ? d.stats : {}),
      lastDaily: d.lastDaily || null
    };

    if (d.club && typeof d.club === 'object') {
      for (const id of Object.keys(d.club)) {
        const n = Math.floor(d.club[id]);
        if (Number.isFinite(n) && n > 0) out.club[id] = n;
      }
    }
    return out;
  }

  // storage: obiekt z getItem/setItem/removeItem (localStorage lub atrapa w testach)
  function createSave(storage) {
    let available = true;
    let data;
    const listeners = [];

    function safeGet(key) {
      try { return storage.getItem(key); } catch (e) { available = false; return null; }
    }

    function load() {
      const raw = safeGet(SAVE_KEY);
      if (!raw) return defaultSave();
      try {
        return migrate(JSON.parse(raw));
      } catch (e) {
        // Uszkodzony zapis: zachowaj kopię, żeby nie zniknął bezpowrotnie
        try { storage.setItem(SAVE_KEY + '_corrupt', raw); } catch (_) {}
        return defaultSave();
      }
    }

    function persist() {
      try {
        storage.setItem(SAVE_KEY, JSON.stringify(data));
        available = true;
      } catch (e) {
        available = false; // pełny storage, tryb prywatny itp.
      }
      listeners.forEach(fn => { try { fn(data); } catch (_) {} });
      return available;
    }

    function findSquad(id) {
      return data.squads.find(s => s.id === id) || null;
    }

    data = load();

    return {
      // --- odczyt ---
      DEFAULT_FORMATION,
      get: () => data,
      isAvailable: () => available,
      getCoins: () => data.coins,
      getCount: id => data.club[id] || 0,
      owns: id => (data.club[id] || 0) > 0,
      // unique = ile różnych kart, total = suma wszystkich egzemplarzy
      clubSize() {
        let unique = 0, total = 0;
        for (const id of Object.keys(data.club)) { unique++; total += data.club[id]; }
        return { unique, total };
      },

      // --- drużyny (SQD-01, SQD-06) ---
      getSquads: () => data.squads,
      getActiveSquadId: () => data.activeSquadId,
      getActiveSquad() {
        return findSquad(data.activeSquadId) || data.squads[0] || null;
      },
      getSquad: id => findSquad(id),
      createSquad(name) {
        const squad = defaultSquad(String(name || '').trim().slice(0, SQUAD_NAME_MAX) || 'Team');
        data.squads.push(squad);
        data.activeSquadId = squad.id;
        persist();
        return squad;
      },
      renameSquad(id, name) {
        const squad = findSquad(id);
        const clean = String(name || '').trim().slice(0, SQUAD_NAME_MAX);
        if (!squad || !clean) return false;
        squad.name = clean;
        persist();
        return true;
      },
      // Usunięcie drużyny nie usuwa kart z klubu - wracają do puli.
      deleteSquad(id) {
        const index = data.squads.findIndex(s => s.id === id);
        if (index < 0) return false;
        data.squads.splice(index, 1);
        if (data.activeSquadId === id) {
          data.activeSquadId = data.squads[0] ? data.squads[0].id : null;
        }
        persist();
        return true;
      },
      setActiveSquad(id) {
        if (!findSquad(id)) return false;
        data.activeSquadId = id;
        persist();
        return true;
      },
      // Zmiana formacji: przypisani zawodnicy zostają i są układani od nowa (slot 0..10).
      setSquadFormation(id, formation) {
        const squad = findSquad(id);
        if (!squad || typeof formation !== 'string' || !formation) return squad ? squad.formation : null;
        if (squad.formation === formation) return squad.formation;

        const keep = squad.slots.filter(Boolean).slice(0, SQUAD_SLOTS);
        squad.formation = formation;
        squad.slots = new Array(SQUAD_SLOTS).fill(null);
        keep.forEach((cardId, i) => { squad.slots[i] = cardId; });
        persist();
        return squad.formation;
      },
      assignSlot(id, index, cardId) {
        const squad = findSquad(id);
        if (!squad || !Number.isInteger(index) || index < 0 || index >= SQUAD_SLOTS) return false;
        squad.slots[index] = cardId ? String(cardId) : null;
        persist();
        return true;
      },

      // --- zapis ---
      // Dodaje karty do klubu. Zwraca [{ id, isNew }] w tej samej kolejności.
      // isNew liczone względem stanu klubu sprzed paczki (PCK-02).
      addCards(ids) {
        const before = Object.assign({}, data.club);
        const result = ids.map(id => ({ id, isNew: !before[id] }));
        ids.forEach(id => { data.club[id] = (data.club[id] || 0) + 1; });
        persist();
        return result;
      },
      addCoins(n) {
        data.coins = Math.max(0, Math.floor(data.coins + n));
        persist();
        return data.coins;
      },
      // Sprzedaż: items = { card_id: ilość }, coins = suma do wypłaty.
      // Wszystko albo nic: gdy któregoś egzemplarza brakuje, nic się nie zmienia (zwraca false).
      // Karty i coins zapisują się jednym zapisem, więc nie da się ich rozjechać.
      sellCards(items, coins) {
        if (!items || !Number.isFinite(coins) || coins < 0) return false;
        const ids = Object.keys(items);
        if (!ids.length) return false;
        for (const id of ids) {
          const q = items[id];
          if (!Number.isInteger(q) || q < 1 || (data.club[id] || 0) < q) return false;
        }
        ids.forEach(id => {
          data.club[id] -= items[id];
          if (data.club[id] <= 0) {
            delete data.club[id];
            data.squads.forEach(squad => {
              squad.slots = squad.slots.map(slotId => (slotId === id ? null : slotId));
            });
          }
        });
        data.coins = Math.max(0, Math.floor(data.coins + coins));
        persist();
        return true;
      },
      recordPack() {
        data.stats.packsOpened = (data.stats.packsOpened || 0) + 1;
        persist();
      },
      reset() {
        data = defaultSave();
        persist();
      },

      // --- zmiany stanu (HUD itp.) ---
      onChange(fn) { listeners.push(fn); }
    };
  }

  const api = {
    createSave, migrate, defaultSave, defaultSquad, normalizeSquad, normalizeSquads,
    SAVE_KEY, SAVE_VERSION, START_COINS, DEFAULT_FORMATION, SQUAD_SLOTS, SQUAD_NAME_MAX
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;               // testy w node
  } else {
    // w przeglądarce: globalny obiekt Save gotowy do użycia
    let ls = null;
    try { ls = root.localStorage; } catch (e) { ls = null; }
    const memory = {};                  // awaryjnie, gdy localStorage jest zablokowany
    const fallback = {
      getItem: k => (k in memory ? memory[k] : null),
      setItem: (k, v) => { memory[k] = String(v); },
      removeItem: k => { delete memory[k]; }
    };
    root.Save = createSave(ls || fallback);
    if (!ls) root.Save.isAvailable = () => false; // gra działa, ale bez trwałego zapisu
  }
})(typeof window !== 'undefined' ? window : globalThis);