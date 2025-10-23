import { SvgDelete, SvgDownloadArchive, SvgUploadCloud } from '../assets/Icons';
import { Card } from '../components/Card';
import { downloadFile } from '../utils/fetcher';
import { t } from '../utils/locale';

export const DataManagementPage = () => {
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
						}}
					>
						<SvgDownloadArchive />
						{t('Download DB')}
					</button>
					<button class="btn text-error" onClick={() => {}}>
						<SvgUploadCloud />
						{t('Import DB')}
					</button>
				</div>
				<div class="prose py-4">
					<h2>{t('Cleanup')}</h2>
				</div>
				<div class="items-center justify-center flex gap-4">
					<button class="btn text-error" onClick={() => {}}>
						<SvgDelete />
						{t('Delete stats')}
					</button>
					<button class="btn text-error" onClick={() => {}}>
						<SvgDelete />
						{t('Empty DB')}
					</button>
				</div>
			</Card>
		</div>
	);
};
