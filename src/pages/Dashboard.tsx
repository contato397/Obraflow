import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, Package, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    memorials: 0,
    materials: 0,
    requirements: 0,
    matched: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [mems, mats, reqs] = await Promise.all([
          fetch('/api/memorials').then(res => res.json()),
          fetch('/api/materials').then(res => res.json()),
          fetch('/api/requirements').then(res => res.json())
        ]);
        setStats({
          memorials: mems.length,
          materials: mats.length,
          requirements: reqs.length, 
          matched: reqs.filter((r: any) => r.match_status === 'matched').length
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visão Geral da Obra</h1>
        <p className="text-gray-500 mt-2">Acompanhe o progresso do orçamento e conferência técnica.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Memoriais" 
          value={stats.memorials} 
          icon={FileText} 
          color="blue"
          trend="+2 essa semana"
        />
        <StatCard 
          title="Itens no Catálogo" 
          value={stats.materials} 
          icon={Package} 
          color="green"
          trend="+15 novos itens"
        />
        <StatCard 
          title="Requisitos Extraídos" 
          value={stats.requirements} 
          icon={CheckCircle} 
          color="purple"
          trend="98% confiança"
        />
        <StatCard 
          title="Pendências" 
          value={stats.requirements - stats.matched} 
          icon={AlertTriangle} 
          color="amber"
          trend="Ação necessária"
          alert
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Ver tudo</button>
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 font-medium">Memorial "Residencial Parque.pdf" processado</p>
                    <p className="text-xs text-gray-500 mt-0.5">Há 2 horas • Extração de requisitos concluída</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Package size={120} className="text-white" />
            </div>
            <div className="p-8 relative z-10">
              <h3 className="text-xl font-bold text-white mb-2">Começar Novo Orçamento</h3>
              <p className="text-indigo-200 mb-6 max-w-md">
                Faça o upload do memorial descritivo para iniciar o processo de extração automática e cotação.
              </p>
              <Link 
                to="/memorials"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                Upload Memorial <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Status Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Pipeline</h3>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              <PipelineStep 
                title="Extração de Dados" 
                status="completed" 
                description="Processamento via IA"
              />
              <PipelineStep 
                title="Conferência Técnica" 
                status="current" 
                description="Validação manual pendente"
              />
              <PipelineStep 
                title="Cotação de Preços" 
                status="pending" 
                description="Aguardando validação"
              />
              <PipelineStep 
                title="Geração de Proposta" 
                status="pending" 
                description="Finalização"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dicas Rápidas</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-green-500">✓</span>
                Use PDFs pesquisáveis para melhor extração.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span>
                Cadastre sinônimos no catálogo para matching automático.
              </li>
              <li className="flex gap-2">
                <span className="text-green-500">✓</span>
                Valide os preços sugeridos antes de enviar a proposta.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, alert }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={22} />
        </div>
        {alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-500">
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ title, status, description }: any) {
  const statusColors: any = {
    completed: 'bg-green-500 border-green-500 text-white',
    current: 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50',
    pending: 'bg-white border-gray-300 text-gray-300',
  };

  return (
    <div className="relative pl-8">
      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 ${statusColors[status]}`}>
        {status === 'completed' && <CheckCircle size={10} />}
        {status === 'current' && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
      </div>
      <div>
        <p className={`text-sm font-medium ${status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
