import { useState, useEffect, useRef } from "react";
import { submitContact, submitApplication, saveHealthCheck, fetchJobs } from "./lib/supabase";

const callClaude = async (system, messages, maxTokens = 1000) => {
  const res = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error('Request failed');
  const data = await res.json();
  return data.content?.map(c => c.text).join('') || '';
};

const NHB_SYSTEM = `You are a senior consultant at NHB Consultancy, a boutique HR and hospitality recruitment firm in Dubai, UAE, founded by Nihel Hassen Busman. You speak like a knowledgeable, experienced professional — not a chatbot. Be direct, warm and concise. Never use phrases like "Certainly!" or "Great question!". Get straight to the point.

NHB services: HR Consultancy (UAE Labour Law, policies, compliance, performance management), Recruitment & Talent Acquisition, Outsourced HR for SMEs, Hospitality Staffing (hotels, F&B, events, pre-opening).

If someone asks about pricing, say the team will provide a tailored proposal. For complex legal matters, recommend speaking directly with NHB's team at admin@nhb-consultancy.com.`;

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Lato:wght@300;400;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{font-family:'Lato',sans-serif;color:#1a1a1a;background:#fff;overflow-x:hidden}
    h1,h2,h3,h4{font-family:'Montserrat',sans-serif}
    a{text-decoration:none;color:inherit}
    input,textarea,select{font-family:'Lato',sans-serif}
    select{-webkit-appearance:none;appearance:none}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:#c9a84c}

    .btn-primary{background:#c9a84c;color:#fff;border:none;padding:14px 36px;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;transition:all 0.3s}
    .btn-primary:hover{background:#b8922a}
    .btn-outline{background:transparent;color:#fff;border:1px solid #fff;padding:13px 35px;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;transition:all 0.3s}
    .btn-outline:hover{background:#fff;color:#1a1a1a}
    .btn-dark{background:#1a1a2e;color:#fff;border:none;padding:14px 36px;font-family:'Montserrat',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;transition:all 0.3s}
    .btn-dark:hover{background:#c9a84c}

    .section-label{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c9a84c;margin-bottom:16px}
    .section-title{font-family:'Montserrat',sans-serif;font-size:clamp(28px,4vw,42px);font-weight:700;color:#1a1a2e;line-height:1.2;margin-bottom:20px}
    .section-body{font-family:'Lato',sans-serif;font-size:16px;color:#555;line-height:1.8}
    .gold-line{width:50px;height:2px;background:#c9a84c;margin-bottom:24px}

    .nav-link-item{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;transition:color 0.3s;background:none;border:none;color:inherit}
    .nav-link-item:hover{color:#c9a84c}

    .service-card{border-bottom:1px solid #e8e8e8;padding:36px 0;display:flex;align-items:flex-start;gap:32px;cursor:default;transition:all 0.3s}
    .service-card:hover .service-num{color:#c9a84c}
    .service-num{font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.15em;color:#ccc;min-width:28px;padding-top:4px;transition:color 0.3s}
    .service-icon{width:48px;height:48px;flex-shrink:0}
    .service-title{font-family:'Montserrat',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a2e;margin-bottom:8px}
    .service-desc{font-size:14px;color:#666;line-height:1.7}

    .stat-num{font-family:'Montserrat',sans-serif;font-size:52px;font-weight:800;color:#c9a84c;line-height:1}
    .stat-label{font-family:'Lato',sans-serif;font-size:13px;color:#888;margin-top:6px;letter-spacing:0.05em}

    .chat-bubble{max-width:80%;padding:12px 16px;font-size:14px;line-height:1.6;border-radius:2px}
    .chat-in{animation:fadeUp 0.3s ease}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}50%{box-shadow:0 0 0 10px rgba(201,168,76,0)}}
    .pulse{animation:pulse 2.5s infinite}
    @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .fade-in{animation:fadeIn 0.5s ease forwards}

    .form-field{margin-bottom:16px}
    .form-label{display:block;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#1a1a2e;margin-bottom:7px}
    .form-input{width:100%;padding:12px 14px;border:1px solid #ddd;font-size:14px;color:#1a1a2e;outline:none;transition:border-color 0.3s;background:#fafafa}
    .form-input:focus{border-color:#c9a84c;background:#fff}

    .job-row{padding:20px 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;gap:16px}
    .job-title-text{font-family:'Montserrat',sans-serif;font-size:15px;font-weight:600;color:#1a1a2e;margin-bottom:4px}
    .job-meta{font-size:13px;color:#888}

    .tool-tab{padding:10px 20px;border:1px solid #e0e0e0;background:#fff;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;color:#888}
    .tool-tab.active{background:#1a1a2e;color:#fff;border-color:#1a1a2e}

    .health-opt{padding:8px 18px;border:1px solid #ddd;font-size:13px;cursor:pointer;transition:all 0.2s;background:#fff;color:#555;font-family:'Lato',sans-serif}
    .health-opt.selected{background:#c9a84c;border-color:#c9a84c;color:#fff}

    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:300;padding:20px}
    .modal-box{background:#fff;padding:48px;max-width:480px;width:100%;position:relative}
  `}</style>
);

const C = { navy: '#1a1a2e', gold: '#c9a84c', white: '#fff', light: '#f8f7f4', muted: '#666', border: '#e8e8e8' };

// ── ICONS (clean SVG) ────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, color = C.navy }) => {
  const icons = {
    hr: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    recruit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
    outsource: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    hospitality: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    chat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    pin: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  };
  return icons[name] || null;
};

// ── NAV ──────────────────────────────────────────────────────────────────────
const Nav = ({ page, setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const links = [
    { id: 'home', label: 'Home' }, { id: 'about', label: 'About Us' },
    { id: 'hr', label: 'Our Services' }, { id: 'careers', label: 'Career' },
    { id: 'contact', label: 'Contact Us' },
  ];
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, transition: 'all 0.4s', background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? `1px solid ${C.border}` : 'none', padding: '0 2.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 76 }}>
        <div onClick={() => setPage('home')} style={{ cursor: 'pointer' }}>
          <img src="https://nhb-consultancy.com/wp-content/uploads/2025/11/logo-1.png" alt="NHB Consultancy" style={{ height: 44, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <div style={{ display: 'none', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 18, color: scrolled ? C.navy : C.white, letterSpacing: '0.05em' }}>NHB</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => setPage(l.id)} className="nav-link-item"
              style={{ color: page === l.id ? C.gold : (scrolled ? C.navy : C.white) }}>
              {l.label}
            </button>
          ))}
          <button onClick={() => setPage('contact')} className="btn-primary" style={{ padding: '11px 28px', fontSize: 11 }}>
            Let's Talk
          </button>
        </div>
      </div>
    </nav>
  );
};

// ── HOME ─────────────────────────────────────────────────────────────────────
const Home = ({ setPage }) => {
  const services = [
    { num: '01', icon: 'hr', title: 'HR Consultancy Services', desc: 'Policies, compliance, HR strategy and organizational development' },
    { num: '02', icon: 'recruit', title: 'Recruitment & Talent Acquisition', desc: 'End-to-end hiring, headhunting & talent mapping' },
    { num: '03', icon: 'outsource', title: 'Outsourced HR Services', desc: 'Flexible solutions for SMEs & growing businesses' },
    { num: '04', icon: 'hospitality', title: 'Hospitality Management Services', desc: 'Staffing, operations and service excellence' },
  ];

  return (
    <div>
      {/* HERO — video background */}
      <div style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <video autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => e.target.style.display = 'none'}>
          <source src="https://nhb-consultancy.com/wp-content/uploads/2025/11/slide.mp4" type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26,26,46,0.82) 0%, rgba(26,26,46,0.65) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: '0 2.5rem', width: '100%' }}>
          <div style={{ maxWidth: 660 }}>
            <p className="section-label" style={{ color: C.gold }}>Dubai's Boutique HR Specialist</p>
            <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 'clamp(48px,7vw,82px)', fontWeight: 800, color: C.white, lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 28 }}>
              PLAN.<br />LAUNCH.<br />GROW
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, lineHeight: 1.75, marginBottom: 44, maxWidth: 500 }}>
              NHB Consultancy offers tailored HR services and top-tier talent solutions under one roof — helping companies grow through people.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => setPage('contact')} className="btn-primary">Contact Us</button>
              <button onClick={() => setPage('hr')} className="btn-outline">Our Services</button>
            </div>
          </div>
        </div>
      </div>

      {/* INTRO SECTION */}
      <div style={{ background: C.white, padding: '100px 2.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div className="gold-line" />
            <p className="section-label">Your Ultimate Partner</p>
            <h2 className="section-title">Human Resource Excellence</h2>
            <p className="section-body" style={{ marginBottom: 32 }}>
              Boutique HR Consultancy & Recruitment Agency delivering personalised solutions across HR, Talent Acquisition, Outsourced Services and Hospitality Management.
            </p>
            <button onClick={() => setPage('contact')} className="btn-dark">Book Consultation</button>
          </div>
          <div style={{ position: 'relative' }}>
            <img src="https://nhb-consultancy.com/wp-content/uploads/2025/11/business-concept-with-team-close-up-1024x683.jpg"
              alt="NHB Team" style={{ width: '100%', height: 360, objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
            <div style={{ position: 'absolute', bottom: -24, left: -24, background: C.navy, padding: '28px 36px' }}>
              <div className="stat-num">245%</div>
              <div className="stat-label">Growth Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div style={{ background: C.light, padding: '100px 2.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
            <div>
              <div className="gold-line" />
              <p className="section-label">What We Do</p>
              <h2 className="section-title">Our Services</h2>
              <p className="section-body">
                NHB HR Solution offers integrated HR Consultancy and Recruitment services to support organisations in optimising their people, processes and performance.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {services.map((s, i) => (
                <div key={i} className="service-card" onClick={() => setPage(i === 3 ? 'hospitality' : 'hr')}>
                  <span className="service-num">{s.num}</span>
                  <Icon name={s.icon} size={36} color={C.gold} />
                  <div>
                    <div className="service-title">{s.title}</div>
                    <div className="service-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA BAND */}
      <div style={{ background: C.navy, padding: '80px 2.5rem', textAlign: 'center' }}>
        <p className="section-label" style={{ color: C.gold, textAlign: 'center' }}>NHB Consultancy</p>
        <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: C.white, marginBottom: 20, maxWidth: 700, margin: '0 auto 20px' }}>
          Take Your Business to the Next Level
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.75 }}>
          We deliver strategic HR and recruitment solutions with expertise, efficiency and personalised support to help businesses operate seamlessly and grow.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={() => setPage('contact')} className="btn-primary">Book Consultation</button>
          <button onClick={() => setPage('contact')} className="btn-outline">Contact Us</button>
        </div>
      </div>

      {/* AI TOOLS STRIP */}
      <div style={{ background: C.white, padding: '80px 2.5rem', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div className="gold-line" style={{ margin: '0 auto 20px' }} />
          <p className="section-label">Powered by AI</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Free HR Tools</h2>
          <p className="section-body" style={{ maxWidth: 500, margin: '0 auto 52px', textAlign: 'center' }}>
            Instant insights for your business — no account required.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: C.border }}>
            {[
              { icon: 'hr', title: 'HR Health Check', desc: 'Assess your HR maturity and get a personalised action plan.' },
              { icon: 'recruit', title: 'Salary Benchmarker', desc: 'Compare UAE hospitality salary ranges by role and experience.' },
              { icon: 'chat', title: 'Ask an HR Expert', desc: 'Get instant answers on UAE labour law and HR best practices.' },
            ].map((t, i) => (
              <div key={i} onClick={() => setPage('tools')} style={{ background: C.white, padding: '44px 36px', cursor: 'pointer', transition: 'all 0.3s', textAlign: 'left' }}
                onMouseOver={e => e.currentTarget.style.background = C.light}
                onMouseOut={e => e.currentTarget.style.background = C.white}>
                <Icon name={t.icon} size={32} color={C.gold} />
                <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 16, fontWeight: 700, color: C.navy, margin: '20px 0 10px' }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 20 }}>{t.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.gold, fontSize: 12, fontWeight: 600, fontFamily: 'Montserrat,sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Try Free <Icon name="arrow" size={14} color={C.gold} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ABOUT ────────────────────────────────────────────────────────────────────
const About = ({ setPage }) => (
  <div style={{ paddingTop: 76 }}>
    <div style={{ background: C.navy, padding: '90px 2.5rem', textAlign: 'center' }}>
      <p className="section-label">Who We Are</p>
      <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: C.white, marginTop: 8 }}>About NHB Consultancy</h1>
    </div>
    <div style={{ background: C.white, padding: '90px 2.5rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div className="gold-line" />
          <p className="section-label">Our Story</p>
          <h2 className="section-title">People at the Heart of Everything</h2>
          <p className="section-body" style={{ marginBottom: 20 }}>
            NHB Consultancy was founded with a clear mission: to give businesses access to expert, personalised HR support that was traditionally only available to large corporations.
          </p>
          <p className="section-body" style={{ marginBottom: 32 }}>
            Every company — regardless of size — deserves world-class people strategy. We serve both SME and enterprise-level clients across the GCC with high-impact HR strategies and targeted talent acquisition services.
          </p>
          <button onClick={() => setPage('contact')} className="btn-dark">Work With Us</button>
        </div>
        <div>
          <div style={{ background: C.light, padding: 40, borderLeft: `3px solid ${C.gold}` }}>
            <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Nihel Hassen Busman</h3>
            <p style={{ fontSize: 12, color: C.gold, fontFamily: 'Montserrat,sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Founder & Executive HR Consultant</p>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, marginBottom: 24 }}>
              An accomplished HR professional with extensive experience across HR operations, recruitment, employee relations and hospitality management. Nihel brings deep regional knowledge of UAE labour law, HR systems, employee engagement and organisational development.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['UAE Labour Law', 'HR Strategy', 'Hospitality', 'Talent Acquisition', 'HR Analytics'].map((t, i) => (
                <span key={i} style={{ padding: '5px 12px', border: `1px solid ${C.gold}`, color: C.gold, fontSize: 11, fontFamily: 'Montserrat,sans-serif', fontWeight: 600, letterSpacing: '0.08em' }}>{t}</span>
              ))}
            </div>
          </div>
{['Integrity', 'Excellence', 'Agility', 'Partnership', 'Confidentiality', 'Impact'].map((val, i) => (
  <div key={i} style={{ background: C.white, padding: '22px 16px', textAlign: 'center', borderTop: `2px solid ${i < 3 ? C.gold : 'transparent'}` }}>
    <div style={{ width: 24, height: 1, background: C.gold, margin: '0 auto 12px' }} />
    <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 10, fontWeight: 700, color: C.navy, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{val}</div>
  </div>
))}
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── HR SERVICES ──────────────────────────────────────────────────────────────
const HRServices = ({ setPage }) => {
  const services = [
    { num: '01', icon: 'hr', title: 'HR Consultancy Services', items: ['UAE Labour Law compliance', 'Policy & procedure development', 'HR strategy & organisational design', 'Performance management frameworks', 'Employee engagement & culture'] },
    { num: '02', icon: 'recruit', title: 'Recruitment & Talent Acquisition', items: ['End-to-end hiring management', 'Executive & senior search', 'Headhunting & talent mapping', 'Candidate screening & assessment', 'Onboarding support'] },
    { num: '03', icon: 'outsource', title: 'Outsourced HR Services', items: ['Payroll management', 'PRO services & visa processing', 'Leave & absence management', 'Employee documentation', 'On-demand HR support'] },
    { num: '04', icon: 'hospitality', title: 'Hospitality Management Services', items: ['Hotel & resort staffing', 'F&B recruitment', 'Pre-opening team builds', 'Events & catering staffing', 'SOP development'] },
  ];
  return (
    <div style={{ paddingTop: 76 }}>
      <div style={{ background: C.navy, padding: '90px 2.5rem', textAlign: 'center' }}>
        <p className="section-label">What We Offer</p>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: C.white, marginTop: 8 }}>Our Services</h1>
      </div>
      <div style={{ background: C.white, padding: '90px 2.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            {services.map((s, i) => (
              <div key={i} style={{ borderTop: `2px solid ${C.gold}`, paddingTop: 32 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                  <Icon name={s.icon} size={32} color={C.gold} />
                  <div>
                    <div style={{ fontSize: 11, color: '#ccc', fontFamily: 'Montserrat,sans-serif', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 4 }}>{s.num}</div>
                    <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 15, fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.title}</h3>
                  </div>
                </div>
                {s.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14, color: C.muted }}>
                    <div style={{ width: 4, height: 4, background: C.gold, flexShrink: 0, borderRadius: '50%' }} />
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 80, background: C.navy, padding: '60px', textAlign: 'center' }}>
            <p className="section-label">Ready to Start?</p>
            <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 32, fontWeight: 700, color: C.white, marginBottom: 24 }}>Let's Discuss Your Needs</h2>
            <button onClick={() => setPage('contact')} className="btn-primary">Book a Consultation</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── AI TOOLS ─────────────────────────────────────────────────────────────────
const AITools = () => {
  const [tab, setTab] = useState('chat');
  const [msgs, setMsgs] = useState([{ r: 'a', t: "How can I help you today? I can answer questions about UAE labour law, HR practices, salary benchmarks, or NHB's services." }]);
  const [inp, setInp] = useState('');
  const [chatLoad, setChatLoad] = useState(false);
  const endRef = useRef(null);
  const [hAnswers, setHAnswers] = useState({});
  const [hResult, setHResult] = useState(null);
  const [hLoad, setHLoad] = useState(false);
  const [sRole, setSRole] = useState('');
  const [sExp, setSExp] = useState('');
  const [sResult, setSResult] = useState(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, tab]);

  const hQs = [
    { q: 'Do you have documented HR policies and procedures?', k: 'p1' },
    { q: 'Is your business compliant with UAE Labour Law?', k: 'p2' },
    { q: 'Do you have a formal performance management process?', k: 'p3' },
    { q: 'Do you conduct regular employee engagement activities?', k: 'p4' },
    { q: 'Do you have a structured onboarding programme?', k: 'p5' },
    { q: 'Do you track HR metrics and KPIs regularly?', k: 'p6' },
    { q: 'Do you have a training and development programme?', k: 'p7' },
    { q: 'Is your payroll process accurate and compliant?', k: 'p8' },
    { q: 'Do you have clear job descriptions for all roles?', k: 'p9' },
    { q: 'Do you have a structured recruitment process?', k: 'p10' },
  ];

  const salaries = {
    'General Manager': { j: '25,000–35,000', m: '35,000–55,000', s: '55,000–90,000+' },
    'Hotel Manager': { j: '18,000–25,000', m: '25,000–40,000', s: '40,000–65,000' },
    'F&B Manager': { j: '12,000–18,000', m: '18,000–28,000', s: '28,000–45,000' },
    'Restaurant Manager': { j: '8,000–14,000', m: '14,000–22,000', s: '22,000–35,000' },
    'Executive Chef': { j: '15,000–22,000', m: '22,000–35,000', s: '35,000–60,000' },
    'Front Office Manager': { j: '10,000–15,000', m: '15,000–25,000', s: '25,000–40,000' },
    'HR Manager': { j: '12,000–18,000', m: '18,000–30,000', s: '30,000–50,000' },
    'Revenue Manager': { j: '12,000–18,000', m: '18,000–28,000', s: '28,000–45,000' },
    'Bartender': { j: '4,000–7,000', m: '7,000–12,000', s: '12,000–20,000' },
    'Waiter / Server': { j: '2,500–4,500', m: '4,500–8,000', s: '8,000–14,000' },
  };

  const sendChat = async () => {
    if (!inp.trim() || chatLoad) return;
    const userMsg = inp.trim(); setInp('');
    setMsgs(p => [...p, { r: 'u', t: userMsg }]);
    setChatLoad(true);
    try {
      const history = [...msgs.map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t })), { role: 'user', content: userMsg }];
      const reply = await callClaude(NHB_SYSTEM, history);
      setMsgs(p => [...p, { r: 'a', t: reply }]);
    } catch { setMsgs(p => [...p, { r: 'a', t: 'Unable to connect at the moment. Please email admin@nhb-consultancy.com.' }]); }
    setChatLoad(false);
  };

  const submitHealth = async () => {
    setHLoad(true);
    try {
      const answers = hQs.map(q => `${q.q}: ${hAnswers[q.k] || 'Not answered'}`).join('\n');
      const HEALTH_SYSTEM = 'You are an expert HR consultant. Analyse these HR health check answers. Return ONLY valid JSON (no markdown): {"score":number,"grade":"string","summary":"string","strengths":["string","string","string"],"gaps":["string","string","string"],"recommendations":["string","string","string"]}';
      const raw = await callClaude(HEALTH_SYSTEM, [{ role: 'user', content: `HR Health Check:\n${answers}` }]);
      setHResult(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch {
      setHResult({ score: 60, grade: 'C+', summary: 'Assessment complete. Contact NHB for a detailed review.', strengths: ['Awareness of HR importance', 'Openness to improvement', 'Some processes in place'], gaps: ['Policies need formalisation', 'Compliance may need review', 'Analytics not yet established'], recommendations: ['Engage NHB for an HR audit', 'Develop a core policy framework', 'Implement basic HR metrics'] });
    }
    setHLoad(false);
  };

  return (
    <div style={{ paddingTop: 76 }}>
      <div style={{ background: C.navy, padding: '90px 2.5rem', textAlign: 'center' }}>
        <p className="section-label">AI-Powered</p>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: C.white, marginTop: 8 }}>Free HR Tools</h1>
      </div>
      <div style={{ background: C.light, padding: '60px 2.5rem', minHeight: '70vh' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 1, marginBottom: 40, background: C.border }}>
            {[{ id: 'chat', label: 'HR Assistant' }, { id: 'health', label: 'HR Health Check' }, { id: 'salary', label: 'Salary Benchmarker' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`tool-tab ${tab === t.id ? 'active' : ''}`} style={{ flex: 1 }}>{t.label}</button>
            ))}
          </div>

          {/* CHAT */}
          {tab === 'chat' && (
            <div style={{ background: C.white, border: `1px solid ${C.border}` }}>
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chat" size={18} color={C.white} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 14, color: C.navy }}>NHB HR Advisor</div>
                  <div style={{ fontSize: 12, color: C.gold, fontFamily: 'Montserrat,sans-serif' }}>Online</div>
                </div>
              </div>
              <div style={{ height: 420, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {msgs.map((m, i) => (
                  <div key={i} className="chat-in" style={{ display: 'flex', justifyContent: m.r === 'u' ? 'flex-end' : 'flex-start' }}>
                    <div className="chat-bubble" style={{ background: m.r === 'u' ? C.navy : C.light, color: m.r === 'u' ? C.white : C.navy }}>{m.t}</div>
                  </div>
                ))}
                {chatLoad && <div style={{ background: C.light, padding: '12px 16px', color: C.muted, fontSize: 18, width: 'fit-content' }}>···</div>}
                <div ref={endRef} />
              </div>
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
                <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Ask about UAE labour law, HR practices, our services..."
                  className="form-input" style={{ flex: 1 }} />
                <button onClick={sendChat} disabled={chatLoad} className="btn-dark" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="send" size={14} color={C.white} />
                </button>
              </div>
            </div>
          )}

          {/* HEALTH CHECK */}
          {tab === 'health' && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, padding: 44 }}>
              <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 26, fontWeight: 700, color: C.navy, marginBottom: 8 }}>HR Health Check</h2>
              <p style={{ color: C.muted, marginBottom: 32, fontSize: 15 }}>Answer 10 questions to receive your AI-powered HR maturity score.</p>
              {!hResult ? (
                <div>
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Progress</span>
                      <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{Object.keys(hAnswers).length} / {hQs.length}</span>
                    </div>
                    <div style={{ height: 2, background: C.border }}>
                      <div style={{ height: '100%', background: C.gold, width: `${(Object.keys(hAnswers).length / hQs.length) * 100}%`, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {hQs.map((q, i) => (
                      <div key={i} style={{ padding: '18px 20px', background: C.light, borderLeft: `3px solid ${hAnswers[q.k] ? C.gold : C.border}` }}>
                        <p style={{ fontSize: 14, color: C.navy, fontWeight: 500, marginBottom: 12 }}>{i + 1}. {q.q}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['Yes', 'Partially', 'No'].map(opt => (
                            <button key={opt} onClick={() => setHAnswers(p => ({ ...p, [q.k]: opt }))} className={`health-opt ${hAnswers[q.k] === opt ? 'selected' : ''}`}>{opt}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={submitHealth} disabled={Object.keys(hAnswers).length < 10 || hLoad} className="btn-dark"
                    style={{ marginTop: 28, opacity: Object.keys(hAnswers).length < 10 || hLoad ? 0.5 : 1, cursor: Object.keys(hAnswers).length < 10 ? 'not-allowed' : 'pointer' }}>
                    {hLoad ? 'Analysing...' : 'Get My Score'}
                  </button>
                </div>
              ) : (
                <div className="fade-in">
                  <div style={{ textAlign: 'center', padding: '40px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 40 }}>
                    <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 96, fontWeight: 800, color: C.gold, lineHeight: 1 }}>{hResult.score}</div>
                    <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 24, fontWeight: 600, color: C.navy, marginTop: 4 }}>Grade: {hResult.grade}</div>
                    <p style={{ color: C.muted, fontSize: 15, marginTop: 14, maxWidth: 500, margin: '14px auto 0', lineHeight: 1.7 }}>{hResult.summary}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                    {[{ label: 'Strengths', items: hResult.strengths, col: '#22c55e' }, { label: 'Gaps', items: hResult.gaps, col: '#f59e0b' }, { label: 'Recommendations', items: hResult.recommendations, col: C.gold }].map((col, i) => (
                      <div key={i}>
                        <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 700, color: col.col, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14, borderBottom: `2px solid ${col.col}`, paddingBottom: 8 }}>{col.label}</div>
                        {col.items?.map((s, j) => <div key={j} style={{ fontSize: 13, color: C.muted, padding: '8px 0', borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{s}</div>)}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setHResult(null); setHAnswers({}); }} className="btn-dark" style={{ marginTop: 32, fontSize: 11 }}>Retake Assessment</button>
                </div>
              )}
            </div>
          )}

          {/* SALARY */}
          {tab === 'salary' && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, padding: 44 }}>
              <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 26, fontWeight: 700, color: C.navy, marginBottom: 8 }}>UAE Hospitality Salary Benchmarker</h2>
              <p style={{ color: C.muted, marginBottom: 36, fontSize: 15 }}>Estimated monthly salary ranges for hospitality roles in the UAE (AED).</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div className="form-field">
                  <label className="form-label">Role</label>
                  <select value={sRole} onChange={e => { setSRole(e.target.value); setSResult(null); }} className="form-input">
                    <option value="">Select a role...</option>
                    {Object.keys(salaries).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Experience Level</label>
                  <select value={sExp} onChange={e => { setSExp(e.target.value); setSResult(null); }} className="form-input">
                    <option value="">Select...</option>
                    <option value="j">Junior (0–3 years)</option>
                    <option value="m">Mid-level (3–7 years)</option>
                    <option value="s">Senior (7+ years)</option>
                  </select>
                </div>
              </div>
              <button onClick={() => sRole && sExp && setSResult(salaries[sRole]?.[sExp])} disabled={!sRole || !sExp} className="btn-dark"
                style={{ opacity: !sRole || !sExp ? 0.5 : 1, cursor: !sRole || !sExp ? 'not-allowed' : 'pointer' }}>
                Get Salary Range
              </button>
              {sResult && (
                <div className="fade-in" style={{ marginTop: 40, background: C.navy, padding: '44px 40px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Estimated Monthly Salary (AED)</div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 52, fontWeight: 800, color: C.gold }}>{sResult}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 10 }}>{sRole} · {sExp === 'j' ? '0–3 yrs' : sExp === 'm' ? '3–7 yrs' : '7+ yrs'}</div>
                  <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>Indicative ranges based on UAE market data. Contact NHB for precise benchmarking.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── CAREERS ──────────────────────────────────────────────────────────────────
const Careers = ({ setPage }) => {
  const [filter, setFilter] = useState('All');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyJob, setApplyJob] = useState(null);
  const [appForm, setAppForm] = useState({ name: '', email: '', message: '' });
  const [appSent, setAppSent] = useState(false);
  const [appLoading, setAppLoading] = useState(false);

  const fallback = [
    { title: 'Restaurant Manager', location: 'Dubai Marina', sector: 'F&B', type: 'Permanent' },
    { title: 'Front Office Manager', location: 'JBR, Dubai', sector: 'Hotels', type: 'Permanent' },
    { title: 'HR Manager', location: 'DIFC, Dubai', sector: 'Corporate', type: 'Permanent' },
    { title: 'Executive Chef', location: 'Downtown Dubai', sector: 'F&B', type: 'Permanent' },
    { title: 'Events Coordinator', location: 'Business Bay', sector: 'Events', type: 'Permanent' },
    { title: 'Hotel General Manager', location: 'DIFC, Dubai', sector: 'Hotels', type: 'Permanent' },
  ];

  useEffect(() => { fetchJobs().then(d => setJobs(d || [])).catch(() => setJobs(fallback)).finally(() => setLoading(false)); }, []);

  const sectors = ['All', 'Hotels', 'F&B', 'Corporate', 'Events'];
  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.sector === filter);

  const handleApply = async () => {
    if (!appForm.name || !appForm.email) return;
    setAppLoading(true);
    try { await submitApplication({ name: appForm.name, email: appForm.email, jobTitle: applyJob?.title, message: appForm.message }); setAppSent(true); }
    catch { alert('Something went wrong. Please email admin@nhb-consultancy.com directly.'); }
    setAppLoading(false);
  };

  return (
    <div style={{ paddingTop: 76 }}>
      <div style={{ background: C.navy, padding: '90px 2.5rem', textAlign: 'center' }}>
        <p className="section-label">Join Our Network</p>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: C.white, marginTop: 8 }}>Current Opportunities</h1>
      </div>
      <div style={{ background: C.white, padding: '70px 2.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 1, marginBottom: 40, background: C.border }}>
            {sectors.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`tool-tab ${filter === s ? 'active' : ''}`}>{s}</button>
            ))}
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>Loading...</div> : (
            filtered.map((job, i) => (
              <div key={i} className="job-row">
                <div>
                  <div className="job-title-text">{job.title}</div>
                  <div className="job-meta">Confidential — {job.location} · <span style={{ color: C.gold }}>{job.sector}</span> · {job.type}</div>
                </div>
                <button onClick={() => { setApplyJob(job); setAppSent(false); setAppForm({ name: '', email: '', message: '' }); }} className="btn-dark" style={{ padding: '10px 24px', fontSize: 11, whiteSpace: 'nowrap' }}>Apply Now</button>
              </div>
            ))
          )}
          <div style={{ marginTop: 60, background: C.light, padding: 44, textAlign: 'center', borderTop: `2px solid ${C.gold}` }}>
            <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Don't See the Right Role?</h3>
            <p style={{ color: C.muted, marginBottom: 24, fontSize: 15 }}>Register your CV and we'll be in touch when the right opportunity arises.</p>
            <button onClick={() => setPage('contact')} className="btn-dark">Register Your CV</button>
          </div>
        </div>
      </div>

      {applyJob && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button onClick={() => setApplyJob(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} color={C.muted} /></button>
            {!appSent ? (
              <div>
                <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Apply: {applyJob.title}</h3>
                <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>We'll review your details and be in touch within 24 hours.</p>
                {[{ label: 'Full Name *', k: 'name', ph: 'Your name' }, { label: 'Email *', k: 'email', ph: 'your@email.com' }].map(f => (
                  <div key={f.k} className="form-field">
                    <label className="form-label">{f.label}</label>
                    <input value={appForm[f.k]} onChange={e => setAppForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} className="form-input" />
                  </div>
                ))}
                <div className="form-field">
                  <label className="form-label">Brief Note (optional)</label>
                  <textarea value={appForm.message} onChange={e => setAppForm(p => ({ ...p, message: e.target.value }))} rows={3} className="form-input" style={{ resize: 'vertical' }} />
                </div>
                <button onClick={handleApply} disabled={!appForm.name || !appForm.email || appLoading} className="btn-dark" style={{ width: '100%', marginTop: 8, opacity: !appForm.name || !appForm.email ? 0.5 : 1 }}>
                  {appLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ marginBottom: 20 }}><Icon name="check" size={48} color={C.gold} /></div>
                <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Application Received</h3>
                <p style={{ color: C.muted, lineHeight: 1.7 }}>We'll be in touch within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── CONTACT ──────────────────────────────────────────────────────────────────
const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', service: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const canSend = form.name && form.email && form.message;

  const handleSubmit = async () => {
    if (!canSend || loading) return;
    setLoading(true); setError('');
    try { await submitContact(form); setSent(true); }
    catch { setError('Something went wrong. Please email admin@nhb-consultancy.com directly.'); }
    setLoading(false);
  };

  return (
    <div style={{ paddingTop: 76 }}>
      <div style={{ background: C.navy, padding: '90px 2.5rem', textAlign: 'center' }}>
        <p className="section-label">Get in Touch</p>
        <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, color: C.white, marginTop: 8 }}>Contact Us</h1>
      </div>
      <div style={{ background: C.white, padding: '90px 2.5rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 72 }}>
          <div>
            <div className="gold-line" />
            <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 28 }}>Let's Start a Conversation</h2>
            {[{ icon: 'mail', label: 'Email', value: 'admin@nhb-consultancy.com' }, { icon: 'phone', label: 'WhatsApp', value: '+971 52 489 0505' }, { icon: 'pin', label: 'Location', value: 'Dubai, UAE' }].map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '18px 0', borderBottom: `1px solid ${C.border}` }}>
                <Icon name={c.icon} size={20} color={C.gold} />
                <div>
                  <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 14, color: C.navy }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: C.light, padding: 48 }}>
            {!sent ? (
              <div>
                <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 28 }}>Send a Message</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[{ label: 'Full Name *', k: 'name', ph: 'Your name' }, { label: 'Email *', k: 'email', ph: 'your@email.com' }].map(f => (
                    <div key={f.k} className="form-field">
                      <label className="form-label">{f.label}</label>
                      <input value={form[f.k]} onChange={set(f.k)} placeholder={f.ph} className="form-input" />
                    </div>
                  ))}
                </div>
                <div className="form-field">
                  <label className="form-label">Company</label>
                  <input value={form.company} onChange={set('company')} placeholder="Your company" className="form-input" />
                </div>
                <div className="form-field">
                  <label className="form-label">I'm Interested In</label>
                  <select value={form.service} onChange={set('service')} className="form-input">
                    <option value="">Select...</option>
                    {['HR Consultancy Services', 'Recruitment & Talent Acquisition', 'Outsourced HR Services', 'Hospitality Recruitment', 'Register my CV', 'Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Message *</label>
                  <textarea value={form.message} onChange={set('message')} rows={4} placeholder="Tell us about your needs..." className="form-input" style={{ resize: 'vertical' }} />
                </div>
                {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 14 }}>{error}</p>}
                <button onClick={handleSubmit} disabled={!canSend || loading} className="btn-dark" style={{ width: '100%', marginTop: 4, opacity: !canSend ? 0.5 : 1, cursor: !canSend ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Icon name="check" size={52} color={C.gold} />
                <h3 style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 26, fontWeight: 700, color: C.navy, margin: '20px 0 12px' }}>Message Sent</h3>
                <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.75 }}>Thank you for reaching out. Our team will respond within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = ({ setPage }) => (
  <footer style={{ background: C.navy, padding: '60px 2.5rem 32px' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <img src="https://nhb-consultancy.com/wp-content/uploads/2025/11/logo-1.png" alt="NHB" style={{ height: 40, marginBottom: 20, objectFit: 'contain' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.75, maxWidth: 280 }}>
            Dubai's boutique HR and hospitality recruitment specialist. Helping companies grow through people.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            {['LinkedIn', 'Instagram', 'Facebook', 'TikTok'].map((s, i) => (
              <span key={i} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'Montserrat,sans-serif', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseOver={e => e.target.style.color = C.gold} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.35)'}>{s}</span>
            ))}
          </div>
        </div>
        {[
          { title: 'Pages', links: [['Home', 'home'], ['About Us', 'about'], ['Our Services', 'hr'], ['Career', 'careers'], ['Contact Us', 'contact']] },
          { title: 'Services', links: [['HR Consultancy', 'hr'], ['Recruitment', 'hr'], ['Outsourced HR', 'hr'], ['Hospitality', 'hr']] },
          { title: 'Contact', links: [['admin@nhb-consultancy.com', null], ['+971 52 489 0505', null], ['Dubai, UAE', null]] },
        ].map((col, i) => (
          <div key={i}>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, marginBottom: 20 }}>{col.title}</div>
            {col.links.map(([label, pg], j) => (
              <div key={j} onClick={() => pg && setPage(pg)} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 10, cursor: pg ? 'pointer' : 'default', transition: 'color 0.2s' }}
                onMouseOver={e => pg && (e.target.style.color = C.white)} onMouseOut={e => (e.target.style.color = 'rgba(255,255,255,0.45)')}>{label}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>© 2025 NHB Consultancy. All rights reserved.</div>
      </div>
    </div>
  </footer>
);

// ── FLOATING CHAT ────────────────────────────────────────────────────────────
const FloatChat = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ r: 'a', t: "How can I help you? I can answer questions about HR, recruitment, or our services." }]);
  const [inp, setInp] = useState('');
  const [load, setLoad] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  const send = async () => {
    if (!inp.trim() || load) return;
    const msg = inp.trim(); setInp('');
    setMsgs(p => [...p, { r: 'u', t: msg }]);
    setLoad(true);
    try {
      const history = [...msgs.map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t })), { role: 'user', content: msg }];
      const reply = await callClaude(`${NHB_SYSTEM} Keep replies to 2-3 sentences maximum — this is a compact widget.`, history, 400);
      setMsgs(p => [...p, { r: 'a', t: reply }]);
    } catch { setMsgs(p => [...p, { r: 'a', t: 'Please try again or email admin@nhb-consultancy.com' }]); }
    setLoad(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000 }}>
      {open && (
        <div style={{ width: 340, background: C.white, border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', marginBottom: 12, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: C.navy, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chat" size={16} color={C.white} />
              </div>
              <div>
                <div style={{ color: C.white, fontSize: 13, fontFamily: 'Montserrat,sans-serif', fontWeight: 600 }}>NHB HR Advisor</div>
                <div style={{ color: C.gold, fontSize: 11 }}>Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <Icon name="x" size={18} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
          <div style={{ height: 320, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} className="chat-in" style={{ display: 'flex', justifyContent: m.r === 'u' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '84%', padding: '10px 14px', fontSize: 13.5, lineHeight: 1.6, background: m.r === 'u' ? C.navy : C.light, color: m.r === 'u' ? C.white : C.navy }}>{m.t}</div>
              </div>
            ))}
            {load && <div style={{ background: C.light, padding: '10px 14px', color: C.muted, fontSize: 18 }}>···</div>}
            <div ref={endRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
            <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: '10px 12px', border: `1px solid ${C.border}`, fontSize: 13, color: C.navy, outline: 'none', background: C.light }} />
            <button onClick={send} disabled={load} className="btn-dark" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
              <Icon name="send" size={14} color={C.white} />
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(p => !p)} className="pulse"
        style={{ width: 52, height: 52, background: C.gold, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(201,168,76,0.45)', marginLeft: 'auto' }}>
        {open ? <Icon name="x" size={20} color={C.white} /> : <Icon name="chat" size={20} color={C.white} />}
      </button>
    </div>
  );
};

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  const pages = { home: Home, about: About, hr: HRServices, tools: AITools, careers: Careers, contact: Contact };
  const Page = pages[page] || Home;
  return (
    <div style={{ minHeight: '100vh', background: C.white }}>
      <Styles />
      <Nav page={page} setPage={setPage} />
      <Page setPage={setPage} />
      <Footer setPage={setPage} />
      <FloatChat />
    </div>
  );
}
