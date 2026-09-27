// Builds the canonical location dataset: one country index plus one lazily loaded city file per ISO country.
import fs from 'node:fs';
const base = 'node_modules/country-state-city/lib/assets/';
const countries = JSON.parse(fs.readFileSync(base + 'country.json', 'utf8'));
const cities = JSON.parse(fs.readFileSync(base + 'city.json', 'utf8'));
const byCountry = {};
for (const c of cities) {
  const cc = Array.isArray(c) ? c[1] : c.countryCode;
  const name = Array.isArray(c) ? c[0] : c.name;
  (byCountry[cc] ||= new Set()).add(name);
}
const index = countries.map((c) => ({ code: c.isoCode, en: c.name, dial: String(c.phonecode).replace(/^\+/, '').split(/[ -]/)[0] }));
fs.writeFileSync('public/geo/countries.json', JSON.stringify(index));
let n = 0;
for (const { code } of index) {
  const list = [...(byCountry[code] || [])].sort((a, b) => a.localeCompare(b));
  fs.writeFileSync(`public/geo/cities/${code}.json`, JSON.stringify(list)); n += list.length;
}
console.log('countries', index.length, 'cities', n);
