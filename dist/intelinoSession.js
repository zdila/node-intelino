"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toIntelinoSession = void 0;
const eventTarget_1 = require("@mz/bluez/dist/eventTarget");
const _1 = require(".");
async function toIntelinoSession(session) {
    const callMap = new Map();
    const { on, off, fire } = (0, eventTarget_1.createEventTarget)();
    session.on("disconnect", () => {
        fire("disconnect", undefined);
    });
    session.on("discover", (params) => {
        fire("discover", params);
    });
    session.on("characteristicChange", (value) => {
        const { message } = value;
        const im = (0, _1.intelinoBufferToJson)(new DataView(message.buffer, message.byteOffset, message.byteLength));
        const b0 = message.readUInt8(0);
        const resolve = callMap.get(b0);
        if (resolve) {
            callMap.delete(b0);
            resolve(im);
        }
        fire("message", im);
    });
    await session.startNotifications("4dad4922-5c86-4ba7-a2e1-0f240537bd08", "a4b80869-a84c-4160-a3e0-72fa58ff480e");
    async function sendCommand(command, ...bytes) {
        await session.write("43dfd9e9-17e5-4860-803d-9df8999b0d7a", "40c540d0-344c-4d0d-a1da-9cc260b82d43", Buffer.from([command, bytes.length, ...bytes]), true);
    }
    async function sendCommandWithResponse(command, ...bytes) {
        return new Promise((resolve, reject) => {
            callMap.set(command, resolve);
            sendCommand(command, ...bytes).then(() => {
                setTimeout(() => {
                    callMap.delete(command);
                    reject(new Error("timeout"));
                }, 3000);
            }, reject);
        });
    }
    async function getVersionInfo() {
        return sendCommandWithResponse(0x07);
    }
    async function getMacAddress() {
        return sendCommandWithResponse(0x42);
    }
    async function getUuid() {
        return sendCommandWithResponse(0x43);
    }
    async function getStatsLifetimeOdometer() {
        return sendCommandWithResponse(0x3e);
    }
    async function startStreaming() {
        // TODO params
        await sendCommand(0xb7, 0x07, 0x0a);
    }
    async function setTopLedColor(r, g, b) {
        await sendCommand(0xb1, 1, r, g, b);
    }
    async function driveWithConstantPwm(pwm, direction = "forward", playFeedback) {
        await sendCommand(0xbc, _1.directions.indexOf(direction), 0xff - (pwm & 0xff), Number(playFeedback));
    }
    async function driveAtSpeedLevel(speedLevel, direction = "forward", playFeedback = true) {
        await sendCommand(0xb8, _1.directions.indexOf(direction), speedLevel, Number(playFeedback));
    }
    async function pauseDriving(duration, playFeedback) {
        await sendCommand(0xbe, duration, Number(playFeedback));
    }
    async function stopDriving(feedbackType = "none") {
        await sendCommand(0xb9, _1.feedbackTypes.indexOf(feedbackType));
    }
    async function setSnapCommandExecution(on) {
        await sendCommand(0x41, Number(on));
    }
    async function decoupleWagon(playFeedback, durationMs = 512) {
        await sendCommand(0x80, durationMs >> 8, durationMs & 0xff, Number(playFeedback));
    }
    async function clearCustomSnapCommands() {
        const clrs = ["black", "red", "green", "yellow", "blue"];
        for (const color of clrs) {
            await sendCommand(0x64, _1.colors.indexOf(color), 0x00);
        }
    }
    async function setSnapCommandFeedback(sound, lights) {
        await sendCommand(0x65, Number(sound) | (Number(lights) << 1));
    }
    async function setHeadlightColor(front, back) {
        await sendCommand(0xb4, (front ? 0b010 : 0) | (back ? 0b100 : 0), ...(front ?? [0, 0, 0]), ...(back ?? [0, 0, 0]));
    }
    async function setNextSplitSteeringDecision(nextDecision) {
        await sendCommand(0xbf, nextDecision === "left" ? 0b01 : nextDecision === "right" ? 0b10 : 0b11);
    }
    async function playSound(sound) {
        const soundBytes = {
            horn1: [0x16, 0x80],
            bell: [0x17, 0x00],
            horn2: [0x17, 0x80],
            policeHorn: [0x18, 0x00],
            alarm: [0x18, 0x80],
        };
        await sendCommand(0x24, 0x00, ...soundBytes[sound], 0x00, 0x00);
    }
    return {
        startStreaming,
        setTopLedColor,
        driveWithConstantPwm,
        pauseDriving,
        stopDriving,
        setSnapCommandExecution,
        decoupleWagon,
        clearCustomSnapCommands,
        setSnapCommandFeedback,
        driveAtSpeedLevel,
        setHeadlightColor,
        setNextSplitSteeringDecision,
        playSound,
        getVersionInfo,
        getMacAddress,
        getUuid,
        getStatsLifetimeOdometer,
        on,
        off,
    };
}
exports.toIntelinoSession = toIntelinoSession;
//# sourceMappingURL=intelinoSession.js.map