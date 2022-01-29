export const directions = [
  "current",
  "forward",
  "backward",
  "stop",
  "invert",
] as const;

export type Direction = typeof directions[number];

export const colors = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "unknown",
] as const;

export type Color = typeof colors[number];

const decisions = [
  "none",
  "left",
  "right",
  "steer",
  "straight",
  undefined,
  undefined,
  "all",
] as const;

export type Decision = NonNullable<typeof decisions[number]>;

export const feedbackTypes = ["none", "movementStop", "endRoute"] as const;

export type FeedbackType = typeof feedbackTypes[number];

export const sounds = [
  "horn1",
  "bell",
  "horn2",
  "policeHorn",
  "alarm",
] as const;

export type Sound = typeof sounds[number];

function toHex(dv: DataView, separator = " ", offset = 0) {
  return [
    ...new Uint8Array(
      dv.buffer,
      dv.byteOffset + offset,
      dv.byteLength - offset
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join(separator);
}

export type VersionDetailMessage = {
  type: "VersionDetail";
  api: [number, number];
  firmware: [number, number, number];
};

export type MacAddressMessage = {
  type: "MacAddress";
  mac: string;
};

export type TrainUuidMessage = {
  type: "TrainUuid";
  uuid: string;
};

export type EventSnapCommandExecutedMessage = {
  type: "EventSnapCommandExecuted";
  counter: number;
  c1: Color | undefined;
  c2: Color | undefined;
  c3: Color | undefined;
  c4: Color | undefined;
};

export type EventSnapCommandDetectedMessage = {
  type: "EventSnapCommandDetected";
  counter: number;
  c1: Color | undefined;
  c2: Color | undefined;
  c3: Color | undefined;
  c4: Color | undefined;
};

export type StatsLifetimeOdometerMessage = {
  type: "StatsLifetimeOdometer";
  odoCm: number;
};

export type MovementMessage = {
  type: "Movement";
  dir: Direction | undefined;
  speed: number;
  pwm: number;
  speedControl: boolean;
  desiredSpeed: number;
  pauseTime: number;
  nextDecision: Decision | undefined;
  odo: number;
};

export type EventMovementDirectionChangedMessage = {
  type: "EventMovementDirectionChanged";
  ts: number;
  direction: Direction | undefined;
};

export type EventLowBatteryMessage = { type: "EventLowBattery"; ts: number };

export type EventLowBatteryCutOffMessage = {
  type: "EventLowBatteryCutOff";
  ts: number;
};

export type EventChargingStateChangedMessage = {
  type: "EventChargingStateChanged";
  ts: number;
  charging: boolean;
};

export type EventButtonPressDetectedMessage = {
  type: "EventButtonPressDetected";
  ts: number;
  pressDuration: undefined | "short" | "long";
};

export type EventColorChangedMessage = {
  type: "EventColorChanged";
  ts: number;
  sensor: "front" | "rear" | undefined;
  color: Color | undefined;
  dist: number;
};

export type EventSplitDecisionMessage = {
  type: "EventSplitDecision";
  ts: number;
  decision: Decision | undefined;
  dist: number;
};

export type UnknownMessage = { type: "Unknown"; payload: string };

export type Message =
  | VersionDetailMessage
  | MacAddressMessage
  | TrainUuidMessage
  | EventSnapCommandExecutedMessage
  | EventSnapCommandDetectedMessage
  | StatsLifetimeOdometerMessage
  | MovementMessage
  | EventMovementDirectionChangedMessage
  | EventLowBatteryMessage
  | EventLowBatteryCutOffMessage
  | EventChargingStateChangedMessage
  | EventButtonPressDetectedMessage
  | EventColorChangedMessage
  | EventSplitDecisionMessage
  | UnknownMessage;

export function intelinoBufferToJson(b: DataView): Message {
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
        dir: directions[b.getUint8(2)],
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
            direction: directions[b.getUint8(7)],
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
            pressDuration: ([undefined, "short", "long"] as const)[
              b.getUint8(7)
            ],
          };

        case 0x06:
        case 0x09:
          return {
            type:
              cmd === 0x06
                ? "EventSnapCommandExecuted"
                : "EventSnapCommandDetected",
            ts,
            counter: b.getUint8(7),
            c1: colors[b.getUint8(8)],
            c2: colors[b.getUint8(9)],
            c3: colors[b.getUint8(10)],
            c4: colors[b.getUint8(11)],
          };

        case 0x07:
        case 0x08:
          return {
            type: "EventColorChanged",
            ts,
            sensor: cmd === 0x07 ? "front" : cmd === 0x08 ? "rear" : undefined,
            color: colors[b.getUint8(11)],
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
