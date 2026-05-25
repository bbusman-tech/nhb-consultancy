import { useState, useEffect, useRef } from "react";
import { submitContact, submitApplication, saveHealthCheck, fetchJobs } from "./lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
//  NHB CONSULTANCY — Production Build
//  Editorial-grade design system. No emoji. Premium SVG iconography.
// ════════════════════════════════════════════════════════════════════════════

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

const NHB_SYSTEM = `You are a senior HR advisor at NHB Consultancy — a boutique HR and recruitment firm in Dubai, UAE, founded by Nihel Hassen Busman (Chartered MCIPD, 15+ years across hospitality and corporate HR, formerly Director of HR at Radisson Hotel Group).

You speak with the authority and warmth of an experienced consultant. Never use phrases like "Certainly!" or "Great question!" — get straight to the point with substance.

NHB services span: HR Consultancy (UAE Labour Law, policy frameworks, organisational design, performance management); Recruitment & Executive Search across hospitality, corporate, events, data centres, energy and insurance; Outsourced HR for SMEs; and full Hospitality Management Services including pre-opening team builds.

For pricing or complex legal matters, recommend direct engagement: admin@nhb-consultancy.com`;

// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  // Refined palette — sophisticated, editorial
  bg:      '#FAFAF7',   // warm off-white
  white:   '#FFFFFF',
  ink:     '#0A1628',   // deep navy — primary
  ink2:    '#1F2937',   // body text
  muted:   '#6B7280',   // secondary text
  faded:   '#9CA3AF',   // tertiary
  border:  '#E5E2DA',   // warm border
  line:    '#EFEDE6',   // hairline
  gold:    '#A98B5C',   // refined warm gold
  goldD:   '#8A6F44',   // gold hover
  goldL:   '#D4BB8A',   // light gold
};

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,sans-serif;color:${T.ink2};background:${T.bg};overflow-x:hidden;font-feature-settings:'ss01','cv11'}
    h1,h2,h3,h4,h5{font-family:'Playfair Display',serif;font-weight:600;color:${T.ink};letter-spacing:-0.01em;line-height:1.1}
    a{text-decoration:none;color:inherit}
    input,textarea,select{font-family:'Inter',sans-serif}
    select{-webkit-appearance:none;appearance:none;cursor:pointer}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
    ::-webkit-scrollbar-thumb:hover{background:${T.gold}}
    ::selection{background:${T.gold};color:${T.white}}

    /* ── Typography utilities ───────────────────────────────── */
    .eyebrow{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${T.gold}}
    .display-xl{font-family:'Playfair Display',serif;font-size:clamp(56px,8vw,108px);font-weight:600;line-height:0.95;letter-spacing:-0.025em}
    .display-lg{font-family:'Playfair Display',serif;font-size:clamp(40px,5vw,64px);font-weight:600;line-height:1.05;letter-spacing:-0.02em}
    .display-md{font-family:'Playfair Display',serif;font-size:clamp(28px,3.5vw,44px);font-weight:600;line-height:1.15;letter-spacing:-0.015em}
    .display-sm{font-family:'Playfair Display',serif;font-size:clamp(22px,2.5vw,30px);font-weight:600;line-height:1.25;letter-spacing:-0.01em}
    .body-lg{font-size:18px;line-height:1.7;color:${T.ink2};font-weight:400}
    .body-md{font-size:16px;line-height:1.7;color:${T.muted};font-weight:400}
    .body-sm{font-size:14px;line-height:1.65;color:${T.muted};font-weight:400}
    .micro{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${T.muted}}

    /* ── Buttons ────────────────────────────────────────────── */
    .btn{display:inline-flex;align-items:center;gap:10px;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.04em;cursor:pointer;border:none;transition:all 0.35s cubic-bezier(0.4,0,0.2,1);padding:16px 30px;text-transform:none;white-space:nowrap}
    .btn-primary{background:${T.ink};color:${T.white}}
    .btn-primary:hover{background:${T.gold};transform:translateY(-1px)}
    .btn-gold{background:${T.gold};color:${T.white}}
    .btn-gold:hover{background:${T.goldD};transform:translateY(-1px)}
    .btn-ghost{background:transparent;color:${T.white};border:1px solid rgba(255,255,255,0.3)}
    .btn-ghost:hover{border-color:${T.white};background:rgba(255,255,255,0.05)}
    .btn-outline{background:transparent;color:${T.ink};border:1px solid ${T.border}}
    .btn-outline:hover{border-color:${T.ink};background:${T.ink};color:${T.white}}
    .btn:disabled{opacity:0.4;cursor:not-allowed}

    /* ── Layout utilities ───────────────────────────────────── */
    .container{max-width:1280px;margin:0 auto;padding:0 48px}
    .container-narrow{max-width:920px;margin:0 auto;padding:0 48px}
    .gold-rule{width:48px;height:1px;background:${T.gold};display:block}

    /* ── Cards & interactive ────────────────────────────────── */
    .card{background:${T.white};transition:all 0.4s cubic-bezier(0.4,0,0.2,1);position:relative}
    .card-hover:hover{transform:translateY(-4px);box-shadow:0 24px 60px -20px rgba(10,22,40,0.15)}
    .link-underline{position:relative;display:inline-flex;align-items:center;gap:10px;color:${T.gold};font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:gap 0.3s}
    .link-underline:hover{gap:14px}
    .link-underline::after{content:'';position:absolute;bottom:-4px;left:0;width:24px;height:1px;background:${T.gold};transition:width 0.3s}
    .link-underline:hover::after{width:100%}

    /* ── Navigation ─────────────────────────────────────────── */
    .nav-link{font-family:'Inter',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.02em;cursor:pointer;background:none;border:none;color:inherit;padding:8px 0;position:relative;transition:color 0.3s}
    .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:${T.gold};transition:width 0.35s ease}
    .nav-link:hover::after,.nav-link.active::after{width:100%}

    /* ── Forms ──────────────────────────────────────────────── */
    .field{margin-bottom:20px}
    .label{display:block;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${T.ink};margin-bottom:8px}
    .input{width:100%;padding:14px 16px;border:1px solid ${T.border};font-size:14px;color:${T.ink};outline:none;background:${T.white};transition:all 0.3s;font-weight:400}
    .input:focus{border-color:${T.ink};box-shadow:0 0 0 3px rgba(10,22,40,0.05)}
    .input::placeholder{color:${T.faded}}
    textarea.input{resize:vertical;min-height:120px;line-height:1.6}

    /* ── Animations ─────────────────────────────────────────── */
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
    @keyframes drawLine{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(169,139,92,0.4)}50%{box-shadow:0 0 0 12px rgba(169,139,92,0)}}
    .fade-up{animation:fadeUp 0.7s cubic-bezier(0.4,0,0.2,1) forwards}
    .fade-in{animation:fadeIn 0.5s ease forwards}
    .scale-in{animation:scaleIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards}
    .pulse-ring{animation:pulse 2.5s infinite}

    /* ── Section dividers ───────────────────────────────────── */
    .divider-fade{height:1px;background:linear-gradient(to right,transparent,${T.border},transparent)}

    /* ── Chat bubbles ───────────────────────────────────────── */
    .bubble{max-width:82%;padding:14px 18px;font-size:14px;line-height:1.65;animation:fadeUp 0.3s ease}
    .bubble-user{background:${T.ink};color:${T.white};border-radius:14px 14px 4px 14px}
    .bubble-assistant{background:${T.bg};color:${T.ink};border:1px solid ${T.line};border-radius:14px 14px 14px 4px}

    /* ── Service rows (editorial) ───────────────────────────── */
    .service-row{display:grid;grid-template-columns:80px 1fr 80px 1fr;gap:32px;align-items:center;padding:48px 0;border-bottom:1px solid ${T.line};transition:padding 0.3s}
    .service-row:hover{padding-left:8px}
    .service-row:hover .service-num{color:${T.gold}}
    .service-row:hover .service-arrow{transform:translateX(6px)}
    .service-num{font-family:'Playfair Display',serif;font-size:48px;font-weight:300;color:${T.faded};font-style:italic;transition:color 0.3s}
    .service-arrow{transition:transform 0.3s}

    /* ── Stat counters ──────────────────────────────────────── */
    .stat{padding:32px 0;border-top:1px solid ${T.border}}
    .stat-num{font-family:'Playfair Display',serif;font-size:clamp(48px,5vw,64px);font-weight:500;color:${T.ink};line-height:1;letter-spacing:-0.02em}
    .stat-suffix{font-family:'Playfair Display',serif;font-size:32px;color:${T.gold};font-weight:400;vertical-align:top;margin-left:2px}
    .stat-label{font-family:'Inter',sans-serif;font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:${T.muted};margin-top:14px}

    /* ── Industry cards ─────────────────────────────────────── */
    .industry-card{padding:36px 28px;background:${T.white};border:1px solid ${T.line};transition:all 0.4s;cursor:default;position:relative;overflow:hidden}
    .industry-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:2px;background:${T.gold};transform:scaleX(0);transform-origin:left;transition:transform 0.4s}
    .industry-card:hover{transform:translateY(-3px);border-color:${T.gold}}
    .industry-card:hover::before{transform:scaleX(1)}

    /* ── Page transitions ───────────────────────────────────── */
    .page-enter{animation:fadeUp 0.6s cubic-bezier(0.4,0,0.2,1)}

    /* ── Modal ──────────────────────────────────────────────── */
    .modal-overlay{position:fixed;inset:0;background:rgba(10,22,40,0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:300;padding:24px;animation:fadeIn 0.3s ease}
    .modal-box{background:${T.white};max-width:520px;width:100%;position:relative;animation:scaleIn 0.4s cubic-bezier(0.4,0,0.2,1)}

    /* ── Floating advisor button ────────────────────────────── */
    .float-btn{width:56px;height:56px;background:${T.ink};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 32px rgba(10,22,40,0.25);transition:all 0.3s}
    .float-btn:hover{background:${T.gold};transform:translateY(-2px) scale(1.05)}

    /* ── Responsive grid utility classes ────────────────────── */
    /* Use these via className instead of inline gridTemplateColumns so
       they can respond to viewport size. */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
    .grid-2-narrow { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .grid-2-asym { display: grid; grid-template-columns: 1fr 1.5fr; gap: 100px; }
    .grid-2-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-2-contact { display: grid; grid-template-columns: 1fr 1.6fr; gap: 80px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .grid-3-values { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: ${T.border}; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
    .grid-footer { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 64px; }

    /* ── Section padding utilities ──────────────────────────── */
    .pad-xl { padding: 88px 48px; }       /* hero-adjacent sections */
    .pad-lg { padding: 76px 48px; }       /* standard page sections */
    .pad-md { padding: 64px 48px; }       /* secondary sections */
    .pad-sm { padding: 48px 48px; }       /* tight sections */

    /* ── Mobile nav (hamburger) ─────────────────────────────── */
    .nav-desktop { display: flex; align-items: center; gap: 36px; }
    .nav-mobile-btn { display: none; background: none; border: none; cursor: pointer; padding: 8px; }
    .nav-mobile-btn span { display: block; width: 22px; height: 1.5px; background: currentColor; margin: 5px 0; transition: all 0.3s; }
    .nav-mobile-btn.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
    .nav-mobile-btn.open span:nth-child(2) { opacity: 0; }
    .nav-mobile-btn.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
    .nav-mobile-panel {
      position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
      background: ${T.white}; z-index: 99; padding: 32px 24px;
      display: flex; flex-direction: column; gap: 4px;
      transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
      overflow-y: auto;
    }
    .nav-mobile-panel.open { transform: translateX(0); }
    .nav-mobile-panel button.nav-link-mobile {
      font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 500;
      color: ${T.ink}; background: none; border: none; cursor: pointer;
      text-align: left; padding: 16px 0; border-bottom: 1px solid ${T.line};
      transition: color 0.3s;
    }
    .nav-mobile-panel button.nav-link-mobile.active { color: ${T.gold}; }
    .nav-mobile-panel button.nav-link-mobile:hover { color: ${T.gold}; }
    .nav-mobile-cta {
      margin-top: 28px; padding: 16px 24px; background: ${T.gold}; color: ${T.white};
      border: none; cursor: pointer; font-size: 13px; font-weight: 500;
      letter-spacing: 0.04em; display: inline-flex; align-items: center; gap: 10px;
    }

    /* ── Hero: responsive height ────────────────────────────── */
    .hero-section { position: relative; height: 100vh; min-height: 720px; display: flex; align-items: center; overflow: hidden; }

    /* ── Service tiles (Home preview, text-based) ──────────── */
    .svc-tile-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: ${T.line};
    }
    .svc-tile {
      position: relative;
      background: ${T.white};
      border: none;
      padding: 36px 32px 32px;
      text-align: left;
      cursor: pointer;
      transition: background 0.3s;
    }
    .svc-tile:hover { background: ${T.bg}; }
    .svc-tile-num {
      display: block;
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 16px;
      color: ${T.gold};
      margin-bottom: 16px;
    }
    .svc-tile-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 600;
      color: ${T.ink};
      line-height: 1.2;
      margin-bottom: 10px;
    }
    .svc-tile-tag {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 14px;
      color: ${T.muted};
      line-height: 1.45;
    }
    .svc-tile-arrow {
      position: absolute;
      top: 36px;
      right: 28px;
      opacity: 0.5;
      transition: opacity 0.3s, transform 0.3s;
    }
    .svc-tile:hover .svc-tile-arrow { opacity: 1; transform: translateX(4px); }

    /* ── Brand cards (kept for Services page) ────────────────── */
    .brand-card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .brand-card {
      display: block;
      overflow: hidden;
      transition: transform 0.45s cubic-bezier(0.4,0,0.2,1), box-shadow 0.45s;
    }
    .brand-card img {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
      transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
    }
    .brand-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 48px -16px rgba(10,22,40,0.35);
    }
    .brand-card:hover img { transform: scale(1.03); }

    /* ── Service detail row (Services page) ─────────────────── */
    .service-detail {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 64px;
      align-items: center;
      padding: 72px 0;
      border-bottom: 1px solid ${T.line};
    }
    .service-detail:last-child { border-bottom: none; }
    .service-detail.reverse { direction: rtl; }
    .service-detail.reverse > * { direction: ltr; }
    .service-detail img {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
    }

    /* ── Careers job row: 3-col on desktop, stacked on phone ─ */
    .job-row { padding: 32px 36px; display: grid; grid-template-columns: 1fr auto auto; gap: 32px; align-items: center; transition: background 0.3s; }

    /* ── Tablet (≤960px) ────────────────────────────────────── */
    @media (max-width: 960px) {
      .container, .container-narrow { padding: 0 32px; }
      .pad-xl { padding: 72px 32px; }
      .pad-lg { padding: 60px 32px; }
      .pad-md { padding: 52px 32px; }
      .pad-sm { padding: 40px 32px; }
      .grid-2-asym { grid-template-columns: 1fr; gap: 48px; }
      .grid-2-contact { grid-template-columns: 1fr; gap: 56px; }
      .grid-footer { grid-template-columns: 1fr 1fr; gap: 48px; }
      .grid-3 { grid-template-columns: repeat(2, 1fr); }
      .grid-3-values { grid-template-columns: repeat(2, 1fr); }
      .grid-4 { grid-template-columns: repeat(2, 1fr); gap: 24px; }
      .service-row { grid-template-columns: 60px 1fr; gap: 20px; padding: 32px 0; }
      .service-row > div:nth-child(3), .service-row > div:nth-child(4) { display: none; }
      .brand-card-grid { grid-template-columns: repeat(2, 1fr); gap: 18px; }
      .svc-tile-grid { grid-template-columns: repeat(2, 1fr); }
      .service-detail { grid-template-columns: 1fr; gap: 32px; padding: 56px 0; }
      .service-detail.reverse { direction: ltr; }
      .service-detail img { max-height: 420px; }
    }

    /* ── Mobile (≤720px) ────────────────────────────────────── */
    @media (max-width: 720px) {
      .container, .container-narrow { padding: 0 20px; }
      .pad-xl { padding: 44px 20px; }
      .pad-lg { padding: 40px 20px; }
      .pad-md { padding: 36px 20px; }
      .pad-sm { padding: 28px 20px; }
      .grid-2 { grid-template-columns: 1fr; gap: 32px; }
      .grid-2-narrow { grid-template-columns: 1fr; gap: 16px; }
      .grid-2-form { grid-template-columns: 1fr; gap: 0; }
      .grid-3, .grid-3-values { grid-template-columns: 1fr; gap: 1px; }
      .grid-4 { grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .grid-footer { grid-template-columns: 1fr; gap: 40px; }

      /* Nav: hide desktop links, show hamburger */
      .nav-desktop { display: none; }
      .nav-mobile-btn { display: block; }
      .nav-bar { height: 64px !important; padding: 0 !important; }
      .nav-outer { padding: 0 20px !important; }

      /* Hero: shorter on phones */
      .hero-section { min-height: 560px; height: auto; padding: 120px 0 80px; }

      /* Stats: tighter on phone */
      .stat { padding: 20px 0; }
      .stats-row { margin-top: 36px !important; }

      /* Careers job row: stack title + salary + button on phone */
      .job-row { grid-template-columns: 1fr; gap: 16px; padding: 24px 20px; }

      /* Floating actions: tighter to corner on phone */
      .fab-wrap { bottom: 18px !important; right: 18px !important; }

      /* Brand cards: single column on phone */
      .brand-card-grid { grid-template-columns: 1fr; gap: 16px; }
      .svc-tile-grid { grid-template-columns: 1fr; }
      .svc-tile { padding: 24px 20px 22px; }
      .svc-tile-arrow { top: 24px; right: 20px; }
      .service-detail { padding: 32px 0; gap: 20px; }
      .service-detail img { max-height: 320px; object-position: center; }
      /* Polish: brand card max-width on phone so it doesn't dominate */
      .service-detail > div:first-child img {
        max-width: 300px !important;
        margin: 0 auto !important;
      }
      .principle-card { padding: 24px 20px !important; }

      /* Reduce extreme display sizes */
      .display-xl { font-size: clamp(36px, 10vw, 64px) !important; }
      .display-lg { font-size: clamp(26px, 7vw, 40px) !important; }
      .display-md { font-size: clamp(22px, 5.5vw, 32px) !important; }
    }

    /* ── Small phone (≤420px) ──────────────────────────────── */
    @media (max-width: 420px) {
      .grid-4 { grid-template-columns: 1fr 1fr; gap: 12px; }
      .container, .container-narrow { padding: 0 16px; }
    }
  `}</style>
);

// ── BRAND LOGO ───────────────────────────────────────────────────────────
// Uses the real NHB hexagonal mark (cropped square JPEG with navy background
// baked in). On dark sections the navy blends seamlessly; on light sections
// the navy mark sits as a deliberate "stamp" — intentional, on-brand.
// File location: /public/NHB_mark.jpg (served at https://.../NHB_mark.jpg)
const Logo = ({ inverted = false, size = 'md' }) => {
  const sizes = {
    sm: { mark: 38, nhb: 15, sub: 8,  gap: 10 },
    md: { mark: 52, nhb: 19, sub: 9,  gap: 14 },
    lg: { mark: 72, nhb: 30, sub: 12, gap: 18 },
  };
  const s = sizes[size];
  const fg = inverted ? T.white : T.ink;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap, transition: 'all 0.4s' }}>
      <img
        src="/NHB_mark.jpg"
        alt="NHB Consultancy"
        width={s.mark}
        height={s.mark}
        style={{
          display: 'block',
          width: s.mark, height: s.mark,
          objectFit: 'cover',
          objectPosition: 'center',
          flexShrink: 0,
          /* Subtle gold hairline ties the mark to the brand on light backgrounds */
          boxShadow: inverted ? 'none' : `0 0 0 1px rgba(169,139,92,0.25)`,
        }}
      />
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: s.nhb,
          fontWeight: 600,
          color: fg,
          letterSpacing: '0.02em',
        }}>NHB</div>
        <div style={{
          fontFamily: "'Inter',sans-serif",
          fontSize: s.sub,
          fontWeight: 600,
          color: T.gold,
          letterSpacing: '0.28em',
          marginTop: 6,
          textTransform: 'uppercase',
        }}>Consultancy</div>
      </div>
    </div>
  );
};

// ── ICONS — Custom geometric SVG, 1.5px stroke, refined ──────────────────────
const Icon = ({ name, size = 24, color = T.ink, strokeWidth = 1.5 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round'
  };
  const icons = {
    // Service icons — minimal, geometric
    strategy: <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 3 L12 12 L18 18" /></svg>,
    search: <svg {...props}><circle cx="11" cy="11" r="6.5" /><path d="M16 16 L21 21" /></svg>,
    network: <svg {...props}><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7 L12 11 M12 11 L6 17 M12 11 L18 17" /></svg>,
    building: <svg {...props}><rect x="4" y="6" width="16" height="15" /><line x1="4" y1="11" x2="20" y2="11" /><line x1="9" y1="6" x2="9" y2="21" /><line x1="15" y1="6" x2="15" y2="21" /><path d="M9 3 L15 3 L15 6 L9 6 Z" /></svg>,
    // Industry icons
    hotel: <svg {...props}><path d="M3 21 L21 21 M3 21 L3 8 L21 8 L21 21 M7 12 L9 12 M7 16 L9 16 M11 12 L13 12 M11 16 L13 16 M15 12 L17 12 M15 16 L17 16 M10 8 L10 3 L14 3 L14 8" /></svg>,
    chef: <svg {...props}><path d="M12 3 C9 3 7 5 7 8 C5 8 4 9 4 11 C4 13 5 14 7 14 L17 14 C19 14 20 13 20 11 C20 9 19 8 17 8 C17 5 15 3 12 3 Z M7 14 L7 20 L17 20 L17 14" /></svg>,
    event: <svg {...props}><rect x="3" y="5" width="18" height="16" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /><circle cx="12" cy="15" r="1" fill={color} /></svg>,
    data: <svg {...props}><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6 V12 C4 13.7 7.6 15 12 15 C16.4 15 20 13.7 20 12 V6 M4 12 V18 C4 19.7 7.6 21 12 21 C16.4 21 20 19.7 20 18 V12" /></svg>,
    energy: <svg {...props}><path d="M13 2 L5 13 L11 13 L9 22 L17 11 L11 11 L13 2 Z" /></svg>,
    shield: <svg {...props}><path d="M12 3 L4 6 V12 C4 16 7 19 12 21 C17 19 20 16 20 12 V6 L12 3 Z" /></svg>,
    // UI icons
    send: <svg {...props}><path d="M3 12 L21 4 L17 21 L11 13 L3 12 Z" /></svg>,
    chat: <svg {...props}><path d="M21 11 C21 16 17 19 12 19 C10.7 19 9.4 18.8 8.3 18.4 L3 20 L4.6 15 C3.6 13.8 3 12.5 3 11 C3 6.6 7 3 12 3 C17 3 21 6.6 21 11 Z" /></svg>,
    x: <svg {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    check: <svg {...props} strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
    arrow: <svg {...props}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>,
    arrowDown: <svg {...props}><line x1="12" y1="5" x2="12" y2="19" /><polyline points="6 13 12 19 18 13" /></svg>,
    mail: <svg {...props}><rect x="3" y="5" width="18" height="14" /><polyline points="3,7 12,13 21,7" /></svg>,
    phone: <svg {...props}><path d="M5 4 L9 4 L11 9 L8.5 10.5 C9.5 13 11 14.5 13.5 15.5 L15 13 L20 15 L20 19 C20 19.5 19.5 20 19 20 C11 20 4 13 4 5 C4 4.5 4.5 4 5 4 Z" /></svg>,
    pin: <svg {...props}><path d="M12 21 C12 21 19 14 19 10 C19 6 16 3 12 3 C8 3 5 6 5 10 C5 14 12 21 12 21 Z" /><circle cx="12" cy="10" r="2.5" /></svg>,
    whatsapp: <svg {...props}><path d="M20 12 C20 16.4 16.4 20 12 20 C10.7 20 9.4 19.7 8.3 19.2 L4 20 L4.8 15.7 C4.3 14.6 4 13.3 4 12 C4 7.6 7.6 4 12 4 C16.4 4 20 7.6 20 12 Z M8.5 9 C8.5 9 8.5 10 9 11 C9.5 12 10.5 13.5 12 14.5 C13 15 14 15.5 15 15 L15 13.5 L13.5 13 C13.5 13 13 13.5 12.5 13 C12 12.5 11 11.5 11 11 C11 10.5 11.5 10 11.5 10 L11 8.5 L9.5 8.5 C9 8.5 8.5 9 8.5 9 Z" /></svg>,
    linkedin: <svg {...props}><rect x="3" y="3" width="18" height="18" /><line x1="7" y1="10" x2="7" y2="17" /><circle cx="7" cy="7" r="0.5" fill={color} /><path d="M11 17 L11 10 M11 13 C11 11 12 10 13.5 10 C15 10 17 11 17 13 L17 17" /></svg>,
    instagram: <svg {...props}><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill={color} /></svg>,
    quote: <svg {...props} fill={color} stroke="none"><path d="M7 7 L11 7 L11 11 L9 11 L9 13 L7 13 L7 7 Z M13 7 L17 7 L17 11 L15 11 L15 13 L13 13 L13 7 Z" /></svg>,
    award: <svg {...props}><circle cx="12" cy="9" r="6" /><polyline points="9 14 8 22 12 19 16 22 15 14" /></svg>,
    plus: <svg {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  };
  return icons[name] || null;
};

// ════════════════════════════════════════════════════════════════════════════
//  NAVIGATION — desktop horizontal links + mobile hamburger panel
// ════════════════════════════════════════════════════════════════════════════
const Nav = ({ page, setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close the mobile menu whenever the page changes
  useEffect(() => { setMenuOpen(false); }, [page]);

  // Prevent body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const links = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'industries', label: 'Industries' },
    { id: 'tools', label: 'Tools' },
    { id: 'careers', label: 'Careers' },
  ];

  const onHero = page === 'home' && !scrolled;
  // When the mobile menu is open we always want dark text on white panel
  const textC = menuOpen ? T.ink : (onHero ? T.white : T.ink);

  return (
    <>
    <nav
      className="nav-outer"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
        background: (scrolled || menuOpen) ? 'rgba(250,250,247,0.95)' : 'transparent',
        backdropFilter: (scrolled && !menuOpen) ? 'blur(20px)' : 'none',
        borderBottom: (scrolled || menuOpen) ? `1px solid ${T.line}` : '1px solid transparent',
        padding: '0 48px',
      }}
    >
      <div
        className="nav-bar"
        style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 96 }}
      >
        <div onClick={() => setPage('home')} style={{ cursor: 'pointer' }}>
          <Logo inverted={onHero && !menuOpen} size="lg" />
        </div>

        {/* Desktop links */}
        <div className="nav-desktop">
          {links.map(l => (
            <button key={l.id} onClick={() => setPage(l.id)} className={`nav-link ${page === l.id ? 'active' : ''}`}
              style={{ color: page === l.id ? T.gold : textC }}>
              {l.label}
            </button>
          ))}
          <button onClick={() => setPage('contact')} className="btn btn-gold" style={{ padding: '12px 22px', fontSize: 12 }}>
            Book Consultation
          </button>
        </div>

        {/* Mobile hamburger button */}
        <button
          className={`nav-mobile-btn ${menuOpen ? 'open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
          style={{ color: textC }}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>

    {/* Mobile slide-in menu panel — outside <nav> to avoid backdrop-filter containing-block issue */}
    <div className={`nav-mobile-panel ${menuOpen ? 'open' : ''}`}>
      {links.map(l => (
        <button
          key={l.id}
          onClick={() => setPage(l.id)}
          className={`nav-link-mobile ${page === l.id ? 'active' : ''}`}
        >
          {l.label}
        </button>
      ))}
      <button onClick={() => setPage('contact')} className="nav-mobile-cta">
        Book Consultation
      </button>
    </div>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  HOME
// ════════════════════════════════════════════════════════════════════════════
const Home = ({ setPage }) => {
  const services = [
    { title: 'Executive Search',           tag: 'C-suite · Board-level' },
    { title: 'Talent Acquisition',         tag: 'Senior & mid-senior recruitment' },
    { title: 'HR Outsourcing',             tag: 'Operations · Compliance' },
    { title: 'Organisational Development', tag: 'Transformation · Succession' },
    { title: 'Hospitality HR Advisory',    tag: 'Pre-opening · Workforce planning' },
    { title: 'HR Consultancy',             tag: 'Strategy · Engagement · Culture' },
  ];

  const stats = [
    { num: '15', suffix: '+', label: 'Years HR Leadership' },
    { num: '8,200', suffix: '+', label: 'Professional Network' },
    { num: '6', suffix: '', label: 'Industries Served' },
    { num: '100', suffix: '%', label: 'Boutique Engagement' },
  ];

  return (
    <div className="page-enter">

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="hero-section" style={{ background: T.ink, position: 'relative' }}>
        {/* Subtle radial vignette for depth — no image, no text behind text */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(169,139,92,0.10) 0%, rgba(10,22,40,0) 55%), radial-gradient(ellipse at 80% 90%, rgba(10,22,40,0.6) 0%, rgba(10,22,40,0) 60%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
          <div style={{ maxWidth: 760 }}>
            <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <span className="gold-rule" />
              <span className="eyebrow" style={{ color: T.goldL }}>Boutique HR Advisory · Dubai</span>
            </div>
            <h1 className="display-xl fade-up" style={{ color: T.white, marginBottom: 32, animationDelay: '0.1s', animationFillMode: 'both' }}>
              Plan.<br />
              <span style={{ color: T.goldL }}>Launch.</span><br />
              Grow.
            </h1>
            <p className="body-lg fade-up" style={{ color: 'rgba(255,255,255,0.78)', maxWidth: 540, marginBottom: 48, animationDelay: '0.25s', animationFillMode: 'both' }}>
              NHB Consultancy partners with ambitious companies across the GCC — combining deep regional HR expertise with the precision of executive search.
            </p>
            <div className="fade-up" style={{ display: 'flex', gap: 16, animationDelay: '0.4s', animationFillMode: 'both', flexWrap: 'wrap' }}>
              <button onClick={() => setPage('contact')} className="btn btn-gold">
                Book a Consultation <Icon name="arrow" size={16} color={T.white} />
              </button>
              <button onClick={() => setPage('services')} className="btn btn-ghost">Explore Services</button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 2 }}>
          <span className="micro" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Scroll</span>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.3)' }} />
        </div>
      </section>

      {/* ═══ CREDENTIALS STRIP ══════════════════════════════════════════════ */}
      <section style={{ background: T.ink, padding: '40px 24px', borderTop: `1px solid rgba(255,255,255,0.08)` }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap' }}>
          {[
            { label: 'Chartered Expertise' },
            { label: 'Boutique by Design' },
            { label: 'UAE Labour Law Specialists' },
            { label: 'GCC Coverage' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Icon name="check" size={16} color={T.gold} strokeWidth={2} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ INTRO MANIFESTO ════════════════════════════════════════════════ */}
      <section className="pad-xl" style={{ background: T.bg }}>
        <div className="container">
          <div className="grid-2-asym" style={{ alignItems: 'start' }}>
            <div>
              <span className="gold-rule" style={{ marginBottom: 24 }} />
              <p className="eyebrow" style={{ marginBottom: 24 }}>The NHB Approach</p>
              <h2 className="display-lg" style={{ marginBottom: 0 }}>
                Strategic HR.<br />
                Designed for growth.
              </h2>
            </div>
            <div>
              <p className="body-lg" style={{ marginBottom: 28, fontSize: 20, color: T.ink2, lineHeight: 1.6 }}>
                Founded by <strong style={{ color: T.ink, fontWeight: 600 }}>Nihel Hassen Busman, Chartered MCIPD</strong> — a senior HR leader with 15+ years across multinational organisations — NHB Consultancy was built to give growing companies access to the calibre of HR support previously reserved for global enterprises.
              </p>
              <p className="body-md" style={{ marginBottom: 40 }}>
                We work in true partnership with our clients — understanding their culture, challenges and growth plans, then delivering solutions that fit. Whether you are building a team from scratch, expanding into the UAE, or strengthening your HR foundations, we operate as an embedded extension of your leadership.
              </p>
              <button onClick={() => setPage('about')} className="link-underline">
                Read our story <Icon name="arrow" size={16} color={T.gold} />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid-4 stats-row" style={{ marginTop: 56 }}>
            {stats.map((s, i) => (
              <div key={i} className="stat">
                <div>
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-suffix">{s.suffix}</span>
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══════════════════════════════════════════════════════ */}
      <section className="pad-xl" style={{ background: T.white, borderTop: `1px solid ${T.line}` }}>
        <div className="container">
          <div className="grid-2" style={{ gap: 56, marginBottom: 48, alignItems: 'end' }}>
            <div>
              <span className="gold-rule" style={{ marginBottom: 24 }} />
              <p className="eyebrow" style={{ marginBottom: 24 }}>Capabilities</p>
              <h2 className="display-lg">Six practices.<br />One advisory partner.</h2>
            </div>
            <p className="body-md" style={{ maxWidth: 440 }}>
              Our integrated model serves SME and enterprise clients across the UAE, MENA, Europe and APAC — delivering strategic HR, executive search and operational excellence under one roof.
            </p>
          </div>

          <div className="svc-tile-grid">
            {services.map((s, i) => (
              <button
                key={i}
                onClick={() => setPage('services')}
                className="svc-tile"
                aria-label={`Learn more about ${s.title}`}
              >
                <span className="svc-tile-num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="svc-tile-title">{s.title}</h3>
                <p className="svc-tile-tag">{s.tag}</p>
                <span className="svc-tile-arrow"><Icon name="arrow" size={16} color={T.gold} /></span>
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button onClick={() => setPage('services')} className="link-underline">
              Explore all services <Icon name="arrow" size={16} color={T.gold} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL — Featured quote ═══════════════════════════════════ */}
      <section className="pad-xl" style={{ background: T.ink, position: 'relative' }}>
        <div className="container-narrow" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <Icon name="quote" size={48} color={T.gold} />
          </div>
          <blockquote style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,3vw,36px)', lineHeight: 1.4, color: T.white, fontWeight: 400, marginBottom: 48, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
            "What sets Nihel apart is her ability to align HR strategy with business goals while fostering a culture of growth, collaboration and accountability. A strong example of leadership, adaptability and continuous professional growth."
          </blockquote>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 32, height: 1, background: T.gold }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: T.white, fontSize: 14, fontWeight: 500 }}>Arbab Ali</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: '0.05em', marginTop: 2 }}>Inspiring Women Leadership · Spotlight Feature</div>
            </div>
            <div style={{ width: 32, height: 1, background: T.gold }} />
          </div>
        </div>
      </section>

      {/* ═══ INDUSTRIES PREVIEW ═════════════════════════════════════════════ */}
      <section className="pad-xl" style={{ background: T.bg }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <span className="gold-rule" style={{ margin: '0 auto 24px' }} />
            <p className="eyebrow" style={{ marginBottom: 24 }}>Sectors We Serve</p>
            <h2 className="display-lg" style={{ marginBottom: 24 }}>Industry depth, not just reach.</h2>
            <p className="body-md" style={{ maxWidth: 540, margin: '0 auto' }}>
              From corporate functions to specialist sectors — we understand the specific talent dynamics of each industry we operate in.
            </p>
          </div>

          <div className="grid-3">
            {[
              { icon: 'shield', name: 'Corporate & Professional', desc: 'C-suite, executive support and corporate functions' },
              { icon: 'data', name: 'Data Centres & Technology', desc: 'Technical, project and executive mandates' },
              { icon: 'energy', name: 'Energy & Sustainability', desc: 'Engineering, project and operations talent' },
              { icon: 'event', name: 'Events & Conferences', desc: 'Production, programming and event leadership' },
              { icon: 'hotel', name: 'Hospitality & Hotels', desc: 'Pre-opening, F&B and operations leadership' },
              { icon: 'chef', name: 'F&B Operations', desc: 'Restaurant groups, catering and culinary talent' },
            ].map((ind, i) => (
              <div key={i} className="industry-card">
                <Icon name={ind.icon} size={32} color={T.gold} strokeWidth={1.25} />
                <h4 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: T.ink, margin: '20px 0 8px' }}>{ind.name}</h4>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>{ind.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <button onClick={() => setPage('industries')} className="link-underline">
              See all industries <Icon name="arrow" size={16} color={T.gold} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══ AI ADVISORY TOOLS ══════════════════════════════════════════════ */}
      <section className="pad-xl" style={{ background: T.white, borderTop: `1px solid ${T.line}` }}>
        <div className="container">
          <div className="grid-2" style={{ gap: 100, alignItems: 'start' }}>
            <div>
              <span className="gold-rule" style={{ marginBottom: 24 }} />
              <p className="eyebrow" style={{ marginBottom: 24 }}>Intelligent Advisory</p>
              <h2 className="display-lg" style={{ marginBottom: 28 }}>Tools, calibrated for the GCC market.</h2>
              <p className="body-md" style={{ marginBottom: 36 }}>
                Three AI-powered tools developed in-house — informed by Chartered HR expertise, calibrated against current UAE market data, and available to use without obligation.
              </p>
              <button onClick={() => setPage('tools')} className="btn btn-primary">
                Explore Tools <Icon name="arrow" size={16} color={T.white} />
              </button>
            </div>
            <div>
              {[
                { num: '01', title: 'HR Maturity Assessment', desc: 'Ten diagnostic questions. AI-generated audit report with prioritised actions.' },
                { num: '02', title: 'Compensation Benchmarker', desc: 'Salary intelligence across 12+ roles and three experience tiers in the UAE market.' },
                { num: '03', title: 'Conversational HR Advisor', desc: 'Direct access to GCC labour law guidance and best-practice frameworks.' },
              ].map((t, i) => (
                <div key={i} onClick={() => setPage('tools')} style={{ padding: '28px 0', borderBottom: i < 2 ? `1px solid ${T.line}` : 'none', cursor: 'pointer', display: 'grid', gridTemplateColumns: '60px 1fr 30px', gap: 20, alignItems: 'start', transition: 'all 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.paddingLeft = '8px'}
                  onMouseOut={e => e.currentTarget.style.paddingLeft = '0'}>
                  <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, color: T.gold, fontStyle: 'italic' }}>{t.num}</span>
                  <div>
                    <h4 style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 6 }}>{t.title}</h4>
                    <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>{t.desc}</p>
                  </div>
                  <Icon name="arrow" size={16} color={T.muted} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ══════════════════════════════════════════════════════ */}
      <section className="pad-xl" style={{ position: 'relative', background: T.ink, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 500, border: `1px solid rgba(169,139,92,0.1)`, borderRadius: '50%', transform: 'translate(40%, -40%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 300, height: 300, border: `1px solid rgba(169,139,92,0.08)`, borderRadius: '50%', transform: 'translate(-30%, 30%)' }} />
        <div className="container-narrow" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <span className="gold-rule" style={{ margin: '0 auto 32px' }} />
          <h2 className="display-lg" style={{ color: T.white, marginBottom: 28 }}>
            Let's discuss your<br />people strategy.
          </h2>
          <p className="body-lg" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 460, margin: '0 auto 48px' }}>
            A complimentary 30-minute consultation — no obligation, full discretion.
          </p>
          <button onClick={() => setPage('contact')} className="btn btn-gold">
            Schedule Consultation <Icon name="arrow" size={16} color={T.white} />
          </button>
        </div>
      </section>

    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  ABOUT
// ════════════════════════════════════════════════════════════════════════════
const About = ({ setPage }) => (
  <div className="page-enter" style={{ paddingTop: 96 }}>
    <section className="pad-lg" style={{ background: T.ink, paddingBottom: 56 }}>
      <div className="container">
        <span className="gold-rule" style={{ marginBottom: 24 }} />
        <p className="eyebrow" style={{ marginBottom: 24 }}>About NHB Consultancy</p>
        <h1 className="display-lg" style={{ color: T.white, maxWidth: 800 }}>
          Strategic HR advisory.<br />
          <span style={{ color: T.goldL }}>People-led, business-focused.</span>
        </h1>
      </div>
    </section>

    <section className="pad-lg" style={{ background: T.white }}>
      <div className="container">
        <div className="grid-2" style={{ gap: 100, alignItems: 'start', marginBottom: 56 }}>
          <div>
            <span className="gold-rule" style={{ marginBottom: 24 }} />
            <p className="eyebrow" style={{ marginBottom: 24 }}>Our Story</p>
            <h2 className="display-md" style={{ marginBottom: 32 }}>
              Boutique by design.<br />
              Global by capability.
            </h2>
            <p className="body-md" style={{ marginBottom: 24 }}>
              NHB Consultancy was founded on a clear premise: the calibre of HR support traditionally reserved for global enterprises should be accessible to every ambitious business.
            </p>
            <p className="body-md" style={{ marginBottom: 24 }}>
              We were built by senior HR practitioners — leaders who have shaped people strategy through scale-ups, transformations, openings and tough conversations. That operational lens means our advisory is grounded, practical and commercially aware.
            </p>
            <p className="body-md">
              We serve SME and enterprise clients across the GCC with high-impact HR strategies, executive search and outsourced services — operating as a true partner, not a transactional vendor.
            </p>
          </div>
          <div>
            <img
              src="/brand/card-founder.jpg"
              alt="Nihel Hassen Busman, Co-Founder and Principal Consultant of NHB Consultancy"
              loading="lazy"
              style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', boxShadow: '0 24px 60px -20px rgba(10,22,40,0.25)' }}
            />
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${T.line}` }}>
              <p className="body-sm" style={{ marginBottom: 20, color: T.ink2, fontSize: 15, lineHeight: 1.75 }}>
                Most recently, Nihel held <strong style={{ color: T.ink, fontWeight: 600 }}>Director of Human Resources</strong> roles within global hotel groups. Her career spans HR strategy, executive search, pre-opening team builds and large-scale workforce transformation across diverse sectors.
              </p>
              <p className="body-sm" style={{ marginBottom: 24, color: T.ink2, fontSize: 15, lineHeight: 1.75 }}>
                She has been featured in <em>Inspiring Women Leadership</em>'s spotlight on senior HR practitioners shaping the regional industry.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {['Chartered MCIPD', 'UAE Labour Law', 'Executive Search', 'Pre-Opening', 'Hospitality', 'HR Strategy'].map((t, i) => (
                  <span key={i} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, color: T.ink, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', background: T.white }}>{t}</span>
                ))}
              </div>
              <a href="https://www.linkedin.com/in/nihelhassenbusman/" target="_blank" rel="noreferrer" className="link-underline">
                View LinkedIn Profile <Icon name="arrow" size={14} color={T.gold} />
              </a>
            </div>
          </div>
        </div>

        {/* Foundation — featured credentials card */}
        <div style={{ marginBottom: 56, textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>The Foundation</p>
          <h2 className="display-md" style={{ marginBottom: 28 }}>Credentials that earn trust.</h2>
          <img
            src="/brand/card-foundation.jpg"
            alt="The Foundation: CIPD Chartered Member · Meydan Free Zone Licensed · 15+ Years of International HR Leadership"
            loading="lazy"
            style={{ width: '100%', maxWidth: 560, aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', margin: '0 auto', boxShadow: '0 24px 60px -20px rgba(10,22,40,0.25)' }}
          />
        </div>

        {/* Values — refined typography only */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p className="eyebrow" style={{ marginBottom: 16 }}>What We Stand For</p>
            <h2 className="display-md">Our principles.</h2>
          </div>
          <div className="grid-3-values">
            {[
              { v: 'Integrity', d: 'Transparent counsel, even when it isn\'t what you want to hear.' },
              { v: 'Excellence', d: 'Uncompromising standards across every engagement and placement.' },
              { v: 'Agility', d: 'Responsive, adaptive solutions for fast-moving businesses.' },
              { v: 'Partnership', d: 'Embedded with your team — not a transactional vendor.' },
              { v: 'Confidentiality', d: 'Discretion in every client and candidate matter.' },
              { v: 'Impact', d: 'Measured outcomes that move the commercial dial.' },
            ].map((val, i) => (
              <div key={i} className="principle-card" style={{ background: T.white, padding: '32px 28px' }}>
                <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 14, color: T.gold, fontStyle: 'italic' }}>{String(i + 1).padStart(2, '0')}</span>
                <h4 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 600, color: T.ink, margin: '12px 0 10px' }}>{val.v}</h4>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.65 }}>{val.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="pad-md" style={{ background: T.ink, textAlign: 'center' }}>
      <div className="container-narrow">
        <h2 className="display-md" style={{ color: T.white, marginBottom: 28 }}>Work with us.</h2>
        <p className="body-lg" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
          A complimentary consultation to explore where we can add value.
        </p>
        <button onClick={() => setPage('contact')} className="btn btn-gold">
          Get in Touch <Icon name="arrow" size={16} color={T.white} />
        </button>
      </div>
    </section>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
//  SERVICES
// ════════════════════════════════════════════════════════════════════════════
const Services = ({ setPage }) => {
  const services = [
    { image: '/brand/card-executive-search.jpg',
      title: 'Executive Search',
      tag: 'Confidential · Senior-led · International',
      desc: 'Retained search for C-suite, board-level and senior leadership appointments across the UAE, MENA, Europe and APAC.',
      items: ['CEO and CXO mandates', 'Board-level appointments', 'Senior leadership search', 'Confidential succession', 'Cross-border sourcing', 'Discreet candidate assessment'] },
    { image: '/brand/card-talent-acquisition.jpg',
      title: 'Talent Acquisition',
      tag: 'Strategic · Discreet · Results-driven',
      desc: 'End-to-end recruitment for senior and mid-senior roles across hospitality and corporate.',
      items: ['Senior & mid-senior recruitment', 'Headhunting & talent mapping', 'Candidate assessment & screening', 'Hospitality and corporate roles', 'Pre-opening team builds', 'Onboarding & integration support'] },
    { image: '/brand/card-hr-outsourcing.jpg',
      title: 'HR Outsourcing',
      tag: 'For growing businesses · Senior-led',
      desc: 'Outsourced HR operations, policy frameworks and UAE labour law compliance for businesses without an internal HR function.',
      items: ['Outsourced HR operations', 'Policy frameworks & handbooks', 'UAE labour law compliance', 'Payroll & PRO support', 'Employee documentation', 'On-demand senior HR expertise'] },
    { image: '/brand/card-organisational-development.jpg',
      title: 'Organisational Development',
      tag: 'Aligned with business strategy',
      desc: 'HR transformation, workforce planning, succession and leadership development — designed in service of your commercial goals.',
      items: ['HR transformation programmes', 'Workforce & succession planning', 'Leadership development', 'Organisational design', 'Performance management systems', 'Change management'] },
    { image: '/brand/card-hospitality-hr-advisory.jpg',
      title: 'Hospitality HR Advisory',
      tag: 'International · Operations expertise',
      desc: 'Pre-opening HR mobilisation and workforce planning for hotels and hospitality groups, drawn from senior in-house hospitality leadership.',
      items: ['Pre-opening HR mobilisation', 'Hotel & hospitality workforce planning', 'FOH and BOH staffing', 'SOP & service standard development', 'Hospitality executive search', 'Training programme design'] },
    { image: '/brand/card-hr-consultancy.jpg',
      title: 'HR Consultancy',
      tag: 'For senior teams · Tangible outcomes',
      desc: 'Strategic HR advisory on engagement, retention, culture and leadership effectiveness — tailored for senior teams seeking tangible outcomes.',
      items: ['Engagement & retention strategy', 'Culture diagnostics', 'Leadership effectiveness', 'Employee experience design', 'HR analytics & reporting', 'Compensation & benefits review'] },
  ];

  return (
    <div className="page-enter" style={{ paddingTop: 96 }}>
      <section className="pad-lg" style={{ background: T.ink, paddingBottom: 56 }}>
        <div className="container">
          <span className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="eyebrow" style={{ marginBottom: 24 }}>Capabilities</p>
          <h1 className="display-lg" style={{ color: T.white, maxWidth: 800 }}>Six practices.<br /><span style={{ color: T.goldL }}>One advisory partner.</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.65, marginTop: 28, maxWidth: 620 }}>
            From confidential executive search to outsourced HR for growing teams — our integrated practices are delivered by senior, CIPD-chartered advisors.
          </p>
        </div>
      </section>

      <section className="pad-lg" style={{ background: T.white }}>
        <div className="container">
          {services.map((s, i) => (
            <div key={i} className={`service-detail ${i % 2 === 1 ? 'reverse' : ''}`}>
              <div>
                <img src={s.image} alt={s.title} loading="lazy" />
              </div>
              <div>
                <span className="gold-rule" style={{ marginBottom: 20 }} />
                <p className="eyebrow" style={{ marginBottom: 16 }}>{String(i + 1).padStart(2, '0')} · Service</p>
                <h2 className="display-md" style={{ marginBottom: 14 }}>{s.title}</h2>
                <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 15, color: T.gold, fontStyle: 'italic', marginBottom: 22 }}>{s.tag}</p>
                <p className="body-md" style={{ marginBottom: 28, fontSize: 16 }}>{s.desc}</p>
                <div>
                  {s.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: j < s.items.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                      <div style={{ width: 4, height: 4, background: T.gold, marginTop: 8, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: T.ink2, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setPage('contact')} className="link-underline" style={{ marginTop: 28 }}>
                  Discuss this service <Icon name="arrow" size={16} color={T.gold} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pad-md" style={{ background: T.ink, textAlign: 'center' }}>
        <div className="container-narrow">
          <h2 className="display-md" style={{ color: T.white, marginBottom: 28 }}>Bespoke engagements only.</h2>
          <p className="body-lg" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
            Every mandate is scoped against your specific business context. No templated packages — only tailored advisory.
          </p>
          <button onClick={() => setPage('contact')} className="btn btn-gold">
            Discuss Your Needs <Icon name="arrow" size={16} color={T.white} />
          </button>
        </div>
      </section>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  INDUSTRIES
// ════════════════════════════════════════════════════════════════════════════
const Industries = ({ setPage }) => {
  const sectors = [
    { icon: 'shield', name: 'Corporate & Professional Services', desc: 'C-suite recruitment, executive support, business development and corporate functions across the GCC.', roles: ['Executive Assistant', 'Business Development', 'Operations', 'Corporate Functions'] },
    { icon: 'data', name: 'Data Centres & Technology', desc: 'Technical leadership, project management and executive functions for hyperscale and enterprise infrastructure.', roles: ['Project Manager', 'Executive Assistant', 'Operations', 'Engineering'] },
    { icon: 'energy', name: 'Energy & Sustainability', desc: 'Engineering, project delivery and operations roles across renewable energy and environmental sectors.', roles: ['Project Manager', 'Operations Lead', 'Engineering', 'HSE'] },
    { icon: 'event', name: 'Events & Conferences', desc: 'Production teams, conference programming, speaker management and event operations.', roles: ['Conference Producer', 'Event Director', 'Production Lead', 'Operations'] },
    { icon: 'hotel', name: 'Hospitality & Hotels', desc: 'Pre-opening teams, hotel operations and leadership across luxury and boutique properties.', roles: ['Hotel GM', 'F&B Manager', 'Front Office', 'Revenue Manager'] },
    { icon: 'chef', name: 'Restaurant & F&B', desc: 'Restaurant groups, catering operations and culinary leadership across casual to fine-dining concepts.', roles: ['Executive Chef', 'Restaurant Manager', 'Sommelier', 'F&B Director'] },
    { icon: 'shield', name: 'Insurance & Financial Services', desc: 'Sales executives, advisory talent and corporate functions for insurance and financial services.', roles: ['Marketing Executive', 'Sales', 'Advisory', 'Corporate'] },
  ];

  return (
    <div className="page-enter" style={{ paddingTop: 96 }}>
      <section className="pad-lg" style={{ background: T.ink, paddingBottom: 56 }}>
        <div className="container">
          <span className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="eyebrow" style={{ marginBottom: 24 }}>Sectors</p>
          <h1 className="display-lg" style={{ color: T.white, maxWidth: 800 }}>Where we work.<br /><span style={{ color: T.goldL }}>What we know.</span></h1>
        </div>
      </section>

      <section className="pad-lg" style={{ background: T.bg }}>
        <div className="container">
          <div className="grid-2" style={{ gap: 32 }}>
            {sectors.map((s, i) => (
              <div key={i} style={{ background: T.white, padding: 48, border: `1px solid ${T.line}`, transition: 'all 0.4s', position: 'relative', overflow: 'hidden' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                  <Icon name={s.icon} size={36} color={T.gold} strokeWidth={1.25} />
                  <span style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, color: T.faded, fontStyle: 'italic' }}>{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="display-sm" style={{ marginBottom: 14 }}>{s.name}</h3>
                <p className="body-sm" style={{ marginBottom: 28, fontSize: 14 }}>{s.desc}</p>
                <div>
                  <p className="micro" style={{ marginBottom: 12, fontSize: 10 }}>Representative Roles</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {s.roles.map((r, j) => (
                      <span key={j} style={{ padding: '5px 12px', background: T.bg, color: T.ink, fontSize: 12, fontWeight: 500 }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  TOOLS
// ════════════════════════════════════════════════════════════════════════════
const Tools = () => {
  const [tab, setTab] = useState('chat');
  const [msgs, setMsgs] = useState([{ r: 'a', t: "I'm here to help with questions on UAE labour law, HR strategy, executive search, or how NHB Consultancy could support your business." }]);
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
    { q: 'Is your business fully compliant with UAE Labour Law?', k: 'p2' },
    { q: 'Do you operate a formal performance management process?', k: 'p3' },
    { q: 'Do you run regular employee engagement initiatives?', k: 'p4' },
    { q: 'Is there a structured onboarding programme in place?', k: 'p5' },
    { q: 'Do you track and report HR metrics regularly?', k: 'p6' },
    { q: 'Is there a defined training and development pathway?', k: 'p7' },
    { q: 'Is your payroll process accurate and audit-ready?', k: 'p8' },
    { q: 'Do all roles have clear, current job descriptions?', k: 'p9' },
    { q: 'Is your recruitment process consistent and structured?', k: 'p10' },
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
    'Project Manager': { j: '15,000–22,000', m: '22,000–35,000', s: '35,000–55,000' },
    'Executive Assistant': { j: '8,000–12,000', m: '12,000–18,000', s: '18,000–25,000' },
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
    } catch { setMsgs(p => [...p, { r: 'a', t: 'Unable to connect at this moment. For direct support, email admin@nhb-consultancy.com.' }]); }
    setChatLoad(false);
  };

  const submitHealth = async () => {
    setHLoad(true);
    try {
      const answers = hQs.map(q => `${q.q}: ${hAnswers[q.k] || 'Not answered'}`).join('\n');
      const HEALTH_SYSTEM = 'You are a senior HR consultant analysing HR maturity. Return ONLY valid JSON (no markdown, no preamble): {"score":number,"grade":"string","summary":"string","strengths":["string","string","string"],"gaps":["string","string","string"],"recommendations":["string","string","string"]}';
      const raw = await callClaude(HEALTH_SYSTEM, [{ role: 'user', content: `HR Maturity Assessment:\n${answers}` }]);
      setHResult(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch {
      setHResult({ score: 60, grade: 'B-', summary: 'Foundational HR practices are in place with clear opportunities for strengthening.', strengths: ['Awareness of HR governance', 'Willingness to invest in structure', 'Baseline operational processes'], gaps: ['Policies require formalisation', 'Compliance review recommended', 'Analytics framework absent'], recommendations: ['Conduct a comprehensive HR audit', 'Develop core policy frameworks', 'Implement HR metrics dashboards'] });
    }
    setHLoad(false);
  };

  const tabs = [
    { id: 'chat', label: 'Advisor' },
    { id: 'health', label: 'HR Maturity' },
    { id: 'salary', label: 'Compensation' },
  ];

  return (
    <div className="page-enter" style={{ paddingTop: 96 }}>
      <section className="pad-lg" style={{ background: T.ink, paddingBottom: 56 }}>
        <div className="container">
          <span className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="eyebrow" style={{ marginBottom: 24 }}>Advisory Tools</p>
          <h1 className="display-lg" style={{ color: T.white, maxWidth: 800 }}>Intelligence,<br /><span style={{ color: T.goldL }}>on demand.</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.65, marginTop: 28, maxWidth: 560 }}>
            Three AI-powered tools — calibrated to the GCC market and informed by Chartered HR expertise. Available without obligation.
          </p>
        </div>
      </section>

      <section className="pad-sm" style={{ background: T.bg, paddingTop: 56, paddingBottom: 72 }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 40, borderBottom: `1px solid ${T.border}` }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '16px 28px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${T.gold}` : '2px solid transparent', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500, color: tab === t.id ? T.ink : T.muted, cursor: 'pointer', transition: 'all 0.3s', marginBottom: -1 }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* CHAT */}
          {tab === 'chat' && (
            <div className="scale-in" style={{ background: T.white, border: `1px solid ${T.line}` }}>
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chat" size={20} color={T.gold} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 600, color: T.ink }}>HR Advisor</div>
                  <div style={{ fontSize: 12, color: T.muted }}>Powered by Claude · Calibrated for GCC market</div>
                </div>
              </div>
              <div style={{ height: 460, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {msgs.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.r === 'u' ? 'flex-end' : 'flex-start' }}>
                    <div className={`bubble bubble-${m.r === 'u' ? 'user' : 'assistant'}`}>{m.t}</div>
                  </div>
                ))}
                {chatLoad && <div style={{ background: T.bg, padding: '14px 18px', color: T.muted, fontSize: 20, width: 'fit-content', border: `1px solid ${T.line}`, borderRadius: '14px 14px 14px 4px' }}>···</div>}
                <div ref={endRef} />
              </div>
              <div style={{ padding: 20, borderTop: `1px solid ${T.line}`, display: 'flex', gap: 10 }}>
                <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Ask about labour law, HR strategy, or our services..." className="input" style={{ flex: 1 }} />
                <button onClick={sendChat} disabled={chatLoad} className="btn btn-primary" style={{ padding: '14px 20px' }}>
                  <Icon name="send" size={14} color={T.white} />
                </button>
              </div>
            </div>
          )}

          {/* HR MATURITY */}
          {tab === 'health' && (
            <div className="scale-in" style={{ background: T.white, border: `1px solid ${T.line}`, padding: 56 }}>
              <h2 className="display-sm" style={{ marginBottom: 12 }}>HR Maturity Assessment</h2>
              <p className="body-md" style={{ marginBottom: 40, fontSize: 15 }}>Ten questions. Five minutes. An AI-generated diagnostic report with prioritised recommendations.</p>
              {!hResult ? (
                <div>
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: T.muted, letterSpacing: '0.05em' }}>Progress</span>
                      <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{Object.keys(hAnswers).length} / {hQs.length}</span>
                    </div>
                    <div style={{ height: 2, background: T.line }}>
                      <div style={{ height: '100%', background: T.gold, width: `${(Object.keys(hAnswers).length / hQs.length) * 100}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {hQs.map((q, i) => (
                      <div key={i} style={{ padding: '24px 28px', background: T.bg, borderLeft: `3px solid ${hAnswers[q.k] ? T.gold : T.border}`, transition: 'border-color 0.3s' }}>
                        <p style={{ fontSize: 15, color: T.ink, marginBottom: 16, fontWeight: 500 }}>{String(i + 1).padStart(2, '0')}. {q.q}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['Yes', 'Partially', 'No'].map(opt => (
                            <button key={opt} onClick={() => setHAnswers(p => ({ ...p, [q.k]: opt }))}
                              style={{ padding: '8px 20px', border: `1px solid ${hAnswers[q.k] === opt ? T.gold : T.border}`, background: hAnswers[q.k] === opt ? T.gold : T.white, color: hAnswers[q.k] === opt ? T.white : T.muted, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Inter,sans-serif', transition: 'all 0.2s' }}>{opt}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={submitHealth} disabled={Object.keys(hAnswers).length < 10 || hLoad} className="btn btn-primary" style={{ marginTop: 36 }}>
                    {hLoad ? 'Analysing...' : 'Generate Report'} <Icon name="arrow" size={16} color={T.white} />
                  </button>
                </div>
              ) : (
                <div className="fade-in">
                  <div style={{ textAlign: 'center', padding: '40px 0', borderBottom: `1px solid ${T.border}`, marginBottom: 48 }}>
                    <p className="eyebrow" style={{ marginBottom: 20 }}>Your HR Maturity Score</p>
                    <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 120, fontWeight: 500, color: T.ink, lineHeight: 1, letterSpacing: '-0.03em' }}>{hResult.score}</div>
                    <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 500, color: T.gold, marginTop: 8 }}>Grade · {hResult.grade}</div>
                    <p style={{ color: T.muted, fontSize: 15, marginTop: 24, maxWidth: 520, margin: '24px auto 0', lineHeight: 1.75 }}>{hResult.summary}</p>
                  </div>
                  <div className="grid-3" style={{ gap: 32 }}>
                    {[{ label: 'Strengths', items: hResult.strengths }, { label: 'Gaps', items: hResult.gaps }, { label: 'Recommendations', items: hResult.recommendations }].map((col, i) => (
                      <div key={i}>
                        <p className="micro" style={{ marginBottom: 16, color: T.gold, fontSize: 10 }}>{String(i + 1).padStart(2, '0')} · {col.label}</p>
                        {col.items?.map((s, j) => <p key={j} style={{ fontSize: 14, color: T.ink2, padding: '12px 0', borderBottom: j < col.items.length - 1 ? `1px solid ${T.line}` : 'none', lineHeight: 1.6 }}>{s}</p>)}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setHResult(null); setHAnswers({}); }} className="btn btn-outline" style={{ marginTop: 40 }}>Take Assessment Again</button>
                </div>
              )}
            </div>
          )}

          {/* COMPENSATION */}
          {tab === 'salary' && (
            <div className="scale-in" style={{ background: T.white, border: `1px solid ${T.line}`, padding: 56 }}>
              <h2 className="display-sm" style={{ marginBottom: 12 }}>Compensation Benchmarker</h2>
              <p className="body-md" style={{ marginBottom: 40, fontSize: 15 }}>Salary intelligence across professional roles in the UAE market (AED monthly).</p>
              <div className="grid-2-form" style={{ gap: 24, marginBottom: 28 }}>
                <div className="field">
                  <label className="label">Role</label>
                  <select value={sRole} onChange={e => { setSRole(e.target.value); setSResult(null); }} className="input">
                    <option value="">Select a role</option>
                    {Object.keys(salaries).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Experience Tier</label>
                  <select value={sExp} onChange={e => { setSExp(e.target.value); setSResult(null); }} className="input">
                    <option value="">Select tier</option>
                    <option value="j">Junior · 0–3 years</option>
                    <option value="m">Mid-level · 3–7 years</option>
                    <option value="s">Senior · 7+ years</option>
                  </select>
                </div>
              </div>
              <button onClick={() => sRole && sExp && setSResult(salaries[sRole]?.[sExp])} disabled={!sRole || !sExp} className="btn btn-primary">
                Generate Benchmark <Icon name="arrow" size={16} color={T.white} />
              </button>
              {sResult && (
                <div className="fade-in" style={{ marginTop: 48, background: T.ink, padding: '56px 48px', textAlign: 'center' }}>
                  <p className="eyebrow" style={{ marginBottom: 18, color: T.goldL }}>Estimated Monthly · AED</p>
                  <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 56, fontWeight: 500, color: T.white, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{sResult}</div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 18 }}>{sRole} · {sExp === 'j' ? '0–3 years' : sExp === 'm' ? '3–7 years' : '7+ years'}</p>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '32px auto', maxWidth: 200 }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>Indicative range based on current UAE market intelligence. Actual packages vary by employer, total compensation structure and individual experience. Contact NHB for tailored benchmarking.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  CAREERS
// ════════════════════════════════════════════════════════════════════════════
const Careers = ({ setPage }) => {
  const [filter, setFilter] = useState('All');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyJob, setApplyJob] = useState(null);
  const [appForm, setAppForm] = useState({ name: '', email: '', message: '' });
  const [appSent, setAppSent] = useState(false);
  const [appLoading, setAppLoading] = useState(false);

  const fallback = [
    { title: 'Executive Assistant', location: 'Dubai', sector: 'Corporate', type: 'Permanent', salary: 'AED 15,000–20,000' },
    { title: 'Conference Producer', location: 'Dubai / Bahrain', sector: 'Events', type: 'Project', salary: 'Up to AED 20,000' },
    { title: 'Project Manager', location: 'UAE', sector: 'Energy', type: 'Permanent', salary: 'AED 17,000–23,000' },
    { title: 'Marketing Executive', location: 'Dubai', sector: 'Insurance', type: 'Permanent', salary: 'AED 6,000–10,000 + commission' },
    { title: 'Business Development Executive', location: 'Dubai', sector: 'Corporate', type: 'Permanent', salary: 'Commission structure' },
    { title: 'Restaurant Manager', location: 'Dubai Marina', sector: 'F&B', type: 'Permanent', salary: 'Competitive' },
  ];

  useEffect(() => { fetchJobs().then(d => setJobs(d || [])).catch(() => setJobs(fallback)).finally(() => setLoading(false)); }, []);

  const sectors = ['All', 'Hospitality', 'Corporate', 'F&B', 'Events', 'Energy', 'Insurance'];
  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.sector === filter);

  const handleApply = async () => {
    if (!appForm.name || !appForm.email) return;
    setAppLoading(true);
    try { await submitApplication({ name: appForm.name, email: appForm.email, jobTitle: applyJob?.title, message: appForm.message }); setAppSent(true); }
    catch { alert('Something went wrong. Please email admin@nhb-consultancy.com directly.'); }
    setAppLoading(false);
  };

  return (
    <div className="page-enter" style={{ paddingTop: 96 }}>
      <section className="pad-lg" style={{ background: T.ink, paddingBottom: 56 }}>
        <div className="container">
          <span className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="eyebrow" style={{ marginBottom: 24 }}>Careers</p>
          <h1 className="display-lg" style={{ color: T.white, maxWidth: 800 }}>Live<br /><span style={{ color: T.goldL }}>vacancies.</span></h1>
        </div>
      </section>

      <section className="pad-sm" style={{ background: T.bg, paddingTop: 56, paddingBottom: 72 }}>
        <div className="container" style={{ maxWidth: 980 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 48, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
            {sectors.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{ padding: '14px 24px', background: 'transparent', border: 'none', borderBottom: filter === s ? `2px solid ${T.gold}` : '2px solid transparent', fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 500, color: filter === s ? T.ink : T.muted, cursor: 'pointer', marginBottom: -1, transition: 'all 0.3s' }}>{s}</button>
            ))}
          </div>

          {loading ? <p style={{ textAlign: 'center', padding: '60px 0', color: T.muted }}>Loading opportunities...</p> : (
            <div style={{ background: T.white }}>
              {filtered.map((job, i) => (
                <div key={i} className="job-row" style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.line}` : 'none' }}
                  onMouseOver={e => e.currentTarget.style.background = T.bg}
                  onMouseOut={e => e.currentTarget.style.background = T.white}>
                  <div>
                    <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 600, color: T.ink, marginBottom: 6 }}>{job.title}</h3>
                    <div style={{ display: 'flex', gap: 14, color: T.muted, fontSize: 13 }}>
                      <span>{job.location}</span>
                      <span>·</span><span style={{ color: T.gold, fontWeight: 500 }}>{job.sector}</span>
                      <span>·</span><span>{job.type}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>{job.salary || '—'}</div>
                  <button onClick={() => { setApplyJob(job); setAppSent(false); setAppForm({ name: '', email: '', message: '' }); }} className="btn btn-outline" style={{ padding: '10px 22px', fontSize: 12 }}>
                    Apply <Icon name="arrow" size={14} color={T.ink} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 64, padding: '56px 48px', background: T.ink, textAlign: 'center' }}>
            <span className="gold-rule" style={{ margin: '0 auto 24px' }} />
            <h3 className="display-sm" style={{ color: T.white, marginBottom: 14 }}>Don't see the right role?</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>Register your profile confidentially — we'll be in touch when the right role becomes available.</p>
            <button onClick={() => setPage('contact')} className="btn btn-gold">Register Confidentially</button>
          </div>
        </div>
      </section>

      {applyJob && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ padding: 56 }}>
            <button onClick={() => setApplyJob(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="x" size={20} color={T.muted} />
            </button>
            {!appSent ? (
              <div>
                <p className="eyebrow" style={{ marginBottom: 12 }}>Apply</p>
                <h3 className="display-sm" style={{ marginBottom: 8 }}>{applyJob.title}</h3>
                <p style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>We'll be in touch within 24 hours.</p>
                {[{ label: 'Full Name', k: 'name', ph: 'Your full name' }, { label: 'Email', k: 'email', ph: 'you@email.com' }].map(f => (
                  <div key={f.k} className="field">
                    <label className="label">{f.label}</label>
                    <input value={appForm[f.k]} onChange={e => setAppForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} className="input" />
                  </div>
                ))}
                <div className="field">
                  <label className="label">Brief Note <span style={{ color: T.faded, fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(optional)</span></label>
                  <textarea value={appForm.message} onChange={e => setAppForm(p => ({ ...p, message: e.target.value }))} rows={3} className="input" />
                </div>
                <button onClick={handleApply} disabled={!appForm.name || !appForm.email || appLoading} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  {appLoading ? 'Submitting...' : 'Submit Application'} <Icon name="arrow" size={16} color={T.white} />
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 64, height: 64, background: T.ink, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Icon name="check" size={28} color={T.gold} strokeWidth={2} />
                </div>
                <h3 className="display-sm" style={{ marginBottom: 14 }}>Application received.</h3>
                <p style={{ color: T.muted, lineHeight: 1.7 }}>We'll review your details and be in touch within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  CONTACT
// ════════════════════════════════════════════════════════════════════════════
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
    <div className="page-enter" style={{ paddingTop: 96 }}>
      <section className="pad-lg" style={{ background: T.ink, paddingBottom: 56 }}>
        <div className="container">
          <span className="gold-rule" style={{ marginBottom: 24 }} />
          <p className="eyebrow" style={{ marginBottom: 24 }}>Contact</p>
          <h1 className="display-lg" style={{ color: T.white, maxWidth: 800 }}>Let's begin a<br /><span style={{ color: T.goldL }}>conversation.</span></h1>
        </div>
      </section>

      <section className="pad-lg" style={{ background: T.bg }}>
        <div className="container">
          <div className="grid-2-contact">
            <div>
              <p className="eyebrow" style={{ marginBottom: 18 }}>Direct Contact</p>
              <h3 className="display-sm" style={{ marginBottom: 40 }}>For new enquiries, advisory engagements, or media.</h3>
              {[
                { icon: 'mail', label: 'Email', value: 'admin@nhb-consultancy.com', href: 'mailto:admin@nhb-consultancy.com' },
                { icon: 'phone', label: 'WhatsApp', value: '+971 52 489 0505', href: 'https://wa.me/971524890505' },
                { icon: 'pin', label: 'Location', value: 'Dubai, United Arab Emirates' },
              ].map((c, i) => (
                <a key={i} href={c.href} target={c.href ? '_blank' : undefined} rel="noreferrer"
                  style={{ display: 'flex', gap: 18, padding: '22px 0', borderBottom: `1px solid ${T.line}`, alignItems: 'center', transition: 'all 0.3s', cursor: c.href ? 'pointer' : 'default' }}
                  onMouseOver={e => c.href && (e.currentTarget.style.paddingLeft = '8px')}
                  onMouseOut={e => c.href && (e.currentTarget.style.paddingLeft = '0')}>
                  <div style={{ width: 44, height: 44, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={c.icon} size={20} color={T.gold} />
                  </div>
                  <div>
                    <p className="micro" style={{ marginBottom: 4, fontSize: 10 }}>{c.label}</p>
                    <p style={{ fontSize: 15, color: T.ink, fontWeight: 500 }}>{c.value}</p>
                  </div>
                </a>
              ))}
              <div style={{ marginTop: 36, paddingTop: 32, borderTop: `1px solid ${T.line}` }}>
                <p className="micro" style={{ marginBottom: 16, fontSize: 10 }}>Connect</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { icon: 'linkedin', href: 'https://www.linkedin.com/company/nhb-consultancy' },
                    { icon: 'instagram', href: 'https://www.instagram.com/nhb_hr_solution/' },
                  ].map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noreferrer"
                      style={{ width: 40, height: 40, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', background: T.white }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.ink; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.white; }}>
                      <Icon name={s.icon} size={16} color={T.ink} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: T.white, padding: 64, border: `1px solid ${T.line}` }}>
              {!sent ? (
                <div>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>Send a Message</p>
                  <h3 className="display-sm" style={{ marginBottom: 36 }}>Tell us about your needs.</h3>
                  <div className="grid-2-form">
                    {[{ label: 'Full Name', k: 'name', ph: 'Your name' }, { label: 'Email', k: 'email', ph: 'you@email.com' }].map(f => (
                      <div key={f.k} className="field">
                        <label className="label">{f.label} <span style={{ color: T.gold }}>*</span></label>
                        <input value={form[f.k]} onChange={set(f.k)} placeholder={f.ph} className="input" />
                      </div>
                    ))}
                  </div>
                  <div className="field">
                    <label className="label">Company</label>
                    <input value={form.company} onChange={set('company')} placeholder="Your organisation" className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Area of Interest</label>
                    <select value={form.service} onChange={set('service')} className="input">
                      <option value="">Please select</option>
                      {['HR Consultancy', 'Recruitment & Executive Search', 'Outsourced HR Services', 'Hospitality Management', 'Candidate Registration', 'Media & Partnership', 'Other'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Message <span style={{ color: T.gold }}>*</span></label>
                    <textarea value={form.message} onChange={set('message')} rows={5} placeholder="Briefly describe your requirements..." className="input" />
                  </div>
                  {error && <p style={{ color: '#B91C1C', fontSize: 13, marginBottom: 16 }}>{error}</p>}
                  <button onClick={handleSubmit} disabled={!canSend || loading} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
                    {loading ? 'Sending...' : 'Send Message'} <Icon name="arrow" size={16} color={T.white} />
                  </button>
                  <p style={{ fontSize: 12, color: T.muted, marginTop: 20, lineHeight: 1.6 }}>By submitting, you agree to be contacted regarding your enquiry. All communications are confidential.</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ width: 72, height: 72, background: T.ink, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
                    <Icon name="check" size={32} color={T.gold} strokeWidth={2} />
                  </div>
                  <h3 className="display-sm" style={{ marginBottom: 16 }}>Thank you.</h3>
                  <p className="body-md">Your message has been received. We'll be in touch within 24 hours.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  FOOTER
// ════════════════════════════════════════════════════════════════════════════
const Footer = ({ setPage }) => (
  <footer className="pad-sm" style={{ background: T.ink, paddingTop: 80, paddingBottom: 40 }}>
    <div className="container">
      <div className="grid-footer" style={{ marginBottom: 64, paddingBottom: 64, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div style={{ marginBottom: 28 }}>
            <Logo inverted={true} size="lg" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.75, maxWidth: 320, marginBottom: 28 }}>
            Boutique HR advisory and executive search for ambitious companies across the GCC.
          </p>
          <p className="micro" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Chartered MCIPD · Founded by Nihel Hassen Busman</p>
        </div>
        {[
          { title: 'Practice', links: [['About', 'about'], ['Services', 'services'], ['Industries', 'industries'], ['Tools', 'tools']] },
          { title: 'Engage', links: [['Careers', 'careers'], ['Contact', 'contact']] },
          { title: 'Direct', links: [['admin@nhb-consultancy.com', 'mailto:admin@nhb-consultancy.com'], ['+971 52 489 0505', 'https://wa.me/971524890505'], ['Dubai, UAE', null]] },
        ].map((col, i) => (
          <div key={i}>
            <p className="micro" style={{ color: T.gold, fontSize: 10, marginBottom: 24 }}>{col.title}</p>
            {col.links.map(([label, target], j) => {
              const isExt = typeof target === 'string' && (target.startsWith('http') || target.startsWith('mailto'));
              const Component = isExt ? 'a' : 'div';
              return (
                <Component key={j} href={isExt ? target : undefined} target={isExt && target.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                  onClick={() => !isExt && target && setPage(target)}
                  style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 12, cursor: target ? 'pointer' : 'default', transition: 'color 0.2s', display: 'block', textDecoration: 'none' }}
                  onMouseOver={e => target && (e.currentTarget.style.color = T.gold)}
                  onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>{label}</Component>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>© 2025 NHB Consultancy. All rights reserved.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { icon: 'linkedin', href: 'https://www.linkedin.com/company/nhb-consultancy' },
            { icon: 'instagram', href: 'https://www.instagram.com/nhb_hr_solution/' },
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noreferrer"
              style={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.gold; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'transparent'; }}>
              <Icon name={s.icon} size={14} color="rgba(255,255,255,0.7)" />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

// ════════════════════════════════════════════════════════════════════════════
//  WHATSAPP + ADVISOR BUTTONS
// ════════════════════════════════════════════════════════════════════════════
const FloatingActions = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ r: 'a', t: 'I can help with questions on UAE labour law, HR strategy, or our services. What would you like to explore?' }]);
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
      const reply = await callClaude(`${NHB_SYSTEM} Keep replies concise — 2 to 3 sentences maximum for this compact widget.`, history, 400);
      setMsgs(p => [...p, { r: 'a', t: reply }]);
    } catch { setMsgs(p => [...p, { r: 'a', t: 'Please try again or email admin@nhb-consultancy.com directly.' }]); }
    setLoad(false);
  };

  return (
    <div className="fab-wrap" style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
      {open && (
        <div className="scale-in fab-panel" style={{ width: 'min(380px, calc(100vw - 56px))', background: T.white, boxShadow: '0 30px 80px rgba(10,22,40,0.25)', display: 'flex', flexDirection: 'column', border: `1px solid ${T.line}` }}>
          <div style={{ background: T.ink, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chat" size={16} color={T.white} />
              </div>
              <div>
                <div style={{ color: T.white, fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>NHB Advisor</div>
                <div style={{ color: T.goldL, fontSize: 11 }}>Online · Confidential</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="x" size={18} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
          <div style={{ height: 360, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: T.bg }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.r === 'u' ? 'flex-end' : 'flex-start' }}>
                <div className={`bubble bubble-${m.r === 'u' ? 'user' : 'assistant'}`} style={{ fontSize: 13.5, padding: '10px 14px' }}>{m.t}</div>
              </div>
            ))}
            {load && <div style={{ background: T.white, padding: '10px 14px', color: T.muted, fontSize: 18, border: `1px solid ${T.line}`, borderRadius: '14px 14px 14px 4px', width: 'fit-content' }}>···</div>}
            <div ref={endRef} />
          </div>
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.line}`, display: 'flex', gap: 8, background: T.white }}>
            <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: '11px 14px', border: `1px solid ${T.border}`, fontSize: 13, color: T.ink, outline: 'none', background: T.bg }} />
            <button onClick={send} disabled={load} className="btn btn-primary" style={{ padding: '10px 16px' }}>
              <Icon name="send" size={14} color={T.white} />
            </button>
          </div>
        </div>
      )}

      <a href="https://wa.me/971524890505" target="_blank" rel="noreferrer"
        style={{ width: 56, height: 56, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(37,211,102,0.35)', transition: 'transform 0.3s' }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}>
        <Icon name="whatsapp" size={28} color={T.white} strokeWidth={1.5} />
      </a>

      <button onClick={() => setOpen(p => !p)} className="float-btn pulse-ring">
        {open ? <Icon name="x" size={20} color={T.white} /> : <Icon name="chat" size={20} color={T.white} />}
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  APP
// ════════════════════════════════════════════════════════════════════════════
// ────────────────────────────────────────────────────────────────────────────
// Per-page SEO metadata. Updated dynamically on page state change so crawlers
// that execute JS (Googlebot, Bingbot) see unique <title>, description and
// canonical per "route". Universal JSON-LD lives in index.html.
// ────────────────────────────────────────────────────────────────────────────
const PAGE_META = {
  home:       { title: 'NHB Consultancy | HR & Executive Search Dubai, UAE',
                desc:  'Boutique HR consultancy and executive search firm in Dubai. CIPD-chartered advisory on talent acquisition, HR transformation, and hospitality recruitment across the UAE.',
                path:  '/' },
  about:      { title: 'About NHB | CIPD-Chartered HR & Executive Search Dubai',
                desc:  'Founded by Nihel Hassen Busman, MCIPD — 15+ years leading HR and executive search across the UAE, MENA, Europe and APAC. Boutique, senior-led, results-driven.',
                path:  '/about' },
  services:   { title: 'HR & Executive Search Services in Dubai | NHB Consultancy',
                desc:  'Executive search, talent acquisition, HR outsourcing, organizational development and hospitality HR advisory — delivered by a CIPD-chartered Dubai consultancy.',
                path:  '/services' },
  industries: { title: 'Industries We Serve | Hospitality, Corporate & Private Sector',
                desc:  'NHB Consultancy partners with hospitality groups, corporate businesses and private sector organisations across the UAE, GCC and MENA on HR and executive search.',
                path:  '/industries' },
  tools:      { title: 'Free HR Tools | UAE Labour Law Chat & HR Health Check',
                desc:  'Free interactive tools from NHB Consultancy: UAE labour law assistant, HR health check, and salary benchmarking guidance for Dubai-based employers.',
                path:  '/tools' },
  careers:    { title: 'Open Roles & Careers | NHB Consultancy Dubai',
                desc:  'Explore current executive search mandates and open roles placed by NHB Consultancy. Apply directly or join our talent network for senior opportunities in the UAE.',
                path:  '/careers' },
  contact:    { title: 'Contact NHB Consultancy | Dubai HR & Executive Search',
                desc:  'Speak to NHB Consultancy in Dubai. Email admin@nhb-consultancy.com or WhatsApp +971 52 489 0505 for executive search, HR advisory and recruitment enquiries.',
                path:  '/contact' }
};

const setMetaTag = (selector, attr, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || [];
    if (selector.includes('property=')) el.setAttribute('property', name);
    else if (name) el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const setCanonical = (href) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
  link.setAttribute('href', href);
};

export default function App() {
  const [page, setPage] = useState('home');
  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  // Per-page SEO metadata sync
  useEffect(() => {
    const m = PAGE_META[page] || PAGE_META.home;
    const origin = 'https://nhb-consultancy.com';
    document.title = m.title;
    setMetaTag('meta[name="description"]', 'content', m.desc);
    setMetaTag('meta[property="og:title"]', 'content', m.title);
    setMetaTag('meta[property="og:description"]', 'content', m.desc);
    setMetaTag('meta[property="og:url"]', 'content', origin + m.path);
    setMetaTag('meta[name="twitter:title"]', 'content', m.title);
    setMetaTag('meta[name="twitter:description"]', 'content', m.desc);
    setCanonical(origin + m.path);
  }, [page]);

  const pages = { home: Home, about: About, services: Services, industries: Industries, tools: Tools, careers: Careers, contact: Contact };
  const Page = pages[page] || Home;
  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      <Styles />
      <Nav page={page} setPage={setPage} />
      <Page setPage={setPage} />
      <Footer setPage={setPage} />
      <FloatingActions />
    </div>
  );
}
