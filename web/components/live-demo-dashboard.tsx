"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";

import { positionRiskSimulatorAbi } from "@/lib/abis";
import { contractConfig } from "@/lib/contracts";

type PositionState = {
  entryPrice: string;
  markPrice: string;
  liquidationThreshold: string;
  status: number;
  stage: "Safe" | "Watch" | "NearLiquidation" | "Triggered";
  note: string;
  riskScore: number;
} | null;

type DemoState = {
  ok: boolean;
  message?: string;
  strategyId: string;
  position: PositionState;
  protection: {
    appliesToRequestedStrategy: boolean;
    riskBalance: string;
    stableBalance: string;
    amountProtected: string;
    currentStatus: number;
    strategyId: string;
    triggerPrice: string;
    action: number;
  };
  callback: {
    originChain: string;
    destinationChain: string;
    callbackProxy: string;
    rvmId: string;
  };
};

type WalletState = {
  connected: boolean;
  address: string;
  network: string;
  status: string;
};

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function shortAddress(value: string) {
  if (!value) {
    return "未连接";
  }
  if (value.length < 10) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function positionStageLabel(status: number) {
  if (status === 2) {
    return "已清算";
  }
  if (status === 1) {
    return "接近清算";
  }
  return "已开仓";
}

function timelineStageLabel(stage: NonNullable<PositionState>["stage"]) {
  if (stage === "Triggered") {
    return "已触发";
  }
  if (stage === "NearLiquidation") {
    return "接近清算";
  }
  if (stage === "Watch") {
    return "观察中";
  }
  return "安全";
}

function protectionStatusLabel(state: DemoState | null) {
  if (!state) {
    return "未读取";
  }
  if (!state.protection.appliesToRequestedStrategy) {
    return "未触发";
  }
  if (state.protection.currentStatus === 1) {
    return "已保护";
  }
  if (state.protection.currentStatus === 2) {
    return "等待恢复";
  }
  if (state.protection.currentStatus === 3) {
    return "已恢复";
  }
  return "空闲";
}

async function fetchDemoState(strategyId: string): Promise<DemoState> {
  const response = await fetch(`/api/demo-state?strategyId=${encodeURIComponent(strategyId)}`, {
    cache: "no-store",
  });
  return response.json() as Promise<DemoState>;
}

export function LiveDemoDashboard() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: "",
    network: "未连接",
    status: "钱包未连接",
  });
  const [strategyId, setStrategyId] = useState("FS-LIVE");
  const [entryPrice, setEntryPrice] = useState("100");
  const [liquidationThreshold, setLiquidationThreshold] = useState("85");
  const [markPrice, setMarkPrice] = useState("88");
  const [displayMarkPrice, setDisplayMarkPrice] = useState("100");
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [feedback, setFeedback] = useState("先连接钱包，然后点击“1. 开启演示仓位”。");
  const [busyAction, setBusyAction] = useState<"connect" | "open" | "trigger" | "refresh" | null>(null);
  const [isAnimatingPrice, setIsAnimatingPrice] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  const strategyIdBytes = useMemo(() => ethers.encodeBytes32String(strategyId), [strategyId]);

  useEffect(() => {
    void hydrateWallet();

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAnimatingPrice && demoState?.position) {
      setDisplayMarkPrice(demoState.position.markPrice);
    }
  }, [demoState, isAnimatingPrice]);

  async function refreshState(targetStrategyId: string) {
    if (!targetStrategyId.trim()) {
      setFeedback("请先填写策略 ID。");
      return null;
    }

    setBusyAction((current) => current ?? "refresh");

    try {
      const nextState = await fetchDemoState(targetStrategyId);
      setDemoState(nextState);
      if (nextState.ok) {
        if (nextState.position) {
          setFeedback(`已加载 ${targetStrategyId} 的链上实时状态。`);
        } else {
          setFeedback(`策略 ${targetStrategyId} 还没有开仓，当前只显示空状态。`);
        }
      } else {
        setFeedback(nextState.message || "读取链上实时状态失败。");
      }
      return nextState;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback(`刷新状态失败：${message}`);
      return null;
    } finally {
      setBusyAction((current) => (current === "refresh" ? null : current));
    }
  }

  async function pollForProtection(targetStrategyId: string) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const nextState = await fetchDemoState(targetStrategyId);
      setDemoState(nextState);

      if (nextState.protection.appliesToRequestedStrategy) {
        setFeedback(`Reactive 回调已完成，${targetStrategyId} 已在 B 链执行保护。`);
        return;
      }

      setFeedback(`正在等待 Reactive 回调落到 B 链... 第 ${attempt + 1} 次查询`);
      await new Promise((resolve) => window.setTimeout(resolve, 4000));
    }

    setFeedback("A 链事件已触发，但 B 链结果尚未显示。你可以稍后手动点一次“刷新状态”。");
  }

  async function hydrateWallet() {
    if (!window.ethereum) {
      setWallet({
        connected: false,
        address: "",
        network: "无钱包",
        status: "请安装 MetaMask 或其他 EVM 钱包。",
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      if (accounts.length === 0) {
        setWallet({
          connected: false,
          address: "",
          network: "未连接",
          status: "先连接钱包，才能一键触发演示。",
        });
        return;
      }

      const userConnected = window.localStorage.getItem("flashshield_wallet_connected") === "1";
      if (!userConnected) {
        setWallet({
          connected: false,
          address: "",
          network: "未连接",
          status: "浏览器中已有授权，但本页尚未连接。",
        });
        return;
      }

      const network = await provider.getNetwork();
      setWallet({
        connected: true,
        address: accounts[0],
        network: `${network.name} (${network.chainId.toString()})`,
        status: "钱包已连接",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setWallet({
        connected: false,
        address: "",
        network: "不可用",
        status: `读取钱包失败：${message}`,
      });
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setFeedback("浏览器中未发现钱包扩展。");
      return;
    }

    setBusyAction("connect");

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      window.localStorage.setItem("flashshield_wallet_connected", "1");
      await hydrateWallet();
      setFeedback("钱包已连接，现在可以直接在页面上触发演示。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback(`连接钱包失败：${message}`);
    } finally {
      setBusyAction(null);
    }
  }

  function disconnectWallet() {
    window.localStorage.removeItem("flashshield_wallet_connected");
    setWallet({
      connected: false,
      address: "",
      network: "未连接",
      status: "已断开本页连接。若要彻底取消站点授权，请在钱包扩展里手动移除。",
    });
  }

  async function withOriginSigner<T>(task: (contract: ethers.Contract) => Promise<T>) {
    if (!window.ethereum) {
      throw new Error("浏览器里没有可用钱包。");
    }

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      contractConfig.positionRiskSimulatorAddress,
      positionRiskSimulatorAbi,
      signer
    );

    return task(contract);
  }

  async function animatePriceDrop(targetPrice: number, durationMs: number) {
    const startPrice = Number(displayMarkPrice || demoState?.position?.markPrice || entryPrice || 100);
    const safeTargetPrice = Number.isFinite(targetPrice) ? targetPrice : startPrice;

    setIsAnimatingPrice(true);
    setFeedback("交易已发出，正在播放价格滑落动画...");

    await new Promise<void>((resolve) => {
      const startTime = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - (1 - progress) * (1 - progress);
        const nextValue = startPrice + (safeTargetPrice - startPrice) * eased;
        setDisplayMarkPrice(nextValue.toFixed(2));

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(step);
          return;
        }

        resolve();
      };

      animationFrameRef.current = window.requestAnimationFrame(step);
    });

    setIsAnimatingPrice(false);
  }

  async function openDemoPosition() {
    setBusyAction("open");

    try {
      const receipt = await withOriginSigner(async (contract) => {
        const tx = await contract.openPosition(
          strategyIdBytes,
          BigInt(entryPrice),
          BigInt(liquidationThreshold)
        );
        return tx.wait();
      });

      setDisplayMarkPrice(entryPrice);
      setFeedback(`已完成开仓，A 链交易哈希：${receipt.hash}`);
      await refreshState(strategyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback(`开仓失败：${message}`);
    } finally {
      setBusyAction(null);
    }
  }

  async function triggerNearLiquidation() {
    setBusyAction("trigger");

    try {
      const tx = await withOriginSigner(async (contract) => {
        return contract.updateMarkPrice(strategyIdBytes, BigInt(markPrice));
      });

      await Promise.all([tx.wait(), animatePriceDrop(Number(markPrice), 2200)]);

      setFeedback(`A 链已提交风险事件，正在自动轮询 B 链结果。交易哈希：${tx.hash}`);
      await refreshState(strategyId);
      await pollForProtection(strategyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFeedback(`触发失败：${message}`);
      if (demoState?.position) {
        setDisplayMarkPrice(demoState.position.markPrice);
      }
      setIsAnimatingPrice(false);
    } finally {
      setBusyAction(null);
    }
  }

  const appliesToCurrentStrategy = demoState?.protection.appliesToRequestedStrategy ?? false;
  const protectedRiskBalance = appliesToCurrentStrategy ? `${demoState?.protection.riskBalance}%` : "未触发";
  const protectedStableBalance = appliesToCurrentStrategy ? `${demoState?.protection.stableBalance}%` : "未触发";
  const protectedAmount = appliesToCurrentStrategy ? `${demoState?.protection.amountProtected}%` : "未触发";

  return (
    <main className="shell">
      <section className="hero panel">
        <div className="hero__copy">
          <p className="eyebrow">FlashShield / Reactive cross-chain demo</p>
          <h1>A 链产生风险，B 链自动保护。</h1>
          <p className="lede">
            这个页面会读取真实链上状态，并允许你直接通过浏览器钱包触发演示流程。
          </p>
          <div className="hero__pills">
            <span className="pill pill--teal">真钱包连接</span>
            <span className="pill pill--amber">A 链真实写入</span>
            <span className="pill pill--olive">B 链真实读取</span>
          </div>
        </div>

        <aside className="wallet-card">
          <div className="wallet-card__top">
            <span className="wallet-card__status">{wallet.status}</span>
            <div className="wallet-actions">
              <button
                type="button"
                className="wallet-card__button"
                onClick={connectWallet}
                disabled={busyAction === "connect" || wallet.connected}
              >
                {wallet.connected ? "钱包已连接" : busyAction === "connect" ? "连接中..." : "连接钱包"}
              </button>
              <button
                type="button"
                className="action-button action-button--ghost"
                onClick={disconnectWallet}
                disabled={!wallet.connected}
              >
                断开本页连接
              </button>
            </div>
          </div>
          <dl className="wallet-grid">
            <div>
              <dt>钱包地址</dt>
              <dd>{wallet.connected ? shortAddress(wallet.address) : "未连接"}</dd>
            </div>
            <div>
              <dt>当前网络</dt>
              <dd>{wallet.network}</dd>
            </div>
            <div>
              <dt>策略 ID</dt>
              <dd>{strategyId}</dd>
            </div>
            <div>
              <dt>执行器状态</dt>
              <dd>{protectionStatusLabel(demoState)}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="panel control-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">控制台</p>
            <h2>直接在页面里开仓并触发风险</h2>
          </div>
          <button
            type="button"
            className="action-button action-button--secondary"
            onClick={() => void refreshState(strategyId)}
            disabled={busyAction !== null || !strategyId.trim()}
          >
            {busyAction === "refresh" ? "刷新中..." : "刷新状态"}
          </button>
        </div>

        <div className="control-grid">
          <label className="field">
            <span>策略 ID</span>
            <input value={strategyId} onChange={(event) => setStrategyId(event.target.value || "FS-LIVE")} />
          </label>
          <label className="field">
            <span>开仓价格</span>
            <input value={entryPrice} onChange={(event) => setEntryPrice(event.target.value)} />
          </label>
          <label className="field">
            <span>清算阈值</span>
            <input
              value={liquidationThreshold}
              onChange={(event) => setLiquidationThreshold(event.target.value)}
            />
          </label>
          <label className="field">
            <span>目标触发价</span>
            <input value={markPrice} onChange={(event) => setMarkPrice(event.target.value)} />
          </label>
        </div>

        <div className="action-row">
          <button
            type="button"
            className="action-button"
            onClick={openDemoPosition}
            disabled={!wallet.connected || busyAction !== null}
          >
            {busyAction === "open" ? "开仓中..." : "1. 开启演示仓位"}
          </button>
          <button
            type="button"
            className="action-button action-button--secondary"
            onClick={triggerNearLiquidation}
            disabled={!wallet.connected || busyAction !== null || !demoState?.position}
          >
            {busyAction === "trigger" ? "触发中..." : "2. 触发接近清算"}
          </button>
        </div>

        <p className="feedback">{feedback}</p>
      </section>

      <section className="grid">
        <article className="panel timeline">
          <div className="section-head">
            <div>
              <p className="eyebrow">A 链仓位</p>
              <h2>实时仓位状态</h2>
            </div>
            <span className="section-head__tag">
              {demoState?.position ? positionStageLabel(demoState.position.status) : "未开仓"}
            </span>
          </div>

          {demoState?.position ? (
            <div className="timeline-list">
              <div className="timeline-row">
                <div className="timeline-row__meta">
                  <div>
                    <strong>{strategyId}</strong>
                    <p>
                      {isAnimatingPrice
                        ? "你已经签名发起本次动作，页面正在播放价格滑落，随后自动轮询 B 链结果。"
                        : demoState.position.note}
                    </p>
                  </div>
                  <span className={`badge badge-${demoState.position.stage.toLowerCase()}`}>
                    {timelineStageLabel(demoState.position.stage)}
                  </span>
                </div>
                <div className="timeline-row__bars">
                  <div className="timeline-row__price">
                    <span>开仓价</span>
                    <strong>{`$${demoState.position.entryPrice}`}</strong>
                  </div>
                  <div className="timeline-row__track" aria-hidden="true">
                    <span style={{ width: `${demoState.position.riskScore}%` }} />
                  </div>
                  <div className="timeline-row__risk">
                    <span>{isAnimatingPrice ? "动画价" : "当前价"}</span>
                    <strong>{`$${displayMarkPrice}`}</strong>
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-card">
                  <dt>清算阈值</dt>
                  <dd>{`$${demoState.position.liquidationThreshold}`}</dd>
                </div>
                <div className="detail-card">
                  <dt>策略 bytes32</dt>
                  <dd>{shortAddress(strategyIdBytes)}</dd>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              当前策略还没有开仓。你可以直接点击“1. 开启演示仓位”，或者输入一个历史策略 ID 再点“刷新状态”。
            </div>
          )}
        </article>

        <article className="panel callback">
          <div className="section-head">
            <div>
              <p className="eyebrow">Reactive 回调</p>
              <h2>B 链实时执行状态</h2>
            </div>
            <span className="section-head__tag section-head__tag--active">
              {protectionStatusLabel(demoState)}
            </span>
          </div>

          {demoState ? (
            <>
              <dl className="callback-grid">
                <div>
                  <dt>源链</dt>
                  <dd>{demoState.callback.originChain}</dd>
                </div>
                <div>
                  <dt>目标链</dt>
                  <dd>{demoState.callback.destinationChain}</dd>
                </div>
                <div>
                  <dt>回调代理</dt>
                  <dd>{shortAddress(demoState.callback.callbackProxy)}</dd>
                </div>
                <div>
                  <dt>RVM ID</dt>
                  <dd>{shortAddress(demoState.callback.rvmId)}</dd>
                </div>
                <div>
                  <dt>最后一次策略</dt>
                  <dd>{demoState.protection.strategyId || "暂无"}</dd>
                </div>
                <div>
                  <dt>触发价格</dt>
                  <dd>
                    {appliesToCurrentStrategy ? `$${demoState.protection.triggerPrice}` : "当前策略尚未触发"}
                  </dd>
                </div>
              </dl>

              <div className="flow">
                <div className="flow__step flow__step--done">A 链写入</div>
                <div className="flow__line" />
                <div className="flow__step flow__step--done">Reactive 回调</div>
                <div className="flow__line" />
                <div className="flow__step flow__step--done">B 链读取</div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              这里会在你触发接近清算并完成 Reactive 回调后，显示 B 链执行结果。
            </div>
          )}
        </article>
      </section>

      <section className="panel comparison">
        <div className="section-head">
          <div>
            <p className="eyebrow">结果对比</p>
            <h2>实时保护结果 vs 基准状态</h2>
          </div>
          <span className="section-head__tag">真实 B 链状态</span>
        </div>

        <div className="comparison-grid">
          <article className="result-panel">
            <div className="result-panel__head">
              <div>
                <p className="eyebrow">未保护基准</p>
                <h3>100% 风险侧暴露</h3>
              </div>
              <span className="accent-dot accent-dot-amber" />
            </div>
            <dl className="result-metrics">
              <div>
                <dt>风险资产</dt>
                <dd>100%</dd>
              </div>
              <div>
                <dt>稳定资产</dt>
                <dd>0%</dd>
              </div>
              <div>
                <dt>说明</dt>
                <dd>没有执行自动保护。</dd>
              </div>
            </dl>
            <div className="result-panel__rail">
              <span className="result-panel__fill result-panel__fill-amber" />
            </div>
          </article>

          <article className="result-panel">
            <div className="result-panel__head">
              <div>
                <p className="eyebrow">当前策略结果</p>
                <h3>{protectionStatusLabel(demoState)}</h3>
              </div>
              <span className="accent-dot accent-dot-emerald" />
            </div>
            <dl className="result-metrics">
              <div>
                <dt>风险资产</dt>
                <dd>{protectedRiskBalance}</dd>
              </div>
              <div>
                <dt>稳定资产</dt>
                <dd>{protectedStableBalance}</dd>
              </div>
              <div>
                <dt>已保护比例</dt>
                <dd>{protectedAmount}</dd>
              </div>
            </dl>
            <p className="result-note">
              当前 P0 版本的 B 链策略参数固定为 80%。这里展示的是链上实际返回值，不是前端临时伪造数据。
            </p>
            <div className="result-panel__rail">
              <span className="result-panel__fill result-panel__fill-emerald" />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
