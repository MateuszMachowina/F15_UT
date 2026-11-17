// storage.js: game persistence in localStorage (CLB-01, ECO-01, TECH-05)
// Only card_id + quantity are stored (no card data or images), keeping the save very small.

(function (root) {
  const SAVE_KEY = 'pf15_save';
  const SAVE_VERSION = 1;
  const START_COINS = 200000;
  const DEFAULT_FORMATION = "4-3-3";
  // Formation renames: map legacy formation names to the current ones on load.
  const FORMATION_RENAMES = { '4-3-1-2': '4-1-2-1-2' };
  const SQUAD_SLOTS = 11;
  const SQUAD_NAME_MAX = 24;

  function newSquadId() {
    return 'sq_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // squad shape: { id, name, formation, slots: [card_id|null x11] }
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

  // Convert a legacy single-squad save into a list of squads.
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
      club: {},               // { card_id: quantity }
      squads: [],             // [{ id, name, formation, slots }]
      activeSquadId: null,    // currently selected squad
      stats: { packsOpened: 0 },
      lastDaily: null         // reserved for ECO-04
    };
  }

  // Migrate legacy saves to the current version (TECH-05).
  // For now this only fills in missing fields; add future migrations here.
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

  // storage: a getItem/setItem/removeItem object (localStorage, or a stub in tests)
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
        // Corrupted save: keep a copy so it is not lost permanently
        try { storage.setItem(SAVE_KEY + '_corrupt', raw); } catch (_) {}
        return defaultSave();
      }
    }

    function persist() {
      try {
        storage.setItem(SAVE_KEY, JSON.stringify(data));
        available = true;
      } catch (e) {
        available = false; // storage full, private mode, etc.
      }
      listeners.forEach(fn => { try { fn(data); } catch (_) {} });
      return available;
    }

    function findSquad(id) {
      return data.squads.find(s => s.id === id) || null;
    }

    data = load();

    return {
      // --- reads ---
      DEFAULT_FORMATION,
      get: () => data,
      isAvailable: () => available,
      getCoins: () => data.coins,
      getCount: id => data.club[id] || 0,
      owns: id => (data.club[id] || 0) > 0,
      // unique = number of distinct cards, total = number of copies
      clubSize() {
        let unique = 0, total = 0;
        for (const id of Object.keys(data.club)) { unique++; total += data.club[id]; }
        return { unique, total };
      },

      // --- squads (SQD-01, SQD-06) ---
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
      // Deleting a squad does not remove cards from the club; they return to the pool.
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
      // Formation change: assigned players stay and are re-laid out from slot 0..10.
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
      // Like assignSlot, but if the same card is already in another slot of this squad,
      // it is removed from the old slot and moved to the selected one.
      assignSlotMoving(id, index, cardId) {
        const squad = findSquad(id);
        if (!squad || !Number.isInteger(index) || index < 0 || index >= SQUAD_SLOTS) return false;
        const value = cardId ? String(cardId) : null;
        if (value) {
          for (let i = 0; i < SQUAD_SLOTS; i++) {
            if (i !== index && squad.slots[i] === value) squad.slots[i] = null;
          }
        }
        squad.slots[index] = value;
        persist();
        return true;
      },

      // --- writes ---
      // Add cards to the club. Returns [{ id, isNew }] in the same order.
      // isNew is computed against the club state before the pack (PCK-02).
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
      // Sale: items = { card_id: quantity }, coins = total payout.
      // All-or-nothing: if any copy is missing, nothing changes (returns false).
      // Cards and coins are persisted in a single write so they cannot diverge.
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

      // --- state changes (HUD, etc.) ---
      onChange(fn) { listeners.push(fn); }
    };
  }

  const api = {
    createSave, migrate, defaultSave, defaultSquad, normalizeSquad, normalizeSquads,
    SAVE_KEY, SAVE_VERSION, START_COINS, DEFAULT_FORMATION, SQUAD_SLOTS, SQUAD_NAME_MAX
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;               // exported for Node tests
  } else {
    // In the browser: expose a ready-to-use global Save object
    let ls = null;
    try { ls = root.localStorage; } catch (e) { ls = null; }
    const memory = {};                  // fallback when localStorage is unavailable
    const fallback = {
      getItem: k => (k in memory ? memory[k] : null),
      setItem: (k, v) => { memory[k] = String(v); },
      removeItem: k => { delete memory[k]; }
    };
    root.Save = createSave(ls || fallback);
    if (!ls) root.Save.isAvailable = () => false; // the game works, but without persistent storage
  }
})(typeof window !== 'undefined' ? window : globalThis);