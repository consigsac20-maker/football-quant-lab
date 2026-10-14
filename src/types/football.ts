export type CompetitionGroup = 'Europa' | 'Perú' | 'Sudamérica' | 'Internacional';

export type VerificationStatus = 'Verificado' | 'Estimado' | 'No Verificado' | 'Datos Insuficientes';

export interface DataQuality {
  completenessScore: number; // 0 a 100
  sampleSize: number; // Partidos históricos analizados
  verificationStatus: VerificationStatus;
  isMock: boolean;
  dataSource: string;
  capturedAt: string;
  missingFields: string[];
}

export interface TeamStats {
  name: string;
  shortName: string;
  attackStrength: number; // Ratio vs media liga (ej. 1.25 = 25% más ofensivo que media)
  defenseStrength: number; // Ratio vs media liga (ej. 0.85 = recibe 15% menos goles que media)
  xgPer90: number;
  xgaPer90: number;
  recentForm: ('W' | 'D' | 'L')[];
  restDays: number;
  rank?: number;
  keyAbsences?: string[];
}

export interface MarketOdds {
  hasRealOdds: boolean;
  homeWin: number | null;
  draw: number | null;
  awayWin: number | null;
  over15: number | null;
  under15: number | null;
  over25: number | null;
  under25: number | null;
  bttsYes: number | null;
  bttsNo: number | null;
  bookmaker: string;
  timestamp: string;
  overround1X2: number | null; // Margen de la casa en % o null
}

export interface ContextFactors {
  weatherCondition?: string;
  temperatureC?: number;
  altitudeMeters?: number; // Clave para Liga 1 (Cusco, Huancayo) y Eliminatorias (La Paz, Quito)
  derbyMatch: boolean;
  refereeStrictness?: 'Baja' | 'Media' | 'Alta';
  tacticalNotes?: string;
}

export interface MatchScore {
  homeGoals: number | null;
  awayGoals: number | null;
  statusShort: string; // 'FT', 'NS', '1H', '2H', 'HT', 'AET', 'PEN', etc.
  statusLong?: string;
  elapsed?: number | null;
}

export interface FootballMatch {
  id: string;
  competition: string;
  competitionGroup: CompetitionGroup;
  season: string;
  kickoffDate: string;
  venue: string;
  status: 'Programado' | 'En Vivo' | 'Finalizado';
  actualScore?: MatchScore;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  leagueAverages: {
    avgHomeGoals: number;
    avgAwayGoals: number;
    avgTotalGoals: number;
  };
  odds: MarketOdds;
  context: ContextFactors;
  dataQuality: DataQuality;
}

export interface MarketEvaluation {
  marketName: string;
  selection: string;
  modelProbability: number; // 0 a 1
  fairOdds: number; // 1 / modelProbability (Cuota Justa del Modelo)
  marketOdds: number | null; // Cuota bookmaker o null si pendiente
  marketImpliedProb: number | null; // 1 / marketOdds
  demarginedProb: number | null; // Probabilidad de mercado sin overround
  expectedValue: number | null; // (modelProbability * marketOdds) - 1
  expectedValuePercent: number | null; // EV en %
  isPositiveEV: boolean;
  hasMarketOdds: boolean;
  isHighDiscrepancy?: boolean; // Diferencia entre P_modelo e Implicita > 35%
  evRobustness: 'Fuerte' | 'Moderado' | 'Incierto' | 'Sin Valor' | 'Cuota Pendiente';
}

export interface KeyForecast {
  primary: { label: string; prob: number };
  secondary?: { label: string; prob: number };
}

export interface PoissonOutput {
  lambdaHome: number; // Goles esperados local
  lambdaAway: number; // Goles esperados visitante
  totalExpectedGoals: number;
  scoreMatrix: number[][]; // [golesLocal][golesVisitante] hasta 7x7
  topScores: { score: string; prob: number; homeGoals: number; awayGoals: number }[];
  projectedScore: { score: string; prob: number; homeGoals: number; awayGoals: number };
  top3Scores: { score: string; prob: number; homeGoals: number; awayGoals: number }[];
  keyForecast: KeyForecast;
  probHomeWin: number;
  probDraw: number;
  probAwayWin: number;
  probOver05?: number;
  probUnder05?: number;
  probOver15: number;
  probUnder15: number;
  probOver25: number;
  probUnder25: number;
  probOver35: number;
  probUnder35: number;
  probOver45?: number;
  probUnder45?: number;
  probBTTSYes: number;
  probBTTSNo: number;
  prob1X: number; // Doble oportunidad
  probX2: number;
  prob12: number;
  probOver05_1H?: number; // Goles en el primer tiempo (1T)
  probOver75Corners?: number; // Tiros de esquina (+7.5)
  probOver85Corners?: number; // Tiros de esquina (+8.5)
  expectedCorners?: number; // Córners esperados
  dixonColesRho: number; // Factor de corrección bivariada de marcadores bajos
  evaluations: MarketEvaluation[];
  uncertaintyLevel: 'Baja' | 'Moderada' | 'Alta' | 'Abstención Recomendada';
  abstainReason?: string;
}

export interface AlgorithmicSelection {
  matchId: string;
  competition: string;
  matchTitle: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffDate: string;
  marketName: string;
  selection: string;
  modelProb: number;
  marketOdds: number;
  expectedValuePercent: number;
  status?: 'Programado' | 'En Vivo' | 'Finalizado';
  actualScore?: MatchScore;
}

export interface AlgorithmicParlay {
  id: string;
  name: string;
  title?: string;
  badge: string;
  badgeText?: string;
  accentColor: string;
  description: string;
  selections: AlgorithmicSelection[];
  totalOdds: number;
  jointProbability: number;
  expectedValue: number;
  riskLevel?: 'Ultra-Bajo' | 'Bajo' | 'Moderado' | 'Alto' | 'Extremo';
  status?: 'pending' | 'won' | 'lost' | 'live';
  wonCount?: number;
  lostCount?: number;
  liveCount?: number;
}

