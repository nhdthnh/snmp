import { TopologyRow } from '../web/rows/topology_row.js';

// mock DOM
global.document = {
  getElementById: (id) => {
    if (id === 'topology-svg') {
      return {
        setAttribute: (k, v) => {},
        innerHTML: ''
      };
    }
    if (id === 'topology-controls') {
      return {
        innerHTML: '',
        querySelectorAll: () => [],
        onclick: null
      };
    }
    return null;
  }
};

const mockStatus = {
  router: { up: true },
  interfaces: {
    ether1: { up: true, rx_bps: 1048576, tx_bps: 524288 },
    ether2: { up: true, rx_bps: 20971520, tx_bps: 10485760 },
    ether4: { up: true, rx_bps: 3145728, tx_bps: 1572864 },
    ether9: { up: true, rx_bps: 4194304, tx_bps: 2097152 },
    BridgeVLAN: { up: true, rx_bps: 52428800, tx_bps: 26214400 }
  },
  devices: {
    core: { up: true, rtt: 1 },
    u1: { up: true, rtt: 1 },
    u2: { up: true, rtt: 1 },
    u3: { up: true, rtt: 1 },
    u4: { up: true, rtt: 1 },
    u5: { up: true, rtt: 1 },
    poe: { up: true, rtt: 1 },
    nas: { up: true, rtt: 1 },
    sql: { up: true, rtt: 1 },
    dvr_vt: { up: true, rtt: 1 },
    dvr_dh: { up: true, rtt: 1 }
  },
  ipsec: { up: true, rtt: 3.8 }
};

let svgOutput = '';
const fakeSvg = {
  setAttribute: (k, v) => console.log('viewBox set to:', v),
  set innerHTML(val) { svgOutput = val; }
};
global.document.getElementById = (id) => (id === 'topology-svg' ? fakeSvg : { innerHTML: '', querySelectorAll: () => [] });

TopologyRow.render(mockStatus);

console.log('Render completed! Generated SVG length:', svgOutput.length);
console.log('Has IPsec Tunnel:', svgOutput.includes('IPsec VPN Site-to-Site'));
console.log('Has SƠ ĐỒ NETWORK CÔNG TY TNHH OQR:', svgOutput.includes('SƠ ĐỒ NETWORK CÔNG TY TNHH OQR'));
console.log('Has SW CORE Ruijie:', svgOutput.includes('SW CORE Ruijie'));
console.log('Has Mikrotik hAP ac²:', svgOutput.includes('Mikrotik hAP ac²'));
