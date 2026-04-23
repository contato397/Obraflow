import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Memorials from './pages/Memorials';
import Catalog from './pages/Catalog';
import Extraction from './pages/Extraction';
import Quotes from './pages/Quotes';
import Proposal from './pages/Proposal';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/memorials" element={<Memorials />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/extraction" element={<Extraction />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/proposal" element={<Proposal />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
