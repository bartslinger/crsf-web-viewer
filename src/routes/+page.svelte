<script lang="ts">
	import { onMount } from 'svelte';
	import {
		type CrsfBatteryMessage,
		CrsfFramingTransformer,
		type CrsfGpsMessage,
		CrsfMessageTransformer,
		type CrsfRadioMessage
	} from '$lib/crsf';
	import { serial as polyfill } from 'web-serial-polyfill';
	import Map from '$lib/components/Map.svelte';

	let port: any = null;
	let reader: any = null;
	let readableStreamClosed: any = null;
	let framingDecoderStreamClosed: any = null;

	let messages: {
		radio: CrsfRadioMessage | undefined;
		battery: CrsfBatteryMessage | undefined;
		gps: CrsfGpsMessage | undefined;
	} = {};

	const startListening = async () => {
		const crsfFramingDecoder = new TransformStream(new CrsfFramingTransformer());
		const crsfMessageDecoder = new TransformStream(new CrsfMessageTransformer());
		readableStreamClosed = port.readable.pipeTo(crsfFramingDecoder.writable);
		framingDecoderStreamClosed = crsfFramingDecoder.readable.pipeTo(crsfMessageDecoder.writable);
		reader = crsfMessageDecoder.readable.getReader();

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (value.type === 'RADIO') {
				messages.radio = value;
			} else if (value.type === 'BATTERY') {
				messages.battery = value;
			} else if (value.type === 'GPS') {
				messages.gps = value;
			}
		}
	};

	const clickConnect = async () => {
		let serial;
		if ('serial' in navigator) {
			serial = navigator.serial;
		} else {
			serial = polyfill;
		}
		port = await serial.requestPort();
		if (port) {
			console.log(port);
			await port.open({ baudRate: 115200 });
			console.log('port open');
			await startListening();
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
		let serial;
		if ('serial' in navigator) {
			serial = navigator.serial;
		} else {
			serial = polyfill;
		}
		serial.addEventListener('connect', (event) => {
			console.log('connect event');
		});

		serial.addEventListener('disconnect', (event) => {
			console.log('disconnect event');
		});
	});
</script>

<div class="fixed inset-0 flex flex-col bg-stone-800 text-white">
	<div class="p-2">top bar</div>
	<Map lat={0} lon={0} zoom={2} />
	<div class="p-2">bottom bar</div>
</div>
<!--<div class="h-full flex flex-col items-center justify-start mt-10">-->
<!--	<div>-->
<!--		<button-->
<!--			type="button"-->
<!--			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"-->
<!--			on:click={clickConnect}>Connect</button-->
<!--		>-->
<!--		<button-->
<!--			type="button"-->
<!--			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"-->
<!--			on:click={clickDisconnect}>Disconnect</button-->
<!--		>-->
<!--	</div>-->
<!--	<table class="mt-10 table-fixed">-->
<!--		<tr>-->
<!--			<td class="p-4 bg-gray-100 text-lg font-semibold w-56"> MESSAGE_TYPE </td>-->
<!--			<td class="p-4 bg-gray-100 text-lg font-semibold w-96">Data</td>-->
<!--		</tr>-->
<!--		{#if messages.radio}-->
<!--			<tr>-->
<!--				<td class="p-4"> RADIO </td>-->
<!--				<td class="p-4">-->
<!--					<p>-->
<!--						Frequency: {Math.round(1000000 / (messages.radio?.update_interval || 0))}Hz-->
<!--					</p>-->
<!--					<p>-->
<!--						Offset: {messages.radio?.offset}-->
<!--					</p>-->
<!--				</td>-->
<!--			</tr>-->
<!--		{/if}-->
<!--		{#if messages.battery}-->
<!--			<tr>-->
<!--				<td class="p-4"> BATTERY </td>-->
<!--				<td class="p-4">-->
<!--					<p>-->
<!--						Voltage: {messages.battery.voltage}V-->
<!--					</p>-->
<!--					<p>-->
<!--						Current: {messages.battery.current}A-->
<!--					</p>-->
<!--					<p>-->
<!--						Capacity: {messages.battery.capacity}mAh-->
<!--					</p>-->
<!--					<p>-->
<!--						Remaining: {messages.battery.remaining}%-->
<!--					</p>-->
<!--				</td>-->
<!--			</tr>-->
<!--		{/if}-->
<!--		{#if messages.gps}-->
<!--			<tr>-->
<!--				<td class="p-4"> GPS </td>-->
<!--				<td class="p-4">-->
<!--					<p>-->
<!--						Latitude: {messages.gps.latitude}-->
<!--					</p>-->
<!--					<p>-->
<!--						Longitude: {messages.gps.longitude}-->
<!--					</p>-->
<!--					<p>-->
<!--						Groundspeed: {(messages.gps.groundspeed / 100).toFixed(2)}-->
<!--					</p>-->
<!--					<p>-->
<!--						Course: {messages.gps.course}-->
<!--					</p>-->
<!--					<p>-->
<!--						Altitude: {messages.gps.altitude}-->
<!--					</p>-->
<!--					<p>-->
<!--						Satellites: {messages.gps.satellites}-->
<!--					</p>-->
<!--				</td>-->
<!--			</tr>{/if}-->
<!--	</table>-->
<!--</div>-->
