// Aba Banco de Dados: configuração de conexão e teste
const DBConfigPage = (function () {
  async function loadCurrent() {
    const r = await fetch('backend/api.php?route=dbconfig');
    const d = await r.json();
    document.getElementById('db-host').value = d.host || '';
    document.getElementById('db-name').value = d.name || '';
    document.getElementById('db-user').value = d.user || '';
    const passInfo = document.getElementById('db-pass-info');
    passInfo.textContent = d.hasPass ? 'Senha configurada (oculta)' : 'Senha não configurada';
  }

  async function testConnection() {
    const host = document.getElementById('db-host').value.trim();
    const name = document.getElementById('db-name').value.trim();
    const user = document.getElementById('db-user').value.trim();
    const pass = document.getElementById('db-pass').value;
  if (!host || !name || !user) { if(window.showToast) showToast('error','Preencha host, nome e usuário.'); else alert('Preencha host, nome e usuário.'); return; }
    const r = await fetch('backend/api.php?route=dbtest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host, name, user, pass }) });
    const d = await r.json();
  if (d.ok) { if(window.showToast) showToast('success','Conexão OK.'); else alert('Conexão OK.'); } else { const msg = 'Falha na conexão: ' + (d.error || 'erro desconhecido'); if(window.showToast) showToast('error', msg); else alert(msg); }
  }

  async function save() {
    const host = document.getElementById('db-host').value.trim();
    const name = document.getElementById('db-name').value.trim();
    const user = document.getElementById('db-user').value.trim();
    const pass = document.getElementById('db-pass').value;
  if (!host || !name || !user) { if(window.showToast) showToast('error','Preencha host, nome e usuário.'); else alert('Preencha host, nome e usuário.'); return; }
    // Opcional: exigir teste antes de salvar
    const test = await fetch('backend/api.php?route=dbtest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host, name, user, pass }) });
    const td = await test.json();
    if (!td.ok) { if (!confirm('Teste de conexão falhou, deseja salvar assim mesmo?')) return; }
    const r = await fetch('backend/api.php?route=dbsave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host, name, user, pass }) });
    const d = await r.json();
  if (d.ok) { if(window.showToast) showToast('success','Configurações salvas no .env com senha criptografada.'); else alert('Configurações salvas no .env com senha criptografada.'); document.getElementById('db-pass').value=''; loadCurrent(); } else { const msg = 'Falha ao salvar: ' + (d.error || 'erro'); if(window.showToast) showToast('error', msg); else alert(msg); }
  }

  function init() {
    document.getElementById('db-test').addEventListener('click', testConnection);
    document.getElementById('db-save').addEventListener('click', save);
    loadCurrent();
  }

  return { init };
})();