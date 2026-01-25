import { createFetcher } from './fetcher';
import { t } from './locale';

export const uploadUserFile = async (url: string): Promise<Response> => {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.onchange = async (e) => {
			const inputElement = e.target as HTMLInputElement | null;
			if (inputElement && inputElement.files && inputElement.files[0]) {
				const file = inputElement.files[0];

				const formData = new FormData();
				formData.append('file', file);

				const fetcher = createFetcher();
				try {
					const response = (await fetcher(
						'POST',
						url,
						formData,
						undefined,
						false
					)) as Response;
					if (!response.ok) {
						throw new Error(t('Upload failed with status') + ' ' + response.status);
					}
					resolve(response);
				} catch (error) {
					reject(error);
				}
			}
		};
		input.click();
	});
};
