/* @refresh reload */
import { Navigate, Route, Router } from '@solidjs/router';
import { render } from 'solid-js/web';
import { App } from './App';
import { PlayersStatsPage, PlayerStatsPage, MatchesStatsPage, MatchStatsPage } from './pages/stats';
import { DataManagementPage } from './pages/dataManagement';
import { CreatePage } from './pages/create';
import { DebugPage } from './pages/debug';
import { GameServerPage } from './pages/gameServer';
import { GameServersPage } from './pages/gameServers';
import { LoginPage } from './pages/login';
import { LogoutPage } from './pages/logout';
import { MatchPage } from './pages/match';
import { MatchEditPage } from './pages/matchEdit';
import { MatchesPage } from './pages/matches';
import { NotFoundPage } from './pages/notFound';
import { loginType } from './utils/fetcher';

import './index.css';
import { JSX } from 'solid-js';

// This is just for user experience, as all the backend routes are secured anyway (but some pages don't fetch data immediately)
const Authenticate = (props: { children: JSX.Element; type?: 'GLOBAL' | 'MATCH' }) => {
	return loginType()?.type === 'GLOBAL' ? props.children : loginType()?.type === 'MATCH' && props.type === 'MATCH' ? props.children : <Navigate href="/login" />;
};

const renderRoutes = () => (
	<Router root={App}>
		{[
			{ path: "/", component: () => <Navigate href="/stats" /> },
			{ path: "/stats", component: () => <Navigate href="/stats/players" /> },
			{ path: "/stats/players", component: () => <PlayersStatsPage /> },
			{ path: "/stats/player/:id", component: () => <PlayerStatsPage /> },
			{ path: "/stats/matches", component: () => <MatchesStatsPage /> },
			{ path: "/stats/match/:id", component: () => <MatchStatsPage />},
			{ path: "/data", component: () => <Authenticate><DataManagementPage /></Authenticate> },
			{ path: "/matches", component: () => <Authenticate type='MATCH'><MatchesPage /></Authenticate> },
			{ path: "/matches/:id", component: () => <Authenticate type='MATCH'><MatchPage /></Authenticate> },
			{ path: "/matches/:id/edit", component: () => <Authenticate type='MATCH'><MatchEditPage /></Authenticate> },
			{ path: "/gameservers/:ipPort", component: () => <Authenticate><GameServerPage /></Authenticate> },
			{ path: "/gameservers", component: () => <Authenticate><GameServersPage /></Authenticate> },
			{ path: "/login", component: LoginPage },
			{ path: "/logout", component: LogoutPage },
			{ path: "/create", component: () => <CreatePage /> },
			{ path: "/debug", component: () => <Authenticate><DebugPage /></Authenticate> },
			{ path: "/*", component: NotFoundPage },
		].map(route => (
			<Route path={route.path} component={route.component} />
		))}
	</Router>
);

render(renderRoutes, document.getElementById('root') as HTMLElement);
