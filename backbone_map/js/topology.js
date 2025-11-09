// Lógica da aba Topologia: gerar diagrama baseado no mapa Backbone
const Topology = (function () {
  function groupBy(arr, key) {
    return arr.reduce((acc, it) => {
      const k = typeof key === 'function' ? key(it) : it[key];
      acc[k] = acc[k] || []; acc[k].push(it); return acc;
    }, {});
  }

  function renderTopologyView(data, grouping) {
    const root = document.getElementById('topology-view');
    root.innerHTML = '';
    const nodesById = new Map(data.nodes.map(n => [n.id, n]));
    const edges = data.edges;
    const grouped = grouping === 'layer' ? groupBy(edges, 'layer') : groupBy(edges, e => nodesById.get(e.from)?.name || e.from);

    Object.keys(grouped).forEach(groupName => {
      const sectionTitle = document.createElement('h3');
      sectionTitle.textContent = `Grupo: ${groupName}`;
      root.appendChild(sectionTitle);
      const container = document.createElement('div');
      container.className = 'topology-group';
      grouped[groupName].forEach(edge => {
        const from = nodesById.get(edge.from)?.name || edge.from;
        const to = nodesById.get(edge.to)?.name || edge.to;
        const nodeEl = document.createElement('div');
        nodeEl.className = 'top-node';
        nodeEl.textContent = `${from} → ${to}`;
        const info = document.createElement('div');
        info.className = 'link-info';
        const trafficPct = Math.floor(Math.random() * 80) + 10; // mock
        const alarms = Math.random() < 0.2 ? 'Alarme ativo' : 'OK';
        info.innerHTML = `Rota: ${edge.name} | Tráfego: ${trafficPct}% | Alarmes: ${alarms}`;
        nodeEl.appendChild(info);
        container.appendChild(nodeEl);
      });
      root.appendChild(container);
    });
  }

  async function regenerate() {
    const groupingSel = document.getElementById('topology-grouping');
    const grouping = groupingSel.value;
    const data = await ModuleAPI.getTopology();
    renderTopologyView(data, grouping);
  }

  function init() {
    document.getElementById('regen-topology').addEventListener('click', regenerate);
    regenerate();
  }

  return { init };
})();