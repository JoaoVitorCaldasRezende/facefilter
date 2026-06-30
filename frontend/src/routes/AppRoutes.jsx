import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from '../pages/Editor/Editor';
import Gallery from '../pages/Gallery/Gallery';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/galeria" element={<Gallery />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
