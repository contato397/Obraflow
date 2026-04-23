import React, { useState, useEffect } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Clock, Trash2, Download, History, ArrowRight, X, Layers, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

export default function Memorials() {
  const [memorials, setMemorials] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Versioning States
  const [showHistoryGroupId, setShowHistoryGroupId] = useState<string | null>(null);
  const [groupVersions, setGroupVersions] = useState<any[]>([]);
  const [showCompare, setShowCompare] = useState<{v1: any, v2: any} | null>(null);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMemorials();
  }, []);

  const fetchMemorials = async () => {
    try {
      const res = await fetch('/api/memorials');
      const data = await res.json();
      setMemorials(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVersions = async (groupId: string) => {
    try {
      const res = await fetch(`/api/memorials/${groupId}/versions`);
      const data = await res.json();
      setGroupVersions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, groupId?: string) => {
    if (!e.target.files?.length) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    if (groupId) formData.append('group_id', groupId);

    try {
      const res = await fetch('/api/memorials/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchMemorials();
        if (groupId) await fetchVersions(groupId);
        // Automatically start extraction
        handleExtract(data.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async (id: string) => {
    setProcessingId(id);
    try {
      const contentRes = await fetch(`/api/memorials/${id}/content`);
      const contentData = await contentRes.json();
      
      if (!contentData.success) throw new Error('Failed to fetch memorial content');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        Analyze the following construction memorial text and extract technical requirements for materials.
        Return a JSON array where each item has:
        - section: The section of the document (e.g., "Electrical", "Flooring")
        - description: The generic name of the item (e.g., "Ceramic Tile", "Copper Wire")
        - attributes: A JSON object with specific technical details (e.g., {"voltage": "750V", "color": "white", "standard": "NBR 1234"})
        
        Text:
        ${contentData.content_text.substring(0, 30000)} 
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const responseText = result.text;
      let extractedItems = JSON.parse(responseText || '[]');
      if (!Array.isArray(extractedItems)) extractedItems = [extractedItems];

      const saveRes = await fetch(`/api/memorials/${id}/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: extractedItems })
      });
      
      const saveData = await saveRes.json();
      if (saveData.success) {
        await fetchMemorials();
        if (showHistoryGroupId) await fetchVersions(showHistoryGroupId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivate = async (id: string, groupId: string) => {
    try {
      const res = await fetch(`/api/memorials/${id}/activate`, { method: 'POST' });
      if (res.ok) {
        await fetchMemorials();
        await fetchVersions(groupId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompare = async (v1: any, v2: any) => {
    setComparing(true);
    setComparisonResult(null);
    setShowCompare({ v1, v2 });
    try {
      const res = await fetch(`/api/memorials/compare/${v1.id}/${v2.id}`);
      const data = await res.json();
      if (data.success) {
        const { mem1, mem2, reqs1, reqs2 } = data;
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const prompt = `
          Compare these two versions of a construction memorial document.
          Version A (Original): ${mem1.name} (v${mem1.version})
          Version B (New): ${mem2.name} (v${mem2.version})

          Requirements extracted from A:
          ${JSON.stringify(reqs1.map((r: any) => ({ section: r.section, description: r.description })))}

          Requirements extracted from B:
          ${JSON.stringify(reqs2.map((r: any) => ({ section: r.section, description: r.description })))}

          Provide a summary of:
          1. Main changes in scope (added/removed items).
          2. Technical specification updates.
          3. Critical differences that might affect budget.
          
          Return the result in JSON format with fields: "scope_changes", "tech_updates", "budget_impact", "summary".
        `;

        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        setComparisonResult(JSON.parse(result.text || '{}'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Memoriais Descritivos</h1>
          <p className="text-gray-500 mt-2">Gerencie versões e processe especificações técnicas.</p>
        </div>
        <label className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-all shadow-md active:scale-95 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          <span className="font-medium">Novo Documento</span>
          <input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => handleUpload(e)} disabled={uploading} />
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Versão Ativa</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {memorials.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center">
                    <FileText size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Nenhum memorial cadastrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              memorials.map((mem) => (
                <tr key={mem.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">{mem.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">v{mem.version}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={10} /> {new Date(mem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-700">{mem.original_filename}</span>
                      <span className="text-xs text-indigo-600 font-medium">Ativa</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {mem.status === 'processed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        <CheckCircle size={12} /> Processado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        <AlertCircle size={12} /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setShowHistoryGroupId(mem.group_id); fetchVersions(mem.group_id); }}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Histórico de Versões"
                      >
                        <History size={18} />
                      </button>
                      <label className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer">
                        <Upload size={18} />
                        <input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => handleUpload(e, mem.group_id)} />
                      </label>
                      <button 
                        onClick={() => navigate('/extraction')}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        Visualizar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryGroupId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Histórico de Versões</h2>
                  <p className="text-sm text-gray-500 mt-1">Gerencie as iterações do memorial descritivo.</p>
                </div>
                <button onClick={() => setShowHistoryGroupId(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {groupVersions.map((v, idx) => (
                  <div key={v.id} className={`p-4 rounded-xl border-2 transition-all ${v.is_active ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-lg ${v.is_active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <Layers size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-gray-900">Versão {v.version}</h4>
                            {v.is_active && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded tracking-wider">Ativa</span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{v.original_filename}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1"><Clock size={12}/> {new Date(v.created_at).toLocaleString()}</span>
                            <span className="flex items-center gap-1"><Activity size={12}/> {v.status === 'processed' ? 'Processado' : 'Pendente'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!v.is_active && (
                          <button 
                            onClick={() => handleActivate(v.id, v.group_id)}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
                          >
                            Ativar
                          </button>
                        )}
                        {idx < groupVersions.length - 1 && (
                          <button 
                            onClick={() => handleCompare(groupVersions[idx+1], v)}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                          >
                            Comparar com Anterior
                          </button>
                        )}
                        <a href={`/api/memorials/${v.id}/download`} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompare && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Original</span>
                    <div className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-700 border border-gray-200">v{showCompare.v1.version}</div>
                  </div>
                  <ArrowRight className="text-gray-300 mt-4" size={24} />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Nova Versão</span>
                    <div className="px-4 py-2 bg-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-indigo-100">v{showCompare.v2.version}</div>
                  </div>
                  <div className="ml-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Análise de Diferenças</h2>
                    <p className="text-sm text-gray-500 font-medium">Comparação inteligente via Gemini AI</p>
                  </div>
                </div>
                <button onClick={() => setShowCompare(null)} className="p-3 hover:bg-gray-200 rounded-full transition-all text-gray-500 active:scale-90">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {comparing ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <Layers size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 animate-pulse">Cruzando dados entre versões...</p>
                    <p className="text-sm text-gray-500 max-w-xs text-center">Nossa IA está analisando alterações no escopo, especificações e possíveis impactos no orçamento.</p>
                  </div>
                ) : comparisonResult ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-600 rounded-full"></span> Alterações de Escopo
                        </h3>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 prose prose-indigo max-w-none">
                          <p className="text-gray-700 leading-relaxed font-medium">{comparisonResult.scope_changes}</p>
                        </div>
                      </section>
                      <section>
                        <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-600 rounded-full"></span> Especificações Técnicas
                        </h3>
                        <div className="bg-amber-50/30 rounded-2xl p-6 border border-amber-100 prose prose-amber max-w-none">
                          <p className="text-gray-700 leading-relaxed font-medium">{comparisonResult.tech_updates}</p>
                        </div>
                      </section>
                    </div>
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span> Impacto Financeiro
                        </h3>
                        <div className="bg-red-50/30 rounded-2xl p-6 border border-red-100 prose prose-red max-w-none">
                          <p className="text-gray-700 leading-relaxed font-medium font-bold">{comparisonResult.budget_impact}</p>
                        </div>
                      </section>
                      <section>
                        <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-600 rounded-full"></span> Resumo Executivo
                        </h3>
                        <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100 prose prose-emerald max-w-none">
                          <p className="text-gray-800 leading-relaxed italic">{comparisonResult.summary}</p>
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-red-500 font-bold">Erro ao processar comparação. Tente novamente.</p>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                <button 
                  onClick={() => setShowCompare(null)}
                  className="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Fechar Análise
                </button>
                <button 
                  onClick={() => handleActivate(showCompare.v2.id, showCompare.v2.group_id)}
                  className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Definir v{showCompare.v2.version} como Ativa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
