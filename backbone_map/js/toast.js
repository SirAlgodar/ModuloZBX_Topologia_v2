// Toast notifications para feedback visual
(function(){
  const containerId = 'toast-container';
  function ensureContainer(){
    let el = document.getElementById(containerId);
    if(!el){
      el = document.createElement('div');
      el.id = containerId;
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }
  function iconByType(type){
    switch(type){
      case 'success': return '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>';
      case 'error': return '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
      default: return '<i class="fa-solid fa-info-circle" aria-hidden="true"></i>';
    }
  }
  window.showToast = function(type, message){
    const container = ensureContainer();
    const toast = document.createElement('div');
    toast.className = 'toast '+(type||'info');
    toast.role = 'status';
    toast.innerHTML = `<span class="icon" aria-hidden="true">${iconByType(type)}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(()=>{
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(4px)';
      setTimeout(()=>{ toast.remove(); }, 220);
    }, 3200);
  };
})();