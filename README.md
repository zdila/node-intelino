# Intelino library for Node.js

For BLE it uses BlueZ via D-Bus.

## Running the example

You can find simple usage example in [intelino-example.ts](./src/intelino-example.ts).

### Installation

1. install Node.js 14 or newer
1. clone this repo
1. in cloned directory run `npm i`
1. copy `node_modules/@mz/bluez/user-ble.conf` to `/etc/dbus-1/system.d/user-ble.conf` run `sudo systemctl reload dbus`

### Running

1. run `npm start`
