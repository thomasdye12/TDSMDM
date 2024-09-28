import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../utils/axios';
/* global mapkit */ // This tells ESLint that mapkit is a global variable

const LocationTab = ({ location }) => {
    const mapRef = useRef(null);
    const [deviceInfo, setDeviceInfo] = useState(null); // State to hold device info

    // Function to get MapKit token from the server
    const MapToken = async () => {
        const { data } = await axiosInstance.get(`v1/system/mapping/token`);
        return data;
    };

    // Function to format timestamp relative to the current time
    const formatRelativeTime = (timestamp) => {
        const now = Date.now(); // Current time in milliseconds
        const timeDifference = (now - timestamp * 1000) / 1000; // Difference in seconds

        const seconds = Math.floor(timeDifference);
        const minutes = Math.floor(timeDifference / 60);
        const hours = Math.floor(timeDifference / 3600);
        const days = Math.floor(timeDifference / 86400);
        const weeks = Math.floor(timeDifference / 604800);

        if (seconds < 60) return `${seconds} seconds ago`;
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return `${weeks} weeks ago`;
    };

    // Function to request a new location update
    const requestNewLocation = () => {
        // make a post to v1/system/mdm/TDSLocationTracking/RequestUpdate with the APNS Token, ENV and UDID
        axiosInstance.post(`v1/system/mdm/TDSLocationTracking/RequestUpdate`, {
            APNSToken: location.Device.Settings.APNSinfo.APNStoken,
            ENV: location.Device.Settings.APNSinfo.ENV,
            UDID: location.MDMDeviceID
        }).then((res) => {
            alert('Location update requested successfully');
        });
    };

    useEffect(() => {
        if (window.mapkit && location) {
            setDeviceInfo(location.Device); // Set device info for use in the UI

            // Initialize MapKit
            mapkit.init({
                authorizationCallback: function (done) {
                    MapToken().then((data) => {
                        done(data.token);
                    });
                }
            });

            const map = new mapkit.Map(mapRef.current);

            const coordinate = new mapkit.Coordinate(location.Location.latitude, location.Location.longitude);
            map.region = new mapkit.CoordinateRegion(coordinate, new mapkit.CoordinateSpan(0.02, 0.02));

            // Format the timestamp as a relative time
            const relativeTime = formatRelativeTime(location.Time.LocationTime);

            // Create a marker with the relative time as the title
            const marker = new mapkit.MarkerAnnotation(coordinate, {
                title: `Device Location (${relativeTime})`, // Device name with relative time
            });

            // Add the marker to the map's annotations
            map.addAnnotation(marker);
        }
    }, [location]);

    return (
        <div>
            {/* Map Container */}
            <div ref={mapRef} style={{ height: '500px', width: '100%' }}></div>

            {/* Device Info Section */}
            {deviceInfo && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Device Info</h3>
                    <p><strong>Battery Level:</strong> {(deviceInfo.Blevel * 100).toFixed(0)}%</p>
                    <p><strong>WiFi SSID:</strong> {location.Location.ssid || 'Not connected'}</p>
                    <p><strong>WiFi BSSID:</strong> {location.Location.bssid || 'N/A'}</p>
                    <p><strong>Movement Type:</strong> {location.Movement.type !== 'unknown' ? location.Movement.type : 'Not known'}</p>
                    <p><strong>Speed:</strong> {location.Movement.speed ? `${location.Movement.speed.toFixed(2)} m/s` : 'Not moving'}</p>

                    {/* Conditionally render the "Request New Location" button */}
                    {deviceInfo.Settings.APNSinfo?.APNStoken && (
                        <button onClick={requestNewLocation} style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            Request New Location
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationTab;
