'use strict';

const hardwareModules = new Set([
    require('./triones'),
]);

function createFor(peripheral) {
    for (let module of hardwareModules) {
        if (module.isCompatibleWith(peripheral.advertisement)) {
            return module.createFor(peripheral);
        }
    }

    return Promise.resolve(null);
}

module.exports = {
    'createFor': createFor,
};