import { createFetcher } from './fetcher';

export const uploadUserFile = async (url: string): Promise<Response> => {
	var input = document.createElement('input');
	input.type = 'file';
	input.onchange = (e) => {
		const inputElement = e.target as HTMLInputElement | null;
		if (inputElement && inputElement.files && inputElement.files[0]) {
			const file = inputElement.files[0];

			const formData = new FormData();
			formData.append('database', file);

			const fetcher = createFetcher();
			fetcher('POST', url, formData, undefined, false);
		}
	};
	input.click();

	return Promise.resolve(new Response());
};
