import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useAppContext } from './context/AppContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { preferences } = useAppContext();
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
      </Routes>
      <Toaster 
        position="bottom-right" 
        expand={false} 
        richColors 
        theme={preferences.theme === 'dark' ? 'dark' : (preferences.theme === 'high-contrast' ? 'light' : 'light')} 
      />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

