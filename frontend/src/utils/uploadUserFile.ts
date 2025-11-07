import { createFetcher } from './fetcher';

export const uploadUserFile = async (url: string): Promise<Response> => {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.onchange = async (e) => {
			const inputElement = e.target as HTMLInputElement | null;
			if (inputElement && inputElement.files && inputElement.files[0]) {
				const file = inputElement.files[0];

				const formData = new FormData();
				formData.append('database', file);

				const fetcher = createFetcher();
				try {
					const response = (await fetcher(
						'POST',
						url,
						formData,
						undefined,
						false
					)) as Response;
					resolve(response);
				} catch (error) {
					reject(error);
				}
			}
		};
		input.click();
	});
};
