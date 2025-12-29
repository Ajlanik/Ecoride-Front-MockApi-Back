// src/components/ui/RideMap.jsx
import React, { useEffect, useRef } from 'react';
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

// --- HELPERS ---

const isValidCoord = (coord) => {
    return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' && isFinite(coord.lat) && isFinite(coord.lng);
};

// Vérifie si la géométrie est un tableau de points valide pour Polyline
const isPolylineGeometry = (geo) => {
    return Array.isArray(geo) && geo.length > 0 && Array.isArray(geo[0]);
};

// Extraction sécurisée des durées
const extractLegDurationsFromRoute = (route, waypointCount) => {
    try {
        const indices = route?.waypointIndices || [];
        const instructions = route?.instructions || [];
        if (indices.length < 2 || instructions.length === 0) return [];

        const legsExpected = Math.max(0, (Number(waypointCount) || 0) - 1);
        const legs = [];

        const sumTimeBetween = (from, to) => {
            let sum = 0;
            instructions.forEach((inst) => {
                const idx = Number(inst?.index);
                const t = Number(inst?.time);
                if (Number.isFinite(idx) && Number.isFinite(t) && idx >= from && idx < to) sum += t;
            });
            return sum;
        };

        for (let i = 0; i < indices.length - 1; i++) {
            legs.push({ duration: sumTimeBetween(indices[i], indices[i+1]) });
        }
        while (legs.length < legsExpected) legs.push({ duration: 0 });
        return legs.slice(0, legsExpected);
    } catch (e) {
        return [];
    }
};

// --- COMPOSANTS INTERNES ---

const FitBounds = ({ start, end, pStart, pEnd, geometry }) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const points = [];
        
        if (isPolylineGeometry(geometry)) {
            geometry.forEach(pt => points.push(pt));
        } else {
            if (isValidCoord(start)) points.push([start.lat, start.lng]);
            if (isValidCoord(pStart)) points.push([pStart.lat, pStart.lng]);
            if (isValidCoord(pEnd)) points.push([pEnd.lat, pEnd.lng]);
            if (isValidCoord(end)) points.push([end.lat, end.lng]);
        }

        if (points.length > 0) {
            try {
                map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
            } catch(e) { /* ignore fitBounds error */ }
        }
    }, [map, start, end, pStart, pEnd, geometry]);
    return null;
};


// Tentative de limiter le loading
// Remplacez tout le composant RoutingMachine par celui-ci :

const RoutingMachine = ({ start, end, pickup, dropoff, onRouteCalculated, hideLine = false, color = '#10B981' }) => {
    const map = useMap();
    const controlRef = useRef(null);

    // ⚡ OPTIMISATION : On extrait les valeurs primitives (nombres) 
    // pour éviter que React ne relance le calcul si l'objet change de référence.
    const startLat = start?.lat;
    const startLng = start?.lng;
    const endLat = end?.lat;
    const endLng = end?.lng;
    const pickupLat = pickup?.lat;
    const pickupLng = pickup?.lng;
    const dropoffLat = dropoff?.lat;
    const dropoffLng = dropoff?.lng;

    useEffect(() => {
        // Sécurité : si la carte ou les points essentiels manquent, on ne fait rien
        if (!map || !isValidCoord(start) || !isValidCoord(end)) return;

        // Nettoyage de l'ancien itinéraire s'il existe
        if (controlRef.current) {
            try { map.removeControl(controlRef.current); } catch(e){}
            controlRef.current = null;
        }

        // Création des points de passage (Waypoints)
        const waypoints = [
            L.latLng(start.lat, start.lng),
            isValidCoord(pickup) ? L.latLng(pickup.lat, pickup.lng) : null,
            isValidCoord(dropoff) ? L.latLng(dropoff.lat, dropoff.lng) : null,
            L.latLng(end.lat, end.lng)
        ].filter(Boolean);

        try {
            // Création du contrôleur de routing
            const control = L.Routing.control({
                waypoints,
                routeWhileDragging: false,
                show: false, // On cache les instructions textuelles sur la carte
                addWaypoints: false,
                createMarker: () => null, // On ne veut pas les marqueurs par défaut de Leaflet Routing Machine
                fitSelectedRoutes: false,
                lineOptions: {
                    // Application de la couleur dynamique et masquage si nécessaire
                    styles: hideLine ? [{ opacity: 0, weight: 0 }] : [{ color: color, weight: 6, opacity: 0.9 }]
                }
            });

            // Événement : Itinéraire trouvé
            control.on('routesfound', (e) => {
                const route = e.routes[0];
                if (onRouteCalculated) {
                    onRouteCalculated({
                        totalDistance: route.summary.totalDistance,
                        totalDuration: route.summary.totalDuration,
                        geometry: route.coordinates.map(c => [c.lat, c.lng]),
                        legs: extractLegDurationsFromRoute(route, waypoints.length)
                    });
                }
            });

            // Événement : Erreur
            control.on('routingerror', function() {
                console.warn("OSRM routing failed. (Problème API ou Réseau)");
            });

            control.addTo(map);
            controlRef.current = control;

        } catch (e) {
            console.error("Erreur création RoutingMachine:", e);
        }

        // Nettoyage au démontage du composant
        return () => {
            if (map && controlRef.current) {
                try {
                    controlRef.current.setWaypoints([]); 
                    map.removeControl(controlRef.current);
                } catch (e) {}
                controlRef.current = null;
            }
        };

    // ⚠️ LA CORRECTION EST ICI : 
    // On dépend uniquement des coordonnées chiffrées (lat/lng), pas des objets.
    }, [
        map, 
        startLat, startLng, 
        endLat, endLng, 
        pickupLat, pickupLng, 
        dropoffLat, dropoffLng, 
        onRouteCalculated, hideLine, color
    ]);

    return null;
};



/*
// Ajout de la prop "color" pour personnaliser la ligne
const RoutingMachine = ({ start, end, pickup, dropoff, onRouteCalculated, hideLine = false, color = '#10B981' }) => {
    const map = useMap();
    const controlRef = useRef(null);

    useEffect(() => {
        if (!map || !isValidCoord(start) || !isValidCoord(end)) return;

        if (controlRef.current) {
            try { map.removeControl(controlRef.current); } catch(e){}
            controlRef.current = null;
        }

        const waypoints = [
            L.latLng(start.lat, start.lng),
            isValidCoord(pickup) ? L.latLng(pickup.lat, pickup.lng) : null,
            isValidCoord(dropoff) ? L.latLng(dropoff.lat, dropoff.lng) : null,
            L.latLng(end.lat, end.lng)
        ].filter(Boolean);

        try {
            const control = L.Routing.control({
                waypoints,
                routeWhileDragging: false,
                show: false,
                addWaypoints: false,
                createMarker: () => null, 
                fitSelectedRoutes: false,
                lineOptions: {
                    // Utilisation de la couleur dynamique ici
                    styles: hideLine ? [{ opacity: 0, weight: 0 }] : [{ color: color, weight: 6, opacity: 0.9 }]
                }
            });

            control.on('routesfound', (e) => {
                const route = e.routes[0];
                if (onRouteCalculated) {
                    onRouteCalculated({
                        totalDistance: route.summary.totalDistance,
                        totalDuration: route.summary.totalDuration,
                        geometry: route.coordinates.map(c => [c.lat, c.lng]),
                        legs: extractLegDurationsFromRoute(route, waypoints.length)
                    });
                }
            });

            control.on('routingerror', function() {
                console.warn("OSRM routing failed. Fallback.");
            });

            control.addTo(map);
            controlRef.current = control;
        } catch (e) {
            console.error("Erreur création RoutingMachine:", e);
        }

        return () => {
            if (map && controlRef.current) {
                try {
                    controlRef.current.setWaypoints([]); 
                    map.removeControl(controlRef.current);
                } catch (e) {}
                controlRef.current = null;
            }
        };
    }, [map, start, end, pickup, dropoff, onRouteCalculated, hideLine, color]); // Ajout de "color" aux dépendances

    return null;
};*/

const RideMap = ({ startCoords, endCoords, passengerStart, passengerEnd, readonly = false, geometry = null, onRouteCalculated }) => {
    const center = isValidCoord(startCoords) ? [startCoords.lat, startCoords.lng] : [48.8566, 2.3522];
    
    // On affiche la ligne verte statique (trajet original) si elle existe
    const hasValidStaticGeometry = readonly && isPolylineGeometry(geometry);

    // DÉTERMINATION DE LA COULEUR DU TRACÉ ACTIF
    // Si on a un détour (passager), on passe en MAUVE (#9333ea), sinon on reste en VERT (#10B981)
    const routeColor = isValidCoord(passengerStart) ? '#9333ea' : '#10B981';

    return (
        <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-gray-200 z-0">
            <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                
                <FitBounds start={startCoords} end={endCoords} pStart={passengerStart} pEnd={passengerEnd} geometry={geometry} />

                {/* 1. Ligne verte (Trajet original enregistré) */}
                {/* On la laisse toujours en vert pour servir de référence */}
                {hasValidStaticGeometry && (
                    <Polyline positions={geometry} pathOptions={{ color: '#10B981', weight: 5, opacity: 0.5 }} />
                )}

                {/* 2. Calculateur (Ligne dynamique) */}
                {/* Cette ligne sera MAUVE si un passager est sélectionné, se superposant ou deviant du trajet vert */}
                {(isValidCoord(startCoords) && isValidCoord(endCoords)) && (
                     (!readonly || (readonly && isValidCoord(passengerStart)) || !hasValidStaticGeometry) && (
                        <RoutingMachine 
                            start={startCoords} end={endCoords} 
                            pickup={passengerStart} dropoff={passengerEnd}
                            onRouteCalculated={onRouteCalculated}
                            // On cache la ligne si c'est juste de la lecture du trajet original (vert sur vert inutile)
                            // Mais on l'affiche si c'est un détour (pour voir le mauve)
                            hideLine={hasValidStaticGeometry && !isValidCoord(passengerStart)}
                            color={routeColor} // On passe la couleur
                        />
                     )
                )}

                {/* Marqueurs */}
                {isValidCoord(startCoords) && <Marker position={[startCoords.lat, startCoords.lng]}><Popup>Départ Conducteur</Popup></Marker>}
                {isValidCoord(endCoords) && <Marker position={[endCoords.lat, endCoords.lng]}><Popup>Arrivée Conducteur</Popup></Marker>}
                {isValidCoord(passengerStart) && <Marker position={[passengerStart.lat, passengerStart.lng]}><Popup>Pickup Passager</Popup></Marker>}
                {isValidCoord(passengerEnd) && <Marker position={[passengerEnd.lat, passengerEnd.lng]}><Popup>Dropoff Passager</Popup></Marker>}
            </MapContainer>
        </div>
    );
};

export default RideMap;