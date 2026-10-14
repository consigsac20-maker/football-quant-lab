import React from 'react';
import { Database, Calculator, Layers, Key, Activity, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenProviders: () => void;
  onOpenSimulator: () => void;
  onOpenMethodology: () => void;
  onOpenApiKey: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  apiStatus: 'live' | 'mock';
  matchCount: number;
  evCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProviders,
  onOpenSimulator,
  onOpenMethodology,
  onOpenApiKey,
  onRefreshData,
  isRefreshing = false,
  apiStatus,
  matchCount,
  evCount,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white font-mono">
                FOOTBALL QUANT LAB
              </span>
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                v2.0 API-Football
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Análisis Estadístico Cuantitativo • De-Margining • Detección +EV
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Badge de Estado: API-Football En Vivo vs Modo Mock (150 Partidos) */}
          <button
            onClick={onOpenApiKey}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-medium border transition-colors ${
              apiStatus === 'live'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full animate-ping mr-0.5" style={{ backgroundColor: apiStatus === 'live' ? '#34d399' : '#f59e0b' }} />
            <span>{apiStatus === 'live' ? '🟢 API-Football En Vivo' : '🟡 Modo Mock (Ligas Autorizadas)'}</span>
          </button>

          {/* Botón interactivo: Actualizar Datos en Vivo */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium font-mono border transition-all ${
                isRefreshing
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 cursor-wait'
                  : 'bg-slate-900 border-cyan-700/60 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400 shadow-sm'
              }`}
              title="Limpia caché de fechas pasadas, consulta API-Football para los 3 días y recalcula el modelo"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{isRefreshing ? 'Actualizando...' : '🔄 Actualizar Datos'}</span>
            </button>
          )}

          {/* Botón Configurar API Key */}
          <button
            onClick={onOpenApiKey}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Configurar</span> API
          </button>

          <button
            onClick={onOpenProviders}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">Matriz de</span> Proveedores
          </button>

          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulador +EV</span>
            {evCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {evCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenMethodology}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Metodología</span>
          </button>
        </div>
      </div>
    </header>
  );
};
