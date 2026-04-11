/**
 * App.jsx — PassaFácil PRO
 * Frontend limpo: sem API keys, sem passwords, sem lógica de admin.
 * Toda a comunicação com IA e moderação passa pelo backend.
 */

import { useState, useEffect, useCallback } from "react";
import { authAPI, aiAPI, solutionAPI, userAPI, saveSession, clearSession, getStoredUser } from "./services/api";

// ── Constantes visuais ─────────────────────────────────
const COLORS = ["#0EA5A0","#22C55E","#8B5CF6","#F59E0B","#EF4444","#3B82F6","#EC4899","#14B8A6"];
const initials = name => name.trim().split(" ").filter(Boolean).map(n=>n[0]).slice(0,2).join("").toUpperCase();

// ── Resumos (conteúdo estático — fica no frontend) ─────
const RESUMOS = {
  mat:[
    {title:"📐 Equações do 2º Grau",free:true,desc:"Fórmula resolvente, discriminante e tipos de raízes.",
     body:`Fórmula Resolvente (Bhaskara):\nx = (-b ± √Δ) / 2a    Δ = b² - 4ac\n\nΔ > 0 → duas raízes reais distintas\nΔ = 0 → raiz dupla  x = -b/2a\nΔ < 0 → sem raízes reais`,
     ex:"Resolva: 2x² - 5x + 3 = 0 usando Bhaskara. Mostre todos os passos.",disc:"Matemática"},
    {title:"📈 Funções do 1º Grau",free:true,desc:"Função afim, declive, zero e sentido de variação.",
     body:`f(x) = mx + b\nm = declive  |  b = ordenada na origem\nm > 0 → crescente  |  m < 0 → decrescente\nZero: x = -b/m`,
     ex:"Determine o zero, declive e analise f(x) = -3x + 9.",disc:"Matemática"},
    {title:"📊 Progressões (PA e PG)",free:false,desc:"Termos gerais, somas e aplicações em problemas reais.",body:"",ex:"",disc:"Matemática"},
    {title:"📉 Logaritmos e Exponenciais",free:false,desc:"Propriedades, equações e aplicações.",body:"",ex:"",disc:"Matemática"},
  ],
  fis:[
    {title:"🚀 Cinemática — MRU e MRUV",free:true,desc:"Movimentos rectilíneos com equações completas.",
     body:`MRU:   s = s₀ + v·t\nMRUV:  s = s₀ + v₀t + ½at²\n       v = v₀ + at\n       v² = v₀² + 2aΔs  (Torricelli)`,
     ex:"Um carro parte do repouso com a=3 m/s². Calcule v após 8s e espaço percorrido.",disc:"Física"},
    {title:"⚡ Lei de Ohm e Circuitos",free:true,desc:"Resistência, tensão, corrente, série e paralelo.",
     body:`V = R·I    P = V·I = I²·R\nSérie:    Rt = R1+R2+...\nParalelo: 1/Rt = 1/R1+1/R2+...`,
     ex:"R1=6Ω e R2=3Ω em paralelo com 18V. Calcule Rt, corrente total e em cada ramo.",disc:"Física"},
    {title:"🌊 Ondas e Som",free:false,desc:"Frequência, comprimento de onda e velocidade.",body:"",ex:"",disc:"Física"},
  ],
  qui:[
    {title:"🔗 Ligações Químicas",free:true,desc:"Iónica, covalente e metálica.",
     body:`Iónica: Metal + Não-metal → transferência e⁻  (NaCl)\nCovalente: NM + NM → partilha e⁻  (H₂O)\nMetálica: Metal + Metal → mar de e⁻  (Fe)\n\nRegra do Octeto: 8 e⁻ na camada de valência`,
     ex:"Classifique e justifique o tipo de ligação em: NaCl, O₂, H₂O, Al.",disc:"Química"},
    {title:"⚗️ Balanceamento de Reacções",free:true,desc:"Passos para balancear equações correctamente.",
     body:`1. Escrever sem balancear\n2. Contar átomos em cada lado\n3. Ajustar coeficientes (NUNCA os índices)\n\nEx: 2H₂ + O₂ → 2H₂O ✅`,
     ex:"Balance: Al + O₂ → Al₂O₃. Mostre a contagem antes e depois.",disc:"Química"},
    {title:"🧪 Soluções e Concentração",free:false,desc:"Molaridade, diluição e misturas.",body:"",ex:"",disc:"Química"},
  ],
  emp:[
    {title:"📋 Plano de Negócios",free:true,desc:"As 6 secções essenciais de um plano.",
     body:`1. Sumário Executivo\n2. Análise de Mercado\n3. Produto/Serviço\n4. Estratégia de Marketing\n5. Plano Financeiro\n6. Equipa\n\nPE = Custos Fixos ÷ (Preço - CV)`,
     ex:"Plano para barbearia em Luanda: CF=40.000Kz/mês, preço=1500Kz, CV=300Kz.",disc:"Empreendedorismo"},
    {title:"📣 Marketing Mix — 4 P's",free:true,desc:"Produto, Preço, Praça, Promoção.",
     body:`🛍️ Produto: qualidade, embalagem, marca\n💰 Preço: penetração, skimming, psicológico\n📍 Praça: loja, online, mercado\n📢 Promoção: redes sociais, boca-a-boca`,
     ex:"Aplica os 4 Ps para revenda de roupas em Angola.",disc:"Empreendedorismo"},
  ],
};

const quickSolves = [
  {label:"🔢 Bhaskara: x²-5x+6=0",disc:"Matemática",q:"Resolva x² - 5x + 6 = 0 usando Bhaskara. Mostre Δ e as raízes."},
  {label:"⚡ Queda livre: h=45m",disc:"Física",q:"Objecto cai de 45m. Calcule tempo e velocidade de impacto. g=10m/s²."},
  {label:"🧪 Balance: Fe + O₂ → Fe₂O₃",disc:"Química",q:"Balance Fe + O₂ → Fe₂O₃ e verifique conservação da massa."},
  {label:"💼 Ponto de Equilíbrio",disc:"Empreendedorismo",q:"Barraca de sumos: CF=20.000Kz, preço=500Kz, CV=180Kz. Calcule PE e lucro com 100 sumos."},
];

// ══════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════
export default function PassaFacil() {
  const [page, setPage]               = useState("home");
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [solutions, setSolutions]     = useState([]);
  const [ranking, setRanking]         = useState([]);
  const [authModal, setAuthModal]     = useState(false);
  const [authTab, setAuthTab]         = useState("login");
  const [dashModal, setDashModal]     = useState(false);
  const [toast, setToast]             = useState(null);
  const [resumeTab, setResumeTab]     = useState("mat");
  const [expandedCard, setExpandedCard] = useState(null);

  // Auth
  const [loginUser, setLoginUser]   = useState("");
  const [loginPass, setLoginPass]   = useState("");
  const [loginErr, setLoginErr]     = useState("");
  const [regName, setRegName]       = useState("");
  const [regUser, setRegUser]       = useState("");
  const [regEmail, setRegEmail]     = useState("");
  const [regPhone, setRegPhone]     = useState("");
  const [regSchool, setRegSchool]   = useState("");
  const [regPass, setRegPass]       = useState("");
  const [regErr, setRegErr]         = useState("");
  const [regOk, setRegOk]           = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass]     = useState(false);

  // Solver
  const [exercise, setExercise]         = useState("");
  const [disc, setDisc]                 = useState("Matemática");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiResult, setAiResult]         = useState("");
  const [lastExercise, setLastExercise] = useState("");

  // Comunidade
  const [postQ, setPostQ]         = useState("");
  const [postA, setPostA]         = useState("");
  const [postDisc, setPostDisc]   = useState("Matemática");
  const [posting, setPosting]     = useState(false);
  const [filterDisc, setFilterDisc] = useState("Todos");

  // ── Carregar dados ao montar ─────────────────────────
  useEffect(() => { loadSolutions(); loadRanking(); }, []);

  const loadSolutions = async () => {
    try {
      const data = await solutionAPI.list({ limit: 30 });
      setSolutions(data.solutions || []);
    } catch {}
  };

  const loadRanking = async () => {
    try {
      const data = await userAPI.ranking();
      setRanking(data.users || []);
    } catch {}
  };

  const showToast = useCallback((msg, dur = 3200) => {
    setToast(msg);
    setTimeout(() => setToast(null), dur);
  }, []);

  // ── AUTH ──────────────────────────────────────────────
  const doLogin = async () => {
    setLoginErr("");
    try {
      const data = await authAPI.login({ identifier: loginUser, password: loginPass });
      saveSession(data.token, data.user);
      setCurrentUser(data.user);
      setAuthModal(false);
      setLoginUser(""); setLoginPass("");
      showToast(data.message);
    } catch (err) {
      setLoginErr("⚠️ " + err.message);
    }
  };

  const doRegister = async () => {
    setRegErr(""); setRegOk("");
    if (!regName || !regUser || !regEmail || !regPass) {
      setRegErr("⚠️ Preenche todos os campos obrigatórios."); return;
    }
    try {
      const data = await authAPI.register({
        name: regName, username: regUser, email: regEmail,
        password: regPass, phone: regPhone, school: regSchool,
      });
      saveSession(data.token, data.user);
      setCurrentUser(data.user);
      setRegOk(`🎉 ${data.message}`);
      setTimeout(() => {
        setAuthModal(false); setRegOk("");
        setRegName(""); setRegUser(""); setRegEmail("");
        setRegPhone(""); setRegSchool(""); setRegPass("");
      }, 1800);
    } catch (err) {
      setRegErr("⚠️ " + err.message);
    }
  };

  const doLogout = () => {
    clearSession();
    setCurrentUser(null);
    setDashModal(false);
    showToast("👋 Até logo!");
  };

  // ── SOLVER — chama o backend, não a Gemini ────────────
  const runSolver = async (ex, d) => {
    if (!ex.trim()) { showToast("⚠️ Escreve um exercício primeiro!"); return; }
    if (!currentUser) { setAuthModal(true); showToast("⚠️ Faz login para usar a IA!"); return; }
    setAiLoading(true); setAiResult(""); setLastExercise(ex);
    try {
      const data = await aiAPI.solve(ex, d, "12ª Classe");
      setAiResult(data.result);
      // Actualizar moedas/uses localmente (o backend já actualizou na DB)
      setCurrentUser(u => u ? { ...u, aiUses: (u.aiUses || 0) + 1 } : u);
    } catch (err) {
      setAiResult("⚠️ " + err.message);
    }
    setAiLoading(false);
  };

  // ── COMMUNITY ─────────────────────────────────────────
  const submitSolution = async () => {
    if (!currentUser) { setAuthModal(true); return; }
    if (!postQ.trim() || !postA.trim()) { showToast("⚠️ Preenche o enunciado e a resolução!"); return; }
    if (postA.length < 30) { showToast("⚠️ Resolução muito curta. Mostra os passos!"); return; }
    setPosting(true);
    showToast("🤖 A verificar com IA...");
    try {
      const data = await solutionAPI.submit({ question: postQ, answer: postA, discipline: postDisc });
      setSolutions(p => [data.solution, ...p]);
      if (data.coinsEarned > 0) {
        setCurrentUser(u => u ? { ...u, coins: u.coins + data.coinsEarned } : u);
      }
      showToast(data.message);
      setPostQ(""); setPostA("");
    } catch (err) {
      showToast("❌ " + err.message);
    }
    setPosting(false);
  };

  const voteUp = async (id) => {
    if (!currentUser) { setAuthModal(true); return; }
    try {
      const data = await solutionAPI.vote(id);
      setSolutions(p => p.map(s => s.id === id ? { ...s, votes: data.votes } : s));
      showToast(data.message);
    } catch (err) {
      showToast("❌ " + err.message);
    }
  };

  const shareAI = () => {
    if (!aiResult) return;
    if (!currentUser) { setAuthModal(true); return; }
    setPostQ(lastExercise);
    setPostA(aiResult.replace(/[*#]/g, ""));
    setPostDisc(disc);
    setPage("comunidade");
    showToast("📝 Copiado para o formulário!");
  };

  // ── Dados derivados ────────────────────────────────────
  const approvedSols = solutions.filter(s => s.status === "approved").length;
  const commSols     = solutions.filter(s =>
    s.status === "approved" &&
    (filterDisc === "Todos" || s.discipline === filterDisc)
  );

  const navPages = [
    { id: "home",      icon: "📚", label: "Resumos" },
    { id: "resolver",  icon: "🤖", label: "Resolver IA" },
    { id: "comunidade",icon: "👥", label: "Comunidade" },
    { id: "ranking",   icon: "🏆", label: "Ranking" },
  ];

  // ── Helpers de estilo ──────────────────────────────────
  const pill = (active, color = "#0EA5A0") => ({
    background: active ? color : "#fff",
    color: active ? "#fff" : "#5A7A8A",
    border: `1.5px solid ${active ? color : "#C8EAE9"}`,
    padding: "6px 16px", borderRadius: 30, fontSize: ".82rem",
    fontWeight: 700, cursor: "pointer", transition: "all .15s",
  });

  const inp = (extra = {}) => ({
    width: "100%", border: "1.5px solid #C8EAE9", borderRadius: 10,
    padding: "12px 14px", outline: "none", fontSize: ".9rem",
    fontFamily: "inherit", color: "#0F2A3F", background: "#fff",
    transition: "border-color .2s", ...extra,
  });

  // ══════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: "#F0F9F8", minHeight: "100vh", color: "#0F2A3F" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,textarea,select,button{font-family:inherit;}
        textarea{resize:vertical;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:#B2DFDB;border-radius:10px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .btn-primary{background:linear-gradient(135deg,#0EA5A0,#0C8A86);color:#fff;border:none;padding:12px 28px;border-radius:30px;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(14,165,160,.35);}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(14,165,160,.45);}
        .btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none;}
        .btn-green{background:linear-gradient(135deg,#22C55E,#16A34A);color:#fff;border:none;padding:12px 28px;border-radius:30px;font-weight:700;font-size:.9rem;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(34,197,94,.35);}
        .btn-green:hover{transform:translateY(-2px);}
        .card{background:#fff;border:1.5px solid #C8EAE9;border-radius:16px;transition:all .2s;}
        .card:hover{border-color:#0EA5A0;box-shadow:0 8px 28px rgba(14,165,160,.12);transform:translateY(-2px);}
        .nav-btn{background:none;border:none;padding:8px 16px;border-radius:10px;font-weight:500;font-size:.86rem;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;}
        .nav-btn.active{background:rgba(14,165,160,.12);color:#0EA5A0;font-weight:700;}
        .nav-btn:not(.active){color:#5A7A8A;}
        input:focus,textarea:focus{border-color:#0EA5A0!important;box-shadow:0 0 0 3px rgba(14,165,160,.12);}
        .skeleton{background:linear-gradient(90deg,#e8f5f4 25%,#d4efee 50%,#e8f5f4 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
        @media(max-width:640px){.hide-mobile{display:none!important;}}
      `}</style>

      {/* ══ NAVBAR ══════════════════════════════════════ */}
      <nav style={{ position:"sticky",top:0,zIndex:200,background:"rgba(255,255,255,.97)",backdropFilter:"blur(20px)",borderBottom:"1.5px solid #C8EAE9",height:64,display:"flex",alignItems:"center",padding:"0 4%",gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",flexShrink:0 }} onClick={() => setPage("home")}>
          <div style={{ width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#0EA5A0,#22C55E)",display:"grid",placeItems:"center",fontSize:"1.15rem" }}>📚</div>
          <span style={{ fontWeight:800,fontSize:"1.15rem",fontFamily:"'DM Serif Display',serif" }}>
            <span style={{ color:"#0EA5A0" }}>Passa</span><span style={{ color:"#0F2A3F" }}>Fácil</span>
          </span>
          <span style={{ fontSize:".6rem",fontWeight:800,background:"linear-gradient(135deg,#0EA5A0,#22C55E)",color:"#fff",padding:"2px 8px",borderRadius:20,letterSpacing:.8 }}>PRO</span>
        </div>

        <div style={{ display:"flex",gap:2,flex:1,justifyContent:"center" }} className="hide-mobile">
          {navPages.map(p => (
            <button key={p.id} className={`nav-btn${page === p.id ? " active" : ""}`} onClick={() => setPage(p.id)}>
              <span>{p.icon}</span><span>{p.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display:"flex",gap:8,alignItems:"center",marginLeft:"auto" }}>
          {currentUser ? (
            <button style={{ display:"flex",alignItems:"center",gap:8,background:"#F0F9F8",border:"1.5px solid #B2DFDB",borderRadius:30,padding:"5px 14px 5px 6px",cursor:"pointer",fontWeight:700,fontSize:".82rem" }}
              onClick={() => setDashModal(true)}>
              <div style={{ width:30,height:30,borderRadius:"50%",background:currentUser.color,display:"grid",placeItems:"center",color:"#fff",fontSize:".78rem",fontWeight:800 }}>
                {initials(currentUser.name)}
              </div>
              <span style={{ color:"#F59E0B" }}>🪙 {currentUser.coins}</span>
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setAuthModal(true)} style={{ padding:"8px 20px",fontSize:".85rem" }}>
              Entrar / Cadastrar
            </button>
          )}
        </div>
      </nav>

      {/* ══ HOME ════════════════════════════════════════ */}
      {page === "home" && (
        <div style={{ animation:"fadeIn .4s ease" }}>
          {/* Hero */}
          <div style={{ background:"linear-gradient(135deg,#0F2A3F 0%,#0C4A48 40%,#0EA5A0 100%)",padding:"80px 5% 64px",textAlign:"center" }}>
            <div style={{ maxWidth:680,margin:"0 auto" }}>
              <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.9)",fontSize:".72rem",fontWeight:700,padding:"5px 18px",borderRadius:30,marginBottom:24,letterSpacing:1 }}>
                🇦🇴 FEITO PARA ESTUDANTES ANGOLANOS
              </div>
              <h1 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2.2rem,5.5vw,3.8rem)",color:"#fff",lineHeight:1.1,marginBottom:20 }}>
                Estuda Mais,{" "}
                <em style={{ color:"#4ADE80",fontStyle:"italic" }}>Passa com Confiança</em>
              </h1>
              <p style={{ color:"rgba(255,255,255,.72)",lineHeight:1.75,maxWidth:500,margin:"0 auto 36px" }}>
                Resumos, exercícios resolvidos por IA, comunidade activa e recompensas por cada resolução correcta.
              </p>
              <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:52 }}>
                <button className="btn-green" style={{ padding:"14px 32px",fontSize:"1rem" }} onClick={() => setAuthModal(true)}>
                  🎓 Cadastrar Grátis
                </button>
                <button style={{ background:"rgba(255,255,255,.1)",color:"#fff",border:"2px solid rgba(255,255,255,.35)",padding:"14px 32px",borderRadius:30,fontWeight:700,fontSize:"1rem",cursor:"pointer" }}
                  onClick={() => setPage("resolver")}>
                  🤖 Experimentar IA
                </button>
              </div>
              <div style={{ display:"flex",justifyContent:"center",gap:48,flexWrap:"wrap" }}>
                {[["4","Disciplinas"],["50+","Resumos"],[`${approvedSols}+`,"Resoluções"],["500+","Alunos"]].map(([n,l]) => (
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"2.2rem",fontWeight:800,color:"#4ADE80",fontFamily:"'DM Serif Display',serif" }}>{n}</div>
                    <div style={{ fontSize:".72rem",color:"rgba(255,255,255,.55)",marginTop:4,letterSpacing:.5 }}>{l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumos */}
          <div style={{ padding:"60px 5%",maxWidth:900,margin:"0 auto" }}>
            <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:14,marginBottom:32 }}>
              <div>
                <div style={{ fontSize:".7rem",fontWeight:800,color:"#0EA5A0",letterSpacing:2,textTransform:"uppercase",marginBottom:6 }}>📚 CONTEÚDOS</div>
                <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.7rem,3vw,2.3rem)" }}>Resumos por Disciplina</h2>
              </div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {[["mat","🔢 Mat"],["fis","⚡ Fís"],["qui","🧪 Quí"],["emp","💼 Emp"]].map(([k,l]) => (
                  <button key={k} style={pill(resumeTab === k)} onClick={() => setResumeTab(k)}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {RESUMOS[resumeTab].map((r, i) => (
                <div key={i} className="card" style={{ padding:"22px 26px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700,fontSize:"1rem",flex:1 }}>{r.title}</span>
                    <span style={{ background:r.free?"#DCFCE7":"#FEF3C7",color:r.free?"#166534":"#92400E",fontSize:".68rem",fontWeight:800,padding:"3px 10px",borderRadius:20 }}>
                      {r.free ? "✓ GRÁTIS" : "🔒 PREMIUM"}
                    </span>
                  </div>
                  <p style={{ color:"#5A7A8A",fontSize:".88rem",marginBottom:14,lineHeight:1.65 }}>{r.desc}</p>
                  {r.free && r.body && (
                    <>
                      <pre style={{ background:"#F0F9F8",borderRadius:12,padding:"16px 18px",fontSize:".83rem",lineHeight:1.9,whiteSpace:"pre-wrap",marginBottom:14,color:"#0F2A3F",border:"1px solid #B2DFDB" }}>
                        {expandedCard === i ? r.body : r.body.split("\n").slice(0,4).join("\n") + (r.body.split("\n").length > 4 ? "..." : "")}
                      </pre>
                      {r.body.split("\n").length > 4 && (
                        <button style={{ background:"none",border:"none",color:"#0EA5A0",fontWeight:700,fontSize:".82rem",cursor:"pointer",marginBottom:12,padding:0 }}
                          onClick={() => setExpandedCard(expandedCard === i ? null : i)}>
                          {expandedCard === i ? "▲ Ver menos" : "▼ Ver completo"}
                        </button>
                      )}
                    </>
                  )}
                  {!r.free && (
                    <div style={{ background:"linear-gradient(135deg,#FEF3C7,#FDE68A)",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:".84rem",color:"#92400E" }}>
                      🔒 Disponível no plano <strong>Premium</strong>
                    </div>
                  )}
                  {r.free && r.ex && (
                    <button className="btn-primary" style={{ padding:"8px 18px",fontSize:".82rem" }}
                      onClick={() => { setExercise(r.ex); setDisc(r.disc); setPage("resolver"); }}>
                      🤖 Resolver Exemplo
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ RESOLVER IA ════════════════════════════════ */}
      {page === "resolver" && (
        <div style={{ maxWidth:800,margin:"0 auto",padding:"40px 5% 80px",animation:"fadeIn .4s ease" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:".7rem",fontWeight:800,color:"#0EA5A0",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>🤖 IA GENERATIVA</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",marginBottom:8 }}>Resolver Exercícios</h2>
            <p style={{ color:"#5A7A8A",fontSize:".9rem" }}>Escribe qualquer exercício — a IA resolve passo a passo.</p>
          </div>

          {/* Quick solves */}
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:20 }}>
            {quickSolves.map((q, i) => (
              <button key={i} style={{ background:"#fff",border:"1.5px solid #C8EAE9",borderRadius:20,padding:"6px 14px",fontSize:".78rem",fontWeight:600,cursor:"pointer",color:"#0F2A3F",transition:"all .15s" }}
                onClick={() => { setExercise(q.q); setDisc(q.disc); }}>
                {q.label}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding:24,marginBottom:20 }}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:".78rem",fontWeight:700,color:"#5A7A8A",letterSpacing:.8,textTransform:"uppercase",display:"block",marginBottom:6 }}>Disciplina</label>
              <select style={{ ...inp(),width:"auto",minWidth:180 }} value={disc} onChange={e => setDisc(e.target.value)}>
                {["Matemática","Física","Química","Empreendedorismo"].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <label style={{ fontSize:".78rem",fontWeight:700,color:"#5A7A8A",letterSpacing:.8,textTransform:"uppercase",display:"block",marginBottom:6 }}>Exercício</label>
            <textarea
              style={{ ...inp(),minHeight:110,resize:"vertical" }}
              placeholder="Ex: Resolva x² - 5x + 6 = 0 usando Bhaskara..."
              value={exercise}
              onChange={e => setExercise(e.target.value)}
            />
            <div style={{ display:"flex",gap:10,marginTop:14,flexWrap:"wrap" }}>
              <button className="btn-primary" style={{ flex:1,minWidth:160 }}
                disabled={aiLoading || !exercise.trim()}
                onClick={() => runSolver(exercise, disc)}>
                {aiLoading
                  ? <><span style={{ display:"inline-block",animation:"spin .8s linear infinite",marginRight:6 }}>⟳</span>A resolver...</>
                  : "🤖 Resolver com IA"}
              </button>
              <button style={pill(false)} onClick={() => { setExercise(""); setAiResult(""); }}>Limpar</button>
            </div>
          </div>

          {aiResult && (
            <div className="card" style={{ padding:24 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8 }}>
                <span style={{ fontWeight:700,color:"#0EA5A0" }}>✅ Resolução</span>
                <div style={{ display:"flex",gap:8 }}>
                  <button style={pill(false)} onClick={shareAI}>📤 Partilhar na Comunidade</button>
                  <button style={pill(false)} onClick={() => navigator.clipboard?.writeText(aiResult).then(() => showToast("📋 Copiado!"))}>📋</button>
                </div>
              </div>
              <pre style={{ background:"#F0F9F8",borderRadius:12,padding:"18px 20px",fontSize:".85rem",lineHeight:1.85,whiteSpace:"pre-wrap",color:"#0F2A3F",border:"1px solid #B2DFDB" }}>
                {aiResult}
              </pre>
            </div>
          )}

          {!currentUser && (
            <div style={{ background:"linear-gradient(135deg,#FEF3C7,#FDE68A)",borderRadius:14,padding:"16px 20px",marginTop:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
              <span style={{ flex:1,fontSize:".88rem",color:"#92400E",fontWeight:600 }}>
                🔒 Faz login para guardar o histórico e ganhar moedas por resoluções!
              </span>
              <button className="btn-primary" style={{ padding:"9px 20px",fontSize:".85rem" }} onClick={() => setAuthModal(true)}>
                Entrar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ COMUNIDADE ══════════════════════════════════ */}
      {page === "comunidade" && (
        <div style={{ maxWidth:820,margin:"0 auto",padding:"40px 5% 80px",animation:"fadeIn .4s ease" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:".7rem",fontWeight:800,color:"#0EA5A0",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>👥 COMUNIDADE</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)" }}>Resoluções da Comunidade</h2>
          </div>

          {/* Formulário de submissão */}
          {currentUser && (
            <div className="card" style={{ padding:24,marginBottom:28 }}>
              <h3 style={{ fontWeight:700,marginBottom:16,color:"#0F2A3F" }}>📤 Submeter Resolução</h3>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:".75rem",fontWeight:700,color:"#5A7A8A",letterSpacing:.8,textTransform:"uppercase",display:"block",marginBottom:5 }}>Disciplina</label>
                <select style={{ ...inp(),width:"auto",minWidth:180 }} value={postDisc} onChange={e => setPostDisc(e.target.value)}>
                  {["Matemática","Física","Química","Empreendedorismo"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <textarea style={{ ...inp(),minHeight:72,marginBottom:10 }} placeholder="Enunciado do exercício..." value={postQ} onChange={e => setPostQ(e.target.value)} />
              <textarea style={{ ...inp(),minHeight:110,marginBottom:14 }} placeholder="A tua resolução passo a passo..." value={postA} onChange={e => setPostA(e.target.value)} />
              <button className="btn-primary" disabled={posting} onClick={submitSolution}>
                {posting ? "🤖 A verificar..." : "📤 Submeter Resolução"}
              </button>
              <p style={{ fontSize:".75rem",color:"#5A7A8A",marginTop:10 }}>
                A IA avalia automaticamente. Resoluções correctas ganham até 100 moedas!
              </p>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:20 }}>
            {["Todos","Matemática","Física","Química","Empreendedorismo"].map(d => (
              <button key={d} style={pill(filterDisc === d)} onClick={() => setFilterDisc(d)}>{d}</button>
            ))}
          </div>

          {/* Lista */}
          {commSols.length === 0 ? (
            <div style={{ textAlign:"center",padding:"60px 20px",color:"#5A7A8A" }}>
              <div style={{ fontSize:"3rem",marginBottom:12 }}>📭</div>
              <p>Ainda não há resoluções. Sê o primeiro!</p>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {commSols.map(s => (
                <div key={s.id} className="card" style={{ padding:"20px 24px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:s.userColor,display:"grid",placeItems:"center",color:"#fff",fontSize:".78rem",fontWeight:800,flexShrink:0 }}>
                      {initials(s.userName)}
                    </div>
                    <div style={{ flex:1 }}>
                      <span style={{ fontWeight:700,fontSize:".92rem" }}>{s.userName}</span>
                      <div style={{ fontSize:".72rem",color:"#5A7A8A",marginTop:2 }}>{s.discipline} · {new Date(s.createdAt).toLocaleDateString("pt-AO")}</div>
                    </div>
                    {s.aiScore > 0 && (
                      <span style={{ background:s.aiScore>=90?"#DCFCE7":"#FEF3C7",color:s.aiScore>=90?"#166534":"#92400E",fontSize:".7rem",fontWeight:800,padding:"3px 10px",borderRadius:20 }}>
                        🤖 {s.aiScore}%
                      </span>
                    )}
                  </div>
                  <div style={{ background:"#F8FAFC",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:".85rem",color:"#0F2A3F",fontWeight:600,borderLeft:"3px solid #0EA5A0" }}>
                    {s.question}
                  </div>
                  <pre style={{ background:"#F0F9F8",borderRadius:10,padding:"12px 14px",fontSize:".82rem",lineHeight:1.75,whiteSpace:"pre-wrap",color:"#0F2A3F",border:"1px solid #B2DFDB",marginBottom:12 }}>
                    {s.answer}
                  </pre>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <button style={{ background:"none",border:"1.5px solid #C8EAE9",borderRadius:20,padding:"5px 14px",fontSize:".8rem",fontWeight:700,cursor:"pointer",color:"#5A7A8A" }}
                      onClick={() => voteUp(s.id)}>
                      👍 {s.votes}
                    </button>
                    {s.coins > 0 && <span style={{ color:"#F59E0B",fontWeight:700,fontSize:".8rem" }}>+{s.coins}🪙</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ RANKING ═════════════════════════════════════ */}
      {page === "ranking" && (
        <div style={{ maxWidth:600,margin:"0 auto",padding:"40px 5% 80px",animation:"fadeIn .4s ease" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:".7rem",fontWeight:800,color:"#0EA5A0",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>🏆 LEADERBOARD</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)" }}>Top Estudantes</h2>
          </div>
          <div className="card" style={{ overflow:"hidden" }}>
            {ranking.map((u, i) => (
              <div key={u.id} style={{ display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderBottom:i<ranking.length-1?"1px solid #F0F9F8":"none",background:currentUser?.id===u.id?"rgba(14,165,160,.04)":"#fff" }}>
                <div style={{ width:32,textAlign:"center",fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",color:i===0?"#F59E0B":i===1?"#94A3B8":i===2?"#CD7F32":"#B2DFDB",fontWeight:800 }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                </div>
                <div style={{ width:40,height:40,borderRadius:"50%",background:u.color,display:"grid",placeItems:"center",color:"#fff",fontWeight:800,fontSize:".88rem",flexShrink:0 }}>
                  {initials(u.name)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:".95rem" }}>{u.name}</div>
                  <div style={{ fontSize:".74rem",color:"#5A7A8A" }}>@{u.username}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800,color:"#F59E0B",fontSize:"1.05rem" }}>🪙 {u.coins}</div>
                </div>
              </div>
            ))}
            {ranking.length === 0 && (
              <div style={{ padding:"40px",textAlign:"center",color:"#5A7A8A" }}>A carregar ranking...</div>
            )}
          </div>
        </div>
      )}

      {/* ══ AUTH MODAL ══════════════════════════════════ */}
      {authModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,42,63,.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setAuthModal(false)}>
          <div style={{ background:"#fff",borderRadius:24,padding:"32px 28px",maxWidth:440,width:"100%",animation:"slideUp .3s ease",boxShadow:"0 28px 80px rgba(15,42,63,.3)" }}>
            <button style={{ position:"absolute",top:16,right:18,background:"none",border:"none",fontSize:"1.5rem",cursor:"pointer",color:"#B2DFDB",lineHeight:1 }} onClick={() => setAuthModal(false)}>×</button>
            <h2 style={{ fontFamily:"'DM Serif Display',serif",fontSize:"1.6rem",marginBottom:20,textAlign:"center" }}>
              {authTab === "login" ? "👋 Bem-vindo de volta" : "🎓 Criar Conta Grátis"}
            </h2>
            <div style={{ display:"flex",background:"#F0F9F8",borderRadius:12,padding:4,marginBottom:24,gap:4 }}>
              {[["login","Entrar"],["register","Cadastrar"]].map(([t,l]) => (
                <button key={t} style={{ flex:1,padding:"9px",borderRadius:9,border:"none",fontWeight:700,fontSize:".85rem",cursor:"pointer",background:authTab===t?"#fff":"transparent",color:authTab===t?"#0EA5A0":"#5A7A8A",boxShadow:authTab===t?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .2s" }}
                  onClick={() => setAuthTab(t)}>{l}</button>
              ))}
            </div>

            {authTab === "login" && (
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <input style={inp()} placeholder="Username ou Email" value={loginUser} onChange={e => setLoginUser(e.target.value)} />
                <div style={{ position:"relative" }}>
                  <input style={inp({ paddingRight:44 })} type={showLoginPass?"text":"password"} placeholder="Senha" value={loginPass}
                    onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doLogin()} />
                  <button style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"1rem" }}
                    onClick={() => setShowLoginPass(p => !p)}>{showLoginPass ? "🙈" : "👁️"}</button>
                </div>
                {loginErr && <p style={{ color:"#EF4444",fontSize:".82rem",fontWeight:600 }}>{loginErr}</p>}
                <button className="btn-primary" style={{ width:"100%",padding:"13px" }} onClick={doLogin}>Entrar →</button>
              </div>
            )}

            {authTab === "register" && (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {[["text","Nome completo *",regName,setRegName],["text","Username (sem espaços) *",regUser,setRegUser],["email","Email *",regEmail,setRegEmail],["tel","Telefone / WhatsApp",regPhone,setRegPhone],["text","Escola e Classe",regSchool,setRegSchool]].map(([type,ph,val,set]) => (
                  <input key={ph} style={inp()} type={type} placeholder={ph} value={val} onChange={e => set(e.target.value)} />
                ))}
                <div style={{ position:"relative" }}>
                  <input style={inp({ paddingRight:44 })} type={showRegPass?"text":"password"} placeholder="Senha (mín. 6 caracteres) *" value={regPass} onChange={e => setRegPass(e.target.value)} />
                  <button style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"1rem" }}
                    onClick={() => setShowRegPass(p => !p)}>{showRegPass ? "🙈" : "👁️"}</button>
                </div>
                {regErr && <p style={{ color:"#EF4444",fontSize:".82rem",fontWeight:600 }}>{regErr}</p>}
                {regOk  && <p style={{ background:"#DCFCE7",color:"#166534",padding:"10px 14px",borderRadius:10,fontSize:".84rem",fontWeight:600 }}>{regOk}</p>}
                <button className="btn-green" style={{ width:"100%",padding:"13px" }} onClick={doRegister}>Criar Conta Grátis →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ DASHBOARD MODAL ═════════════════════════════ */}
      {dashModal && currentUser && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,42,63,.75)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setDashModal(false)}>
          <div style={{ background:"#fff",borderRadius:24,padding:"32px 28px",maxWidth:520,width:"100%",maxHeight:"88vh",overflowY:"auto",animation:"slideUp .3s ease",boxShadow:"0 28px 80px rgba(15,42,63,.3)" }}>
            <button style={{ position:"absolute",top:16,right:18,background:"none",border:"none",fontSize:"1.5rem",cursor:"pointer",color:"#B2DFDB" }} onClick={() => setDashModal(false)}>×</button>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:24 }}>
              <div style={{ width:56,height:56,borderRadius:"50%",background:currentUser.color,display:"grid",placeItems:"center",fontWeight:800,fontSize:"1.25rem",color:"#fff",flexShrink:0 }}>
                {initials(currentUser.name)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800,fontSize:"1.1rem" }}>{currentUser.name}</div>
                <div style={{ fontSize:".8rem",color:"#5A7A8A",marginTop:2 }}>{currentUser.school || "Escola não informada"}</div>
                <div style={{ color:"#F59E0B",fontWeight:700,fontSize:".88rem",marginTop:4 }}>🪙 {currentUser.coins} moedas</div>
              </div>
              <button style={{ background:"#FEE2E2",color:"#EF4444",border:"none",padding:"7px 16px",borderRadius:30,fontSize:".8rem",fontWeight:700,cursor:"pointer" }}
                onClick={doLogout}>Sair</button>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:22 }}>
              {[[currentUser.coins,"🪙","Moedas"],[currentUser.aiUses||0,"🤖","IA Uses"],[solutions.filter(s=>s.userId===currentUser.id).length,"📤","Enviadas"]].map(([n,icon,l]) => (
                <div key={l} style={{ background:"#F0F9F8",borderRadius:12,padding:"14px 8px",textAlign:"center" }}>
                  <div style={{ fontSize:".9rem",marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:"1.5rem",fontWeight:800,color:"#0EA5A0" }}>{n}</div>
                  <div style={{ fontSize:".66rem",color:"#5A7A8A",marginTop:3,fontWeight:700 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#F0F9F8",borderRadius:14,padding:18 }}>
              <h3 style={{ fontWeight:700,marginBottom:14,fontSize:".92rem" }}>📜 Histórico</h3>
              {(currentUser.history||[]).length === 0 ? (
                <p style={{ color:"#5A7A8A",fontSize:".84rem",textAlign:"center",padding:"12px 0" }}>Sem actividades. Começa a resolver!</p>
              ) : [...(currentUser.history||[])].reverse().slice(0,8).map((h,i) => (
                <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<7?"1px solid #C8EAE9":"none" }}>
                  <span style={{ fontSize:"1.1rem" }}>{h.icon}</span>
                  <span style={{ flex:1,fontSize:".83rem",lineHeight:1.45 }}>{h.text}</span>
                  {h.coins > 0 && <span style={{ color:"#F59E0B",fontWeight:800,fontSize:".8rem" }}>+{h.coins}🪙</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TOAST ═══════════════════════════════════════ */}
      {toast && (
        <div style={{ position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",background:"#0F2A3F",color:"#fff",padding:"12px 24px",borderRadius:30,fontSize:".86rem",fontWeight:600,zIndex:5000,whiteSpace:"nowrap",boxShadow:"0 8px 28px rgba(15,42,63,.4)",animation:"toastIn .3s ease",pointerEvents:"none",maxWidth:"90vw",overflow:"hidden",textOverflow:"ellipsis" }}>
          {toast}
        </div>
      )}

      {/* ══ BOTTOM NAV (mobile) ════════════════════════ */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,.98)",borderTop:"1.5px solid #C8EAE9",display:"flex",justifyContent:"space-around",padding:"8px 0 12px",zIndex:100,backdropFilter:"blur(16px)" }}>
        {navPages.map(p => (
          <button key={p.id} style={{ background:"none",border:"none",color:page===p.id?"#0EA5A0":"#94A3B8",fontSize:".62rem",fontWeight:page===p.id?800:500,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"0 8px",fontFamily:"inherit",transition:"color .15s",minWidth:52 }}
            onClick={() => setPage(p.id)}>
            <span style={{ fontSize:"1.35rem" }}>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      <div style={{ height:72 }} />
    </div>
  );
}
