// UUIDv7: 48 bits of time, then random, so new rows land at the end of their index.
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const view = new DataView(bytes.buffer);
  const now = Date.now();
  view.setUint32(0, Math.floor(now / 2 ** 16));
  view.setUint16(4, now % 2 ** 16);
  view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x70); // version 7
  view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80); // variant

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
