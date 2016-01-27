'use strict';

class Triones {
    constructor(peripheral, characteristic) {
        this._peripheral = peripheral;
        this._characteristic = characteristic;
    }

    _writeBuffer(buffer) {
        return new Promise((resolve, reject) => {
            this._characteristic.write(buffer, true, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    setColor(red, green, blue, opacity) {
        let data = new Buffer(7);

        data[0] = 0x56;
        data[1] = (red * opacity * 255) & 0xFF;
        data[2] = (green * opacity * 255) & 0xFF;
        data[3] = (blue * opacity * 255) & 0xFF;
        if (red == 1.0 && green == 1.0 && blue == 1.0) {
            // special case for pure white: enable white LEDs
            data[4] = (opacity * 255) & 0xFF;
            data[5] = 0x0F;
        } else {
            // disable white LEDs
            data[4] = 0;
            data[5] = 0xF0;
        }
        data[6] = 0xAA;

        return this._writeBuffer(data);
    }

    enableLight() {
        let data = new Buffer([0xCC, 0x23, 0x33]);
        return this._writeBuffer(data);
    }

    disableLight() {
        let data = new Buffer([0xCC, 0x24, 0x33]);
        return this._writeBuffer(data);
    }

    get friendlyName() {
        return this._peripheral.advertisement.localName;
    }

    get uniqueId() {
        return this._peripheral.uuid;
    }

    toString() {
        return "Triones[uuid=" + this._peripheral.uuid + ",friendlyName=" + this.friendlyName + "]";
    }

    static createFor(peripheral) {
        return new Promise((resolve, reject) => {
            peripheral.connect((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                peripheral.discoverSomeServicesAndCharacteristics(['ffd5'], ['ffd9'], (error, services, characteristics) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(new Triones(peripheral, characteristics[0]));
                });
            });
        });
    }

    static isCompatibleWith(advertisement) {
        if (advertisement.localName.startsWith('Triones-') && advertisement.serviceUuids.indexOf('ffd5') !== -1) {
            return true;
        }

        return false;
    }
}

module.exports = Triones;