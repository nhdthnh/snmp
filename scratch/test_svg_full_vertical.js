// Render test for full vertical spider topology
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
      interfaces: { ether1: { up: true, rx_bps: 1200000, tx_bps: 3400000 } }
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
    bob_sw01: { up: true, rtt: 4 },
    bob_sw02: { up: true, rtt: 4 },
  },
  ipsec: { up: true, rtt: 3.8 }
};

mockStatus.devices.isp_bob = { up: true, rtt: 3 };
TopologyRow.render(mockStatus);

console.log("ViewBox set to:", capturedViewBox);
console.log("SVG output length:", capturedHtml.length);
console.log("isp_bob is up:", capturedHtml.includes('topo-device up') && capturedHtml.includes('data-id="isp_bob"'));
console.log("isp_bob rtt text:", capturedHtml.includes('3ms'));
console.log("Has IPsec Tunnel:", capturedHtml.includes("IPsec Site-to-Site VPN Tunnel"));
console.log("Has SW CORE Ruijie:", capturedHtml.includes("SW CORE Ruijie"));
console.log("Has p2 (Trunk):", capturedHtml.includes("p2 (Trunk)"));
console.log("Has eth3 (p2):", capturedHtml.includes("eth3 (p2)"));
console.log("Has Sw01 TL-SG116:", capturedHtml.includes("Sw01 TL-SG116"));
console.log("Has P.1 (Uplink):", capturedHtml.includes("P.1 (Uplink)"));
console.log("Has HQ MCC node:", capturedHtml.includes('data-id="mcc"'));
console.log("Has BOB MCC node:", capturedHtml.includes('data-id="bob_mcc"'));
console.log("SUCCESS!");
