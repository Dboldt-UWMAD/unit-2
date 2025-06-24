// adaptedTutorial.js
// This script loads ChicagoCrimeCSV2.geojson, maps each feature as a styled circle marker, and attaches a popup with all properties.

// 1. Initialize the map centered globally on Chicago Crime Data Selection
var map = L.map('map').setView([41.791815984698715, -87.79712747210827], 15);

// 2. Add OpenStreetMap tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, // Maximum zoom level for the map
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' // Required attribution
}).addTo(map);

// 3. Define custom marker options for circle markers
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7805",
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

// Function to calculate proportional radius (with attribute-specific scaling)
function calcPropRadius(attValue, attribute) {
    var minRadius = 5;
    if (!attValue || isNaN(attValue)) return minRadius;
    if (attribute === "IUCR") {
        // IUCR values are large, so scale down
        return minRadius + (attValue / 50); // adjust divisor as needed for your data
    } else {
        // Default scaling for FBI_Code or others
        return minRadius + attValue * 2;
    }
}

// Step 3: build an attributes array from the data
function processData(data){
    var attributes = [];
    var properties = data.features[0].properties;
    var desiredAttributes = ["FBI_Code", "IUCR"];
    desiredAttributes.forEach(function(attr) {
        if (properties.hasOwnProperty(attr)) {
            attributes.push(attr);
        }
    });
    return attributes;
}

// Function to convert markers to circle markers and bind popups
function pointToLayer(feature, latlng, attributes, currentAttributeIndex) {
    var attribute = attributes[currentAttributeIndex];
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    var attValue = feature.properties[attribute];
    if (!isNaN(Number(attValue))) {
        options.radius = calcPropRadius(Number(attValue), attribute);
    } else {
        options.radius = 10;
    }
    var layer = L.circleMarker(latlng, options);
    var popupContent = "<p><b>" + attribute + ":</b> " + attValue + "</p>";
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });
    return layer;
}

// Add circle markers for point features to the map
function createPropSymbols(data, attributes, currentAttributeIndex) {
    if (window.dataLayer) {
        map.removeLayer(window.dataLayer);
    }
    window.dataLayer = L.geoJson(data, {
        pointToLayer: function(feature, latlng) {
            return pointToLayer(feature, latlng, attributes, currentAttributeIndex);
        }
    }).addTo(map);
}

// Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(data, attributes, index) {
    createPropSymbols(data, attributes, index);
}

//Step 1: Create new sequence controls (slider and buttons with event listeners)
function createSequenceControls(attributes, data){
    var panel = document.querySelector("#panel");
    panel.innerHTML = '';
    var slider = "<input class='range-slider' type='range' min='0' max='" + (attributes.length-1) + "' value='0' step='1'></input>";
    panel.insertAdjacentHTML('beforeend',slider);
    panel.insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    panel.insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/LeftArrow.png'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/RightArrow.png'>");

    // Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        var index = Number(this.value);
        updatePropSymbols(data, attributes, index);
    });

    // Step 5: click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var slider = document.querySelector('.range-slider');
            var index = Number(slider.value);
            if (step.id == 'forward'){
                index++;
                index = index > attributes.length-1 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                index = index < 0 ? attributes.length-1 : index;
            }
            slider.value = index;
            updatePropSymbols(data, attributes, index);
        });
    });
}

// Function to load the data and call createPropSymbols
function getData() {
    fetch("data/ChicagoCrimeCSV2.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            var attributes = processData(json);
            createPropSymbols(json, attributes, 0);
            createSequenceControls(attributes, json);
        })
        .catch(function(error) {
            console.error('Error loading the GeoJSON data:', error);
        });
}

// Call getData to load and map the data
getData();