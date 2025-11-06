import { SvgDelete, SvgDownloadArchive, SvgUploadCloud } from '../assets/Icons';
import { Card } from '../components/Card';
import { createFetcher, downloadFile } from '../utils/fetcher';
import { uploadUserFile } from '../utils/uploadUserFile';
import { t } from '../utils/locale';
import { mustConfirm } from '../utils/mustConfirm';
import { IMatchResponse } from '../../../common/types/match';
import { Modal } from '../components/Modal';

const checkLiveMatches = async (): Promise<boolean> => {
	const fetcher = createFetcher();
	const liveMatches = await fetcher<IMatchResponse[]>('GET', '/api/matches?isLive=true');
	return liveMatches !== undefined && liveMatches.length > 0;
};

const downloadDB = async () => {
	const now = new Date();
	downloadFile(
		'/api/storage/database',
		'TMT2-' +
			now.getFullYear() +
			String(now.getMonth() + 1).padStart(2, '0') +
			String(now.getDate()).padStart(2, '0') +
			'-' +
			String(now.getHours()).padStart(2, '0') +
			String(now.getMinutes()).padStart(2, '0') +
			String(now.getSeconds()).padStart(2, '0') +
			'.sqlite'
	);
};

export const DataManagementPage = () => {
	const fetcher = createFetcher();
	let errorModalRef: HTMLDialogElement | undefined;

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
						onClick={async () => {
							if (await checkLiveMatches()) {
								errorModalRef?.showModal();
							} else {
								mustConfirm(() => {
									downloadDB();
									uploadUserFile('/api/storage/database');
								}, t('This action will overwrite the current DB. A backup will be downloaded, just in case.'))();
							}
						}}
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
						onClick={async () => {
							if (await checkLiveMatches()) {
								errorModalRef?.showModal();
							} else {
								mustConfirm(() => {
									downloadDB();
									fetcher('DELETE', '/api/stats');
								}, t('This action is destructive. A backup of the DB will be downloaded, just in case.'))();
							}
						}}
					>
						<SvgDelete />
						{t('Delete stats')}
					</button>
					<button
						class="btn text-error"
						onClick={async () => {
							if (await checkLiveMatches()) {
								errorModalRef?.showModal();
							} else {
								mustConfirm(() => {
									downloadDB();
									fetcher('DELETE', '/api/storage/database');
								}, t('This action is destructive. A backup of the DB will be downloaded, just in case.'))();
							}
						}}
					>
						<SvgDelete />
						{t('Empty DB')}
					</button>
				</div>
			</Card>
			<Modal ref={errorModalRef}>
				{/* TODO: replace with a notification once that's implemented */}
				<div class="prose">
					<h2 class="text-error">{t('Error')}</h2>
					<p>
						{t(
							'Cannot perform this operation while there are live matches. Please end all matches and try again.'
						)}
					</p>
					<div class="flex justify-end">
						<button class="btn btn-neutral" onClick={() => errorModalRef?.close()}>
							{t('OK')}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
};
