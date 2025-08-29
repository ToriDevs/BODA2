const tableBody=document.querySelector('#guestsTable tbody');const totalsEl=document.getElementById('totals');const form=document.getElementById('formNewGuest');

function slugify(name){return name.toLowerCase().normalize('NFD').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').replace(/--+/g,'-');}

async function loadGuests(){
	try {
		const res = await fetch('/api/guests');
		const data = await res.json();
		tableBody.innerHTML=''; let countSi=0,countNo=0,countPend=0,countHospSi=0,countHospNo=0;
		data.forEach(g=>{ if(g.attending===true) countSi++; else if(g.attending===false) countNo++; else countPend++; if(g.lodging===true) countHospSi++; else if(g.lodging===false) countHospNo++; const tr=document.createElement('tr'); tr.innerHTML=`<td contenteditable data-id="${g.id}" class="editable-name">${g.full_name}</td><td><a href="/invitacion.html?i=${g.slug}" target="_blank">Link</a></td><td>${g.attending===true?'Sí':g.attending===false?'No':'Pend.'}</td><td>${g.lodging===true?'Sí':g.lodging===false?'No':'-'}</td><td><button data-act="copy" data-slug="${g.slug}">Copiar</button> <button data-act="del" data-id="${g.id}">🗑️</button></td>`; tableBody.appendChild(tr); }); totalsEl.textContent=`Total: ${data.length} | Sí: ${countSi} No: ${countNo} Pend: ${countPend} | Hosp Sí: ${countHospSi} Hosp No: ${countHospNo}`;
	} catch(e){ console.error(e); }
}

async function createGuest(name){
	try {
		const res = await fetch('/api/guests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:name})});
		if(!res.ok){ alert('Error creando invitado'); return; }
		loadGuests();
	} catch(e){ alert('Error creando invitado'); }
}

form.addEventListener('submit',e=>{e.preventDefault(); const name=form.fullName.value.trim(); if(!name) return; createGuest(name); form.reset();});

tableBody.addEventListener('click',async e=>{ const btn=e.target.closest('button'); if(!btn) return; const act=btn.dataset.act; if(act==='copy'){ const slug=btn.dataset.slug; const url=location.origin+'/invitacion.html?i='+slug; navigator.clipboard.writeText(url); btn.textContent='Copiado'; setTimeout(()=>btn.textContent='Copiar',1500); } else if(act==='del'){ if(!confirm('¿Eliminar invitado?')) return; const id=btn.dataset.id; try { const res=await fetch(`/api/guests/${id}`,{method:'DELETE'}); if(!res.ok) alert('Error eliminando'); else loadGuests(); } catch(err){ alert('Error eliminando'); } }});

// Editar nombre inline
let nameEditTimer; tableBody.addEventListener('input',e=>{ const td=e.target.closest('.editable-name'); if(!td) return; clearTimeout(nameEditTimer); nameEditTimer=setTimeout(async()=>{ const id=td.dataset.id; const name=td.textContent.trim(); try { await fetch(`/api/guests/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:name})}); } catch(err){ console.error(err); } },600); });

document.addEventListener('supabase-ready',loadGuests);
