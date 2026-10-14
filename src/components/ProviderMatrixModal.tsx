import React from 'react';
import { X, Database, Check, AlertCircle, ShieldCheck } from 'lucide-react';

interface ProviderMatrixModalProps {
  onClose: () => void;
}

export const ProviderMatrixModal: React.FC<ProviderMatrixModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Matriz Comparativa de Proveedores Deportivos (FASE 2)
              </h2>
              <p className="text-[11px] text-slate-400">
                Auditoría técnica de cobertura, costes, límites, xG y viabilidad para Backtesting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabla Comparativa */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-white font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Estrategia de Selección Recomendada</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Para un uso personal durante un mes con cobertura de <strong>Europa, Perú (Liga 1) y Sudamérica</strong>, <strong className="text-emerald-400">API-Football (API-Sports)</strong> es la única opción con cobertura integral de Liga 1 Perú y torneos CONMEBOL. Football-data.org es excelente pero no incluye Sudamérica en tier gratuito.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border border-slate-800">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="p-2.5">Criterio</th>
                  <th className="p-2.5 text-blue-400">API-Football (API-Sports)</th>
                  <th className="p-2.5 text-emerald-400">football-data.org</th>
                  <th className="p-2.5 text-purple-400">Sportmonks</th>
                  <th className="p-2.5 text-amber-400">OpenLigaDB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">1. Precio Mensual</td>
                  <td className="p-2.5">Gratis (Free) / €39 Pro</td>
                  <td className="p-2.5">Gratis / €19-€59</td>
                  <td className="p-2.5">Desde €19 / mes</td>
                  <td className="p-2.5 text-emerald-400 font-bold">100% Gratuito</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">2. Rate Limits</td>
                  <td className="p-2.5">100 req/día (Free) / 10 req/s</td>
                  <td className="p-2.5">10 req/min (Free)</td>
                  <td className="p-2.5">Según plan (300 req/min)</td>
                  <td className="p-2.5">Sin límite estricto razonable</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">3. Cobertura Europa</td>
                  <td className="p-2.5 text-emerald-400">Completa (Todas)</td>
                  <td className="p-2.5 text-emerald-400">Top 12 ligas (Gratis)</td>
                  <td className="p-2.5 text-emerald-400">Completa</td>
                  <td className="p-2.5 text-amber-400">Solo Alemania / Austria</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">4. Cobertura Perú (Liga 1)</td>
                  <td className="p-2.5 text-emerald-400 font-bold">✓ Sí (Apertura/Clausura)</td>
                  <td className="p-2.5 text-rose-400">✗ No disponible</td>
                  <td className="p-2.5 text-amber-400">✓ Solo add-on extra</td>
                  <td className="p-2.5 text-rose-400">✗ No disponible</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">5. Cobertura Sudamérica</td>
                  <td className="p-2.5 text-emerald-400 font-bold">✓ Libertadores, Sudam., Brasil, Arg.</td>
                  <td className="p-2.5 text-rose-400">✗ Solo plan de pago</td>
                  <td className="p-2.5 text-emerald-400">✓ Amplia</td>
                  <td className="p-2.5 text-rose-400">✗ No disponible</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">6. Historial Temporadas</td>
                  <td className="p-2.5">10+ años</td>
                  <td className="p-2.5">3-5 años</td>
                  <td className="p-2.5">15+ años</td>
                  <td className="p-2.5">Desde 2005 (Bundesliga)</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">7. xG y Métricas Avanzadas</td>
                  <td className="p-2.5 text-amber-400">En partidos principales</td>
                  <td className="p-2.5 text-rose-400">No nativo</td>
                  <td className="p-2.5 text-emerald-400 font-bold">Excelente (xG nativo)</td>
                  <td className="p-2.5 text-rose-400">No</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">8. Cuotas Prematch</td>
                  <td className="p-2.5 text-emerald-400">✓ Sí (15+ casas)</td>
                  <td className="p-2.5 text-rose-400">✗ No incluidas</td>
                  <td className="p-2.5 text-emerald-400">✓ Sí (Amplitud de casas)</td>
                  <td className="p-2.5 text-rose-400">✗ No</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">9. Cuotas de Cierre (Closing)</td>
                  <td className="p-2.5 text-amber-400">Limitado en plan free</td>
                  <td className="p-2.5 text-rose-400">No</td>
                  <td className="p-2.5 text-emerald-400 font-bold">✓ Sí (Ideal para CLV)</td>
                  <td className="p-2.5 text-rose-400">No</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">10. Lesiones / Alineaciones</td>
                  <td className="p-2.5 text-emerald-400">✓ Confirmadas ~45min antes</td>
                  <td className="p-2.5 text-amber-400">Solo alineaciones</td>
                  <td className="p-2.5 text-emerald-400">✓ Completas</td>
                  <td className="p-2.5 text-rose-400">Básicas</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-white">11. Apto para Backtesting</td>
                  <td className="p-2.5 text-emerald-400 font-bold">Alto (Con caché local)</td>
                  <td className="p-2.5 text-amber-400">Medio (Solo Europa)</td>
                  <td className="p-2.5 text-emerald-400 font-bold">Muy Alto</td>
                  <td className="p-2.5 text-rose-400">Bajo (Solo Alemania)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg text-slate-400 text-[11px] space-y-1">
            <span className="text-white font-bold">Conclusión Técnica:</span>
            <p>
              Para iniciar sin desembolso financiero y validar el motor cuantitativo durante el primer mes, la arquitectura debe operar en modo híbrido:
              1. <strong>MockDataProvider Calibrado</strong> (Modo actual verificado con 15 partidos).
              2. Conector universal <code>IDataProvider</code> listo para enchufar el API Key de API-Football cuando el usuario decida activarlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
