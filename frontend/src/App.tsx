import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { GraphPage } from './pages/GraphPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile/:ensName" element={<ProfilePage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--c-washi)',
            color: 'var(--c-ink)',
            border: '0.5px solid var(--c-border-gold)',
            borderRadius: '8px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            letterSpacing: '0.02em',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
