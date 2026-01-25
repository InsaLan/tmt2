import { AnchorProps, A } from '@solidjs/router';

export const NavLink = (props: AnchorProps) => {
	return (
		<A
			{...props}
			class="btn btn-ghost hover:ring-2 hover:ring-primary-content"
			activeClass="ring-2 ring-primary" // This class will be added when route matches
		>
			{props.children}
		</A>
	);
};
