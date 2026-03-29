type ControlPanelProps = {
  walletConnected: boolean
  monitorArmed: boolean
  ethPrice: number
  onPriceChange: (v: number) => void
  asset: string
  onAssetChange: (v: string) => void
  threshold: number
  onThresholdChange: (v: number) => void
  hedgeRatio: number
  onHedgeRatioChange: (v: number) => void
  onSimulateCrash: () => void
  onStartMonitoring: () => void
  onReset: () => void
  disabled: boolean
}

export function ControlPanel({
  walletConnected,
  monitorArmed,
  ethPrice,
  onPriceChange,
  asset,
  onAssetChange,
  threshold,
  onThresholdChange,
  hedgeRatio,
  onHedgeRatioChange,
  onSimulateCrash,
  onStartMonitoring,
  onReset,
  disabled,
}: ControlPanelProps) {
  return (
    <aside
      className={`rounded-2xl border p-4 backdrop-blur-md transition ${
        walletConnected
          ? "border-[#0A1F3F]/20 bg-[#FAF9F6]/90 shadow-[0_8px_20px_rgba(10,31,63,0.08)]"
          : "border-[#0A1F3F]/15 bg-[#F2EEE8]/70 opacity-80"
      }`}
    >
      <h3 className="border-b border-[#0A1F3F]/15 pb-2 text-sm font-semibold text-[#0A1F3F]">
        参数配置与演示控制
      </h3>
      <p className="mt-2 text-[11px] leading-relaxed text-[#0A1F3F]/55">
        本面板为赛方验收配套的<strong className="font-medium text-[#0A1F3F]/75">流程编排演示</strong>
        ：真实系统须部署<strong className="font-medium text-[#0A1F3F]/75">源合约、睿应式合约、目标合约</strong>
        ，由睿应监听 EVM 事件并触发目标链交易；滑块与按钮对应链上请改为 crashPrice / 浏览器可查的 tx 记录。
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs text-[#0A1F3F]/65">监控资产</label>
          <select
            value={asset}
            onChange={(e) => onAssetChange(e.target.value)}
            disabled={disabled || !walletConnected}
            className="mt-1 w-full rounded-lg border border-[#0A1F3F]/20 bg-[#FAF9F6] px-3 py-2 text-sm text-[#0A1F3F] outline-none ring-[#0A1F3F]/20 focus:ring-2"
          >
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
            <option value="SOL">SOL</option>
          </select>
        </div>

        <div>
          <label className="flex justify-between text-xs text-[#0A1F3F]/65">
            <span>A 链 ETH / USD（模拟）</span>
            <span className="font-mono text-[#0A1F3F]">${ethPrice.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={3000}
            max={3500}
            step={0.5}
            value={ethPrice}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            disabled={disabled || !walletConnected}
            className="mt-2 w-full accent-[#0A1F3F]"
          />
          <p className="mt-1 text-[10px] text-[#0A1F3F]/50">范围 $3,000 – $3,500</p>
        </div>

        <div>
          <label className="flex justify-between text-xs text-[#0A1F3F]/65">
            <span>触发阈值 (USD)</span>
            <span className="font-mono text-[#0A1F3F]">${threshold.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={3000}
            max={3500}
            step={1}
            value={threshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            disabled={disabled || !walletConnected}
            className="mt-2 w-full accent-[#0A1F3F]"
          />
        </div>

        <div>
          <label className="flex justify-between text-xs text-[#0A1F3F]/65">
            <span>对冲比例</span>
            <span className="font-mono text-[#036652]">{hedgeRatio.toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={50}
            max={150}
            step={1}
            value={hedgeRatio}
            onChange={(e) => onHedgeRatioChange(Number(e.target.value))}
            disabled={disabled || !walletConnected}
            className="mt-2 w-full accent-[#036652]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onStartMonitoring}
            className="rounded-xl bg-[#0A1F3F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102f5e] disabled:opacity-50"
          >
            {!walletConnected
              ? "开始监控（请先连接钱包）"
              : monitorArmed
                ? "监控已启动"
                : "开始监控"}
          </button>
          {/**
           * 模拟价格暴跌：演示完整编排。
           * 实际集成：此处应订阅 A 链预言机价格；当 price &lt; threshold 时由 keeper / Reactive
           * 合约触发跨链消息（如 LayerZero / Hyperlane），并在 B 链调用对冲合约开仓。
           */}
          <button
            type="button"
            disabled={disabled || !walletConnected || !monitorArmed}
            onClick={onSimulateCrash}
            className="rounded-xl bg-[#B7410E] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(183,65,14,0.25)] transition hover:bg-[#c3521e] disabled:opacity-50"
          >
            模拟价格暴跌
          </button>
          {/**
           * 重置：恢复演示初始状态。
           * 实际集成：可改为断开 WS、清空本地缓存等。
           */}
          <button
            type="button"
            disabled={disabled}
            onClick={onReset}
            className="rounded-xl border border-[#0A1F3F]/20 bg-[#E9E8E4] px-4 py-2.5 text-sm text-[#0A1F3F] transition hover:bg-[#dfddd6] disabled:opacity-50"
          >
            重置
          </button>
        </div>
      </div>
    </aside>
  )
}
