// frontend/js/app.js
//
// Orquestacion de la interfaz: sesion, navegacion, optimizacion y CRUD.
// Toda comunicacion con el sistema pasa por el cliente REST (API).
(() => {
    'use strict';

    const state = { airports: [], aircraft: [], result: null, authEnabled: false, appReady: false };
    const nf = new Intl.NumberFormat('es-ES');
    const nf2 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const $ = (sel) => document.querySelector(sel);

    // ================================================================ arranque
    document.addEventListener('DOMContentLoaded', () => {
        bindTabs();
        bindOptimize();
        bindCrudButtons();
        bindModal();
        bindAuth();
        bootstrap();
    });

    // Lee el token del fragmento (#access=...) tras volver de Google.
    function readHash() {
        if (!location.hash) return;
        const params = new URLSearchParams(location.hash.slice(1));
        if (params.get('access')) API.setToken(params.get('access'));
        if (params.get('auth_error')) toast(`No se pudo iniciar sesión: ${params.get('auth_error')}`, 'err');
        history.replaceState(null, '', location.pathname + location.search);
    }

    async function bootstrap() {
        readHash();
        let status;
        try {
            status = await API.status();
        } catch {
            showLogin();
            return toast('No se pudo conectar con el servidor. ¿Está corriendo <b>npm start</b>?', 'err');
        }
        state.authEnabled = Boolean(status.authEnabled);

        // Si hay token, validamos la sesion.
        if (API.getToken()) {
            try {
                const { user } = await API.authMe();
                if (user) return enterApp(user);
            } catch { API.clearToken(); }
        }
        // Sin sesion valida: con OAuth activo pedimos login; sin el, entramos como invitado.
        showLogin();
    }

    // ================================================================ sesion/UI
    function bindAuth() {
        $('#btn-login').addEventListener('click', onLogin);
        $('#btn-logout').addEventListener('click', onLogout);
    }

    function showLogin() {
        $('#app-shell').hidden = true;
        $('#login-screen').hidden = false;
        const note = $('#login-note');
        note.textContent = state.authEnabled ? '' : 'Autenticación en modo desarrollo: entrarás como invitado.';
        note.className = `login__note ${state.authEnabled ? '' : 'is-warn'}`;
        $('#login-btn-text').textContent = state.authEnabled ? 'Continuar con Google' : 'Entrar (modo desarrollo)';
    }

    async function onLogin() {
        if (!state.authEnabled) return enterApp(null); // modo invitado
        try {
            const { authUrl } = await API.authLogin();
            window.location.href = authUrl; // redirige a Google
        } catch (e) {
            toast(e.message, 'err');
        }
    }

    async function onLogout() {
        try { await API.authLogout(); } catch { /* ignore */ }
        API.clearToken();
        location.reload();
    }

    async function enterApp(user) {
        $('#login-screen').hidden = true;
        $('#app-shell').hidden = false;
        renderUser(user);
        if (state.appReady) return;
        try {
            await loadData();
            const mode = await MapView.init('map', state.airports);
            $('#map-mode').textContent = mode === 'google' ? 'Google Maps' : 'Red europea';
            state.appReady = true;
        } catch (e) {
            toast('No se pudieron cargar los datos del servidor.', 'err');
        }
    }

    function renderUser(user) {
        const chip = $('#user-chip');
        chip.hidden = false; // el chip (y su botón de salir) siempre está visible
        const avatar = $('#user-avatar');
        if (user) {
            $('#user-name').textContent = user.nombre || user.email || 'Usuario';
            if (user.foto) { avatar.onerror = () => { avatar.style.display = 'none'; }; avatar.src = user.foto; avatar.style.display = ''; }
            else { avatar.style.display = 'none'; }
            $('#btn-logout').title = 'Cerrar sesión';
        } else {
            // Modo invitado: sin perfil de Google.
            $('#user-name').textContent = 'Invitado';
            avatar.style.display = 'none';
            $('#btn-logout').title = state.authEnabled ? 'Salir' : 'Volver a la pantalla de acceso';
        }
    }

    // ================================================================ datos
    async function loadData() {
        [state.airports, state.aircraft] = await Promise.all([API.listAirports(), API.listAircraft()]);
        fillSelect('#sel-aircraft', state.aircraft.map((a) => ({ v: a.modelo, t: a.modelo })));
        fillSelect('#sel-origin', state.airports.map((a) => ({ v: a.iata, t: `${a.iata} · ${a.ciudad}` })));
        renderAirportsTable();
        renderFleetTable();
    }

    function fillSelect(sel, items) {
        $(sel).innerHTML = items.map((i) => `<option value="${i.v}">${i.t}</option>`).join('');
    }

    // ================================================================ tabs
    function bindTabs() {
        document.querySelectorAll('.tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach((t) => t.classList.remove('is-active'));
                tab.classList.add('is-active');
                document.querySelectorAll('.view').forEach((v) => v.classList.remove('is-active'));
                $(`#view-${tab.dataset.view}`).classList.add('is-active');
            });
        });
    }

    // ================================================================ optimizar
    function bindOptimize() {
        $('#btn-optimize').addEventListener('click', runOptimization);
    }

    async function runOptimization() {
        const btn = $('#btn-optimize');
        const seedRaw = $('#in-seed').value.trim();
        const payload = {
            aeronave: $('#sel-aircraft').value,
            origen: $('#sel-origin').value,
            maxJourneyHours: Number($('#in-hours').value) || 8,
            layoverHours: Number($('#in-layover').value),
            seed: seedRaw === '' ? null : Number(seedRaw),
        };

        btn.disabled = true;
        btn.innerHTML = '<span class="spin"></span> Optimizando…';
        try {
            const result = await API.optimize(payload);
            state.result = result;
            renderResult(result);
        } catch (err) {
            if (err.status === 401) return sessionExpired();
            if (err.payload && err.payload.status === 'NO_PROFITABLE_ROUTES') renderNoRoute(err.payload);
            else toast(err.message, 'err');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Optimizar jornada';
        }
    }

    function sessionExpired() {
        toast('Tu sesión expiró. Vuelve a iniciar sesión.', 'err');
        API.clearToken();
        setTimeout(() => location.reload(), 1400);
    }

    function renderResult(r) {
        const dfs = r.itineraries.dfsExact;
        const greedy = r.itineraries.greedy;

        MapView.drawItinerary(dfs.ruta);

        // Linea de estado en el panel
        const mc = r.demandSimulation;
        $('#statusline').hidden = false;
        $('#dot-mc').className = 'dot dot--off';
        $('#mc-text').innerHTML = `${mc.feasibleEdges} rutas rentables · ${mc.discardedEdges} descartadas hoy`;
        $('#dot-net').className = `dot ${r.connectivity.allReachable ? 'dot--on' : 'dot--off'}`;
        $('#net-text').textContent = r.connectivity.allReachable
            ? 'Red totalmente conectada'
            : `${r.connectivity.reachableFromOrigin.length} aeropuertos alcanzables`;

        // KPIs
        $('#kpis').hidden = false;
        $('#kpi-time-max').textContent = r.constraints.maxJourneyHours;
        countTo('#kpi-profit', dfs.beneficioTotalEUR);
        countTo('#kpi-cost', dfs.costoTotalEUR);
        $('#kpi-time').textContent = nf2.format(dfs.tiempoJornadaH);
        $('#kpi-legs').textContent = dfs.tramos.length;

        // Itinerario + panel de algoritmos + comparativa
        $('#result-area').innerHTML = legsTable(dfs) + algorithmsPanel(r) + comparisonBlock(dfs, greedy);
        requestAnimationFrame(() => animateBars(dfs, greedy));
        bindDijkstraSelector();
    }

    // El selector de Dijkstra actualiza la tarjeta con datos ya recibidos (sin re-llamar al backend).
    function bindDijkstraSelector() {
        const sel = document.getElementById('dij-dest');
        if (!sel || !state.result) return;
        sel.addEventListener('change', () => {
            const info = state.result.costReference.dijkstraFromOrigin[sel.value];
            if (!info) return;
            document.getElementById('dij-cost').textContent = '€' + nf.format(Math.round(info.costoEUR));
            document.getElementById('dij-route').innerHTML = routeArrows(info.ruta);
        });
    }

    function renderNoRoute(r) {
        MapView.clearItinerary();
        $('#kpis').hidden = true;
        $('#statusline').hidden = false;
        $('#dot-mc').className = 'dot dot--off';
        $('#mc-text').innerHTML = `${r.demandSimulation.feasibleEdges} rutas rentables · ${r.demandSimulation.discardedEdges} descartadas hoy`;
        $('#dot-net').className = 'dot dot--off';
        $('#net-text').textContent = 'Sin ciclo rentable desde este origen';
        $('#result-area').innerHTML = `
            <div class="card" style="margin-top:18px;"><div class="card__body"><div class="empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>
                <h4>No hay jornada rentable hoy</h4>
                <p>Con la demanda simulada, ningún ciclo cerrado supera el umbral de ocupación.
                   Prueba otra aeronave, otro origen o vuelve a tirar los dados (sin semilla).</p>
            </div></div></div>`;
    }

    // -------- Itinerario optimo (tabla) --------
    function legsTable(dfs) {
        const rows = dfs.tramos.map((t) => `
            <tr>
                <td class="leg-route">${t.origen}<span class="arrow">→</span>${t.destino}</td>
                <td class="num">${t.pax}</td>
                <td class="num">${nf2.format(t.tiempoVueloH)}</td>
                <td class="num">${nf.format(Math.round(t.costoEUR))}</td>
                <td class="num">${nf.format(Math.round(t.beneficioEUR))}</td>
            </tr>`).join('');
        return `
        <div class="section">
            <div class="section__head">
                <h3>Itinerario óptimo <span class="card__hint">· DFS exacto</span></h3>
                <a class="btn btn--ghost btn--sm" href="${API.csvUrl()}" download>Descargar CSV</a>
            </div>
            <div class="tbl-card"><table class="tbl">
                <thead><tr><th>Tramo</th><th class="num">Pax</th><th class="num">Tiempo (h)</th><th class="num">Costo €</th><th class="num">Beneficio €</th></tr></thead>
                <tbody>${rows}
                    <tr class="total">
                        <td>Total · ${routeArrows(dfs.ruta)}</td>
                        <td class="num">—</td>
                        <td class="num">${nf2.format(dfs.tiempoJornadaH)}</td>
                        <td class="num">${nf.format(Math.round(dfs.costoTotalEUR))}</td>
                        <td class="num">${nf.format(Math.round(dfs.beneficioTotalEUR))}</td>
                    </tr>
                </tbody>
            </table></div>
        </div>`;
    }

    // -------- Panel: como lo resolvio cada algoritmo --------
    function algorithmsPanel(r) {
        const mc = r.demandSimulation;
        const bfs = r.connectivity;
        const dij = r.costReference.dijkstraFromOrigin || {};
        const floyd = r.costReference.floydWarshall || {};
        const greedy = r.itineraries.greedy;
        const dfs = r.itineraries.dfsExact;
        const cityOf = Object.fromEntries(state.airports.map((a) => [a.iata, a.ciudad]));

        // Dijkstra: lista de destinos con su ruta minima. Por defecto mostramos
        // el destino con mas escalas (mas ilustrativo); el usuario puede cambiarlo.
        const dijList = Object.entries(dij)
            .map(([iata, info]) => ({ iata, ...info }))
            .sort((a, b) => a.iata.localeCompare(b.iata));
        const dijDefault = dijList.length
            ? dijList.slice().sort((a, b) => b.ruta.length - a.ruta.length || a.costoEUR - b.costoEUR)[0]
            : null;

        const card = (role, name, cx, bodyHtml, opts = {}) => `
            <div class="algo ${opts.chosen ? 'is-chosen' : ''}">
                ${opts.chosen ? '<span class="badge-chosen">Elegido</span>' : ''}
                <div class="algo__top"><span class="algo__role">${role}</span></div>
                <div class="algo__name">${name} ${cx ? `<span class="cx">${cx}</span>` : ''}</div>
                <div class="algo__body">${bodyHtml}</div>
                ${opts.ms !== undefined ? `<div class="algo__time">${nf2.format(opts.ms)} ms</div>` : ''}
            </div>`;

        const cards = [
            card('Simulación', 'Monte Carlo', '', `
                <div class="algo__main">${mc.feasibleEdges} rutas</div>
                <div class="algo__sub">${mc.discardedEdges} descartadas por ocupación &lt; umbral</div>`,
                { ms: mc.execMs }),

            card('Conectividad', 'BFS', 'O(V+E)', `
                <div class="algo__main">${bfs.reachableFromOrigin.length} alcanzables</div>
                <div class="algo__sub">${bfs.allReachable ? 'Red totalmente conectada' : 'Red parcialmente conectada'}</div>`,
                { ms: bfs.execMs }),

            card('Costo mínimo', 'Dijkstra', 'O((V+E)·logV)', dijDefault ? `
                <div class="dij-pick">
                    <span class="dij-pick__lbl">${r.origin} →</span>
                    <select id="dij-dest" class="dij-select" aria-label="Destino para Dijkstra">
                        ${dijList.map((d) => `<option value="${d.iata}" ${d.iata === dijDefault.iata ? 'selected' : ''}>${d.iata} · ${cityOf[d.iata] || d.iata}</option>`).join('')}
                    </select>
                </div>
                <div id="dij-cost" class="algo__main">€${nf.format(Math.round(dijDefault.costoEUR))}</div>
                <div class="algo__sub">costo mínimo · ruta:</div>
                <div id="dij-route" class="algo__route">${routeArrows(dijDefault.ruta)}</div>`
                : `<div class="algo__main">—</div><div class="algo__sub">sin destinos alcanzables</div>`,
                { ms: r.costReference.dijkstraExecMs }),

            card('Todos los pares', 'Floyd-Warshall', 'O(V³)', `
                <div class="algo__main">${floyd.nodos || '—'}×${floyd.nodos || '—'}</div>
                <div class="algo__sub">costos mínimos entre todos los aeropuertos · alimenta la poda del DFS</div>`,
                { ms: floyd.execMs }),

            card('Itinerario heurístico', 'Greedy', '', `
                <div class="algo__main profit">€${nf.format(Math.round(greedy.beneficioTotalEUR))}</div>
                <div class="algo__sub">${greedy.tramos.length} tramos · ${nf2.format(greedy.tiempoJornadaH)} h</div>
                <div class="algo__route">${routeArrows(greedy.ruta)}</div>`,
                { ms: greedy.execMs }),

            card('Itinerario óptimo', 'DFS', 'backtracking', `
                <div class="algo__main profit">€${nf.format(Math.round(dfs.beneficioTotalEUR))}</div>
                <div class="algo__sub">${dfs.tramos.length} tramos · ${nf2.format(dfs.tiempoJornadaH)} h · ${nf.format(dfs.nodosExplorados)} nodos</div>
                <div class="algo__route">${routeArrows(dfs.ruta)}</div>`,
                { ms: dfs.execMs, chosen: true }),
        ].join('');

        return `
        <div class="section">
            <div class="section__head">
                <h3>Cómo lo resolvió cada algoritmo</h3>
                <span class="card__hint">Cada uno aporta una pieza distinta; el DFS entrega el itinerario elegido</span>
            </div>
            <div class="algos">${cards}</div>
        </div>`;
    }

    // -------- Comparativa DFS vs Greedy --------
    function comparisonBlock(dfs, greedy) {
        const gap = dfs.beneficioTotalEUR > 0
            ? Math.round((1 - greedy.beneficioTotalEUR / dfs.beneficioTotalEUR) * 100) : 0;
        return `
        <div class="section">
            <div class="section__head">
                <h3>DFS óptimo vs. Greedy</h3>
                <span class="card__hint">El heurístico deja ${gap}% de beneficio sobre la mesa</span>
            </div>
            <div class="compare">
                ${cmpRow('DFS', 'óptimo exacto', dfs, false)}
                ${cmpRow('Greedy', 'heurístico voraz', greedy, true)}
            </div>
        </div>`;
    }

    function cmpRow(name, sub, it, muted) {
        return `
        <div class="cmp">
            <div class="cmp__name">${name}<span>${sub}</span></div>
            <div class="cmp__bar"><div class="cmp__fill ${muted ? 'cmp__fill--muted' : ''}" data-profit="${it.beneficioTotalEUR}"></div></div>
            <div class="cmp__val">${nf.format(Math.round(it.beneficioTotalEUR))} €
                <small>${it.tramos.length} tramos · ${nf2.format(it.tiempoJornadaH)} h · ${nf2.format(it.execMs)} ms</small>
            </div>
        </div>`;
    }

    function animateBars(dfs, greedy) {
        const max = Math.max(dfs.beneficioTotalEUR, greedy.beneficioTotalEUR, 1);
        document.querySelectorAll('.cmp__fill').forEach((el) => {
            el.style.width = `${(Number(el.dataset.profit) / max) * 100}%`;
        });
    }

    function routeArrows(route) {
        return route.join('<span class="arrow"> → </span>');
    }

    function countTo(sel, target) {
        const el = $(sel);
        const dur = 650, t0 = performance.now(), end = Math.round(target);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = nf.format(end); return; }
        function step(now) {
            const k = Math.min((now - t0) / dur, 1);
            el.textContent = nf.format(Math.round(end * (1 - Math.pow(1 - k, 3))));
            if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // ================================================================ CRUD
    function bindCrudButtons() {
        $('#btn-add-airport').addEventListener('click', () => openAirportModal());
        $('#btn-add-aircraft').addEventListener('click', () => openAircraftModal());
        $('#btn-refresh-maps').addEventListener('click', refreshMaps);
    }

    async function refreshMaps() {
        const btn = $('#btn-refresh-maps');
        btn.disabled = true; btn.textContent = 'Recalculando…';
        try {
            const info = await API.refreshMaps();
            toast(`Distancias actualizadas · ${info.pares} rutas (${info.modo}).`, 'ok');
        } catch (e) { handle(e); }
        finally { btn.disabled = false; btn.textContent = 'Recalcular distancias'; }
    }

    function renderAirportsTable() {
        $('#tbody-airports').innerHTML = state.airports.map((a) => `
            <tr>
                <td class="mono"><strong>${a.iata}</strong></td>
                <td>${a.nombre}</td><td>${a.ciudad}</td><td>${a.pais}</td>
                <td class="num">${nf.format(a.terminalFeeEUR)}</td>
                <td style="text-align:right;white-space:nowrap;">
                    ${iconBtn('edit', `data-edit-airport="${a.iata}"`)}
                    ${iconBtn('trash', `data-del-airport="${a.iata}"`)}
                </td>
            </tr>`).join('');
        $('#tbody-airports').querySelectorAll('[data-edit-airport]').forEach((b) =>
            b.addEventListener('click', () => openAirportModal(b.dataset.editAirport)));
        $('#tbody-airports').querySelectorAll('[data-del-airport]').forEach((b) =>
            b.addEventListener('click', () => delAirport(b.dataset.delAirport)));
    }

    function renderFleetTable() {
        $('#tbody-fleet').innerHTML = state.aircraft.map((a) => `
            <tr>
                <td><strong>${a.modelo}</strong></td>
                <td class="num">${a.capacidad_max}</td>
                <td class="num">${a.umbral_min}</td>
                <td class="num">${a.mu_demanda}</td>
                <td class="num">${a.sigma_demanda}</td>
                <td class="num">${nf.format(a.leasing_usd_hora)}</td>
                <td class="num">${a.consumo_kg_km}</td>
                <td style="text-align:right;white-space:nowrap;">
                    ${iconBtn('edit', `data-edit-aircraft="${a.modelo}"`)}
                    ${iconBtn('trash', `data-del-aircraft="${a.modelo}"`)}
                </td>
            </tr>`).join('');
        $('#tbody-fleet').querySelectorAll('[data-edit-aircraft]').forEach((b) =>
            b.addEventListener('click', () => openAircraftModal(b.dataset.editAircraft)));
        $('#tbody-fleet').querySelectorAll('[data-del-aircraft]').forEach((b) =>
            b.addEventListener('click', () => delAircraft(b.dataset.delAircraft)));
    }

    function iconBtn(kind, attrs) {
        const paths = {
            edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
            trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
        };
        return `<button class="btn-icon" ${attrs}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${paths[kind]}</svg></button>`;
    }

    // -------- Airport modal --------
    const airportFields = [
        { k: 'iata', label: 'Código IATA', type: 'text', ph: 'OSL', maxlength: 3 },
        { k: 'nombre', label: 'Nombre', type: 'text', ph: 'Aeropuerto de Oslo' },
        { k: 'ciudad', label: 'Ciudad', type: 'text', ph: 'Oslo' },
        { k: 'pais', label: 'País', type: 'text', ph: 'Noruega' },
        { k: 'latitud', label: 'Latitud', type: 'number', step: 'any', ph: '60.19' },
        { k: 'longitud', label: 'Longitud', type: 'number', step: 'any', ph: '11.10' },
        { k: 'terminalFeeEUR', label: 'Tasa de terminal (EUR)', type: 'number', step: 'any', ph: '300' },
    ];

    function openAirportModal(iata) {
        const editing = Boolean(iata);
        const data = editing ? state.airports.find((a) => a.iata === iata) : {};
        openModal(editing ? `Editar ${iata}` : 'Añadir aeropuerto', airportFields, data,
            { lockKey: editing ? 'iata' : null }, async (values) => {
                values.latitud = Number(values.latitud);
                values.longitud = Number(values.longitud);
                values.terminalFeeEUR = Number(values.terminalFeeEUR);
                if (editing) {
                    const { iata: _omit, ...changes } = values;
                    await API.updateAirport(iata, changes);
                    toast(`${iata} actualizado.`, 'ok');
                } else {
                    values.iata = values.iata.toUpperCase();
                    await API.createAirport(values);
                    toast(`${values.iata} añadido. Recalcula las distancias.`, 'ok');
                }
                await loadData();
                MapView.setAirports(state.airports);
            });
    }

    async function delAirport(iata) {
        if (!confirm(`¿Eliminar el aeropuerto ${iata}? Tendrás que recalcular las distancias.`)) return;
        try {
            await API.deleteAirport(iata);
            toast(`${iata} eliminado.`, 'ok');
            await loadData();
            MapView.setAirports(state.airports);
        } catch (e) { handle(e); }
    }

    // -------- Aircraft modal --------
    const aircraftFields = [
        { k: 'modelo', label: 'Modelo', type: 'text', ph: 'Bombardier CRJ900' },
        { k: 'capacidad_max', label: 'Capacidad máx. (pax)', type: 'number', ph: '90' },
        { k: 'umbral_min', label: 'Umbral rentable (vacío = 70% auto)', type: 'number', ph: 'automático', optional: true },
        { k: 'mu_demanda', label: 'Demanda media μ', type: 'number', step: 'any', ph: '72' },
        { k: 'sigma_demanda', label: 'Desviación σ', type: 'number', step: 'any', ph: '8' },
        { k: 'leasing_usd_hora', label: 'Leasing (USD/h)', type: 'number', step: 'any', ph: '800' },
        { k: 'consumo_kg_km', label: 'Consumo (kg/km)', type: 'number', step: 'any', ph: '1.9' },
        { k: 'autonomia_km', label: 'Autonomía (km)', type: 'number', step: 'any', ph: '2900' },
    ];

    function openAircraftModal(modelo) {
        const editing = Boolean(modelo);
        const data = editing ? state.aircraft.find((a) => a.modelo === modelo) : {};
        openModal(editing ? `Editar ${modelo}` : 'Añadir aeronave', aircraftFields, data,
            { lockKey: editing ? 'modelo' : null }, async (values) => {
                const num = ['capacidad_max', 'umbral_min', 'mu_demanda', 'sigma_demanda', 'leasing_usd_hora', 'consumo_kg_km', 'autonomia_km'];
                num.forEach((k) => { if (values[k] !== '') values[k] = Number(values[k]); else delete values[k]; });
                if (editing) {
                    const { modelo: _omit, ...changes } = values;
                    await API.updateAircraft(modelo, changes);
                    toast(`${modelo} actualizado.`, 'ok');
                } else {
                    await API.createAircraft(values);
                    toast(`${values.modelo} añadido a la flota.`, 'ok');
                }
                await loadData();
            });
    }

    async function delAircraft(modelo) {
        if (!confirm(`¿Eliminar la aeronave ${modelo}?`)) return;
        try {
            await API.deleteAircraft(modelo);
            toast(`${modelo} eliminado.`, 'ok');
            await loadData();
        } catch (e) { handle(e); }
    }

    // ================================================================ modal
    let modalSubmit = null;
    function bindModal() {
        document.querySelectorAll('[data-close-modal]').forEach((b) => b.addEventListener('click', closeModal));
        $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
        $('#modal-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const values = {};
            $('#modal-fields').querySelectorAll('[data-key]').forEach((inp) => { values[inp.dataset.key] = inp.value.trim(); });
            const submitBtn = $('#modal-form button[type="submit"]');
            submitBtn.disabled = true;
            try { await modalSubmit(values); closeModal(); }
            catch (err) {
                if (err.status === 401) { closeModal(); return sessionExpired(); }
                const det = err.payload && err.payload.detalles;
                toast(det ? det[0] : err.message, 'err');
            } finally { submitBtn.disabled = false; }
        });
    }

    function openModal(title, fields, data, opts, onSubmit) {
        $('#modal-title').textContent = title;
        $('#modal-fields').innerHTML = fields.map((f) => {
            const val = data[f.k] !== undefined && data[f.k] !== null ? data[f.k] : '';
            const locked = opts.lockKey === f.k ? 'disabled' : '';
            const extra = [f.step ? `step="${f.step}"` : '', f.maxlength ? `maxlength="${f.maxlength}"` : ''].join(' ');
            return `<div class="field">
                <label>${f.label}</label>
                <input class="control" data-key="${f.k}" type="${f.type}" value="${val}" placeholder="${f.ph || ''}" ${extra} ${locked} ${f.optional ? '' : 'required'} />
            </div>`;
        }).join('');
        modalSubmit = onSubmit;
        $('#modal').classList.add('is-open');
        $('#modal').setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        $('#modal').classList.remove('is-open');
        $('#modal').setAttribute('aria-hidden', 'true');
        modalSubmit = null;
    }

    // ================================================================ utils
    function handle(err) {
        if (err.status === 401) return sessionExpired();
        toast(err.message, 'err');
    }

    function toast(html, kind = 'ok') {
        const el = document.createElement('div');
        el.className = `toast toast--${kind}`;
        el.innerHTML = html;
        $('#toasts').appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(16px)'; el.style.transition = 'all .3s'; }, 3200);
        setTimeout(() => el.remove(), 3600);
    }
})();