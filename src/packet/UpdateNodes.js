var ini = require('../modules/ini.js');
var fs = require("fs");
function UpdateNodes(destroyQueue, nodes, nonVisibleNodes) {
    this.destroyQueue = destroyQueue;
    this.nodes = nodes;
    this.nonVisibleNodes = nonVisibleNodes;
}

module.exports = UpdateNodes;

UpdateNodes.prototype.build = function() {
    // Calculate nodes sub packet size before making the data view
    var nodesLength = 0;
    for (var i = 0; i < this.nodes.length; i++) {
        var node = this.nodes[i];

        if (typeof node == "undefined") {
            continue;
        }

        nodesLength = nodesLength + 20 + (node.getName().length * 2);
    }

    var buf = new ArrayBuffer(3 + (this.destroyQueue.length * 12) + (this.nonVisibleNodes.length * 4) + nodesLength + 8);
    var view = new DataView(buf);

    view.setUint8(0, 16, true); // Packet ID
    view.setUint16(1, this.destroyQueue.length, true); // Nodes to be destroyed

    var offset = 3;
    for (var i = 0; i < this.destroyQueue.length; i++) {
        var node = this.destroyQueue[i];

        if (!node) {
            continue;
        }

        var killer = 0;
        if (node.getKiller()) {
            killer = node.getKiller().nodeId;
        }

        view.setUint32(offset, killer, true); // Killer ID
        view.setUint32(offset + 4, node.nodeId, true); // Node ID

        offset += 8;
    }

    for (var i = 0; i < this.nodes.length; i++) {
        var node = this.nodes[i];
		var config = ini.parse(fs.readFileSync('./gameserver.ini', 'utf-8'));
        if (typeof node == "undefined") {
            continue;
        }
        if(node.owner || node.spiked == 1 || node.cellType == 3){
		view.setUint32(offset, node.nodeId, true); // Node ID
        view.setInt32(offset + 4, node.position.x, true); // X position
        view.setInt32(offset + 8, node.position.y, true); // Y position
        view.setUint16(offset + 12, node.getSize(), true); // Mass formula: Radius (size) = (mass * mass) / 100
        view.setUint8(offset + 14, node.color.r, true); // Color (R)
        view.setUint8(offset + 15, node.color.g, true); // Color (G)
        view.setUint8(offset + 16, node.color.b, true); // Color (B)
        view.setUint8(offset + 17, node.spiked, true); // Flags
		//console.log(node);       
        offset += 18;
		}else{
		if(node.position.x <= config.borderLeft || node.position.x >= config.borderRight || node.position.y <= config.borderTop|| node.position.y >= config.borderBottom){}else{
        node.position.x += (Math.floor((Math.random() * 100) - 1)-50);
		node.position.y += (Math.floor((Math.random() * 100) - 1)-50);
		}
        if(node.cellType==1){
        view.setUint32(offset, node.nodeId, true); // Node ID
        view.setInt32(offset + 4, node.position.x, true); // X position
        view.setInt32(offset + 8, node.position.y, true); // Y position
        view.setUint16(offset + 12, node.getSize(), true); // Mass formula: Radius (size) = (mass * mass) / 100
        view.setUint8(offset + 14, node.color.r, true); // Color (R)
        view.setUint8(offset + 15, node.color.g, true); // Color (G)
        view.setUint8(offset + 16, node.color.b, true); // Color (B)
        view.setUint8(offset + 17, node.spiked, true); // Flags
        //console.log(node);
        offset += 18;
        //console.log(config);
        }else{
        view.setUint32(offset, node.nodeId, true); // Node ID
        view.setInt32(offset + 4, node.position.x, true); // X position
        view.setInt32(offset + 8, node.position.y, true); // Y position
        view.setUint16(offset + 12, node.getSize(), true); // Mass formula: Radius (size) = (mass * mass) / 100
        view.setUint8(offset + 14, node.color.r, true); // Color (R)
        view.setUint8(offset + 15, node.color.g, true); // Color (G)
        view.setUint8(offset + 16, node.color.b, true); // Color (B)
        view.setUint8(offset + 17, node.spiked, true); // Flags
        //console.log(node);
        offset += 18;
        //console.log(config);
        }
        }

        var name = node.getName();
        if (name) {
            for (var j = 0; j < name.length; j++) {
                var c = name.charCodeAt(j);
                if (c){
                    view.setUint16(offset, c, true);
                }
                offset += 2;
            }
        }

        view.setUint16(offset, 0, true); // End of string
        offset += 2;
    }

    var len = this.nonVisibleNodes.length + this.destroyQueue.length;
    view.setUint32(offset, 0, true); // End
    view.setUint32(offset + 4, len, true); // # of non-visible nodes to destroy

    offset += 8;

    // Destroy queue + nonvisible nodes
    for (var i = 0; i < this.destroyQueue.length; i++) {
        var node = this.destroyQueue[i];

        if (!node) {
            continue;
        }

        view.setUint32(offset, node.nodeId, true);
        offset += 4;
    }
    for (var i = 0; i < this.nonVisibleNodes.length; i++) {
        var node = this.nonVisibleNodes[i];

        if (!node) {
            continue;
        }

        view.setUint32(offset, node.nodeId, true);
        offset += 4;
    }

    return buf;
};

