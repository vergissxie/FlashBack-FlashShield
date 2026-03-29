import type { HedgeHistoryRow } from "./types"
import { shortenAddr } from "./utils"

type HistoryTableProps = {
  rows: HedgeHistoryRow[]
}

export function HistoryTable({ rows }: HistoryTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 backdrop-blur-md">
      <div className="border-b border-[#0A1F3F]/15 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#0A1F3F]">对冲历史记录</h3>
        <p className="text-[11px] text-[#0A1F3F]/50">
          含「目标链 Tx」列便于对照赛方要求的交易哈希记录；链上跑通后请将哈希写入 .env 或接入索引
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-[#F2EEE8] text-[#0A1F3F]/65">
            <tr>
              <th className="px-4 py-2 font-medium">时间</th>
              <th className="px-4 py-2 font-medium">触发价格</th>
              <th className="px-4 py-2 font-medium">对冲链</th>
              <th className="px-4 py-2 font-medium">规模</th>
              <th className="px-4 py-2 font-medium">预估盈亏</th>
              <th className="px-4 py-2 font-medium">目标链 Tx</th>
              <th className="px-4 py-2 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#0A1F3F]/10 hover:bg-[#F2EEE8]">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[#0A1F3F]/70">{r.time}</td>
                <td className="px-4 py-2.5 font-mono text-[#0A1F3F]/85">{r.triggerPrice}</td>
                <td className="px-4 py-2.5 text-[#0A1F3F]/70">{r.hedgeChain}</td>
                <td className="px-4 py-2.5 font-mono text-[#0A1F3F]">{r.size}</td>
                <td className="px-4 py-2.5 font-mono text-[#036652]">{r.estPnl}</td>
                <td className="max-w-[140px] px-4 py-2.5 font-mono text-[10px] text-[#0A1F3F]/70">
                  {r.destTxHash ? shortenAddr(r.destTxHash) : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      r.status === "success"
                        ? "rounded-full bg-[#036652]/12 px-2 py-0.5 text-[#036652]"
                        : "rounded-full bg-[#B07C2D]/15 px-2 py-0.5 text-[#B07C2D]"
                    }
                  >
                    {r.status === "success" ? "已执行" : "待确认"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
