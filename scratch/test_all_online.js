// Test all online state and no overlap between bob_ap and bob_sw03
import { TopologyRow } from '../web/rows/topology_row.js';

let capturedViewBox = '';
let capturedHtml = '';
global.document = {
  getElementById: (id) => {
    if (id === 'topology-svg') {
      return {
        setAttribute: (k, v) => { if (k === 'viewBox') capturedViewBox = v; },
        set innerHTML(val) { capturedHtml = val; }
      };
    }
    return { innerHTML: '', querySelectorAll: () => [] };
  }
};

const mockStatus = {
  router: { up: true },
  routers: {
    bob: {
      router: { up: true },
      interfaces: { ether1: { up: true, rx_bps: 6515000, tx_bps: 34741000 } }
    }
  },
  interfaces: {
    ether1: { up: true, rx_bps: 500000, tx_bps: 200000 },
    ether2: { up: true, rx_bps: 45000000, tx_bps: 12000000 },
    ether3: { up: true, rx_bps: 85000000, tx_bps: 65000000 },
    ether4: { up: true, rx_bps: 3500000, tx_bps: 18000000 },
    ether9: { up: true, rx_bps: 4500000, tx_bps: 25000000 },
  },
  devices: {
    core: { up: true, rtt: 1 },
    sql: { up: true, rtt: 1 },
    poe: { up: true, rtt: 1 },
    nas: { up: true, rtt: 1 },
    bob_sw01: { up: true, rtt: 3 },
    bob_sw02: { up: true, rtt: 3 },
    bob_sw03: { up: true, rtt: 3 },
    bob_sw04: { up: true, rtt: 4 },
    bob_sw05: { up: true, rtt: 4 },
    bob_nvr: { up: true, rtt: 3 },
    bob_ap: { up: true, rtt: 3 },
    bob_c2_16: { up: true, rtt: 3 },
    bob_c17_31: { up: true, rtt: 4 },
    bob_c1: { up: true, rtt: 4 },
  },
  ipsec: { up: true, rtt: 3.8 }
};

TopologyRow.render(mockStatus);

console.log("ViewBox:", capturedViewBox);
console.log("Has topo-device down:", capturedHtml.includes("topo-device down"));
console.log("Has topo-wire-down:", capturedHtml.includes("topo-wire-down"));
console.log("Has topo-device static:", capturedHtml.includes("topo-device static"));
console.log("Number of online nodes (topo-device up):", (capturedHtml.match(/topo-device up/g) || []).length);
