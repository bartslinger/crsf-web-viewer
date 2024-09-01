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
	import MapMarker from '$lib/components/MapMarker.svelte';

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
		if (port !== null) {
			await clickDisconnect();
			return;
		}
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

<div class="fixed inset-0 flex flex-col bg-gray-900 text-white text-xl">
	<div class="p-2 flex items-center flex-wrap gap-x-2 gap-y-4">
		<button
			type="button"
			class="w-32 me-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
			on:click={clickConnect}>{port === null ? 'Connect' : 'Disconnect'}</button
		>
		<div class="flex gap-2 items-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class=""
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"
				/><path d="M6 5v-2" /><path d="M18 3v2" /><path d="M6.5 12h3" /><path d="M14.5 12h3" /><path
					d="M16 10.5v3"
				/></svg
			>
			<p class="min-w-16">
				{(messages.battery?.remaining || 0).toFixed(0)} %
			</p>
			<p class="w-20">
				{(messages.battery?.voltage || 0).toFixed(2)} V
			</p>
		</div>
		<div class="flex gap-2 items-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class=""
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M7.038 4.5a9 9 0 0 0 -2.495 2.47"
				/><path d="M3.186 10.209a9 9 0 0 0 0 3.508" /><path
					d="M4.5 16.962a9 9 0 0 0 2.47 2.495"
				/><path d="M10.209 20.814a9 9 0 0 0 3.5 0" /><path
					d="M16.962 19.5a9 9 0 0 0 2.495 -2.47"
				/><path d="M20.814 13.791a9 9 0 0 0 0 -3.508" /><path
					d="M19.5 7.038a9 9 0 0 0 -2.47 -2.495"
				/><path d="M13.791 3.186a9 9 0 0 0 -3.508 -.02" /><path d="M12 8l-2 4h4l-2 4" /><path
					d="M12 21a9 9 0 0 0 0 -18"
				/></svg
			>
			<p class="w-16">
				{(messages.battery?.current || 0).toFixed(1)} A
			</p>
		</div>
		<div class="flex gap-2 items-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class=""
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M6 7h11a2 2 0 0 1 2 2v.5a.5 .5 0 0 0 .5 .5a.5 .5 0 0 1 .5 .5v3a.5 .5 0 0 1 -.5 .5a.5 .5 0 0 0 -.5 .5v.5a2 2 0 0 1 -2 2h-11a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2"
				/><path d="M7 10l0 4" /><path d="M10 10l0 4" /></svg
			>
			<p class="w-28">
				{messages.battery?.capacity || 0} mAh
			</p>
		</div>
		<div class="flex gap-2 items-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class=""
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M5 13a7 7 0 1 0 14 0a7 7 0 0 0 -14 0z"
				/><path d="M14.5 10.5l-2.5 2.5" /><path d="M17 8l1 -1" /><path d="M14 3h-4" /></svg
			>
			<p class="w-16">
				{messages.radio?.offset || 0} us
			</p>
		</div>
	</div>
	<Map lat={0} lon={0} zoom={2}>
		{#if messages.gps}
			<MapMarker
				lat={messages.gps.latitude}
				lon={messages.gps.longitude}
				hdg={messages.gps.course}
			/>
		{/if}
	</Map>
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
