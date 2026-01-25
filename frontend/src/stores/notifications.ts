import { createSignal } from 'solid-js';

export type Notification = {
	id: number;
	type: 'info' | 'warning' | 'error';
	message: string;
};

const [notifications, setNotifications] = createSignal<Notification[]>([]);

export function addNotification(
	message: string,
	type: Notification['type'] = 'info',
	timeout = 3000
) {
	const id = Date.now();
	setNotifications((n) => [...n, { id, message, type }]);

	setTimeout(() => {
		setNotifications((n) => n.filter((notif) => notif.id !== id));
	}, timeout);
}

export { notifications };
