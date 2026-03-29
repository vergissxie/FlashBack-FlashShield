/** 根据当前 ETH/USD 价格生成折线图数据点（前端演示用，确定性曲线） */
export function buildChartPoints(price: number): { t: string; value: number }[] {
  const n = 18
  const out: { t: string; value: number }[] = []
  for (let i = 0; i < n; i++) {
    const v = price + Math.sin(i * 0.55) * 38 + (i - n / 2) * 6.5
    out.push({
      t: `-${(n - i) * 3}s`,
      value: Math.round(v * 100) / 100,
    })
  }
  out.push({ t: "now", value: Math.round(price * 100) / 100 })
  return out
}

export function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n)
}

export function shortenAddr(a: string) {
  if (a.length < 12) return a
  return `${a.slice(0, 5)}...${a.slice(-4)}`
}

/** 演示用 32-byte 样式 tx hash（非链上真实） */
export function demoPlaceholderTxHash() {
  const mid = Date.now().toString(16).padStart(12, "0")
  return `0x${mid}${"0".repeat(52)}`.slice(0, 66)
}
