// Painel de Incidentes Ativos e fluxo de criação de nova linha
const IncidentsPanel = (function(){
  let sortKey = 'updated';
  let sortDir = 'desc';
  let rows = [];

  function render(){
    const tbody = document.querySelector('#incident-table tbody');
    if(!tbody) return;
    const sorted = [...rows].sort((a,b)=>{
      const va = a[sortKey]; const vb = b[sortKey];
      if(va == null && vb != null) return sortDir==='asc' ? -1 : 1;
      if(vb == null && va != null) return sortDir==='asc' ? 1 : -1;
      if(typeof va === 'string') return sortDir==='asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      if(typeof va === 'number') return sortDir==='asc' ? va - vb : vb - va;
      if(va instanceof Date) return sortDir==='asc' ? va - vb : vb - va;
      return 0;
    });
    tbody.innerHTML = '';
    sorted.forEach(r=>{
      const tr = document.createElement('tr');
      const stClass = r.status==='OK' ? 'status-ok' : (r.status==='WARN' ? 'status-warn' : 'status-crit');
      const prClass = r.priority==='Alta' ? 'priority-high' : (r.priority==='Média' ? 'priority-med' : 'priority-low');
      tr.innerHTML = `
        <td>${r.host}</td>
        <td><span class="status-badge ${stClass}">${statusIcon(r.status)} ${r.status}</span></td>
        <td class="${prClass}">${r.priority}</td>
        <td>${fmtDate(r.updated)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function statusIcon(s){
    if(s==='OK') return '<i class="fa-solid fa-check" aria-hidden="true"></i>';
    if(s==='WARN') return '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
    return '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>';
  }

  function fmtDate(d){
    if(!(d instanceof Date)) d = new Date(d);
    return d.toLocaleString();
  }

  async function loadMock(hosts){
    // gera incidentes falsos associados aos hosts fornecidos
    const now = Date.now();
    rows = (hosts||['host-a','host-b','host-c']).map((h,i)=>({
      host: typeof h==='object' ? h.name||h.id||('host-'+i) : h,
      status: Math.random() < 0.65 ? 'OK' : (Math.random()<0.5 ? 'WARN' : 'CRIT'),
      priority: Math.random() < 0.5 ? 'Média' : (Math.random()<0.8 ? 'Baixa' : 'Alta'),
      updated: new Date(now - Math.floor(Math.random()*3600*1000))
    }));
    render();
  }

  function bindSorting(){
    const ths = document.querySelectorAll('#incident-table thead th');
    ths.forEach(th=>{
      th.addEventListener('click', ()=>{
        const key = th.dataset.sort;
        if(sortKey === key) sortDir = sortDir==='asc' ? 'desc' : 'asc';
        else { sortKey = key; sortDir = 'asc'; }
        render();
      });
    });
  }

  function bindAddLine(){
    const btn = document.getElementById('add-line-btn');
    if(!btn) return;
    btn.addEventListener('click', openModal);
  }

  function openModal(){
    const modal = document.getElementById('line-modal');
    if(!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    const closeEls = modal.querySelectorAll('[data-close="modal"]');
    closeEls.forEach(el=> el.addEventListener('click', closeModal));
    document.getElementById('confirm-add-line').onclick = async function(){
      const name = document.getElementById('new-line-name').value.trim();
      const host = document.getElementById('new-line-host').value.trim();
      const iface = document.getElementById('new-line-interface').value;
      const trTarget = document.getElementById('new-line-tr-target').value.trim();
      const trHops = Number(document.getElementById('new-line-tr-hops').value || 30);
      if(!name || !host || !iface){
        if(window.showToast) showToast('error','Preencha todos os campos obrigatórios.'); else alert('Preencha todos os campos obrigatórios.');
        return;
      }
      // Dispara criação inicial da linha; efetivação virá no botão "Salvar linha" no editor
      if(window.BackboneMap && typeof BackboneMap.startNewLineFromModal === 'function'){
        BackboneMap.startNewLineFromModal({ name, host, iface, traceroute: { target: trTarget, hops: trHops } });
        if(window.showToast) showToast('success','Linha criada. Clique no mapa para adicionar pontos e salve no editor.');
      }
      closeModal();
    };
  }

  function closeModal(){
    const modal = document.getElementById('line-modal');
    if(!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  }

  function showIncidents(){
    const editor = document.getElementById('line-editor-container');
    const inc = document.getElementById('incident-panel');
    if(editor) editor.classList.add('hidden');
    if(inc) inc.style.display = 'block';
  }

  function showEditor(){
    const editor = document.getElementById('line-editor-container');
    const inc = document.getElementById('incident-panel');
    if(inc) inc.style.display = 'none';
    if(editor) editor.classList.remove('hidden');
  }

  function init(){
    bindSorting();
    bindAddLine();
    // Inicialmente mostra incidentes até o usuário entrar em modo de edição
    showIncidents();
    loadMock();
    // Ouça mudanças de edição
    document.addEventListener('editing:change', (e)=>{
      if(e.detail && e.detail.isEditing) showEditor(); else { showIncidents(); loadMock(e.detail?.hosts || undefined); }
    });
  }

  return { init, showIncidents, showEditor, loadMock };
})();