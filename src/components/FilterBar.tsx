import React from 'react';
import { Search, Sparkles, Filter, AlertTriangle, ShieldCheck, Flame, Compass, Calendar, ArrowUpDown } from 'lucide-react';
import { CompetitionGroup } from '../types/football';

export type SmartFilterType = 'all' | 'high_consistency' | 'high_goals' | 'positive_ev' | 'abstention';
export type DateFilterType = 'all' | 'today' | 'tomorrow' | 'in2days';
export type SortByType = 'probability' | 'goals' | 'ev';

interface FilterBarProps {
  selectedGroup: CompetitionGroup | 'Todos';
  onSelectGroup: (group: CompetitionGroup | 'Todos') => void;
  selectedDate: DateFilterType;
  onSelectDate: (date: DateFilterType) => void;
  smartFilter: SmartFilterType;
  onSelectSmartFilter: (filter: SmartFilterType) => void;
  sortBy: SortByType;
  onSelectSortBy: (sort: SortByType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  evCount: number;
  dateCounts: { all: number; today: number; tomorrow: number; in2days: number };
  dynamicDates?: { today: string; tomorrow: string; in2days: string };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedGroup,
  onSelectGroup,
  selectedDate,
  onSelectDate,
  smartFilter,
  onSelectSmartFilter,
  sortBy,
  onSelectSortBy,
  searchQuery,
  onSearchChange,
  evCount,
  dateCounts,
  dynamicDates,
}) => {
  const groups: Array<CompetitionGroup | 'Todos'> = ['Todos', 'Europa', 'Perú', 'Sudamérica'];

  const formatShort = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const day = parts[2];
        const mIdx = parseInt(parts[1], 10) - 1;
        return ` • ${day} ${monthNames[mIdx] || ''}`;
      }
    } catch {}
    return '';
  };

  const dateOptions: Array<{ id: DateFilterType; label: string; count: number }> = [
    { id: 'all', label: 'Todos', count: dateCounts.all },
    { id: 'today', label: `Hoy${formatShort(dynamicDates?.today)}`, count: dateCounts.today },
    { id: 'tomorrow', label: `Mañana${formatShort(dynamicDates?.tomorrow)}`, count: dateCounts.tomorrow },
    { id: 'in2days', label: `En 2 días${formatShort(dynamicDates?.in2days)}`, count: dateCounts.in2days },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 space-y-3.5 backdrop-blur-sm">
      {/* Fila 1: Búsqueda, Selector de Fecha y Ordenamiento */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por equipo, estadio o competición..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Selector de Fecha Exacto [Todos (150)] | [Hoy (50)] | [Mañana (50)] | [En 2 días (50)] */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none font-mono">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            Fecha:
          </span>
          {dateOptions.map((opt) => {
            const isActive = selectedDate === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectDate(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white border border-blue-500 shadow-sm font-bold'
                    : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {opt.label} ({opt.count})
              </button>
            );
          })}
        </div>

        {/* Selector de Ordenamiento por Grado de Certeza */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            Orden:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSelectSortBy(e.target.value as SortByType)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="probability">Mayor Probabilidad Primero</option>
            <option value="goals">Mayor Potencial de Goles (xG)</option>
            <option value="ev">Mayor Valor (+EV)</option>
          </select>
        </div>
      </div>

      {/* Fila 2: Filtro Geográfico y Smart Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pt-2 border-t border-slate-800/80">
        {/* Grupos Geográficos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none font-mono">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            Región:
          </span>
          {groups.map((group) => {
            const isActive = selectedGroup === group;
            return (
              <button
                key={group}
                onClick={() => onSelectGroup(group)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>

        {/* Smart Filters Cuantitativos */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none font-mono">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3 text-slate-500" />
            Filtro:
          </span>

          <button
            onClick={() => onSelectSmartFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              smartFilter === 'all'
                ? 'bg-slate-800 border border-slate-600 text-white font-semibold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => onSelectSmartFilter('high_consistency')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              smartFilter === 'high_consistency'
                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Consistencia Alta (P ≥ 75%)</span>
          </button>

          <button
            onClick={() => onSelectSmartFilter('high_goals')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              smartFilter === 'high_goals'
                ? 'bg-amber-500/20 border border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Goleadas / High xG (≥ 2.80)</span>
          </button>

          <button
            onClick={() => onSelectSmartFilter('positive_ev')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              smartFilter === 'positive_ev'
                ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Posibles +EV ({evCount})</span>
          </button>

          <button
            onClick={() => onSelectSmartFilter('abstention')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              smartFilter === 'abstention'
                ? 'bg-rose-500/20 border border-rose-500 text-rose-300 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Incertidumbre</span>
          </button>
        </div>
      </div>
    </div>
  );
};
