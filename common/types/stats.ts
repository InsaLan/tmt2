export interface IPlayerStats {
	steamId: string;
	name: string;
	kills: number;
	deaths: number;
	assists: number;
	hits: number;
	headshots: number;
	rounds: number;
	damages: number;
	kd?: number;
	hsPct?: number;
	adr?: number;
	map?: string;
	matchId?: string;
}

export interface IMatchStats {
	matchId: string;
	teamA: string;
	teamAScore: number;
	teamB: string;
	teamBScore: number;
	timestamp: Date;
}

export interface IMatchMapStats {
	matchId: string;
	map: string;
	teamA: string;
	teamAScore: number;
	teamB: string;
	teamBScore: number;
	timestamp: Date;
}
