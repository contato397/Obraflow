import React, { useState } from 'react';
import { Search, ExternalLink, Loader2, DollarSign, Calendar, ShoppingCart, ArrowRight, AlertCircle, TrendingDown } from 'lucide-react';

import { GoogleGenAI } from '@google/genai';

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);

  React.useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const res = await fetch('/api/requirements/pending');
      const data = await res.json();
      setBudgetItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchTerm(query);
    setSearching(true);
    setResults([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Pesquise o preço médio de mercado no Brasil para o seguinte material de construção: "${query}".
        Retorne uma lista de 3 a 5 ofertas encontradas com:
        - Nome do fornecedor
        - Preço unitário (apenas o número)
        - Data da oferta (se disponível, ou "Recente")
        - Link da fonte (se disponível)
        
        Formate a resposta EXCLUSIVAMENTE como um array JSON, sem markdown, onde cada item tem:
        {
          "supplier": "Nome",
          "price": 0.00,
          "date": "Data",
          "link": "URL"
        }
      `;

      const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text;
      let parsedResults = JSON.parse(responseText || '[]');
      if (!Array.isArray(parsedResults)) {
        parsedResults = [parsedResults];
      }

      // Extract grounding metadata if available to enrich links
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      // If the model didn't return links in the JSON, try to map from grounding chunks
      // This is a best-effort mapping
      if (groundingChunks) {
         parsedResults.forEach((p: any, index: number) => {
            if (!p.link && groundingChunks[index]?.web?.uri) {
               p.link = groundingChunks[index].web.uri;
            }
         });
      }

      setResults(parsedResults);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cotação de Preços</h1>
        <p className="text-gray-500 mt-2">Pesquise preços de mercado em tempo real usando IA.</p>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Left Pane: Items to Quote */}
        <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <ShoppingCart size={18} />
              Itens Pendentes
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {budgetItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhum item pendente encontrado.
              </div>
            ) : (
              budgetItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleSearch(item.description)}
                  className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 line-clamp-2">{item.description}</p>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    {item.extracted_attributes?.quantity && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        Qtd: {item.extracted_attributes.quantity} {item.extracted_attributes.unit || 'un'}
                      </span>
                    )}
                    <span className="bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px]">{item.memorial_name || 'Memorial'}</span>
                    <span className="text-gray-400">•</span>
                    <span>{item.section}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Search & Results */}
        <div className="w-2/3 flex flex-col gap-6">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar preço de material (ex: Cimento CP II 50kg)..." 
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
              />
              <button 
                onClick={() => handleSearch(searchTerm)}
                disabled={searching}
                className="absolute right-2 px-4 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {searching ? 'Buscando...' : 'Pesquisar'}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Powered by Google Search Grounding
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto">
            {searching ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                <p className="font-medium">Pesquisando preços no mercado...</p>
                <p className="text-sm mt-1">Isso pode levar alguns segundos.</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-semibold text-gray-900">Resultados para "{searchTerm}"</h3>
                  <span className="text-sm text-gray-500">{results.length} ofertas encontradas</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((res, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide bg-indigo-50 px-2 py-0.5 rounded">
                            {res.supplier || 'Fornecedor Desconhecido'}
                          </span>
                          {res.date && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={12} /> {res.date}
                            </span>
                          )}
                        </div>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">
                            R$ {res.price?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 mt-auto">
                        <a 
                          href={res.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors group"
                        >
                          Ver Oferta <ExternalLink size={14} className="group-hover:text-indigo-600" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800 text-sm mt-6">
                  <AlertCircle size={20} className="shrink-0" />
                  <p>
                    <strong>Atenção:</strong> Os preços exibidos são estimativas baseadas em resultados de busca pública. 
                    Sempre confirme os valores e a disponibilidade diretamente com o fornecedor antes de fechar negócio.
                  </p>
                </div>
              </div>
            ) : searchTerm && !searching ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-gray-400" />
                </div>
                <p className="font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm mt-1">Tente refinar sua busca com termos mais específicos.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <TrendingDown size={40} className="text-indigo-200" />
                </div>
                <p className="font-medium text-lg text-gray-600">Comece a Cotar</p>
                <p className="text-sm mt-2 max-w-md text-center">
                  Selecione um item da lista à esquerda ou digite o nome do material na barra de busca para encontrar os melhores preços.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
