const fs = require('fs');
const text = fs.readFileSync('c:/Users/OQR/Desktop/network/web/rows/topology_row.js', 'utf8');

const keywords = [
  'Sw01 TL-SG116', 'Sw03 Ruijie SW', '192.168.4.252',
  'Sw02 Hikvision PoE', '192.168.4.242',
  'Sw04 Hikvision PoE', '192.168.4.243',
  'Sw05 Switch OEM 8P', 'Camera C1',
  'AP01 – AP05', 'NVR01 Hikvision', 'Photocopy01', 'PC01 – PC10'
];

keywords.forEach(k => {
  console.log(`Keyword "${k}":`, text.includes(k));
});

console.log('Has "Máy in A4 / Tem":', text.includes('Máy in A4 / Tem'));
