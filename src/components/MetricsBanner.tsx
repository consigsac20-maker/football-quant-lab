import React from 'react';
import { Target, TrendingUp, ShieldAlert, Cpu } from 'lucide-react';

interface MetricsBannerProps {
  totalMatches: number;
  totalEVOpportunities: number;
  avgExpectedGoals: number;
  avgDataQuality: number;
  filteredCount: number;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({
  totalMatches,
  totalEVOpportunities,
  avgExpectedGoals,
  avgDataQuality,
  filteredCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-medium">Partidos Analizados</span>
          <Cpu className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{filteredCount}</span>
          <span className="text-xs text-slate-500 font-mono">/ {totalMatches} total</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Europa, Perú, Sudamérica, Internacional
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-medium">Oportunidades +EV</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">{totalEVOpportunities}</span>
          <span className="text-xs text-emerald-500/80 font-mono">Ventaja Estadística</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Filtro riguroso: Retorno &gt; +2.0% (+EV)
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-medium">Media Goles Esperados</span>
          <Target className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">{avgExpectedGoals.toFixed(2)}</span>
          <span className="text-xs text-slate-500 font-mono">xG por partido</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Distribución Poisson Bivariada
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-medium">Calidad y Trazabilidad</span>
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-cyan-400">{avgDataQuality.toFixed(1)}%</span>
          <span className="text-xs text-slate-500 font-mono">Índice global</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Cero alucinación • Datos auditados
        </div>
      </div>
    </div>
  );
};
