/** Bluetooth SIG Heart Rate Measurement: flags + unsigned 8/16-bit bpm. */
export function parseHeartRate(view: DataView): number {
  if (view.byteLength < 2) throw new Error("Pacote de frequência cardíaca incompleto.");
  const wide = (view.getUint8(0) & 0x01) !== 0;
  if (wide && view.byteLength < 3) throw new Error("Pacote de frequência cardíaca incompleto.");
  const bpm = wide ? view.getUint16(1, true) : view.getUint8(1);
  if (bpm === 0) throw new Error("Leitura de frequência cardíaca inválida.");
  return bpm;
}
