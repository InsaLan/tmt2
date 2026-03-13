import { createSignal, createEffect } from 'solid-js';
import { TStatus, IPlayerStats } from '../../../../common';
import { Card } from '../../components/Card';
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
