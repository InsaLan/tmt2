import { SvgCheck, SvgClear, SvgDelete, SvgDownloadArchive, SvgUploadCloud } from '../assets/Icons';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { createFetcher, downloadFile } from '../utils/fetcher';
import { t } from '../utils/locale';

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
}

export const DataManagementPage = () => {
	const fetcher = createFetcher();
	let modalAction = async () => {};
	let modalRef: HTMLDialogElement | undefined;

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
						onClick={() => {
							let modalAction = () => {
								//TODO
							};
							modalRef?.showModal();
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
						onClick={() => {
							let modalAction = () => {
								fetcher('DELETE', '/api/storage/stats')
							};
							modalRef?.showModal();
						}}
					>
						<SvgDelete />
						{t('Delete stats')}
					</button>
					<button
						class="btn text-error"
						onClick={() => {
							let modalAction = () => {
								fetcher('DELETE', '/api/storage/database');
							};
							modalRef?.showModal();
						}}
					>
						<SvgDelete />
						{t('Empty DB')}
					</button>
				</div>
				<Modal ref={modalRef}>
					<div class="prose">
						<h2>{t('Are you sure ?')}</h2>
						<p>
							{t(
								'This action is destructive. A backup of the DB will be downloaded, just in case.'
							)}
						</p>
						<div class="flex justify-end gap-4">
							<button
								class="btn btn-neutral text-error"
								onClick={() => {
									modalRef?.close();
									downloadDB();
									modalAction();
								}}
							>
								<SvgCheck />
								{t('Confirm')}
							</button>
							<button class="btn btn-neutral" onClick={() => modalRef?.close()}>
								<SvgClear />
								{t('Cancel')}
							</button>
						</div>
					</div>
				</Modal>
			</Card>
		</div>
	);
};
