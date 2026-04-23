import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Save, Package, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';

export default function Catalog() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    code: '',
    description: '',
    unit: '',
    family: '',
    attributes: {},
    rules: {},
    logistics: {},
    fiscal: {}
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/materials');
      const data = await res.json();
      setMaterials(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchMaterials();
        setNewMaterial({
          code: '',
          description: '',
          unit: '',
          family: '',
          attributes: {},
          rules: {},
          logistics: {},
          fiscal: {}
        });
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catálogo de Materiais</h1>
          <p className="text-gray-500 mt-2">Gerencie os itens padronizados e suas especificações técnicas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          <span>Novo Item</span>
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por código, descrição ou família..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-2.5 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-50 bg-white shadow-sm font-medium">
          <Filter size={18} />
          <span>Filtros</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Família</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidade</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Especificações</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Package size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhum item encontrado</h3>
                    <p className="text-gray-500 mt-1">Tente ajustar sua busca ou adicione um novo item.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">
                        {mat.code}
                      </div>
                      <span className="font-medium text-gray-900">{mat.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {mat.family}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{mat.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(mat.attributes).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200">
                          <span className="font-medium mr-1">{k}:</span> {String(v)}
                        </span>
                      ))}
                      {Object.keys(mat.attributes).length > 3 && (
                        <span className="text-xs text-gray-400 self-center">+{Object.keys(mat.attributes).length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Novo Item de Catálogo</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Código Interno</label>
                  <input 
                    type="text" 
                    placeholder="Ex: MAT-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={newMaterial.code}
                    onChange={e => setNewMaterial({...newMaterial, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Família</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Elétrica"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={newMaterial.family}
                    onChange={e => setNewMaterial({...newMaterial, family: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição Completa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cabo Flexível 2.5mm² 750V Preto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={newMaterial.description}
                  onChange={e => setNewMaterial({...newMaterial, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidade de Medida</label>
                  <input 
                    type="text" 
                    placeholder="Ex: m, kg, un"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={newMaterial.unit}
                    onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}
                  />
                </div>
              </div>
              {/* Simplified attributes input for demo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Atributos Técnicos (JSON)</label>
                <div className="relative">
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm bg-gray-50"
                    rows={4}
                    placeholder='{"cor": "branco", "voltagem": "220V"}'
                    onChange={e => {
                      try {
                        setNewMaterial({...newMaterial, attributes: JSON.parse(e.target.value)});
                      } catch (err) {
                        // ignore parse error while typing
                      }
                    }}
                  />
                  <div className="absolute top-2 right-2 text-xs text-gray-400">JSON</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Insira os atributos técnicos em formato JSON válido.</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition-all font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreate}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm hover:shadow transition-all font-medium"
              >
                <Save size={18} />
                Salvar Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
