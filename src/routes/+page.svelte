<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CrsfFramingTransformer,
		CrsfMessageTransformer,
		type CrsfRadioIdMessage
	} from '$lib/crsf';

	let port: any = null;
	let reader: any = null;
	let readableStreamClosed: any = null;
	let framingDecoderStreamClosed: any = null;

	let radio_id: CrsfRadioIdMessage | undefined;

	const startListening = async () => {
		const crsfFramingDecoder = new TransformStream(new CrsfFramingTransformer());
		const crsfMessageDecoder = new TransformStream(new CrsfMessageTransformer());
		readableStreamClosed = port.readable.pipeTo(crsfFramingDecoder.writable);
		framingDecoderStreamClosed = crsfFramingDecoder.readable.pipeTo(crsfMessageDecoder.writable);
		reader = crsfMessageDecoder.readable.getReader();

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (value.type === 'RADIO_ID') {
				radio_id = value;
			}
		}
	};

	const clickConnect = async () => {
		if ('serial' in navigator) {
			port = await navigator.serial.requestPort();
			if (port) {
				console.log(port);
				await port.open({ baudRate: 115200 });
				console.log('port open');
				await startListening();
			}
		}
	};

	const clickDisconnect = async () => {
		if (port) {
			await reader.cancel();
			await framingDecoderStreamClosed.catch(() => {});
			await readableStreamClosed.catch(() => {});
			await port.close();
			console.log('port closed');
			port = null;
		}
	};

	onMount(() => {
		if ('serial' in navigator) {
			navigator.serial.addEventListener('connect', (event) => {
				console.log('connect event');
			});

			navigator.serial.addEventListener('disconnect', (event) => {
				console.log('disconnect event');
			});
		}
	});
</script>

<div class="h-full flex flex-col items-center justify-start mt-10">
	<div>
		<button
			type="button"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			on:click={clickConnect}>Connect</button
		>
		<button
			type="button"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			on:click={clickDisconnect}>Disconnect</button
		>
	</div>
	<div>
		{Math.round(1000000 / (radio_id?.update_interval || 0))}Hz
	</div>
	<div>
		{radio_id?.offset}
	</div>
</div>
