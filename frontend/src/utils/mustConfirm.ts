import { t } from './locale';

export const mustConfirm =
	(fn: Function, msg = t('Caution, please confirm')) =>
	() => {
		if (confirm(msg)) {
			fn();
		}
	};
