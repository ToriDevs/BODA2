const tableBody=document.querySelector('#guestsTable tbody');
const totalsEl=document.getElementById('totals');
const form=document.getElementById('formNewGuest');
const searchInput=document.getElementById('searchInput');
const refreshBtn=document.getElementById('refreshBtn');
const exportBtn=document.getElementById('exportBtn');
let allGuests=[];

function slugify(name){return name.toLowerCase().normalize('NFD').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').replace(/--+/g,'-');}

async function loadGuests(){
	try {
		const res = await fetch('/api/guests');
		allGuests = await res.json();
		renderTable();
	} catch(e){ console.error(e); }
}

function renderTable(){
	const term = (searchInput?.value||'').toLowerCase();
	const data = allGuests.filter(g=> !term || g.full_name.toLowerCase().includes(term) || g.slug.includes(term));
	tableBody.innerHTML=''; let countSi=0,countNo=0,countPend=0,countHospSi=0,countHospNo=0;
	data.forEach(g=>{
		if(g.attending===true) countSi++; else if(g.attending===false) countNo++; else countPend++;
		if(g.lodging===true) countHospSi++; else if(g.lodging===false) countHospNo++;
		const tr=document.createElement('tr');
		const attendingBadge = g.attending===true?'<span class="badge si">Sí</span>': g.attending===false?'<span class="badge no">No</span>':'<span class="badge pend">Pend.</span>';
		const lodgingBadge = g.attending===true ? (g.lodging===true?'<span class="badge hosp-si">Sí</span>': g.lodging===false?'<span class="badge hosp-no">No</span>':'<span class="badge pend">-</span>') : '<span class="badge pend">-</span>';
		tr.innerHTML=`<td contenteditable data-id="${g.id}" class="editable-name">${g.full_name}</td>
			<td><a href="/invitacion.html?i=${g.slug}" target="_blank">${g.slug}</a></td>
			<td>${attendingBadge}</td>
			<td>${lodgingBadge}</td>
			<td class="actions">
				<button class="btn small btn-copy" data-act="copy" data-slug="${g.slug}">Copiar</button>
				<button class="btn small btn-del" data-act="del" data-id="${g.id}">🗑️</button>
			</td>`;
		tableBody.appendChild(tr);
	});
	totalsEl.innerHTML=`<strong>Total:</strong> ${data.length} · Sí: ${countSi} · No: ${countNo} · Pend: ${countPend} · Hosp Sí: ${countHospSi} · Hosp No: ${countHospNo}`;
}

async function createGuest(name){
	try {
		const res = await fetch('/api/guests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:name})});
		let data=null; let raw='';
		try { raw=await res.text(); data= raw? JSON.parse(raw):null; } catch(parseErr){ console.warn('Respuesta no JSON', raw); }
		if(!res.ok){ alert('Error creando invitado: '+(data?.error||raw||res.status)); return; }
		loadGuests();
	} catch(e){ alert('Error creando invitado'); }
}

form.addEventListener('submit',e=>{e.preventDefault(); const name=form.fullName.value.trim(); if(!name) return; createGuest(name); form.reset();});

tableBody.addEventListener('click',async e=>{ const btn=e.target.closest('button'); if(!btn) return; const act=btn.dataset.act; if(act==='copy'){ const slug=btn.dataset.slug; const url=location.origin+'/invitacion.html?i='+slug; navigator.clipboard.writeText(url); btn.classList.add('copied'); btn.textContent='Listo'; setTimeout(()=>{btn.classList.remove('copied'); btn.textContent='Copiar';},1800); } else if(act==='del'){ if(!confirm('¿Eliminar invitado?')) return; const id=btn.dataset.id; try { const res=await fetch(`/api/guests/${id}`,{method:'DELETE'}); if(!res.ok) alert('Error eliminando'); else { allGuests = allGuests.filter(g=>g.id!==id); renderTable(); } } catch(err){ alert('Error eliminando'); } }});

// Editar nombre inline
let nameEditTimer; tableBody.addEventListener('input',e=>{ const td=e.target.closest('.editable-name'); if(!td) return; clearTimeout(nameEditTimer); nameEditTimer=setTimeout(async()=>{ const id=td.dataset.id; const name=td.textContent.trim(); try { await fetch(`/api/guests/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:name})}); const g=allGuests.find(x=>x.id===id); if(g) g.full_name=name; } catch(err){ console.error(err); } },600); });

searchInput?.addEventListener('input',()=>renderTable());
refreshBtn?.addEventListener('click',()=>loadGuests());
exportBtn?.addEventListener('click',()=>exportCSV());

function exportCSV(){
	if(!allGuests.length){ alert('Sin datos'); return; }
	const headers=['Nombre','Slug','Asistencia','Hospedaje'];
	const rows=allGuests.map(g=>[
		'"'+g.full_name.replace(/"/g,'""')+'"',
		g.slug,
		g.attending===true?'Si':g.attending===false?'No':'Pend',
		g.lodging===true?'Si':g.lodging===false?'No':''
	]);
	const csv=[headers.join(','),...rows.map(r=>r.join(','))].join('\n');
	const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
	const url=URL.createObjectURL(blob);
	const a=document.createElement('a');a.href=url;a.download='invitados.csv';a.click();URL.revokeObjectURL(url);
}

document.addEventListener('supabase-ready',loadGuests);
