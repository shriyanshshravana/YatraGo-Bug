import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function Terms() {
  return (
    <MainLayout className="page-content legal-page">
      <Link to="/signup" className="back-link">
        <ArrowLeft size={16} /> Back to Sign Up
      </Link>

      <div className="page-hero">
        <span className="eyebrow">LEGAL INFORMATION · VERSION 1.0</span>
        <h1>Terms &amp; <em>Conditions</em></h1>
        <p>Please read these terms carefully before planning journeys with YATRAGO.</p>
      </div>

      <div className="panel legal-panel" style={{ maxWidth: '840px', margin: '0 auto', padding: '36px', lineHeight: '1.7' }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>1. Welcome to YATRAGO</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            YATRAGO is an India-only travel itinerary planner, budget tracking, and travel notebook service.
            By creating an account or accessing our platform, you confirm your agreement to these Terms and Conditions and our Privacy Policy.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>2. Account Registration &amp; Security</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            To use personalised features such as saving trips, managing to-do checklists, and tracking expenses, you must register using an authentic email address and verify ownership via a 6-digit one-time passcode (OTP). You are responsible for maintaining the confidentiality of your login credentials.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>3. Travel Planning &amp; Indicative Estimates</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            Budget calculations, destination tips, suggested stays, and highlights provided on YATRAGO are indicative travel planning aids. Actual travel expenses, train/flight tariffs, weather conditions, and hotel tariffs may fluctuate based on seasons and local operators.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>4. User Content &amp; Privacy</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            Your custom trips, notes, to-do lists, and expense logs belong strictly to you. YATRAGO will never share your private travel plans with third-party marketers without your consent.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>5. Responsible Travel in India</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            We encourage all travellers to respect local heritage monuments, preserve natural environments, honor sacred traditions at cultural sites, and follow regional guidelines issued by state tourism authorities.
          </p>
        </section>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#718096' }}>Last updated: October 2026</span>
          <Link to="/signup" className="button button-dark button-small">
            Agree &amp; Continue to Sign Up
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
