import React from 'react';
import { AuthProvider, useAdminAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { LoginView } from './components/LoginView';
import { Layout } from './components/Layout';

const AppContent: React.FC = () => {
  const { adminUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.logoSpinner}>
          <img src="/daleel-logo.png" alt="DALEEL" className="logo-on-dark" style={styles.logoImg} />
        </div>
        <div style={styles.loadingText}>Initializing DALEEL Command Portal...</div>
      </div>
    );
  }

  if (!adminUser) {
    return <LoginView />;
  }

  return <Layout />;
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#040D1B',
    gap: '16px',
  },
  logoSpinner: {
    height: '68px',
    width: 'auto',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 1.8s infinite',
  },
  logoImg: {
    height: '68px',
    width: 'auto',
    maxWidth: '48px',
    objectFit: 'contain' as const,
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#DFB76C',
    letterSpacing: '0.04em',
  },
};
