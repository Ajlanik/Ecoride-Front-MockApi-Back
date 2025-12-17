import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix des icônes
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

// --- COMPOSANT DE ROUTING ---
const RoutingMachine = ({ start, end }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !start || !end) return;

        const startPoint = L.latLng(start.lat, start.lng);
        const endPoint = L.latLng(end.lat, end.lng);

        const routingControl = L.Routing.control({
            waypoints: [startPoint, endPoint],

            position: 'bottomleft',


            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: 'driving'
            }),
            lineOptions: {
                styles: [{ color: '#10b981', opacity: 0.8, weight: 6 }],
                extendToWaypoints: true,
                missingRouteTolerance: 0
            },
            routeWhileDragging: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            addWaypoints: false,
            draggableWaypoints: false,
            createMarker: function() { return null; } 
        });

        routingControl.addTo(map);

        return () => {
            try {
                map.removeControl(routingControl);
            } catch (error) {
                console.warn("Erreur clean routing:", error);
            }
        };
    }, [map, start, end]); 

    return null;
};

// --- GESTION CLICS ---
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            if (onMapClick) onMapClick(e.latlng);
        },
    });
    return null;
};

// --- COMPOSANT PRINCIPAL ---
const RideMap = ({ startCoords, endCoords, setMapMode, mapMode, onMapClick, readonly = false }) => {
    const defaultCenter = [48.8566, 2.3522];
    const center = startCoords ? [startCoords.lat, startCoords.lng] : defaultCenter;

    return (
        <div className="w-full h-full relative">
            {!readonly && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur p-4 rounded-xl shadow-xl border border-gray-200 flex flex-col gap-3 min-w-[200px]">
                    <p className="font-bold text-xs text-gray-500 uppercase">Outils Carte</p>
                    <button 
                        type="button"
                        onClick={() => setMapMode('start')}
                        className={`btn btn-sm w-full text-xs font-bold transition-all ${
                            mapMode === 'start' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-600'
                        }`}
                    >
                         Définir Départ
                    </button>
                    <button 
                        type="button"
                        onClick={() => setMapMode('end')}
                        className={`btn btn-sm w-full text-xs font-bold transition-all ${
                            mapMode === 'end' ? 'bg-red-500 text-white' : 'bg-white text-red-500 border border-red-500'
                        }`}
                    >
                         Définir Arrivée
                    </button>
                </div>
            )}

            <MapContainer 
                center={center} 
                zoom={6} 
                style={{ height: "100%", width: "100%" }}
                className={!readonly && mapMode !== 'view' ? 'cursor-crosshair' : ''}
            >
                <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                    attribution='&copy; OpenStreetMap contributors' 
                />
                
                <MapClickHandler onMapClick={onMapClick} />

                {startCoords && endCoords && (
                    <RoutingMachine start={startCoords} end={endCoords} />
                )}

                {startCoords && <Marker position={[startCoords.lat, startCoords.lng]}><Popup>Départ</Popup></Marker>}
                {endCoords && <Marker position={[endCoords.lat, endCoords.lng]}><Popup>Arrivée</Popup></Marker>}

            </MapContainer>
        </div>
    );
};

export default RideMap;