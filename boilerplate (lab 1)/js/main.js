// Job Opportunities Map
// This script loads JobsData.json, maps each job as a red circle marker, and shows jobs in current map view

// Initialize the map centered globally
var map = L.map('map').setView([39.8283, -98.5795], 5);

// Add OpenStreetMap tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, // Maximum zoom level for the map
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' // Required attribution
}).addTo(map);

// Define marker options for the job points
var defaultMarkerOptions = {
  radius: 8, // Increased radius to make markers more visible
  fillColor: "#FF0000", // Default: Red color
  color: "#000000", // Black border
  weight: 1,
  opacity: 1,
  fillOpacity: 0.9
};

// Define state-specific colors for markers
var stateColors = {
  "IL": "#FFFF00", // Illinois - Yellow
  "WI": "#0066FF", // Wisconsin - Blue
  "TX": "#800000", // Texas - Maroon
  "FL": "#00FFFF"  // Florida - Cyan/Teal
};

// Initialize global variables to store job data and layer
var jobData = null;
var jobPoints = null;

// Function to create a job list item HTML
function createJobListItem(feature) {
  var props = feature.properties;
  var salary = props.StartingSalary ? '$' + props.StartingSalary.toLocaleString() : 'Not specified';
  
  return `
    <div class="job-item">
      <h3 class="job-title">${props.Position_Title || 'Job Position'}</h3>
      <div class="job-company">${props.Brand || 'Company Not Specified'}</div>
      <div class="job-location">${props.City || 'N/A'}, ${props.State || 'N/A'} • ${props.JobType || 'Not specified'}</div>
      <div class="job-salary">Salary: ${salary}</div>
      ${props.LINK ? 
        `<a href="${props.LINK}" target="_blank" class="job-link">Apply Now</a>` : ''}
    </div>
  `;
}

// Global variables for filters
var activeFilters = {
  state: '',
  jobType: '',
  salary: 40000 // Default minimum salary filter
};

// Function to populate state filter dropdown
function populateStateFilter(data) {
  if (!data) return;
  
  var states = {};
  
  // Collect all unique states
  data.features.forEach(function(feature) {
    if (feature.properties && feature.properties.State) {
      states[feature.properties.State] = true;
    }
  });
  
  // Get states as sorted array
  var stateList = Object.keys(states).sort();
  
  // Get the state filter dropdown
  var stateFilter = document.getElementById('state-filter');
  
  // Add state options
  stateList.forEach(function(state) {
    var option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    stateFilter.appendChild(option);
  });
  
  // Add event listener for state filter changes
  stateFilter.addEventListener('change', function() {
    activeFilters.state = this.value;
    filterAndUpdateMap();
  });
  
  // Add event listener for job type filter changes
  var jobTypeFilter = document.getElementById('job-type-filter');
  jobTypeFilter.addEventListener('change', function() {
    activeFilters.jobType = this.value;
    filterAndUpdateMap();
  });
  
  // Add event listener for salary filter
  var salaryFilter = document.getElementById('salary-filter');
  var salaryMinDisplay = document.getElementById('salary-min-display');
  
  // Initialize the salary display
  salaryMinDisplay.textContent = formatSalary(salaryFilter.value);
  
  salaryFilter.addEventListener('input', function() {
    activeFilters.salary = parseInt(this.value);
    salaryMinDisplay.textContent = formatSalary(this.value);
    filterAndUpdateMap();
  });
  
  // Function to format salary for display
  function formatSalary(salary) {
    var salaryNum = parseInt(salary);
    if (salaryNum >= 1000000) {
      return '$' + (salaryNum / 1000000).toFixed(1) + 'M';
    } else if (salaryNum >= 1000) {
      return '$' + (salaryNum / 1000).toFixed(0) + 'k';
    } else {
      return '$' + salaryNum;
    }
  }
  
  // Add event listener for clear filters button
  document.getElementById('clear-filters').addEventListener('click', function() {
    // Reset all filters
    document.getElementById('state-filter').value = '';
    document.getElementById('job-type-filter').value = '';
    document.getElementById('salary-filter').value = 40000;
    salaryMinDisplay.textContent = formatSalary(40000);
    activeFilters.state = '';
    activeFilters.jobType = '';
    activeFilters.salary = 40000;
    filterAndUpdateMap();
  });
}

// Function to filter jobs based on active filters and update the map
function filterAndUpdateMap() {
  if (!jobData) return;
  
  // Show all markers first
  jobPoints.eachLayer(function(layer) {
    layer.addTo(map);
  });
  
  // If no filters are active (except the default salary filter), just update jobs in view
  if (!activeFilters.state && !activeFilters.jobType && activeFilters.salary === 40000) {
    updateJobsInView();
    return;
  }
  
  // Filter markers based on active filters
  jobPoints.eachLayer(function(layer) {
    var show = true;
    
    // Check if this marker contains any jobs that match the active filters
    if ((activeFilters.state || activeFilters.jobType || activeFilters.salary > 40000) && layer.jobFeatures) {
      show = layer.jobFeatures.some(function(feature) {
        // Check state filter
        var matchesState = !activeFilters.state || feature.properties.State === activeFilters.state;
        
        // Check job type filter
        var matchesJobType = !activeFilters.jobType || feature.properties.JobType === activeFilters.jobType;
        
        // Check salary filter
        var matchesSalary = feature.properties.StartingSalary >= activeFilters.salary;
        
        // Return true if job matches all active filters
        return matchesState && matchesJobType && matchesSalary;
      });
    }
    
    // Show/hide the marker
    if (show) {
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  });
  
  // Update the job listing panel
  updateJobsInView();
}

// Function to update the job listing panel based on current map view
function updateJobsInView() {
  if (!jobData) return;
  
  var bounds = map.getBounds();
  var jobsInView = [];
  
  // Filter jobs that are within current map view and match active filters
  jobData.features.forEach(function(feature) {
    var coords = feature.geometry.coordinates;
    var latlng = L.latLng(coords[1], coords[0]); // [lng, lat] to [lat, lng]
    
    // Check if job is in current map view
    var isInView = bounds.contains(latlng);
    
    // Check if job matches state filter
    var matchesStateFilter = !activeFilters.state || feature.properties.State === activeFilters.state;
    
    // Check if job matches job type filter
    var matchesJobTypeFilter = !activeFilters.jobType || feature.properties.JobType === activeFilters.jobType;
    
    // Check if job matches salary filter
    var matchesSalaryFilter = feature.properties.StartingSalary >= activeFilters.salary;
    
    if (isInView && matchesStateFilter && matchesJobTypeFilter && matchesSalaryFilter) {
      jobsInView.push(feature);
    }
  });
  
  // Get the panel element
  var panel = document.getElementById('panel');
  
  // Clear previous content
  panel.innerHTML = '';
  
  // Add title to the panel
  var titleElem = document.createElement('h2');
  titleElem.id = 'job-list-title';
  titleElem.textContent = 'Jobs in Current View';
  panel.appendChild(titleElem);
  
  // Add job count
  var countElem = document.createElement('p');
  countElem.textContent = `Found ${jobsInView.length} job${jobsInView.length !== 1 ? 's' : ''}`;
  countElem.style.margin = "0 0 10px 0";
  countElem.style.fontSize = "0.9em";
  panel.appendChild(countElem);
  
  // Display jobs or a message if no jobs are found
  if (jobsInView.length > 0) {
    // Create job list container
    var jobListContainer = document.createElement('div');
    jobListContainer.id = 'job-list-container';
    
    // Add each job to the list
    jobsInView.forEach(function(feature) {
      var jobItemHTML = createJobListItem(feature);
      jobListContainer.innerHTML += jobItemHTML;
    });
    
    panel.appendChild(jobListContainer);
  } else {
    // Display message when no jobs are in view
    var noJobsElem = document.createElement('div');
    noJobsElem.className = 'no-jobs';
    noJobsElem.innerHTML = '<p>No jobs found in the current map view.</p><p>Try zooming out or panning to another area.</p>';
    panel.appendChild(noJobsElem);
  }
}

// Function to create a popup for a single job
function createSingleJobPopup(props) {
  return `
    <div style="font-family:Arial,sans-serif;min-width:200px;">
      <h3 style="margin:0 0 8px 0;color:#d32f2f;border-bottom:1px solid #eee;padding-bottom:5px;">
        ${props.Position_Title || 'Job Position'}
      </h3>
      <p style="margin:5px 0;"><strong>Company:</strong> ${props.Brand || 'N/A'}</p>
      <p style="margin:5px 0;"><strong>Location:</strong> ${props.City || 'N/A'}, ${props.State || 'N/A'}</p>
      <p style="margin:5px 0;"><strong>Job Type:</strong> ${props.JobType || 'N/A'}</p>
      <p style="margin:5px 0;"><strong>Salary:</strong> $${props.StartingSalary ? props.StartingSalary.toLocaleString() : 'N/A'}</p>
      ${props.LINK ? 
        `<a href="${props.LINK}" target="_blank" style="display:block;margin-top:8px;background:#d32f2f;color:white;padding:5px 10px;text-align:center;text-decoration:none;border-radius:3px;">Apply Now</a>` : ''}
    </div>
  `;
}

// Function to create a popup for multiple jobs at the same location
function createMultiJobPopup(features) {
  // Filter features based on active filters
  var displayFeatures = features;
  
  // Apply filters if any are active
  if (activeFilters.state || activeFilters.jobType || activeFilters.salary > 40000) {
    displayFeatures = features.filter(function(feature) {
      // Check state filter
      var matchesState = !activeFilters.state || feature.properties.State === activeFilters.state;
      
      // Check job type filter
      var matchesJobType = !activeFilters.jobType || feature.properties.JobType === activeFilters.jobType;
      
      // Check salary filter
      var matchesSalary = feature.properties.StartingSalary >= activeFilters.salary;
      
      return matchesState && matchesJobType && matchesSalary;
    });
  }
  
  // IMPORTANT: We're removing this fallback to ensure only filtered jobs show up
  // If no jobs match the filter, the popup will only show matching jobs
  // if (displayFeatures.length === 0) {
  //   displayFeatures = features;
  // }
  
  // Start building the popup content
  var content = `
    <div style="font-family:Arial,sans-serif;max-width:400px;max-height:400px;overflow-y:auto;">`;
    
  // If no jobs match the current filters, show a message
  if (displayFeatures.length === 0) {
    content += `
      <h3 style="margin:0 0 8px 0;color:#333;border-bottom:2px solid #eee;padding-bottom:5px;">
        No Jobs Match Your Filters
      </h3>
      <p style="text-align:center;margin:15px 0;color:#666;">
        There are ${features.length} job${features.length !== 1 ? 's' : ''} at this location, but none match your current filter criteria.
      </p>
      <p style="text-align:center;color:#666;">
        Try adjusting your filters to see these jobs.
      </p>`;
  } else {
    content += `
      <h3 style="margin:0 0 8px 0;color:#d32f2f;border-bottom:2px solid #eee;padding-bottom:5px;">
        ${displayFeatures.length} Job${displayFeatures.length !== 1 ? 's' : ''} at this Location
      </h3>`;
  }
  
  displayFeatures.forEach(function(feature, index) {
    var props = feature.properties;
    content += `
      <div style="margin-bottom:${index < displayFeatures.length-1 ? '15px' : '5px'};padding-bottom:${index < displayFeatures.length-1 ? '15px' : '0'};${index < displayFeatures.length-1 ? 'border-bottom:1px solid #eee;' : ''}">
        <h4 style="margin:0 0 5px 0;color:#d32f2f;">
          ${props.Position_Title || 'Job Position'}
        </h4>
        <p style="margin:3px 0;"><strong>Company:</strong> ${props.Brand || 'N/A'}</p>
        <p style="margin:3px 0;"><strong>Job Type:</strong> ${props.JobType || 'N/A'}</p>
        <p style="margin:3px 0;"><strong>Salary:</strong> $${props.StartingSalary ? props.StartingSalary.toLocaleString() : 'N/A'}</p>
        <p style="margin:3px 0;"><strong>Location:</strong> ${props.City || 'N/A'}, ${props.State || 'N/A'}</p>
        ${props.LINK ? 
          `<a href="${props.LINK}" target="_blank" style="display:inline-block;margin-top:5px;background:#d32f2f;color:white;padding:3px 8px;text-align:center;text-decoration:none;border-radius:2px;font-size:0.9em;">Apply Now</a>` : ''}
      </div>`;
  });
  
  content += `</div>`;
  return content;
}

// Load and display points from JobsData.json (complete dataset)
console.log('Loading job data points...');
fetch('data/JobsData.json')
  .then(response => {
    console.log('GeoJSON response received');
    return response.json();
  })
  .then(data => {
    console.log('GeoJSON data parsed, features:', data.features.length);
    // Store job data globally
    jobData = data;
    
    // Group jobs by coordinates
    var jobsByLocation = {};
    
    data.features.forEach(function(feature) {
      // Create a key from the coordinates
      var coords = feature.geometry.coordinates;
      var coordKey = coords[0].toFixed(6) + ',' + coords[1].toFixed(6);
      
      // Initialize array if this is the first job at these coordinates
      if (!jobsByLocation[coordKey]) {
        jobsByLocation[coordKey] = {
          latlng: L.latLng(coords[1], coords[0]),
          features: []
        };
      }
      
      // Add this job to the array for these coordinates
      jobsByLocation[coordKey].features.push(feature);
    });
    
    // Now create markers for each location (potentially with multiple jobs)
    jobPoints = L.featureGroup().addTo(map);
    
    // For each unique location, add a marker
    for (var coordKey in jobsByLocation) {
      var locationInfo = jobsByLocation[coordKey];
      
      // Determine marker color based on state
      var state = locationInfo.features[0].properties.State;
      
      // Create marker options with appropriate color
      var markerOptions = Object.assign({}, defaultMarkerOptions);
      if (stateColors[state]) {
        markerOptions.fillColor = stateColors[state];
      }
      
      var marker = L.circleMarker(locationInfo.latlng, markerOptions);
      
      // Store job features with the marker for filtering
      marker.jobFeatures = locationInfo.features;
      
      // Create a proper closure to capture the current locationInfo for this marker
      (function(capturedLocationInfo) {
        // For both single and multi-job locations, we'll generate popup content dynamically
        // This allows us to apply filters properly when the popup is opened
        marker.bindPopup(function() {
          // If there's only one job at this location
          if (capturedLocationInfo.features.length === 1) {
            var feature = capturedLocationInfo.features[0];
            
            // Check if this job should be displayed based on current filters
            var matchesState = !activeFilters.state || feature.properties.State === activeFilters.state;
            var matchesJobType = !activeFilters.jobType || feature.properties.JobType === activeFilters.jobType;
            var matchesSalary = feature.properties.StartingSalary >= activeFilters.salary;
            
            if (matchesState && matchesJobType && matchesSalary) {
              return createSingleJobPopup(feature.properties);
            } else {
              return `<div style="padding:10px;text-align:center;">No jobs match your current filters.</div>`;
            }
          } 
          // If there are multiple jobs, create a popup with filtered jobs
          else {
            return createMultiJobPopup(capturedLocationInfo.features);
          }
        }, {
          maxWidth: 400
        });
      })(locationInfo);
      
      // For tooltips, we'll also use a closure to ensure correct data
      (function(capturedLocationInfo) {
        if (capturedLocationInfo.features.length === 1) {
          var feature = capturedLocationInfo.features[0];
          if (feature.properties.Position_Title) {
            marker.bindTooltip(feature.properties.Position_Title, {
              direction: 'top',
              offset: [0, -10],
              permanent: false,
              opacity: 0.9
            });
          }
        } else {
          marker.bindTooltip(`${capturedLocationInfo.features.length} jobs at this location`, {
            direction: 'top',
            offset: [0, -10],
            permanent: false,
            opacity: 0.9
          });
        }
      })(locationInfo);
      
      jobPoints.addLayer(marker);
    }
    
    // Populate filter dropdowns
    populateStateFilter(data);
    
    // Initial update of jobs in the current view
    updateJobsInView();
    
    // Add event listeners to update job listing when map view changes
    map.on('moveend', updateJobsInView);
    map.on('zoomend', updateJobsInView);
    
    // Adjust the map view to fit all points
    map.fitBounds(jobPoints.getBounds(), { padding: [20, 20] });
    
    // Initial update of jobs in the current view
    updateJobsInView();
    
    // Add event listeners to update job listing when map view changes
    map.on('moveend', updateJobsInView);
    map.on('zoomend', updateJobsInView);
    
    // Create a legend for the map
    var legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '12px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      div.style.fontSize = '12px';
      div.style.fontFamily = 'Arial, sans-serif';
      div.style.lineHeight = '1.5';
      
      div.innerHTML = '<h4 style="margin:0 0 10px 0;font-size:14px;border-bottom:1px solid #ccc;padding-bottom:5px;text-align:center;">Job Locations by State</h4>';
      
      // Add legend items for specific states with full state names
      var stateFullNames = {
        "IL": "Illinois",
        "WI": "Wisconsin",
        "TX": "Texas",
        "FL": "Florida"
      };
      
      // Define colors for the legend - same as marker colors
      var colorMap = [
        { state: "IL", color: "#FFFF00", name: "Illinois" },
        { state: "WI", color: "#0066FF", name: "Wisconsin" },
        { state: "TX", color: "#800000", name: "Texas" },
        { state: "FL", color: "#00FFFF", name: "Florida" }
      ];
      
      // Add legend items for specific states
      colorMap.forEach(function(item) {
        div.innerHTML += 
          '<div style="margin-bottom:6px;display:flex;align-items:center;">' + 
            '<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background-color:' + item.color + 
            ';border:1px solid #000;margin-right:8px;"></span>' +
            '<span>' + item.name + ' <small style="color:#666;">(' + item.state + ')</small></span>' + 
          '</div>';
      });
      
      return div;
    };
    
    legend.addTo(map);
    
    // Adjust the map view to fit all points
    map.fitBounds(jobPoints.getBounds(), { padding: [20, 20] });
  })
  .catch(error => console.error('Error loading GeoJSON data:', error));