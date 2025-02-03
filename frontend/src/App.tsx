import { A, AnchorProps, RouteSectionProps } from '@solidjs/router';
import { Component, Match, Show, Switch, createEffect, createSignal, onMount } from 'solid-js';
import { SvgComputer, SvgDarkMode, SvgLightMode } from './assets/Icons';
import logo from './assets/logo.svg';

import { loginType, createFetcher } from './utils/fetcher';
import { t } from './utils/locale';
import { currentTheme, cycleDarkMode, updateDarkClasses } from './utils/theme';
import { IConfig } from '../../common';

const NavLink = (props: AnchorProps) => {
	return (
		<A {...props} class="btn btn-ghost hover:no-underline">
			{props.children}
		</A>
	);
};

const NavBar: Component = () => {
	const fetcher = createFetcher();
	const [config, setConfig] = createSignal<IConfig>();

	createEffect(() => {
		fetcher<IConfig>('GET', `/api/config`).then((c) => {
			setConfig(c);
		});
	});

	return (
		<nav class="bg-base-300 flex items-center justify-center p-2">
			<div class="w-1 lg:w-20"></div>
			<div class="flex-1 flex justify-start">
				<div class="flex-shrink-0">
					<img class="mr-1 inline-block h-10 w-auto align-middle" src={logo} alt="Logo" />
					<div class="inline-block align-middle text-xs lg:hidden">TMT</div>
					<div class="hidden align-middle text-xs lg:inline-block">
						Tournament
						<br />
						MatchTracker
					</div>
				</div>
			</div>
			<div class="flex-2">
				<div class="flex justify-center gap-4">
					<Show
						when={
							config()?.allowUnregisteredMatchCreation === true ||
							loginType()?.type === 'GLOBAL'
						}
					>
						<NavLink href="/create">{t('Create')}</NavLink>
					</Show>
					<Switch>
						<Match when={loginType() === undefined}>...</Match>
						<Match when={loginType()?.type === 'UNAUTHORIZED'}>
							<NavLink href="/login">{t('Login')}</NavLink>
						</Match>
						<Match when={loginType()?.type === 'MATCH'}>
							<NavLink href="/matches">{t('Matches')}</NavLink>
							<NavLink href="/logout">{t('Logout')}</NavLink>
						</Match>
						<Match when={loginType()?.type === 'GLOBAL'}>
							<NavLink href="/matches">{t('Matches')}</NavLink>
							<NavLink href="/gameservers">{t('Game Servers')}</NavLink>
							<NavLink href="/logout">{t('Logout')}</NavLink>
						</Match>
					</Switch>
				</div>
			</div>
			<div class="flex-1 flex justify-end">
				<div class="flex-shrink-0" onClick={() => cycleDarkMode()}>
					<Switch>
						<Match when={currentTheme() === 'system'}>
							<SvgComputer class="fill-base-content cursor-pointer" />
						</Match>
						<Match when={currentTheme() === 'dark'}>
							<SvgDarkMode class="fill-base-content cursor-pointer" />
						</Match>
						<Match when={currentTheme() === 'light'}>
							<SvgLightMode class="fill-base-content cursor-pointer" />
						</Match>
					</Switch>
				</div>
			</div>
			{/* <div onClick={() => cycleLocale()}>
				<Switch>
					<Match when={currentLocale() === 'de'}>
						<SvgFlagDE class="h-6 w-auto cursor-pointer" />
					</Match>
					<Match when={currentLocale() === 'en'}>
						<SvgFlagUS class="h-6 w-auto cursor-pointer" />
					</Match>
				</Switch>
			</div> */}
			<div class="w-1 lg:w-20"></div>
		</nav>
	);
};

export const App: Component<RouteSectionProps> = (props) => {
	onMount(updateDarkClasses);
	return (
		<>
			<header class="sticky top-0 z-10 pb-8">
				<NavBar />
			</header>
			<main class="container mx-auto px-4">{props.children}</main>
			<footer class="pt-8"></footer>
		</>
	);
};
