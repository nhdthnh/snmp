import { TrafficGridRow } from "../web/rows/traffic_grid_row.js";

const mockStatus = {
  interfaces: {
    ether1: {}, ether2: {}, ether3: {}, ether4: {}, ether5: {},
    sfp1: {}, ether6: {}, ether7: {}, ether8: {}, ether9: {},
    ether10: {}, "pppoe-out1": {}, "pppoe-out2": {}, BridgeVLAN: {},
    "VLAN10-LAN": {}, "VLAN20-CAM": {}, VLAN30: {}
  },
  routers: {
    hq: {
      interfaces: {
        ether1: {}, ether2: {}, ether3: {}, ether4: {}, ether5: {},
        sfp1: {}, ether6: {}, ether7: {}, ether8: {}, ether9: {},
        ether10: {}, "pppoe-out1": {}, "pppoe-out2": {}, BridgeVLAN: {},
        "VLAN10-LAN": {}, "VLAN20-CAM": {}, VLAN30: {}
      }
    },
    bob: {
      interfaces: {
        ether1: {}, ether2: {}, ether3: {}, ether4: {}, ether5: {},
        wlan1: {}, wlan2: {}, bridge: {}, "pppoe-out1": {}
      }
    }
  }
};

const items = TrafficGridRow.getItems(mockStatus, "all");
console.log("Total available items across both routers:", items.length);
console.log("HQ items:", items.filter(i => i.router === "hq").length);
console.log("BOB items:", items.filter(i => i.router === "bob").length);

const selected = TrafficGridRow.getSelected(items);
console.log("Default selected keys count:", selected.length);
console.log("Is all selected by default?", selected.length === items.length);
if (selected.length === items.length) {
  console.log("SUCCESS: Default is selecting ALL ports of both routers!");
} else {
  console.error("FAIL: Not all selected!");
}
