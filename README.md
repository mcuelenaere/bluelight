# bluelight

A Bluetooth lamp controller library.

## Install

```sh
npm install bluelight
```

## Usage

```javascript
const Bluelight = require('bluelight'),
      bluelight = new Bluelight();
```

## Example projects using this library

  * [greenlight](https://github.com/mcuelenaere/greenlight): a simple web UI + REST API around bluelight

### Actions

#### Start scanning

```javascript
bluelight.scanFor(5000); // scan for 5 seconds
```

#### Get list of detected devices

```javascript
for (let device of bluelight.detectedDevices) {
    console.log(device);
}
```

#### Devices

All these methods return a `Promise` which resolve when finished executing the command or reject when an error occured.

##### Enable light

```javascript
device.enableLight().then(function () {
    console.log("Light enabled");
});
```

##### Disable light

```javascript
device.disableLight().then(function () {
    console.log("Light disabled");
});
```

##### Set light color

Valid values for the arguments are between 0.0 and 1.0

```javascript
device.setColor(/*red*/1.0, /*green*/0.0, /*blue*/0.0, /*dimness*/1.0).then(function () {
    console.log("Light should be red!");
});
```

Most devices are `RGBW` and treat pure white as "only light the white LEDs":

```javascript
device.setColor(1.0, 1.0, 1.0, 0.5).then(function () {
    console.log("Light should be dimmed white!");
});
```

##### Get device information

```javascript
console.log(device.uniqueId);
console.log(device.friendlyName);
```

### Events

See [Node.js EventEmitter docs](https://nodejs.org/api/events.html) for more info on API's.

#### Scan stopped

```javascript
bluelight.on('scanStop', function() {
    console.log('Stopped scanning');
});
```

#### Device discovered

```javascript
bluelight.on('discover', function (device) {
    console.log('Device ' + device.friendlyName + ' discovered');
});
```

The event is emitted only when scanning is started.

#### Device disconnected

```javascript
bluelight.on('disconnect', function (device) {
    console.log('Device ' + device.friendlyName + ' disconnected');
});
```

#### Error

```javascript
bluelight.on('error', function (err) {
    console.error(err);
});
```
