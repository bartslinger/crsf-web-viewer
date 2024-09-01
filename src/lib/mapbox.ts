import mapbox from 'mapbox-gl';

// https://docs.mapbox.com/help/glossary/access-token/
mapbox.accessToken =
	'pk.eyJ1IjoibWFwdHVyZSIsImEiOiJjbTBqbmdpbDQwemxyMmpzaGJtb2YyamYyIn0.oow6a5TOps3M4DhblMnlAA';

const key = Symbol();

type MapContext = { getMap: () => mapbox.Map };

export { mapbox, key };
export type { MapContext };
