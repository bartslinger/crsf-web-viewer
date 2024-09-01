<script lang="ts">
	import { getContext } from 'svelte';
	import { mapbox, key } from '$lib/mapbox';
	import type { MapContext } from '$lib/mapbox';

	const { getMap } = getContext<MapContext>(key);
	const map = getMap();

	export let lat: number;
	export let lon: number;
	export let hdg: number;

	// Create the SVG element
	const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svgEl.setAttributeNS(null, 'fill', 'none');
	svgEl.setAttributeNS(null, 'viewBox', '0 0 32 32');
	svgEl.setAttributeNS(null, 'stroke-width', '1.0');
	svgEl.setAttributeNS(null, 'stroke', 'currentColor');
	// svgEl.setAttributeNS(null, 'transform', 'rotate(-90 0 0)');

	// Create the class attribute
	svgEl.setAttribute('class', 'w-12 h-12');

	// Create the path element
	const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	pathEl.setAttributeNS(null, 'stroke-linecap', 'round');
	pathEl.setAttributeNS(null, 'stroke-linejoin', 'round');
	pathEl.setAttributeNS(
		null,
		'd',
		'M15.521 3.91c0.828 0 1.5 0.672 1.5 1.5v7.75l10 6.25v2.688l-10-3.375v5.25l2.039 2.029-0.001 2.084-3.538-1.176-3.487 1.18 0.015-2.189 1.91-1.865 0.017-5.312-9.997 3.436 0.021-2.75 10.007-6.313 0.016-7.688c-0.002-0.827 0.67-1.499 1.498-1.499z'
	);

	// Set the path color to white and fill it with blue
	pathEl.setAttributeNS(null, 'stroke', 'rgb(243 244 246)');
	// pathEl.setAttributeNS(null, 'fill', '#60a5fa');
	pathEl.setAttributeNS(null, 'fill', 'rgb(31 41 55)');

	// Append the path to the SVG
	svgEl.appendChild(pathEl);

	const markerEl = document.createElement('div');
	markerEl.appendChild(svgEl);

	const marker = new mapbox.Marker(markerEl).setLngLat([lon, lat]).addTo(map);
	let flown = false;

	$: {
		if (!flown && lat !== 0 && lon !== 0) {
			flown = true;
			map.flyTo({
				center: [lon, lat],
				zoom: 13,
				animate: true,
				duration: 1000
			});
		}
		let mapBearing = map.getBearing();
		marker.setLngLat([lon, lat]);
		marker.setRotation(hdg - mapBearing);
	}
</script>

<div class="bg-gray-100"></div>
