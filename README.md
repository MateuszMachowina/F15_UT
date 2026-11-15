# FIFA 15 Pack Opener ⚽

- [🎮 Click here to play the game!](https://mateuszmachowina.github.io/PackOpenerF15/)

A browser-based FIFA 15 pack opening simulator: open packs, collect players, build squads and track team rating and chemistry. It includes **720 cards** representing **408 players**.

## 🎉 Personal Note

This project was created as a tribute to my very first steps in IT – on the 10th anniversary of my first **FIFA Pack Opener**, built in Scratch over 10 years ago (2015).
I have always learned by setting myself challenges, building projects and solving problems as they appeared. That approach guided me back then in Scratch and it still guides me today in technologies like **VBA, Power Automate, UiPath and Python**. 🚀

## 📚 My Scratch Projects

- ⚽ [FIFA 15 - Mini FUT](https://scratch.mit.edu/projects/75730628/)
- ⚽ [FIFA 16 - Mini FUT](https://scratch.mit.edu/projects/251721395/)
- ⚽ [FIFA 17 - Mini FUT](https://scratch.mit.edu/projects/134293944/)
- ⚽ [FIFA 19 - Mini FUT](https://scratch.mit.edu/projects/68231368/) (Over 2 Million views!)
- 🌐 [More projects on my profile](https://scratch.mit.edu/users/Maszek/)

---

## ✨ Features

- 🃏 **Packs** – click the pack to reveal 6 unique players; cards are weighted by rating and version.
- 🃏 **Club** – browse, search, filter and sort your collection; sell duplicates or selected cards.
- ⚽ **Squad** – create multiple teams, choose from 9 formations and assign players from the club.
- 🟢 **Position badges** – green (exact), yellow (acceptable) and red (wrong position).
- 📊 **Team stats** – average player rating and chemistry (100 − 3 per acceptable position − 8 per wrong position).
- 🎶 **Spotify** – [open the official FIFA 15 playlist](https://open.spotify.com/playlist/00i82lDzMDdiHWNjrIGAyw?utm_source=generator) from the menu.
- 📱 **Responsive** – desktop, tablet and mobile layouts.

---

## 🗂️ Project Structure

```
PackOpenerF15/
├─ index.html       # main page
├─ style.css        # layout and animations
├─ script.js        # menu, pack opening, HUD
├─ cards.js         # card rendering
├─ club.js          # club screen
├─ squad.js         # squads, formations, player picker
├─ storage.js       # localStorage save
├─ players.json     # 720 cards / 408 players
├─ assets/          # cards, clubs, nations, players and UI
├─ FEATURES.md      # feature checklist
└─ README.md
```

---

## 🐍 Data Preparation

Card data was prepared with `csv_to_json.py`, `images_checker.py`, `webp_to_png.py` and a master `players_table.xlsx`.

[Link to the Python scripts repository](https://github.com/MateuszMachowina/python-apps/tree/main/Tools%20for%20PackOpenerF15)

---

## 📊 Data Sources

- 🌐 [Futbin](https://www.futbin.com/15/players) – card information and graphics.
- 🌐 [Sofifa](https://sofifa.com/players) – player statistics.

---

## ⚖️ Legal Notice

All graphics, logos and data are the property of **EA Sports**. This project is **non-commercial** and created **for fun and personal enjoyment only**.

---

## 👨‍💻 Author

[Mateusz Machowina – © 2025](https://github.com/MateuszMachowina)