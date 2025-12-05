# D3: World of Bits

## Game Design Vision

Collect digital "bits" around the globe and fuse equal-value tokens together to craft higher and higher values. Move around a map (and later the real world) to reach new cells and find enough materials to craft a huge token.

## Technologies

- TypeScript for game logic
- Leaflet for interactive map rendering
- Vite + Deno build system from starter template
- GitHub Actions + GitHub Pages for automatic deployment

## Assignments

### **D3.a -- Core mechanics (token collection and crafting)**

- [x] Read and understand starter code (Leaflet + luck hashing).
- [x] Copy `src/main.ts` to `src/reference-main.ts` for reference.
- [x] Delete contents of `src/main.ts` and start fresh.
- [x] Initialize Leaflet map centered on classroom coordinates.
- [x] Draw one grid cell polygon on the map.
- [x] Generalize to draw a full grid of cells around the player.
- [x] Implement deterministic token spawning using `luck` for each cell.
- [x] Visualize cell contents (empty vs token + numeric value).
- [x] Track player inventory (0 or 1 token) in game state.
- [x] Implement “pick up token” when clicking a nearby cell with a token.
- [x] Restrict interaction to cells within 3 grid steps of player.
- [x] Implement crafting: placing token on equal-value token → double value.
- [x] Detect win condition when held token >= target value and show win message.
- [x] Cleanup pass: remove dead code, console logs, and do a cleanup-only commit.

### **D3.b.1 — Player State + Marker**

- [x] Add player grid coordinate state (`player.i`, `player.j`)
- [x] Convert grid → lat/lng helper
- [x] Add Leaflet marker for player
- [x] Marker appears at correct world location

### **D3.b.2 — Movement UI**

- [x] Add movement buttons (N, S, E, W)
- [x] Each button updates player's grid coordinates
- [x] Smoothly update marker position
- [x] Recalculate which cells are interactable

### **D3.b.3 — Interaction Uses _Real_ Player Location**

- [x] Restrict pickup/crafting based on **player grid**, not classroom
- [x] All interactions update correctly as player moves

### **D3.b.4 — Auto-scroll Camera**

- [x] Map recenters whenever player moves
- [x] Smooth camera movement

### **D3.b.5 — Cleanup Commit**

- [x] Remove debug logs
- [x] Final review of D3.b

### **D3.c.1 — Flyweight Cell Storage**

- [x] Introduce `modifiedCells` map for persistent modified cell memory
- [x] Introduce `ephemeralCells` map for visible-on-screen cell objects
- [x] Remove permanent storage of unmodified cell data
- [x] Ensure only modified cells remain in memory after scrolling

### **D3.c.2 — Memento Restore System**

- [x] Save modified cell state into `modifiedCells` whenever player alters a cell
- [x] Restore cell state from `modifiedCells` when the cell re-enters view
- [x] If no modified state exists, generate token using deterministic `luck()`
- [x] Verify restored cells behave exactly the same before/after leaving visibility

### **D3.c.3 — RenderGrid Rewrite**

- [x] Clear `ephemeralCells` every time `renderGrid` runs
- [x] Rebuild all visible cells fresh from:
  - `modifiedCells` (persistent state)
  - **OR** `luck()` (unmodified state)
- [x] Ensure grid spans entire map while keeping memory small
- [x] Keep interaction logic consistent with new flyweight model

### **D3.c.4 — Gameplay Behavior Verification**

- [x] Player can “farm” tokens by moving away and back
- [x] Modified cells do **not** reset when hidden (persistence)
- [x] Unmodified cells **do** reset (flyweight stateless behavior)
- [x] All crafting and pickup rules still function correctly

### **D3.c.5 — Cleanup Commit**

- [x] Remove debugging logs
- [x] Refactor duplicated logic
- [x] Final D3.c review

### **D3.d.1 — Serialization Format**

- [x] Choose a format for saving data (JSON recommended)
- [x] Convert `modifiedCells` map into a serializable structure
- [x] Ensure deserialization restores correct number and types of values

---

### **D3.d.2 — Save System**

- [x] Implement `saveState()` function
- [x] Automatically save to `localStorage` whenever a cell is modified
- [x] Verify saved data updates correctly as player crafts or picks up tokens

### **D3.d.3 — Load System**

- [x] Implement `loadState()` to run on page startup
- [x] Rehydrate the `modifiedCells` map from stored JSON
- [x] Ensure cells appear exactly as they were before reload
- [x] Handle corrupted or missing save data gracefully

---

### **D3.d.4 — Integration With Rendering**

- [x] Ensure rendering logic uses restored `modifiedCells`
- [x] Verify pickup/crafting still works after reload
- [x] Confirm persistence interacts correctly with Flyweight system

---
### **D3.d.5 — New Game Button**
- [x] Added New Game Button

--
### **D3.d.6 — New Game Button**
- [x] Added Geolocation

--
### **D3.d.7 — Cleanup Commit**

- [x] Remove debug console logs used during testing
- [x] Final review of the persistence system
- [x] Commit labeled **“D3.d complete”**
---
