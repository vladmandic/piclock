const maxmind = require('maxmind');
const superagent = require('superagent');
const log = require('@vladmandic/pilogger');

let geoCity;
let geoASN;

const db = {
  city: '../pidash/geoip/GeoLite2-City.mmdb',
  asn: '../pidash/geoip/GeoLite2-ASN.mmdb',
};

async function init() {
  if (!geoCity || !geoASN) {
    try {
      geoCity = await maxmind.open(db.city);
      geoASN = await maxmind.open(db.asn);
      log.state('GeoIP DB:', db.city, db.asn);
      return true;
    } catch {
      log.warn('GeoIP DB Fail, db.city, db.asn');
      return false;
    }
  }
  return true;
}

async function get(addr = '127.0.0.1') {
  // fix ip address and allow ipv6
  let ip = '127.0.0.1';
  if (addr.startsWith('::')) {
    const partial = addr.split(':');
    ip = partial[partial.length - 1];
    if (ip.split('.').length !== 4) {
      ip = '127.0.0.1';
    }
  }
  // init default values
  let loc = {
    ip,
    ext: ip,
    country: '',
    city: '',
    asn: '',
    lat: 0,
    lon: 0,
    accuracy: null,
  };
  // try normal lookup
  try {
    const geo = geoCity.get(ip);
    const asn = geoASN.get(ip);
    loc = {
      ip,
      ext: ip,
      country: geo.country?.iso_code,
      city: geo.city ? geo.city?.names?.en : '',
      asn: asn ? asn.autonomous_system_organization : 'unknown',
      lat: geo.location ? geo.location?.latitude : null,
      lon: geo.location ? geo.location?.longitude : null,
      accuracy: geo.location ? geo.location?.accuracy_radius : 0,
    };
  } catch { /**/ }
  // try lookup of public ip
  if (loc.country === '') {
    try {
      const external = await superagent.get('http://ipv4bot.whatismyipaddress.com/');
      const ext = external.text.trim();
      const geo = geoCity.get(ext);
      const asn = geoASN.get(ext);
      loc = {
        ip,
        ext,
        country: geo.country?.iso_code,
        city: geo.city ? geo.city?.names?.en : '',
        asn: asn ? asn.autonomous_system_organization : 'unknown',
        lat: geo.location ? geo.location?.latitude : null,
        lon: geo.location ? geo.location?.longitude : null,
        accuracy: geo.location ? geo.location?.accuracy_radius : 0,
      };
    } catch (err) {
      log.warn(`GeoIP lookup failed for ${ip}: ${err}`);
    }
  }
  return loc;
}

exports.get = get;
exports.init = init;
