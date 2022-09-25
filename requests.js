const PROFILES = {
  DRIVING_TRAFFIC: "mapbox/driving-traffic",
  DRIVING: "mapbox/driving",
  WALKING: "mapbox/walking",
  CYCLING: "mapbox/cycling",
};

function directions(profile, coords) {
  let url = `https://api.mapbox.com/directions/v5/${profile}/`;

  for (let i in coords) {
    const [x, y] = coords[i];
    url += `${x},${y}`;
    
    if(i < coords.length -1)
     url += ';'
  }

  url +=
    "?alternatives=true&continue_straight=true&geometries=polyline&language=kz&overview=full&steps=true&access_token=pk.eyJ1Ijoic2F5YXRyYXlrdWwiLCJhIjoiY2w4ZjJhZDRiMGd0czN2cDkxM2tsa25rYyJ9.Jpj-7r5LgZEh9idqAdM0lw"
  console.log(url);

  fetch(url).then(response => response.json()).then(result=>console.log(result))
}