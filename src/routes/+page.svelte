<script lang="ts">
	import { onMount } from 'svelte';

	let port: any = null;
	let reader: any = null;

	let recording = [];
	let output = '';

	const startListening = async () => {
		recording = [];
		reader = port.readable.getReader();
		// Listen to data coming from the serial device.
		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				reader.releaseLock();
				break;
			}
			// value is a byte array.
			console.log(value);
			recording.push(value);
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
			await port.close();
			console.log('port closed');
			port = null;

			output = JSON.stringify(recording);
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

<div class="h-full flex items-center justify-center">
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
<pre>
		{output}
	</pre>
