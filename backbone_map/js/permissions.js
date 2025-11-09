// Permissões simples: detectar papel via querystring ou localStorage
const Permissions = (function () {
  function getRole() {
    const url = new URL(window.location.href);
    const role = url.searchParams.get('role') || localStorage.getItem('bb_role') || 'user';
    return role;
  }

  function isAdmin() {
    return getRole().toLowerCase() === 'admin';
  }

  function isSuperAdmin(){
    return getRole().toLowerCase() === 'superadmin';
  }

  function isAdminOrSuper(){
    const r = getRole().toLowerCase();
    return r === 'admin' || r === 'superadmin';
  }

  function setRole(role) {
    localStorage.setItem('bb_role', role);
  }

  function getAuthHeaders(){
    // Token simples para validar operações administrativas no backend
    const token = localStorage.getItem('bb_admin_token') || '';
    const role = getRole();
    const headers = {};
    if(role) headers['X-Role'] = role;
    if(token) headers['X-Auth'] = token;
    return headers;
  }

  return { getRole, isAdmin, isSuperAdmin, isAdminOrSuper, setRole, getAuthHeaders };
})();