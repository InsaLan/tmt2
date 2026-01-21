import { RouteSectionProps } from '@solidjs/router';
import { Component, Match, Show, Switch, createEffect, createSignal, onMount } from 'solid-js';
import { SvgComputer, SvgDarkMode, SvgLightMode } from './assets/Icons';
import logo from './assets/logo.png';
import logo_black from './assets/logo-black.png';

import { loginType, createFetcher } from './utils/fetcher';
import { t } from './utils/locale';
import { currentMode, currentTheme, cycleDarkMode, updateDarkClasses } from './utils/theme';
import { IConfig } from '../../common';
import { NavLink } from './components/NavLink';

const NavBar: Component = () => {
	const fetcher = createFetcher();
	const [config, setConfig] = createSignal<IConfig>();

	createEffect(() => {
		fetcher<IConfig>('GET', `/api/config`).then((c) => {
			setConfig(c);
		});
	});

	const Links = () => {
		return (
			<>
				<NavLink href="/stats">{t('Statistics')}</NavLink>
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
						<NavLink href="/data">{t('Data Management')}</NavLink>
						<NavLink href="/logout">{t('Logout')}</NavLink>
					</Match>
				</Switch>
			</>
		);
	};

	return (
		<div class="navbar bg-base-300">
			<div class="navbar-start">
				<div class="dropdown">
					<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h8m-8 6h12"
							/>
						</svg>
					</div>
					<ul
						tabindex="-1"
						class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
					>
						<Links />
					</ul>
				</div>
				<div>
					<img
						class="mr-4 inline-block h-10 w-auto align-middle"
						src={currentMode() === 'dark' ? logo : logo_black}
						alt="Logo"
					/>
				</div>
				<div class="align-middle text-l lg:inline-block font-bold">TMT2</div>
			</div>
			<div class="navbar-center hidden lg:flex">
				<Links />
			</div>
			<div class="navbar-end">
				<div onClick={() => cycleDarkMode()} class="btn btn-ghost">
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
		</div>
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
