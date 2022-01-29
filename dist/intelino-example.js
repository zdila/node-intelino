"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ble_1 = require("@mz/bluez/dist/ble");
const intelinoSession_1 = require("./intelinoSession");
const readline_1 = __importDefault(require("readline"));
const _1 = require(".");
function sleep(delay) {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    });
}
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
    const is = await (0, intelinoSession_1.toIntelinoSession)(session);
    readline_1.default.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    let speed = 2;
    process.stdin.on("keypress", (_str, key) => {
        if (key.name === "space") {
            is.stopDriving();
        }
        else if (key.name === "up") {
            if (speed < 3) {
                speed++;
            }
            is.driveAtSpeedLevel(speed);
        }
        else if (key.name === "down") {
            if (speed > 0) {
                speed--;
            }
            is.driveAtSpeedLevel(speed);
        }
        else if (key.ctrl && key.name === "c") {
            process.exit();
        }
    });
    const sd = [1, 0, 1, 0, 0];
    let i = 0;
    is.on("message", (m) => {
        switch (m.type) {
            case "EventSplitDecision":
                console.log("SD");
                i++;
                is.setNextSplitSteeringDecision(sd[i % sd.length] ? "left" : "straight");
                break;
            // case "EventColorChanged":
            //   if (m.color === "red") {
            //     is.driveAtSpeedLevel(1);
            //   } else if (m.color === "yellow") {
            //     is.driveAtSpeedLevel(2);
            //   } else if (m.color === "green") {
            //     is.driveAtSpeedLevel(3);
            //   }
            //   break;
        }
    });
    // await is.setSnapCommandExecution(false);
    // setInterval(() => {
    //   is.setTopLedColor(
    //     Math.floor(Math.random() * 256),
    //     Math.floor(Math.random() * 256),
    //     Math.floor(Math.random() * 256)
    //   );
    // }, 100);
    console.log("Version", await is.getVersionInfo());
    console.log("MAC", await is.getMacAddress());
    console.log("UUID", await is.getUuid());
    console.log("ODO", await is.getStatsLifetimeOdometer());
    // await is.driveAtSpeedLevel(speed);
    // for (;;) {
    //   await sleep(5000);
    //   await is.pauseDriving(30, true);
    // }
    for (const sound of _1.sounds) {
        await is.playSound(sound);
        await sleep(2000);
    }
    session.close();
}
//# sourceMappingURL=intelino-example.js.map