import { Button } from "@/components/ui/button"

type ControlPanelProps = {
  price: number
  threshold: number
  basePrice: number
  running: boolean
  onPriceChange: (value: number) => void
  onRun: () => void
  onReset: () => void
}

export function ControlPanel({
  price,
  threshold,
  basePrice,
  running,
  onPriceChange,
  onRun,
  onReset,
}: ControlPanelProps) {
  return (
    <div className="rounded-2xl border border-[#001F5B]/10 bg-white/70 p-4 shadow-[0_10px_24px_rgba(0,31,91,0.06)]">
      <div className="text-xs uppercase tracking-[0.2em] text-[#001F5B]/60">Control Panel</div>
      <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label
            htmlFor="market-crash"
            className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-[#001F5B]/60"
          >
            Simulate Market Crash
          </label>
          <input
            id="market-crash"
            type="range"
            min={2800}
            max={3700}
            step={10}
            value={price}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#001F5B]/20 accent-[#C5A059]"
          />
          <div className="mt-2 flex items-center justify-between font-mono text-xs text-[#001F5B]/65">
            <span>Now: ${price.toLocaleString()}</span>
            <span>Threshold: ${threshold.toLocaleString()}</span>
            <span>Ref: ${basePrice.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button variant="hero" size="hero" disabled={running} onClick={onRun}>
            执行完整演示
          </Button>
          <Button variant="heroSecondary" size="hero" onClick={onReset}>
            重置
          </Button>
        </div>
      </div>
    </div>
  )
}

