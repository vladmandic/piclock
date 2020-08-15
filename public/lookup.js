/* global SunCalc, moment */

async function printAstronomy(lat, lon) {
  // eslint-disable-next-line no-console
  console.log('InitAstronomy', lat, lon);
  const div = document.getElementById('div-astronomy');
  const dt = new Date();
  const sun = SunCalc.getTimes(dt, lat || 0, lon || 0);
  const moon = SunCalc.getMoonTimes(dt, lat || 0, lon || 0);
  const pos = SunCalc.getMoonIllumination(dt);
  const phase = `<span style="display:inline-block;transform:rotate(${(pos.phase <= 0.5) ? 0 : 180}deg);"> ↑ </span>`;
  const time = (date) => moment(date).format('HH:mm');
  div.innerHTML = `
    <span class="astronomy">Dawn: ${time(sun.dawn)}<br>Sunrise: ${time(sun.sunrise)}<br>Noon: ${time(sun.solarNoon)}</span>
    <span class="astronomy">Golden Hour: ${time(sun.goldenHour)}<br>Sunset: ${time(sun.sunsetStart)}<br>Dusk: ${time(sun.dusk)}<br>Night: ${time(sun.night)}</span>
    <span class="astronomy">Moonrise: ${time(moon.rise)}<br>Moonset: ${time(moon.set)}<br>Phase: ${Math.round(100 * (1 - 2 * Math.abs(0.5 - pos.phase)))}% ${phase}</span>
  `;
}

async function locateGPS() {
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
  const res = await fetch('/api/geoip');
  const data = await res.json();
  // eslint-disable-next-line no-console
  console.log('LookupIP', res.status, data || 'no data received');
  if (!data) {
    document.getElementById('div-error').innerHTML = `Error: No data received | code: ${res.status}`;
    return;
  }
  printAstronomy(data.lat, data.lon);
  document.getElementById('div-ip').innerHTML = `IP: Reported ${data.ip} &nbsp Actual ${data.ext}`;
  document.getElementById('div-geoip').innerHTML = `GeoIP: ${data.country}/${data.city} &nbsp | &nbsp Lat ${Math.round(100 * data.lat) / 100}° Lon ${Math.round(100 * data.lon) / 100}° ~${Math.round(data.accuracy)}km`;
  document.getElementById('div-asn').innerHTML = `ASN: ${data.asn || 'unknown provider'}`;
  document.getElementById('div-agent').innerHTML = `Agent: ${data.agent} &nbsp | &nbsp Device: ${data.device}`;
  if (data.address) document.getElementById('div-addressIP').innerHTML = `IP Address: ${data.address.formattedAddress || 'unknown'} &nbsp | &nbsp Area: ${data.address.locality || 'unknown'}`;
}

async function lookupGPS() {
  const gps = await locateGPS();
  if (gps.error) {
    document.getElementById('div-gps').innerHTML = `GPS Error: ${gps.error}`;
    return;
  }
  document.getElementById('div-gps').innerHTML = `
    GPS: Lat ${Math.round(1000 * gps.latitude) / 1000}° &nbsp Lon ${Math.round(1000 * gps.longitude) / 1000}° &nbsp ~${Math.round(gps.accuracy)}m &nbsp | &nbsp
    Speed: ${Math.round(gps.speed || 0)}m/s &nbsp | &nbsp 
    Heading: ${Math.round(gps.heading || 0)}°
  `;
  const headers = { lat: gps.latitude || 0, lon: gps.longitude };
  const res = await fetch('/api/geoip', { headers });
  const data = await res.json();
  // eslint-disable-next-line no-console
  console.log('LookupGPS', gps, data);
  if (data && data.lat && data.lon) printAstronomy(data.lat, data.lon);
  if (data.address) document.getElementById('div-addressGPS').innerHTML = `GPS Address: ${data.address.formattedAddress || 'unknown'}<br>Area: ${data.address.locality || 'unknown'}`;
}

async function lookupConn() {
  const conn = navigator ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection || {}) : null;
  // eslint-disable-next-line no-console
  console.log('LookupConn', conn);
  if (!conn) return;
  document.getElementById('div-connection').innerHTML = ((conn.type && conn.type !== 'unknown') ? `Connection: ${conn.type} | ` : '') + (conn.downlink ? `Autodetected speed: ${conn.downlink} Mbps` : '');
}

async function main() {
  lookupIP();
  lookupConn();
  document.addEventListener('click', () => {
    lookupGPS();
  });
  document.addEventListener('mousemove', (event) => {
    const percX = Math.round(100 * event.pageX / window.innerWidth);
    const percY = Math.round(100 * event.pageY / window.innerHeight);
    document.body.style.background = `radial-gradient(at ${percX}% ${percY}%, #222222 0, black 50%, black 100%)`;
  });
}

window.addEventListener('load', () => main());
