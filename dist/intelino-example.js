"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ble_1 = require("@mz/bluez/dist/ble");
const intelinoSession_1 = require("./intelinoSession");
(0, ble_1.initBle)()
    .then(({ createSession }) => startSession(createSession()))
    .catch((err) => {
    console.error(err);
});
async function startSession(session) {
    console.log("Scanning");
    const connPromise = new Promise((resolve, reject) => {
        session.on("discover", (dev) => {
            console.log("Connecting");
            session.connect(dev.peripheralId).then(resolve, reject);
        });
    });
    session.on("disconnect", () => {
        process.exit();
    });
    await session.discover([{ namePrefix: "intelino" }]);
    await connPromise;
    console.log("Connected");
    const { setTopLedColor, getVersionInfo, on, getStatsLifetimeOdometer, getMacAddress, getUuid, driveAtSpeedLevel, stopDriving, } = await (0, intelinoSession_1.toIntelinoSession)(session);
    on("message", (m) => {
        switch (m.type) {
            case "EventSplitDecision":
                console.log(m);
                break;
            case "EventColorChanged":
                if (m.color === "magenta") {
                    console.log("Stopping");
                    stopDriving("endRoute").finally(() => {
                        console.log("Closing");
                        session.close();
                    });
                }
                break;
        }
    });
    await setTopLedColor(255, 0, 255);
    console.log("Version", await getVersionInfo());
    console.log("MAC", await getMacAddress());
    console.log("UUID", await getUuid());
    console.log("ODO", await getStatsLifetimeOdometer());
    await driveAtSpeedLevel(2);
    // await pauseDriving(10, true);
}
//# sourceMappingURL=intelino-example.js.map