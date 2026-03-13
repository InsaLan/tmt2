import { useParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import {
	TStatus,
	IMatchStats,
	IPlayerStats,
	IMatchMapStats,
	combinedStatus,
} from '../../../../common';
import { Card } from '../../components/Card';
import { CopyableText } from '../../components/CopyableText';
import { StatsNavBar } from '../../components/StatsNavBar';
import { StatsTable } from '../../components/StatsTable';
import { createFetcher } from '../../utils/fetcher';
import { t } from '../../utils/locale';
import {
	calculatePlayerRatios,
	assemblePlayers,
	getKDColor,
	getHSPctColor,
	getADRColor,
} from '../../utils/playerStatsUtils';

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
