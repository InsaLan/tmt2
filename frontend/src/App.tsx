import { RouteSectionProps } from '@solidjs/router';
import { Component, onMount } from 'solid-js';

import NotificationContainer from './components/NotificationContainer';
import { updateDarkClasses } from './utils/theme';

import { Footer } from './components/Footer';
import { NavBar } from './components/NavBar';

export const App: Component<RouteSectionProps> = (props) => {
	onMount(updateDarkClasses);
	return (
		<div class="min-h-screen flex flex-col">
			<header class="sticky top-0 z-10 pb-8">
				<NavBar />
			</header>
			<main class="container mx-auto px-4 flex-1">{props.children}</main>
			<footer class="pt-8">
				<Footer />
			</footer>
			<NotificationContainer />
		</div>
	);
};
