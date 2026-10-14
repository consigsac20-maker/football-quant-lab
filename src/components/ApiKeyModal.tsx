import React, { useState } from 'react';
import { X, Key, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, resetStoredApiKey, DEFAULT_API_KEY, fetchFixturesForDate } from '../services/apiFootball';

interface ApiKeyModalProps {
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onKeyUpdated }) => {
  const [apiKey, setApiKey] = useState<string>(getStoredApiKey());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  const handleSave = () => {
    setStoredApiKey(apiKey);
    onKeyUpdated();
    setTestStatus('success');
    setTestMessage('Clave guardada exitosamente en el navegador (localStorage).');
  };

  const handleReset = () => {
    resetStoredApiKey();
    setApiKey(DEFAULT_API_KEY);
    onKeyUpdated();
    setTestStatus('idle');
    setTestMessage('Restablecida a la clave predeterminada del Quant Lab.');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Comprobando conexión con v3.football.api-sports.io...');
    try {
      // Guardar clave temporalmente para la prueba
      setStoredApiKey(apiKey);
      const todayStr = '2026-10-13';
      const result = await fetchFixturesForDate(todayStr);

      setTestStatus('success');
      if (result.quota) {
        setRemainingQuota(result.quota.remaining);
        setTestMessage(
          `¡Conexión Exitosa! Quedan ${result.quota.remaining} de ${result.quota.limit} consultas hoy.`
        );
      } else {
        setTestMessage(
          `¡Conexión Exitosa! ${result.fixtures.length} partidos devueltos ${
            result.fromCache ? '(desde caché local)' : '(en vivo de API)'
          }.`
        );
      }
      onKeyUpdated();
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Error de conexión: ${err.message || 'No se pudo contactar a API-Football'}`);
    }
  };

  const handleClearCache = () => {
    try {
      const keys = Object.keys(localStorage);
      let count = 0;
      keys.forEach((k) => {
        if (k.startsWith('fixtures_')) {
          localStorage.removeItem(k);
          count++;
        }
      });
      alert(`Se eliminaron ${count} archivos de caché en localStorage.`);
      onKeyUpdated();
    } catch (e) {
      console.warn('Error limpiando caché:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-mono text-xs">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurar API Key (API-Football)</h2>
              <p className="text-[11px] text-slate-400">v3.football.api-sports.io • Persistencia en localStorage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 text-xs">
              Tu Clave de API-Football (`x-apisports-key`):
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pega aquí tu API Key de API-Football..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Clave predeterminada precargada. Puedes cambiarla por la tuya personal en cualquier momento.
            </p>
          </div>

          {/* Estado de la prueba */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-lg border flex items-start space-x-2 text-[11px] ${
                testStatus === 'testing'
                  ? 'bg-blue-950/30 border-blue-500/30 text-blue-300'
                  : testStatus === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}
            >
              {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {testStatus === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <div>
                <span className="font-bold">
                  {testStatus === 'testing' ? 'Verificando...' : testStatus === 'success' ? 'Verificado:' : 'Atención:'}
                </span>{' '}
                {testMessage}
              </div>
            </div>
          )}

          {/* Información de Ahorro de Quota */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-400 text-[11px]">
            <div className="text-white font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Regla Estricta de Ahorro de Cuota:</span>
            </div>
            <p>
              • Cada fecha consultada (Hoy, Mañana, En 2 días) se guarda en <code>localStorage</code> durante <strong>12 horas</strong>.
            </p>
            <p>
              • Navegar, filtrar o recargar la aplicación <strong>NO consume solicitudes adicionales</strong>. Máximo 3 consultas al día de las 100 del tier gratuito.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
              <span>Probar Conexión</span>
            </button>

            <button
              onClick={handleSave}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar Clave</span>
            </button>
          </div>

          {/* Botones secundarios */}
          <div className="flex justify-between items-center pt-2 text-[11px] text-slate-500">
            <button
              onClick={handleReset}
              className="hover:text-slate-300 underline"
            >
              Restablecer Predeterminada
            </button>
            <button
              onClick={handleClearCache}
              className="hover:text-rose-400 flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar Caché Local</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
