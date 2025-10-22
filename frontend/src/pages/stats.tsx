import { createSignal } from 'solid-js';
import { Card } from '../components/Card';
import { StatsNavBar } from '../components/StatsNavBar';
import { t } from '../utils/locale';
import { useParams } from '@solidjs/router';
import { createEffect } from 'solid-js';
import { createFetcher } from '../utils/fetcher';
import { IPlayerStats, IMatchStats, TStatus, combinedStatus } from '../../../common';
import {
	assemblePlayers,
	calculatePlayerRatios,
	getADRColor,
	getHSPctColor,
	getKDColor,
} from '../utils/playerStatsUtils';
import { StatsTable } from '../components/StatsTable';
import { CopyableText } from '../components/CopyableText';
import { SvgDelete, SvgDownloadArchive, SvgUploadCloud } from '../assets/Icons';

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
					detailsPrefix="/stats/match/"
					detailsProp="matchId"
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
			.then((data) => {
				if (data) {
					setPlayers(data.map(calculatePlayerRatios));
					setAssembledPlayers(assemblePlayers(data));
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
						<div class="prose text-center mx-auto flex justify-center items-center">
							<div class="flex-1 text-right pr-4">
								<h2 class="m-0">{match()?.teamA}</h2>
								{teamA().join(', ')}
								<br />
								<span class="text-xl">{match()?.teamAScore}</span>
							</div>
							<div class="border-r border-gray-300 h-20"></div>
							<div class="flex-1 text-left pl-4">
								<h2 class="m-0">{match()?.teamB}</h2>
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
					detailsPrefix="/stats/player/"
					detailsProp="steamId"
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
							<h2 class="my-0">{t('Player') + ' ' + player()?.name}</h2>
							<span class="flex items-center justify-center">
								<CopyableText
									text={t('steamID') + ': ' + player()?.steamId}
									copyText={player()?.steamId ?? ''}
								/>
							</span>
						</div>
						<div class="prose text-center mx-auto pt-4 flex justify-center items-center">
							<div class="flex items-center">
								<div class="px-4">
									<h3 class="m-0">{t('Kills')}</h3>
									{player()?.kills}
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="px-4">
									<h3 class="m-0">{t('Deaths')}</h3>
									{player()?.deaths}
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="px-4">
									<h3 class="m-0">{t('Assists')}</h3>
									{player()?.assists}
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="px-4">
									<h3 class="m-0">{t('K/D')}</h3>
									{player()?.kd?.toFixed(2)}
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="px-4">
									<h3 class="m-0">{t('Headshot %')}</h3>
									{player()?.hsPct?.toFixed(2)}
								</div>
								<div class="border-r border-gray-300 h-16"></div>
								<div class="px-4">
									<h3 class="m-0">{t('ADR')}</h3>
									{player()?.adr?.toFixed(2)}
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
				/>
			</Card>
		</>
	);
};

export const DataManagementStatsPage = () => {
	return (
		<>
			<StatsNavBar />
			<Card>
				<div class="items-center justify-center flex gap-4">
					<button
						class="btn"
						onClick={() => {}}
					>
						<SvgDownloadArchive/>
						{t('Download database')}
					</button>
					<button
						class="btn text-error"
						onClick={() => {}}
					>
						<SvgUploadCloud/>
						{t('Import database file')}
					</button>
					<button
						class="btn text-error"
						onClick={() => {}}
					>
						<SvgDelete/>
						{t('Empty database')}
					</button>
				</div>
			</Card>
		</>
	)
}