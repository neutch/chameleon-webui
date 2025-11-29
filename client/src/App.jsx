import { useState } from 'react';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import GridView from './pages/GridView';
import Admin from './pages/Admin';
import './App.css';

const AppContent = () => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('grid');

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (currentView === 'admin' && isAdmin) {
    return <Admin onNavigateBack={() => setCurrentView('grid')} />;
  }

  return <GridView onNavigateAdmin={() => setCurrentView('admin')} />;
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
