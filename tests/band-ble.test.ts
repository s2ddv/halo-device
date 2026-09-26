import test from "node:test";
import assert from "node:assert/strict";
import { connectBand } from "../src/lib/band-ble.ts";
import {
  HALO_CHANNELS,
  makePrimaryCommand,
  parseColmiBattery,
} from "../src/lib/ble/halo-protocol.ts";

function setup(t: Parameters<Parameters<typeof test>[1]>[0]) {
  const order: string[] = [];
  let respond = true;
  const notify = Object.assign(new EventTarget(), {
    value: new DataView(new ArrayBuffer(0)),
    async startNotifications() {
      order.push("subscribe");
    },
  });
  const emit = (packet: Uint8Array) => {
    // Exercise DataView offsets, not just buffers beginning at zero.
    const buffer = new Uint8Array(20);
    buffer.set(packet, 2);
    notify.value = new DataView(buffer.buffer, 2, packet.length);
    notify.dispatchEvent(new Event("characteristicvaluechanged"));
  };
  const write = {
    async writeValueWithoutResponse(packet: Uint8Array) {
      order.push("write");
      assert.deepEqual([...packet], [3, ...Array(14).fill(0), 3]);
      if (respond) emit(makePrimaryCommand(3, new Uint8Array([64, 1])));
    },
  };
  const device = Object.assign(new EventTarget(), {
    id: "synthetic",
    name: "Y25_test",
    gatt: {
      connected: false,
      async connect() {
        this.connected = true;
        return {
          async getPrimaryService(uuid: string) {
            assert.equal(uuid, HALO_CHANNELS.primary.service);
            return {
              async getCharacteristic(uuid: string) {
                if (uuid === HALO_CHANNELS.primary.write) return write;
                assert.equal(uuid, HALO_CHANNELS.primary.notify);
                return notify;
              },
            };
          },
        };
      },
      disconnect() {
        this.connected = false;
        device.dispatchEvent(new Event("gattserverdisconnected"));
      },
    },
  });
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      bluetooth: {
        async requestDevice(options: { optionalServices: string[] }) {
          assert.deepEqual(options.optionalServices, [HALO_CHANNELS.primary.service]);
          return device;
        },
      },
    },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else Reflect.deleteProperty(globalThis, "navigator");
  });
  return {
    order,
    emit,
    device,
    silence() {
      respond = false;
    },
  };
}

test("Colmi commands validate input and battery parsing rejects unrelated/corrupt frames", () => {
  assert.throws(() => makePrimaryCommand(256), RangeError);
  assert.throws(() => makePrimaryCommand(1.5), RangeError);
  assert.throws(() => makePrimaryCommand(3, new Uint8Array(15)), RangeError);
  assert.equal(parseColmiBattery(makePrimaryCommand(0x73)), null);
  assert.equal(parseColmiBattery(makePrimaryCommand(3, new Uint8Array([101]))), null);
  const corrupt = makePrimaryCommand(3);
  corrupt[15] = 4;
  assert.equal(parseColmiBattery(corrupt), null);
  assert.deepEqual(parseColmiBattery(makePrimaryCommand(3)), { level: 0, charging: false });
});

test("subscribes before a battery write and accepts an immediate notification", async (t) => {
  const fixture = setup(t);
  const connection = await connectBand({});
  assert.deepEqual(await connection.readBattery(), { level: 64, charging: true });
  assert.deepEqual(fixture.order, ["subscribe", "write"]);
  connection.disconnect();
  assert.equal(fixture.device.gatt.connected, false);
});

test("ignores unknown frames, prevents concurrent requests, times out and permits retry", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const fixture = setup(t);
  fixture.silence();
  const connection = await connectBand({});
  const request = connection.readBattery();
  const timeout = assert.rejects(request, /10 segundos/);
  await assert.rejects(connection.readBattery(), /andamento/);
  fixture.emit(makePrimaryCommand(0x73));
  t.mock.timers.tick(10_000);
  await timeout;
  const retry = connection.readBattery();
  fixture.emit(makePrimaryCommand(3, new Uint8Array([50])));
  assert.deepEqual(await retry, { level: 50, charging: false });
  connection.disconnect();
});

test("remote disconnect rejects a pending query and notifies once", async (t) => {
  const fixture = setup(t);
  fixture.silence();
  let disconnected = 0;
  const connection = await connectBand({ onDisconnect: () => disconnected++ });
  const failed = assert.rejects(connection.readBattery(), /desconectou/);
  fixture.device.gatt.disconnect();
  await failed;
  connection.disconnect();
  assert.equal(disconnected, 1);
});

test("abort disconnects and rejects a pending query", async (t) => {
  const fixture = setup(t);
  fixture.silence();
  const controller = new AbortController();
  const connection = await connectBand({ signal: controller.signal });
  const failed = assert.rejects(connection.readBattery(), /desconectou/);
  controller.abort();
  await failed;
  assert.equal(fixture.device.gatt.connected, false);
});
