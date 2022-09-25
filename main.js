mapboxgl.accessToken =
  "pk.eyJ1Ijoic2F5YXRyYXlrdWwiLCJhIjoiY2w4ZjJhZDRiMGd0czN2cDkxM2tsa25rYyJ9.Jpj-7r5LgZEh9idqAdM0lw";

const map = new mapboxgl.Map({
  container: "map",
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  style: "mapbox://styles/mapbox/streets-v11",
  center: [71.4, 51.13],
  zoom: 15,
  projection: "globe",
});

map.addControl(new mapboxgl.NavigationControl());

const STATES = {
  STAY: "./images/stay.png",
  WALK: "./images/walk.png",
  SWIM: "./images/swim.png",
  BIKE: "./images/bike.png",
  CAR: "./images/car.png",
};
/// mapbox geolocation
const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
  },
  trackUserLocation: true,
});
// Add the control to the map.
map.addControl(geolocate);
// Set an event listener that fires
// when a geolocate event occurs.

let coordData = [];
let lastData = null;
let moveData = [];
// geolocate.on("geolocate", locate);?

// setInterval(locate, 2000);


function locate(){
  const { coords, timestamp } = geolocate._lastKnownPosition;
  if (lastData) {
    const deltaS = measure(
      coords.latitude,
      coords.longitude,
      lastData.coords.latitude,
      lastData.coords.longitude
    );
    const deltaT = (timestamp - lastData.timestamp) / 1000;
    const deltaV = (deltaS / deltaT) | 0;

    let date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    if (minutes < 10) minutes = "0" + minutes;
    let seconds = date.getSeconds();
    if (seconds < 10) seconds = "0" + seconds;
    let formattedTime = hours + ":" + minutes + ":" + seconds;
    let t_sum = 0,
      v_sum = 0,
      s_sum = 0;
    for (let { t, s, v } of moveData) {
      t_sum += t;
      s_sum += s;
      v_sum += v;
    }

    const t_avg = t_sum / moveData.length;
    const s_avg = s_sum / moveData.length;
    const v_avg = v_sum / moveData.length;

    document.getElementById("updated").innerText = formattedTime;
    document.getElementById("t").innerText = deltaT.toFixed(2) | 0;
    document.getElementById("s").innerText = deltaS.toFixed(2) | 0;
    document.getElementById("v").innerText = deltaV.toFixed(2) | 0;
    document.getElementById("t_avg").innerText = t_avg.toFixed(2) | 0;
    document.getElementById("s_avg").innerText = s_avg.toFixed(2) | 0;
    document.getElementById("v_avg").innerText = v_avg.toFixed(2) | 0;

    setState(deltaV);

    moveData.push({
      t: deltaT,
      s: deltaS,
      v: deltaV,
      t_avg: t_avg,
      s_avg: s_avg,
      v_avg: v_avg,
    });

    

    // if (moveData.length > 10) moveData.unshift();
  }
  lastData = { timestamp: timestamp, coords: coords };
  coordData.push(lastData);
}

const state = document.querySelector("#state>img");
state.src = STATES.STAY
function setState(v) {
  if (v === 0) state.src = STATES.STAY;
  else if (v < 2) state.src = STATES.WALK;
  else if (v < 10) state.src = STATES.BIKE;
  else state.src = STATES.CAR;
}

// when an outofmaxbounds event occurs.
geolocate.on("outofmaxbounds", () => {
  console.log("An outofmaxbounds event has occurred.");
});

// when an error event occurs.
geolocate.on("error", () => {
  console.log("An error event has occurred.");
});

// when a trackuserlocationstart event occurs.
geolocate.on("trackuserlocationstart", () => {
  console.log("A trackuserlocationstart event has occurred.");
});

// when a trackuserlocationend event occurs.
geolocate.on("trackuserlocationend", () => {
  console.log("A trackuserlocationend event has occurred.");
});

function measure(lat1, lon1, lat2, lon2) {
  // generally used geo measurement function
  var R = 6378.137; // Radius of earth in KM
  var dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
  var dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180;
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d * 1000; // meters
}

/// end mapbox geolocation

map.on("load", () => {
  // trigger geolocate

  geolocate.trigger();

  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === "symbol" && layer.layout["text-field"]
  ).id;

  // The 'building' layer in the Mapbox Streets
  // vector tileset contains building height data
  // from OpenStreetMap.
  map.addLayer(
    {
      id: "add-3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#aaa",

        // Use an 'interpolate' expression to
        // add a smooth transition effect to
        // the buildings as the user zooms in.
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.6,
      },
    },
    labelLayerId
  );

  // Add a new vector tile source with ID 'mapillary'.
  map.addSource("mapillary", {
    type: "vector",
    tiles: [
      "https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=MLY|4142433049200173|72206abe5035850d6743b23a49c41333",
    ],
    minzoom: 6,
    maxzoom: 14,
  });
  map.addLayer(
    {
      id: "mapillary", // Layer ID
      type: "line",
      source: "mapillary", // ID of the tile source created above
      // Source has several layers. We visualize the one with name 'sequence'.
      "source-layer": "sequence",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-opacity": 0.6,
        "line-color": "rgb(53, 175, 109)",
        "line-width": 2,
      },
    },
    "road-label" // Arrange our new layer beneath this layer
  );
});

let cursors = [];

map.on("click", (ev) => {
  ev.preventDefault();
  const { lng, lat } = ev.lngLat;
  const marker = new mapboxgl.Marker({
    draggable: true,
  })
    .setLngLat([lng, lat])
    .addTo(map);
  cursors.push(marker);
});

map.on("contextmenu", (ev) => {
  ev.preventDefault();
  const { x, y } = ev.point;

  for (let i in cursors) {
    const pos = cursors[i]._pos;
    if (Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2) < 500) {
      cursors[i].remove();
    }
  }
});

/* Given a query in the form "lng, lat" or "lat, lng"
 * returns the matching geographic coordinate(s)
 * as search results in carmen geojson format,
 * https://github.com/mapbox/carmen/blob/master/carmen-geojson.md */
const coordinatesGeocoder = function (query) {
  // Match anything which looks like
  // decimal degrees coordinate pair.
  const matches = query.match(
    /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
  );
  if (!matches) {
    return null;
  }

  function coordinateFeature(lng, lat) {
    return {
      center: [lng, lat],
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
      place_name: "Lat: " + lat + " Lng: " + lng,
      place_type: ["coordinate"],
      properties: {},
      type: "Feature",
    };
  }

  const coord1 = Number(matches[1]);
  const coord2 = Number(matches[2]);
  const geocodes = [];

  if (coord1 < -90 || coord1 > 90) {
    // must be lng, lat
    geocodes.push(coordinateFeature(coord1, coord2));
  }

  if (coord2 < -90 || coord2 > 90) {
    // must be lat, lng
    geocodes.push(coordinateFeature(coord2, coord1));
  }

  if (geocodes.length === 0) {
    // else could be either lng, lat or lat, lng
    geocodes.push(coordinateFeature(coord1, coord2));
    geocodes.push(coordinateFeature(coord2, coord1));
  }

  return geocodes;
};

// Add the control to the map.
map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    localGeocoder: coordinatesGeocoder,
    zoom: 4,
    mapboxgl: mapboxgl,
    reverseGeocode: true,
  })
);
