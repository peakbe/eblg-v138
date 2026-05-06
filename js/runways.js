// =========================
// RUNWAYS.JS PRO+ EBLG
// Piste 04/22 avec axe réel
// =========================

// Données piste EBLG (coordonnées réelles, ordre [lat, lon])
const RUNWAYS = {
    "22": {
        id: "22",
        heading: 220,
        start: [50.64834, 5.46639], // seuil 22
        end:   [50.64186, 5.44028]  // seuil 04
    },
    "04": {
        id: "04",
        heading: 40,
        start: [50.64186, 5.44028], // seuil 04
        end:   [50.64834, 5.46639]  // seuil 22
    }
};

// =========================
// Dessin de la piste
// =========================
export function drawRunway(runwayId = "22", layer) {
    const rwy = RUNWAYS[runwayId];
    if (!rwy || !layer) return;

    layer.clearLayers();

    // Axe principal
    L.polyline([rwy.start, rwy.end], {
        color: "#ffffff",
        weight: 5,
        opacity: 0.95
    }).addTo(layer);

    // Contour (effet bord de piste)
    L.polyline([rwy.start, rwy.end], {
        color: "#00ffc8",
        weight: 9,
        opacity: 0.25
    }).addTo(layer);

    // Marqueurs seuils
    L.circleMarker(rwy.start, {
        radius: 4,
        color: "#00ffc8",
        fillColor: "#00ffc8",
        fillOpacity: 1
    }).addTo(layer).bindTooltip("Seuil " + runwayId, { permanent: false });

    const opposite = runwayId === "22" ? "04" : "22";
    L.circleMarker(rwy.end, {
        radius: 4,
        color: "#00ffc8",
        fillColor: "#00ffc8",
        fillOpacity: 1
    }).addTo(layer).bindTooltip("Seuil " + opposite, { permanent: false });
}

// =========================
// Corridor d'approche simple
// =========================
export function drawCorridor(runwayId = "22", layer) {
    const rwy = RUNWAYS[runwayId];
    if (!rwy || !layer) return;

    layer.clearLayers();

    // On prolonge l'axe de la piste côté approche
    const factor = runwayId === "22" ? 1 : -1; // 22 vers sud-ouest, 04 vers nord-est
    const corridorLengthNm = 8; // longueur du corridor en NM
    const nmToDegLat = 1 / 60;
    const nmToDegLon = 1 / (60 * Math.cos(rwy.start[0] * Math.PI / 180));

    const headingRad = (rwy.heading * Math.PI) / 180;
    const dxNm = Math.cos(headingRad) * corridorLengthNm * factor;
    const dyNm = Math.sin(headingRad) * corridorLengthNm * factor;

    const corridorEnd = [
        rwy.start[0] + dyNm * nmToDegLat,
        rwy.start[1] + dxNm * nmToDegLon
    ];

    L.polyline([corridorEnd, rwy.start], {
        color: "#ff8800",
        weight: 2,
        dashArray: "6,4",
        opacity: 0.8
    }).addTo(layer);
}
