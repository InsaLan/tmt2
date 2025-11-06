import { Component, onCleanup, onMount, Show } from 'solid-js';
import { SvgCheck, SvgClear } from '../assets/Icons';
import { t } from '../utils/locale';
import { Modal } from './Modal';

// Do not use directly. Use the `mustConfirm` util instead.
export const ConfirmationModal: Component<{
	msg?: string;
	onConfirm: () => void;
	onCancel?: () => void;
}> = (props) => {
	let modalRef: HTMLDialogElement | undefined;
	let ok = false;

	onMount(() => {
		modalRef?.showModal();

		const handleClose = () => {
			if (ok) {
				props.onConfirm();
			} else {
				props.onCancel?.();
			}
		};
		modalRef?.addEventListener('close', handleClose);

		onCleanup(() => {
			modalRef?.removeEventListener('close', handleClose);
		});
	});

	return (
		<Modal ref={modalRef}>
			<div class="prose">
				<h2>{t('Are you sure ?')}</h2>
				<Show when={props.msg}>
					<p>{props.msg}</p>
				</Show>
				<div class="flex justify-end gap-4">
					<button
						class="btn btn-neutral text-error"
						onClick={() => {
							ok = true;
							modalRef?.close();
						}}
					>
						<SvgCheck />
						{t('Confirm')}
					</button>
					<button
						class="btn btn-neutral"
						onClick={() => {
							modalRef?.close();
						}}
					>
						<SvgClear />
						{t('Cancel')}
					</button>
				</div>
			</div>
		</Modal>
	);
};
