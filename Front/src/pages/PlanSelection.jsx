import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiActivatePlan } from '../utils/api';

const C = {
  brand:       '#0a3d62',
  brandMid:    '#1565a8',
  accent:      '#00b894',
  accentLight: '#00cec9',
  gold:        '#f39c12',
  goldLight:   '#f9ca24',
  textDark:    '#0a3d62',
  textMuted:   '#4a6278',
  textLight:   '#8fa8bc',
  border:      '#d0dce8',
  white:       '#ffffff',
};

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: 999,
    icon: '🏥',
    color: '#1565a8',
    colorLight: 'rgba(21,101,168,0.08)',
    gradFrom: '#0a3d62',
    gradTo:   '#1565a8',
    shadow:   'rgba(10,61,98,0.28)',
    badge: null,
    features: [
      { yes: true,  text: 'Up to 2 Doctors' },
      { yes: true,  text: 'Up to 1 Receptionist' },
      { yes: true,  text: 'Patient Queue Management' },
      { yes: true,  text: 'Daily Reports' },
      { yes: true,  text: 'Email Support' },
      { yes: false, text: 'SMS / WhatsApp Alerts' },
      { yes: false, text: 'Advanced Analytics' },
      { yes: false, text: 'Multi-Branch Support' },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 2999,
    icon: '⭐',
    color: '#d68910',
    colorLight: 'rgba(243,156,18,0.08)',
    gradFrom: '#f39c12',
    gradTo:   '#f9ca24',
    shadow:   'rgba(243,156,18,0.32)',
    badge: 'Most Popular',
    features: [
      { yes: true, text: 'Unlimited Doctors' },
      { yes: true, text: 'Unlimited Receptionists' },
      { yes: true, text: 'Patient Queue Management' },
      { yes: true, text: 'Advanced Analytics' },
      { yes: true, text: 'SMS / WhatsApp Alerts' },
      { yes: true, text: 'Multi-Branch Support' },
      { yes: true, text: 'Priority Support 24/7' },
      { yes: true, text: 'Custom Branding' },
    ],
  },
];

// onDone — called after successful activation to return to AdminDashboard
export default function PlanSelection({ onDone }) {
  const { session } = useApp();
  const [selected, setSelected] = useState(null);
  const [step, setStep]         = useState('plans'); // 'plans' | 'confirm' | 'paying' | 'success'

  const plan = PLANS.find((p) => p.key === selected);

  function choosePlan(key) {
    setSelected(key);
    setStep('confirm');
  }

  async function handlePay() {
    setStep('paying');
    try {
      await apiActivatePlan(selected); // ✅ saves to MongoDB
      setStep('success');
    } catch (e) {
      alert('Activation failed: ' + e.message);
      setStep('confirm');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(150deg,#e8f4fd 0%,#f0f8ff 40%,#e8f9f5 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes popIn   { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.14)} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(0,184,148,0.45)} 50%{box-shadow:0 0 0 10px rgba(0,184,148,0)} }
        .plan-card:hover   { transform:translateY(-5px) !important; }
        .pay-btn:hover     { opacity:0.88 !important; }
      `}</style>

      {/* ══ STEP: PLANS ══════════════════════════════════════════════ */}
      {step === 'plans' && (
        <div style={{ width:'100%', maxWidth:800, animation:'fadeUp 0.45s ease' }}>

          {/* heading */}
          <div style={{ textAlign:'center', marginBottom:38 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(0,184,148,0.1)', border:'1px solid rgba(0,184,148,0.25)', borderRadius:20, padding:'4px 14px', fontSize:12.5, color:'#00a878', fontWeight:600, marginBottom:14, letterSpacing:0.3 }}>
              🎉 Choose a Plan
            </div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:34, fontWeight:700, color:C.textDark, marginBottom:10, lineHeight:1.2 }}>
              Unlock Your Dashboard
            </div>
            <div style={{ color:C.textMuted, fontSize:15, maxWidth:440, margin:'0 auto', lineHeight:1.65 }}>
              Select a plan to activate your clinic dashboard and start managing patients.
            </div>
          </div>

          {/* plan cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:22 }}>
            {PLANS.map((p) => (
              <div
                key={p.key}
                className="plan-card"
                style={{ position:'relative', background:C.white, borderRadius:22, padding:'30px 28px 26px',
                  border:`2px solid ${p.color}`, boxShadow:`0 8px 32px ${p.colorLight}`,
                  transition:'transform 0.22s, box-shadow 0.22s', cursor:'default',
                }}
              >
                {/* accent bar */}
                <div style={{ position:'absolute',top:0,left:0,right:0,height:4,borderRadius:'22px 22px 0 0',
                  background:`linear-gradient(90deg,${p.gradFrom},${p.gradTo})` }} />

                {/* badge */}
                {p.badge && (
                  <div style={{ position:'absolute',top:14,right:14,
                    background:`linear-gradient(135deg,${p.gradFrom},${p.gradTo})`,
                    color:'#fff',fontSize:10.5,fontWeight:700,padding:'3px 10px',borderRadius:20,letterSpacing:0.5 }}>
                    {p.badge}
                  </div>
                )}

                {/* icon + name */}
                <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:18 }}>
                  <div style={{ width:54,height:54,borderRadius:14,background:p.colorLight,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>
                    {p.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily:'Georgia,serif',fontSize:24,fontWeight:700,color:C.textDark }}>{p.name}</div>
                    <div style={{ fontSize:12,color:C.textMuted }}>Monthly plan</div>
                  </div>
                </div>

                {/* price */}
                <div style={{ marginBottom:22 }}>
                  <span style={{ fontSize:13,color:C.textMuted,fontWeight:500 }}>Rs. </span>
                  <span style={{ fontSize:42,fontWeight:800,color:p.color,lineHeight:1 }}>{p.price.toLocaleString()}</span>
                  <span style={{ fontSize:13,color:C.textMuted }}> / month</span>
                </div>

                {/* features */}
                <div style={{ display:'grid',gap:9,marginBottom:26 }}>
                  {p.features.map((feat,i) => (
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:9,fontSize:13.5 }}>
                      <span style={{
                        width:19,height:19,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:10.5,flexShrink:0,fontWeight:700,
                        background: feat.yes ? `linear-gradient(135deg,${p.gradFrom},${p.gradTo})` : '#eef0f2',
                        color: feat.yes ? '#fff' : '#bbb',
                      }}>
                        {feat.yes ? '✓' : '✕'}
                      </span>
                      <span style={{ color: feat.yes ? C.textDark : C.textLight }}>{feat.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => choosePlan(p.key)}
                  className="pay-btn"
                  style={{ width:'100%',padding:'13px 20px',borderRadius:11,border:'none',
                    background:`linear-gradient(135deg,${p.gradFrom},${p.gradTo})`,
                    color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',
                    boxShadow:`0 5px 18px ${p.shadow}`,transition:'opacity 0.18s',
                  }}
                >
                  Choose {p.name} Plan →
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center',marginTop:22,fontSize:12.5,color:C.textLight }}>
            🔒 No hidden fees · Cancel anytime · Plans renew monthly
          </div>
        </div>
      )}

      {/* ══ STEP: CONFIRM ════════════════════════════════════════════ */}
      {step === 'confirm' && plan && (
        <div style={{ width:'100%',maxWidth:420,animation:'fadeUp 0.4s ease' }}>

          <button onClick={() => setStep('plans')} style={{ background:'none',border:'none',cursor:'pointer',color:C.textMuted,fontSize:13.5,display:'flex',alignItems:'center',gap:6,marginBottom:18,padding:0,fontFamily:'inherit' }}>
            ← Back to Plans
          </button>

          <div style={{ background:C.white,borderRadius:22,padding:'32px 30px',
            boxShadow:'0 20px 60px rgba(10,61,98,0.13)',border:'1px solid rgba(10,61,98,0.07)',
            position:'relative',overflow:'hidden' }}>

            <div style={{ position:'absolute',top:0,left:0,right:0,height:4,
              background:`linear-gradient(90deg,${plan.gradFrom},${plan.gradTo})` }} />

            <div style={{ fontFamily:'Georgia,serif',fontSize:22,fontWeight:700,color:C.textDark,marginBottom:22 }}>
              Order Summary
            </div>

            {/* plan pill */}
            <div style={{ background:plan.colorLight,border:`1.5px solid ${plan.color}30`,borderRadius:14,padding:'18px 20px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700,fontSize:17,color:C.textDark }}>{plan.icon} {plan.name} Plan</div>
                <div style={{ fontSize:13,color:C.textMuted,marginTop:3 }}>Monthly subscription · Renews in 30 days</div>
              </div>
              <div style={{ fontWeight:800,fontSize:22,color:plan.color }}>Rs. {plan.price.toLocaleString()}</div>
            </div>

            {/* included features */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11.5,fontWeight:600,color:C.textMuted,textTransform:'uppercase',letterSpacing:0.5,marginBottom:12 }}>
                What's Included
              </div>
              <div style={{ display:'grid',gap:8 }}>
                {plan.features.filter((f) => f.yes).map((feat,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:9,fontSize:13.5,color:C.textDark }}>
                    <span style={{ width:19,height:19,borderRadius:'50%',background:`linear-gradient(135deg,${plan.gradFrom},${plan.gradTo})`,
                      color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10.5,flexShrink:0,fontWeight:700 }}>✓</span>
                    {feat.text}
                  </div>
                ))}
              </div>
            </div>

            {/* divider */}
            <div style={{ borderTop:`1px dashed ${C.border}`,margin:'18px 0' }} />

            {/* total */}
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:26 }}>
              <span style={{ fontWeight:600,fontSize:15,color:C.textDark }}>Total Due Today</span>
              <span style={{ fontWeight:800,fontSize:24,color:plan.color }}>Rs. {plan.price.toLocaleString()}</span>
            </div>

            <button
              onClick={handlePay}
              className="pay-btn"
              style={{ width:'100%',padding:'16px 20px',borderRadius:11,border:'none',
                background:`linear-gradient(135deg,${C.accent},${C.accentLight})`,
                color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',
                boxShadow:'0 5px 20px rgba(0,184,148,0.35)',
                display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                animation:'pulse 2s infinite',
                transition:'opacity 0.18s',
              }}
            >
              🚀 Pay Now & Activate Plan
            </button>

            <div style={{ textAlign:'center',marginTop:12,fontSize:12,color:C.textLight }}>
              Instant activation · Prototype demo — no real payment
            </div>
          </div>
        </div>
      )}

      {/* ══ STEP: PAYING (spinner) ═══════════════════════════════════ */}
      {step === 'paying' && (
        <div style={{ textAlign:'center',animation:'fadeUp 0.3s ease' }}>
          <div style={{ width:74,height:74,border:'5px solid rgba(0,184,148,0.18)',borderTopColor:C.accent,
            borderRadius:'50%',animation:'spin 0.85s linear infinite',margin:'0 auto 24px' }} />
          <div style={{ fontFamily:'Georgia,serif',fontSize:23,fontWeight:700,color:C.textDark,marginBottom:8 }}>
            Activating Your Plan…
          </div>
          <div style={{ color:C.textMuted,fontSize:14 }}>Just a moment.</div>
        </div>
      )}

      {/* ══ STEP: SUCCESS ════════════════════════════════════════════ */}
      {step === 'success' && plan && (
        <div style={{ width:'100%',maxWidth:420,textAlign:'center',animation:'fadeUp 0.45s ease' }}>
          <div style={{ background:C.white,borderRadius:24,padding:'46px 32px 36px',
            boxShadow:'0 24px 72px rgba(10,61,98,0.15)',position:'relative',overflow:'hidden' }}>

            <div style={{ position:'absolute',top:0,left:0,right:0,height:4,
              background:`linear-gradient(90deg,${plan.gradFrom},${plan.gradTo})` }} />

            <div style={{ fontSize:70,marginBottom:16,display:'block',animation:'popIn 0.55s ease both' }}>🎉</div>

            <div style={{ fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,color:C.textDark,marginBottom:8 }}>
              Plan Activated!
            </div>
            <div style={{ color:C.textMuted,fontSize:14.5,lineHeight:1.7,marginBottom:26 }}>
              Your <strong>{plan.name} Plan</strong> is now live.<br />
              You have full access to the clinic dashboard.
            </div>

            {/* active badge */}
            <div style={{ background:plan.colorLight,border:`1.5px solid ${plan.color}25`,borderRadius:14,
              padding:'14px 20px',marginBottom:28,textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700,fontSize:15,color:plan.color }}>{plan.icon} {plan.name} Plan</div>
                <div style={{ fontSize:12.5,color:C.textMuted,marginTop:3 }}>Rs. {plan.price.toLocaleString()} / month · Renews in 30 days</div>
              </div>
              <span style={{ background:'rgba(0,184,148,0.12)',color:'#00a878',borderRadius:20,padding:'3px 11px',fontSize:11.5,fontWeight:700,whiteSpace:'nowrap' }}>
                ● Active
              </span>
            </div>

            <button
              onClick={onDone}
              className="pay-btn"
              style={{ width:'100%',padding:'14px 20px',borderRadius:11,border:'none',
                background:'linear-gradient(135deg,#0a3d62,#1565a8)',
                color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',
                boxShadow:'0 5px 18px rgba(10,61,98,0.28)',transition:'opacity 0.18s',
              }}
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}