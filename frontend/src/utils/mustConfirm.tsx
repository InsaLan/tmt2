import { render } from 'solid-js/web';
import { ConfirmationModal } from '../components/ConfirmationModal';

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
				}}
			/>
		),
		host
	);
};
