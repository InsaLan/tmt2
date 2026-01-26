import { render } from 'solid-js/web';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { addNotification } from '../stores/notifications';
import { t } from './locale';

export const mustConfirm = (fn: Function, msg?: string) => () => {
	const host = document.createElement('div');
	document.body.appendChild(host);

	const dispose = render(
		() => (
			<ConfirmationModal
				msg={msg}
				onConfirm={() => {
					dispose();
					host.remove();
					fn();
				}}
				onCancel={() => {
					dispose();
					host.remove();
					addNotification(t('Action cancelled.'));
				}}
			/>
		),
		host
	);
};
