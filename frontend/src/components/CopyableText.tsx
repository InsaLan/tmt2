import { SvgCopy } from '../assets/Icons';
import { copyToClipboard } from '../utils/copyToClipboard';

export const CopyableText = (props: { text: string; copyText: string }) => {
	return (
		<div
			class="btn btn-ghost rounded-full btn-sm text-gray-500 text-sm gap-1"
			onClick={() => {
				copyToClipboard(props.copyText);
			}}
		>
			{props.text}
			<button class="align-middle">
				<SvgCopy class="size-4 cursor-pointer" />
			</button>
		</div>
	);
};
