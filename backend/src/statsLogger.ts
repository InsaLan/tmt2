import { SqlAttribute, TableSchema } from './tableSchema';
import { createTableDB, flushDB, insertDB, queryDB, updateDB } from './storage';
import { IMatch, IMatchMap, IMatchMapStats } from '../../common';
import { IPlayerStats, IMatchStats } from '../../common';
import NodeCache from 'node-cache';

// A big thank you to Eliot, Fabien, Quentin and Julien for helping me test this module !

export const PLAYERS_TABLE = 'players';
export const MATCH_MAPS_TABLE = 'matchMaps';
export const MATCHES_TABLE = 'matches';
export const PLAYER_MAP_STATS_TABLE = 'playerMapStats';
export const TEAMS_TABLE = 'teams';

export const setup = () => {
	// Create players global stats table
	const playersAttributes = [
		{ name: 'steamId', type: 'TEXT' },
		{ name: 'name', type: 'TEXT' },
		{ name: 'tKills', type: 'INTEGER' },
		{ name: 'tDeaths', type: 'INTEGER' },
		{ name: 'tAssists', type: 'INTEGER' },
		{ name: 'tHits', type: 'INTEGER' },
		{ name: 'tHeadshots', type: 'INTEGER' },
		{ name: 'tRounds', type: 'INTEGER' },
		{ name: 'tDamages', type: 'INTEGER' },
	] as SqlAttribute[];
	const playersTableSchema = new TableSchema(PLAYERS_TABLE, playersAttributes, ['steamId']);
	createTableDB(playersTableSchema);

	// Create match map table
	const matchMapsAttributes = [
		{ name: 'matchId', type: 'TEXT' },
		{ name: 'map', type: 'TEXT' },
		{ name: 'teamA', type: 'TEXT' },
		{ name: 'teamAScore', type: 'INTEGER' },
		{ name: 'teamB', type: 'TEXT' },
		{ name: 'teamBScore', type: 'INTEGER' },
		{
			name: 'timestamp',
			type: 'TIMESTAMP',
			constraints: 'DEFAULT CURRENT_TIMESTAMP',
		},
	] as SqlAttribute[];
	const matchMapsTableSchema = new TableSchema(MATCH_MAPS_TABLE, matchMapsAttributes, [
		'matchId',
		'map',
	]);
	createTableDB(matchMapsTableSchema);

	// Create matches table
	const matchesAttributes = [
		{ name: 'matchId', type: 'TEXT' },
		{ name: 'teamA', type: 'TEXT' },
		{ name: 'teamAScore', type: 'INTEGER' },
		{ name: 'teamB', type: 'TEXT' },
		{ name: 'teamBScore', type: 'INTEGER' },
		{
			name: 'timestamp',
			type: 'TIMESTAMP',
			constraints: 'DEFAULT CURRENT_TIMESTAMP',
		},
	] as SqlAttribute[];
	const matchesTableSchema = new TableSchema(MATCHES_TABLE, matchesAttributes, ['matchId']);
	createTableDB(matchesTableSchema);

	//Create teams table
	const teamsAttributes = [
		{ name: 'teamName', type: 'TEXT' },
		{
			name: 'steamId',
			type: 'TEXT',
			constraints: `REFERENCES ${PLAYERS_TABLE}(steamId)`,
		},
	] as SqlAttribute[];
	const teamsTableSchema = new TableSchema(TEAMS_TABLE, teamsAttributes, ['teamName', 'steamId']);
	createTableDB(teamsTableSchema);

	// Create player match stats table
	const playerMapStatsAttributes = [
		{
			name: 'steamId',
			type: 'TEXT',
			constraints: `REFERENCES ${PLAYERS_TABLE}(steamId)`,
		},
		{
			name: 'matchId',
			type: 'TEXT',
			constraints: `REFERENCES ${MATCHES_TABLE}(matchId)`,
		},
		{ name: 'map', type: 'TEXT' },
		{ name: 'kills', type: 'INTEGER' },
		{ name: 'deaths', type: 'INTEGER' },
		{ name: 'assists', type: 'INTEGER' },
		{ name: 'hits', type: 'INTEGER' },
		{ name: 'headshots', type: 'INTEGER' },
		{ name: 'rounds', type: 'INTEGER' },
		{ name: 'damages', type: 'INTEGER' },
	] as SqlAttribute[];
	const playerMapStatsTableSchema = new TableSchema(
		PLAYER_MAP_STATS_TABLE,
		playerMapStatsAttributes,
		['steamId', 'matchId', 'map'],
		[`FOREIGN KEY (matchId, map) REFERENCES ${MATCH_MAPS_TABLE}(matchId, map)`]
	);
	createTableDB(playerMapStatsTableSchema);
};

export const onNewMatch = (data: IMatch) => {
	insertDB(
		MATCHES_TABLE,
		new Map<string, string | number>([
			['matchId', data.id],
			['teamA', data.teamA.name],
			['teamAScore', 0],
			['teamB', data.teamB.name],
			['teamBScore', 0],
		])
	);
};

export const onNewMap = (match: IMatch, map: string) => {
	insertDB(
		MATCH_MAPS_TABLE,
		new Map<string, string | number>([
			['matchId', match.id],
			['map', map],
			['teamA', match.teamA.name],
			['teamAScore', 0],
			['teamB', match.teamB.name],
			['teamBScore', 0],
		])
	);
};

export const onDamage = (
	matchId: string,
	map: string,
	attackerId: string,
	damage: number,
	damageArmor: number,
	headshot: boolean
) => {
	const currentAttackerMapStats = queryDB(
		`SELECT hits,headshots,damages FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
	) as Array<{ hits: number; headshots: number; damages: number }>;
	const currentAttackerGlobalStats = queryDB(
		`SELECT tHits,tHeadshots,tDamages FROM ${PLAYERS_TABLE} WHERE steamId = '${attackerId}'`
	) as Array<{ tHits: number; tHeadshots: number; tDamages: number }>;

	if (currentAttackerMapStats.length > 0 && currentAttackerGlobalStats.length > 0) {
		updateDB(
			PLAYER_MAP_STATS_TABLE,
			new Map<string, number>([
				['hits', (currentAttackerMapStats[0]!.hits ?? 0) + 1],
				['headshots', (currentAttackerMapStats[0]!.headshots ?? 0) + (headshot ? 1 : 0)],
				['damages', (currentAttackerMapStats[0]!.damages ?? 0) + damage + damageArmor],
			]),
			`steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
		);
		updateDB(
			PLAYERS_TABLE,
			new Map<string, number>([
				['tHits', (currentAttackerGlobalStats[0]!.tHits ?? 0) + 1],
				[
					'tHeadshots',
					(currentAttackerGlobalStats[0]!.tHeadshots ?? 0) + (headshot ? 1 : 0),
				],
				['tDamages', (currentAttackerGlobalStats[0]!.tDamages ?? 0) + damage + damageArmor],
			]),
			`steamId = '${attackerId}'`
		);
	}
};

export const onKill = (matchId: string, map: string, killerId: string, victimId: string) => {
	const currentKillerMapStats = queryDB(
		`SELECT kills FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${killerId}' AND matchId = '${matchId}' AND map = '${map}'`
	) as Array<{ kills: number }>;
	const currentVictimMapStats = queryDB(
		`SELECT deaths FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	) as Array<{ deaths: number }>;
	const currentKillerGlobalStats = queryDB(
		`SELECT tKills FROM ${PLAYERS_TABLE} WHERE steamId = '${killerId}'`
	) as Array<{ tKills: number }>;
	const currentVictimGlobalStats = queryDB(
		`SELECT tDeaths FROM ${PLAYERS_TABLE} WHERE steamId = '${victimId}'`
	) as Array<{ tDeaths: number }>;

	updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['kills', (currentKillerMapStats[0]?.kills ?? 0) + 1]]),
		`steamId = '${killerId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['deaths', (currentVictimMapStats[0]?.deaths ?? 0) + 1]]),
		`steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tKills', (currentKillerGlobalStats[0]?.tKills ?? 0) + 1]]),
		`steamId = '${killerId}'`
	);
	updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tDeaths', (currentVictimGlobalStats[0]?.tDeaths ?? 0) + 1]]),
		`steamId = '${victimId}'`
	);
};

export const onAssist = (matchId: string, map: string, attackerId: string) => {
	const currentAttackerMapStats = queryDB(
		`SELECT assists FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
	) as Array<{ assists: number }>;
	const currentAttackerGlobalStats = queryDB(
		`SELECT tAssists FROM ${PLAYERS_TABLE} WHERE steamId = '${attackerId}'`
	) as Array<{ tAssists: number }>;

	updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['assists', (currentAttackerMapStats[0]?.assists ?? 0) + 1]]),
		`steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tAssists', (currentAttackerGlobalStats[0]?.tAssists ?? 0) + 1]]),
		`steamId = '${attackerId}'`
	);
};

export const onOtherDeath = (matchId: string, map: string, victimId: string) => {
	const currentVictimMapStats = queryDB(
		`SELECT deaths FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	) as Array<{ deaths: number }>;
	const currentVictimGlobalStats = queryDB(
		`SELECT tDeaths FROM ${PLAYERS_TABLE} WHERE steamId = '${victimId}'`
	) as Array<{ tDeaths: number }>;

	updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['deaths', (currentVictimMapStats[0]?.deaths ?? 0) + 1]]),
		`steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tDeaths', (currentVictimGlobalStats[0]?.tDeaths ?? 0) + 1]]),
		`steamId = '${victimId}'`
	);
};

export const updateRoundCount = (match: IMatch, matchMap: IMatchMap) => {
	if (matchMap.state === 'IN_PROGRESS') {
		const currentPlayersMapStats = queryDB(
			`SELECT steamId,rounds FROM ${PLAYER_MAP_STATS_TABLE} WHERE matchId = '${match.id}' AND map = '${matchMap.name}'`
		) as Array<{ steamId: string; rounds: number }>;

		for (const player of currentPlayersMapStats) {
			const currentPlayerGlobalStats = queryDB(
				`SELECT tRounds FROM ${PLAYERS_TABLE} WHERE steamId = '${player.steamId}'`
			) as Array<{ tRounds: number }>;

			updateDB(
				PLAYERS_TABLE,
				new Map<string, number>([
					['tRounds', (currentPlayerGlobalStats[0]?.tRounds ?? 0) + 1],
				]),
				`steamId = '${player.steamId}'`
			);
			updateDB(
				PLAYER_MAP_STATS_TABLE,
				new Map<string, number>([['rounds', (player.rounds ?? 0) + 1]]),
				`steamId = '${player.steamId}' AND matchId = '${match.id}' AND map = '${matchMap.name}'`
			);
		}
	}

	updateDB(
		MATCH_MAPS_TABLE,
		new Map<string, number>([
			['teamAScore', matchMap.score.teamA],
			['teamBScore', matchMap.score.teamB],
		]),
		`matchId = '${match.id}' AND map = '${matchMap.name}'`
	);
};

export const updateMapCount = (data: IMatch) => {
	updateDB(
		MATCHES_TABLE,
		new Map<string, number>([
			['teamAScore', data.matchMaps.filter((m) => m.score.teamA > m.score.teamB).length],
			['teamBScore', data.matchMaps.filter((m) => m.score.teamB > m.score.teamA).length],
		]),
		`matchId = '${data.id}'`
	);
};

const cache = new NodeCache({ stdTTL: 10 });

export const getPlayersStats = (): IPlayerStats[] => {
	const cached = cache.get('players') as IPlayerStats[];
	if (cached) return cached;

	const playerStats = queryDB(
		`SELECT
		steamId,
		name,
		tKills AS kills,
		tDeaths AS deaths,
		tAssists AS assists,
		tHits AS hits,
		tHeadshots AS headshots,
		tRounds AS rounds,
		tDamages AS damages
		FROM ${PLAYERS_TABLE}`
	) as IPlayerStats[];
	cache.set('players', playerStats);
	return playerStats;
};

export const getMatchPlayersStats = (matchId: string): IPlayerStats[] => {
	const cached = cache.get('players/match/' + matchId) as IPlayerStats[];
	if (cached) return cached;

	const playerStats = queryDB(
		`SELECT
		t1.steamId,
		t1.name,
		t2.kills,
		t2.deaths,
		t2.assists,
		t2.hits,
		t2.headshots,
		t2.rounds,
		t2.damages,
		t2.map
		FROM ${PLAYERS_TABLE} t1
		INNER JOIN ${PLAYER_MAP_STATS_TABLE} t2
		ON t1.steamId = t2.steamId
		WHERE t2.matchId = '${matchId}'`
	) as IPlayerStats[];
	cache.set('players/match/' + matchId, playerStats);
	return playerStats;
};

export const getMatchesStats = (): IMatchStats[] => {
	const cached = cache.get('matches') as IMatchStats[];
	if (cached) return cached;

	const matchStats = queryDB(`SELECT * FROM ${MATCHES_TABLE}`) as IMatchStats[];
	cache.set('matches', matchStats);
	return matchStats;
};

export const getPlayerMatchesStats = (steamId: string): IPlayerStats[] => {
	const cached = cache.get('matches/player/' + steamId) as IPlayerStats[];
	if (cached) return cached;

	const playerStats = queryDB(
		`SELECT * FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${steamId}'`
	) as IPlayerStats[];
	cache.set('matches/player/' + steamId, playerStats);
	return playerStats;
};

export const getMatchStats = (matchId: string): IMatchStats => {
	const cached = cache.get('matches/' + matchId) as IMatchStats;
	if (cached) return cached;

	const matchStats = (
		queryDB(`SELECT * FROM ${MATCHES_TABLE} WHERE matchId = '${matchId}'`) as IMatchStats[]
	)[0];
	if (matchStats) {
		cache.set('matches/' + matchId, matchStats);
		return matchStats;
	}
	throw { status: 404, message: `Match stats not found for matchId: ${matchId}` };
};

export const getMatchMapStats = (matchId: string, map: string): IMatchMapStats => {
	const cached = cache.get('matchMaps/' + matchId + '/' + map) as IMatchMapStats;
	if (cached) return cached;

	const matchMapStats = (
		queryDB(
			`SELECT * FROM ${MATCH_MAPS_TABLE} WHERE matchId = '${matchId}' AND map = '${map}'`
		) as IMatchMapStats[]
	)[0];
	if (matchMapStats) {
		cache.set('matchMaps/' + matchId + '/' + map, matchMapStats);
		return matchMapStats;
	}
	throw { status: 404, message: `Match map stats not found for matchId: ${matchId} and map: {}` };
};

export const getPlayerStats = (steamId: string): IPlayerStats => {
	const cached = cache.get('players/' + steamId) as IPlayerStats;
	if (cached) return cached;

	const playerStats = (
		queryDB(
			`SELECT
			steamId,
			name,
			tKills AS kills,
			tDeaths AS deaths,
			tAssists AS assists,
			tHits AS hits,
			tHeadshots AS headshots,
			tRounds AS rounds,
			tDamages AS damages
			FROM ${PLAYERS_TABLE}
			WHERE steamId = '${steamId}'`
		) as IPlayerStats[]
	)[0];
	if (playerStats) {
		cache.set('players/' + steamId, playerStats);
		return playerStats;
	}
	throw { status: 404, message: `Player stats not found for steamId: ${steamId}` };
};

export const getTeamPlayers = (teamName: string): string[] => {
	const cached = cache.get('team/' + teamName) as string[];
	if (cached) return cached;

	const teamPlayers = (
		queryDB(
			`SELECT p.name
			FROM teams t
			INNER JOIN ${PLAYERS_TABLE} p
			ON t.steamId = p.steamId
			WHERE t.teamName = '${teamName}'`
		) as Array<{ name: string }>
	).map((row: { name: string }) => row.name) as string[];
	cache.set('team/' + teamName, teamPlayers);
	return teamPlayers;
};

export const deleteAllStats = () => {
	flushDB(MATCH_MAPS_TABLE);
	flushDB(PLAYER_MAP_STATS_TABLE);
	flushDB(TEAMS_TABLE);
	flushDB(MATCHES_TABLE);
	flushDB(PLAYERS_TABLE);
	invalidateStatsCache();
	console.info('[DATABASE] All stats have been deleted.');
};

export const invalidateStatsCache = () => {
	cache.flushAll();
	console.info('[CACHE] Cache has been invalidated.');
};
