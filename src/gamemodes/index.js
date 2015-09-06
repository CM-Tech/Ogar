module.exports = {
    Mode: require('./Mode'),
    FFA: require('./FFA'),
    Weird: require('./CustomMode.js')
};

var get = function(id) {
    var mode;
    switch (id) {
        case 1:
            mode = new module.exports.Weird();
            break;
        default: // FFA is default
            mode = new module.exports.FFA();
            break;
    }
    return mode;
};

module.exports.get = get;