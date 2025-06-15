// geojsonTutorial.js
// This script demonstrates how to use GeoJSON data with Leaflet maps.
// It covers map initialization, adding tile layers, and displaying points, lines, and polygons with popups and custom styles.

// 1. Initialize the map centered on Coors Field, Denver, with zoom level 13
var map = L.map('map').setView([39.75621, -104.99404], 13);

// 2. Add OpenStreetMap tile layer as the base map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, // Maximum zoom level for the map
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' // Required attribution
}).addTo(map);

// 3. Define a GeoJSON feature for Coors Field (a Point with popup content)
var geojsonFeature = {
    "type": "Feature", // GeoJSON Feature object
    "properties": {
        "name": "Coors Field", // Name of the feature
        "amenity": "Baseball Stadium", // Type of amenity
        "popupContent": "This is where the Rockies play!" // Popup text for this feature
    },
    "geometry": {
        "type": "Point", // Geometry type is Point
        "coordinates": [-104.99404, 39.75621] // [longitude, latitude] of the point
    }
};

// 4. Add the GeoJSON feature to the map
L.geoJSON(geojsonFeature, {
    // onEachFeature is called for each feature in the GeoJSON
    onEachFeature: function(feature, layer) {
        // If the feature has a property called popupContent, bind it as a popup
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
    }
    // By default, Leaflet renders GeoJSON Points as circle markers
}).addTo(map);

// 5. Define an array of GeoJSON LineString objects
var myLines = [
    {
        "type": "LineString",
        "coordinates": [[-100, 40], [-105, 45], [-110, 55]] // Array of [lng, lat] pairs
    },
    {
        "type": "LineString",
        "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
    }
];

// 6. Define a style object for the lines
var myStyle = {
    "color": "#ff7800", // Orange color
    "weight": 5,         // Line thickness
    "opacity": 0.65      // Line opacity
};

// 7. Add the lines to the map with the custom style
L.geoJSON(myLines, {
    style: myStyle // Apply the style to all lines
}).addTo(map);

// 8. Define an array of GeoJSON Polygon features representing states, each with a 'party' property
var states = [
    {
        "type": "Feature",
        "properties": {"party": "Republican"}, // This property will be used to style the polygon
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-104.05, 48.99],
                [-97.22,  48.98],
                [-96.58,  45.94],
                [-104.03, 45.94],
                [-104.05, 48.99]
            ]]
        }
    },
    {
        "type": "Feature",
        "properties": {"party": "Democrat"},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-109.05, 41.00],
                [-102.06, 40.99],
                [-102.03, 36.99],
                [-109.04, 36.99],
                [-109.05, 41.00]
            ]]
        }
    }
];

// 9. Add the polygons to the map, styling each based on its 'party' property
L.geoJSON(states, {
    style: function(feature) {
        // Style polygons red for Republican, blue for Democrat
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"}; // Red
            case 'Democrat':   return {color: "#0000ff"}; // Blue
        }
    }
}).addTo(map);