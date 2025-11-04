import { SvgCheck, SvgClear, SvgDelete, SvgDownloadArchive, SvgUploadCloud } from '../assets/Icons';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { createFetcher, downloadFile } from '../utils/fetcher';
import { t } from '../utils/locale';
import { mustConfirm } from '../utils/mustConfirm';

const downloadDB = async () => {
	const now = new Date();
	downloadFile(
		'/api/storage/database',
		'TMT2-' +
			now.getFullYear() +
			now.getMonth() +
			now.getDate() +
			'-' +
			now.getHours() +
			now.getMinutes() +
			now.getSeconds() +
			'.sqlite'
	);
};

export const DataManagementPage = () => {
	const fetcher = createFetcher();

	return (
		<div class="w-full max-w-4xl mx-auto px-4 sm:px-6">
			<Card>
				<div class="prose pb-4">
					<h2>{t('Database Management')}</h2>
				</div>
				<div class="items-center justify-center flex gap-4">
					<button
						class="btn"
						onClick={() => {
							downloadDB();
						}}
					>
						<SvgDownloadArchive />
						{t('Download DB')}
					</button>
					<button
						class="btn text-error"
						onClick={
							mustConfirm(() => {
								downloadDB();
								//TODO
							}, t('This action is destructive. A backup of the DB will be downloaded, just in case.'))
						}
					>
						<SvgUploadCloud />
						{t('Import DB')}
					</button>
				</div>
				<div class="prose py-4">
					<h2>{t('Cleanup')}</h2>
				</div>
				<div class="items-center justify-center flex gap-4">
					<button
						class="btn text-error"
						onClick={
							mustConfirm(() => {
								downloadDB();
								fetcher('DELETE', '/api/storage/stats');
							}, t('This action is destructive. A backup of the DB will be downloaded, just in case.'))
						}
					>
						<SvgDelete />
						{t('Delete stats')}
					</button>
					<button
						class="btn text-error"
						onClick={
							mustConfirm(() => {
								downloadDB();
								fetcher('DELETE', '/api/storage/database');
							}, t('This action is destructive. A backup of the DB will be downloaded, just in case.'))
						}
					>
						<SvgDelete />
						{t('Empty DB')}
					</button>
				</div>
			</Card>
		</div>
	);
};
