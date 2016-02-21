'use strict';

const scanArbitrator = require('../scan_arbitrator');

const hardwareModules = new Set([
    require('./triones'),
    require('./magicblue'),
]);

function createFor(peripheral) {
    for (let module of hardwareModules) {
        if (module.isCompatibleWith(peripheral.advertisement)) {
            // Pause scanning: some BT devices do not support
            // scanning and connecting to a peripheral at
            // the same time.
            scanArbitrator.pauseScanning();

            // connect to the device
            let devicePromise = module.createFor(peripheral);

            // resume scanning in ~100ms
            setTimeout(() => {
                scanArbitrator.resumeScanning();
            }, 100);

            return devicePromise;
        }
    }

    return Promise.resolve(null);
}

module.exports = {
    'createFor': createFor,
};
