// @ts-nocheck
/* global SunCalc */

async function printAstronomy(lat, lon) {
  // eslint-disable-next-line no-console
  console.log('InitAstronomy', lat, lon);
  const div = document.getElementById('div-astronomy');
  const dt = new Date();
  const sun = SunCalc.getTimes(dt, lat || 0, lon || 0);
  const moon = SunCalc.getMoonTimes(dt, lat || 0, lon || 0);
  const pos = SunCalc.getMoonIllumination(dt);
  const phase = `<span style="display:inline-block;transform:rotate(${(pos.phase <= 0.5) ? 0 : 180}deg);"> ↑ </span>`;
  const time = (date) => `${new Date(date).getHours().toString().padStart(2, '0')}:${new Date(date).getMinutes().toString().padStart(2, '0')}`;
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
  const address = data.address ? JSON.parse(decodeURI(data.address)) : { formattedAddress: 'unknown', locality: 'unknown' };
  document.getElementById('div-addressIP').innerHTML = `IP Address: ${address.formattedAddress} &nbsp | &nbsp Area: ${address.locality}`;
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
  const address = data.address ? JSON.parse(decodeURI(data.address)) : { formattedAddress: 'unknown', locality: 'unknown' };
  document.getElementById('div-addressGPS').innerHTML = `GPS Address: ${address.formattedAddress || 'unknown'}<br>Area: ${address.locality || 'unknown'}`;
}

async function lookupConn() {
  const conn = navigator ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection || {}) : null;
  // eslint-disable-next-line no-console
  console.log('LookupConn', conn || 'unknown');
  if (!conn) return;
  document.getElementById('div-connection').innerHTML = ((conn.type && conn.type !== 'unknown') ? `Connection: ${conn.type} | ` : '') + (conn.downlink ? `Autodetected speed: ${conn.downlink} Mbps` : '');
}

let last = new Date(0);

function updateNumber(element, number) {
  const second = element.lastElementChild.cloneNode(true);
  second.textContent = number;
  element.classList.add('clock-move');
  element.appendChild(second);
  setTimeout(() => {
    element.classList.remove('clock-move');
    element.removeChild(element.firstElementChild);
  }, 750);
}

function updateContainer(container, time) {
  const s = time.toString().padStart(2, '0').split('');
  const first = container.firstElementChild;
  if (first.lastElementChild.textContent !== s[0]) updateNumber(first, s[0]);
  const second = container.lastElementChild;
  if (second.lastElementChild.textContent !== s[1]) updateNumber(second, s[1]);
}

function updateTime() {
  const now = new Date();
  if (last.getHours() !== now.getHours()) updateContainer(document.getElementById('hours'), now.getHours());
  if (last.getMinutes() !== now.getMinutes()) updateContainer(document.getElementById('minutes'), now.getMinutes());
  if (last.getSeconds() !== now.getSeconds()) updateContainer(document.getElementById('seconds'), now.getSeconds());
  last = now;
}

async function updateDate() {
  const dt = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let suffix;
  switch (dt.getDate()) {
    case 1:
    case 31: suffix = '<sup>st</sup>'; break;
    case 2:
    case 22: suffix = '<sup>nd</sup>'; break;
    case 3: suffix = '<sup>rd</sup>'; break;
    default: suffix = '<sup>th</sup>';
  }
  document.getElementById('date').innerHTML = `
    ${days[dt.getDay()]}, &nbsp
    ${months[dt.getMonth()]} ${dt.getDate()}${suffix} ${dt.getFullYear()}
  `;
}

function dateTime() {
  // eslint-disable-next-line no-console
  console.log('initDateTime', new Date());
  updateTime();
  updateDate();
  setInterval(updateTime, 1000);
  setInterval(updateDate, 5 * 60 * 1000);
}

async function main() {
  dateTime();
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
