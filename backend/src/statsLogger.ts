import { SqlAttribute, TableSchema } from './tableSchema';
import { createTableDB, insertDB, queryDB, updateDB } from './storage';
import { IMatch, IMatchMap, TTeamAB } from '../../common';
import { match } from 'assert';

export const PLAYERS_TABLE = 'players';
export const MATCH_MAPS_TABLE = 'matchMaps';
export const MATCHES_TABLE = 'matches';
export const PLAYER_MAP_STATS_TABLE = 'playerMapStats';

export const setup = async () => {
	// Create players global stats table
	const playersAttributes = [
		{ name: 'steamId', type: 'TEXT' },
		{ name: 'name', type: 'TEXT' },
		{ name: 'tKills', type: 'INTEGER' },
		{ name: 'tDeaths', type: 'INTEGER' },
		{ name: 'tAssists', type: 'INTEGER' },
		{ name: 'tDiff', type: 'INTEGER' },
		{ name: 'tHits', type: 'INTEGER' },
		{ name: 'tHeadshots', type: 'INTEGER' },
		{ name: 'tRounds', type: 'INTEGER' },
		{ name: 'tDamages', type: 'INTEGER' },
	] as SqlAttribute[];
	const playersTableSchema = new TableSchema(PLAYERS_TABLE, playersAttributes, ['steamId']);
	await createTableDB(playersTableSchema);

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
	await createTableDB(matchMapsTableSchema);

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
	await createTableDB(matchesTableSchema);

	//Create teams table
	const teamsAttributes = [
		{ name: 'teamName', type: 'TEXT' },
		{
			name: 'steamId',
			type: 'TEXT',
			constraints: `REFERENCES ${PLAYERS_TABLE} (steamId)`,
		},
	] as SqlAttribute[];
	const teamsTableSchema = new TableSchema('teams', teamsAttributes, ['teamName', 'steamId']);
	await createTableDB(teamsTableSchema);

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
		{
			name: 'map',
			type: 'TEXT',
			constraints: `REFERENCES ${MATCHES_TABLE}(map)`,
		},
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
		['steamId', 'matchId', 'map']
	);
	await createTableDB(playerMapStatsTableSchema);
};

export const onNewMatch = async (data: IMatch) => {
	await insertDB(
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

export const onNewMap = async (match: IMatch, map: string) => {
	await insertDB(
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

export const onDamage = async (
	matchId: string,
	map: string,
	attackerId: string,
	damage: number,
	damageArmor: number,
	headshot: boolean
) => {
	const currentAttackerMapStats = (await queryDB(
		`SELECT hits,headshots,damages FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as Array<{ hits: number; headshots: number; damages: number }>;
	const currentAttackerGlobalStats = (await queryDB(
		`SELECT tHits,tHeadshots,tDamages FROM ${PLAYERS_TABLE} WHERE steamId = '${attackerId}'`
	)) as Array<{ tHits: number; tHeadshots: number; tDamages: number }>;

	if (currentAttackerMapStats.length > 0 && currentAttackerGlobalStats.length > 0) {
		await updateDB(
			PLAYER_MAP_STATS_TABLE,
			new Map<string, number>([
				['hits', (currentAttackerMapStats[0]!.hits ?? 0) + 1],
				['headshots', (currentAttackerMapStats[0]!.headshots ?? 0) + (headshot ? 1 : 0)],
				['damages', (currentAttackerMapStats[0]!.damages ?? 0) + damage + damageArmor],
			]),
			`steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
		);
		await updateDB(
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

export const onKill = async (matchId: string, map: string, killerId: string, victimId: string) => {
	const currentKillerMapStats = (await queryDB(
		`SELECT kills FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${killerId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as Array<{ kills: number }>;
	const currentVictimMapStats = (await queryDB(
		`SELECT deaths FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as Array<{ deaths: number }>;
	const currentKillerGlobalStats = (await queryDB(
		`SELECT tKills FROM ${PLAYERS_TABLE} WHERE steamId = '${killerId}'`
	)) as Array<{ tKills: number }>;
	const currentVictimGlobalStats = (await queryDB(
		`SELECT tDeaths FROM ${PLAYERS_TABLE} WHERE steamId = '${victimId}'`
	)) as Array<{ tDeaths: number }>;

	await updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['kills', (currentKillerMapStats[0]?.kills ?? 0) + 1]]),
		`steamId = '${killerId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	await updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['deaths', (currentVictimMapStats[0]?.deaths ?? 0) + 1]]),
		`steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tKills', (currentKillerGlobalStats[0]?.tKills ?? 0) + 1]]),
		`steamId = '${killerId}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tDeaths', (currentVictimGlobalStats[0]?.tDeaths ?? 0) + 1]]),
		`steamId = '${victimId}'`
	);
};

export const onAssist = async (matchId: string, map: string, attackerId: string) => {
	const currentAttackerMapStats = (await queryDB(
		`SELECT assists FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as Array<{ assists: number }>;
	const currentAttackerGlobalStats = (await queryDB(
		`SELECT tAssists FROM ${PLAYERS_TABLE} WHERE steamId = '${attackerId}'`
	)) as Array<{ tAssists: number }>;

	await updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['assists', (currentAttackerMapStats[0]?.assists ?? 0) + 1]]),
		`steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tAssists', (currentAttackerGlobalStats[0]?.tAssists ?? 0) + 1]]),
		`steamId = '${attackerId}'`
	);
};

export const onOtherDeath = async (matchId: string, map: string, victimId: string) => {
	const currentVictimMapStats = (await queryDB(
		`SELECT deaths FROM ${PLAYER_MAP_STATS_TABLE} WHERE steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as Array<{ deaths: number }>;
	const currentVictimGlobalStats = (await queryDB(
		`SELECT tDeaths FROM ${PLAYERS_TABLE} WHERE steamId = '${victimId}'`
	)) as Array<{ tDeaths: number }>;

	await updateDB(
		PLAYER_MAP_STATS_TABLE,
		new Map<string, number>([['deaths', (currentVictimMapStats[0]?.deaths ?? 0) + 1]]),
		`steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tDeaths', (currentVictimGlobalStats[0]?.tDeaths ?? 0) + 1]]),
		`steamId = '${victimId}'`
	);
};

export const updateRoundCount = async (match: IMatch, matchMap: IMatchMap) => {
	const currentPlayersMapStats = (await queryDB(
		`SELECT steamId,rounds FROM ${PLAYER_MAP_STATS_TABLE} WHERE matchId = '${match.id}' AND map = '${matchMap.name}'`
	)) as Array<{ steamId: string; rounds: number }>;

	for (const player of currentPlayersMapStats) {
		const currentPlayerGlobalStats = (await queryDB(
			`SELECT tRounds FROM ${PLAYERS_TABLE} WHERE steamId = '${player.steamId}'`
		)) as Array<{ tRounds: number }>;

		await updateDB(
			PLAYERS_TABLE,
			new Map<string, number>([['tRounds', (currentPlayerGlobalStats[0]?.tRounds ?? 0) + 1]]),
			`steamId = '${player.steamId}'`
		);
		await updateDB(
			PLAYER_MAP_STATS_TABLE,
			new Map<string, number>([['rounds', (player.rounds ?? 0) + 1]]),
			`steamId = '${player.steamId}' AND matchId = '${match.id}' AND map = '${matchMap.name}'`
		);
	}
	await updateDB(
		MATCH_MAPS_TABLE,
		new Map<string, number>([
			['teamAScore', matchMap.score.teamA],
			['teamBScore', matchMap.score.teamB],
		]),
		`matchId = '${match.id}' AND map = '${matchMap.name}'`
	);
};

export const updateMapCount = async (data: IMatch) => {
	updateDB(
		MATCHES_TABLE,
		new Map<string, number>([
			['teamAScore', data.matchMaps.filter((m) => m.score.teamA > m.score.teamB).length],
			['teamBScore', data.matchMaps.filter((m) => m.score.teamB > m.score.teamA).length],
		]),
		`matchId = '${data.id}'`
	);
};
