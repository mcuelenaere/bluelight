'use strict';

class MagicBlue {
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
        var data;
        if (red == 1.0 && green == 1.0 && blue == 1.0) {
            // special case for pure white: enable white LEDs

            data = new Buffer(8);
            data[0] = 0x56;
            data[1] = 0x00;
            data[2] = 0x00;
            data[3] = 0x00;
            data[4] = (opacity * 255) & 0xFF;
            data[5] = 0x0F;
            data[6] = 0xAA;
            data[7] = 0x09;
        } else {
            // disable white LEDs

            data = new Buffer(7);
            data[0] = 0x56;
            data[1] = (red * opacity * 255) & 0xFF;
            data[2] = (green * opacity * 255) & 0xFF;
            data[3] = (blue * opacity * 255) & 0xFF;
            data[4] = 0;
            data[5] = 0xF0;
            data[6] = 0xAA;
        }

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
        return "MagicBlue[uuid=" + this._peripheral.uuid + ",friendlyName=" + this.friendlyName + "]";
    }

    static createFor(peripheral) {
        return new Promise((resolve, reject) => {
            peripheral.connect((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                peripheral.discoverSomeServicesAndCharacteristics(['ffe5'], ['ffe9'], (error, services, characteristics) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(new MagicBlue(peripheral, characteristics[0]));
                });
            });
        });
    }

    static isCompatibleWith(advertisement) {
        if (typeof advertisement.localName == 'string' && advertisement.localName.startsWith('LEDBLE-') && advertisement.serviceUuids.indexOf('ffe5') !== -1) {
            return true;
        }

        return false;
    }
}

module.exports = MagicBlue;