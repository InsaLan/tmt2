import { For } from 'solid-js';
import { TransitionGroup } from 'solid-transition-group';
import { notifications } from '../stores/notifications';
import { SvgError, SvgInfo, SvgWarning } from '../assets/Icons';

export default function NotificationContainer() {
	return (
		<div class="fixed bottom-0 right-0 w-full md:w-96 p-4 flex flex-col gap-4 z-50">
			<TransitionGroup name="slide">
				<For each={notifications()}>
					{(notif) => (
						<div
							class="rounded-2xl p-3 shadow-lg w-full flex flex-row gap-2 items-center"
							classList={{
								'bg-info text-info-content': notif.type === 'info',
								'bg-warning text-warning-content': notif.type === 'warning',
								'bg-error text-error-content': notif.type === 'error',
							}}
						>
							{notif.type === 'info' && <SvgInfo />}
							{notif.type === 'warning' && <SvgWarning />}
							{notif.type === 'error' && <SvgError />}
							<div class="w-full">{notif.message}</div>
						</div>
					)}
				</For>
			</TransitionGroup>
		</div>
	);
}
