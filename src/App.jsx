import { useState, useEffect } from "react";

const C = {
  lilac:"#D4B8E0", violet:"#50287A", dark:"#1E0A3C",
  white:"#FDFAFF", soft:"#F5F0FA", text:"#2D1B4E",
};

// ── API helpers ──────────────────────────────────────────────────────────────
async function apiLogin(password) {
  const r = await fetch('/api/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ password }),
  });
  return r.json();
}
async function apiGetPlan() {
  const r = await fetch('/api/coach?action=plan');
  return r.json();
}
async function apiGetMembers(coachPwd) {
  const r = await fetch('/api/coach?action=members', { headers:{'x-coach-token': coachPwd} });
  return r.json();
}
async function apiSavePlan(plan, coachPwd) {
  await fetch('/api/coach?action=plan', {
    method:'POST', headers:{'Content-Type':'application/json','x-coach-token': coachPwd},
    body: JSON.stringify(plan),
  });
}
async function apiSaveMembers(members, coachPwd) {
  await fetch('/api/coach?action=members', {
    method:'POST', headers:{'Content-Type':'application/json','x-coach-token': coachPwd},
    body: JSON.stringify(members),
  });
}
async function apiSaveCoachPwd(newPwd, oldPwd) {
  await fetch('/api/coach?action=coach-pwd', {
    method:'POST', headers:{'Content-Type':'application/json','x-coach-token': oldPwd},
    body: JSON.stringify({ password: newPwd }),
  });
}
async function apiCheckout() {
  const r = await fetch('/api/checkout', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({}),
  });
  const data = await r.json();
  if (data.url) window.location.href = data.url;
}

function getYoutubeEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function randomPwd() {
  const c = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({length:8}, () => c[Math.floor(Math.random()*c.length)]).join("");
}

// ── Shared UI ────────────────────────────────────────────────────────────────
function Orbs() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[[400,"-100px",null,null,"-100px",.25,"float1 8s"],[300,null,"10%","-80px",null,.12,"float2 10s"],[200,"40%",null,null,"20%",.18,"float3 12s"]].map(([w,t,b,l,r,op,anim],i)=>(
        <div key={i} style={{position:"absolute",width:w,height:w,borderRadius:"50%",
          background:`radial-gradient(circle,rgba(212,184,224,${op}) 0%,transparent 70%)`,
          top:t,bottom:b,left:l,right:r,animation:anim+" ease-in-out infinite"}} />
      ))}
    </div>
  );
}
function HFLogo({size=44}) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
      background:`linear-gradient(135deg,${C.lilac},${C.violet})`,
      display:"flex",alignItems:"center",justifyContent:"center",
      boxShadow:"0 4px 16px rgba(80,40,122,.25)"}}>
      <span style={{color:"white",fontFamily:"'Playfair Display',serif",fontSize:size*.38,fontWeight:700}}>HF</span>
    </div>
  );
}
function Pill({children,active,onClick}) {
  return <button onClick={onClick} style={{padding:"10px 20px",borderRadius:50,border:"none",cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,transition:"all .2s",
    background:active?`linear-gradient(135deg,${C.violet},${C.dark})`:C.soft,
    color:active?"white":C.text,boxShadow:active?"0 4px 16px rgba(80,40,122,.3)":"none"}}>{children}</button>;
}
function FieldInput({label,value,onChange,placeholder,type="text"}) {
  return (
    <div style={{marginBottom:12}}>
      {label&&<label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#999",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid rgba(212,184,224,.6)",
          fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,background:C.soft,outline:"none",boxSizing:"border-box"}} />
    </div>
  );
}
function SaveBtn({onClick,label="Salva modifiche",loading}) {
  return <button onClick={onClick} disabled={loading} style={{width:"100%",padding:14,borderRadius:12,border:"none",marginTop:8,
    background:`linear-gradient(135deg,${C.violet},${C.dark})`,color:"white",
    fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",
    boxShadow:"0 4px 20px rgba(80,40,122,.35)",opacity:loading?.7:1}}>{loading?"Salvataggio...":label}</button>;
}
function Modal({title,onClose,children}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,60,.5)",zIndex:200,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:600,
        maxHeight:"88vh",overflow:"auto",padding:"28px 24px 48px",animation:"slideUp .3s ease"}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",color:C.dark,fontSize:20,margin:0}}>{title}</h2>
          <button onClick={onClose} style={{background:C.soft,border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:18,color:C.text}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({onGoToLogin, onSubscribe, loading}) {
  return (
    <div style={{minHeight:"100vh",background:C.white,position:"relative",overflow:"hidden"}}>
      <Orbs/>
      <div style={{position:"relative",zIndex:1,maxWidth:560,margin:"0 auto",padding:"48px 24px"}}>
        {/* Hero */}
        <div style={{textAlign:"center",marginBottom:48,animation:"fadeUp .8s ease both"}}>
          <HFLogo size={80}/>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,color:C.dark,margin:"20px 0 8px",lineHeight:1.2}}>
            Move<span style={{color:C.violet}}>With</span>Helen
          </h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:17,color:"#666",margin:"0 0 32px",lineHeight:1.6}}>
            Allenamento, mobilità e risultati — pensati per le donne che scelgono il fitness come stile di vita 💜
          </p>
          <button onClick={onSubscribe} disabled={loading} style={{
            padding:"16px 40px",borderRadius:50,border:"none",
            background:`linear-gradient(135deg,${C.violet},${C.dark})`,
            color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:17,fontWeight:700,
            cursor:loading?"not-allowed":"pointer",boxShadow:"0 8px 32px rgba(80,40,122,.4)",
            transition:"transform .2s",display:"block",width:"100%",marginBottom:12
          }}
            onMouseEnter={e=>!loading&&(e.target.style.transform="translateY(-2px)")}
            onMouseLeave={e=>e.target.style.transform="translateY(0)"}>
            {loading ? "Caricamento..." : "Abbonati ora →"}
          </button>
          <button onClick={onGoToLogin} style={{background:"none",border:"none",color:C.violet,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",textDecoration:"underline"}}>
            Hai già un accesso? Accedi qui
          </button>
        </div>

        {/* Features */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:40,animation:"fadeUp 1s ease both"}}>
          {[
            {emoji:"💪",title:"Schede mensili",desc:"Programma completo aggiornato ogni mese"},
            {emoji:"🎬",title:"Video demo",desc:"Video esplicativi per ogni esercizio"},
            {emoji:"📚",title:"Guide esclusive",desc:"PDF su nutrizione, ciclo e lifestyle"},
            {emoji:"🌀",title:"Mobilità",desc:"Sessioni dedicate per muoverti meglio"},
          ].map((f,i)=>(
            <div key={i} style={{background:"white",borderRadius:18,padding:"20px 16px",border:"1px solid rgba(212,184,224,.4)",boxShadow:"0 2px 16px rgba(30,10,60,.05)"}}>
              <div style={{fontSize:28,marginBottom:8}}>{f.emoji}</div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:C.dark,margin:"0 0 4px",fontSize:14}}>{f.title}</p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#999",margin:0,lineHeight:1.5}}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{background:`linear-gradient(135deg,${C.violet},${C.dark})`,borderRadius:20,padding:"28px 24px",color:"white",textAlign:"center",animation:"fadeUp 1.1s ease both"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,opacity:.7,margin:"0 0 6px",letterSpacing:2,textTransform:"uppercase"}}>Abbonamento mensile</p>
          <p style={{fontFamily:"'Playfair Display',serif",fontSize:42,margin:"0 0 4px",fontWeight:700}}>€19<span style={{fontSize:20,opacity:.7}}>/mese</span></p>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,opacity:.8,margin:"0 0 20px"}}>Cancella quando vuoi · Pagamento sicuro con Stripe</p>
          <button onClick={onSubscribe} disabled={loading} style={{
            padding:"14px 36px",borderRadius:50,border:"2px solid white",
            background:"transparent",color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer"
          }}>{loading ? "Caricamento..." : "Inizia ora →"}</button>
        </div>

        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#bbb",textAlign:"center",marginTop:24}}>
          Hai già accesso? <button onClick={onGoToLogin} style={{background:"none",border:"none",color:C.violet,cursor:"pointer",fontSize:12,fontWeight:600,padding:0}}>Accedi al portale</button>
        </p>
      </div>
    </div>
  );
}

// ── Success Page ──────────────────────────────────────────────────────────────
function SuccessPage({onGoToLogin}) {
  return (
    <div style={{minHeight:"100vh",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <Orbs/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",maxWidth:480,padding:"0 24px",animation:"fadeUp .8s ease both"}}>
        <div style={{fontSize:64,marginBottom:16}}>💜</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,color:C.dark,margin:"0 0 12px"}}>Benvenuta!</h1>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:"#666",margin:"0 0 32px",lineHeight:1.7}}>
          Il pagamento è andato a buon fine! Ti abbiamo inviato una email con la tua password personale per accedere al portale.
        </p>
        <div style={{background:C.soft,borderRadius:16,padding:"16px 20px",marginBottom:28,border:"1px solid rgba(212,184,224,.4)"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,margin:0}}>📧 Controlla la tua email — arriverà entro pochi secondi!</p>
        </div>
        <button onClick={onGoToLogin} style={{padding:"14px 36px",borderRadius:50,border:"none",
          background:`linear-gradient(135deg,${C.violet},${C.dark})`,color:"white",
          fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",
          boxShadow:"0 6px 24px rgba(80,40,122,.35)"}}>Vai al login →</button>
      </div>
    </div>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({onLogin, onBack}) {
  const [pwd,setPwd]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [shake,setShake]=useState(false);

  const handle=async()=>{
    if(!pwd.trim())return;
    setLoading(true);setError("");
    const data=await apiLogin(pwd);
    setLoading(false);
    if(data.role){onLogin(data.role,data.member||null,pwd);}
    else{setError("Password non corretta.");setShake(true);setTimeout(()=>setShake(false),500);}
  };

  return (
    <div style={{minHeight:"100vh",background:C.white,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <Orbs/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",animation:shake?"shake .4s ease":"fadeUp .8s ease both"}}>
        <HFLogo size={72}/>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:C.dark,margin:"16px 0 4px"}}>MoveWithHelen</h1>
        <p style={{fontFamily:"'DM Sans',sans-serif",color:C.violet,fontSize:12,marginBottom:36,letterSpacing:2,textTransform:"uppercase"}}>Training Portal</p>
        <div style={{background:"white",borderRadius:20,padding:"32px 36px",boxShadow:"0 4px 40px rgba(30,10,60,.08)",border:"1px solid rgba(212,184,224,.4)",maxWidth:320,width:"90vw"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",color:C.text,marginBottom:18,fontSize:15}}>Inserisci la tua password 💜</p>
          <input type="password" value={pwd}
            onChange={e=>{setPwd(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&handle()}
            placeholder="••••••••••"
            style={{width:"100%",padding:"13px 16px",borderRadius:12,fontSize:16,
              border:`2px solid ${error?"#e57373":"rgba(212,184,224,.6)"}`,
              fontFamily:"'DM Sans',sans-serif",color:C.dark,background:C.soft,
              outline:"none",boxSizing:"border-box",marginBottom:8}}/>
          {error&&<p style={{color:"#c0392b",fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:8}}>{error}</p>}
          <button onClick={handle} disabled={loading} style={{width:"100%",padding:13,borderRadius:12,border:"none",
            background:`linear-gradient(135deg,${C.violet},${C.dark})`,color:"white",
            fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,cursor:loading?"not-allowed":"pointer",marginTop:4,
            boxShadow:"0 4px 20px rgba(80,40,122,.35)",opacity:loading?.7:1}}>
            {loading?"Verifica...":"Entra →"}
          </button>
        </div>
        <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:C.violet,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",textDecoration:"underline"}}>← Torna alla home</button>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#bbb",margin:0}}>Non hai accesso? <strong>@helenfalda.coach</strong></p>
        </div>
      </div>
    </div>
  );
}

// ── Day Sheet (member) ────────────────────────────────────────────────────────
function DaySheet({day,onClose}) {
  const embedUrl=getYoutubeEmbed(day.video||"");
  return (
    <Modal title={`${day.emoji} ${day.day} — ${day.focus}`} onClose={onClose}>
      {embedUrl&&<div style={{borderRadius:14,overflow:"hidden",marginBottom:20,aspectRatio:"16/9"}}>
        <iframe src={embedUrl} title="video" width="100%" height="100%" frameBorder="0" allowFullScreen style={{display:"block"}}/>
      </div>}
      {day.exercises.map((ex,i)=>(
        <div key={i} style={{background:i%2===0?C.soft:"white",borderRadius:14,padding:"15px 18px",marginBottom:10,border:"1px solid rgba(212,184,224,.3)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
            <div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:C.dark,margin:0,fontSize:15}}>{i+1}. {ex.name}</p>
              {ex.note&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",margin:"4px 0 0",fontStyle:"italic"}}>💡 {ex.note}</p>}
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {[["Serie",ex.sets],["Reps",ex.reps],["Rest",ex.rest]].map(([label,val])=>(
                <div key={label} style={{textAlign:"center",background:"white",borderRadius:10,padding:"6px 9px",border:"1px solid rgba(212,184,224,.5)",minWidth:40}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#bbb",textTransform:"uppercase",letterSpacing:1}}>{label}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:C.violet,fontWeight:700}}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </Modal>
  );
}

// ── Member Portal ─────────────────────────────────────────────────────────────
function MemberPortal({plan,member,onLogout}) {
  const [tab,setTab]=useState("allenamento");
  const [selectedDay,setSelectedDay]=useState(null);
  return (
    <div style={{minHeight:"100vh",background:C.white,position:"relative",overflow:"hidden"}}>
      <Orbs/>
      <div style={{position:"relative",zIndex:1,padding:"24px 24px 0",background:"linear-gradient(180deg,rgba(212,184,224,.12) 0%,transparent 100%)"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <HFLogo size={42}/>
              <div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:C.dark,margin:0}}>MoveWithHelen</h1>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.violet,margin:0,letterSpacing:1,textTransform:"uppercase"}}>Training Portal</p>
              </div>
            </div>
            <button onClick={onLogout} style={{background:C.soft,border:"none",borderRadius:50,padding:"7px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.text,cursor:"pointer"}}>Esci</button>
          </div>
          <div style={{background:`linear-gradient(135deg,${C.violet},${C.dark})`,borderRadius:16,padding:"18px 22px",marginBottom:20,color:"white",boxShadow:"0 8px 32px rgba(80,40,122,.3)"}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,opacity:.7,margin:"0 0 4px",letterSpacing:2,textTransform:"uppercase"}}>Ciao {member.name}! 👋</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,margin:"0 0 4px"}}>{plan.month}</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,margin:0,opacity:.85}}>✨ {plan.tagline}</p>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:22}}>
            <Pill active={tab==="allenamento"} onClick={()=>setTab("allenamento")}>💪 Allenamento</Pill>
            <Pill active={tab==="guide"}       onClick={()=>setTab("guide")}>📚 Guide</Pill>
          </div>
        </div>
      </div>
      <div style={{position:"relative",zIndex:1,padding:"0 24px 48px",maxWidth:600,margin:"0 auto"}}>
        {tab==="allenamento"&&(
          <div style={{animation:"fadeUp .4s ease both"}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",color:"#888",fontSize:14,marginBottom:14}}>Tocca un giorno per vedere gli esercizi 👇</p>
            {plan.days.map((day,i)=>(
              <div key={i} onClick={()=>setSelectedDay(day)} style={{
                background:"white",borderRadius:18,padding:"16px 20px",marginBottom:10,cursor:"pointer",
                border:"1px solid rgba(212,184,224,.4)",boxShadow:"0 2px 16px rgba(30,10,60,.05)",
                display:"flex",alignItems:"center",justifyContent:"space-between",
                animation:`fadeUp ${.25+i*.08}s ease both`,transition:"transform .15s,box-shadow .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(30,10,60,.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 16px rgba(30,10,60,.05)";}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,rgba(212,184,224,.4),rgba(80,40,122,.12))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{day.emoji}</div>
                  <div>
                    <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:C.dark,margin:"0 0 2px",fontWeight:700}}>{day.day}</p>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.violet,margin:0,fontWeight:600}}>{day.focus}</p>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {day.video&&<span style={{fontSize:14}}>🎬</span>}
                  <span style={{background:C.soft,borderRadius:50,padding:"4px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#999"}}>{day.exercises.length} eserc.</span>
                  <span style={{color:C.violet,fontSize:18}}>›</span>
                </div>
              </div>
            ))}
            {plan.restDays.map((d,i)=>(
              <div key={d} style={{background:C.soft,borderRadius:18,padding:"14px 20px",marginBottom:10,display:"flex",alignItems:"center",gap:14,border:"1px dashed rgba(212,184,224,.5)"}}>
                <div style={{width:46,height:46,borderRadius:14,background:"rgba(212,184,224,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🌿</div>
                <div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:"#ccc",margin:"0 0 2px"}}>{d}</p>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#ccc",margin:0}}>Riposo attivo</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==="guide"&&(
          <div style={{animation:"fadeUp .4s ease both"}}>
            {plan.guides.map((g,i)=>(
              <div key={i} style={{background:"white",borderRadius:20,padding:22,marginBottom:14,border:"1px solid rgba(212,184,224,.4)",boxShadow:"0 2px 20px rgba(30,10,60,.06)"}}>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:52,height:52,borderRadius:14,background:"rgba(212,184,224,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{g.emoji}</div>
                  <div style={{flex:1}}>
                    <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:C.dark,margin:"0 0 4px"}}>{g.title}</h3>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#999",margin:"0 0 12px"}}>{g.subtitle}</p>
                    <button style={{padding:"8px 18px",borderRadius:50,border:`2px solid ${C.violet}`,background:"transparent",color:C.violet,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>Scarica PDF →</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{background:"linear-gradient(135deg,rgba(212,184,224,.2),rgba(80,40,122,.08))",borderRadius:20,padding:22,border:"1px solid rgba(212,184,224,.4)",textAlign:"center"}}>
              <p style={{fontSize:22,margin:"0 0 8px"}}>💜</p>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:C.dark,margin:"0 0 12px"}}>Hai domande?</p>
              <a href="https://instagram.com/helenfalda.coach" target="_blank" rel="noreferrer"
                style={{display:"inline-block",padding:"10px 22px",borderRadius:50,background:`linear-gradient(135deg,${C.violet},${C.dark})`,color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,textDecoration:"none"}}>@helenfalda.coach</a>
            </div>
          </div>
        )}
      </div>
      {selectedDay&&<DaySheet day={selectedDay} onClose={()=>setSelectedDay(null)}/>}
    </div>
  );
}

// ── Coach modals ──────────────────────────────────────────────────────────────
function EditProgramModal({plan,coachPwd,onSave,onClose}) {
  const [local,setLocal]=useState(JSON.parse(JSON.stringify(plan)));
  const [openDay,setOpenDay]=useState(null);
  const [saving,setSaving]=useState(false);
  const setField=(f,v)=>setLocal(p=>({...p,[f]:v}));
  const setDayField=(di,f,v)=>setLocal(p=>{const d=JSON.parse(JSON.stringify(p.days));d[di][f]=v;return{...p,days:d};});
  const setExField=(di,ei,f,v)=>setLocal(p=>{const d=JSON.parse(JSON.stringify(p.days));d[di].exercises[ei][f]=v;return{...p,days:d};});
  const addEx=di=>setLocal(p=>{const d=JSON.parse(JSON.stringify(p.days));d[di].exercises.push({name:"Nuovo esercizio",sets:"3",reps:"10",rest:"60s",note:""});return{...p,days:d};});
  const removeEx=(di,ei)=>setLocal(p=>{const d=JSON.parse(JSON.stringify(p.days));d[di].exercises.splice(ei,1);return{...p,days:d};});
  const handleSave=async()=>{setSaving(true);await apiSavePlan(local,coachPwd);onSave(local);setSaving(false);};
  return (
    <Modal title="📅 Programma Mensile" onClose={onClose}>
      <FieldInput label="Nome mese"  value={local.month}   onChange={v=>setField("month",v)}/>
      <FieldInput label="Tagline"    value={local.tagline} onChange={v=>setField("tagline",v)}/>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:1,margin:"8px 0 10px"}}>Giorni</p>
      {local.days.map((day,di)=>(
        <div key={di} style={{background:C.soft,borderRadius:14,marginBottom:10,overflow:"hidden",border:"1px solid rgba(212,184,224,.4)"}}>
          <div onClick={()=>setOpenDay(openDay===di?null:di)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",cursor:"pointer"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:C.dark,fontSize:14}}>{day.emoji} {day.day} — {day.focus}</span>
            <span style={{color:C.violet,fontSize:18,display:"inline-block",transform:openDay===di?"rotate(90deg)":"rotate(0)",transition:"transform .2s"}}>›</span>
          </div>
          {openDay===di&&(
            <div style={{padding:"0 14px 14px"}}>
              <div style={{marginBottom:12}}>
                <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#999",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>🎬 Video YouTube</label>
                <input value={day.video||""} onChange={e=>setDayField(di,"video",e.target.value)} placeholder="https://youtube.com/watch?v=..."
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1.5px solid rgba(212,184,224,.6)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,background:"white",outline:"none",boxSizing:"border-box"}}/>
                {getYoutubeEmbed(day.video||"")&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#4caf50",margin:"4px 0 0"}}>✅ Video valido</p>}
              </div>
              {day.exercises.map((ex,ei)=>(
                <div key={ei} style={{background:"white",borderRadius:10,padding:"12px 14px",marginBottom:8,border:"1px solid rgba(212,184,224,.3)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <input value={ex.name} onChange={e=>setExField(di,ei,"name",e.target.value)}
                      style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:C.dark,border:"none",background:"transparent",fontSize:14,outline:"none",width:"70%"}}/>
                    <button onClick={()=>removeEx(di,ei)} style={{background:"#fee",border:"none",borderRadius:6,color:"#e57373",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",padding:"4px 8px"}}>Rimuovi</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
                    {[["Serie","sets"],["Reps","reps"],["Rest","rest"]].map(([label,field])=>(
                      <div key={field}>
                        <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:1}}>{label}</label>
                        <input value={ex[field]} onChange={e=>setExField(di,ei,field,e.target.value)}
                          style={{width:"100%",padding:"6px 8px",borderRadius:8,border:"1.5px solid rgba(212,184,224,.5)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,background:C.soft,outline:"none",boxSizing:"border-box"}}/>
                      </div>
                    ))}
                  </div>
                  <input value={ex.note} onChange={e=>setExField(di,ei,"note",e.target.value)} placeholder="Nota tecnica"
                    style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1.5px solid rgba(212,184,224,.4)",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",background:C.soft,outline:"none",boxSizing:"border-box",fontStyle:"italic"}}/>
                </div>
              ))}
              <button onClick={()=>addEx(di)} style={{width:"100%",padding:10,borderRadius:10,border:"2px dashed rgba(212,184,224,.6)",background:"transparent",color:C.violet,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Aggiungi esercizio</button>
            </div>
          )}
        </div>
      ))}
      <SaveBtn onClick={handleSave} loading={saving} label="💾 Salva programma"/>
    </Modal>
  );
}

function MembersModal({members,coachPwd,onSave,onClose}) {
  const [local,setLocal]=useState(JSON.parse(JSON.stringify(members)));
  const [newName,setNewName]=useState("");
  const [copied,setCopied]=useState(null);
  const [saving,setSaving]=useState(false);
  const addMember=()=>{
    if(!newName.trim())return;
    setLocal(m=>[...m,{id:Date.now(),name:newName.trim(),password:randomPwd(),active:true,createdAt:new Date().toLocaleDateString("it-IT"),stripeCustomerId:null}]);
    setNewName("");
  };
  const toggleActive=id=>setLocal(m=>m.map(x=>x.id===id?{...x,active:!x.active}:x));
  const remove=id=>setLocal(m=>m.filter(x=>x.id!==id));
  const copyPwd=(pwd,id)=>{navigator.clipboard?.writeText(pwd).catch(()=>{});setCopied(id);setTimeout(()=>setCopied(null),2000);};
  const handleSave=async()=>{setSaving(true);await apiSaveMembers(local,coachPwd);onSave(local);setSaving(false);};
  return (
    <Modal title="👥 Iscritte" onClose={onClose}>
      <div style={{background:C.soft,borderRadius:14,padding:"14px",marginBottom:18,border:"1px solid rgba(212,184,224,.4)"}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#999",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>➕ Aggiungi manualmente</p>
        <div style={{display:"flex",gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMember()} placeholder="Nome dell'iscritta"
            style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1.5px solid rgba(212,184,224,.6)",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,background:"white",outline:"none"}}/>
          <button onClick={addMember} style={{padding:"10px 18px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.violet},${C.dark})`,color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Aggiungi</button>
        </div>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",margin:"8px 0 0"}}>Le iscritte via Stripe vengono aggiunte automaticamente 🎉</p>
      </div>
      {local.length===0&&<p style={{fontFamily:"'DM Sans',sans-serif",color:"#ccc",textAlign:"center",padding:"20px 0",fontSize:14}}>Nessuna iscritta ancora 🌿</p>}
      {local.map(m=>(
        <div key={m.id} style={{background:"white",borderRadius:14,padding:"14px 16px",marginBottom:10,border:"1px solid rgba(212,184,224,.4)",opacity:m.active?1:.55}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:C.dark,margin:0,fontSize:14}}>{m.name}</p>
                <span style={{background:m.active?"rgba(76,175,80,.12)":"rgba(200,200,200,.3)",color:m.active?"#4caf50":"#bbb",borderRadius:50,padding:"2px 9px",fontSize:11,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                  {m.active?"Attiva":"Sospesa"}
                </span>
                {m.stripeCustomerId&&<span style={{background:"rgba(80,40,122,.1)",color:C.violet,borderRadius:50,padding:"2px 9px",fontSize:10,fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Stripe</span>}
              </div>
              {m.email&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#aaa",margin:"0 0 6px"}}>{m.email}</p>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <code style={{fontFamily:"monospace",fontSize:13,color:C.violet,background:C.soft,padding:"4px 10px",borderRadius:8,letterSpacing:1}}>{m.password}</code>
                <button onClick={()=>copyPwd(m.password,m.id)} style={{background:"none",border:`1px solid rgba(212,184,224,.6)`,borderRadius:8,padding:"4px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:copied===m.id?"#4caf50":C.violet,cursor:"pointer"}}>
                  {copied===m.id?"✅":"Copia"}
                </button>
              </div>
              {m.createdAt&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#ccc",margin:"4px 0 0"}}>Aggiunta il {m.createdAt}</p>}
            </div>
            <div style={{display:"flex",gap:5,marginLeft:8}}>
              <button onClick={()=>toggleActive(m.id)} style={{background:m.active?"#fff3e0":"#e8f5e9",border:"none",borderRadius:8,padding:"5px 9px",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:m.active?"#ff9800":"#4caf50",cursor:"pointer",fontWeight:600}}>
                {m.active?"Sospendi":"Riattiva"}
              </button>
              <button onClick={()=>remove(m.id)} style={{background:"#fee",border:"none",borderRadius:8,padding:"5px 9px",color:"#e57373",cursor:"pointer",fontSize:12}}>✕</button>
            </div>
          </div>
        </div>
      ))}
      <SaveBtn onClick={handleSave} loading={saving} label={`💾 Salva (${local.filter(m=>m.active).length} attive)`}/>
    </Modal>
  );
}

// ── Coach Dashboard ───────────────────────────────────────────────────────────
function CoachDashboard({plan,members,coachPwd,onSavePlan,onSaveMembers,onLogout}) {
  const [modal,setModal]=useState(null);
  const [toast,setToast]=useState("");
  const saved=(msg="✅ Salvato!")=>{setToast(msg);setTimeout(()=>setToast(""),2200);};
  const items=[
    {emoji:"📅",title:"Programma Mensile", desc:`${plan.month} · ${plan.days.length} giorni`,color:"#E8D8F5",key:"program"},
    {emoji:"👥",title:"Iscritte",           desc:`${members.filter(m=>m.active).length} attive · ${members.length} totali`,color:"#D8F5E8",key:"members"},
  ];
  return (
    <div style={{minHeight:"100vh",background:C.white,position:"relative",overflow:"hidden"}}>
      <Orbs/>
      <div style={{position:"relative",zIndex:1,padding:"24px",maxWidth:600,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <HFLogo size={44}/>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:C.dark,margin:0}}>Ciao Helen! 👋</h1>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.violet,margin:0,letterSpacing:1,textTransform:"uppercase"}}>MoveWithHelen</p>
            </div>
          </div>
          <button onClick={onLogout} style={{background:C.soft,border:"none",borderRadius:50,padding:"8px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text,cursor:"pointer"}}>Esci</button>
        </div>
        {toast&&<div style={{background:"#e8f5e9",borderRadius:12,padding:"12px 16px",marginBottom:14,border:"1px solid #a5d6a7",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#2e7d32",animation:"fadeUp .3s ease"}}>{toast}</div>}
        {items.map((item,i)=>(
          <div key={i} onClick={()=>setModal(item.key)} style={{
            background:"white",borderRadius:18,padding:"18px 20px",marginBottom:12,
            border:"1px solid rgba(212,184,224,.4)",boxShadow:"0 2px 16px rgba(30,10,60,.05)",
            display:"flex",alignItems:"center",gap:16,cursor:"pointer",
            animation:`fadeUp ${.2+i*.08}s ease both`,transition:"transform .15s,box-shadow .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(30,10,60,.1)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 16px rgba(30,10,60,.05)";}}>
            <div style={{width:52,height:52,borderRadius:14,background:item.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{item.emoji}</div>
            <div style={{flex:1}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,color:C.dark,margin:"0 0 2px",fontSize:15}}>{item.title}</p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#999",margin:0}}>{item.desc}</p>
            </div>
            <span style={{color:C.violet,fontSize:20}}>›</span>
          </div>
        ))}
        <div style={{marginTop:14,background:`linear-gradient(135deg,${C.violet},${C.dark})`,borderRadius:20,padding:"18px 22px",color:"white"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,opacity:.7,margin:"0 0 8px",letterSpacing:1,textTransform:"uppercase"}}>Flusso automatico 🎉</p>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,opacity:.9,margin:0,lineHeight:1.7}}>
            1. Utente visita il sito → clicca "Abbonati"<br/>
            2. Paga con carta su Stripe<br/>
            3. Riceve email con password automatica<br/>
            4. Accede al portale con la sua password<br/>
            5. Se cancella, accesso revocato in automatico
          </p>
        </div>
      </div>
      {modal==="program"&&<EditProgramModal plan={plan} coachPwd={coachPwd} onSave={p=>{onSavePlan(p);setModal(null);saved();}} onClose={()=>setModal(null)}/>}
      {modal==="members"&&<MembersModal members={members} coachPwd={coachPwd} onSave={m=>{onSaveMembers(m);setModal(null);saved();}} onClose={()=>setModal(null)}/>}
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState(window.location.pathname==="/success"?"success":"landing");
  const [role,setRole]=useState(null);
  const [member,setMember]=useState(null);
  const [coachPwd,setCoachPwd]=useState(null);
  const [plan,setPlan]=useState(null);
  const [members,setMembers]=useState(null);
  const [checkoutLoading,setCheckoutLoading]=useState(false);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    apiGetPlan().then(p=>{setPlan(p);setLoading(false);});
  },[]);

  const handleLogin=async(r,m,pwd)=>{
    if(r==="coach"){
      setCoachPwd(pwd);
      const ms=await apiGetMembers(pwd);
      setMembers(ms);
    }
    setRole(r);setMember(m);setScreen("portal");
  };

  const handleSubscribe=async()=>{
    setCheckoutLoading(true);
    await apiCheckout();
    setCheckoutLoading(false);
  };

  if(loading)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.white}}>
      <div style={{textAlign:"center"}}><HFLogo size={60}/><p style={{fontFamily:"'DM Sans',sans-serif",color:C.violet,marginTop:14,fontSize:14}}>Caricamento...</p></div>
    </div>
  );

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}body{background:#FDFAFF;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @keyframes float1{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,20px)}}
        @keyframes float2{0%,100%{transform:translate(0,0)}50%{transform:translate(15px,-15px)}}
        @keyframes float3{0%,100%{transform:translate(0,0)}50%{transform:translate(-10px,10px)}}
      `}</style>

      {screen==="landing" && !role && <LandingPage onGoToLogin={()=>setScreen("login")} onSubscribe={handleSubscribe} loading={checkoutLoading}/>}
      {screen==="success"           && <SuccessPage onGoToLogin={()=>setScreen("login")}/>}
      {screen==="login"  && !role   && <LoginPage   onLogin={handleLogin} onBack={()=>setScreen("landing")}/>}
      {screen==="portal" && role==="member" && plan   && <MemberPortal plan={plan} member={member} onLogout={()=>{setRole(null);setScreen("landing");}}/>}
      {screen==="portal" && role==="coach"  && plan && members && <CoachDashboard plan={plan} members={members} coachPwd={coachPwd} onSavePlan={setPlan} onSaveMembers={setMembers} onLogout={()=>{setRole(null);setCoachPwd(null);setScreen("landing");}}/>}
    </>
  );
}
