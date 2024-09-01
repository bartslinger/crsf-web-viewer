<script lang="ts">
	import { onDestroy, onMount, setContext } from 'svelte';
	import { mapbox, key } from '$lib/mapbox';
	import type { MapContext } from '$lib/mapbox';

	setContext<MapContext>(key, {
		getMap: () => map
	});

	export let lat: number;
	export let lon: number;
	export let zoom: number;

	let container: HTMLDivElement;
	let map: mapbox.Map;

	function load() {
		map = new mapbox.Map({
			container,
			style: 'mapbox://styles/mapbox/satellite-streets-v11',
			center: [lon, lat],
			zoom,
			attributionControl: true,
			logoPosition: 'bottom-right'
		});
		map.addControl(new mapbox.NavigationControl());

		map.on('load', () => {});
	}

	onMount(() => {
		load();
	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<!-- this special element will be explained in a later section -->
<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/mapbox-gl/dist/mapbox-gl.css" />
</svelte:head>

<div bind:this={container}>
	{#if map}
		<slot />
	{/if}
</div>

<style>
	div {
		width: 100%;
		height: 100%;
	}
</style>
