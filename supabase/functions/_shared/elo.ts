export type MatchLevel = 'friendly'|'league'|'tournament'|'nationals';

export function kFactor(level: MatchLevel): number {
  switch(level){
    case 'league': return 20;
    case 'tournament': return 24;
    case 'nationals': return 28;
    default: return 16; // friendly
  }
}

// margin multiplier (simple): 1.0 base, +0.1 per games diff cap 1.5, STB adds 0.05
export function marginMultiplier(sets: Array<{t1:number;t2:number;super_tiebreak?:boolean}>): number {
  let games = 0;
  for (const s of sets) games += Math.abs(s.t1 - s.t2);
  const stb = sets.some(s => s.super_tiebreak);
  const mul = 1.0 + Math.min(5, games) * 0.1 + (stb ? 0.05 : 0);
  return Math.min(1.5, mul);
}

export function expectedScore(rA: number, rB: number) {
  return 1 / (1 + Math.pow(10, (rB - rA)/400));
}

export function teamRating(players: Array<{rating:number}>): number {
  if (!players.length) return 1000;
  return players.reduce((a,p)=>a+p.rating,0) / players.length;
}

export function applyElo(rA: number, rB: number, scoreA: 0|1, k: number, margin: number) {
  const expA = expectedScore(rA, rB);
  const deltaA = k * margin * (scoreA - expA);
  return { rA2: rA + deltaA, rB2: rB - deltaA, deltaA };
}
