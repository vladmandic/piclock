/* global SunCalc, moment */

async function printAstronomy(lat, lon) {
  // eslint-disable-next-line no-console
  console.log('Initializing Astronomy container');
  const div = document.getElementById('div-astronomy');
  const sun = SunCalc.getTimes(new Date(), lat, lon);
  const moon = SunCalc.getMoonTimes(new Date(), lat, lon);
  const pos = SunCalc.getMoonIllumination(new Date());
  const phase = `<span style="display:inline-block;transform:rotate(${(pos.phase <= 0.5) ? 0 : 180}deg);"> ↑ </span>`;
  const time = (date) => moment(date).format('HH:mm');
  div.innerHTML = `
    <span class="astronomy">Dawn: ${time(sun.dawn)}<br>Sunrise: ${time(sun.sunrise)}<br>Noon: ${time(sun.solarNoon)}</span>
    <span class="astronomy">Golden Hour: ${time(sun.goldenHour)}<br>Sunset: ${time(sun.sunsetStart)}<br>Dusk: ${time(sun.dusk)}<br>Night: ${time(sun.night)}</span>
    <span class="astronomy">Moonrise: ${time(moon.rise)}<br>Moonset: ${time(moon.set)}<br>Phase: ${Math.round(100 * (1 - 2 * Math.abs(0.5 - pos.phase)))}% ${phase}</span>
  `;
}

async function locateGPS() {
  // eslint-disable-next-line no-console
  console.log('Initializing GPS lookup');
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: 'No navigator object' });
    } else {
      navigator.geolocation.getCurrentPosition(
        (gps) => resolve(gps.coords),
        (err) => resolve({ error: err.message }),
        { enableHighAccuracy: true },
      );
    }
  });
}

async function lookupIP() {
  // eslint-disable-next-line no-console
  console.log('Initializing IP lookup');
  const res = await fetch('/api/geoip');
  const data = await res.json();
  if (data) printAstronomy(data.lat, data.lon);
  if (data.ext) document.getElementById('div-ip').innerHTML = `IP: Reported ${data.ip} &nbsp Actual ${data.ext}`;
  if (data.country) document.getElementById('div-geoip').innerHTML = `GeoIP: ${data.country}/${data.city} &nbsp | &nbsp Lat ${Math.round(100 * data.lat) / 100}° Lon ${Math.round(100 * data.lon) / 100}° ~${Math.round(data.accuracy)}km`;
  if (data.asn) document.getElementById('div-asn').innerHTML = `ASN: ${data.asn}`;
  if (data.agent) document.getElementById('div-agent').innerHTML = `Agent: ${data.agent}<br>Device: ${data.device}`;
  if (data.address) document.getElementById('div-addressIP').innerHTML = `IP Address: ${data.address.formattedAddress}<br>Area: ${data.address.locality}`;
}

async function lookupGPS() {
  const gps = await locateGPS();
  if (gps.error) {
    document.getElementById('div-gps').innerHTML = `GPS Error ${gps.error}`;
    return;
  }
  document.getElementById('div-gps').innerHTML = `
    GPS: Lat ${Math.round(1000 * gps.latitude) / 1000}° &nbsp Lon ${Math.round(1000 * gps.longitude) / 1000}° &nbsp ~${Math.round(gps.accuracy)}m &nbsp | &nbsp Speed: ${Math.round(gps.speed || 0)}m/s &nbsp | &nbsp Heading: ${Math.round(gps.heading || 0)}°
  `;
  const headers = { lat: gps.latitude || 0, lon: gps.longitude };
  const res = await fetch('/api/geoip', { headers });
  const data = await res.json();
  if (data) printAstronomy(data.lat, data.lon);
  if (data.address) document.getElementById('div-addressGPS').innerHTML = `GPS Address: ${data.address.formattedAddress}<br>Area: ${data.address.locality}`;
}

async function connection() {
  if (!navigator || !navigator.connection) return;
  document.getElementById('div-connection').innerHTML = `Connection: ${navigator.connection.type} | Speed: ${navigator.connection.downlink} Mbps`;
}

window.lookupIP = lookupIP;
window.lookupGPS = lookupGPS;
window.connection = connection;
