import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════
   PASSA FÁCIL PRO — Frontend Angola 🇦🇴
   Design: Academic Premium · Verde/Teal/Ouro
   Tonalidade: Confiante, jovem, angolana
═══════════════════════════════════════════════════════ */

// ── helpers ──────────────────────────────────────────
const COLORS = ["#0EA5A0","#22C55E","#8B5CF6","#F59E0B","#EF4444","#3B82F6","#EC4899","#14B8A6"];
const initials = name => name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
const now = () => new Date().toLocaleDateString("pt-AO");
const uid = () => "u_" + Date.now() + Math.random().toString(36).slice(2,6);

// ── in-memory store ───────────────────────────────────
let USERS = [
  {id:"d1",name:"Maria João",username:"mariaj",email:"maria@ex.ao",pass:"123456",color:"#0EA5A0",school:"12ª — Colégio Nacional",coins:350,solutions:7,aiUses:12,history:[{icon:"✅",text:"Resolução aprovada em Matemática",coins:50},{icon:"✅",text:"Resolução aprovada em Física",coins:50}]},
  {id:"d2",name:"Carlos Mbala",username:"cmbala",email:"carlos@ex.ao",pass:"123456",color:"#8B5CF6",school:"12ª — PUNIV",coins:280,solutions:6,aiUses:9,history:[{icon:"✅",text:"Resolução aprovada em Química",coins:100}]},
  {id:"d3",name:"Ana Ferreira",username:"anaf",email:"ana@ex.ao",pass:"123456",color:"#22C55E",school:"11ª — Escola 4 de Fevereiro",coins:250,solutions:5,aiUses:8,history:[]},
  {id:"d4",name:"Pedro Lopes",username:"pedrol",email:"pedro@ex.ao",pass:"123456",color:"#F59E0B",school:"12ª — Liceu Camões",coins:150,solutions:3,aiUses:5,history:[]},
];
let SOLUTIONS = [
  {id:1,userId:"d1",userName:"Maria João",userColor:"#0EA5A0",discipline:"Matemática",date:"20/01/2025",question:"Resolva a equação x² - 7x + 12 = 0",answer:"Usando Bhaskara:\nΔ = 49 - 48 = 1\nx = (7 ± 1) / 2\nx₁ = 4  e  x₂ = 3\n\n✅ Raízes: x = 3 e x = 4",status:"approved",coins:50,votes:12,aiScore:98},
  {id:2,userId:"d2",userName:"Carlos Mbala",userColor:"#8B5CF6",discipline:"Física",date:"21/01/2025",question:"Objecto cai de 80m. Tempo até ao chão? (g=10m/s²)",answer:"Queda livre (MRUV):\ns = ½gt²\n80 = 5t²\nt² = 16\nt = 4 segundos ✅",status:"approved",coins:50,votes:8,aiScore:96},
  {id:3,userId:"d3",userName:"Ana Ferreira",userColor:"#22C55E",discipline:"Química",date:"21/01/2025",question:"Balance: C + O₂ → CO₂",answer:"Verificando:\nEsquerda: C=1, O=2\nDireita:  C=1, O=2\nJá está balanceada! ✅",status:"approved",coins:50,votes:15,aiScore:100},
  {id:4,userId:"d4",userName:"Pedro Lopes",userColor:"#F59E0B",discipline:"Empreendedorismo",date:"22/01/2025",question:"Custos fixos 50.000Kz, preço 2.500Kz, CV 1.000Kz. Ponto equilíbrio?",answer:"MC = 2500 - 1000 = 1500 Kz\nPE = 50000 ÷ 1500 ≈ 34 unidades/mês ✅",status:"pending",coins:0,votes:3,aiScore:92},
];

// ── AI ────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, maxTokens=900) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens,
      system:systemPrompt, messages:[{role:"user",content:userMessage}] })
  });
  const data = await res.json();
  return data.content?.map(b=>b.text||"").join("") || "";
}
async function aiSolve(exercise, discipline, level) {
  const sys = `És o professor de ${discipline} do PassaFácil Angola (ensino médio angolano, ${level}).
Resolve exercícios de forma clara e pedagógica em português angolano.
Usa este formato EXACTO:
📝 ENUNCIADO\n[repetição breve]\n\n🔍 DADOS\n[variáveis]\n\n📐 MÉTODO\n[fórmulas]\n\n🔢 RESOLUÇÃO PASSO A PASSO\n1. [passo]\n...\n\n✅ RESPOSTA FINAL\n[resultado]\n\n💡 DICA\n[truque para memorizar]`;
  return await callClaude(sys, exercise);
}
async function aiModerate(question, answer, discipline) {
  const sys = `És professor rigoroso de ${discipline} do ensino médio angolano. Avalia a resolução. Responde APENAS em JSON puro (sem markdown): {"score":0-100,"verdict":"CORRECTO|PARCIAL|INCORRETO","feedback":"1 frase","tip":"1 sugestão"}`;
  const raw = await callClaude(sys, `QUESTÃO: ${question}\nRESPOSTA: ${answer}`, 300);
  try { return JSON.parse(raw.replace(/```json|```/g,"").trim()); }
  catch { return {score:60,verdict:"PARCIAL",feedback:"Resposta recebida.",tip:""} }
}

// ── RESUMOS data ──────────────────────────────────────
const RESUMOS = {
  mat:[
    {title:"📐 Equações do 2º Grau",free:true,desc:"Fórmula resolvente, discriminante e tipos de raízes.",body:`Fórmula Resolvente (Bhaskara):\nx = (-b ± √Δ) / 2a    Δ = b² - 4ac\n\nΔ > 0 → duas raízes reais distintas\nΔ = 0 → raiz dupla  x = -b/2a\nΔ < 0 → sem raízes reais`,ex:"Resolva: 2x² - 5x + 3 = 0 usando Bhaskara. Mostre todos os passos.",disc:"Matemática"},
    {title:"📈 Funções do 1º Grau",free:true,desc:"Função afim, declive, zero e sentido de variação.",body:`f(x) = mx + b\nm = declive  |  b = ordenada na origem\nm > 0 → crescente  |  m < 0 → decrescente\nZero: x = -b/m`,ex:"Determine o zero, declive e analise f(x) = -3x + 9.",disc:"Matemática"},
    {title:"📊 Progressões (PA e PG)",free:false,desc:"Termos gerais, somas e aplicações.",body:"",ex:"",disc:"Matemática"},
  ],
  fis:[
    {title:"🚀 Cinemática — MRU e MRUV",free:true,desc:"Movimentos rectilíneos com equações completas.",body:`MRU:   s = s₀ + v·t\nMRUV:  s = s₀ + v₀t + ½at²\n       v = v₀ + at\n       v² = v₀² + 2aΔs  (Torricelli)`,ex:"Um carro parte do repouso com a=3 m/s². Calcule v após 8s e espaço percorrido.",disc:"Física"},
    {title:"⚡ Lei de Ohm e Circuitos",free:true,desc:"Resistência, tensão, corrente, série e paralelo.",body:`V = R·I    P = V·I = I²·R\nSérie:    Rt = R1+R2+...\nParalelo: 1/Rt = 1/R1+1/R2+...`,ex:"R1=6Ω e R2=3Ω em paralelo com 18V. Calcule Rt, corrente total e em cada ramo.",disc:"Física"},
  ],
  qui:[
    {title:"🔗 Ligações Químicas",free:true,desc:"Iónica, covalente e metálica.",body:`Iónica: Metal + Não-metal → transferência e⁻  (NaCl)\nCovalente: NM + NM → partilha e⁻  (H₂O)\nMetálica: Metal + Metal → mar de e⁻  (Fe)\n\nRegra do Octeto: 8 e⁻ na camada de valência`,ex:"Classifique e justifique o tipo de ligação em: NaCl, O₂, H₂O, Al.",disc:"Química"},
    {title:"⚗️ Balanceamento de Reacções",free:true,desc:"Passos para balancear equações correctamente.",body:`1. Escrever sem balancear\n2. Contar átomos em cada lado\n3. Ajustar coeficientes (NUNCA os índices)\n\nEx: 2H₂ + O₂ → 2H₂O ✅`,ex:"Balance: Al + O₂ → Al₂O₃. Mostre a contagem antes e depois.",disc:"Química"},
  ],
  emp:[
    {title:"📋 Plano de Negócios",free:true,desc:"As 6 secções essenciais de um plano.",body:`1. Sumário Executivo\n2. Análise de Mercado\n3. Produto/Serviço\n4. Estratégia de Marketing\n5. Plano Financeiro\n6. Equipa\n\nPE = Custos Fixos ÷ (Preço - CV)`,ex:"Plano para barbearia em Luanda: CF=40.000Kz/mês, preço=1500Kz, CV=300Kz.",disc:"Empreendedorismo"},
    {title:"📣 Marketing Mix — 4 P's",free:true,desc:"Produto, Preço, Praça, Promoção.",body:`🛍️ Produto: qualidade, embalagem, marca\n💰 Preço: penetração, skimming, psicológico\n📍 Praça: loja, online, mercado\n📢 Promoção: redes sociais, boca-a-boca`,ex:"Aplica os 4 Ps para revenda de roupas em Angola usando canais angolanos.",disc:"Empreendedorismo"},
  ],
};

const quickSolves = [
  {label:"🔢 Bhaskara: x²-5x+6=0",disc:"Matemática",q:"Resolva x² - 5x + 6 = 0 usando Bhaskara. Mostre Δ e as raízes."},
  {label:"⚡ Queda livre: h=45m",disc:"Física",q:"Objecto cai de 45m. Calcule tempo e velocidade de impacto. g=10m/s²."},
  {label:"🧪 Balance: Fe + O₂ → Fe₂O₃",disc:"Química",q:"Balance Fe + O₂ → Fe₂O₃ e verifique conservação da massa."},
  {label:"💼 Ponto de Equilíbrio: barraca",disc:"Empreendedorismo",q:"Barraca de sumos: CF=20.000Kz, preço=500Kz, CV=180Kz. Calcule PE e lucro com 100 sumos."},
  {label:"🔢 PA: 2,5,8... 20º termo",disc:"Matemática",q:"PA 2,5,8,11... Encontre o termo geral, o 20º termo e soma dos 10 primeiros."},
  {label:"⚡ Lei de Ohm em paralelo",disc:"Física",q:"R1=4Ω e R2=8Ω em paralelo com 24V. Calcule Rt, corrente total e em cada ramo."},
];

// ═══════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function PassaFacil() {
  const [page, setPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(USERS);
  const [solutions, setSolutions] = useState(SOLUTIONS);
  const [authModal, setAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [dashModal, setDashModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [resumeTab, setResumeTab] = useState("mat");

  // Auth
  const [loginUser, setLoginUser] = useState(""); const [loginPass, setLoginPass] = useState(""); const [loginErr, setLoginErr] = useState("");
  const [regName,setRegName]=useState(""); const [regUser,setRegUser]=useState(""); const [regEmail,setRegEmail]=useState("");
  const [regPhone,setRegPhone]=useState(""); const [regSchool,setRegSchool]=useState(""); const [regPass,setRegPass]=useState("");
  const [regErr,setRegErr]=useState(""); const [regOk,setRegOk]=useState("");

  // Solver
  const [solverMode, setSolverMode] = useState("text");
  const [exercise,setExercise]=useState(""); const [disc,setDisc]=useState("Matemática"); const [level]=useState("12ª Classe");
  const [aiLoading,setAiLoading]=useState(false); const [aiResult,setAiResult]=useState(""); const [lastExercise,setLastExercise]=useState("");

  // Community
  const [postQ,setPostQ]=useState(""); const [postA,setPostA]=useState(""); const [postDisc,setPostDisc]=useState("Matemática");
  const [posting,setPosting]=useState(false); const [filterDisc,setFilterDisc]=useState("Todos");

  // Admin
  const [modFilter,setModFilter]=useState("all"); const [adminUnlocked,setAdminUnlocked]=useState(false);
  const [adminPass,setAdminPass]=useState(""); const [verifying,setVerifying]=useState({});

  const showToast = (msg,dur=3200) => { setToast(msg); setTimeout(()=>setToast(null),dur); };
  const syncUser = updated => { setCurrentUser(updated); setUsers(p=>p.map(u=>u.id===updated.id?updated:u)); USERS=USERS.map(u=>u.id===updated.id?updated:u); };

  // ── AUTH ──────────────────────────────────────────────
  const doLogin = () => {
    setLoginErr("");
    const u = users.find(u=>(u.username===loginUser.toLowerCase()||u.email===loginUser.toLowerCase())&&u.pass===loginPass);
    if (!u) { setLoginErr("⚠️ Utilizador ou senha incorrectos."); return; }
    setCurrentUser(u); setAuthModal(false); setLoginUser(""); setLoginPass("");
    showToast(`✅ Bem-vindo de volta, ${u.name.split(" ")[0]}!`);
  };
  const doRegister = () => {
    setRegErr(""); setRegOk("");
    if (!regName||!regUser||!regEmail||!regPass) { setRegErr("⚠️ Preenche todos os campos obrigatórios."); return; }
    if (regPass.length<6) { setRegErr("⚠️ Senha com mínimo 6 caracteres."); return; }
    if (users.find(u=>u.username===regUser.toLowerCase())) { setRegErr("⚠️ Username já existe."); return; }
    if (users.find(u=>u.email===regEmail.toLowerCase())) { setRegErr("⚠️ Email já cadastrado."); return; }
    const newU = { id:uid(), name:regName, username:regUser.toLowerCase(), email:regEmail.toLowerCase(),
      phone:regPhone, school:regSchool, pass:regPass, color:COLORS[Math.floor(Math.random()*COLORS.length)],
      coins:20, solutions:0, aiUses:0, history:[{icon:"🎁",text:"Bónus de boas-vindas",coins:20}] };
    const updated = [...users, newU]; setUsers(updated); USERS=updated; setCurrentUser(newU);
    setRegOk(`🎉 Conta criada! Tens 20 moedas de bónus, ${regName.split(" ")[0]}!`);
    setTimeout(()=>{ setAuthModal(false); setRegOk(""); setRegName("");setRegUser("");setRegEmail("");setRegPhone("");setRegSchool("");setRegPass(""); },1800);
  };
  const doLogout = () => { setCurrentUser(null); setDashModal(false); showToast("👋 Até logo!"); };

  // ── SOLVER ────────────────────────────────────────────
  const runSolver = async (ex, d, lv) => {
    if (!ex.trim()) { showToast("⚠️ Escreve um exercício primeiro!"); return; }
    setAiLoading(true); setAiResult(""); setLastExercise(ex);
    try {
      const result = await aiSolve(ex, d, lv); setAiResult(result);
      if (currentUser) { const u={...currentUser,aiUses:(currentUser.aiUses||0)+1,history:[...(currentUser.history||[]),{icon:"🤖",text:`IA: "${ex.slice(0,45)}..."`,coins:0}]}; syncUser(u); }
    } catch { setAiResult("⚠️ Erro de ligação. Verifica a tua internet e tenta novamente."); }
    setAiLoading(false);
  };

  // ── COMMUNITY ─────────────────────────────────────────
  const submitSolution = async () => {
    if (!currentUser) { setAuthModal(true); return; }
    if (!postQ.trim()||!postA.trim()) { showToast("⚠️ Preenche o enunciado e a resolução!"); return; }
    if (postA.length<30) { showToast("⚠️ Resolução muito curta. Mostra os passos!"); return; }
    setPosting(true); showToast("🤖 A verificar com IA...");
    const verdict = await aiModerate(postQ,postA,postDisc).catch(()=>({score:55,verdict:"PARCIAL",feedback:"Aguarda revisão.",tip:""}));
    const coinReward = verdict.score>=90?100:verdict.score>=70?50:0;
    const status = verdict.score>=70?"approved":"pending";
    const newSol = {id:Date.now(),userId:currentUser.id,userName:currentUser.name,userColor:currentUser.color,discipline:postDisc,date:now(),question:postQ,answer:postA,status,coins:coinReward,votes:0,aiScore:verdict.score,feedback:verdict.feedback};
    const updated=[newSol,...solutions]; setSolutions(updated); SOLUTIONS=updated;
    if (coinReward>0) {
      syncUser({...currentUser,coins:currentUser.coins+coinReward,solutions:(currentUser.solutions||0)+1,history:[...(currentUser.history||[]),{icon:"✅",text:`Resolução aprovada em ${postDisc}`,coins:coinReward}]});
      showToast(`🎉 Aprovada! +${coinReward} moedas! Score: ${verdict.score}%`);
    } else { showToast(`📤 Enviada! Score IA: ${verdict.score}%. Aguarda revisão.`); }
    setPostQ(""); setPostA(""); setPosting(false);
  };
  const voteUp = id => { const u=solutions.map(s=>s.id===id?{...s,votes:s.votes+1}:s); setSolutions(u); SOLUTIONS=u; showToast("👍 Voto registado!"); };
  const shareAI = () => { if(!aiResult)return; if(!currentUser){setAuthModal(true);return;} setPostQ(lastExercise); setPostA(aiResult.replace(/[*#]/g,"")); setPostDisc(disc); setPage("comunidade"); showToast("📝 Copiado para o formulário!"); };

  // ── MODERATION ────────────────────────────────────────
  const unlockAdmin = () => { if(adminPass==="admin2025"){setAdminUnlocked(true);}else{showToast("❌ Senha incorrecta.");} };
  const moderateAction = async (id, action) => {
    const sol=solutions.find(s=>s.id===id); if(!sol)return;
    const coinReward=action==="approved"?(sol.aiScore>=90?100:50):0;
    const upd=solutions.map(s=>s.id===id?{...s,status:action,coins:coinReward}:s); setSolutions(upd); SOLUTIONS=upd;
    if (action==="approved"&&coinReward>0) {
      const owner=users.find(u=>u.id===sol.userId);
      if(owner){ const updO={...owner,coins:owner.coins+coinReward,solutions:(owner.solutions||0)+1,history:[...(owner.history||[]),{icon:"✅",text:`Moderador aprovou em ${sol.discipline}`,coins:coinReward}]};
        setUsers(p=>p.map(u=>u.id===updO.id?updO:u)); USERS=USERS.map(u=>u.id===updO.id?updO:u);
        if(currentUser?.id===updO.id)setCurrentUser(updO); }
      showToast(`✅ Aprovado! ${coinReward} moedas ao aluno.`);
    } else { showToast("❌ Resolução rejeitada."); }
  };
  const reVerify = async id => {
    const sol=solutions.find(s=>s.id===id); if(!sol)return;
    setVerifying(v=>({...v,[id]:true}));
    const verdict=await aiModerate(sol.question,sol.answer,sol.discipline).catch(()=>({score:50}));
    const upd=solutions.map(s=>s.id===id?{...s,aiScore:verdict.score,feedback:verdict.feedback}:s); setSolutions(upd); SOLUTIONS=upd;
    setVerifying(v=>({...v,[id]:false})); showToast(`🤖 Nova pontuação IA: ${verdict.score}%`);
  };

  const approvedSols = solutions.filter(s=>s.status==="approved").length;
  const filteredSols = modFilter==="all"?solutions:solutions.filter(s=>s.status===modFilter);
  const sortedUsers  = [...users].sort((a,b)=>b.coins-a.coins).slice(0,8);
  const commSols     = filterDisc==="Todos"?solutions.filter(s=>s.status==="approved"):solutions.filter(s=>s.status==="approved"&&s.discipline===filterDisc);

  const navPages = [{id:"home",icon:"📚",label:"Resumos"},{id:"resolver",icon:"🤖",label:"Resolver IA"},{id:"comunidade",icon:"👥",label:"Comunidade"},{id:"ranking",icon:"🏆",label:"Ranking"}];

  // ═════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════
  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#F0F9F8",minHeight:"100vh",color:"#0F2A3F"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,textarea,select,button{font-family:inherit;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:#B2DFDB;border-radius:10px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .nav-link:hover{background:rgba(14,165,160,.08)!important;}
        .card-hover:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(14,165,160,.14)!important;transition:all .2s ease;}
        .btn-hover:hover{filter:brightness(1.06);transform:translateY(-1px);}
        .sol-card:hover{border-color:#0EA5A0!important;}
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav style={{position:"sticky",top:0,zIndex:200,background:"rgba(255,255,255,.96)",backdropFilter:"blur(16px)",borderBottom:"1px solid #C8EAE9",height:64,display:"flex",alignItems:"center",padding:"0 5%",gap:16}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",flexShrink:0}} onClick={()=>setPage("home")}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#0EA5A0,#22C55E)",display:"grid",placeItems:"center",fontSize:"1.1rem",boxShadow:"0 4px 12px rgba(14,165,160,.35)"}}>📚</div>
          <span style={{fontWeight:800,fontSize:"1.15rem",color:"#0EA5A0",fontFamily:"'DM Serif Display',serif",letterSpacing:.2}}>
            Passa<span style={{color:"#0F2A3F"}}>Fácil</span>
          </span>
          <span style={{fontSize:".65rem",fontWeight:700,background:"#DCFCE7",color:"#166534",padding:"2px 8px",borderRadius:20,letterSpacing:.5}}>PRO</span>
        </div>

        {/* Nav Links */}
        <div style={{display:"flex",gap:2,flex:1,justifyContent:"center"}}>
          {navPages.map(p=>(
            <button key={p.id} className="nav-link"
              style={{background:page===p.id?"rgba(14,165,160,.1)":"transparent",color:page===p.id?"#0EA5A0":"#5A7A8A",border:"none",padding:"7px 14px",borderRadius:10,fontWeight:page===p.id?700:500,fontSize:".86rem",cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:5}}
              onClick={()=>setPage(p.id)}>
              <span>{p.icon}</span><span style={{display:"none"}}>{p.label}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* User area */}
        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          {currentUser ? (
            <button style={{display:"flex",alignItems:"center",gap:8,background:"#F0F9F8",border:"1.5px solid #B2DFDB",borderRadius:30,padding:"5px 14px 5px 6px",cursor:"pointer",fontWeight:700,fontSize:".82rem",color:"#0F2A3F"}} onClick={()=>setDashModal(true)}>
              <div style={{width:28,height:28,borderRadius:"50%",background:currentUser.color,display:"grid",placeItems:"center",color:"#fff",fontSize:".75rem",fontWeight:800}}>{initials(currentUser.name)}</div>
              <span style={{color:"#F59E0B"}}>🪙 {currentUser.coins}</span>
            </button>
          ) : (
            <button className="btn-hover" style={{background:"linear-gradient(135deg,#0EA5A0,#0C8A86)",color:"#fff",border:"none",padding:"8px 20px",borderRadius:30,fontWeight:700,fontSize:".86rem",cursor:"pointer",boxShadow:"0 4px 16px rgba(14,165,160,.3)"}} onClick={()=>setAuthModal(true)}>
              Entrar / Cadastrar
            </button>
          )}
          <button style={{background:"none",border:"1.5px solid #C8EAE9",color:"#5A7A8A",padding:"7px 12px",borderRadius:10,cursor:"pointer",fontSize:".8rem",fontWeight:600}} onClick={()=>setPage("moderation")}>🛡️</button>
        </div>
      </nav>

      {/* ── HOME ─────────────────────────────────────────── */}
      {page==="home" && (
        <div style={{animation:"fadeIn .4s ease"}}>
          {/* Hero */}
          <div style={{background:"linear-gradient(135deg,#0F2A3F 0%,#0C5C5A 50%,#0EA5A0 100%)",padding:"72px 5% 56px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-80,right:-80,width:400,height:400,borderRadius:"50%",background:"rgba(34,197,94,.08)",pointerEvents:"none"}} />
            <div style={{position:"absolute",bottom:-60,left:-60,width:300,height:300,borderRadius:"50%",background:"rgba(14,165,160,.1)",pointerEvents:"none"}} />
            <div style={{maxWidth:700,margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:".75rem",fontWeight:700,padding:"5px 18px",borderRadius:30,marginBottom:22,letterSpacing:.8}}>
                🇦🇴 FEITO PARA ESTUDANTES ANGOLANOS
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20,flexWrap:"wrap"}}>
                {["🤖 IA Resolve Exercícios","🏆 Ganha Moedas","👥 Comunidade Activa"].map(f=>(
                  <span key={f} style={{background:"rgba(245,158,11,.18)",border:"1px solid rgba(245,158,11,.35)",color:"#FEF3C7",fontSize:".72rem",fontWeight:700,padding:"4px 13px",borderRadius:20}}>{f}</span>
                ))}
              </div>
              <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2.2rem,5.5vw,3.6rem)",color:"#fff",lineHeight:1.12,marginBottom:18}}>
                Estuda Mais,{" "}
                <em style={{color:"#22C55E",fontStyle:"italic"}}>Passa com Confiança</em>
              </h1>
              <p style={{color:"rgba(255,255,255,.78)",lineHeight:1.72,maxWidth:520,margin:"0 auto 32px",fontSize:"1rem"}}>
                Resumos, exercícios resolvidos por IA, comunidade de alunos e sistema de recompensas para resoluções correctas.
              </p>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <button className="btn-hover" style={{background:"#22C55E",color:"#fff",border:"none",padding:"13px 30px",borderRadius:40,fontWeight:700,fontSize:".95rem",cursor:"pointer",boxShadow:"0 6px 22px rgba(34,197,94,.4)"}} onClick={()=>setAuthModal(true)}>
                  🎓 Cadastrar Grátis
                </button>
                <button className="btn-hover" style={{background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,.45)",padding:"13px 30px",borderRadius:40,fontWeight:700,fontSize:".95rem",cursor:"pointer"}} onClick={()=>setPage("resolver")}>
                  🤖 Resolver com IA
                </button>
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:44,marginTop:48,flexWrap:"wrap"}}>
                {[["4","Disciplinas"],["50+","Resumos"],[approvedSols+"+","Resoluções"],["500+","Alunos"]].map(([n,l])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:"2rem",fontWeight:800,color:"#22C55E",fontFamily:"'DM Serif Display',serif"}}>{n}</div>
                    <div style={{fontSize:".72rem",color:"rgba(255,255,255,.6)",marginTop:3,fontWeight:500}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumos por disciplina */}
          <div style={{padding:"60px 5%",maxWidth:860,margin:"0 auto"}}>
            <div style={{marginBottom:32,display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <span style={{fontSize:".72rem",fontWeight:700,color:"#0EA5A0",letterSpacing:1.5,textTransform:"uppercase"}}>📚 CONTEÚDOS</span>
                <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",marginTop:6}}>Resumos por Disciplina</h2>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["mat","🔢 Mat"],["fis","⚡ Física"],["qui","🧪 Química"],["emp","💼 Empreend."]].map(([k,l])=>(
                  <button key={k} style={{background:resumeTab===k?"#0EA5A0":"#fff",color:resumeTab===k?"#fff":"#5A7A8A",border:`1.5px solid ${resumeTab===k?"#0EA5A0":"#C8EAE9"}`,padding:"7px 16px",borderRadius:30,fontSize:".82rem",fontWeight:700,cursor:"pointer",transition:"all .15s"}} onClick={()=>setResumeTab(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {RESUMOS[resumeTab].map((r,i)=>(
                <div key={i} className="card-hover" style={{background:"#fff",border:"1.5px solid #C8EAE9",borderRadius:16,padding:"22px 26px",transition:"all .2s",cursor:"default"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:"1rem"}}>{r.title}</span>
                    <span style={{background:r.free?"#DCFCE7":"#FEF3C7",color:r.free?"#166534":"#92400E",fontSize:".68rem",fontWeight:700,padding:"3px 10px",borderRadius:20,letterSpacing:.5}}>{r.free?"GRÁTIS":"PREMIUM"}</span>
                  </div>
                  <p style={{color:"#5A7A8A",fontSize:".88rem",marginBottom:r.free&&r.body?14:10,lineHeight:1.6}}>{r.desc}</p>
                  {r.free && r.body && <pre style={{background:"#F0F9F8",borderRadius:10,padding:"14px 18px",fontSize:".82rem",lineHeight:1.85,whiteSpace:"pre-wrap",marginBottom:14,color:"#0F2A3F",fontFamily:"inherit",border:"1px solid #B2DFDB"}}>{r.body}</pre>}
                  {!r.free && <div style={{background:"#FEF3C7",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:".84rem",color:"#92400E",display:"flex",alignItems:"center",gap:8}}>🔒 <span>Disponível no plano <strong>Premium</strong></span></div>}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {r.free && r.ex && <button className="btn-hover" style={{background:"#0EA5A0",color:"#fff",border:"none",padding:"7px 16px",borderRadius:30,fontSize:".82rem",fontWeight:700,cursor:"pointer"}} onClick={()=>{setExercise(r.ex);setDisc(r.disc);setPage("resolver");}}>🤖 Resolver Exemplo</button>}
                    <a href="https://wa.me/244936837429" target="_blank" rel="noreferrer" style={{background:"#DCFCE7",color:"#166534",border:"none",padding:"7px 16px",borderRadius:30,fontSize:".82rem",fontWeight:700,cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5}}>⬇ Baixar PDF</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RESOLVER IA ──────────────────────────────────── */}
      {page==="resolver" && (
        <div style={{background:"linear-gradient(160deg,#0F2A3F,#0C5C5A)",minHeight:"calc(100vh - 64px)",padding:"50px 5%",animation:"fadeIn .4s ease"}}>
          <div style={{maxWidth:780,margin:"0 auto"}}>
            <span style={{background:"rgba(255,255,255,.13)",color:"#fff",fontSize:".72rem",fontWeight:700,padding:"5px 16px",borderRadius:20,letterSpacing:1}}>🤖 INTELIGÊNCIA ARTIFICIAL</span>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.7rem,3.5vw,2.4rem)",color:"#fff",margin:"10px 0 8px"}}>Resolve Exercícios com IA</h2>
            <p style={{color:"rgba(255,255,255,.68)",marginBottom:28,lineHeight:1.65,maxWidth:560}}>Cola o teu exercício e recebe resolução completa passo a passo. Partilha na comunidade e ganha moedas!</p>

            {/* Mode toggle */}
            <div style={{display:"flex",gap:8,marginBottom:22,background:"rgba(255,255,255,.07)",padding:5,borderRadius:14,width:"fit-content"}}>
              {[["text","✏️ Digitar"],["quick","⚡ Exemplos Prontos"]].map(([m,l])=>(
                <button key={m} style={{background:solverMode===m?"rgba(255,255,255,.18)":"transparent",color:solverMode===m?"#fff":"rgba(255,255,255,.6)",border:"none",padding:"8px 18px",borderRadius:10,fontSize:".84rem",fontWeight:700,cursor:"pointer",transition:"all .15s"}} onClick={()=>setSolverMode(m)}>{l}</button>
              ))}
            </div>

            {solverMode==="text" && (
              <div>
                <textarea style={{width:"100%",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.18)",color:"#fff",borderRadius:14,padding:"16px 18px",fontSize:".92rem",lineHeight:1.65,minHeight:130,resize:"vertical",outline:"none",fontFamily:"inherit"}}
                  placeholder={"Ex: Resolva 3x² - 12x + 9 = 0...\n\nPodes escrever qualquer exercício de Matemática, Física, Química ou Empreendedorismo!"}
                  value={exercise} onChange={e=>setExercise(e.target.value)} />
                <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap",alignItems:"center"}}>
                  {[["Matemática","🔢"],["Física","⚡"],["Química","🧪"],["Empreendedorismo","💼"]].map(([d,icon])=>(
                    <button key={d} style={{background:disc===d?"rgba(14,165,160,.5)":"rgba(255,255,255,.08)",color:disc===d?"#fff":"rgba(255,255,255,.7)",border:`1px solid ${disc===d?"#0EA5A0":"rgba(255,255,255,.18)"}`,padding:"7px 14px",borderRadius:30,fontSize:".82rem",fontWeight:700,cursor:"pointer",transition:"all .15s"}} onClick={()=>setDisc(d)}>{icon} {d}</button>
                  ))}
                  <button className="btn-hover" style={{background:"#22C55E",color:"#fff",border:"none",padding:"10px 24px",borderRadius:30,fontWeight:700,fontSize:".9rem",cursor:"pointer",marginLeft:"auto",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(34,197,94,.35)",opacity:aiLoading?.5:1}} disabled={aiLoading} onClick={()=>runSolver(exercise,disc,level)}>
                    {aiLoading?<><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> A resolver...</>:<><span>🤖</span><span>Resolver Agora</span></>}
                  </button>
                </div>
              </div>
            )}

            {solverMode==="quick" && (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
                {quickSolves.map((qs,i)=>(
                  <button key={i} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.14)",color:"rgba(255,255,255,.88)",borderRadius:12,padding:"14px 16px",fontSize:".84rem",cursor:"pointer",textAlign:"left",lineHeight:1.5,fontFamily:"inherit",transition:"all .15s"}} onClick={()=>{setExercise(qs.q);setDisc(qs.disc);setSolverMode("text");runSolver(qs.q,qs.disc,level);}}>
                    {qs.label}
                  </button>
                ))}
              </div>
            )}

            {(aiLoading||aiResult) && (
              <div style={{marginTop:24,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.14)",borderRadius:16,padding:24,animation:"slideUp .35s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                  <span style={{fontSize:"1.3rem"}}>🤖</span>
                  <span style={{fontWeight:700,color:"#fff"}}>Resolução PassaFácil IA</span>
                  {!aiLoading && <span style={{background:"#22C55E",color:"#fff",fontSize:".7rem",fontWeight:700,padding:"3px 10px",borderRadius:20}}>RESOLVIDO</span>}
                  <span style={{fontSize:".75rem",color:"rgba(255,255,255,.45)",marginLeft:"auto"}}>{disc}</span>
                </div>
                {aiLoading ? (
                  <div style={{color:"rgba(255,255,255,.6)",fontSize:".9rem",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> A IA está a resolver o teu exercício...
                  </div>
                ) : (
                  <pre style={{color:"rgba(255,255,255,.92)",fontSize:".88rem",lineHeight:1.82,whiteSpace:"pre-wrap",fontFamily:"inherit",margin:0}}>{aiResult}</pre>
                )}
                {!aiLoading && aiResult && (
                  <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
                    <button className="btn-hover" style={{background:"#F59E0B",color:"#fff",border:"none",padding:"8px 18px",borderRadius:30,fontWeight:700,fontSize:".82rem",cursor:"pointer"}} onClick={shareAI}>🏆 Partilhar (+50 moedas!)</button>
                    <button style={{background:"rgba(255,255,255,.12)",color:"rgba(255,255,255,.85)",border:"none",padding:"8px 18px",borderRadius:30,fontWeight:700,fontSize:".82rem",cursor:"pointer"}} onClick={()=>navigator.clipboard.writeText(aiResult).then(()=>showToast("📋 Copiado!"))}>📋 Copiar</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMUNIDADE ─────────────────────────────────────── */}
      {page==="comunidade" && (
        <div style={{padding:"50px 5%",maxWidth:860,margin:"0 auto",animation:"fadeIn .4s ease"}}>
          <div style={{marginBottom:28}}>
            <span style={{fontSize:".72rem",fontWeight:700,color:"#0EA5A0",letterSpacing:1.5,textTransform:"uppercase"}}>👥 COMUNIDADE</span>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",marginTop:6}}>Resoluções dos Alunos</h2>
          </div>

          {/* Submeter resolução */}
          <div style={{background:"#fff",border:"1.5px solid #C8EAE9",borderRadius:16,padding:"24px 26px",marginBottom:28}}>
            <h3 style={{fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:8,fontSize:".98rem"}}>
              📤 Partilhar uma Resolução
              {!currentUser && <span style={{fontSize:".78rem",color:"#5A7A8A",fontWeight:500}}>— Faz login para ganhar moedas!</span>}
            </h3>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              {["Matemática","Física","Química","Empreendedorismo"].map(d=>(
                <button key={d} style={{background:postDisc===d?"#0EA5A0":"#F0F9F8",color:postDisc===d?"#fff":"#5A7A8A",border:`1px solid ${postDisc===d?"#0EA5A0":"#C8EAE9"}`,padding:"5px 14px",borderRadius:30,fontSize:".8rem",fontWeight:600,cursor:"pointer",transition:"all .15s"}} onClick={()=>setPostDisc(d)}>{d}</button>
              ))}
            </div>
            <input style={{width:"100%",border:"1.5px solid #C8EAE9",borderRadius:10,padding:"11px 14px",marginBottom:10,outline:"none",fontSize:".88rem",color:"#0F2A3F",background:"#fff"}} placeholder="Enunciado do exercício..." value={postQ} onChange={e=>setPostQ(e.target.value)} />
            <textarea style={{width:"100%",border:"1.5px solid #C8EAE9",borderRadius:10,padding:"11px 14px",minHeight:90,resize:"vertical",outline:"none",fontSize:".88rem",lineHeight:1.6,fontFamily:"inherit",color:"#0F2A3F",background:"#fff"}} placeholder="A tua resolução passo a passo..." value={postA} onChange={e=>setPostA(e.target.value)} />
            <button className="btn-hover" style={{marginTop:12,background:posting?"#B2DFDB":"#0EA5A0",color:"#fff",border:"none",padding:"10px 24px",borderRadius:30,fontWeight:700,fontSize:".88rem",cursor:"pointer",display:"flex",alignItems:"center",gap:8}} disabled={posting} onClick={submitSolution}>
              {posting?<><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> A verificar...</>:"🤖 Enviar e Verificar com IA"}
            </button>
          </div>

          {/* Filtros */}
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
            {["Todos","Matemática","Física","Química","Empreendedorismo"].map(d=>(
              <button key={d} style={{background:filterDisc===d?"#0EA5A0":"#fff",color:filterDisc===d?"#fff":"#5A7A8A",border:`1px solid ${filterDisc===d?"#0EA5A0":"#C8EAE9"}`,padding:"5px 14px",borderRadius:30,fontSize:".8rem",fontWeight:600,cursor:"pointer",transition:"all .15s"}} onClick={()=>setFilterDisc(d)}>{d}</button>
            ))}
          </div>

          {/* Lista */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {commSols.length===0 && <div style={{textAlign:"center",padding:40,color:"#5A7A8A",background:"#fff",borderRadius:14,border:"1px solid #C8EAE9"}}>Sem resoluções ainda. Sê o primeiro a partilhar!</div>}
            {commSols.map(s=>(
              <div key={s.id} className="sol-card" style={{background:"#fff",border:"1.5px solid #C8EAE9",borderRadius:14,padding:"20px 24px",transition:"border-color .15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:s.userColor,display:"grid",placeItems:"center",color:"#fff",fontSize:".8rem",fontWeight:800,flexShrink:0}}>{initials(s.userName)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <span style={{fontWeight:700,fontSize:".92rem"}}>{s.userName}</span>
                    <span style={{fontSize:".75rem",color:"#5A7A8A",marginLeft:8}}>{s.date}</span>
                  </div>
                  <span style={{background:"#F0F9F8",color:"#0EA5A0",fontSize:".72rem",fontWeight:700,padding:"3px 10px",borderRadius:20,border:"1px solid #B2DFDB"}}>{s.discipline}</span>
                  <span style={{background:"#DCFCE7",color:"#166534",fontSize:".72rem",fontWeight:700,padding:"3px 10px",borderRadius:20}}>IA {s.aiScore}%</span>
                </div>
                <div style={{background:"#F0F9F8",borderRadius:10,padding:"12px 14px",marginBottom:10,fontSize:".86rem",color:"#0F2A3F",fontWeight:600,borderLeft:"3px solid #0EA5A0"}}>❓ {s.question}</div>
                <pre style={{fontSize:".84rem",lineHeight:1.78,whiteSpace:"pre-wrap",fontFamily:"inherit",color:"#0F2A3F",marginBottom:12}}>{s.answer}</pre>
                {s.feedback && <p style={{fontSize:".8rem",color:"#5A7A8A",background:"#F0F9F8",padding:"8px 12px",borderRadius:8,marginBottom:10}}>💬 {s.feedback}</p>}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button style={{background:"#F0F9F8",border:"1px solid #C8EAE9",color:"#0F2A3F",padding:"6px 14px",borderRadius:30,fontSize:".8rem",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}} onClick={()=>voteUp(s.id)}>👍 {s.votes}</button>
                  {s.coins>0 && <span style={{color:"#F59E0B",fontWeight:700,fontSize:".82rem"}}>🪙 {s.coins} moedas</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RANKING ────────────────────────────────────────── */}
      {page==="ranking" && (
        <div style={{padding:"50px 5%",maxWidth:700,margin:"0 auto",animation:"fadeIn .4s ease"}}>
          <div style={{marginBottom:28}}>
            <span style={{fontSize:".72rem",fontWeight:700,color:"#F59E0B",letterSpacing:1.5,textTransform:"uppercase"}}>🏆 RANKING</span>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",marginTop:6}}>Top Alunos do Mês</h2>
          </div>
          {/* Top 3 destaque */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
            {sortedUsers.slice(0,3).map((u,i)=>{
              const medals=["🥇","🥈","🥉"]; const bgs=["linear-gradient(135deg,#FEF3C7,#FDE68A)","linear-gradient(135deg,#F1F5F9,#E2E8F0)","linear-gradient(135deg,#FEF3C7,#FED7AA)"];
              return (
                <div key={u.id} style={{background:bgs[i],borderRadius:16,padding:"20px 14px",textAlign:"center",border:`1.5px solid ${i===0?"#F59E0B":"#C8EAE9"}`}}>
                  <div style={{fontSize:"1.8rem",marginBottom:6}}>{medals[i]}</div>
                  <div style={{width:44,height:44,borderRadius:"50%",background:u.color,display:"grid",placeItems:"center",color:"#fff",fontWeight:800,fontSize:"1rem",margin:"0 auto 8px"}}>{initials(u.name)}</div>
                  <div style={{fontWeight:700,fontSize:".88rem",lineHeight:1.3}}>{u.name}</div>
                  <div style={{color:"#F59E0B",fontWeight:800,fontSize:"1.1rem",marginTop:6}}>🪙 {u.coins}</div>
                </div>
              );
            })}
          </div>
          {/* Lista completa */}
          <div style={{background:"#fff",border:"1.5px solid #C8EAE9",borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"40px 1fr auto auto",gap:16,padding:"12px 20px",background:"#F0F9F8",fontSize:".75rem",fontWeight:700,color:"#5A7A8A",letterSpacing:.5,textTransform:"uppercase",borderBottom:"1px solid #C8EAE9"}}>
              <span>#</span><span>Aluno</span><span>Resol.</span><span>Moedas</span>
            </div>
            {sortedUsers.map((u,i)=>(
              <div key={u.id} style={{display:"grid",gridTemplateColumns:"40px 1fr auto auto",gap:16,padding:"14px 20px",alignItems:"center",borderBottom:i<sortedUsers.length-1?"1px solid #F0F9F8":"none",background:currentUser?.id===u.id?"rgba(14,165,160,.04)":"transparent"}}>
                <span style={{fontWeight:800,color:i<3?"#F59E0B":"#5A7A8A",fontSize:".9rem"}}>{i+1}</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:u.color,display:"grid",placeItems:"center",color:"#fff",fontSize:".78rem",fontWeight:800,flexShrink:0}}>{initials(u.name)}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:".88rem"}}>{u.name}{currentUser?.id===u.id&&<span style={{fontSize:".72rem",background:"#0EA5A0",color:"#fff",padding:"1px 7px",borderRadius:20,marginLeft:6}}>Tu</span>}</div>
                    <div style={{fontSize:".75rem",color:"#5A7A8A"}}>{u.school||"Escola não informada"}</div>
                  </div>
                </div>
                <span style={{fontWeight:600,fontSize:".88rem",color:"#0EA5A0"}}>{solutions.filter(s=>s.userId===u.id&&s.status==="approved").length}</span>
                <span style={{fontWeight:700,color:"#F59E0B",fontSize:".9rem"}}>🪙 {u.coins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODERATION ─────────────────────────────────────── */}
      {page==="moderation" && (
        <div style={{padding:"50px 5%",maxWidth:860,margin:"0 auto",animation:"fadeIn .4s ease"}}>
          <div style={{marginBottom:24}}>
            <span style={{fontSize:".72rem",fontWeight:700,color:"#5A7A8A",letterSpacing:1.5,textTransform:"uppercase"}}>🛡️ PAINEL ADMIN</span>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.6rem,3vw,2.2rem)",marginTop:6}}>Moderação de Conteúdo</h2>
          </div>
          {!adminUnlocked ? (
            <div style={{background:"#fff",border:"1.5px solid #C8EAE9",borderRadius:16,padding:32,maxWidth:420}}>
              <p style={{color:"#5A7A8A",marginBottom:16,fontSize:".9rem"}}>Área restrita. Insere a senha de administrador.</p>
              <input style={{width:"100%",border:"1.5px solid #C8EAE9",borderRadius:10,padding:"11px 14px",marginBottom:12,outline:"none",fontSize:".9rem",fontFamily:"inherit"}} type="password" placeholder="Senha admin..." value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&unlockAdmin()} />
              <button className="btn-hover" style={{background:"#0EA5A0",color:"#fff",border:"none",padding:"10px 24px",borderRadius:30,fontWeight:700,cursor:"pointer",fontSize:".9rem"}} onClick={unlockAdmin}>🔓 Entrar</button>
              <p style={{fontSize:".75rem",color:"#B2DFDB",marginTop:10}}>Dica: admin2025</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:24}}>
                {[[solutions.filter(s=>s.status==="pending").length,"⏳ Pendentes","#FEF3C7","#92400E"],[solutions.filter(s=>s.status==="approved").length,"✅ Aprovadas","#DCFCE7","#166534"],[solutions.filter(s=>s.status==="rejected").length,"❌ Rejeitadas","#FEE2E2","#991B1B"],[users.length,"👥 Alunos","#EEF2FF","#3730A3"]].map(([n,l,bg,col])=>(
                  <div key={l} style={{background:bg,borderRadius:12,padding:"16px 12px",textAlign:"center"}}>
                    <div style={{fontSize:"1.7rem",fontWeight:800,color:col}}>{n}</div>
                    <div style={{fontSize:".72rem",color:col,marginTop:3,fontWeight:600}}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Filtros */}
              <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
                {[["all","Todas"],["pending","Pendentes"],["approved","Aprovadas"],["rejected","Rejeitadas"]].map(([v,l])=>(
                  <button key={v} style={{background:modFilter===v?"#0F2A3F":"#fff",color:modFilter===v?"#fff":"#5A7A8A",border:`1px solid ${modFilter===v?"#0F2A3F":"#C8EAE9"}`,padding:"6px 16px",borderRadius:30,fontSize:".82rem",fontWeight:600,cursor:"pointer",transition:"all .15s"}} onClick={()=>setModFilter(v)}>{l}</button>
                ))}
              </div>
              {/* Lista */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {filteredSols.map(s=>(
                  <div key={s.id} style={{background:"#fff",border:`1.5px solid ${s.status==="pending"?"#FDE68A":s.status==="approved"?"#B2DFDB":"#FECACA"}`,borderRadius:14,padding:"18px 22px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:s.userColor,display:"grid",placeItems:"center",color:"#fff",fontSize:".75rem",fontWeight:800}}>{initials(s.userName)}</div>
                      <span style={{fontWeight:700,fontSize:".88rem"}}>{s.userName}</span>
                      <span style={{fontSize:".75rem",color:"#5A7A8A"}}>{s.date}</span>
                      <span style={{marginLeft:"auto",background:s.status==="approved"?"#DCFCE7":s.status==="pending"?"#FEF3C7":"#FEE2E2",color:s.status==="approved"?"#166534":s.status==="pending"?"#92400E":"#991B1B",fontSize:".72rem",fontWeight:700,padding:"3px 10px",borderRadius:20}}>{s.status==="approved"?"✅ Aprovada":s.status==="pending"?"⏳ Pendente":"❌ Rejeitada"}</span>
                      <span style={{background:"#EEF2FF",color:"#3730A3",fontSize:".72rem",fontWeight:700,padding:"3px 10px",borderRadius:20}}>IA: {s.aiScore}%</span>
                    </div>
                    <div style={{fontSize:".84rem",fontWeight:600,marginBottom:6,color:"#0F2A3F"}}>❓ {s.question}</div>
                    <pre style={{fontSize:".82rem",lineHeight:1.72,whiteSpace:"pre-wrap",fontFamily:"inherit",color:"#5A7A8A",marginBottom:s.feedback?8:12}}>{s.answer}</pre>
                    {s.feedback && <p style={{fontSize:".78rem",background:"#F0F9F8",padding:"6px 10px",borderRadius:8,color:"#5A7A8A",marginBottom:10}}>💬 {s.feedback}</p>}
                    {s.status==="pending" && (
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <button style={{background:"#EEF2FF",color:"#3730A3",border:"none",padding:"7px 16px",borderRadius:30,fontSize:".8rem",fontWeight:700,cursor:"pointer",opacity:verifying[s.id]?.6:1}} disabled={verifying[s.id]} onClick={()=>reVerify(s.id)}>{verifying[s.id]?"🤖 A verificar...":"🤖 Re-verificar IA"}</button>
                        <button style={{background:"#DCFCE7",color:"#166534",border:"none",padding:"7px 16px",borderRadius:30,fontSize:".8rem",fontWeight:700,cursor:"pointer"}} onClick={()=>moderateAction(s.id,"approved")}>✅ Aprovar</button>
                        <button style={{background:"#FEE2E2",color:"#991B1B",border:"none",padding:"7px 16px",borderRadius:30,fontSize:".8rem",fontWeight:700,cursor:"pointer"}} onClick={()=>moderateAction(s.id,"rejected")}>❌ Rejeitar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MODAL AUTH ─────────────────────────────────────── */}
      {authModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,42,63,.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&setAuthModal(false)}>
          <div style={{background:"#fff",borderRadius:24,padding:"36px 32px",maxWidth:460,width:"100%",position:"relative",animation:"slideUp .3s ease",boxShadow:"0 24px 80px rgba(15,42,63,.25)"}}>
            <button style={{position:"absolute",top:16,right:18,background:"none",border:"none",fontSize:"1.4rem",cursor:"pointer",color:"#B2DFDB",lineHeight:1}} onClick={()=>setAuthModal(false)}>×</button>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontSize:"2.5rem",marginBottom:8}}>🎓</div>
              <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.5rem",marginBottom:4}}>PassaFácil Angola</h2>
              <p style={{color:"#5A7A8A",fontSize:".84rem",lineHeight:1.6}}>Cadastra-te para resolver com IA, partilhar e ganhar moedas!</p>
            </div>
            <div style={{display:"flex",background:"#F0F9F8",borderRadius:12,padding:4,gap:4,marginBottom:22}}>
              {[["login","Entrar"],["register","Cadastrar"]].map(([t,l])=>(
                <button key={t} style={{flex:1,padding:"9px",textAlign:"center",fontSize:".88rem",fontWeight:700,border:"none",background:authTab===t?"#0EA5A0":"transparent",color:authTab===t?"#fff":"#5A7A8A",cursor:"pointer",borderRadius:9,transition:"all .15s",fontFamily:"inherit"}} onClick={()=>setAuthTab(t)}>{l}</button>
              ))}
            </div>
            {authTab==="login" && (
              <div style={{display:"flex",flexDirection:"column",gap:11}}>
                <input style={{border:"1.5px solid #C8EAE9",borderRadius:10,padding:"11px 14px",outline:"none",fontSize:".9rem",fontFamily:"inherit",color:"#0F2A3F"}} placeholder="Username ou Email" value={loginUser} onChange={e=>setLoginUser(e.target.value)} />
                <input style={{border:"1.5px solid #C8EAE9",borderRadius:10,padding:"11px 14px",outline:"none",fontSize:".9rem",fontFamily:"inherit",color:"#0F2A3F"}} type="password" placeholder="Senha" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} />
                {loginErr && <p style={{color:"#EF4444",fontSize:".82rem"}}>{loginErr}</p>}
                <button className="btn-hover" style={{background:"#0EA5A0",color:"#fff",border:"none",padding:"12px",borderRadius:30,fontWeight:700,cursor:"pointer",fontSize:".9rem",boxShadow:"0 4px 16px rgba(14,165,160,.3)"}} onClick={doLogin}>Entrar →</button>
                <p style={{textAlign:"center",fontSize:".76rem",color:"#B2DFDB"}}>Demo: maria@ex.ao / 123456</p>
              </div>
            )}
            {authTab==="register" && (
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {[["text","Nome completo *",regName,setRegName],["text","Username (sem espaços) *",regUser,setRegUser],["email","Email *",regEmail,setRegEmail],["tel","Telefone / WhatsApp",regPhone,setRegPhone],["text","Escola e Classe",regSchool,setRegSchool]].map(([type,ph,val,set])=>(
                  <input key={ph} style={{border:"1.5px solid #C8EAE9",borderRadius:10,padding:"10px 14px",outline:"none",fontSize:".86rem",fontFamily:"inherit",color:"#0F2A3F"}} type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)} />
                ))}
                <input style={{border:"1.5px solid #C8EAE9",borderRadius:10,padding:"10px 14px",outline:"none",fontSize:".86rem",fontFamily:"inherit",color:"#0F2A3F"}} type="password" placeholder="Senha (mín. 6 caracteres) *" value={regPass} onChange={e=>setRegPass(e.target.value)} />
                {regErr && <p style={{color:"#EF4444",fontSize:".82rem"}}>{regErr}</p>}
                {regOk && <p style={{background:"#DCFCE7",color:"#166534",padding:"9px 12px",borderRadius:9,fontSize:".82rem"}}>{regOk}</p>}
                <button className="btn-hover" style={{background:"#22C55E",color:"#fff",border:"none",padding:"12px",borderRadius:30,fontWeight:700,cursor:"pointer",fontSize:".9rem",boxShadow:"0 4px 16px rgba(34,197,94,.3)"}} onClick={doRegister}>Criar Conta Grátis →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DASHBOARD MODAL ─────────────────────────────────── */}
      {dashModal && currentUser && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,42,63,.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}} onClick={e=>e.target===e.currentTarget&&setDashModal(false)}>
          <div style={{background:"#fff",borderRadius:24,padding:"32px 28px",maxWidth:520,width:"100%",maxHeight:"88vh",overflowY:"auto",position:"relative",animation:"slideUp .3s ease",boxShadow:"0 24px 80px rgba(15,42,63,.25)"}}>
            <button style={{position:"absolute",top:16,right:18,background:"none",border:"none",fontSize:"1.4rem",cursor:"pointer",color:"#B2DFDB"}} onClick={()=>setDashModal(false)}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
              <div style={{width:54,height:54,borderRadius:"50%",background:currentUser.color,display:"grid",placeItems:"center",fontWeight:800,fontSize:"1.2rem",color:"#fff",flexShrink:0,boxShadow:`0 4px 16px ${currentUser.color}55`}}>{initials(currentUser.name)}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:"1.1rem"}}>{currentUser.name}</div>
                <div style={{fontSize:".8rem",color:"#5A7A8A",marginTop:2}}>{currentUser.school||"Escola não informada"}</div>
                <div style={{color:"#F59E0B",fontWeight:700,fontSize:".88rem",marginTop:4}}>🪙 {currentUser.coins} moedas</div>
              </div>
              <button style={{background:"#FEE2E2",color:"#EF4444",border:"none",padding:"6px 16px",borderRadius:30,fontSize:".8rem",fontWeight:700,cursor:"pointer"}} onClick={doLogout}>Sair</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:22}}>
              {[[currentUser.coins,"🪙","Moedas"],[solutions.filter(s=>s.userId===currentUser.id).length,"📤","Enviadas"],[solutions.filter(s=>s.userId===currentUser.id&&s.status==="approved").length,"✅","Aprovadas"],[currentUser.aiUses||0,"🤖","IA Uses"]].map(([n,icon,l])=>(
                <div key={l} style={{background:"#F0F9F8",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
                  <div style={{fontSize:".9rem",marginBottom:3}}>{icon}</div>
                  <div style={{fontSize:"1.5rem",fontWeight:800,color:"#0EA5A0"}}>{n}</div>
                  <div style={{fontSize:".68rem",color:"#5A7A8A",marginTop:3,fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#F0F9F8",borderRadius:14,padding:18}}>
              <h3 style={{fontWeight:700,marginBottom:14,fontSize:".9rem"}}>📜 Histórico de Actividades</h3>
              {(currentUser.history||[]).length===0 ? <p style={{color:"#5A7A8A",fontSize:".84rem",textAlign:"center",padding:"12px 0"}}>Sem actividades ainda. Começa a resolver!</p> :
              [...(currentUser.history||[])].reverse().slice(0,6).map((h,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<5?"1px solid #C8EAE9":"none"}}>
                  <span style={{fontSize:"1.1rem"}}>{h.icon}</span>
                  <span style={{flex:1,fontSize:".83rem",lineHeight:1.4,color:"#0F2A3F"}}>{h.text}</span>
                  {h.coins>0 && <span style={{color:"#F59E0B",fontWeight:700,fontSize:".8rem"}}>+{h.coins}🪙</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ──────────────────────────────────────────── */}
      {toast && (
        <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#0F2A3F",color:"#fff",padding:"12px 24px",borderRadius:30,fontSize:".86rem",fontWeight:600,zIndex:5000,whiteSpace:"nowrap",boxShadow:"0 8px 28px rgba(15,42,63,.35)",animation:"toastIn .3s ease",pointerEvents:"none"}}>
          {toast}
        </div>
      )}

      {/* ── BOTTOM NAV (mobile) ────────────────────────────── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,.97)",borderTop:"1px solid #C8EAE9",display:"flex",justifyContent:"space-around",padding:"8px 0 10px",zIndex:90,backdropFilter:"blur(12px)"}}>
        {[...navPages,{id:"moderation",icon:"🛡️",label:"Admin"}].map(p=>(
          <button key={p.id} style={{background:"none",border:"none",color:page===p.id?"#0EA5A0":"#5A7A8A",fontSize:".65rem",fontWeight:page===p.id?700:500,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"0 8px",fontFamily:"inherit",transition:"color .15s"}} onClick={()=>setPage(p.id)}>
            <span style={{fontSize:"1.3rem"}}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{height:68}} />
    </div>
  );
}
