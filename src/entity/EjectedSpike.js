var Cell = require('./Cell');

function ejectedSpike() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 3;
    this.size = Math.ceil(Math.sqrt(100 * this.mass));
    this.squareSize = (100 * this.mass) >> 0; // not being decayed -> calculate one time
    this.spiked = 1;
}

module.exports = ejectedSpike;
ejectedSpike.prototype = new Cell();

ejectedSpike.prototype.getSize = function() {
    return this.size;
};

ejectedSpike.prototype.getSquareSize = function() {
    return this.squareSize;
};

ejectedSpike.prototype.calcMove = null; // Only for player controlled movement

// Main Functions

ejectedSpike.prototype.sendUpdate = function() {
    // Whether or not to include this cell in the update packet
    if (this.moveEngineTicks == 0) {
        return false;
    }
    return true;
}

ejectedSpike.prototype.onRemove = function(gameServer) {
    // Remove from list of ejected mass
    var index = gameServer.nodesEjected.indexOf(this);
    if (index != -1) {
        gameServer.nodesEjected.splice(index, 1);
    }
};

ejectedSpike.prototype.onConsume = function(consumer, gameServer) {
    var client = consumer.owner;

    var maxSplits = Math.floor(consumer.mass / 16) - 1; // Maximum amount of splits
    var numSplits = gameServer.config.playerMaxCells - client.cells.length; // Get number of splits
    numSplits = Math.min(numSplits, maxSplits);
    var splitMass = Math.min(consumer.mass / (numSplits + 1), 36); // Maximum size of new splits

    // Cell consumes mass before splitting
    consumer.addMass(this.mass);

    // Cell cannot split any further
    if (numSplits <= 0) {
        return;
    }

    // Big cells will split into cells larger than 36 mass (1/4 of their mass)
    var bigSplits = 0;
    var endMass = consumer.mass - (numSplits * splitMass);
    if ((endMass > 300) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }
    if ((endMass > 1200) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }
    if ((endMass > 3000) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }

    // Splitting
    var angle = 0; // Starting angle
    for (var k = 0; k < numSplits; k++) {
        angle += 6 / numSplits; // Get directions of splitting cells
        gameServer.newCellVirused(client, consumer, angle, splitMass, 150);
        consumer.mass -= splitMass;
    }

    for (var k = 0; k < bigSplits; k++) {
        angle = Math.random() * 6.28; // Random directions
        splitMass = consumer.mass / 4;
        gameServer.newCellVirused(client, consumer, angle, splitMass, 20);
        consumer.mass -= splitMass;
    }

    // Prevent consumer cell from merging with other cells
    consumer.calcMergeTime(gameServer.config.playerRecombineTime);
    consumer.addMass(this.mass);
};

ejectedSpike.prototype.onAutoMove = function(gameServer) {
    if (gameServer.nodesVirus.length < gameServer.config.virusMaxAmount) {
        // Check for viruses
        var v = gameServer.getNearestVirus(this);
        if (v) { // Feeds the virus if it exists
            v.feed(this, gameServer);
            return true;
        }
    }
};

ejectedSpike.prototype.moveDone = function(gameServer) {
    if (!this.onAutoMove(gameServer)) {
        gameServer.nodesEjected.push(this);
    }
};