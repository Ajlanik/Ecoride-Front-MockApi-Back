// src/components/ui/RideMap.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const isValidCoord = (coord) => {
    return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number';
};

const extractLegDurationsFromRoute = (route, waypointCount) => {
    // -------------------------------------------------------------------------
    // Objectif : reconstruire des "legs" (segments) avec une durée par segment.
    // Pourquoi : Leaflet Routing Machine ne renvoie pas directement des legs
    // (start->pickup, pickup->dropoff, dropoff->end). En revanche on a :
    // - route.waypointIndices : indices des waypoints dans route.coordinates
    // - route.instructions : chaque instruction contient un "time" (en secondes)
    // On cumule donc les temps d'instructions entre 2 waypointIndices.
    // -------------------------------------------------------------------------
    try {
        const indices = Array.isArray(route?.waypointIndices) ? route.waypointIndices : [];
        const instructions = Array.isArray(route?.instructions) ? route.instructions : [];

        if (indices.length < 2 || instructions.length === 0) return [];

        // Normalise le nombre de legs attendu : waypointsCount - 1
        const legsExpected = Math.max(0, (Number(waypointCount) || 0) - 1);
        const legs = [];

        // Petit helper : somme des "time" des instructions entre 2 indices de waypoint
        const sumTimeBetween = (fromCoordIndex, toCoordIndex) => {
            let sum = 0;
            instructions.forEach((inst) => {
                // inst.index correspond à l'index dans route.coordinates
                const idx = Number(inst?.index);
                const t = Number(inst?.time);

                if (!Number.isFinite(idx) || !Number.isFinite(t)) return;
                if (idx >= fromCoordIndex && idx < toCoordIndex) sum += t;
            });
            return sum;
        };

        for (let i = 0; i < indices.length - 1; i += 1) {
            const from = Number(indices[i]);
            const to = Number(indices[i + 1]);

            if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
                legs.push({ duration: 0 });
                continue;
            }

            legs.push({ duration: sumTimeBetween(from, to) });
        }

        // Sécurise : si les indices ne couvrent pas tous les legs, on complète avec 0
        while (legs.length < legsExpected) legs.push({ duration: 0 });

        return legs.slice(0, legsExpected);
    } catch (e) {
        console.error('Erreur extraction legs:', e);
        return [];
    }
};

const FitBounds = ({ start, end, pStart, pEnd, geometry }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        try {
            const points = [];

            // Si on a une géométrie enregistrée, on l'utilise pour le cadrage
            if (geometry && Array.isArray(geometry) && geometry.length > 0) {
                // Leaflet Polyline attend [[lat, lng], [lat, lng]...]
                geometry.forEach(pt => points.push(pt));
            } else {
                // Sinon on cadre sur les points principaux
                if (isValidCoord(start)) points.push([start.lat, start.lng]);
                if (isValidCoord(pStart)) points.push([pStart.lat, pStart.lng]);
                if (isValidCoord(pEnd)) points.push([pEnd.lat, pEnd.lng]);
                if (isValidCoord(end)) points.push([end.lat, end.lng]);
            }

            if (points.length > 0) {
                map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
            }
        } catch (e) {
            console.error("Erreur FitBounds", e);
        }
    }, [map, start, end, pStart, pEnd, geometry]);

    return null;
};

// Composant de calcul de route (utilisé quand on a des waypoints)
const RoutingMachine = ({ start, end, pickup, dropoff, onRouteCalculated, hideLine = false }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !start || !end) return;

        const waypoints = [
            L.latLng(start.lat, start.lng),
            pickup ? L.latLng(pickup.lat, pickup.lng) : null,
            dropoff ? L.latLng(dropoff.lat, dropoff.lng) : null,
            L.latLng(end.lat, end.lng)
        ].filter(Boolean);

        const routingControl = L.Routing.control({
            waypoints,
            routeWhileDragging: false,
            show: false,
            addWaypoints: false,

            // On laisse la UI gérer les marqueurs (évite les doublons)
            createMarker: () => null,

            fitSelectedRoutes: false,
            lineOptions: {
                // En mode lecture, on peut cacher la ligne (on garde le calcul pour les durées)
                styles: hideLine ? [{ opacity: 0, weight: 0 }] : [{ color: '#10B981', weight: 4 }]
            }
        }).on('routesfound', function (e) {
            const route = e.routes[0];
            if (onRouteCalculated) {
                // On extrait la géométrie pour l'envoyer au backend
                // coordinates est un tableau d'objets {lat, lng}
                const geometry = route.coordinates.map(c => [c.lat, c.lng]);

                onRouteCalculated({
                    totalDistance: route.summary.totalDistance,
                    totalDuration: route.summary.totalDuration,
                    geometry: geometry,
                    legs: extractLegDurationsFromRoute(route, waypoints.length) // Durée par segment (en secondes)
                });
            }
        }).addTo(map);

        return () => {
            try {
                map.removeControl(routingControl);
            } catch (e) { }
        };
    }, [map, start, end, pickup, dropoff, onRouteCalculated, hideLine]);

    return null;
};

const RideMap = ({ startCoords, endCoords, passengerStart, passengerEnd, readonly = false, geometry = null, onRouteCalculated }) => {
    // Protection basique
    const center = isValidCoord(startCoords) ? [startCoords.lat, startCoords.lng] : [48.8566, 2.3522];

    return (
        <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-gray-200 z-0">
            <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <FitBounds start={startCoords} end={endCoords} pStart={passengerStart} pEnd={passengerEnd} geometry={geometry} />

                {/* CAS 1 : MODE LECTURE (On affiche la ligne stockée en DB) */}
                {readonly && geometry && (
                    <Polyline
                        positions={geometry}
                        pathOptions={{ color: '#059669', weight: 5, opacity: 0.8 }}
                    />
                )}

                {/* Calcul détours en lecture (sans affichage de ligne) */}
                {readonly && passengerStart && passengerEnd && onRouteCalculated && (
                    <RoutingMachine
                        start={startCoords}
                        end={endCoords}
                        pickup={passengerStart}
                        dropoff={passengerEnd}
                        onRouteCalculated={onRouteCalculated}
                        hideLine={true}
                    />
                )}

                {/* CAS 2 : MODE CRÉATION (On calcule la route) */}
                {!readonly && (
                    <RoutingMachine
                        start={startCoords}
                        end={endCoords}
                        pickup={passengerStart}
                        dropoff={passengerEnd}
                        onRouteCalculated={onRouteCalculated}
                    />
                )}

                {/* Marqueurs */}
                {isValidCoord(startCoords) && (
                    <Marker position={[startCoords.lat, startCoords.lng]}>
                        <Popup>Départ</Popup>
                    </Marker>
                )}
                {isValidCoord(endCoords) && (
                    <Marker position={[endCoords.lat, endCoords.lng]}>
                        <Popup>Arrivée</Popup>
                    </Marker>
                )}
                {isValidCoord(passengerStart) && (
                    <Marker position={[passengerStart.lat, passengerStart.lng]}>
                        <Popup>Pickup</Popup>
                    </Marker>
                )}
                {isValidCoord(passengerEnd) && (
                    <Marker position={[passengerEnd.lat, passengerEnd.lng]}>
                        <Popup>Dropoff</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default RideMap;
