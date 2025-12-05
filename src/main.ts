// Leaflet Map Game: "World of Bits" Imports
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import "./style.css";

import L from "leaflet";
import luck from "./_luck.ts";

/* -------------------------------------------------------------
   CONSTANTS + HELPERS
--------------------------------------------------------------*/

const CELL_SIZE = 0.0001;
const INTERACT_RANGE = 3;

function cellKey(i: number, j: number): string {
  return `${i},${j}`;
}

function latLngToCell(lat: number, lng: number) {
  return {
    i: Math.floor(lat / CELL_SIZE),
    j: Math.floor(lng / CELL_SIZE),
  };
}

function boundsForCell(i: number, j: number): L.LatLngBoundsLiteral {
  return [
    [i * CELL_SIZE, j * CELL_SIZE],
    [(i + 1) * CELL_SIZE, (j + 1) * CELL_SIZE],
  ];
}

function cellDistance(i1: number, j1: number, i2: number, j2: number) {
  return Math.abs(i1 - i2) + Math.abs(j1 - j2);
}

function tokenFromLuck(i: number, j: number): number | null {
  return luck(`${i},${j}`) < 0.2 ? 1 : null;
}

/* -------------------------------------------------------------
   SAVE / LOAD (Persistence)
--------------------------------------------------------------*/

const modifiedCells = new Map<string, number | null>();

function serializeModifiedCells(): string {
  return JSON.stringify(Array.from(modifiedCells.entries()));
}

function loadGame() {
  const saved = localStorage.getItem("worldOfBits_save");
  if (!saved) return;

  try {
    const arr = JSON.parse(saved) as [string, number | null][];
    modifiedCells.clear();
    for (const [key, val] of arr) {
      modifiedCells.set(key, val);
    }
  } catch {
    /* ignore bad save files */
  }
}

function saveGameState() {
  const data = serializeModifiedCells();
  localStorage.setItem("worldOfBits_save", data);
}

loadGame();

/* -------------------------------------------------------------
   PLAYER STATE
--------------------------------------------------------------*/

const CLASS_LAT = 36.99790233940329;
const CLASS_LNG = -122.05700844526292;

const start = latLngToCell(CLASS_LAT, CLASS_LNG);

const player = {
  i: start.i,
  j: start.j,
};

function playerLatLng(): [number, number] {
  return [
    player.i * CELL_SIZE + CELL_SIZE / 2,
    player.j * CELL_SIZE + CELL_SIZE / 2,
  ];
}

/* -------------------------------------------------------------
   MAP SETUP
--------------------------------------------------------------*/

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.appendChild(mapDiv);

const map = L.map("map", { zoomControl: true }).setView(playerLatLng(), 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

const playerMarker = L.marker(playerLatLng()).addTo(map);

/* Range Indicator Circle */
const rangeCircle = L.circle(playerLatLng(), {
  radius: CELL_SIZE * INTERACT_RANGE * 111000 * 0.8, // convert degrees to meters approximated
  color: "#4287f5",
  weight: 1,
  fillOpacity: 0.05,
}).addTo(map);

/* -------------------------------------------------------------
   UI
--------------------------------------------------------------*/

const inventoryDiv = document.createElement("div");
inventoryDiv.style.position = "absolute";
inventoryDiv.style.top = "10px";
inventoryDiv.style.left = "10px";
inventoryDiv.style.padding = "8px";
inventoryDiv.style.background = "rgba(0,0,0,0.45)";
inventoryDiv.style.color = "white";
inventoryDiv.style.fontSize = "18px";
inventoryDiv.style.zIndex = "999";
document.body.appendChild(inventoryDiv);

let heldToken: number | null = null;

function updateInventoryUI() {
  inventoryDiv.innerText = heldToken === null
    ? "Token: none"
    : `Token: ${heldToken}`;
}

/* -------------------------------------------------------------
   NEW GAME BUTTON
--------------------------------------------------------------*/

const newGameBtn = document.createElement("button");
newGameBtn.innerText = "New Game";
newGameBtn.style.position = "absolute";
newGameBtn.style.top = "10px";
newGameBtn.style.right = "10px";
newGameBtn.style.zIndex = "999";
document.body.appendChild(newGameBtn);

newGameBtn.onclick = () => {
  modifiedCells.clear();
  localStorage.removeItem("worldOfBits_save");
  heldToken = null;
  updateInventoryUI();
  renderGrid();
};

/* -------------------------------------------------------------
   GEOLOCATION MODE SELECTOR
--------------------------------------------------------------*/

const url = new URL(globalThis.location.href);
const movementMode = url.searchParams.get("movement") || "buttons";
const useGeo = movementMode === "geo";

/* Toggle Button */
const modeBtn = document.createElement("button");
modeBtn.innerText = useGeo ? "Switch to Buttons" : "Use Geolocation";
modeBtn.style.position = "absolute";
modeBtn.style.top = "50px";
modeBtn.style.right = "10px";
modeBtn.style.zIndex = "999";
document.body.appendChild(modeBtn);

modeBtn.onclick = () => {
  const next = useGeo ? "buttons" : "geo";
  url.searchParams.set("movement", next);
  globalThis.location.href = url.toString();
};

/* -------------------------------------------------------------
   BUTTON MOVEMENT
--------------------------------------------------------------*/

const controls = document.createElement("div");
controls.style.position = "absolute";
controls.style.bottom = "20px";
controls.style.left = "50%";
controls.style.transform = "translateX(-50%)";
controls.style.display = useGeo ? "none" : "grid";
controls.style.gridTemplateColumns = "repeat(3, 60px)";
controls.style.gap = "6px";
controls.style.zIndex = "999";

controls.innerHTML = `
  <button id="moveN">N</button>
  <div></div>
  <button id="moveS">S</button>
  <button id="moveW">W</button>
  <button id="moveE">E</button>
`;

document.body.appendChild(controls);

function manualMove(di: number, dj: number) {
  player.i += di;
  player.j += dj;

  const pos = playerLatLng();
  playerMarker.setLatLng(pos);
  rangeCircle.setLatLng(pos);
  map.panTo(pos);

  renderGrid();
}

if (!useGeo) {
  document.getElementById("moveN")!.onclick = () => manualMove(-1, 0);
  document.getElementById("moveS")!.onclick = () => manualMove(1, 0);
  document.getElementById("moveW")!.onclick = () => manualMove(0, -1);
  document.getElementById("moveE")!.onclick = () => manualMove(0, 1);
}

/* -------------------------------------------------------------
   GEOLOCATION MODE
--------------------------------------------------------------*/

if (useGeo && navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const cell = latLngToCell(latitude, longitude);

    player.i = cell.i;
    player.j = cell.j;

    const pt = playerLatLng();
    playerMarker.setLatLng(pt);
    rangeCircle.setLatLng(pt);
    map.panTo(pt);

    renderGrid();
  });
}

/* -------------------------------------------------------------
   CELL SYSTEM
--------------------------------------------------------------*/

const ephemeralCells = new Map<string, L.Rectangle>();
const gridLayer = L.layerGroup().addTo(map);

function getCellTokenValue(i: number, j: number): number | null {
  const key = cellKey(i, j);
  return modifiedCells.has(key) ? modifiedCells.get(key)! : tokenFromLuck(i, j);
}

function setCellTokenValue(i: number, j: number, value: number | null) {
  modifiedCells.set(cellKey(i, j), value);
}

/* -------------------------------------------------------------
   GRID RENDERING
--------------------------------------------------------------*/

function isInteractableCell(i: number, j: number) {
  return cellDistance(i, j, player.i, player.j) <= INTERACT_RANGE;
}

function renderGrid() {
  gridLayer.clearLayers();
  ephemeralCells.clear();

  const bounds = map.getBounds();
  const sw = latLngToCell(bounds.getSouth(), bounds.getWest());
  const ne = latLngToCell(bounds.getNorth(), bounds.getEast());

  for (let i = sw.i - 1; i <= ne.i + 1; i++) {
    for (let j = sw.j - 1; j <= ne.j + 1; j++) {
      const tokenValue = getCellTokenValue(i, j);

      const rect = L.rectangle(boundsForCell(i, j), {
        color: tokenValue !== null ? "#2b8a3e" : "#666",
        weight: 0.4,
        fillOpacity: tokenValue !== null ? 0.25 : 0.08,
      });

      if (tokenValue !== null) {
        rect.bindTooltip(`${tokenValue}`, {
          permanent: true,
          direction: "center",
        });
      }

      rect.on("click", () => {
        if (!isInteractableCell(i, j)) return;

        const current = getCellTokenValue(i, j);

        // PICKUP
        if (heldToken === null) {
          if (current == null) return;

          heldToken = current;
          setCellTokenValue(i, j, null);
          updateInventoryUI();
          saveGameState();
          renderGrid();
          return;
        }

        // CRAFT
        if (current === heldToken) {
          const newVal = heldToken * 2;

          setCellTokenValue(i, j, newVal);
          heldToken = null;

          updateInventoryUI();
          saveGameState();
          renderGrid();
          return;
        }
      });

      rect.addTo(gridLayer);
      ephemeralCells.set(cellKey(i, j), rect);
    }
  }
}

map.on("moveend", renderGrid);
map.on("zoomend", renderGrid);
map.on("dragend", renderGrid);

renderGrid();
updateInventoryUI();
