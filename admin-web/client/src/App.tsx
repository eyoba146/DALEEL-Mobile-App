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
          <img src="/daleel-logo.png" alt="DALEEL" style={styles.logoImg} />
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
    width: '64px',
    height: '64px',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 1.8s infinite',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#DFB76C',
    letterSpacing: '0.04em',
  },
};
