'use client';

import {useToast} from '@/hooks/use-toast';
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
	const {toasts} = useToast();

	return (
		<ToastProvider>
			{toasts.map(function ({id, title, description, action, ...props}) {
				return (
					<Toast key={id} {...props}>
						<div className='grid gap-1'>
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>
									{description}
								</ToastDescription>
							)}
						</div>

                        <div className='flex gap-2 items-center '>


                        <div>

						{action}
                        </div>
						<ToastClose />   </div>
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}
