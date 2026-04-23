import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, Search, ArrowRight, CheckCircle, XCircle, Filter, ChevronRight, Sparkles } from 'lucide-react';

export default function Extraction() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqs, mats] = await Promise.all([
        fetch('/api/requirements').then(res => res.json()),
        fetch('/api/materials').then(res => res.json())
      ]);
      setRequirements(reqs);
      setMaterials(mats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMatch = async (reqId: string, matId: string) => {
    try {
      const res = await fetch(`/api/requirements/${reqId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_id: matId })
      });
      if (res.ok) {
        fetchData();
        setSelectedReq(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Conferência Técnica</h1>
        <p className="text-gray-500 mt-2">Valide os requisitos extraídos e associe aos materiais do catálogo.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Pane: Requirements List */}
        <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                {requirements.filter(r => !r.matched_material_id).length} Pendentes
              </span>
              Requisitos Extraídos
            </h2>
            <button className="text-gray-400 hover:text-gray-600">
              <Filter size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {requirements.map((req) => (
              <div 
                key={req.id}
                onClick={() => setSelectedReq(req)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedReq?.id === req.id 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500' 
                    : req.matched_material_id 
                      ? 'border-green-200 bg-green-50/50 opacity-70 hover:opacity-100' 
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-100">
                    ID: {req.id}
                  </span>
                  {req.matched_material_id ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5"></div>
                  )}
                </div>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">{req.description}</p>
                {req.extracted_attributes?.quantity && (
                  <div className="mt-2 text-xs text-gray-500 flex gap-3">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">Qtd: {req.extracted_attributes.quantity}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">Un: {req.extracted_attributes.unit || 'un'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Matching Interface */}
        <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Associação de Material</h2>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
            {selectedReq ? (
              <>
                <div className="p-6 border-b border-gray-100 bg-indigo-50/30">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Requisito Selecionado</h3>
                  <p className="text-gray-900 font-medium text-lg">{selectedReq.description}</p>
                  <div className="mt-3 flex gap-2">
                    {selectedReq.extracted_attributes?.quantity && (
                      <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600">
                        Quantidade: <strong>{selectedReq.extracted_attributes.quantity} {selectedReq.extracted_attributes.unit || 'un'}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar no catálogo..." 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {filteredMaterials.map((mat) => (
                    <div 
                      key={mat.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded">{mat.code}</span>
                          <span className="font-medium text-gray-900 text-sm">{mat.description}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex gap-2">
                          <span>{mat.family}</span>
                          <span>•</span>
                          <span>{mat.unit}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleMatch(selectedReq.id, mat.id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-700 flex items-center gap-1"
                      >
                        Vincular <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ChevronRight size={32} className="text-gray-300" />
                </div>
                <p className="font-medium text-gray-600">Selecione um requisito ao lado</p>
                <p className="text-sm mt-1 max-w-xs">Clique em um item da lista à esquerda para buscar e associar um material do catálogo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
