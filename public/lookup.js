/* global SunCalc, moment */

async function printAstronomy(lat, lon) {
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

async function lookup() {
  const gps = await locateGPS();
  let headers = {};
  if (!gps.error) {
    headers = { lat: gps.latitude || 0, lon: gps.longitude || 0 };
    printAstronomy(gps.latitude, gps.longitude);
    document.getElementById('div-gps').innerHTML = `
      GPS: Lat ${Math.round(1000 * gps.latitude) / 1000}° &nbsp Lon ${Math.round(1000 * gps.longitude) / 1000}° &nbsp ~${Math.round(gps.accuracy)}m &nbsp | &nbsp Speed: ${Math.round(gps.speed || 0)}m/s &nbsp | &nbsp Heading: ${Math.round(gps.heading || 0)}°
    `;
  } else {
    document.getElementById('div-gps').innerHTML = `
      GPS Error ${gps.error}
    `;
  }
  const res = await fetch('/api/geoip', { headers });
  const data = await res.json();
  if (data) printAstronomy(data.lat, data.lon);
  if (data.ext) document.getElementById('div-ip').innerHTML = `IP: Reported ${data.ip} &nbsp Actual ${data.ext}`;
  if (data.asn) document.getElementById('div-asn').innerHTML = `ASN: ${data.asn}`;
  if (data.country) document.getElementById('div-geoip').innerHTML = `GeoIP: ${data.country}/${data.city} &nbsp | &nbsp Lat ${Math.round(100 * data.lat) / 100}° Lon ${Math.round(100 * data.lon) / 100}° ~${Math.round(data.accuracy)}km`;
  if (data.agent) document.getElementById('div-agent').innerHTML = `Agent: ${data.agent.family} ${data.agent.major} &nbsp | &nbsp OS: ${data.agent.os.family} ${data.agent.os.major} &nbsp | &nbsp Device: ${data.agent.device.family}`;
  if (data.address) document.getElementById('div-address').innerHTML = `Address: ${data.address.formattedAddress} | Area: ${data.address.locality}`;
}

window.loopup = lookup;
