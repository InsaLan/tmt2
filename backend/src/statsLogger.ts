import { SqlAttribute, TableSchema } from './tableSchema';
import { createTableDB, insertDB, queryDB, updateDB } from './storage';
import { IMatch, IMatchMap, TTeamAB } from '../../common';

export const PLAYERS_TABLE = 'players';
export const MATCH_MAPS_TABLE = 'matchMaps';
export const MATCHES_TABLE = 'matches';
export const PLAYER_MATCH_STATS_TABLE = 'playerMatchStats';

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
	const playerMatchStatsAttributes = [
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
	const playerMatchStatsTableSchema = new TableSchema(
		PLAYER_MATCH_STATS_TABLE,
		playerMatchStatsAttributes,
		['steamId', 'matchId', 'map']
	);
	await createTableDB(playerMatchStatsTableSchema);
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
			['matchId', ''],
			['map', ''],
			['teamA', ''],
			['teamAScore', 0],
			['teamB', ''],
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
	const currentAttackerMatchStats = (await queryDB(
		`SELECT hits,headshots,damages FROM ${PLAYER_MATCH_STATS_TABLE} WHERE steamId = '${attackerId}' AND matchId = '${matchId}'`
	)) as number[] | undefined;
	const currentAttackerGlobalStats = (await queryDB(
		`SELECT tHits,tHeadshots,tDamages FROM ${PLAYERS_TABLE} WHERE steamId = '${attackerId}'`
	)) as number[] | undefined;

	if (currentAttackerMatchStats && currentAttackerGlobalStats) {
		await updateDB(
			PLAYER_MATCH_STATS_TABLE,
			new Map<string, number>([
				['hits', (currentAttackerMatchStats[0] ?? 0) + 1],
				['headshots', (currentAttackerMatchStats[1] ?? 0) + (headshot ? 1 : 0)],
				['damages', (currentAttackerMatchStats[2] ?? 0) + damage + damageArmor],
			]),
			`steamId = '${attackerId}' AND matchId = '${matchId}'`
		);
		await updateDB(
			PLAYERS_TABLE,
			new Map<string, number>([
				['tHits', (currentAttackerGlobalStats[0] ?? 0) + 1],
				['tHeadshots', (currentAttackerGlobalStats[1] ?? 0) + (headshot ? 1 : 0)],
				['tDamages', (currentAttackerGlobalStats[2] ?? 0) + damage + damageArmor],
			]),
			`steamId = '${attackerId}'`
		);
	}
};

export const onKill = async (matchId: string, map: string, killerId: string, victimId: string) => {
	const currentKillerMatchStats = (await queryDB(
		`SELECT kills FROM ${PLAYER_MATCH_STATS_TABLE} WHERE steamId = '${killerId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as number;
	const currentVictimMatchStats = (await queryDB(
		`SELECT deaths FROM ${PLAYER_MATCH_STATS_TABLE} WHERE steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as number;
	const currentKillerGlobalStats = (await queryDB(
		`SELECT tKills FROM ${PLAYERS_TABLE} WHERE steamId = '${killerId}'`
	)) as number;
	const currentVictimGlobalStats = (await queryDB(
		`SELECT tDeaths FROM ${PLAYERS_TABLE} WHERE steamId = '${victimId}'`
	)) as number;

	await updateDB(
		PLAYER_MATCH_STATS_TABLE,
		new Map<string, number>([['kills', currentKillerMatchStats + 1]]),
		`steamId = '${killerId}' AND matchId = '${matchId}'`
	);
	await updateDB(
		PLAYER_MATCH_STATS_TABLE,
		new Map<string, number>([['deaths', currentVictimMatchStats + 1]]),
		`steamId = '${victimId}' AND matchId = '${matchId}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tKills', currentKillerGlobalStats + 1]]),
		`steamId = '${killerId}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tDeaths', currentVictimGlobalStats + 1]]),
		`steamId = '${victimId}'`
	);
};

export const onAssist = async (matchId: string, map: string, attackerId: string) => {
	const currentAttackerMatchStats = (await queryDB(
		`SELECT assists FROM ${PLAYER_MATCH_STATS_TABLE} WHERE steamId = '${attackerId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as number;
	const currentAttackerGlobalStats = (await queryDB(
		`SELECT tAssists FROM ${PLAYERS_TABLE} WHERE steamId = '${attackerId}'`
	)) as number;

	await updateDB(
		PLAYER_MATCH_STATS_TABLE,
		new Map<string, number>([['assists', currentAttackerMatchStats + 1]]),
		`steamId = '${attackerId}' AND matchId = '${matchId}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tAssists', currentAttackerGlobalStats + 1]]),
		`steamId = '${attackerId}'`
	);
};

export const onOtherDeath = async (matchId: string, map: string, victimId: string) => {
	const currentVictimMatchStats = (await queryDB(
		`SELECT deaths FROM ${PLAYER_MATCH_STATS_TABLE} WHERE steamId = '${victimId}' AND matchId = '${matchId}' AND map = '${map}'`
	)) as number;
	const currentVictimGlobalStats = (await queryDB(
		`SELECT tDeaths FROM ${PLAYERS_TABLE} WHERE steamId = '${victimId}'`
	)) as number;

	await updateDB(
		PLAYER_MATCH_STATS_TABLE,
		new Map<string, number>([['deaths', currentVictimMatchStats + 1]]),
		`steamId = '${victimId}' AND matchId = '${matchId}'`
	);
	await updateDB(
		PLAYERS_TABLE,
		new Map<string, number>([['tDeaths', currentVictimGlobalStats + 1]]),
		`steamId = '${victimId}'`
	);
};

export const updateRoundCount = async (match: IMatch, matchMap: IMatchMap) => {
	const currentPlayersMatchStats = (await queryDB(
		`SELECT steamId,rounds FROM ${PLAYER_MATCH_STATS_TABLE} WHERE matchId = '${match.id}' AND map = '${matchMap.name}'`
	)) as Map<string, number>;

	let currentPlayerGlobalStats: number | undefined;

	for (const player of currentPlayersMatchStats.entries()) {
		currentPlayerGlobalStats = (await queryDB(
			`SELECT tRounds FROM ${PLAYERS_TABLE} WHERE steamId = '${player[0]}'`
		)) as number;

		await updateDB(
			PLAYERS_TABLE,
			new Map<string, number>([['tRounds', currentPlayerGlobalStats + 1]]),
			`steamId = '${player[0]}'`
		);
		await updateDB(
			PLAYER_MATCH_STATS_TABLE,
			new Map<string, number>([['rounds', player[1] + 1]]),
			`steamId = '${player[0]}' AND matchId = '${match.id}' AND map = '${matchMap.name}'`
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
