// // components/MapLocationPicker.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import { Search, Loader2, MapPin, Navigation, X, AlertCircle, MousePointer } from 'lucide-react';
// import 'leaflet/dist/leaflet.css';

// // Fix default marker icons in Leaflet
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// interface Location {
//   label: string;
//   address: string;
//   latitude: number;
//   longitude: number;
// }

// interface MapLocationPickerProps {
//   location: Location;
//   onChange: (field: string, value: any) => void;
//   label: string;
//   icon?: React.ComponentType<{ className?: string }>;
// }

// // Custom marker icon for selected location
// const selectedIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// // Reverse geocoding function
// async function reverseGeocode(lat: number, lng: number): Promise<string> {
//   try {
//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
//       {
//         headers: {
//           'User-Agent': 'DriverBookingApp/1.0'
//         }
//       }
//     );
//     const data = await response.json();
//     return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//   } catch (error) {
//     console.error('Reverse geocoding error:', error);
//     return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//   }
// }

// // Search for places
// async function searchPlace(query: string): Promise<Array<{ lat: number; lng: number; display_name: string }>> {
//   if (!query.trim()) return [];
  
//   try {
//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
//       {
//         headers: {
//           'User-Agent': 'DriverBookingApp/1.0'
//         }
//       }
//     );
//     const data = await response.json();
//     return data.map((item: any) => ({
//       lat: parseFloat(item.lat),
//       lng: parseFloat(item.lon),
//       display_name: item.display_name
//     }));
//   } catch (error) {
//     console.error('Geocoding error:', error);
//     return [];
//   }
// }

// // Component to handle map clicks
// function MapClickHandler({ onMapClick, isSelectingMode }: { onMapClick: (lat: number, lng: number) => void; isSelectingMode: boolean }) {
//   useMapEvents({
//     click(e) {
//       if (isSelectingMode) {
//         const { lat, lng } = e.latlng;
//         onMapClick(lat, lng);
//       }
//     },
//   });
//   return null;
// }

// // Component to update marker position
// function MapMarker({ position }: { position: [number, number] | null }) {
//   const map = useMap();
  
//   useEffect(() => {
//     if (position && map) {
//       map.setView(position, map.getZoom());
//     }
//   }, [position, map]);
  
//   return position ? <Marker position={position} icon={selectedIcon} /> : null;
// }

// export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
//   location,
//   onChange,
//   label,
//   icon: Icon = MapPin
// }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isSearching, setIsSearching] = useState(false);
//   const [showMap, setShowMap] = useState(false);
//   const [searchResults, setSearchResults] = useState<Array<{ lat: number; lng: number; display_name: string }>>([]);
//   const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
//   const [isGettingLocation, setIsGettingLocation] = useState(false);
//   const [locationError, setLocationError] = useState<string | null>(null);
//   const [isSelectingMode, setIsSelectingMode] = useState(true);
//   const [tempMarkerPosition, setTempMarkerPosition] = useState<[number, number] | null>(
//     location.latitude && location.latitude !== 0 ? [location.latitude, location.longitude] : null
//   );
//   const mapRef = useRef<any>(null);

//   // Check if coordinates are valid (not zero)
//   const hasValidCoordinates = (lat: number, lng: number) => {
//     return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
//   };

//   // Get user's current location
//   const getUserLocation = async () => {
//     setIsGettingLocation(true);
//     setLocationError(null);

//     return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
//       if (!navigator.geolocation) {
//         const errorMsg = 'Geolocation is not supported by your browser';
//         setLocationError(errorMsg);
//         reject(new Error(errorMsg));
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords;
          
//           try {
//             const address = await reverseGeocode(latitude, longitude);
//             updateLocation({ latitude, longitude, address });
//             setMapCenter([latitude, longitude]);
//             setTempMarkerPosition([latitude, longitude]);
//             resolve({ lat: latitude, lng: longitude });
//           } catch (error) {
//             console.error('Reverse geocoding error:', error);
//             updateLocation({ latitude, longitude, address: `${latitude}, ${longitude}` });
//             resolve({ lat: latitude, lng: longitude });
//           }
//           setIsGettingLocation(false);
//         },
//         (error) => {
//           console.error('Geolocation error:', error);
//           let errorMsg = 'Unable to get your location. ';
          
//           switch(error.code) {
//             case error.PERMISSION_DENIED:
//               errorMsg += 'Please allow location access in your browser settings.';
//               break;
//             case error.POSITION_UNAVAILABLE:
//               errorMsg += 'Location information is unavailable.';
//               break;
//             case error.TIMEOUT:
//               errorMsg += 'Location request timed out.';
//               break;
//             default:
//               errorMsg += 'Please check your browser permissions.';
//           }
          
//           setLocationError(errorMsg);
//           setIsGettingLocation(false);
//           reject(new Error(errorMsg));
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0
//         }
//       );
//     });
//   };

//   // Update all location fields at once
//   const updateLocation = (newLocation: { latitude: number; longitude: number; address: string }) => {
//     console.log(`Updating full ${label}:`, newLocation);
//     onChange('address', newLocation.address);
//     onChange('latitude', newLocation.latitude);
//     onChange('longitude', newLocation.longitude);
//   };

//   // Handle map opening - get user location first
//   const handleShowMap = async () => {
//     setShowMap(true);
//     setIsSelectingMode(true);
    
//     // If we don't have a valid location yet, get user's current location
//     if (!location.address || !hasValidCoordinates(location.latitude, location.longitude)) {
//       try {
//         await getUserLocation();
//       } catch (error) {
//         console.log('Could not get user location');
//         // Fallback to a default world view if location fails
//         setMapCenter([0, 0]);
//       }
//     } else if (hasValidCoordinates(location.latitude, location.longitude)) {
//       // Use existing location if available
//       setMapCenter([location.latitude, location.longitude]);
//     }
//   };

//   // Update map center when location changes
//   useEffect(() => {
//     if (hasValidCoordinates(location.latitude, location.longitude)) {
//       setMapCenter([location.latitude, location.longitude]);
//       setTempMarkerPosition([location.latitude, location.longitude]);
//     }
//   }, [location.latitude, location.longitude]);

//   const handleMapClick = async (lat: number, lng: number) => {
//     console.log(`Map clicked at: ${lat}, ${lng}`);
    
//     setTempMarkerPosition([lat, lng]);
    
//     const address = await reverseGeocode(lat, lng);
//     console.log(`Address found: ${address}`);
    
//     updateLocation({ latitude: lat, longitude: lng, address });
//     setLocationError(null);
//   };

//   const handleSearch = async () => {
//     if (!searchQuery.trim()) return;
    
//     setIsSearching(true);
//     const results = await searchPlace(searchQuery);
    
//     if (results.length > 0) {
//       setSearchResults(results);
//       setLocationError(null);
//     } else {
//       alert('Location not found. Please try a different search term.');
//       setSearchResults([]);
//     }
    
//     setIsSearching(false);
//   };

//   const handleSelectSearchResult = (result: { lat: number; lng: number; display_name: string }) => {
//     updateLocation({ 
//       latitude: result.lat, 
//       longitude: result.lng, 
//       address: result.display_name 
//     });
//     setMapCenter([result.lat, result.lng]);
//     setTempMarkerPosition([result.lat, result.lng]);
//     setSearchResults([]);
//     setSearchQuery('');
//     setLocationError(null);
//   };

//   const handleGetCurrentLocation = async () => {
//     try {
//       await getUserLocation();
//     } catch (error) {
//       // Error is already handled in getUserLocation
//     }
//   };

//   const handleClearLocation = () => {
//     updateLocation({ 
//       latitude: 0, 
//       longitude: 0, 
//       address: '' 
//     });
//     setTempMarkerPosition(null);
//     setMapCenter(null);
//   };

//   return (
//     <div className="space-y-3">
//       <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
//         {Icon && <Icon className="w-4 h-4" />}
//         {label} <span className="text-red-500">*</span>
//       </label>

//       {/* Search and Current Location Buttons */}
//       <div className="flex gap-2">
//         <div className="flex-1 relative">
//           <input
//             type="text"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//             placeholder={`Search for ${label.toLowerCase()}...`}
//             className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
//           />
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//         </div>
//         <button
//           onClick={handleSearch}
//           disabled={isSearching}
//           className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
//         >
//           {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
//           Search
//         </button>
//         <button
//           onClick={handleGetCurrentLocation}
//           disabled={isGettingLocation}
//           className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
//           title="Use my current location"
//         >
//           {isGettingLocation ? (
//             <Loader2 className="w-4 h-4 animate-spin" />
//           ) : (
//             <Navigation className="w-4 h-4" />
//           )}
//           <span className="hidden sm:inline">Current</span>
//         </button>
//       </div>

//       {/* Search Results Dropdown */}
//       {searchResults.length > 0 && (
//         <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
//           {searchResults.map((result, index) => (
//             <button
//               key={index}
//               onClick={() => handleSelectSearchResult(result)}
//               className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
//             >
//               <p className="text-sm text-gray-800">{result.display_name}</p>
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Location Error Message */}
//       {locationError && (
//         <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
//           <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
//           <div className="flex-1">
//             <p className="text-sm text-red-700">{locationError}</p>
//             <p className="text-xs text-red-600 mt-1">
//               You can still search for a location or click on the map to select.
//             </p>
//           </div>
//           <button
//             onClick={() => setLocationError(null)}
//             className="p-1 hover:bg-red-100 rounded-full"
//           >
//             <X className="w-3 h-3 text-red-500" />
//           </button>
//         </div>
//       )}

//       {/* Selected Location Display */}
//       {location.address && hasValidCoordinates(location.latitude, location.longitude) && (
//         <div className="bg-blue-50 p-3 rounded-xl">
//           <div className="flex items-start justify-between">
//             <div className="flex-1">
//               <p className="text-xs text-blue-600 font-medium mb-1">Selected {label}:</p>
//               <p className="text-sm text-gray-800 break-words">{location.address}</p>
//               {location.latitude && location.longitude && (
//                 <p className="text-xs text-gray-500 mt-1">
//                   📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
//                 </p>
//               )}
//             </div>
//             <button
//               onClick={handleClearLocation}
//               className="p-1 hover:bg-blue-100 rounded-full transition-colors"
//               title="Clear location"
//             >
//               <X className="w-4 h-4 text-blue-600" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Selection Mode Toggle */}
//       {showMap && (
//         <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
//           <div className="flex items-center gap-2">
//             <MousePointer className="w-4 h-4 text-blue-600" />
//             <span className="text-sm text-gray-600">Selection Mode:</span>
//           </div>
//           <button
//             onClick={() => setIsSelectingMode(!isSelectingMode)}
//             className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
//               isSelectingMode
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
//             }`}
//           >
//             {isSelectingMode ? 'Click to Select ✓' : 'Disabled'}
//           </button>
//           <span className="text-xs text-gray-500">
//             {isSelectingMode ? 'Click anywhere on map to select location' : 'Toggle to enable selection'}
//           </span>
//         </div>
//       )}

//       {/* Toggle Map Button */}
//       <button
//         onClick={handleShowMap}
//         className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
//       >
//         <MapPin className="w-4 h-4" />
//         {showMap ? 'Hide Map' : 'Show Map to Select Location'}
//       </button>

//       {/* Map Container */}
//       {showMap && (
//         <div className="h-96 rounded-xl overflow-hidden border border-gray-300 relative">
//           {isGettingLocation && (
//             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
//               <div className="flex flex-col items-center">
//                 <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
//                 <p className="mt-2 text-sm text-gray-600">Getting your location...</p>
//               </div>
//             </div>
//           )}
          
//           {mapCenter ? (
//             <MapContainer
//               key={mapCenter[0]}
//               center={mapCenter}
//               zoom={13}
//               style={{ height: '100%', width: '100%' }}
//               className="z-0"
//               ref={mapRef}
//               zoomControl={true}
//               dragging={true}
//               touchZoom={true}
//               scrollWheelZoom={true}
//               doubleClickZoom={true}
//             >
//               <TileLayer
//                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//               />
//               <MapClickHandler onMapClick={handleMapClick} isSelectingMode={isSelectingMode} />
//               <MapMarker position={tempMarkerPosition || (hasValidCoordinates(location.latitude, location.longitude) ? [location.latitude, location.longitude] : null)} />
//             </MapContainer>
//           ) : (
//             <div className="h-full w-full flex items-center justify-center bg-gray-100">
//               <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
//               <p className="ml-2 text-gray-600">Loading map...</p>
//             </div>
//           )}
          
//           {/* Map Instructions Overlay */}
//           {isSelectingMode && mapCenter && (
//             <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs whitespace-nowrap">
//               ✨ Click anywhere on the map to select location
//             </div>
//           )}
//         </div>
//       )}

//       <p className="text-xs text-gray-500 text-center">
//         💡 Make sure "Click to Select" is enabled, then click on the map to select a location
//       </p>
//     </div>
//   );
// };

// components/CombinedMapPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Search, Loader2, MapPin, Navigation, X, AlertCircle, Move, Flag, Home } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { type Location } from '../drivertypes';

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});



interface CombinedMapPickerProps {
  pickupLocation: Location;
  dropoffLocation: Location;
//   onPickupChange: (field: string, value: any) => void;
//   onDropoffChange: (field: string, value: any) => void;
  onPickupChange: (location: Location) => void;
onDropoffChange: (location: Location) => void;
}

// Custom markers for pickup and dropoff
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Reverse geocoding function
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'DriverBookingApp/1.0'
        }
      }
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// Search for places
async function searchPlace(query: string): Promise<Array<{ lat: number; lng: number; display_name: string }>> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'DriverBookingApp/1.0'
        }
      }
    );
    const data = await response.json();
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

// Map click handler component
function MapClickHandler({ onMapClick, isSelectingMode, selectedType }: { 
  onMapClick: (lat: number, lng: number, type: 'pickup' | 'dropoff') => void; 
  isSelectingMode: boolean;
  selectedType: 'pickup' | 'dropoff' | null;
}) {
  useMapEvents({
    click(e) {
      if (isSelectingMode && selectedType) {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng, selectedType);
      }
    },
  });
  return null;
}

// Component to draw route between points
function RouteLine({ pickup, dropoff }: { pickup: Location | null; dropoff: Location | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (pickup && dropoff && pickup.latitude !== 0 && dropoff.latitude !== 0) {
      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [pickup.latitude, pickup.longitude],
        [dropoff.latitude, dropoff.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      
      // Draw a line between the points
      const polyline = L.polyline(
        [
          [pickup.latitude, pickup.longitude],
          [dropoff.latitude, dropoff.longitude]
        ],
        { color: 'blue', weight: 3, opacity: 0.7, dashArray: '5, 10' }
      ).addTo(map);
      
      return () => {
        map.removeLayer(polyline);
      };
    }
  }, [pickup, dropoff, map]);
  
  return null;
}

export const CombinedMapPicker: React.FC<CombinedMapPickerProps> = ({
  pickupLocation,
  dropoffLocation,
  onPickupChange,
  onDropoffChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ lat: number; lng: number; display_name: string }>>([]);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSelectingMode, setIsSelectingMode] = useState(true);
  const [selectedLocationType, setSelectedLocationType] = useState<'pickup' | 'dropoff' | null>('pickup');
  
  const mapRef = useRef<any>(null);

  const hasValidCoordinates = (lat: number, lng: number) => {
    return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
  };


 const updateLocation = (
  type: 'pickup' | 'dropoff',
  newLocation: { latitude: number; longitude: number; address: string }
) => {
  console.log(`Updating ${type}:`, newLocation);

  if (type === 'pickup') {
    onPickupChange({
      ...pickupLocation,
      address: newLocation.address,
      latitude: newLocation.latitude,
      longitude: newLocation.longitude
    });
  } else {
    onDropoffChange({
      ...dropoffLocation,
      address: newLocation.address,
      latitude: newLocation.latitude,
      longitude: newLocation.longitude
    });
  }
};

  const getUserLocation = async (type: 'pickup' | 'dropoff') => {
    setIsGettingLocation(true);
    setLocationError(null);

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setLocationError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const address = await reverseGeocode(latitude, longitude);
            updateLocation(type, { latitude, longitude, address });
            setMapCenter([latitude, longitude]);
            resolve({ lat: latitude, lng: longitude });
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            updateLocation(type, { latitude, longitude, address: `${latitude}, ${longitude}` });
            resolve({ lat: latitude, lng: longitude });
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMsg = 'Unable to get your location. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg += 'Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMsg += 'Location request timed out.';
              break;
            default:
              errorMsg += 'Please check your browser permissions.';
          }
          
          setLocationError(errorMsg);
          setIsGettingLocation(false);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    });
  };

  const handleShowMap = async () => {
  // Toggle the map visibility
  const newShowMap = !showMap;
  setShowMap(newShowMap);
  
  // Only perform location setup when opening the map
  if (newShowMap) {
    setIsSelectingMode(true);
    setSelectedLocationType('pickup');
    
    // Try to get current location if no locations are set
    if ((!pickupLocation.address || !hasValidCoordinates(pickupLocation.latitude, pickupLocation.longitude)) &&
        (!dropoffLocation.address || !hasValidCoordinates(dropoffLocation.latitude, dropoffLocation.longitude))) {
      try {
        await getUserLocation('pickup');
      } catch (error) {
        console.log('Could not get user location');
        setMapCenter([0, 0]);
      }
    } else if (hasValidCoordinates(pickupLocation.latitude, pickupLocation.longitude)) {
      setMapCenter([pickupLocation.latitude, pickupLocation.longitude]);
    } else if (hasValidCoordinates(dropoffLocation.latitude, dropoffLocation.longitude)) {
      setMapCenter([dropoffLocation.latitude, dropoffLocation.longitude]);
    }
  }
};

  const handleMapClick = async (lat: number, lng: number, type: 'pickup' | 'dropoff') => {
    console.log(`Map clicked for ${type} at: ${lat}, ${lng}`);
    const address = await reverseGeocode(lat, lng);
    updateLocation(type, { latitude: lat, longitude: lng, address });
    setLocationError(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const results = await searchPlace(searchQuery);
    
    if (results.length > 0) {
      setSearchResults(results);
      setLocationError(null);
    } else {
      alert('Location not found. Please try a different search term.');
      setSearchResults([]);
    }
    
    setIsSearching(false);
  };

  const handleSelectSearchResult = (result: { lat: number; lng: number; display_name: string }) => {
    if (selectedLocationType) {
      updateLocation(selectedLocationType, {
        latitude: result.lat,
        longitude: result.lng,
        address: result.display_name
      });
      setMapCenter([result.lat, result.lng]);
    }
    setSearchResults([]);
    setSearchQuery('');
    setLocationError(null);
  };

//   const handleUseCurrentLocation = async () => {
//     if (selectedLocationType) {
//       await getUserLocation(selectedLocationType);
//     }
//   };

  const handleUseCurrentLocation = async () => {
  // Only allow current location for pickup
  if (selectedLocationType === 'dropoff') {
    setLocationError('Current location can only be used for pickup location');
    return;
  }
  
  if (selectedLocationType) {
    await getUserLocation(selectedLocationType);
  }
};

  const handleClearLocation = (type: 'pickup' | 'dropoff') => {
    updateLocation(type, { latitude: 0, longitude: 0, address: '' });
  };

  return (
    <div className="space-y-4">
      {/* Location Type Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setSelectedLocationType('pickup')}
          className={`flex-1 p-3 rounded-xl border-2 transition-all ${
            selectedLocationType === 'pickup'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Flag className="w-5 h-5 text-green-600" />
            <span className="font-medium">Set Pickup</span>
          </div>
        </button>
        
        <button
          onClick={() => setSelectedLocationType('dropoff')}
          className={`flex-1 p-3 rounded-xl border-2 transition-all ${
            selectedLocationType === 'dropoff'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            <span className="font-medium">Set Dropoff</span>
          </div>
        </button>
      </div>

      {/* Search Section */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search for location to set as ${selectedLocationType === 'pickup' ? 'pickup' : 'dropoff'}...`}
            className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
        {/* <button
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          title="Use my current location"
        >
          {isGettingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Current</span>
        </button> */}
        <button
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation || selectedLocationType === 'dropoff'}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                selectedLocationType === 'dropoff'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50`}
            title={selectedLocationType === 'dropoff' ? 'Current location only available for pickup' : 'Use my current location'}
            >
            {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Navigation className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Current</span>
            </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectSearchResult(result)}
              className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
            >
              <p className="text-sm text-gray-800">{result.display_name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{locationError}</p>
          </div>
          <button onClick={() => setLocationError(null)} className="p-1 hover:bg-red-100 rounded-full">
            <X className="w-3 h-3 text-red-500" />
          </button>
        </div>
      )}

      {/* Selected Locations Display */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl border-2 ${pickupLocation.address ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-green-600">PICKUP</span>
            {pickupLocation.address && (
              <button onClick={() => handleClearLocation('pickup')} className="text-xs text-gray-400 hover:text-red-500">
                Clear
              </button>
            )}
          </div>
          <p className="text-sm text-gray-800 truncate">
            {pickupLocation.address || 'Not selected'}
          </p>
          {pickupLocation.latitude !== 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {pickupLocation.latitude.toFixed(4)}, {pickupLocation.longitude.toFixed(4)}
            </p>
          )}
        </div>
        
        <div className={`p-3 rounded-xl border-2 ${dropoffLocation.address ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-red-600">DROPOFF</span>
            {dropoffLocation.address && (
              <button onClick={() => handleClearLocation('dropoff')} className="text-xs text-gray-400 hover:text-red-500">
                Clear
              </button>
            )}
          </div>
          <p className="text-sm text-gray-800 truncate">
            {dropoffLocation.address || 'Not selected'}
          </p>
          {dropoffLocation.latitude !== 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {dropoffLocation.latitude.toFixed(4)}, {dropoffLocation.longitude.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Selection Mode Toggle */}
      {showMap && (
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Selection Mode:</span>
          </div>
          <button
            onClick={() => setIsSelectingMode(!isSelectingMode)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isSelectingMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {isSelectingMode ? 'Click to Select ✓' : 'Disabled'}
          </button>
          <span className="text-xs text-gray-500">
            {isSelectingMode ? `Click to set ${selectedLocationType}` : 'Toggle to enable selection'}
          </span>
        </div>
      )}

      {/* Toggle Map Button */}
      <button
        onClick={handleShowMap}
        className="w-full py-3 text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        {showMap ? 'Hide Map' : 'Show Map to Select Locations'}
      </button>

      {/* Map Container */}
      {showMap && (
        <div className="h-96 rounded-xl overflow-hidden border border-gray-300 relative">
          {isGettingLocation && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="mt-2 text-sm text-gray-600">Getting your location...</p>
              </div>
            </div>
          )}
          
          {mapCenter ? (
            <MapContainer
              key={mapCenter[0]}
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
              ref={mapRef}
              zoomControl={true}
              dragging={true}
              touchZoom={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler 
                onMapClick={handleMapClick} 
                isSelectingMode={isSelectingMode} 
                selectedType={selectedLocationType}
              />
              <RouteLine pickup={pickupLocation} dropoff={dropoffLocation} />
              
              {hasValidCoordinates(pickupLocation.latitude, pickupLocation.longitude) && (
                <Marker position={[pickupLocation.latitude, pickupLocation.longitude]} icon={pickupIcon}>
                  <Popup>Pickup Location</Popup>
                </Marker>
              )}
              
              {hasValidCoordinates(dropoffLocation.latitude, dropoffLocation.longitude) && (
                <Marker position={[dropoffLocation.latitude, dropoffLocation.longitude]} icon={dropoffIcon}>
                  <Popup>Dropoff Location</Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="ml-2 text-gray-600">Loading map...</p>
            </div>
          )}
          
          {/* Map Instructions Overlay */}
          {isSelectingMode && mapCenter && selectedLocationType && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs whitespace-nowrap">
              🎯 Click to set {selectedLocationType === 'pickup' ? 'PICKUP' : 'DROPOFF'} location
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        💡 Select location type (Pickup/Dropoff), then click on map to set location
      </p>
    </div>
  );
};