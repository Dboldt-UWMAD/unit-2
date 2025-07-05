// adaptedTutorial.js
// This script loads ChicagoCrimeCSV2.geojson, maps each feature as a styled circle marker, and attaches a popup with all properties.

// 1. Initialize the map centered globally on Chicago Crime Data Selection
// Center the map on the US for Rust and Sun Belt cities
var map = L.map('map').setView([39.8283, -98.5795], 5);

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
    var minRadius = 3;
    if (!attValue || isNaN(attValue)) return minRadius;
    // For population, use a square root scale for better proportionality, but with a smaller multiplier
    return minRadius + Math.sqrt(attValue) * 0.03;
}

// Step 3: build an attributes array from the data
function processData(data){
    var attributes = [];
    var properties = data.features[0].properties;
    // Use population fields from RustAndSunBelt.geojson
    var desiredAttributes = [
        "USER_F1990", "USER_F1995", "USER_F2000", "USER_F2005",
        "USER_F2010", "USER_F2015", "USER_F2020"
    ];
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
    // Set color by BeltName: Rust Belt = blue, Sun Belt = gold
    var belt = feature.properties.BeltName || "";
    var options = {
        fillColor: (belt.toLowerCase() === "rust belt") ? "#0074D9" : "#FFD700",
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
    // Fancy popup: show city, state, region, year, and population with some styling
    var city = feature.properties.USER_City || "";
    var state = feature.properties.USER_State || "";
    var belt = feature.properties.BeltName || "";
    var year = attribute.replace('USER_F', '');
    var popupContent = `
        <div style="text-align:center;min-width:160px;">
            <div style="font-size:1.2em;font-weight:bold;">${city}, ${state}</div>
            <div style="margin:4px 0 6px 0;font-size:1em;color:#555;">${belt}</div>
            <div style="font-size:1em;"><b>Year:</b> ${year}</div>
            <div style="font-size:1.1em;"><b>Population:</b> ${attValue.toLocaleString ? attValue.toLocaleString() : attValue}</div>
        </div>
    `;
    layer.bindPopup(popupContent, {
        offset: new L.Point(0, -options.radius)
    });
    // Add city name tooltip on hover
    if (city) {
        layer.bindTooltip(city, {direction: 'top', offset: [0, -options.radius-2], className: 'city-tooltip', permanent: false, opacity: 0.95});
    }
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
    // Add fancy filter dropdown, styled and positioned to the right
    var filterDiv = document.createElement('div');
    filterDiv.id = 'belt-filter-container';
    filterDiv.innerHTML = `
        <label for="belt-filter" style="font-weight:bold;font-size:1.1em;letter-spacing:0.5px;">Filter:</label>
        <select id="belt-filter" style="margin-left:8px;padding:6px 18px 6px 8px;border-radius:18px;border:1px solid #0074D9;font-size:1em;background:#f8faff;box-shadow:0 1px 4px rgba(0,0,0,0.07);transition:box-shadow 0.2s;outline:none;">
            <option value="all">All Cities</option>
            <option value="rust">Rust Belt</option>
            <option value="sun">Sun Belt</option>
        </select>
    `;
    // Place filter absolutely to the right
    filterDiv.style.position = 'absolute';
    filterDiv.style.top = '30px';
    filterDiv.style.right = '5%';
    filterDiv.style.zIndex = '1000';
    filterDiv.style.background = 'rgba(255,255,255,0.95)';
    filterDiv.style.padding = '10px 18px 10px 14px';
    filterDiv.style.borderRadius = '22px';
    filterDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    filterDiv.style.border = '1px solid #e0e6ef';
    filterDiv.style.display = 'flex';
    filterDiv.style.alignItems = 'center';
    filterDiv.style.gap = '8px';
    // Add to body so it overlays map/panel
    document.body.appendChild(filterDiv);
    // Remove old filter if present (for hot reloads)
    var oldFilter = document.getElementById('belt-filter-container');
    if (oldFilter && oldFilter !== filterDiv) oldFilter.remove();

    // Add year label
    var yearLabel = document.createElement('div');
    yearLabel.id = 'year-label';
    yearLabel.style.fontWeight = 'bold';
    yearLabel.style.marginBottom = '8px';
    yearLabel.textContent = attributes[0].replace('USER_F', 'Year: ');
    panel.appendChild(yearLabel);

    var slider = "<input class='range-slider' type='range' min='0' max='" + (attributes.length-1) + "' value='0' step='1'></input>";
    panel.insertAdjacentHTML('beforeend',slider);
    panel.insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    panel.insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/LeftArrow.png'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/RightArrow.png'>");

    // Helper to get current filter value
    function getBeltFilter() {
        var val = document.getElementById('belt-filter').value;
        if (val === 'rust') return 'rust';
        if (val === 'sun') return 'sun';
        return 'all';
    }

    // Modified createPropSymbols to filter by belt
    function createFilteredSymbols(index) {
        var filter = getBeltFilter();
        var filteredData = {
            ...data,
            features: data.features.filter(function(f) {
                var belt = (f.properties.BeltName || '').toLowerCase();
                if (filter === 'rust') return belt === 'rust belt';
                if (filter === 'sun') return belt === 'sun belt';
                return true;
            })
        };
        createPropSymbols(filteredData, attributes, index);
    }

    // Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        var index = Number(this.value);
        createFilteredSymbols(index);
        // Update year label
        document.getElementById('year-label').textContent = attributes[index].replace('USER_F', 'Year: ');
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
            createFilteredSymbols(index);
            // Update year label
            document.getElementById('year-label').textContent = attributes[index].replace('USER_F', 'Year: ');
        });
    });

    // Filter dropdown listener
    document.getElementById('belt-filter').addEventListener('change', function() {
        var slider = document.querySelector('.range-slider');
        var index = Number(slider.value);
        createFilteredSymbols(index);
    });

    // Initial render with filter
    createFilteredSymbols(0);
}

// Function to load the data and call createPropSymbols
function getData() {
    fetch("data/RustAndSunBelt.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            var attributes = processData(json);
            createPropSymbols(json, attributes, 0);
            createSequenceControls(attributes, json);
            addLegend();
        })
        .catch(function(error) {
            console.error('Error loading the GeoJSON data:', error);
        });

// Add a legend for Rust Belt (blue) and Sun Belt (gold)
function addLegend() {
    if (document.getElementById('legend')) return;
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        div.id = 'legend';
        div.innerHTML += '<b>City Region</b><br>';
        div.innerHTML += '<i style="background:#0074D9;width:18px;height:18px;display:inline-block;margin-right:6px;border-radius:50%;border:1px solid #000;"></i> Rust Belt<br>';
        div.innerHTML += '<i style="background:#FFD700;width:18px;height:18px;display:inline-block;margin-right:6px;border-radius:50%;border:1px solid #000;"></i> Sun Belt';
        return div;
    };
    legend.addTo(map);
}
}

// Call getData to load and map the data
getData();