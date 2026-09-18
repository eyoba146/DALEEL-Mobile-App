import React from 'react';
import { AuthProvider, useAdminAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Layout } from './components/Layout';
import { Shield } from 'lucide-react';

const AppContent: React.FC = () => {
  const { adminUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.logoSpinner}>
          <Shield size={36} color="#DFB76C" />
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
      <AppContent />
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
    borderRadius: '16px',
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    border: '1px solid rgba(223, 183, 108, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(223, 183, 108, 0.25)',
    animation: 'pulse 1.8s infinite',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#DFB76C',
    letterSpacing: '0.04em',
  },
};
