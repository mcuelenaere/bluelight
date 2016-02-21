'use strict';

const noble = require('noble');

const hardwareModules = new Set([
    require('./triones'),
    require('./magicblue'),
]);

function createFor(peripheral) {
    for (let module of hardwareModules) {
        if (module.isCompatibleWith(peripheral.advertisement)) {
            // Stop scanning: some BT devices do not support
            // scanning and connecting to a peripheral at
            // the same time.
            noble.stopScanning();

            // connect to the device
            return module.createFor(peripheral);
        }
    }

    return Promise.resolve(null);
}

module.exports = {
    'createFor': createFor,
};