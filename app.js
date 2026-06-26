/* ============================================================================
   YOUR VENUE — everything is coordinate-based. Draw in geojson.io, paste here.
   Coordinates are always [longitude, latitude].

   • FIELDS / ZONES : draw a polygon, paste its ring of corners as `ring`.
   • PATHS          : draw a line, paste its points as `coords`.
   • STANDS/AMENITIES: draw a point, paste its [lng,lat] as `at`.
   ============================================================================ */

// Football pitches — green, with the field's name shown in the centre.
const FIELDS = [
  { name: "Plan 1", ring: [[12.115689,57.3538176],[12.1165974,57.353901],[12.1166473,57.3537422],[12.1157389,57.353656],[12.115694,57.3538176]] },
  { name: "Plan 2", ring: [[12.115745581430303,57.35353519273261],[12.116643881430303,57.353630392732605],[12.116699981430303,57.35346159273261],[12.115801681430304,57.353383692732606],[12.115753581430303,57.35353519273261]] },
];

// Areas — parking, restaurant, toilets, etc. (polygons with a label)
const ZONES = [
  { name:"Restaurang", icon:"🍽️", color:"#d4663b", ring:[[12.1141027,57.3545732],[12.1141385,57.354455],[12.1143353,57.3544719],[12.1143165,57.3545293],[12.114644,57.3545636],[12.1146216,57.3546312],[12.1141027,57.3545732]] },
  { name:"Toalett",    icon:"🚻", color:"#8fa9bb", ring:[[12.1139339,57.3544059],[12.1139632,57.3543289],[12.1140694,57.3543387],[12.1140365,57.3544158],[12.1139339,57.3544039]] },
  { name:"Parkering",  icon:"🅿️", color:"#c9c2ac", ring:[[12.1132457,57.3580106],[12.1170516,57.358331],[12.1174368,57.3576409],[12.1134155,57.3572007],[12.1132457,57.3580106]] },
];

// Walking routes (lines)
const PATHS = [
  { name:"Gångväg", coords:[[12.1133519,57.3571572],[12.1136029,57.35626],[12.1136552,57.3560681],[12.11331,57.3553966],[12.1135088,57.3552217],[12.1136343,57.3548436],[12.1137599,57.354584],[12.1141888,57.3543526]] },
];

// Food / kiosk point markers (optional)
const STANDS = [
  // { name:"Kiosken", icon:"🥤", color:"#c9532f", at:[12.1160, 57.3537] },
];

// Single-point amenities (optional)
const AMENITIES = [
  // { name:"Entré", icon:"🚪", at:[12.1158, 57.3536] },
];

/* ============================================================================
   Build (no edits needed below)
   ============================================================================ */
const feat = (geom, props) => ({ type:"Feature", properties:props, geometry:geom });
const poly = (ring, props)  => feat({ type:"Polygon",    coordinates:[ring] }, props);
const line = (coords, props)=> feat({ type:"LineString", coordinates:coords }, props);
const centroid = ring => {
  const pts = ring.slice();
  const a = pts[0], b = pts[pts.length-1];
  if (Math.abs(a[0]-b[0])<1e-9 && Math.abs(a[1]-b[1])<1e-9) pts.pop();
  const n = pts.length;
  return [ pts.reduce((s,p)=>s+p[0],0)/n, pts.reduce((s,p)=>s+p[1],0)/n ];
};

const features = [];
FIELDS.forEach(f => features.push(poly(f.ring, { k:"field" })));
ZONES.forEach(z  => features.push(poly(z.ring, { k:"zone", color:z.color || "#c9c2ac" })));
PATHS.forEach(p  => features.push(line(p.coords, { k:"path" })));
const venue = { type:"FeatureCollection", features };

function venueBounds(){
  let w=180, s=90, e=-180, n=-90, any=false;
  const add = c => { any=true; w=Math.min(w,c[0]); e=Math.max(e,c[0]); s=Math.min(s,c[1]); n=Math.max(n,c[1]); };
  FIELDS.forEach(f => f.ring.forEach(add));
  ZONES.forEach(z  => z.ring.forEach(add));
  PATHS.forEach(p  => p.coords.forEach(add));
  STANDS.forEach(x => add(x.at));
  AMENITIES.forEach(x => add(x.at));
  return any ? [[w,s],[e,n]] : null;
}

/* ============================================================================
   Map
   ============================================================================ */
const BASEMAP = {
  version: 8,
  sources: {
    basemap: {
      type: 'raster', tileSize: 256, maxzoom: 20,
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
      ],
      attribution: '© OpenStreetMap contributors © CARTO'
    }
    // Aerial photo alternative (keyless; note {y}/{x} order). Replace the block above with:
    // basemap: { type:'raster', tileSize:256, maxzoom:19,
    //   tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    //   attribution:'Imagery © Esri, Maxar, Earthstar Geographics' }
  },
  layers: [
    { id:'bg', type:'background', paint:{ 'background-color':'#e8eef0' } },
    { id:'basemap', type:'raster', source:'basemap' }
  ]
};

if (!window.maplibregl) {
  document.body.innerHTML = '<div style="padding:28px;font:15px/1.5 Inter,system-ui,sans-serif;color:#16240f">'
    + 'Could not load the map library. Make sure you have an internet connection and that scripts from '
    + '<b>unpkg.com</b> are allowed, then reload.</div>';
  throw new Error('maplibre-gl failed to load');
}

const start = venueBounds();
const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP,
  center: start ? [(start[0][0]+start[1][0])/2, (start[0][1]+start[1][1])/2] : [12.116, 57.3555],
  zoom: 16,
  attributionControl: { compact: true },
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
const geo = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true, showUserLocation: true, showUserHeading: true,
});
map.addControl(geo, 'bottom-right');

// Surface geolocation problems instead of failing silently.
geo.on('error', err => {
  if (err && err.code === 1)
    toast('Platsåtkomst nekades. På iPhone: kontrollera att sidan körs över HTTPS, och att Inställningar → Integritet & säkerhet → Platstjänster (och Safari) tillåter plats.', 7000);
  else
    toast('Kunde inte hämta din position just nu. Försök igen utomhus med bra mottagning.', 5000);
});
// iOS Safari refuses geolocation entirely on non-HTTPS pages, with no prompt.
if (!window.isSecureContext)
  toast('Platsdelning fungerar bara över HTTPS. Öppna kartan via en https-adress (din webbhotell-URL), inte som en lokal fil.', 8000);

function toast(msg, ms = 4500){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

const minorMarkers = []; // zone + amenity + path labels, hidden when zoomed far out

map.on('load', () => {
  map.addSource('venue', { type:'geojson', data: venue });

  map.addLayer({ id:'zone-fill', type:'fill', source:'venue', filter:['==',['get','k'],'zone'],
    paint:{ 'fill-color':['get','color'], 'fill-opacity':0.55 } });
  map.addLayer({ id:'zone-line', type:'line', source:'venue', filter:['==',['get','k'],'zone'],
    paint:{ 'line-color':'#ffffff', 'line-width':1.4 } });

  map.addLayer({ id:'path-line', type:'line', source:'venue', filter:['==',['get','k'],'path'],
    layout:{ 'line-cap':'round', 'line-join':'round' },
    paint:{ 'line-color':'#7a5a2e',
      'line-width':['interpolate',['linear'],['zoom'], 14,2, 17,4, 19,6],
      'line-dasharray':[1.6,1.4] } });

  // fields: green only, clean white edge, no interior markings
  map.addLayer({ id:'field-fill', type:'fill', source:'venue', filter:['==',['get','k'],'field'],
    paint:{ 'fill-color':'#4f9a3a', 'fill-opacity':0.9 } });
  map.addLayer({ id:'field-line', type:'line', source:'venue', filter:['==',['get','k'],'field'],
    paint:{ 'line-color':'#ffffff', 'line-width':2 } });

  // labels
  FIELDS.forEach(f => nameBadge(centroid(f.ring), f.name));
  STANDS.forEach(s => pill(s.at, s.icon, s.name, { strong:true, color:s.color }));
  ZONES.forEach(z => minorMarkers.push(pill(centroid(z.ring), z.icon || "📍", z.name, {})));
  AMENITIES.forEach(a => minorMarkers.push(pill(a.at, a.icon, a.name, {})));
  PATHS.forEach(p => minorMarkers.push(pill(p.coords[Math.floor(p.coords.length/2)], "🚶", p.name, {})));

  updateMinorVisibility();
  const b = venueBounds();
  if (b) map.fitBounds(b, { padding: 60, duration: 0, maxZoom: 18 });

  // Auto-locate only if permission was already granted. This avoids "using up"
  // the one-time iOS prompt — tapping the locate button is the reliable way to
  // make Safari show the permission prompt.
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then(p => { if (p.state === 'granted') geo.trigger(); })
      .catch(() => {});
  }
});

function pill(at, icon, name, { strong=false, color=null } = {}){
  const el = document.createElement('div');
  el.className = 'lbl' + (strong ? ' strong' : '');
  el.innerHTML = (color
        ? '<span class="chip" style="background:'+color+'">'+(icon||'')+'</span>'
        : '<span class="ic">'+(icon||'')+'</span>')
    + '<span class="tx">'+name+'</span>';
  return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(at).addTo(map);
}
function nameBadge(at, name){
  const el = document.createElement('div');
  el.className = 'num';
  el.textContent = name;
  el.title = name;
  return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(at).addTo(map);
}

function updateMinorVisibility(){
  const show = map.getZoom() >= 16;
  minorMarkers.forEach(m => { m.getElement().style.display = show ? 'flex' : 'none'; });
}
map.on('zoom', updateMinorVisibility);
map.on('error', e => console.warn('Map error:', e && e.error ? e.error.message : e));

/* ============================================================================
   Search — finds venue features by name and flies the map to them
   ============================================================================ */
const SEARCH = [];
FIELDS.forEach(f    => SEARCH.push({ label:f.name, sub:"Fotbollsplan", icon:"⚽", ring:f.ring, at:centroid(f.ring) }));
ZONES.forEach(z     => SEARCH.push({ label:z.name, sub:"Område",      icon:z.icon||"📍", ring:z.ring, at:centroid(z.ring) }));
STANDS.forEach(s    => SEARCH.push({ label:s.name, sub:"Mat & kiosk",  icon:s.icon||"🍽️", at:s.at }));
AMENITIES.forEach(a => SEARCH.push({ label:a.name, sub:"Service",      icon:a.icon||"📍", at:a.at }));

const sBox = document.getElementById('search');
const sInput = document.getElementById('search-input');
const sResults = document.getElementById('search-results');

function ringBounds(ring){
  let w=180, s=90, e=-180, n=-90;
  ring.forEach(c => { w=Math.min(w,c[0]); e=Math.max(e,c[0]); s=Math.min(s,c[1]); n=Math.max(n,c[1]); });
  return [[w,s],[e,n]];
}
function goTo(entry){
  if(entry.ring) map.fitBounds(ringBounds(entry.ring), { padding:90, maxZoom:18, duration:800 });
  else map.flyTo({ center:entry.at, zoom:18, duration:800 });
  ping(entry.at);
  sInput.value = entry.label;
  closeResults();
  sInput.blur();
}
function renderResults(q){
  const query = q.trim().toLowerCase();
  const matches = query ? SEARCH.filter(e => e.label.toLowerCase().includes(query)) : SEARCH;
  sResults.innerHTML = '';
  if(!matches.length){
    const li = document.createElement('li'); li.className = 'no-res'; li.textContent = 'Inga träffar';
    sResults.appendChild(li);
  } else {
    matches.forEach(e => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="r-ic">'+e.icon+'</span><span class="r-tx"><b>'+e.label+'</b><span>'+e.sub+'</span></span>';
      li.addEventListener('click', () => goTo(e));
      sResults.appendChild(li);
    });
  }
  sBox.classList.add('open');
}
function closeResults(){ sBox.classList.remove('open'); }

sInput.addEventListener('focus', () => renderResults(sInput.value));
sInput.addEventListener('input', () => renderResults(sInput.value));
sInput.addEventListener('keydown', e => {
  if(e.key === 'Enter'){ const first = sResults.querySelector('li:not(.no-res)'); if(first) first.click(); }
  else if(e.key === 'Escape'){ closeResults(); sInput.blur(); }
});
document.addEventListener('click', e => { if(!sBox.contains(e.target)) closeResults(); });

function ping(at){
  const el = document.createElement('div'); el.className = 'ping';
  const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(at).addTo(map);
  setTimeout(() => m.remove(), 1600);
}
