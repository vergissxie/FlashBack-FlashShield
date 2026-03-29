import { motion, useReducedMotion } from "framer-motion"

const cards = [
  {
    id: "origin",
    title: "源合约 Origin",
    accent: "from-red-500/25 to-transparent",
    body: "在链上暴露业务事件（如价格跌破阈值），供睿应层订阅。",
    hint: "emit EVM 事件（例：PriceDropped）· 可选现成合约或自研 Oracle",
  },
  {
    id: "reactive",
    title: "睿应式合约 Reactive",
    accent: "from-cyan-400/30 to-transparent",
    body: "监听源链日志，自动编排并触发目标链交易，无需自建 indexer 轮询。",
    hint: "subscribe + react · emit Callback 至目标合约",
  },
  {
    id: "dest",
    title: "目标合约 Destination",
    accent: "from-emerald-500/25 to-transparent",
    body: "接收跨链回调，完成对冲或风控动作，形成可验证的链上记录。",
    hint: "仅信任授权 Callback 来源 · 产生可提交的 tx 哈希",
  },
] as const

/**
 * 技术架构：3D 分层卡片（透视 + hover 旋转）+ 滚动逐个解锁 + 能量填充
 */
export function ArchitectureSection() {
  const reduce = useReducedMotion()

  return (
    <section className="container py-20 md:py-28" aria-labelledby="arch-title">
      <h2
        id="arch-title"
        className="text-center text-2xl font-semibold tracking-tight text-hero-heading md:text-3xl"
      >
        三层架构 · 全自动编排
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-hero-sub md:text-base">
        源合约暴露风险事件 → 睿应式合约监听并触发 → 目标合约完成执行；滚动以「解锁」每一层能量。
      </p>
      <div
        className="mt-12 grid gap-6 md:grid-cols-3"
        style={{ perspective: "1200px" }}
      >
        {cards.map((c, i) => (
          <motion.article
            key={c.id}
            className="group relative"
            initial={{ opacity: 0, y: 36, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: reduce ? 0 : i * 0.12, duration: 0.55 }}
          >
            <motion.div
              className="relative h-full min-h-[220px] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-black/60 via-white/[0.06] to-transparent p-6 shadow-[0_0_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10 backdrop-blur-lg"
              whileHover={
                reduce
                  ? {}
                  : { rotateY: -6, rotateX: 4, scale: 1.02, z: 20 }
              }
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
              />
              <motion.div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(34,211,238,0.35),transparent_55%)]"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.1 }}
              />
              <h3 className="relative text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="relative mt-2 text-sm text-hero-sub">{c.body}</p>
              <p className="relative mt-6 text-xs font-mono text-cyan-300/0 transition-all duration-300 group-hover:text-cyan-200 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.65)]">
                {c.hint}
              </p>
            </motion.div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
