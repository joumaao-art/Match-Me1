import { Routes, Route } from 'react-router-dom';

export default function BlogRoutes() {
  return (
    <Routes>
      <Route path="*" element={<div>Blog</div>} />
    </Routes>
  );
}