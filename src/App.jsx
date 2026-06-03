import { useState, useEffect } from "react";
import {
  Settings, FileText, Calculator, Home, Plus, Trash2,
  ChevronDown, ChevronUp, Save, AlertCircle, CheckCircle,
  TrendingUp, DollarSign, ShieldCheck, Package, RotateCcw
} from "lucide-react";

const STORAGE_KEY = "b4-app-data";

async function loadData() {
  try { 
    const r = localStorage.getItem(STORAGE_KEY); 
    return r ? JSON.parse(r) : null; 
  } catch { 
    return null; 
  }
}
async function saveData(data) {
  try { 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
  } catch {}
}

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

const defaultCfg = { impostos:0.06, taxas:0.035, margem:0.30, reserva:0.175 };
const newProduct = (n) => ({ id:Date.now()+n, nome:"", peca:0, estamparia:0, freteLote:0, qtd:1, embalagem:0, expanded:true });
const defaultSim = { recebido:0, pecas:0, estamparia:0, corte:0, frete:0, outros:0 };

const C = {
  bg:"#0e0e0e", card:"#1a1a1a", card2:"#222", border:"#2a2a2a",
  orange:"#f97316", green:"#22c55e", yellow:"#eab308",
  emerald:"#10b981", red:"#ef4444", text:"#f5f5f5", muted:"#9ca3af",
  layer1:"#052e16", layer2:"#422006", layer3:"#064e3b",
};

function Card({ children, style={} }) {
  return <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:12, ...style }}>{children}</div>;
}
function Label({ children, color=C.muted }) {
  return <div style={{ fontSize:11, color, fontWeight:600, letterSpacing:0.5, marginBottom:4, textTransform:"uppercase" }}>{children}</div>;
}
function Value({ children, size=18, color=C.text }) {
  return <div style={{ fontSize:size, color, fontWeight:700 }}>{children}</div>;
}
function Badge({ label, color }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{label}</span>;
}
function NumInput({ label, value, onChange, prefix="R$", step="0.01", note }) {
  return (
    <div style={{ marginBottom:12 }}>
      <Label>{label}</Label>
      <div style={{ display:"flex", alignItems:"center", background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
        <span style={{ padding:"0 10px", color:C.muted, fontSize:13 }}>{prefix}</span>
        <input type="number" step={step} min="0" value={value===0?"":value} placeholder="0"
          onChange={e=>onChange(parseFloat(e.target.value)||0)}
          style={{ flex:1, background:"transparent", border:"none", outline:"none", color:C.text, fontSize:16, padding:"10px 10px 10px 0", fontFamily:"inherit" }} />
      </div>
      {note && <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{note}</div>}
    </div>
  );
}
function PctInput({ label, value, onChange, note }) {
  return (
    <div style={{ marginBottom:12 }}>
      <Label>{label}</Label>
      <div style={{ display:"flex", alignItems:"center", background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
        <input type="number" step="0.1" min="0" max="100" value={value===0?"":+(value*100).toFixed(2)} placeholder="0"
          onChange={e=>onChange((parseFloat(e.target.value)||0)/100)}
          style={{ flex:1, background:"transparent", border:"none", outline:"none", color:C.text, fontSize:16, padding:"10px 14px", fontFamily:"inherit" }} />
        <span style={{ padding:"0 10px", color:C.muted, fontSize:13 }}>%</span>
      </div>
      {note && <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{note}</div>}
    </div>
  );
}
function SectionTitle({ children, color=C.orange }) {
  return (
    <div style={{ fontSize:12, fontWeight:800, color, letterSpacing:1, textTransform:"uppercase", marginBottom:12, marginTop:4, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:color+"44" }} />{children}<div style={{ flex:1, height:1, background:color+"44" }} />
    </div>
  );
}
function LayerBlock({ label, value, color, bg, sublabel }) {
  return (
    <div style={{ background:bg, border:`1px solid ${color}33`, borderRadius:10, padding:"10px 12px", flex:1, textAlign:"center" }}>
      <div style={{ fontSize:9, color, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:15, color, fontWeight:800 }}>{value}</div>
      {sublabel && <div style={{ fontSize:9, color:color+"99" }}>{sublabel}</div>}
    </div>
  );
}

function HomeScreen({ products, cfg, simulador, setTab }) {
  const active = products.filter(p=>p.peca>0);
  const painel = calcPainel(active, cfg);
  const tc = simulador.pecas+simulador.estamparia+simulador.corte+simulador.frete+simulador.outros;
  const mb = simulador.recebido - tc;
  return (
    <div>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:22, fontWeight:900, color:C.orange }}>B4 Custom Fitness</div>
        <div style={{ fontSize:12, color:C.muted }}>Precificação por 3 Camadas</div>
      </div>
      <Card style={{ borderColor:C.orange+"44", background:"linear-gradient(135deg,#1a1a1a,#1f1408)" }}>
        <Label color={C.orange}>Orçamento Atual</Label>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div><Value size={26} color={C.orange}>{R(painel.receitaTotal)}</Value>
            <div style={{ fontSize:12, color:C.muted }}>{painel.qtdTotal} peça(s) · {active.length} produto(s)</div></div>
          <Badge label={`Lucro ${P(painel.margemPct)}`} color={C.green} />
        </div>
      </Card>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <LayerBlock label="C1 Custo Real" value={R(painel.custoTotal)} color={C.green} bg={C.layer1} sublabel="produção" />
        <LayerBlock label="C2 Reserva" value={R(painel.reservaTotal)} color={C.yellow} bg={C.layer2} sublabel="caixa" />
        <LayerBlock label="C3 Lucro" value={R(painel.lucroTotal)} color={C.emerald} bg={C.layer3} sublabel="resultado" />
      </div>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><Label color={C.yellow}>Caixa por Peça Vendida</Label>
            <Value size={22} color={C.yellow}>{R(painel.caixaPorPeca)}</Value>
            <div style={{ fontSize:11, color:C.muted }}>entra no caixa a cada unidade</div></div>
          <ShieldCheck size={34} color={C.yellow} />
        </div>
      </Card>
      {simulador.recebido>0 && (
        <Card style={{ borderColor:C.emerald+"44" }}>
          <Label color={C.emerald}>Último Simulador</Label>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div><div style={{ fontSize:12, color:C.muted }}>Resultado líquido</div>
              <Value size={18} color={C.emerald}>{R(mb-(mb*cfg.reserva))}</Value></div>
            <div style={{ textAlign:"right" }}><div style={{ fontSize:12, color:C.muted }}>Reserva blindada</div>
              <Value size={18} color={C.yellow}>{R(mb*cfg.reserva)}</Value></div>
          </div>
        </Card>
      )}
      <SectionTitle>Ações Rápidas</SectionTitle>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={()=>setTab("orcamento")} style={{ flex:1, background:C.orange, border:"none", borderRadius:12, padding:"14px 10px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Plus size={16} /> Novo Orçamento
        </button>
        <button onClick={()=>setTab("simulador")} style={{ flex:1, background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 10px", color:C.text, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Calculator size={16} /> Simular Pedido
        </button>
      </div>
    </div>
  );
}

function OrcamentoScreen({ products, setProducts, cfg }) {
  const active = products.filter(p=>p.peca>0);
  const painel = calcPainel(active, cfg);
  const add = () => setProducts(p=>[...p, newProduct(p.length)]);
  const remove = id => setProducts(p=>p.filter(x=>x.id!==id));
  const upd = (id,f,v) => setProducts(p=>p.map(x=>x.id===id?{...x,[f]:v}:x));
  const tog = id => setProducts(p=>p.map(x=>x.id===id?{...x,expanded:!x.expanded}:x));
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:18, fontWeight:800, color:C.text }}>Orçamento</div>
          <div style={{ fontSize:12, color:C.muted }}>Precificação por 3 camadas</div></div>
        <button onClick={add} style={{ background:C.orange, border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={14} /> Produto
        </button>
      </div>
      {products.map((p,idx) => {
        const r = calcProduct(p, cfg);
        const has = p.peca>0;
        return (
          <Card key={p.id} style={{ borderColor:has?C.orange+"33":C.border }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:has&&!p.expanded?0:8 }}>
              <div style={{ flex:1 }}>
                <input value={p.nome} onChange={e=>upd(p.id,"nome",e.target.value)} placeholder={`Produto ${idx+1}`}
                  style={{ background:"transparent", border:"none", outline:"none", color:C.text, fontSize:15, fontWeight:700, width:"100%", fontFamily:"inherit" }} />
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {has && <Badge label={R(r.preco)} color={C.orange} />}
                <button onClick={()=>tog(p.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", padding:4 }}>
                  {p.expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}
                </button>
                <button onClick={()=>remove(p.id)} style={{ background:"none", border:"none", color:C.red+"88", cursor:"pointer", padding:4 }}>
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            {p.expanded && (
              <div>
                <div style={{ height:1, background:C.border, margin:"4px 0 12px" }} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <NumInput label="Peça Base (NF)" value={p.peca} onChange={v=>upd(p.id,"peca",v)} />
                  <NumInput label="Estamparia" value={p.estamparia} onChange={v=>upd(p.id,"estamparia",v)} />
                  <NumInput label="Frete do Lote" value={p.freteLote} onChange={v=>upd(p.id,"freteLote",v)} />
                  <NumInput label="Qtd no Lote" value={p.qtd} prefix="un" step="1"
                    onChange={v=>upd(p.id,"qtd",Math.max(1,parseInt(v)||1))} />
                  <NumInput label="Embalagem Unit." value={p.embalagem} onChange={v=>upd(p.id,"embalagem",v)} />
                  <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>FRETE UNITÁRIO</div>
                    <div style={{ fontSize:16, color:C.text, fontWeight:700 }}>{R(r.freteUnit)}</div>
                  </div>
                </div>
              </div>
            )}
            {has && (
              <div>
                <div style={{ height:1, background:C.border, margin:"8px 0 10px" }} />
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <LayerBlock label="C1 Custo Real" value={R(r.c1)} color={C.green} bg={C.layer1} />
                  <LayerBlock label="C2 Reserva" value={R(r.c2)} color={C.yellow} bg={C.layer2} sublabel={P(cfg.reserva)} />
                  <LayerBlock label="C3 Preço Final" value={R(r.preco)} color={C.orange} bg="#1f1408" />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", background:"#052e16", borderRadius:10, padding:"8px 12px" }}>
                  <div><div style={{ fontSize:10, color:C.green, fontWeight:600 }}>LUCRO/PEÇA</div>
                    <div style={{ fontSize:15, color:C.green, fontWeight:800 }}>{R(r.lucro)}</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:C.yellow, fontWeight:600 }}>CAIXA LOTE (×{p.qtd})</div>
                    <div style={{ fontSize:15, color:C.yellow, fontWeight:800 }}>{R(r.caixaLote)}</div></div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
      {active.length>0 && (
        <>
          <SectionTitle color={C.emerald}>Painel do Pedido</SectionTitle>
          <Card style={{ borderColor:C.emerald+"44", background:"linear-gradient(135deg,#1a1a1a,#061a12)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["Receita Total",R(painel.receitaTotal),C.orange],["Custo Real",R(painel.custoTotal),C.green],
                ["Reserva 🛡",R(painel.reservaTotal),C.yellow],["Lucro Total",R(painel.lucroTotal),C.emerald],
                ["Margem",P(painel.margemPct),C.emerald],["Caixa/Peça",R(painel.caixaPorPeca),C.yellow]
              ].map(([l,v,c])=>(
                <div key={l} style={{ background:C.card, borderRadius:10, padding:"10px 12px", border:`1px solid ${c}22` }}>
                  <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:16, color:c, fontWeight:800 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, background:C.layer2, borderRadius:10, padding:"10px 14px", border:`1px solid ${C.yellow}33` }}>
              <div style={{ fontSize:11, color:C.yellow, fontWeight:700 }}>
                💡 RESERVA {R(painel.reservaTotal)} — blindar no caixa. Não toque nesse valor.
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SimuladorScreen({ sim, setSim, cfg }) {
  const { recebido, pecas, estamparia, corte, frete, outros } = sim;
  const tc = pecas+estamparia+corte+frete+outros;
  const mb = recebido-tc;
  const mbPct = recebido>0?mb/recebido:0;
  const reserva = mb*cfg.reserva;
  const resultado = mb-reserva;
  const ok = mbPct>=0.30;
  const set=(f,v)=>setSim(p=>({...p,[f]:v}));
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div><div style={{ fontSize:18, fontWeight:800, color:C.text }}>Simulador de Pedido</div>
          <div style={{ fontSize:12, color:C.muted }}>Análise real do resultado</div></div>
        <button onClick={()=>setSim(defaultSim)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"7px 12px", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
          <RotateCcw size={13}/> Zerar
        </button>
      </div>
      <Card style={{ borderColor:C.orange+"44" }}>
        <SectionTitle color={C.orange}>Receita</SectionTitle>
        <NumInput label="Total recebido do cliente" value={recebido} onChange={v=>set("recebido",v)} note="Soma de todas as parcelas" />
      </Card>
      <Card>
        <SectionTitle color={C.green}>Custos de Produção</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <NumInput label="Peças (NF total)" value={pecas} onChange={v=>set("pecas",v)} />
          <NumInput label="Estamparia" value={estamparia} onChange={v=>set("estamparia",v)} />
          <NumInput label="Corte / Material" value={corte} onChange={v=>set("corte",v)} />
          <NumInput label="Frete de envio" value={frete} onChange={v=>set("frete",v)} />
          <NumInput label="Outros / Imprevistos" value={outros} onChange={v=>set("outros",v)} />
          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>TOTAL CUSTOS</div>
            <div style={{ fontSize:18, color:C.red, fontWeight:800 }}>{R(tc)}</div>
          </div>
        </div>
      </Card>
      {recebido>0 && (
        <Card style={{ borderColor:(ok?C.emerald:C.red)+"44", background:`linear-gradient(135deg,#1a1a1a,${ok?"#061a12":"#1a0606"})` }}>
          <SectionTitle color={ok?C.emerald:C.red}>Resultado</SectionTitle>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            {ok?<CheckCircle size={18} color={C.emerald}/>:<AlertCircle size={18} color={C.red}/>}
            <div style={{ fontSize:12, color:ok?C.emerald:C.red, fontWeight:700 }}>
              {ok?`Margem saudável — ${P(mbPct)}`:`Margem abaixo do esperado — ${P(mbPct)}`}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div style={{ background:C.layer1, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.green}33` }}>
              <div style={{ fontSize:10, color:C.green, fontWeight:600 }}>MARGEM BRUTA</div>
              <div style={{ fontSize:20, color:C.green, fontWeight:800 }}>{R(mb)}</div>
              <div style={{ fontSize:12, color:C.green+"99" }}>{P(mbPct)}</div>
            </div>
            <div style={{ background:C.layer2, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.yellow}33` }}>
              <div style={{ fontSize:10, color:C.yellow, fontWeight:600 }}>🛡 RESERVA {P(cfg.reserva)}</div>
              <div style={{ fontSize:20, color:C.yellow, fontWeight:800 }}>{R(reserva)}</div>
              <div style={{ fontSize:11, color:C.yellow+"99" }}>blindar no caixa</div>
            </div>
          </div>
          <div style={{ background:C.layer3, borderRadius:10, padding:14, border:`1px solid ${C.emerald}44`, textAlign:"center" }}>
            <div style={{ fontSize:11, color:C.emerald, fontWeight:600, marginBottom:2 }}>RESULTADO LÍQUIDO</div>
            <div style={{ fontSize:28, color:C.emerald, fontWeight:900 }}>{R(resultado)}</div>
            <div style={{ fontSize:11, color:C.emerald+"88", marginTop:2 }}>após separar a reserva de caixa</div>
          </div>
          <div style={{ marginTop:10, background:C.card, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.border}` }}>
            {[[`Receita`,R(recebido),C.text],[`Custos`,`− ${R(tc)}`,C.red],[`Reserva`,`− ${R(reserva)}`,C.yellow],[`Líquido`,R(resultado),C.emerald]].map(([l,v,c],i)=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", marginTop:i>0?4:0, ...(i===3?{borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:6}:{}) }}>
                <span style={{ fontSize:13, color:C.muted, fontWeight:i===3?700:400 }}>{l}</span>
                <span style={{ fontSize:14, color:c, fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function MainApp() {
  const [tab, setTab] = useState("home");
  const [products, setProducts] = useState([newProduct(0)]);
  const [simulador, setSimulador] = useState(defaultSim);

  useEffect(() => {
    async function init() {
      const saved = await loadData();
      if (saved) {
        if (saved.products) setProducts(saved.products);
        if (saved.simulador) setSimulador(saved.simulador);
      }
    }
    init();
  }, []);

  useEffect(() => {
    saveData({ products, simulador });
  }, [products, simulador]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, paddingBottom: 100 }}>
        {tab === "home" && <HomeScreen products={products} cfg={defaultCfg} simulador={simulador} setTab={setTab} />}
        {tab === "orcamento" && <OrcamentoScreen products={products} setProducts={setProducts} cfg={defaultCfg} />}
        {tab === "simulador" && <SimuladorScreen sim={simulador} setSim={setSimulador} cfg={defaultCfg} />}
        
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-around", padding: "12px 0", zIndex: 1000 }}>
          <button onClick={() => setTab("home")} style={{ background: "none", border: "none", color: tab === "home" ? C.orange : C.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11 }}>
            <Home size={20} /> Início
          </button>
          <button onClick={() => setTab("orcamento")} style={{ background: "none", border: "none", color: tab === "orcamento" ? C.orange : C.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11 }}>
            <FileText size={20} /> Orçamento
          </button>
          <button onClick={() => setTab("simulador")} style={{ background: "none", border: "none", color: tab === "simulador" ? C.orange : C.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11 }}>
            <Calculator size={20} /> Simulador
          </button>
        </div>
      </div>
    </div>
  );
}
