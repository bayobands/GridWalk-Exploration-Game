// Fix Leaflet CSS, icons, paths BEFORE Leaflet loads
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import "./style.css";

// Leaflet runtime + types
// @deno-types="npm:@types/leaflet"
import L from "leaflet";

// Deterministic hashing
import luck from "./_luck.ts";

/* -------------------------------------------------------------
   CONSTANTS + HELPERS
--------------------------------------------------------------*/

const CELL_SIZE = 0.0001;

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

function cellDistance(a: number, b: number, c: number, d: number) {
  return Math.abs(a - c) + Math.abs(b - d);
}

// Deterministic initial token spawns
function tokenFromLuck(i: number, j: number): number | null {
  const v = luck(`${i},${j}`);
  return v < 0.2 ? 1 : null;
}

/* -------------------------------------------------------------
   PLAYER STATE (already working from D3.b)
--------------------------------------------------------------*/

const CLASS_LAT = 36.99790233940329;
const CLASS_LNG = -122.05700844526292;

const startCell = latLngToCell(CLASS_LAT, CLASS_LNG);

const player = {
  i: startCell.i,
  j: startCell.j,
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

const map = L.map("map").setView(playerLatLng(), 18);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Player marker
const playerMarker = L.marker(playerLatLng());
playerMarker.addTo(map);

/* -------------------------------------------------------------
   INVENTORY UI + WIN MESSAGE
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
   D3.c — FLYWEIGHT + PARTIAL MEMENTO SETUP
--------------------------------------------------------------*/

// Only store modified cells (persistent data)
const modifiedCells = new Map<string, number | null>();

// Only visible cells (cleared every frame)
const ephemeralCells = new Map<string, L.Rectangle>();

// Layer group for lightweight rendering
const gridLayer = L.layerGroup().addTo(map);

/* -------------------------------------------------------------
   GRID RENDERING (no persistence restore yet)
--------------------------------------------------------------*/

function renderGrid() {
  gridLayer.clearLayers();
  ephemeralCells.clear();

  const bounds = map.getBounds();
  const sw = latLngToCell(bounds.getSouth(), bounds.getWest());
  const ne = latLngToCell(bounds.getNorth(), bounds.getEast());

  for (let i = sw.i - 1; i <= ne.i + 1; i++) {
    for (let j = sw.j - 1; j <= ne.j + 1; j++) {
      const key = cellKey(i, j);

      // D3.c.2 NOT IMPLEMENTED YET:
      // We are NOT restoring modifiedCells here.
      // So modified cells will be forgotten when hidden.

      const tokenValue = tokenFromLuck(i, j); // still luck-based only

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

      // Interaction uses player location (already working)
      rect.on("click", () => {
        const dist = cellDistance(i, j, player.i, player.j);
        if (dist > 3) return;

        const currentToken = tokenValue; // no persistence restore yet

        // PICKUP
        if (heldToken === null) {
          if (currentToken == null) return;

          heldToken = currentToken;
          updateInventoryUI();

          // Persist change (Memento)
          modifiedCells.set(key, null);

          renderGrid();
          return;
        }

        // CRAFTING
        if (currentToken === heldToken) {
          const newVal = heldToken * 2;
          heldToken = null;
          updateInventoryUI();

          modifiedCells.set(key, newVal); // persist new value

          renderGrid();
        }
      });

      rect.addTo(gridLayer);
      ephemeralCells.set(key, rect);
    }
  }
}

map.on("moveend", renderGrid);
renderGrid();
updateInventoryUI();
