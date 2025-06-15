// adaptedTutorial.js
// This script loads MegaCities.geojson, maps each feature as a styled circle marker, and attaches a popup with all properties.

// 1. Initialize the map centered globally
var map = L.map('map').setView([20, 0], 2); // Centered on the equator, zoomed out

// 2. Add OpenStreetMap tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, // Maximum zoom level for the map
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' // Required attribution
}).addTo(map);

// 3. Define custom marker options for circle markers
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

// 4. Function to create popups with all properties for each feature
function onEachFeature(feature, layer) {
    var popupContent = "";
    if (feature.properties) {
        // Loop through all properties and add them to the popup as HTML
        for (var property in feature.properties) {
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    }
}

// 5. Load the MegaCities.geojson data and add to map as circle markers with popups
fetch("data/MegaCities.geojson")
    .then(function(response) {
        return response.json(); // Parse the response as JSON
    })
    .then(function(json) {
        // Create a Leaflet GeoJSON layer and add it to the map
        // Use pointToLayer to style each city as a custom circle marker
        L.geoJSON(json, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            },
            onEachFeature: onEachFeature // Use the function to create popups with all properties
        }).addTo(map);
    })
    .catch(function(error) {
        console.error('Error loading the GeoJSON data:', error);
    });