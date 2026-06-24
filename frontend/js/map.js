// frontend/js/map.js
//
// Capa de visualizacion del mapa. Usa Google Maps si hay clave configurada;
// si no, dibuja un mapa SVG con las coordenadas reales de los aeropuertos.
// Interfaz uniforme: setAirports(), drawItinerary(), clearItinerary().
const MapView = (() => {
    let airports = [];
    let byIata = {};
    let container = null;
    let impl = null; // 'google' | 'svg'
    let gmap = null, gMarkers = [], gLine = null;

    function index() {
        byIata = {};
        airports.forEach((a) => (byIata[a.iata] = a));
    }

    // ---------- Implementacion SVG ----------
    const svgImpl = {
        W: 820, H: 440, pad: 46, pos: {}, _p: null,
        project() {
            const lats = airports.map((a) => a.latitud);
            const lons = airports.map((a) => a.longitud);
            const minLat = Math.min(...lats), maxLat = Math.max(...lats);
            const minLon = Math.min(...lons), maxLon = Math.max(...lons);
            const centerLat = (minLat + maxLat) / 2;
            const k = Math.cos((centerLat * Math.PI) / 180); // correccion de longitud
            const lx = (lon) => lon * k;
            const minLx = lx(minLon), maxLx = lx(maxLon);
            const spanX = (maxLx - minLx) || 1, spanY = (maxLat - minLat) || 1;
            const scale = Math.min((this.W - 2 * this.pad) / spanX, (this.H - 2 * this.pad) / spanY);
            const offX = (this.W - spanX * scale) / 2;
            const offY = (this.H - spanY * scale) / 2;
            this._p = { k, minLx, maxLat, scale, offX, offY, minLat, maxLat, minLon, maxLon };
            this.pos = {};
            airports.forEach((a) => { this.pos[a.iata] = this.toXY(a.latitud, a.longitud); });
        },
        toXY(lat, lon) {
            const p = this._p;
            return { x: p.offX + (lon * p.k - p.minLx) * p.scale, y: p.offY + (p.maxLat - lat) * p.scale };
        },
        graticule(svg, ns) {
            const p = this._p;
            const step = 5; // grados
            const lo = (v, s) => Math.ceil(v / s) * s;
            const line = (x1, y1, x2, y2, major) => {
                const l = document.createElementNS(ns, 'line');
                l.setAttribute('x1', x1); l.setAttribute('y1', y1);
                l.setAttribute('x2', x2); l.setAttribute('y2', y2);
                l.setAttribute('class', major ? 'geo-graticule geo-graticule--major' : 'geo-graticule');
                svg.appendChild(l);
            };
            for (let lon = lo(p.minLon, step); lon <= p.maxLon; lon += step) {
                const a = this.toXY(p.maxLat, lon), b = this.toXY(p.minLat, lon);
                line(a.x, a.y, b.x, b.y, lon % 10 === 0);
            }
            for (let lat = lo(p.minLat, step); lat <= p.maxLat; lat += step) {
                const a = this.toXY(lat, p.minLon), b = this.toXY(lat, p.maxLon);
                line(a.x, a.y, b.x, b.y, lat % 10 === 0);
            }
        },
        render() {
            this.project();
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

            this.graticule(svg, ns); // fondo: reticula geografica

            const gRoute = document.createElementNS(ns, 'path');
            gRoute.setAttribute('class', 'geo-route');
            gRoute.setAttribute('id', 'geo-route');
            svg.appendChild(gRoute);

            airports.forEach((a) => {
                const p = this.pos[a.iata];
                const c = document.createElementNS(ns, 'circle');
                c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 4.5);
                c.setAttribute('class', 'geo-node'); c.setAttribute('data-iata', a.iata);
                c.setAttribute('id', `node-${a.iata}`);
                const t = document.createElementNS(ns, 'title');
                t.textContent = `${a.iata} · ${a.ciudad}`;
                c.appendChild(t);
                svg.appendChild(c);

                const label = document.createElementNS(ns, 'text');
                label.setAttribute('x', p.x); label.setAttribute('y', p.y - 9);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('class', 'geo-label'); label.setAttribute('id', `label-${a.iata}`);
                label.textContent = a.iata;
                svg.appendChild(label);
            });

            container.innerHTML = '';
            container.appendChild(svg);
        },
        drawItinerary(route) {
            // Reset estilos
            airports.forEach((a) => {
                document.getElementById(`node-${a.iata}`)?.setAttribute('class', 'geo-node');
                document.getElementById(`label-${a.iata}`)?.setAttribute('class', 'geo-label');
            });
            const pts = route.map((iata) => this.pos[iata]).filter(Boolean);
            if (pts.length < 2) return;

            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const path = document.getElementById('geo-route');
            path.setAttribute('d', d);

            // Animacion de "dibujado"
            const len = path.getTotalLength();
            path.style.transition = 'none';
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
            path.getBoundingClientRect(); // forzar reflow
            path.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.3,.7,.2,1)';
            path.style.strokeDashoffset = '0';

            // Resaltar nodos de la ruta
            route.forEach((iata, i) => {
                const cls = i === 0 ? 'geo-node is-origin' : 'geo-node is-route';
                document.getElementById(`node-${iata}`)?.setAttribute('class', cls);
                document.getElementById(`label-${iata}`)?.setAttribute('class', 'geo-label is-route');
            });
            // El origen aparece al inicio y al cierre: re-aplicar su estilo distintivo.
            document.getElementById(`node-${route[0]}`)?.setAttribute('class', 'geo-node is-origin');
        },
        clearItinerary() {
            document.getElementById('geo-route')?.setAttribute('d', '');
            airports.forEach((a) => {
                document.getElementById(`node-${a.iata}`)?.setAttribute('class', 'geo-node');
                document.getElementById(`label-${a.iata}`)?.setAttribute('class', 'geo-label');
            });
        },
    };

    // ---------- Implementacion Google Maps ----------
    const googleImpl = {
        render() {
            gmap = new google.maps.Map(container, {
                center: { lat: 48, lng: 9 }, zoom: 4, disableDefaultUI: true,
                zoomControl: true, styles: GOOGLE_STYLE,
            });
            gMarkers.forEach((m) => m.setMap(null));
            gMarkers = airports.map((a) => new google.maps.Marker({
                position: { lat: a.latitud, lng: a.longitud }, map: gmap, title: `${a.iata} · ${a.ciudad}`,
                icon: dotIcon('#DED7CC', '#fff', 5),
            }));
            fitAll();
        },
        drawItinerary(route) {
            if (gLine) gLine.setMap(null);
            const path = route.map((iata) => byIata[iata]).filter(Boolean)
                .map((a) => ({ lat: a.latitud, lng: a.longitud }));
            gLine = new google.maps.Polyline({
                path, geodesic: true, strokeColor: '#E8763A', strokeOpacity: 1, strokeWeight: 3, map: gmap,
            });
            const routeSet = new Set(route);
            gMarkers.forEach((m, i) => {
                const a = airports[i];
                const isOrigin = a.iata === route[0];
                const inRoute = routeSet.has(a.iata);
                m.setIcon(dotIcon(inRoute ? '#E8763A' : '#DED7CC', isOrigin ? '#1E232B' : '#fff', inRoute ? 7 : 5));
            });
            const bounds = new google.maps.LatLngBounds();
            path.forEach((p) => bounds.extend(p));
            if (!bounds.isEmpty()) gmap.fitBounds(bounds, 60);
        },
        clearItinerary() {
            if (gLine) { gLine.setMap(null); gLine = null; }
            gMarkers.forEach((m, i) => m.setIcon(dotIcon('#DED7CC', '#fff', 5)));
            fitAll();
        },
    };

    function dotIcon(fill, stroke, r) {
        return {
            path: google.maps.SymbolPath.CIRCLE, fillColor: fill, fillOpacity: 1,
            strokeColor: stroke, strokeWeight: 2, scale: r,
        };
    }
    function fitAll() {
        const b = new google.maps.LatLngBounds();
        airports.forEach((a) => b.extend({ lat: a.latitud, lng: a.longitud }));
        if (!b.isEmpty()) gmap.fitBounds(b, 50);
    }

    const GOOGLE_STYLE = [
        { elementType: 'geometry', stylers: [{ color: '#f6f0e8' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#9c9488' }] },
        { featureType: 'water', stylers: [{ color: '#e7ddcf' }] },
        { featureType: 'road', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#e3dccf' }] },
    ];

    // ---------- API publica ----------
    function loadGoogle(key) {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) return resolve();
            const s = document.createElement('script');
            s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
            s.async = true; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function init(containerId, airportList) {
        container = document.getElementById(containerId);
        airports = airportList; index();
        const key = window.EUROSKY_CONFIG && window.EUROSKY_CONFIG.googleMapsApiKey;
        if (key) {
            try { await loadGoogle(key); impl = googleImpl; }
            catch { impl = svgImpl; }
        } else {
            impl = svgImpl;
        }
        impl.render();
        return impl === googleImpl ? 'google' : 'svg';
    }

    function setAirports(list) { airports = list; index(); if (impl) impl.render(); }
    function drawItinerary(route) { impl && impl.drawItinerary(route); }
    function clearItinerary() { impl && impl.clearItinerary(); }

    return { init, setAirports, drawItinerary, clearItinerary };
})();