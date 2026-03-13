import { useParams } from '@solidjs/router';
import { createSignal, createEffect } from 'solid-js';
import { TStatus, IPlayerStats, combinedStatus } from '../../../../common';
import { Card } from '../../components/Card';
import { CopyableText } from '../../components/CopyableText';
import { StatsNavBar } from '../../components/StatsNavBar';
import { StatsTable } from '../../components/StatsTable';
import { createFetcher } from '../../utils/fetcher';
import { t } from '../../utils/locale';
import {
	calculatePlayerRatios,
	getKDColor,
	getHSPctColor,
	getADRColor,
} from '../../utils/playerStatsUtils';

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
					sortable={[false, true, true, true, true, true, true, true]}
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
					defaultSortColumn="map"
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
