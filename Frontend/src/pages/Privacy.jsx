import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function Privacy() {
  return (
    <MainLayout className="page-content legal-page">
      <Link to="/signup" className="back-link">
        <ArrowLeft size={16} /> Back to Sign Up
      </Link>

      <div className="page-hero">
        <span className="eyebrow">PRIVACY &amp; DATA POLICY · VERSION 1.0</span>
        <h1>Privacy <em>Policy</em></h1>
        <p>How we protect your travel notebooks, security, and personal information.</p>
      </div>

      <div className="panel legal-panel" style={{ maxWidth: '840px', margin: '0 auto', padding: '36px', lineHeight: '1.7' }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>1. Information We Collect</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            When you register on YATRAGO, we collect your name, email address, and an encrypted password hash. When you plan journeys, we store your selected destinations, itinerary dates, budgets, to-do checklists, and expense records securely in MongoDB Atlas.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>2. How We Protect Your Data</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            We implement industry-standard cryptographic techniques: passwords are never stored in plain text and are hashed using bcryptjs. One-time passcodes (OTPs) are single-use, rate-limited, and stored as hashes. We use HTTPS/TLS and JWT tokens to guard session integrity.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>3. How We Use Email</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            Your email is used solely to verify your account identity, send security one-time passcodes (OTPs), and deliver password reset authorizations. We do not sell or rent user contact info to commercial spammers.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#1a202c' }}>4. Data Ownership &amp; Erasure</h2>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
            You maintain full ownership of your trips. You can update or delete your trips, to-dos, and expenses at any time directly through your trip workspace.
          </p>
        </section>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#718096' }}>Last updated: October 2026</span>
          <Link to="/signup" className="button button-dark button-small">
            Back to Sign Up
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
