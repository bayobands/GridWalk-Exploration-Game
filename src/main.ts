// Fix Leaflet CSS, icons, paths BEFORE Leaflet loads
import "leaflet/dist/leaflet.css";
import "./_leafletWorkaround.ts";
import "./style.css";

// Leaflet runtime + types
// @deno-types="npm:@types/leaflet"
import L from "leaflet";

// Deterministic hashing
import luck from "./_luck.ts";

// Create <div id="map"> without editing index.html
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.appendChild(mapDiv);

/* -------------------------------------------------------------
   1. MAP SETUP
--------------------------------------------------------------*/

const CLASS_LAT = 36.9916;
const CLASS_LNG = -122.0583;

const map = L.map("map", {
  zoomControl: true,
  zoomSnap: 0,
}).setView([CLASS_LAT, CLASS_LNG], 18);

// OSM tiles
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

/* -------------------------------------------------------------
   2. INVENTORY UI
--------------------------------------------------------------*/

const inventoryDiv = document.createElement("div");
inventoryDiv.id = "inventory";
inventoryDiv.style.padding = "8px";
inventoryDiv.style.fontSize = "18px";
inventoryDiv.style.background = "rgba(0,0,0,0.45)";
inventoryDiv.style.color = "white";
inventoryDiv.style.position = "absolute";
inventoryDiv.style.top = "10px";
inventoryDiv.style.left = "10px";
inventoryDiv.style.zIndex = "999";
inventoryDiv.innerText = "Held Token: none";
document.body.appendChild(inventoryDiv);

let heldToken: number | null = null;

function updateInventoryUI() {
  inventoryDiv.innerText = heldToken === null
    ? "Held Token: none"
    : `Held Token: ${heldToken}`;
}

/* -------------------------------------------------------------
   3. GRID + TOKEN LOGIC
--------------------------------------------------------------*/

const CELL_SIZE = 0.0001;

const cellLayers: Map<string, L.Rectangle> = new Map();
const cellTokenMap: Map<string, number | null> = new Map(); // track active tokens

function cellKey(i: number, j: number) {
  return `${i},${j}`;
}

function tokenFromLuck(i: number, j: number): number | null {
  const v = luck(`${i},${j}`);
  if (v < 0.2) return 1; // 20% chance
  return null;
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

/* -------------------------------------------------------------
   4. RENDERING THE WORLD
--------------------------------------------------------------*/

function renderGrid() {
  const b = map.getBounds();
  const sw = latLngToCell(b.getSouth(), b.getWest());
  const ne = latLngToCell(b.getNorth(), b.getEast());

  for (let i = sw.i - 1; i <= ne.i + 1; i++) {
    for (let j = sw.j - 1; j <= ne.j + 1; j++) {
      const key = cellKey(i, j);

      if (cellLayers.has(key)) continue;

      // spawn token if not tracked yet
      if (!cellTokenMap.has(key)) {
        cellTokenMap.set(key, tokenFromLuck(i, j));
      }

      const tokenValue = cellTokenMap.get(key);

      const rect = L.rectangle(boundsForCell(i, j), {
        color: tokenValue !== null ? "#2b8a3e" : "#666",
        weight: 0.4,
        fillOpacity: tokenValue !== null ? 0.25 : 0.08,
      });

      if (tokenValue !== null) {
        rect.bindTooltip(`${tokenValue}`, {
          permanent: true,
          direction: "center",
          className: "cell-label",
        });
      }

      // CLICK TO PICK UP TOKEN
      rect.on("click", () => {
        if (heldToken !== null) return; // can't pick up if holding

        // distance restriction: must be near player
        const playerCell = latLngToCell(CLASS_LAT, CLASS_LNG);
        if (cellDistance(i, j, playerCell.i, playerCell.j) > 3) return;

        const t = cellTokenMap.get(key);
        if (t === null) return; // nothing to pick up

        // pick up
        heldToken = t ?? null;
        updateInventoryUI();

        // remove token visually + logically
        cellTokenMap.set(key, null);
        rect.unbindTooltip();
        rect.setStyle({ color: "#666", fillOpacity: 0.08 });

        console.log(`Picked up token ${t} at cell ${i},${j}`);
      });

      rect.addTo(map);
      cellLayers.set(key, rect);
    }
  }
}

map.on("moveend", renderGrid);
renderGrid();
updateInventoryUI();
