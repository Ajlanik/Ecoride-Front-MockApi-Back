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

const isValidCoord = (coord) => {
    return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number';
};

const FitBounds = ({ start, end, pStart, pEnd }) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        try {
            const points = [];
            if (isValidCoord(start)) points.push([start.lat, start.lng]);
            if (isValidCoord(pStart)) points.push([pStart.lat, pStart.lng]);
            if (isValidCoord(pEnd)) points.push([pEnd.lat, pEnd.lng]);
            if (isValidCoord(end)) points.push([end.lat, end.lng]);

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
            }
        } catch (e) {}
    }, [map, start, end, pStart, pEnd]); 
    return null;
};

// Machine de Routing qui gère les 4 points
const RoutingMachine = ({ start, end, pickup, dropoff, onRouteCalculated }) => {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map || !isValidCoord(start) || !isValidCoord(end)) return;

        if (routingControlRef.current) {
            try { map.removeControl(routingControlRef.current); } catch (e) {}
        }

        // Liste des étapes (DriverStart -> Pickup -> Dropoff -> DriverEnd)
        const waypoints = [L.latLng(start.lat, start.lng)];
        
        if (isValidCoord(pickup)) waypoints.push(L.latLng(pickup.lat, pickup.lng));
        if (isValidCoord(dropoff)) waypoints.push(L.latLng(dropoff.lat, dropoff.lng));
        
        waypoints.push(L.latLng(end.lat, end.lng));

        const routingControl = L.Routing.control({
            waypoints: waypoints,
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
            lineOptions: { 
                styles: [{ 
                    color: (isValidCoord(pickup) || isValidCoord(dropoff)) ? '#8B5CF6' : '#10B981', 
                    opacity: 0.7, 
                    weight: 6 
                }] 
            },
            show: false, 
            addWaypoints: false, 
            draggableWaypoints: false,
            createMarker: function() { return null; }
        });

        // 2. Gestion du calcul des segments
        const handleRoutesFound = (e) => {
            const routes = e.routes;
            if (routes && routes.length > 0) {
                const route = routes[0];
                
                // On calcule les segments entre chaque waypoint
                // Exemple : DriverStart -> Pickup, Pickup -> Dropoff, Dropoff -> DriverEnd
                const legs = [];
                let currentLegDuration = 0;
                let currentLegDistance = 0;

                route.instructions.forEach((instr) => {
                    currentLegDuration += instr.time;
                    currentLegDistance += instr.distance;

                    if (instr.type === 'WaypointReached' || instr.type === 'DestinationReached') {
                        legs.push({ duration: currentLegDuration, distance: currentLegDistance });
                        currentLegDuration = 0;
                        currentLegDistance = 0;
                    }
                });

                if (onRouteCalculated) {
                    onRouteCalculated({
                        totalDistance: route.summary.totalDistance,
                        totalDuration: route.summary.totalTime,
                        legs: legs // On renvoie les segments pour le calcul précis des heures
                    });
                }
            }
        };

        routingControl.on('routesfound', handleRoutesFound);
        routingControlRef.current = routingControl;
        
        try { routingControl.addTo(map); } catch (e) {}

        return () => {
             if (routingControlRef.current) {
                routingControlRef.current.off('routesfound', handleRoutesFound);
                try { map.removeControl(routingControlRef.current); } catch (e) {}
             }
        };
    }, [map, start, end, pickup, dropoff, onRouteCalculated]);

    return null;
};

const RideMap = ({ startCoords, endCoords, passengerStart, passengerEnd, readonly = false, onRouteCalculated }) => {
    const defaultCenter = [46.603354, 1.888334]; 
    const center = isValidCoord(startCoords) ? [startCoords.lat, startCoords.lng] : defaultCenter;

    return (
        <div className="w-full h-full min-h-[300px] bg-gray-100 relative z-0 rounded-xl overflow-hidden border border-gray-200">
            <style>{`.leaflet-routing-container { display: none !important; }`}</style>
            
            <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBounds start={startCoords} end={endCoords} pStart={passengerStart} pEnd={passengerEnd} />
                
                <RoutingMachine 
                    start={startCoords} 
                    end={endCoords} 
                    pickup={passengerStart}
                    dropoff={passengerEnd}
                    onRouteCalculated={onRouteCalculated} 
                />

                {isValidCoord(startCoords) && <Marker position={[startCoords.lat, startCoords.lng]}><Popup>Départ Conducteur</Popup></Marker>}
                {isValidCoord(endCoords) && <Marker position={[endCoords.lat, endCoords.lng]}><Popup>Arrivée Conducteur</Popup></Marker>}

                {isValidCoord(passengerStart) && (
                    <Marker position={[passengerStart.lat, passengerStart.lng]}>
                        <Popup className="font-bold text-purple-600">Pickup Passager</Popup>
                    </Marker>
                )}
                {isValidCoord(passengerEnd) && (
                    <Marker position={[passengerEnd.lat, passengerEnd.lng]}>
                        <Popup className="font-bold text-purple-600">Dropoff Passager</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default RideMap;