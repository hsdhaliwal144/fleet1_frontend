import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RigbyPage from './pages/RigbyPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RigbyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;