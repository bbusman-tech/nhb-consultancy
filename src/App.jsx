import { useState, useEffect, useRef } from "react";
import { submitContact, submitApplication, saveHealthCheck, fetchJobs } from "./lib/supabase";

// ─── AI HELPER — calls Netlify Function (not Anthropic directly) ─────────────
const callClaude = async (system, messages, maxTokens = 1000) => {
  const res = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error('AI request failed');
  const data = await res.json();
  return data.content?.map(c => c.text).join('') || '';
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'DM Sans',sans-serif; background:#F7F4EF; overflow-x:hidden; }
    .nav-link { position:relative; transition:color 0.3s; }
    .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:1px; background:#B8922A; transition:width 0.3s; }
    .nav-link:hover::after { width:100%; }
    .card-hover { transition:all 0.3s; }
    .card-hover:hover { transform:translateY(-4px); box-shadow:0 20px 40px rgba(26,31,54,0.12); }
    .gold-btn { background:#B8922A; color:white; transition:all 0.3s; }
    .gold-btn:hover:not(:disabled) { background:#D4AF6A; transform:translateY(-1px); box-shadow:0 8px 24px rgba(184,146,42,0.3); }
    .gold-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .outline-btn { border:1px solid #B8922A; color:#B8922A; background:transparent; transition:all 0.3s; }
    .outline-btn:hover { background:#B8922A; color:white; }
    .chat-in { animation:fadeUp 0.3s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse-gold { 0%,100%{box-shadow:0 0 0 0 rgba(184,146,42,0.4)} 50%{box-shadow:0 0 0 10px rgba(184,146,42,0)} }
    .pulse { animation:pulse-gold 2s infinite; }
    .progress { transition:width 0.5s; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    .fade-in { animation:fadeIn 0.6s ease forwards; }
    input,textarea,select { font-family:'DM Sans',sans-serif; }
    select { -webkit-appearance:none; appearance:none; }
    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-track { background:#F7F4EF; }
    ::-webkit-scrollbar-thumb { background:#B8922A; border-radius:3px; }
  `}</style>
);

const C = {
  bg:'#F7F4EF', navy:'#1A1F36', gold:'#B8922A', goldL:'#D4AF6A',
  white:'#FFFFFF', muted:'#6B7280', border:'#E8E4DC', dark:'#0D1117',
};

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────
const NHB_SYSTEM = `You are NHB Consultancy's AI HR Assistant — expert, warm, and concise.
NHB is a boutique HR & hospitality recruitment firm in Dubai, UAE, founded by Nihel Hassen Busman.
Services: HR Consultancy (policies, compliance, UAE Labour Law, performance management),
Recruitment & Talent Acquisition, Outsourced HR (payroll, PRO, admin), Hospitality Staffing.
Answer questions about UAE labour law, HR best practices, hospitality recruitment in UAE,
salary benchmarks, and NHB's services. Keep answers helpful and conversational.
For complex legal matters, recommend speaking directly with NHB's team.`;

const HEALTH_SYSTEM = `You are an expert HR consultant. Analyse HR health check answers and return ONLY valid JSON
(no markdown, no backticks, no preamble):
{"score":number,"grade":"string","summary":"string","strengths":["string","string","string"],"gaps":["string","string","string"],"recommendations":["string","string","string"]}
Score is 0-100. Grade is A/B/C/D/F with +/- allowed. Summary is 2 sentences. Provide exactly 3 items in each array.`;

// ─── NAV ─────────────────────────────────────────────────────────────────────
const Nav = ({ page, setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    {id:'home',label:'Home'},{id:'hospitality',label:'Hospitality'},
    {id:'hr',label:'HR Services'},{id:'tools',label:'AI Tools'},
    {id:'about',label:'About'},{id:'careers',label:'Careers'},
  ];

  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:100,
      background:scrolled?'rgba(247,244,239,0.96)':'transparent',
      backdropFilter:scrolled?'blur(12px)':'none',
      borderBottom:scrolled?`1px solid ${C.border}`:'none',
      transition:'all 0.4s',padding:'0 2rem',
    }}>
      <div style={{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:72}}>
        <div onClick={()=>setPage('home')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,background:C.gold,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'white',fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:700}}>N</span>
          </div>
          <div>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:700,color:scrolled?C.navy:'white',lineHeight:1}}>NHB</div>
            <div style={{fontSize:10,color:C.gold,letterSpacing:'0.18em',textTransform:'uppercase'}}>Consultancy</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:28}}>
          {links.map(l=>(
            <button key={l.id} onClick={()=>setPage(l.id)} className="nav-link"
              style={{background:'none',border:'none',cursor:'pointer',fontSize:13.5,fontWeight:500,
                color:page===l.id?C.gold:(scrolled?C.navy:'rgba(255,255,255,0.85)')}}>
              {l.label}
            </button>
          ))}
          <button onClick={()=>setPage('contact')} className="gold-btn"
            style={{padding:'10px 22px',border:'none',cursor:'pointer',fontSize:13,fontWeight:500,letterSpacing:'0.05em'}}>
            Get in Touch
          </button>
        </div>
      </div>
    </nav>
  );
};

// ─── HOME ────────────────────────────────────────────────────────────────────
const Home = ({setPage}) => {
  const services = [
    {icon:'⚖️',title:'HR Consultancy',desc:'Policies, UAE compliance, workforce planning and organisational development.',page:'hr',col:C.navy},
    {icon:'🎯',title:'Recruitment & Talent',desc:'End-to-end hiring, executive search and talent mapping across all levels.',page:'contact',col:C.gold},
    {icon:'🔄',title:'Outsourced HR',desc:'Flexible HR outsourcing for SMEs — payroll, PRO services, documentation.',page:'contact',col:'#2A5C8A'},
    {icon:'🏨',title:'Hospitality Services',desc:'Specialist staffing, FOH/BOH recruitment, pre-opening support and SOPs.',page:'hospitality',col:'#6B3A6B'},
  ];
  const stats=[{v:'245%',l:'Growth Rate'},{v:'GCC',l:'Regional Coverage'},{v:'15+',l:'Years Combined Exp.'},{v:'100%',l:'Boutique Dedication'}];
  const reasons=[
    {icon:'💎',t:'Boutique & Personal',d:'Direct senior consultant access — never a junior stand-in.'},
    {icon:'🏙️',t:'Deep UAE Expertise',d:'UAE labour law, visa processes and regional culture mastered.'},
    {icon:'🤖',t:'AI-Enhanced',d:'Cutting-edge AI tools for faster matching and sharper HR insights.'},
    {icon:'🌟',t:'Hospitality Specialist',d:'Our network spans hotels, F&B, events and leisure across UAE.'},
  ];

  return (
    <div>
      {/* HERO */}
      <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${C.navy} 0%,#0D1117 55%,#1A3A5C 100%)`,display:'flex',alignItems:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,right:0,width:'55%',height:'100%',pointerEvents:'none'}}>
          {[400,300,200].map((s,i)=>(
            <div key={i} style={{position:'absolute',top:`${10+i*10}%`,right:`${5+i*8}%`,width:s,height:s,border:`1px solid rgba(184,146,42,${0.07-i*0.02})`,transform:`rotate(${45-i*15}deg)`}}/>
          ))}
        </div>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:100,background:`linear-gradient(to top,${C.bg},transparent)`}}/>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'130px 2rem 80px',position:'relative',zIndex:2}}>
          <div style={{maxWidth:680}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:28}}>
              <div style={{width:44,height:1,background:C.gold}}/>
              <span style={{color:C.gold,fontSize:12,letterSpacing:'0.22em',textTransform:'uppercase',fontWeight:500}}>Dubai's Boutique HR Specialist</span>
            </div>
            <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:'clamp(52px,7vw,84px)',fontWeight:700,color:'white',lineHeight:1.03,marginBottom:28}}>
              People&#8209;First.<br/><span style={{color:C.gold}}>Results&#8209;Driven.</span><br/>AI&#8209;Enhanced.
            </h1>
            <p style={{color:'rgba(255,255,255,0.68)',fontSize:17,lineHeight:1.75,marginBottom:44,maxWidth:540}}>
              NHB Consultancy delivers tailored HR and hospitality recruitment solutions across the UAE — combining deep regional expertise with cutting-edge AI tools.
            </p>
            <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
              <button onClick={()=>setPage('contact')} className="gold-btn"
                style={{padding:'16px 38px',border:'none',cursor:'pointer',fontSize:15,fontWeight:500,letterSpacing:'0.05em'}}>
                Start a Conversation
              </button>
              <button onClick={()=>setPage('tools')}
                style={{padding:'16px 38px',border:'1px solid rgba(255,255,255,0.28)',background:'transparent',cursor:'pointer',fontSize:15,color:'white',letterSpacing:'0.04em',transition:'all 0.3s'}}
                onMouseOver={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.color=C.gold;}}
                onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.28)';e.currentTarget.style.color='white';}}>
                Try Our AI Tools →
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',marginTop:88,borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:48}}>
            {stats.map((s,i)=>(
              <div key={i} style={{paddingRight:24,borderRight:i<3?'1px solid rgba(255,255,255,0.08)':'none',paddingLeft:i>0?24:0}}>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:42,fontWeight:700,color:C.gold,lineHeight:1}}>{s.v}</div>
                <div style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginTop:8,letterSpacing:'0.05em'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div style={{background:C.bg,padding:'100px 2rem'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:68}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,marginBottom:18}}>
              <div style={{width:44,height:1,background:C.gold}}/><span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>What We Do</span><div style={{width:44,height:1,background:C.gold}}/>
            </div>
            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:52,fontWeight:700,color:C.navy}}>Our Services</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            {services.map((s,i)=>(
              <div key={i} className="card-hover" onClick={()=>setPage(s.page)}
                style={{background:C.white,padding:44,cursor:'pointer',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,width:4,height:'100%',background:s.col}}/>
                <div style={{fontSize:40,marginBottom:22}}>{s.icon}</div>
                <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:700,color:C.navy,marginBottom:14}}>{s.title}</h3>
                <p style={{color:C.muted,lineHeight:1.7,fontSize:15}}>{s.desc}</p>
                <div style={{marginTop:24,color:s.col,fontSize:14,fontWeight:500}}>Explore →</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOSPITALITY FEATURE */}
      <div style={{background:C.navy,padding:'88px 2rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-120,top:-120,width:560,height:560,border:'1px solid rgba(184,146,42,0.15)',borderRadius:'50%'}}/>
        <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center',position:'relative',zIndex:2}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <div style={{width:44,height:1,background:C.gold}}/><span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>Specialist Expertise</span>
            </div>
            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:52,fontWeight:700,color:'white',lineHeight:1.1,marginBottom:26}}>
              Dubai's Hospitality<br/><span style={{color:C.gold}}>Talent Specialists</span>
            </h2>
            <p style={{color:'rgba(255,255,255,0.62)',lineHeight:1.8,fontSize:16,marginBottom:36}}>
              From boutique restaurants to 5-star resorts — we recruit FOH, BOH, management and everything in between.
            </p>
            <button onClick={()=>setPage('hospitality')} className="gold-btn"
              style={{padding:'14px 32px',border:'none',cursor:'pointer',fontSize:14,fontWeight:500}}>
              Explore Hospitality Services
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {['Hotels & Resorts','F&B / Restaurants','Events & Catering','Pre-Opening Support'].map((item,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(184,146,42,0.2)',padding:'26px 22px'}}>
                <div style={{width:8,height:8,background:C.gold,marginBottom:18}}/>
                <div style={{color:'white',fontSize:15,fontWeight:500}}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY NHB */}
      <div style={{background:C.bg,padding:'100px 2rem'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:88,alignItems:'center'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <div style={{width:44,height:1,background:C.gold}}/><span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>Why Choose Us</span>
            </div>
            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:52,fontWeight:700,color:C.navy,lineHeight:1.1,marginBottom:26}}>The Boutique<br/>Advantage</h2>
            <p style={{color:C.muted,lineHeight:1.8,fontSize:16,marginBottom:36}}>
              Large agencies assign you a junior consultant and a generic process. NHB gives you senior expertise, personalised strategy, and genuine partnership — from day one.
            </p>
            <button onClick={()=>setPage('about')} className="outline-btn"
              style={{padding:'14px 32px',cursor:'pointer',fontSize:14,fontWeight:500}}>
              Meet Nihel
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {reasons.map((r,i)=>(
              <div key={i} style={{padding:30,background:C.white,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:30,marginBottom:16}}>{r.icon}</div>
                <h4 style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:700,color:C.navy,marginBottom:10}}>{r.t}</h4>
                <p style={{color:C.muted,fontSize:13.5,lineHeight:1.65}}>{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI TOOLS PROMO */}
      <div style={{background:C.white,padding:'88px 2rem',borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',textAlign:'center'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,marginBottom:20}}>
            <div style={{width:44,height:1,background:C.gold}}/><span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>AI-Powered Tools</span><div style={{width:44,height:1,background:C.gold}}/>
          </div>
          <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:52,fontWeight:700,color:C.navy,marginBottom:18}}>Free Tools for Your Business</h2>
          <p style={{color:C.muted,fontSize:16,maxWidth:480,margin:'0 auto 56px'}}>Instant AI-powered insights — no sign-up required.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,maxWidth:900,margin:'0 auto'}}>
            {[
              {icon:'🏥',title:'HR Health Check',desc:'AI-powered assessment of your HR maturity in minutes.'},
              {icon:'💰',title:'Salary Benchmarker',desc:'Compare salaries for hospitality roles across the UAE.'},
              {icon:'💬',title:'AI HR Assistant',desc:'Ask anything about UAE labour law and HR best practices.'},
            ].map((tool,i)=>(
              <div key={i} className="card-hover" onClick={()=>setPage('tools')}
                style={{padding:36,border:`1px solid ${C.border}`,cursor:'pointer',background:C.bg}}>
                <div style={{fontSize:44,marginBottom:18}}>{tool.icon}</div>
                <h4 style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:700,color:C.navy,marginBottom:12}}>{tool.title}</h4>
                <p style={{color:C.muted,fontSize:14,lineHeight:1.65,marginBottom:22}}>{tool.desc}</p>
                <span style={{color:C.gold,fontSize:14,fontWeight:500}}>Try Free →</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{background:`linear-gradient(135deg,${C.gold},${C.goldL})`,padding:'88px 2rem',textAlign:'center'}}>
        <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:56,fontWeight:700,color:'white',marginBottom:20}}>Ready to Build Your Dream Team?</h2>
        <p style={{color:'rgba(255,255,255,0.82)',fontSize:18,maxWidth:460,margin:'0 auto 44px'}}>Let's talk about your people needs. No obligation, no pressure.</p>
        <button onClick={()=>setPage('contact')}
          style={{padding:'18px 52px',background:'white',border:'none',cursor:'pointer',fontSize:16,fontWeight:600,color:C.gold,transition:'all 0.3s'}}
          onMouseOver={e=>{e.currentTarget.style.background=C.navy;e.currentTarget.style.color='white';}}
          onMouseOut={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color=C.gold;}}>
          Book a Free Consultation
        </button>
      </div>
    </div>
  );
};

// ─── HOSPITALITY ─────────────────────────────────────────────────────────────
const Hospitality = ({setPage}) => {
  const roles=[
    {cat:'Front of House',items:['General Manager','Front Office Mgr','Concierge','Guest Relations','Reservations Mgr']},
    {cat:'Food & Beverage',items:['F&B Manager','Restaurant Mgr','Sommelier','Head Bartender','Service Staff']},
    {cat:'Back of House',items:['Executive Chef','Sous Chef','Pastry Chef','Kitchen Supervisor','Kitchen Staff']},
    {cat:'Management',items:['Hotel GM','Operations Director','Revenue Manager','Sales Director','HR Manager']},
  ];
  return (
    <div style={{paddingTop:72}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},#1A3A5C)`,padding:'90px 2rem',textAlign:'center'}}>
        <span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>Hospitality Recruitment</span>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:68,fontWeight:700,color:'white',marginTop:18,marginBottom:22}}>Built for Hospitality</h1>
        <p style={{color:'rgba(255,255,255,0.62)',fontSize:18,maxWidth:520,margin:'0 auto'}}>From boutique restaurants to 5-star resorts — we find the people who elevate guest experiences.</p>
      </div>
      <div style={{background:C.bg,padding:'88px 2rem'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:88}}>
            {[
              {icon:'🏨',title:'Hotel & Resort Staffing',desc:'Full team builds from FOH to BOH. Pre-opening packages available.'},
              {icon:'🍽️',title:'F&B Recruitment',desc:'Chefs, restaurant managers, sommeliers and service staff across UAE.'},
              {icon:'🎪',title:'Events & Catering',desc:'Seasonal and permanent staffing for events companies and caterers.'},
              {icon:'👔',title:'Executive Search',desc:'Discreet C-suite and senior management placement for hospitality.'},
              {icon:'🚀',title:'Pre-Opening Support',desc:'Full team recruitment, training and onboarding for new openings.'},
              {icon:'📋',title:'SOP Development',desc:'Service standards and operational procedures for excellence.'},
            ].map((s,i)=>(
              <div key={i} className="card-hover" style={{background:C.white,padding:36,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:36,marginBottom:18}}>{s.icon}</div>
                <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:700,color:C.navy,marginBottom:12}}>{s.title}</h3>
                <p style={{color:C.muted,fontSize:14,lineHeight:1.65}}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:36}}>
            <div style={{width:44,height:1,background:C.gold}}/><span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>Roles We Fill</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
            {roles.map((r,i)=>(
              <div key={i} style={{background:C.navy,padding:28}}>
                <h4 style={{fontFamily:'Cormorant Garamond,serif',fontSize:18,fontWeight:700,color:C.gold,marginBottom:18}}>{r.cat}</h4>
                {r.items.map((item,j)=>(
                  <div key={j} style={{color:'rgba(255,255,255,0.65)',fontSize:13,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{background:C.gold,padding:'64px 2rem',textAlign:'center'}}>
        <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:44,fontWeight:700,color:'white',marginBottom:26}}>Have a Vacancy to Fill?</h2>
        <button onClick={()=>setPage('contact')} style={{padding:'16px 44px',background:'white',border:'none',cursor:'pointer',fontSize:15,fontWeight:600,color:C.gold}}>Submit a Vacancy</button>
      </div>
    </div>
  );
};

// ─── HR SERVICES ─────────────────────────────────────────────────────────────
const HRServices = ({setPage}) => {
  const pillars=[
    {title:'HR Policies & Compliance',items:['UAE Labour Law compliance','Policy & procedure development','Employee handbooks','HR audits & assessments']},
    {title:'Workforce Strategy',items:['HR strategy design','Organisational structure','Workforce planning','Change management']},
    {title:'Performance Management',items:['KPI frameworks','Appraisal system design','Performance improvement','Goal setting (OKRs)']},
    {title:'Employee Relations',items:['Engagement programmes','Conflict resolution','Culture & values work','Offboarding processes']},
    {title:'Training & Development',items:['Training needs analysis','L&D programme design','Leadership coaching','Onboarding frameworks']},
    {title:'HR Analytics',items:['HR dashboards','KPI & metrics reporting','Attrition analysis','Headcount planning']},
  ];
  return (
    <div style={{paddingTop:72}}>
      <div style={{background:`linear-gradient(135deg,#1A3A5C,${C.navy})`,padding:'90px 2rem',textAlign:'center'}}>
        <span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>HR Consultancy</span>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:68,fontWeight:700,color:'white',marginTop:18,marginBottom:22,lineHeight:1.1}}>Strategic HR for<br/>Modern Business</h1>
        <p style={{color:'rgba(255,255,255,0.62)',fontSize:17,maxWidth:500,margin:'0 auto'}}>We build the HR foundations that enable sustainable, people-centred growth.</p>
      </div>
      <div style={{background:C.bg,padding:'88px 2rem'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:72}}>
            {pillars.map((p,i)=>(
              <div key={i} style={{background:C.white,padding:36,borderTop:`3px solid ${C.gold}`}}>
                <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:700,color:C.navy,marginBottom:22}}>{p.title}</h3>
                {p.items.map((item,j)=>(
                  <div key={j} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid #F0EDE8',color:'#4B5563',fontSize:14}}>
                    <div style={{width:6,height:6,background:C.gold,flexShrink:0}}/>{item}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{background:C.navy,padding:'60px 56px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center'}}>
            <div>
              <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:42,fontWeight:700,color:'white',marginBottom:22}}>Outsourced HR for SMEs</h2>
              <p style={{color:'rgba(255,255,255,0.62)',lineHeight:1.8,marginBottom:34}}>No HR department? We become your team — payroll, PRO services, employee documentation to daily HR queries.</p>
              <button onClick={()=>setPage('contact')} className="gold-btn" style={{padding:'14px 32px',border:'none',cursor:'pointer',fontSize:14,fontWeight:500}}>Enquire About HR Outsourcing</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {['Payroll Management','PRO Services','Leave Management','Employee Docs','HR Administration','On-Demand Support'].map((item,i)=>(
                <div key={i} style={{background:'rgba(184,146,42,0.12)',border:'1px solid rgba(184,146,42,0.25)',padding:'16px 14px',color:'rgba(255,255,255,0.78)',fontSize:13}}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AI TOOLS ────────────────────────────────────────────────────────────────
const AITools = () => {
  const [tab,setTab]=useState('chat');
  const [msgs,setMsgs]=useState([{r:'a',t:"Hello! I'm NHB's AI HR Assistant. Ask me anything about UAE labour law, HR best practices, hospitality recruitment, or our services."}]);
  const [inp,setInp]=useState('');
  const [chatLoad,setChatLoad]=useState(false);
  const endRef=useRef(null);

  const [hAnswers,setHAnswers]=useState({});
  const [hResult,setHResult]=useState(null);
  const [hLoad,setHLoad]=useState(false);
  const [hEmail,setHEmail]=useState('');

  const [sRole,setSRole]=useState('');
  const [sExp,setSExp]=useState('');
  const [sResult,setSResult]=useState(null);

  useEffect(()=>{if(tab==='chat')endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs,tab]);

  const hQs=[
    {q:'Do you have documented HR policies and procedures?',k:'p1'},
    {q:'Is your business compliant with UAE Labour Law?',k:'p2'},
    {q:'Do you have a formal performance management process?',k:'p3'},
    {q:'Do you conduct regular employee engagement activities?',k:'p4'},
    {q:'Do you have a structured onboarding programme for new hires?',k:'p5'},
    {q:'Do you track HR metrics and KPIs regularly?',k:'p6'},
    {q:'Do you have a formal training and development programme?',k:'p7'},
    {q:'Is your payroll process accurate and fully compliant?',k:'p8'},
    {q:'Do you have clear job descriptions for all roles?',k:'p9'},
    {q:'Do you have a structured, consistent recruitment process?',k:'p10'},
  ];

  const salaries={
    'General Manager':{j:'25,000–35,000',m:'35,000–55,000',s:'55,000–90,000+'},
    'Hotel Manager':{j:'18,000–25,000',m:'25,000–40,000',s:'40,000–65,000'},
    'F&B Manager':{j:'12,000–18,000',m:'18,000–28,000',s:'28,000–45,000'},
    'Restaurant Manager':{j:'8,000–14,000',m:'14,000–22,000',s:'22,000–35,000'},
    'Executive Chef':{j:'15,000–22,000',m:'22,000–35,000',s:'35,000–60,000'},
    'Sous Chef':{j:'7,000–12,000',m:'12,000–18,000',s:'18,000–28,000'},
    'Front Office Manager':{j:'10,000–15,000',m:'15,000–25,000',s:'25,000–40,000'},
    'HR Manager':{j:'12,000–18,000',m:'18,000–30,000',s:'30,000–50,000'},
    'Events Coordinator':{j:'6,000–10,000',m:'10,000–18,000',s:'18,000–28,000'},
    'Bartender':{j:'4,000–7,000',m:'7,000–12,000',s:'12,000–20,000'},
    'Waiter / Server':{j:'2,500–4,500',m:'4,500–8,000',s:'8,000–14,000'},
    'Revenue Manager':{j:'12,000–18,000',m:'18,000–28,000',s:'28,000–45,000'},
  };

  const sendChat=async()=>{
    if(!inp.trim()||chatLoad)return;
    const userMsg=inp.trim();
    setInp('');
    setMsgs(p=>[...p,{r:'u',t:userMsg}]);
    setChatLoad(true);
    try{
      const history=[...msgs.map(m=>({role:m.r==='u'?'user':'assistant',content:m.t})),{role:'user',content:userMsg}];
      const reply=await callClaude(NHB_SYSTEM,history);
      setMsgs(p=>[...p,{r:'a',t:reply}]);
    }catch{
      setMsgs(p=>[...p,{r:'a',t:'I\'m having trouble connecting. Please try again or email admin@nhb-consultancy.com'}]);
    }
    setChatLoad(false);
  };

  const submitHealth=async()=>{
    setHLoad(true);
    try{
      const answers=hQs.map(q=>`${q.q}: ${hAnswers[q.k]||'Not answered'}`).join('\n');
      const raw=await callClaude(HEALTH_SYSTEM,[{role:'user',content:`HR Health Check:\n${answers}`}]);
      const result=JSON.parse(raw.replace(/```json|```/g,'').trim());
      setHResult(result);
      // Save to Supabase (non-blocking)
      saveHealthCheck({email:hEmail,score:result.score,grade:result.grade,answers:hAnswers,result});
    }catch{
      setHResult({score:60,grade:'C+',summary:'Assessment complete. Please contact NHB for a detailed review.',
        strengths:['Some HR processes in place','Awareness of HR importance','Openness to improvement'],
        gaps:['Policies need formalisation','Compliance may need review','Analytics not yet established'],
        recommendations:['Engage NHB for an HR audit','Develop a core policy framework','Implement basic HR metrics tracking']});
    }
    setHLoad(false);
  };

  const tabs=[{id:'chat',icon:'💬',label:'AI Assistant'},{id:'health',icon:'🏥',label:'HR Health Check'},{id:'salary',icon:'💰',label:'Salary Calculator'}];

  return(
    <div style={{paddingTop:72}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},#1A3A5C)`,padding:'72px 2rem',textAlign:'center'}}>
        <span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>AI-Powered</span>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:60,fontWeight:700,color:'white',marginTop:14,marginBottom:18}}>Free HR Tools</h1>
        <p style={{color:'rgba(255,255,255,0.58)',fontSize:16,maxWidth:420,margin:'0 auto'}}>Instant AI-powered insights. No account needed.</p>
      </div>
      <div style={{background:C.bg,padding:'60px 2rem',minHeight:'70vh'}}>
        <div style={{maxWidth:920,margin:'0 auto'}}>
          <div style={{display:'flex',gap:6,marginBottom:40,background:C.white,padding:5,border:`1px solid ${C.border}`,width:'fit-content'}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{padding:'12px 26px',border:'none',cursor:'pointer',fontSize:13.5,fontWeight:500,
                  background:tab===t.id?C.navy:'transparent',color:tab===t.id?'white':C.muted,transition:'all 0.25s'}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* CHATBOT */}
          {tab==='chat'&&(
            <div style={{background:C.white,border:`1px solid ${C.border}`}}>
              <div style={{padding:'18px 24px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:42,height:42,background:C.navy,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',fontSize:18}}>🤖</div>
                <div>
                  <div style={{fontWeight:600,color:C.navy,fontSize:15}}>NHB AI HR Assistant</div>
                  <div style={{fontSize:12,color:C.gold}}>● Online — Ask me anything</div>
                </div>
              </div>
              <div style={{height:440,overflowY:'auto',padding:'24px',display:'flex',flexDirection:'column',gap:14}}>
                {msgs.map((m,i)=>(
                  <div key={i} className="chat-in" style={{display:'flex',justifyContent:m.r==='u'?'flex-end':'flex-start'}}>
                    <div style={{maxWidth:'76%',padding:'12px 16px',fontSize:14,lineHeight:1.65,
                      background:m.r==='u'?C.navy:C.bg,color:m.r==='u'?'white':C.navy,
                      borderRadius:m.r==='u'?'14px 14px 0 14px':'14px 14px 14px 0'}}>
                      {m.t}
                    </div>
                  </div>
                ))}
                {chatLoad&&<div style={{background:C.bg,padding:'12px 18px',borderRadius:'14px 14px 14px 0',color:C.muted,fontSize:20}}>···</div>}
                <div ref={endRef}/>
              </div>
              <div style={{padding:'14px 20px',borderTop:`1px solid ${C.border}`,display:'flex',gap:10}}>
                <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()}
                  placeholder="Ask about UAE labour law, HR practices, our services..."
                  style={{flex:1,padding:'12px 16px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,outline:'none',background:C.bg}}/>
                <button onClick={sendChat} disabled={chatLoad} className="gold-btn"
                  style={{padding:'12px 24px',border:'none',cursor:'pointer',fontSize:14,fontWeight:500}}>Send</button>
              </div>
            </div>
          )}

          {/* HR HEALTH CHECK */}
          {tab==='health'&&(
            <div style={{background:C.white,border:`1px solid ${C.border}`,padding:44}}>
              <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:38,fontWeight:700,color:C.navy,marginBottom:10}}>HR Health Check</h2>
              <p style={{color:C.muted,marginBottom:36,fontSize:15}}>Answer 10 quick questions and receive your AI-powered HR maturity score.</p>
              {!hResult?(
                <div>
                  <div style={{marginBottom:36}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                      <span style={{fontSize:13,color:C.muted}}>Progress</span>
                      <span style={{fontSize:13,color:C.gold,fontWeight:600}}>{Object.keys(hAnswers).length}/{hQs.length}</span>
                    </div>
                    <div style={{height:4,background:'#F0EDE8',borderRadius:2}}>
                      <div className="progress" style={{height:'100%',background:C.gold,borderRadius:2,width:`${(Object.keys(hAnswers).length/hQs.length)*100}%`}}/>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:18}}>
                    {hQs.map((q,i)=>(
                      <div key={i} style={{padding:'20px 24px',background:C.bg,borderLeft:`3px solid ${hAnswers[q.k]?C.gold:C.border}`}}>
                        <p style={{color:C.navy,fontSize:15,marginBottom:14,fontWeight:500}}>{i+1}. {q.q}</p>
                        <div style={{display:'flex',gap:10}}>
                          {['Yes','Partially','No'].map(opt=>(
                            <button key={opt} onClick={()=>setHAnswers(p=>({...p,[q.k]:opt}))}
                              style={{padding:'8px 20px',border:`1px solid ${hAnswers[q.k]===opt?C.gold:C.border}`,
                                background:hAnswers[q.k]===opt?C.gold:C.white,color:hAnswers[q.k]===opt?'white':C.muted,
                                cursor:'pointer',fontSize:13,fontWeight:500,transition:'all 0.2s'}}>{opt}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:28,padding:'18px 22px',background:C.bg,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:13,color:C.muted,marginBottom:12}}>💡 Optional: Add your email to receive your results and get a follow-up from our team.</p>
                    <input value={hEmail} onChange={e=>setHEmail(e.target.value)} placeholder="your@email.com (optional)"
                      style={{width:'100%',maxWidth:360,padding:'10px 14px',border:`1px solid ${C.border}`,fontSize:13,color:C.navy,outline:'none',background:C.white}}/>
                  </div>
                  <button onClick={submitHealth} disabled={Object.keys(hAnswers).length<10||hLoad} className="gold-btn"
                    style={{marginTop:24,padding:'16px 44px',border:'none',cursor:'pointer',fontSize:15,fontWeight:500}}>
                    {hLoad?'Analysing your results...':'Get My HR Score →'}
                  </button>
                </div>
              ):(
                <div className="fade-in">
                  <div style={{textAlign:'center',padding:'44px 0',borderBottom:`1px solid ${C.border}`,marginBottom:44}}>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:108,fontWeight:700,color:C.gold,lineHeight:1}}>{hResult.score}</div>
                    <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,color:C.navy,marginTop:4}}>Grade: {hResult.grade}</div>
                    <p style={{color:C.muted,fontSize:15,marginTop:18,maxWidth:520,margin:'18px auto 0',lineHeight:1.7}}>{hResult.summary}</p>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:28}}>
                    {[{label:'✅ Strengths',items:hResult.strengths},{label:'⚠️ Gaps',items:hResult.gaps},{label:'🚀 Recommendations',items:hResult.recommendations}].map((col,i)=>(
                      <div key={i}>
                        <h4 style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:700,color:C.navy,marginBottom:18}}>{col.label}</h4>
                        {col.items?.map((s,j)=>(
                          <div key={j} style={{color:'#4B5563',fontSize:14,padding:'9px 0',borderBottom:'1px solid #F0EDE8',lineHeight:1.5}}>{s}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>{setHResult(null);setHAnswers({});setHEmail('');}} className="outline-btn"
                    style={{marginTop:36,padding:'14px 32px',cursor:'pointer',fontSize:14}}>Retake Assessment</button>
                </div>
              )}
            </div>
          )}

          {/* SALARY CALCULATOR */}
          {tab==='salary'&&(
            <div style={{background:C.white,border:`1px solid ${C.border}`,padding:44}}>
              <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:38,fontWeight:700,color:C.navy,marginBottom:10}}>UAE Hospitality Salary Benchmarker</h2>
              <p style={{color:C.muted,marginBottom:40,fontSize:15}}>Estimated monthly salary ranges for hospitality roles in the UAE (AED).</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:28}}>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:10,letterSpacing:'0.08em',textTransform:'uppercase'}}>Role</label>
                  <select value={sRole} onChange={e=>{setSRole(e.target.value);setSResult(null);}}
                    style={{width:'100%',padding:'14px 16px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,background:C.bg,outline:'none',cursor:'pointer'}}>
                    <option value="">Select a role...</option>
                    {Object.keys(salaries).map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:10,letterSpacing:'0.08em',textTransform:'uppercase'}}>Experience Level</label>
                  <select value={sExp} onChange={e=>{setSExp(e.target.value);setSResult(null);}}
                    style={{width:'100%',padding:'14px 16px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,background:C.bg,outline:'none',cursor:'pointer'}}>
                    <option value="">Select experience...</option>
                    <option value="j">Junior (0–3 years)</option>
                    <option value="m">Mid-level (3–7 years)</option>
                    <option value="s">Senior (7+ years)</option>
                  </select>
                </div>
              </div>
              <button onClick={()=>sRole&&sExp&&setSResult(salaries[sRole]?.[sExp])} disabled={!sRole||!sExp} className="gold-btn"
                style={{padding:'14px 36px',border:'none',cursor:'pointer',fontSize:14,fontWeight:500}}>
                Get Salary Range
              </button>
              {sResult&&(
                <div className="fade-in" style={{marginTop:44,background:C.navy,padding:'52px 40px',textAlign:'center'}}>
                  <div style={{color:'rgba(255,255,255,0.45)',fontSize:11,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:14}}>Estimated Monthly Salary (AED)</div>
                  <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:60,fontWeight:700,color:C.gold,lineHeight:1}}>{sResult}</div>
                  <div style={{color:'rgba(255,255,255,0.45)',fontSize:13,marginTop:14}}>{sRole} · {sExp==='j'?'0–3 yrs':sExp==='m'?'3–7 yrs':'7+ yrs'} experience</div>
                  <p style={{color:'rgba(255,255,255,0.3)',fontSize:12,marginTop:22,maxWidth:400,margin:'22px auto 0',lineHeight:1.6}}>
                    *Indicative ranges based on UAE market data. Actual packages vary. Contact NHB for precise benchmarking.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ABOUT ───────────────────────────────────────────────────────────────────
const About = ({setPage}) => (
  <div style={{paddingTop:72}}>
    <div style={{background:`linear-gradient(135deg,${C.navy},#1A3A5C)`,padding:'90px 2rem'}}>
      <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:88,alignItems:'center'}}>
        <div>
          <span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>About NHB</span>
          <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:58,fontWeight:700,color:'white',marginTop:18,marginBottom:26,lineHeight:1.08}}>People Are at the Heart of Everything We Do</h1>
          <p style={{color:'rgba(255,255,255,0.62)',lineHeight:1.82,fontSize:16}}>NHB Consultancy was founded with a clear mission: to give businesses access to the expert, personalised HR support that was traditionally only available to large corporations. Every company deserves world-class people strategy.</p>
        </div>
        <div style={{background:'rgba(184,146,42,0.09)',border:'1px solid rgba(184,146,42,0.22)',padding:50}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:600,color:'white',marginBottom:8}}>Nihel Hassen Busman</div>
          <div style={{color:C.gold,fontSize:12,letterSpacing:'0.08em',marginBottom:26}}>Founder & Executive HR Consultant</div>
          <p style={{color:'rgba(255,255,255,0.62)',lineHeight:1.82,fontSize:15,marginBottom:28}}>An accomplished HR professional with extensive experience across HR operations, recruitment, employee relations and hospitality management. Nihel brings deep regional knowledge of UAE labour law, HR systems, employee engagement and organisational development — combining professionalism, empathy and precision in every engagement.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {['UAE Labour Law','HR Strategy','Hospitality Expert','Talent Acquisition','HR Analytics'].map((t,i)=>(
              <span key={i} style={{padding:'6px 14px',border:'1px solid rgba(184,146,42,0.4)',color:C.gold,fontSize:12}}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
    <div style={{background:C.bg,padding:'88px 2rem'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:52,fontWeight:700,color:C.navy,textAlign:'center',marginBottom:56}}>Our Values</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:20}}>
          {[{icon:'🤝',v:'Integrity',d:'Honest, transparent partnership.'},{icon:'⭐',v:'Excellence',d:'Uncompromising standards.'},{icon:'⚡',v:'Agility',d:'Responsive, adaptive solutions.'},{icon:'🤲',v:'Partnership',d:'Your success is our success.'},{icon:'🔒',v:'Confidentiality',d:'Absolute discretion always.'}].map((val,i)=>(
            <div key={i} style={{padding:30,background:C.white,textAlign:'center',border:`1px solid ${C.border}`}}>
              <div style={{fontSize:34,marginBottom:14}}>{val.icon}</div>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:700,color:C.navy,marginBottom:12}}>{val.v}</div>
              <div style={{color:C.muted,fontSize:13,lineHeight:1.65}}>{val.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── CAREERS (loads from Supabase) ───────────────────────────────────────────
const Careers = ({setPage}) => {
  const [filter,setFilter]=useState('All');
  const [jobs,setJobs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [applyJob,setApplyJob]=useState(null);
  const [appForm,setAppForm]=useState({name:'',email:'',message:''});
  const [appSent,setAppSent]=useState(false);
  const [appLoading,setAppLoading]=useState(false);

  const fallbackJobs=[
    {title:'Restaurant Manager',location:'Dubai Marina',sector:'F&B',type:'Permanent'},
    {title:'Front Office Manager',location:'JBR, Dubai',sector:'Hotels',type:'Permanent'},
    {title:'HR Manager',location:'DIFC, Dubai',sector:'Corporate',type:'Permanent'},
    {title:'Executive Chef',location:'Downtown Dubai',sector:'F&B',type:'Permanent'},
    {title:'Events Coordinator',location:'Business Bay',sector:'Events',type:'Permanent'},
    {title:'Hotel General Manager',location:'DIFC, Dubai',sector:'Hotels',type:'Permanent'},
  ];

  useEffect(()=>{
    fetchJobs().then(data=>{setJobs(data||[]);}).catch(()=>setJobs(fallbackJobs)).finally(()=>setLoading(false));
  },[]);

  const sectors=['All','Hotels','F&B','Corporate','Events'];
  const filtered=filter==='All'?jobs:jobs.filter(j=>j.sector===filter);

  const handleApply=async()=>{
    if(!appForm.name||!appForm.email)return;
    setAppLoading(true);
    try{
      await submitApplication({name:appForm.name,email:appForm.email,jobTitle:applyJob?.title,message:appForm.message});
      setAppSent(true);
    }catch(e){
      alert('Sorry, something went wrong. Please email admin@nhb-consultancy.com directly.');
    }
    setAppLoading(false);
  };

  return(
    <div style={{paddingTop:72}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},#1A3A5C)`,padding:'90px 2rem',textAlign:'center'}}>
        <span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>Current Opportunities</span>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:68,fontWeight:700,color:'white',marginTop:18,marginBottom:22}}>Your Next Role Awaits</h1>
        <p style={{color:'rgba(255,255,255,0.62)',fontSize:17,maxWidth:440,margin:'0 auto'}}>Exclusive opportunities across UAE hospitality, HR and corporate sectors.</p>
      </div>
      <div style={{background:C.bg,padding:'64px 2rem'}}>
        <div style={{maxWidth:920,margin:'0 auto'}}>
          <div style={{display:'flex',gap:8,marginBottom:44}}>
            {sectors.map(s=>(
              <button key={s} onClick={()=>setFilter(s)}
                style={{padding:'10px 22px',border:`1px solid ${C.border}`,cursor:'pointer',fontSize:13,fontWeight:500,
                  background:filter===s?C.navy:C.white,color:filter===s?'white':C.muted,transition:'all 0.2s'}}>{s}</button>
            ))}
          </div>
          {loading?(
            <div style={{textAlign:'center',padding:'60px 0',color:C.muted}}>Loading opportunities...</div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {filtered.map((job,i)=>(
                <div key={i} className="card-hover"
                  style={{background:C.white,padding:'26px 32px',border:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:700,color:C.navy,marginBottom:7}}>{job.title}</h3>
                    <div style={{display:'flex',gap:14,color:C.muted,fontSize:13}}>
                      <span>Confidential — {job.location}</span><span>·</span>
                      <span style={{color:C.gold}}>{job.sector}</span><span>·</span><span>{job.type}</span>
                    </div>
                  </div>
                  <button onClick={()=>{setApplyJob(job);setAppSent(false);setAppForm({name:'',email:'',message:''});}} className="gold-btn"
                    style={{padding:'10px 20px',border:'none',cursor:'pointer',fontSize:13,fontWeight:500}}>Apply</button>
                </div>
              ))}
            </div>
          )}

          {/* Apply Modal */}
          {applyJob&&(
            <div style={{position:'fixed',inset:0,background:'rgba(26,31,54,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
              <div style={{background:C.white,padding:48,maxWidth:500,width:'100%',position:'relative'}}>
                <button onClick={()=>setApplyJob(null)} style={{position:'absolute',top:16,right:20,background:'none',border:'none',fontSize:24,cursor:'pointer',color:C.muted}}>×</button>
                {!appSent?(
                  <div>
                    <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:700,color:C.navy,marginBottom:6}}>Apply: {applyJob.title}</h3>
                    <p style={{color:C.muted,fontSize:14,marginBottom:28}}>Send us your details and we'll be in touch within 24 hours.</p>
                    {[{label:'Your Name *',k:'name',ph:'Full name'},{label:'Email *',k:'email',ph:'your@email.com'}].map(f=>(
                      <div key={f.k} style={{marginBottom:14}}>
                        <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:7,letterSpacing:'0.07em',textTransform:'uppercase'}}>{f.label}</label>
                        <input value={appForm[f.k]} onChange={e=>setAppForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                          style={{width:'100%',padding:'12px 14px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,outline:'none',background:C.bg}}/>
                      </div>
                    ))}
                    <div style={{marginBottom:24}}>
                      <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:7,letterSpacing:'0.07em',textTransform:'uppercase'}}>Anything to Add?</label>
                      <textarea value={appForm.message} onChange={e=>setAppForm(p=>({...p,message:e.target.value}))} placeholder="Brief note about yourself..." rows={3}
                        style={{width:'100%',padding:'12px 14px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,outline:'none',background:C.bg,resize:'vertical',fontFamily:'DM Sans,sans-serif'}}/>
                    </div>
                    <button onClick={handleApply} disabled={!appForm.name||!appForm.email||appLoading} className="gold-btn"
                      style={{width:'100%',padding:'14px',border:'none',cursor:'pointer',fontSize:14,fontWeight:500}}>
                      {appLoading?'Submitting...':'Submit Application'}
                    </button>
                  </div>
                ):(
                  <div style={{textAlign:'center',padding:'40px 0'}}>
                    <div style={{fontSize:52,marginBottom:20}}>✅</div>
                    <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:700,color:C.navy,marginBottom:14}}>Application Submitted!</h3>
                    <p style={{color:C.muted,lineHeight:1.7}}>We'll review your details and be in touch within 24 hours.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{marginTop:52,background:C.navy,padding:'48px 44px',textAlign:'center'}}>
            <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:30,fontWeight:700,color:'white',marginBottom:14}}>Don't See the Right Role?</h3>
            <p style={{color:'rgba(255,255,255,0.55)',marginBottom:28,fontSize:15}}>Register your CV and we'll alert you when a matching opportunity arises.</p>
            <button onClick={()=>setPage('contact')} className="gold-btn" style={{padding:'14px 36px',border:'none',cursor:'pointer',fontSize:14,fontWeight:500}}>Register Your CV</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CONTACT (saves to Supabase) ─────────────────────────────────────────────
const Contact = () => {
  const [form,setForm]=useState({name:'',email:'',company:'',service:'',message:''});
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const canSend=form.name&&form.email&&form.message;

  const handleSubmit=async()=>{
    if(!canSend||loading)return;
    setLoading(true);
    setError('');
    try{
      await submitContact(form);
      setSent(true);
    }catch(e){
      setError('Something went wrong. Please email admin@nhb-consultancy.com directly.');
    }
    setLoading(false);
  };

  return(
    <div style={{paddingTop:72}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},#1A3A5C)`,padding:'90px 2rem',textAlign:'center'}}>
        <span style={{color:C.gold,fontSize:11,letterSpacing:'0.22em',textTransform:'uppercase'}}>Get in Touch</span>
        <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:60,fontWeight:700,color:'white',marginTop:16,marginBottom:20}}>Let's Start a Conversation</h1>
        <p style={{color:'rgba(255,255,255,0.62)',fontSize:17,maxWidth:440,margin:'0 auto'}}>Whether you're looking to hire, need HR support, or just want to explore — we'd love to hear from you.</p>
      </div>
      <div style={{background:C.bg,padding:'80px 2rem'}}>
        <div style={{maxWidth:1000,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:64}}>
          <div>
            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:36,fontWeight:700,color:C.navy,marginBottom:36}}>Contact Details</h2>
            {[{icon:'📧',label:'Email',value:'admin@nhb-consultancy.com'},{icon:'📱',label:'WhatsApp',value:'+971 52 489 0505'},{icon:'📍',label:'Location',value:'Dubai, UAE'}].map((c,i)=>(
              <div key={i} style={{display:'flex',gap:18,padding:'20px 0',borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:24}}>{c.icon}</div>
                <div>
                  <div style={{fontSize:11,color:C.gold,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:600,marginBottom:5}}>{c.label}</div>
                  <div style={{color:C.navy,fontSize:15}}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:C.white,padding:52,border:`1px solid ${C.border}`}}>
            {!sent?(
              <div>
                <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:30,fontWeight:700,color:C.navy,marginBottom:36}}>Send Us a Message</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                  {[{label:'Your Name *',k:'name',ph:'Full name'},{label:'Email *',k:'email',ph:'your@email.com'}].map(f=>(
                    <div key={f.k}>
                      <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:9,letterSpacing:'0.07em',textTransform:'uppercase'}}>{f.label}</label>
                      <input value={form[f.k]} onChange={set(f.k)} placeholder={f.ph}
                        style={{width:'100%',padding:'12px 14px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,outline:'none',background:C.bg}}/>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:9,letterSpacing:'0.07em',textTransform:'uppercase'}}>Company</label>
                  <input value={form.company} onChange={set('company')} placeholder="Your company name"
                    style={{width:'100%',padding:'12px 14px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,outline:'none',background:C.bg}}/>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:9,letterSpacing:'0.07em',textTransform:'uppercase'}}>I'm Interested In</label>
                  <select value={form.service} onChange={set('service')}
                    style={{width:'100%',padding:'12px 14px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,outline:'none',background:C.bg,cursor:'pointer'}}>
                    <option value="">Select a service...</option>
                    {['HR Consultancy Services','Recruitment & Talent Acquisition','Outsourced HR Services','Hospitality Recruitment','Register my CV','Other'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:28}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:C.navy,marginBottom:9,letterSpacing:'0.07em',textTransform:'uppercase'}}>Message *</label>
                  <textarea value={form.message} onChange={set('message')} placeholder="Tell us about your needs..." rows={4}
                    style={{width:'100%',padding:'12px 14px',border:`1px solid ${C.border}`,fontSize:14,color:C.navy,outline:'none',background:C.bg,resize:'vertical',fontFamily:'DM Sans,sans-serif'}}/>
                </div>
                {error&&<p style={{color:'#dc2626',fontSize:13,marginBottom:16}}>{error}</p>}
                <button onClick={handleSubmit} disabled={!canSend||loading} className="gold-btn"
                  style={{width:'100%',padding:'16px',border:'none',cursor:'pointer',fontSize:15,fontWeight:500}}>
                  {loading?'Sending...':'Send Message'}
                </button>
              </div>
            ):(
              <div style={{textAlign:'center',padding:'72px 0'}}>
                <div style={{fontSize:60,marginBottom:26}}>✅</div>
                <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:34,fontWeight:700,color:C.navy,marginBottom:18}}>Message Sent!</h3>
                <p style={{color:C.muted,fontSize:16,lineHeight:1.75}}>Thank you for reaching out. Our team will be in touch within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const Footer = ({setPage}) => (
  <footer style={{background:C.dark,padding:'64px 2rem 32px'}}>
    <div style={{maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:52,marginBottom:52,paddingBottom:52,borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
            <div style={{width:38,height:38,background:C.gold,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'white',fontFamily:'Cormorant Garamond,serif',fontSize:18,fontWeight:700}}>N</span>
            </div>
            <div>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:18,fontWeight:700,color:'white'}}>NHB Consultancy</div>
              <div style={{fontSize:10,color:C.gold,letterSpacing:'0.16em'}}>DUBAI, UAE</div>
            </div>
          </div>
          <p style={{color:'rgba(255,255,255,0.4)',lineHeight:1.75,maxWidth:280,fontSize:13}}>Dubai's boutique HR and hospitality recruitment specialist. Powered by people, enhanced by AI.</p>
        </div>
        {[
          {title:'Services',links:[['HR Consultancy','hr'],['Recruitment','contact'],['Outsourced HR','contact'],['Hospitality','hospitality']]},
          {title:'Company',links:[['About Us','about'],['AI Tools','tools'],['Careers','careers'],['Contact','contact']]},
          {title:'Contact',links:[['admin@nhb-consultancy.com',null],['+971 52 489 0505',null],['Dubai, UAE',null]]},
        ].map((col,i)=>(
          <div key={i}>
            <div style={{color:'white',fontWeight:600,fontSize:14,marginBottom:22}}>{col.title}</div>
            {col.links.map(([label,pg],j)=>(
              <div key={j} onClick={()=>pg&&setPage(pg)}
                style={{color:'rgba(255,255,255,0.42)',fontSize:13.5,marginBottom:11,cursor:pg?'pointer':'default',transition:'color 0.2s'}}
                onMouseOver={e=>pg&&(e.target.style.color=C.gold)}
                onMouseOut={e=>(e.target.style.color='rgba(255,255,255,0.42)')}>
                {label}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{color:'rgba(255,255,255,0.28)',fontSize:12}}>© 2025 NHB Consultancy. All rights reserved.</div>
        <div style={{display:'flex',gap:18}}>
          {['LinkedIn','Instagram','Facebook','TikTok'].map((s,i)=>(
            <span key={i} style={{color:'rgba(255,255,255,0.28)',fontSize:12,cursor:'pointer',transition:'color 0.2s'}}
              onMouseOver={e=>(e.target.style.color=C.gold)} onMouseOut={e=>(e.target.style.color='rgba(255,255,255,0.28)')}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ─── FLOATING CHAT ───────────────────────────────────────────────────────────
const FloatChat = () => {
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{r:'a',t:"Hi! 👋 I'm NHB's AI assistant. Ask me anything about our HR or hospitality recruitment services!"}]);
  const [inp,setInp]=useState('');
  const [load,setLoad]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs,open]);

  const send=async()=>{
    if(!inp.trim()||load)return;
    const msg=inp.trim();
    setInp('');
    setMsgs(p=>[...p,{r:'u',t:msg}]);
    setLoad(true);
    try{
      const history=[...msgs.map(m=>({role:m.r==='u'?'user':'assistant',content:m.t})),{role:'user',content:msg}];
      const reply=await callClaude(`${NHB_SYSTEM} Keep replies to 2-3 sentences max — this is a compact chat widget.`,history,400);
      setMsgs(p=>[...p,{r:'a',t:reply}]);
    }catch{
      setMsgs(p=>[...p,{r:'a',t:'Sorry, please try again or email admin@nhb-consultancy.com'}]);
    }
    setLoad(false);
  };

  return(
    <div style={{position:'fixed',bottom:24,right:24,zIndex:1000}}>
      {open&&(
        <div style={{width:348,background:C.white,border:`1px solid ${C.border}`,boxShadow:'0 24px 64px rgba(26,31,54,0.22)',marginBottom:14,display:'flex',flexDirection:'column'}}>
          <div style={{background:C.navy,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:34,height:34,background:C.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🤖</div>
              <div>
                <div style={{color:'white',fontSize:13,fontWeight:600}}>NHB Assistant</div>
                <div style={{color:C.gold,fontSize:11}}>● Online</div>
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.45)',cursor:'pointer',fontSize:22,lineHeight:1}}>×</button>
          </div>
          <div style={{height:340,overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:12}}>
            {msgs.map((m,i)=>(
              <div key={i} className="chat-in" style={{display:'flex',justifyContent:m.r==='u'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'84%',padding:'10px 14px',fontSize:13.5,lineHeight:1.6,
                  background:m.r==='u'?C.navy:C.bg,color:m.r==='u'?'white':C.navy,
                  borderRadius:m.r==='u'?'12px 12px 0 12px':'12px 12px 12px 0'}}>
                  {m.t}
                </div>
              </div>
            ))}
            {load&&<div style={{background:C.bg,padding:'10px 16px',borderRadius:'12px 12px 12px 0',color:C.muted,fontSize:18}}>···</div>}
            <div ref={endRef}/>
          </div>
          <div style={{padding:'12px 14px',borderTop:`1px solid ${C.border}`,display:'flex',gap:8}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
              placeholder="Ask anything..."
              style={{flex:1,padding:'10px 14px',border:`1px solid ${C.border}`,fontSize:13,color:C.navy,outline:'none',background:C.bg}}/>
            <button onClick={send} disabled={load} className="gold-btn"
              style={{padding:'10px 18px',border:'none',cursor:'pointer',fontSize:15}}>→</button>
          </div>
        </div>
      )}
      <button onClick={()=>setOpen(p=>!p)} className="pulse"
        style={{width:58,height:58,background:C.gold,border:'none',cursor:'pointer',fontSize:24,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 28px rgba(184,146,42,0.45)',marginLeft:'auto'}}>
        {open?'×':'💬'}
      </button>
    </div>
  );
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page,setPage]=useState('home');
  useEffect(()=>{window.scrollTo(0,0);},[page]);
  const pages={home:Home,hospitality:Hospitality,hr:HRServices,tools:AITools,about:About,careers:Careers,contact:Contact};
  const Page=pages[page]||Home;
  return(
    <div style={{minHeight:'100vh',background:C.bg}}>
      <FontStyle/>
      <Nav page={page} setPage={setPage}/>
      <Page setPage={setPage}/>
      <Footer setPage={setPage}/>
      <FloatChat/>
    </div>
  );
}
