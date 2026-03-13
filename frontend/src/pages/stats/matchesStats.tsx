import { createSignal, createEffect } from 'solid-js';
import { TStatus, IMatchStats } from '../../../../common';
import { Card } from '../../components/Card';
import { StatsNavBar } from '../../components/StatsNavBar';
import { StatsTable } from '../../components/StatsTable';
import { createFetcher } from '../../utils/fetcher';
import { t } from '../../utils/locale';

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
					sortable={[true, true, true, true, false]}
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
