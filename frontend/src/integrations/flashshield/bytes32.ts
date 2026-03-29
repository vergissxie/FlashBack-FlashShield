import type { Hex } from "viem"

/** 与 ethers.encodeBytes32String 一致：UTF-8 右补零至 32 字节 */
export function encodeBytes32String(value: string): Hex {
  const bytes = new TextEncoder().encode(value)
  if (bytes.length > 31) {
    throw new Error("Strategy id too long (max 31 bytes)")
  }
  const buf = new Uint8Array(32)
  buf.set(bytes)
  return `0x${[...buf].map((b) => b.toString(16).padStart(2, "0")).join("")}` as Hex
}
