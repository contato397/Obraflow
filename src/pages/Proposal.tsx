import React from 'react';
import { FileOutput, Download, Printer, Share2, FileText, CheckCircle } from 'lucide-react';

export default function Proposal() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Proposta Comercial</h1>
          <p className="text-gray-500 mt-2">Gere e exporte a proposta final com base nos custos cotados.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm">
            <Printer size={18} />
            <span>Imprimir</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
            <Download size={18} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview Area */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Visualização da Proposta</span>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </div>
          <div className="flex-1 p-12 bg-gray-50 overflow-y-auto">
            <div className="bg-white shadow-lg mx-auto max-w-2xl min-h-[800px] p-12 relative">
              {/* Document Header */}
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">PROPOSTA COMERCIAL</h2>
                  <p className="text-gray-500 mt-1">#PROP-2024-001</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-indigo-600 text-xl">ObraFlow</h3>
                  <p className="text-sm text-gray-500">Soluções em Engenharia</p>
                  <p className="text-sm text-gray-500">São Paulo, SP</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="mb-12 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h4>
                <p className="font-bold text-gray-900">Construtora Exemplo Ltda.</p>
                <p className="text-sm text-gray-600">Av. Paulista, 1000 - São Paulo/SP</p>
                <p className="text-sm text-gray-600">CNPJ: 00.000.000/0001-00</p>
              </div>

              {/* Items Table */}
              <div className="mb-12">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="py-2 text-xs font-bold text-gray-500 uppercase">Item</th>
                      <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right">Qtd</th>
                      <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right">Unit.</th>
                      <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="py-3 text-sm text-gray-900">Cimento Portland CP II-Z 32</td>
                      <td className="py-3 text-sm text-gray-600 text-right">500 sc</td>
                      <td className="py-3 text-sm text-gray-600 text-right">R$ 32,50</td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">R$ 16.250,00</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm text-gray-900">Areia Média Lavada</td>
                      <td className="py-3 text-sm text-gray-600 text-right">20 m³</td>
                      <td className="py-3 text-sm text-gray-600 text-right">R$ 120,00</td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">R$ 2.400,00</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm text-gray-900">Tijolo Cerâmico 9x19x19</td>
                      <td className="py-3 text-sm text-gray-600 text-right">5.000 un</td>
                      <td className="py-3 text-sm text-gray-600 text-right">R$ 1,80</td>
                      <td className="py-3 text-sm font-medium text-gray-900 text-right">R$ 9.000,00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-100">
                      <td colSpan={3} className="py-4 text-right font-bold text-gray-900">Total Geral</td>
                      <td className="py-4 text-right font-bold text-indigo-600 text-lg">R$ 27.650,00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div className="absolute bottom-12 left-12 right-12 text-center text-xs text-gray-400">
                <p>Este documento é uma proposta comercial válida por 15 dias.</p>
                <p>Gerado automaticamente por ObraFlow.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Pane */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Modelo de Proposta</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option>Padrão Corporativo</option>
                  <option>Simples</option>
                  <option>Detalhado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Margem de Lucro (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    defaultValue={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Impostos (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    defaultValue={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Checklist de Validação</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Todos os itens cotados</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Margem mínima atingida</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle size={16} className="text-green-500" />
                <span>Dados do cliente completos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
