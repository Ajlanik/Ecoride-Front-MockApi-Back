// components/ui/RideMap.jsx
// Version Finale Stable & Robuste (Protection contre les lat/lng undefined)

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Fonction utilitaire pour vérifier si une coordonnée est valide
const isValidCoord = (coord) => {
    return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number';
};

// --- Composant Recadrage ---
const FitBounds = ({ start, end }) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        try {
            // On ne recadre que si les points sont valides
            if (isValidCoord(start) && isValidCoord(end)) {
                const bounds = L.latLngBounds([start.lat, start.lng], [end.lat, end.lng]);
                if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
            } else if (isValidCoord(start)) {
                map.setView([start.lat, start.lng], 13);
            }
        } catch (e) {}
    }, [map, start, end]); 
    return null;
};

// --- Composant Routing ---
const RoutingMachine = ({ start, end, onRouteCalculated }) => {
    const map = useMap();
    const routingControlRef = useRef(null);
    const callbackRef = useRef(onRouteCalculated);

    useEffect(() => { callbackRef.current = onRouteCalculated; }, [onRouteCalculated]);

    useEffect(() => {
        // Sécurité : Si carte ou coords manquantes, on ne fait rien
        if (!map || !isValidCoord(start) || !isValidCoord(end)) return;

        // Cleanup préventif
        if (routingControlRef.current) {
            try { map.removeControl(routingControlRef.current); } catch (e) {}
            routingControlRef.current = null;
        }

        const routingControl = L.Routing.control({
            waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
            lineOptions: { styles: [{ color: '#10B981', opacity: 0.8, weight: 6 }] },
            show: false, 
            addWaypoints: false, 
            draggableWaypoints: false, 
            fitSelectedRoutes: false, 
            showAlternatives: false,
            createMarker: function() { return null; } 
        });

        routingControlRef.current = routingControl;

        try { routingControl.addTo(map); } catch (e) {}

        const handleRoutesFound = (e) => {
            const routes = e.routes;
            if (routes && routes.length > 0) {
                const summary = routes[0].summary;
                if (callbackRef.current) {
                    callbackRef.current({
                        distance: summary.totalDistance,
                        duration: summary.totalTime 
                    });
                }
            }
        };

        routingControl.on('routesfound', handleRoutesFound);

        return () => {
            if (routingControlRef.current) {
                routingControlRef.current.off('routesfound', handleRoutesFound);
                try { 
                    if(map && map.removeControl) map.removeControl(routingControlRef.current); 
                } catch (e) {}
                routingControlRef.current = null;
            }
        };
    }, [map, start?.lat, start?.lng, end?.lat, end?.lng]);

    return null;
};

// --- Composant Principal ---
const RideMap = ({ startCoords, endCoords, readonly = false, onRouteCalculated }) => {
    const defaultCenter = [46.603354, 1.888334]; 
    
    // On vérifie la validité AVANT de créer le tableau [lat, lng]
    // Sinon [undefined, undefined] fait planter Leaflet
    const hasStart = isValidCoord(startCoords);
    const hasEnd = isValidCoord(endCoords);

    const center = hasStart ? [startCoords.lat, startCoords.lng] : defaultCenter;

    return (
        <div className="w-full h-full min-h-[300px] bg-gray-100 relative z-0 rounded-xl overflow-hidden border border-gray-200">
            <style>{`.leaflet-routing-container, .leaflet-routing-alternatives-container, .leaflet-bar[class*="routing"] { display: none !important; }`}</style>
            
            <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBounds start={startCoords} end={endCoords} />
                
                {/* On n'affiche le routing que si les DEUX points sont valides */}
                {hasStart && hasEnd && (
                    <RoutingMachine start={startCoords} end={endCoords} onRouteCalculated={onRouteCalculated} />
                )}

                {hasStart && <Marker position={[startCoords.lat, startCoords.lng]}><Popup>Départ</Popup></Marker>}
                {hasEnd && <Marker position={[endCoords.lat, endCoords.lng]}><Popup>Arrivée</Popup></Marker>}
            </MapContainer>
        </div>
    );
};

export default RideMap;