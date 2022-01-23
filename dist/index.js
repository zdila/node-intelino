"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelinoBufferToJson = exports.feedbackTypes = exports.colors = exports.directions = void 0;
exports.directions = [
    "current",
    "forward",
    "backward",
    "stop",
    "invert",
];
exports.colors = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "unknown",
];
const decisions = [
    "none",
    "left",
    "right",
    "steer",
    "straight",
    undefined,
    undefined,
    "all",
];
exports.feedbackTypes = ["none", "movementStop", "endRoute"];
function toHex(dv, separator = " ", offset = 0) {
    return [
        ...new Uint8Array(dv.buffer, dv.byteOffset + offset, dv.byteLength - offset),
    ]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join(separator);
}
function intelinoBufferToJson(b) {
    const mt = b.getUint8(0);
    switch (mt) {
        case 0x07:
            // 07 09 01 0a 01 00 01 03 01 03 00
            return {
                type: "VersionDetail",
                api: [b.getUint8(6), b.getUint8(7)],
                firmware: [b.getUint8(8), b.getUint8(9), b.getUint8(10)],
            };
        case 0x42:
            return {
                type: "MacAddress",
                mac: toHex(b, ":", 2),
            };
        case 0x43:
            return {
                type: "TrainUuid",
                uuid: toHex(b, "", 2),
            };
        case 0x3e:
            return {
                type: "StatsLifetimeOdometer",
                odoCm: b.getUint32(2),
            };
        case 0xb7:
            return {
                type: "Movement",
                dir: exports.directions[b.getUint8(2)],
                speed: b.getUint16(3),
                pwm: b.getUint8(5),
                speedControl: Boolean(b.getUint8(6)),
                desiredSpeed: b.getUint16(7),
                pauseTime: b.getUint8(9),
                nextDecision: decisions[b.getUint8(10)],
                odo: b.getUint32(14),
            };
        case 0xe0: {
            const cmd = b.getUint8(2);
            const ts = b.getUint32(3) / 1000;
            switch (cmd) {
                case 0x01:
                    return {
                        type: "EventMovementDirectionChanged",
                        ts,
                        direction: exports.directions[b.getUint8(7)],
                    };
                case 0x02:
                    return { type: "EventLowBattery", ts };
                case 0x03:
                    return { type: "EventLowBatteryCutOff", ts };
                case 0x04:
                    return {
                        type: "EventChargingStateChanged",
                        ts,
                        charging: Boolean(b.getUint8(7)),
                    };
                case 0x05:
                    return {
                        type: "EventButtonPressDetected",
                        ts,
                        pressDuration: [undefined, "short", "long"][b.getUint8(7)],
                    };
                case 0x06:
                case 0x09:
                    return {
                        type: cmd === 0x06
                            ? "EventSnapCommandExecuted"
                            : "EventSnapCommandDetected",
                        ts,
                        counter: b.getUint8(7),
                        c1: exports.colors[b.getUint8(8)],
                        c2: exports.colors[b.getUint8(9)],
                        c3: exports.colors[b.getUint8(10)],
                        c4: exports.colors[b.getUint8(11)],
                    };
                case 0x07:
                case 0x08:
                    return {
                        type: "EventColorChanged",
                        ts,
                        sensor: cmd === 0x07 ? "front" : cmd === 0x08 ? "rear" : undefined,
                        color: exports.colors[b.getUint8(11)],
                        dist: b.getUint32(7),
                    };
                case 0x0a:
                    return {
                        type: "EventSplitDecision",
                        ts,
                        decision: decisions[b.getUint8(7)],
                        dist: b.getUint32(8),
                    };
            }
            break;
        }
    }
    return { type: "Unknown", payload: toHex(b) };
}
exports.intelinoBufferToJson = intelinoBufferToJson;
//# sourceMappingURL=index.js.map