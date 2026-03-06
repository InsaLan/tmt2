import { createSignal } from 'solid-js';
import { Card } from '../components/Card';
import { StatsNavBar } from '../components/StatsNavBar';
import { t } from '../utils/locale';
import { useParams } from '@solidjs/router';
import { createEffect } from 'solid-js';
import { createFetcher } from '../utils/fetcher';
import {
	IPlayerStats,
	IMatchStats,
	IMatchMapStats,
	TStatus,
	combinedStatus,
} from '../../../common';
import {
	assemblePlayers,
	calculatePlayerRatios,
	getADRColor,
	getHSPctColor,
	getKDColor,
} from '../utils/playerStatsUtils';
import { StatsTable } from '../components/StatsTable';
import { CopyableText } from '../components/CopyableText';

export const MatchesStatsPage = () => {
	const fetcher = createFetcher();
	const [status, setStatus] = createSignal<TStatus>('LOADING');
	const [matches, setMatches] = createSignal<IMatchStats[]>([]);

	createEffect(() => {
		fetcher<IMatchStats[]>('GET', `/api/stats/matches`)
			.then((data) => {
				if (data) {
					const parsed = data.map((m) => ({
						...m,
						timestamp: new Date(m.timestamp),
					}));
					setMatches(parsed);
					setStatus('OK');
				} else {
					setStatus('ERROR');
				}
			})
			.catch((error) => {
				if (error.response?.status === 404) {
					setStatus('NOT_FOUND');
				} else {
					setStatus('ERROR');
				}
			});
	});

	return (
		<>
			<StatsNavBar />
			<Card>
				<StatsTable
					headers={[t('Team A'), t('Team B'), t('Score'), t('Date'), t('ID')]}
					data={matches()}
					columns={[
						'teamA',
						'teamB',
						'teamAScore| / |teamBScore',
						'timestamp',
						'matchId',
					]}
					defaultSortColumn="timestamp"
					defaultSortAsc={false}
					status={status()}
					details={[
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						['/stats/match/', 'matchId'],
					]}
				/>
			</Card>
		</>
	);
};

export const MatchStatsPage = () => {
	const matchId = useParams().id;
	const fetcher = createFetcher();
	const [status, setStatus] = createSignal<TStatus[]>(['LOADING', 'LOADING']);
	const [match, setMatch] = createSignal<IMatchStats>();
	const [teamA, setTeamA] = createSignal<string[]>([]);
	const [teamB, setTeamB] = createSignal<string[]>([]);
	const [players, setPlayers] = createSignal<IPlayerStats[]>([]);
	const [assembledPlayers, setAssembledPlayers] = createSignal<IPlayerStats[]>([]);
	const [mapScores, setMapScores] = createSignal<IMatchMapStats[]>([]);
	const [permap, setPermap] = createSignal(false);

	const updateStatus = (index: number, value: TStatus) => {
		const updated = [...status()];
		updated[index] = value;
		setStatus(updated);
	};

	createEffect(() => {
		fetcher<IMatchStats>('GET', `/api/stats/match?id=${matchId}`)
			.then((data) => {
				if (data) {
					const parsed = {
						...data,
						timestamp: new Date(data.timestamp),
					};
					setMatch(parsed);
					updateStatus(0, 'OK');
				} else {
					updateStatus(0, 'ERROR');
				}
			})
			.catch((error) => {
				if (error === 'Not Found') {
					updateStatus(0, 'NOT_FOUND');
				} else {
					updateStatus(0, 'ERROR');
				}
			});
	});

	createEffect(() => {
		fetcher<string[]>('GET', `/api/stats/team?id=${match()?.teamA}`)
			.then((data) => {
				if (data) {
					setTeamA(data);
					updateStatus(1, 'OK');
				} else {
					updateStatus(1, 'ERROR');
				}
			})
			.catch((error) => {
				if (error === 'Not Found') {
					updateStatus(1, 'NOT_FOUND');
				} else {
					updateStatus(1, 'ERROR');
				}
			});
		fetcher<string[]>('GET', `/api/stats/team?id=${match()?.teamB}`)
			.then((data) => {
				if (data) {
					setTeamB(data);
					updateStatus(2, 'OK');
				} else {
					updateStatus(2, 'ERROR');
				}
			})
			.catch((error) => {
				if (error === 'Not Found') {
					updateStatus(2, 'NOT_FOUND');
				} else {
					updateStatus(2, 'ERROR');
				}
			});
	});

	createEffect(() => {
		fetcher<IPlayerStats[]>('GET', `/api/stats/players/match?id=${matchId}`)
			.then(async (data) => {
				if (data) {
					setPlayers(data.map(calculatePlayerRatios));
					setAssembledPlayers(assemblePlayers(data));

					const maps = [
						...new Set(data.map((p) => p.map).filter((map) => !!map)),
					] as string[];
					const mapStats = await Promise.all(
						maps.map((map) =>
							fetcher<IMatchMapStats>(
								'GET',
								`/api/stats/match/map?id=${matchId}&map=${encodeURIComponent(map)}`
							)
								.then((stat) => {
									if (!stat) return undefined;
									return {
										...stat,
										timestamp: new Date(stat.timestamp),
									};
								})
								.catch(() => undefined)
						)
					);
					setMapScores(
						mapStats
							.filter((stat): stat is IMatchMapStats => !!stat)
							.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
					);

					updateStatus(3, 'OK');
				} else {
					updateStatus(3, 'ERROR');
				}
			})
			.catch((error) => {
				if (error === 'Not Found') {
					updateStatus(3, 'NOT_FOUND');
				} else {
					updateStatus(3, 'ERROR');
				}
			});
	});

	return (
		<>
			<StatsNavBar />
			{combinedStatus(status()) === 'OK' && (
				<>
					<Card>
						{/* <div class="prose text-center mx-auto pb-4">
							<h2>{t('Match') + ' ' + match()?.matchId}</h2>
						</div> */}
						<div class="flex prose text-center mx-auto justify-center items-center">
							<div class="flex flex-col text-right pr-4 gap-1">
								<span class="text-3xl text-base-content font-bold">
									{match()?.teamA}
								</span>
								{teamA().join(', ')}
								<br />
								<span class="text-xl">{match()?.teamAScore}</span>
							</div>
							<div class="border-r border-gray-300 h-20"></div>
							<div class="flex flex-col text-left pl-4 gap-1">
								<span class="text-3xl text-base-content font-bold">
									{match()?.teamB}
								</span>
								{teamB().join(', ')}
								<br />
								<span class="text-xl">{match()?.teamBScore}</span>
							</div>
						</div>
						<span class="flex items-center justify-center pt-2">
							{t('Date') + ': ' + match()?.timestamp.toLocaleString()}
						</span>
						<span class="flex items-center justify-center">
							<CopyableText
								text={t('Match ID') + ': ' + match()?.matchId}
								copyText={match()?.matchId ?? ''}
							/>
						</span>
						{mapScores().length > 0 && (
							<div class="pt-4 max-w-xl mx-auto w-full">
								<div class="text-center text-sm opacity-70 pb-1">
									{t('Per-map')}
								</div>
								<div class="flex flex-col gap-1">
									{mapScores().map((mapStat) => (
										<div class="flex justify-between items-center px-3 py-1 rounded-xl bg-base-100">
											<span class="font-medium">{mapStat.map}</span>
											<span>
												{mapStat.teamAScore} - {mapStat.teamBScore}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</Card>
					<div class="h-8" />
				</>
			)}
			<Card>
				{combinedStatus(status()) === 'OK' && (
					<>
						<div class="flex justify-center">
							<div class="mx-4">{t('Global')}</div>
							<input
								type="checkbox"
								class="toggle"
								onInput={(e) =>
									e.currentTarget.checked ? setPermap(true) : setPermap(false)
								}
							/>
							<div class="mx-4">{t('Per-map')}</div>
						</div>
						<div class="h-2" />
					</>
				)}
				{permap() ? (
					<StatsTable
						headers={[
							t('Map'),
							t('Name'),
							t('Kills'),
							t('Deaths'),
							t('Assists'),
							t('K/D'),
							t('Headshot %'),
							t('ADR'),
						]}
						data={players()}
						columns={[
							'map',
							'name',
							'kills',
							'deaths',
							'assists',
							'kd',
							'hsPct',
							'adr',
						]}
						float={[false, false, false, false, false, true, true, true]}
						colorFunctions={[
							undefined,
							undefined,
							undefined,
							undefined,
							undefined,
							getKDColor,
							getHSPctColor,
							getADRColor,
						]}
						defaultSortColumn="name"
						status={combinedStatus(status())}
						groupBy="map"
						details={[
							undefined,
							['/stats/player/', 'steamId'],
							undefined,
							undefined,
							undefined,
							undefined,
							undefined,
							undefined,
						]}
					/>
				) : (
					<StatsTable
						headers={[
							t('Name'),
							t('Kills'),
							t('Deaths'),
							t('Assists'),
							t('K/D'),
							t('Headshot %'),
							t('ADR'),
						]}
						data={assembledPlayers()}
						columns={['name', 'kills', 'deaths', 'assists', 'kd', 'hsPct', 'adr']}
						float={[false, false, false, false, true, true, true]}
						colorFunctions={[
							undefined,
							undefined,
							undefined,
							undefined,
							getKDColor,
							getHSPctColor,
							getADRColor,
						]}
						defaultSortColumn="name"
						status={combinedStatus(status())}
						details={[
							['/stats/player/', 'steamId'],
							undefined,
							undefined,
							undefined,
							undefined,
							undefined,
							undefined,
						]}
					/>
				)}
			</Card>
		</>
	);
};

export const PlayersStatsPage = () => {
	const fetcher = createFetcher();
	const [status, setStatus] = createSignal<TStatus>('LOADING');
	const [players, setPlayers] = createSignal<IPlayerStats[]>([]);

	createEffect(() => {
		fetcher<IPlayerStats[]>('GET', `/api/stats/players`)
			.then((data) => {
				if (data) {
					setPlayers(data.map(calculatePlayerRatios));
					setStatus('OK');
				} else {
					setStatus('ERROR');
				}
			})
			.catch((error) => {
				if (error.response?.status === 404) {
					setStatus('NOT_FOUND');
				} else {
					setStatus('ERROR');
				}
			});
	});

	return (
		<>
			<StatsNavBar />
			<Card>
				<StatsTable
					headers={[
						t('Name'),
						t('Kills'),
						t('Deaths'),
						t('Assists'),
						t('K/D'),
						t('Headshot %'),
						t('ADR'),
					]}
					data={players()}
					columns={['name', 'kills', 'deaths', 'assists', 'kd', 'hsPct', 'adr']}
					float={[false, false, false, false, true, true, true]}
					colorFunctions={[
						undefined,
						undefined,
						undefined,
						undefined,
						getKDColor,
						getHSPctColor,
						getADRColor,
					]}
					defaultSortColumn="name"
					status={status()}
					details={[
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						['/stats/player/', 'steamId'],
					]}
				/>
			</Card>
		</>
	);
};

export const PlayerStatsPage = () => {
	const steamId = useParams().id;
	const fetcher = createFetcher();
	const [status, setStatus] = createSignal<TStatus[]>(['LOADING', 'LOADING']);
	const [player, setPlayer] = createSignal<IPlayerStats>();
	const [playerData, setPlayerData] = createSignal<IPlayerStats[]>([]);

	const updateStatus = (index: number, value: TStatus) => {
		const updated = [...status()];
		updated[index] = value;
		setStatus(updated);
	};

	createEffect(() => {
		fetcher<IPlayerStats>('GET', `/api/stats/player?id=${steamId}`)
			.then((data) => {
				if (data) {
					setPlayer(calculatePlayerRatios(data));
					updateStatus(0, 'OK');
				} else {
					updateStatus(0, 'ERROR');
				}
			})
			.catch((error) => {
				if (error === 'Not Found') {
					updateStatus(0, 'NOT_FOUND');
				} else {
					updateStatus(0, 'ERROR');
				}
			});
	});

	createEffect(() => {
		fetcher<IPlayerStats[]>('GET', `/api/stats/matches/player?id=${steamId}`)
			.then((data) => {
				if (data) {
					setPlayerData(data.map(calculatePlayerRatios));
					updateStatus(1, 'OK');
				} else {
					updateStatus(1, 'ERROR');
				}
			})
			.catch((error) => {
				if (error === 'Not Found') {
					updateStatus(1, 'NOT_FOUND');
				} else {
					updateStatus(1, 'ERROR');
				}
			});
	});

	return (
		<>
			<StatsNavBar />
			{combinedStatus(status()) === 'OK' && (
				<>
					<Card>
						<div class="prose text-center mx-auto">
							<span class="text-3xl text-base-content font-bold">
								{t('Player') + ' ' + player()?.name}
							</span>
							<span class="flex items-center justify-center">
								<CopyableText
									text={t('steamID') + ': ' + player()?.steamId}
									copyText={player()?.steamId ?? ''}
								/>
							</span>
						</div>
						<div class="overflow-x-auto flex text-center items-center pt-2">
							<div class="flex items-center mx-auto">
								<div class="flex flex-col px-4 whitespace-nowrap">
									<span class="text-2xl text-base-content font-bold">
										{t('Kills')}
									</span>
									<span>{player()?.kills}</span>
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="flex flex-col px-4 whitespace-nowrap">
									<span class="text-2xl text-base-content font-bold">
										{t('Deaths')}
									</span>
									<span>{player()?.deaths}</span>
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="flex flex-col px-4 whitespace-nowrap">
									<span class="text-2xl text-base-content font-bold">
										{t('Assists')}
									</span>
									<span>{player()?.assists}</span>
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="flex flex-col px-4 whitespace-nowrap">
									<span class="text-2xl text-base-content font-bold">
										{t('K/D')}
									</span>
									<span>{player()?.kd?.toFixed(2)}</span>
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="flex flex-col px-4 whitespace-nowrap">
									<span class="text-2xl text-base-content font-bold">
										{t('Headshot %')}
									</span>
									<span>{player()?.hsPct?.toFixed(2)}</span>
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="flex flex-col px-4 whitespace-nowrap">
									<span class="text-2xl text-base-content font-bold">
										{t('ADR')}
									</span>
									<span>{player()?.adr?.toFixed(2)}</span>
								</div>
							</div>
						</div>
					</Card>
					<div class="h-8" />
				</>
			)}
			<Card>
				<StatsTable
					headers={[
						t('Match'),
						t('Map'),
						t('Kills'),
						t('Deaths'),
						t('Assists'),
						t('K/D'),
						t('Headshot %'),
						t('ADR'),
					]}
					data={playerData()}
					columns={['matchId', 'map', 'kills', 'deaths', 'assists', 'kd', 'hsPct', 'adr']}
					float={[false, false, false, false, false, true, true, true]}
					colorFunctions={[
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						getKDColor,
						getHSPctColor,
						getADRColor,
					]}
					defaultSortColumn="matchId"
					status={combinedStatus(status())}
					groupBy="matchId"
					details={[
						['/stats/match/', 'matchId'],
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
						undefined,
					]}
				/>
			</Card>
		</>
	);
};
