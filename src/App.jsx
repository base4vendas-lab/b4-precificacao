import { useState, useEffect } from "react";

const STORAGE_KEY = "b4-app-data";

function calcProduct(p, cfg) {
  const divisor = 1 - (cfg.impostos + cfg.taxas + cfg.margem);
  const freteUnit = p.qtd > 0 ? p.freteLote / p.qtd : 0;
  const c1 = p.peca + p.estamparia + freteUnit + p.embalagem;
  const c2 = c1 * cfg.reserva;
  const base = c1 + c2;
  const preco = divisor > 0 ? base / divisor : 0;
  const lucro = preco * cfg.margem;
  const caixaLote = c2 * p.qtd;
  return { freteUnit, c1, c2, base, preco, lucro, caixaLote };
}

function calcPainel(products, cfg) {
  let receitaTotal=0, custoTotal=0, reservaTotal=0, lucroTotal=0, qtdTotal=0;
  products.forEach(p => {
    const r = calcProduct(p, cfg);
    receitaTotal += r.preco * p.qtd; custoTotal += r.c1 * p.qtd;
    reservaTotal += r.caixaLote; lucroTotal += r.lucro * p.qtd; qtdTotal += p.qtd;
  });
  return { receitaTotal, custoTotal, reservaTotal, lucroTotal,
    margemPct: receitaTotal > 0 ? lucroTotal/receitaTotal : 0,
    caixaPorPeca: qtdTotal > 0 ? reservaTotal/qtdTotal : 0, qtdTotal };
}

const R = v => `R$ ${(v||0).toFixed(2).replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g,".")}`;
const P = v => `${((v||0)*100).toFixed(1)}%`;

const defaultCfg = { impostos:0.06, taxas:0.035, margin:0.30, reserva:0.175 };
const newProduct = (n) => ({ id:Date.now()+n, nome:"", peca:0, estamparia:0, freteLote:0, qtd:1, embalagem:0, expanded:true });
const defaultSim = { recebido:0, pecas:0, estamparia:0, corte:0, frete:0, outros:0 };

export default function MainApp() {
  const [tab, setTab] = useState("home");
  const [products, setProducts] = useState([newProduct(0)]);
  const [simulador, setSimulador] = useState(defaultSim);

  useEffect(() => {
    try {
      const r = localStorage.getItem(STORAGE_KEY);
      if (r) {
        const saved = JSON.parse(r);
        if (saved.products) setProducts(saved.products);
        if (saved.simulador) setSimulador(saved.simulador);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, simulador })); } catch (e) {}
  }, [products, simulador]);

  const active = products.filter(p=>p.peca>0);
  const painel = calcPainel(active, defaultCfg);
  const tc = simulador.pecas+simulador.estamparia+simulador.corte+simulador.frete+simulador.outros;
  const mb = simulador.recebido - tc;

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", color: "#f5f5f5", fontFamily: "system-ui, sans-serif", padding: "16px", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        
        {/* Menu Superior Simples */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "#1a1a1a", padding: "6px", borderRadius: "10px" }}>
          <button onClick={() => setTab("home")} style={{ flex: 1, padding: "10px", background: tab==="home"?"#f97316":"transparent", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "bold" }}>Início</button>
          <button onClick={() => setTab("orcamento")} style={{ flex: 1, padding: "10px", background: tab==="orcamento"?"#f97316":"transparent", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "bold" }}>Orçamento</button>
          <button onClick={() => setTab("simulador")} style={{ flex: 1, padding: "10px", background: tab==="simulador"?"#f97316":"transparent", border: "none", color: "#fff", borderRadius: "8px", fontWeight: "bold" }}>Simulador</button>
        </div>

        {/* TELA: HOME */}
        {tab === "home" && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "#f97316" }}>B4 Custom Fitness</h2>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>Painel de Controle Financeiro</span>
            </div>
            
            <div style={{ background: "linear-gradient(135deg, #1a1a1a, #26170c)", padding: "16px", borderRadius: "12px", border: "1px solid #f9731644", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#f97316", fontWeight: "bold" }}>FATURAMENTO ATUAL DO PEDIDO</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", margin: "4px 0" }}>{R(painel.receitaTotal)}</div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>{painel.qtdTotal} peças em {active.length} modelo(s)</div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <div style={{ flex: 1, background: "#052e16", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid #22c55e33" }}>
                <div style={{ fontSize: "10px", color: "#22c55e", fontWeight: "bold" }}>C1 - CUSTO REAL</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#22c55e" }}>{R(painel.custoTotal)}</div>
              </div>
              <div style={{ flex: 1, background: "#422006", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid #eab30833" }}>
                <div style={{ fontSize: "10px", color: "#eab308", fontWeight: "bold" }}>C2 - CAIXA (🛡️)</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#eab308" }}>{R(painel.reservaTotal)}</div>
              </div>
              <div style={{ flex: 1, background: "#064e3b", padding: "12px", borderRadius: "10px", textAlign: "center", border: "1px solid #10b98133" }}>
                <div style={{ fontSize: "10px", color: "#10b981", fontWeight: "bold" }}>C3 - LUCRO REAL</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#10b981" }}>{R(painel.lucroTotal)}</div>
              </div>
            </div>

            <div style={{ background: "#1a1a1a", padding: "14px", borderRadius: "12px", border: "1px solid #2a2a2a", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold" }}>VALOR QUE ENTRA NO CAIXA POR PEÇA VENDIDA</div>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: "#eab308", margin: "4px 0" }}>{R(painel.caixaPorPeca)}</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Guarde este valor para comprar seus maquinários!</div>
            </div>
          </div>
        )}

        {/* TELA: ORÇAMENTO */}
        {tab === "orcamento" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Montar Orçamento</h3>
              <button onClick={() => setProducts([...products, newProduct(products.length)])} style={{ background: "#f97316", border: "none", color: "#fff", padding: "8px 12px", borderRadius: "8px", fontWeight: "bold" }}>+ Adicionar Produto</button>
            </div>

            {products.map((p, idx) => {
              const r = calcProduct(p, defaultCfg);
              return (
                <div key={p.id} style={{ background: "#1a1a1a", padding: "14px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #2a2a2a" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <input value={p.nome} onChange={e => setProducts(products.map(x=>x.id===p.id?{...x, nome:e.target.value}:x))} placeholder={`Nome do Modelo (Ex: Hoodie B4)`} style={{ flex: 1, background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px" }} />
                    <button onClick={() => setProducts(products.filter(x=>x.id!==p.id))} style={{ background: "#ef444422", border: "1px solid #ef444444", color: "#ef4444", padding: "0 10px", borderRadius: "6px" }}>Excluir</button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                    <div>
                      <label style={{ color: "#9ca3af" }}>Peça Base (R$ NF)</label>
                      <input type="number" value={p.peca||""} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x, peca:parseFloat(e.target.value)||0}:x))} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px", marginTop: "2px" }} />
                    </div>
                    <div>
                      <label style={{ color: "#9ca3af" }}>Estamparia (R$ DTF/Foil)</label>
                      <input type="number" value={p.estamparia||""} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x, estamparia:parseFloat(e.target.value)||0}:x))} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px", marginTop: "2px" }} />
                    </div>
                    <div>
                      <label style={{ color: "#9ca3af" }}>Frete Total do Lote (R$)</label>
                      <input type="number" value={p.freteLote||""} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x, freteLote:parseFloat(e.target.value)||0}:x))} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px", marginTop: "2px" }} />
                    </div>
                    <div>
                      <label style={{ color: "#9ca3af" }}>Quantidade do Lote</label>
                      <input type="number" value={p.qtd} onChange={e=>setProducts(products.map(x=>x.id===p.id?{...x, qtd:Math.max(1, parseInt(e.target.value)||1)}:x))} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px", marginTop: "2px" }} />
                    </div>
                  </div>

                  {p.peca > 0 && (
                    <div style={{ marginTop: "12px", background: "#222", padding: "10px", borderRadius: "8px", border: "1px solid #f9731633" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#9ca3af" }}>Custo Unitário Total:</span>
                        <span style={{ color: "#22c55e", fontWeight: "bold" }}>{R(r.c1)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ color: "#9ca3af" }}>Reserva Caixa (17.5%):</span>
                        <span style={{ color: "#eab308", fontWeight: "bold" }}>{R(r.c2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px", borderTop: "1px solid #333" }}>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>PREÇO DE VENDA IDEAL:</span>
                        <span style={{ color: "#f97316", fontWeight: "bold", fontSize: "16px" }}>{R(r.preco)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TELA: SIMULADOR */}
        {tab === "simulador" && (
          <div>
            <h3 style={{ margin: "0 0 16px 0" }}>Simulador de Pedido Fechado</h3>
            <div style={{ background: "#1a1a1a", padding: "14px", borderRadius: "12px", border: "1px solid #2a2a2a", marginBottom: "12px" }}>
              <label style={{ color: "#f97316", fontWeight: "bold", fontSize: "13px" }}>VALOR TOTAL COBRADO DO CLIENTE (R$)</label>
              <input type="number" value={simulador.recebido||""} onChange={e=>setSimulador({...simulador, recebido: parseFloat(e.target.value)||0})} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "10px", borderRadius: "6px", marginTop: "4px", fontSize: "16px" }} placeholder="R$ 0,00" />
            </div>

            <div style={{ background: "#1a1a1a", padding: "14px", borderRadius: "12px", border: "1px solid #2a2a2a" }}>
              <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "13px" }}>DESPESAS QUE VOCÊ TEVE NESSE PEDIDO:</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px", fontSize: "12px" }}>
                <div>
                  <label>Total Gasto em Peças</label>
                  <input type="number" value={simulador.pecas||""} onChange={e=>setSimulador({...simulador, pecas: parseFloat(e.target.value)||0})} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px" }} />
                </div>
                <div>
                  <label>Total Gasto Estamparia</label>
                  <input type="number" value={simulador.estamparia||""} onChange={e=>setSimulador({...simulador, estamparia: parseFloat(e.target.value)||0})} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px" }} />
                </div>
                <div>
                  <label>Corte / Linhas / Tags</label>
                  <input type="number" value={simulador.corte||""} onChange={e=>setSimulador({...simulador, corte: parseFloat(e.target.value)||0})} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px" }} />
                </div>
                <div>
                  <label>Fretes de Envio</label>
                  <input type="number" value={simulador.frete||""} onChange={e=>setSimulador({...simulador, frete: parseFloat(e.target.value)||0})} style={{ width: "100%", background: "#222", border: "1px solid #333", color: "#fff", padding: "8px", borderRadius: "6px" }} />
                </div>
              </div>
            </div>

            {simulador.recebido > 0 && (
              <div style={{ marginTop: "16px", background: "#1a1a1a", padding: "16px", borderRadius: "12px", border: "1px solid #2a2a2a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#9ca3af" }}>Sobrou Bruto (Margem):</span>
                  <span style={{ color: "#22c55e", fontWeight: "bold" }}>{R(mb)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#eab308" }}>
                  <span>🛡️ RESERVA DE CAIXA (17.5%):</span>
                  <span style={{ fontWeight: "bold" }}>{R(mb * 0.175)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #333", color: "#10b981" }}>
                  <span style={{ fontWeight: "bold" }}>SEU SEU LUCRO LIMPO:</span>
                  <span style={{ fontWeight: "bold", fontSize: "20px" }}>{R(mb - (mb * 0.175))}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
