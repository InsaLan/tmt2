import { addNotification } from '../stores/notifications';
import { t } from './locale';

/**
 * Based on https://stackoverflow.com/a/65996386
 *
 * @param textToCopy
 * @param node Set this to a HTML Element. Needed if copy button is in a modal.
 */
export const copyToClipboard = async (textToCopy: string, node?: HTMLElement) => {
	// Navigator clipboard api needs a secure context (https)
	if (navigator.clipboard && window.isSecureContext) {
		await navigator.clipboard.writeText(textToCopy);
		addNotification(t('Text copied to clipboard.'));
	} else {
		// Use the 'out of viewport hidden text area' trick
		const textArea = document.createElement('textarea');
		textArea.value = textToCopy;

		// Move textarea out of the viewport so it's not visible
		textArea.style.position = 'absolute';
		textArea.style.left = '-999999px';

		(node ?? document.body).prepend(textArea);
		textArea.select();

		try {
			document.execCommand('copy');
			addNotification(t('Text copied to clipboard.'));
		} finally {
			textArea.remove();
		}
	}
};
