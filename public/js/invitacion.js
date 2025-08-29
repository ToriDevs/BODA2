const params=new URLSearchParams(location.search);const slug=params.get('i');const dearEl=document.getElementById('dear');const btnSi=document.getElementById('btnSi');const btnNo=document.getElementById('btnNo');const hospCont=document.getElementById('hospedajeContainer');const btnHospSi=document.getElementById('btnHospedajeSi');const btnHospNo=document.getElementById('btnHospedajeNo');const respMsg=document.getElementById('responseMessage');const infoBtn=document.getElementById('infoBtn');infoBtn.addEventListener('click',()=>location.href='/info.html'+(slug?`?i=${encodeURIComponent(slug)}`:''));

let guestId=null;let currentAttending=null;let currentLodging=null;

function showMessage(t){respMsg.textContent=t;}

async function fetchGuest(){ if(!slug){ showMessage('Link inválido'); return; } const {data,error}=await window.sbClient.from('guests').select('*').eq('slug',slug).maybeSingle(); if(error||!data){ showMessage('Invitado no encontrado'); return; } guestId=data.id; currentAttending=data.attending; currentLodging=data.lodging; dearEl.innerHTML=`Querido/a <strong>${data.full_name}</strong>:`; if(currentAttending===true){ hospCont.style.display='block'; if(currentLodging===true) showMessage('Has confirmado asistencia y hospedaje.'); else if(currentLodging===false) showMessage('Has confirmado asistencia sin hospedaje.'); } else if(currentAttending===false){ showMessage('Has indicado que no podrás asistir.'); } trackOpen(); }

async function trackOpen(){ fetch('/api/track-open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug})}).catch(()=>{}); }

// Actualizamos vía API serverless (usa service role) para no necesitar política UPDATE.
async function updateAttendance(attending){
	if(!guestId) return; try {
		const res = await fetch(`/api/guests/${guestId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({attending, lodging: attending?null:false})});
		if(!res.ok){ showMessage('Error guardando.'); return; }
		const data=await res.json();
		currentAttending=data.attending; currentLodging=data.lodging;
		if(attending){ hospCont.style.display='block'; showMessage('Gracias por confirmar. Indica hospedaje.'); }
		else { hospCont.style.display='none'; showMessage('Lamentamos que no puedas asistir.'); }
	} catch(e){ showMessage('Error conexión.'); }
}
async function updateLodging(lodging){
	if(!guestId) return; try {
		const res = await fetch(`/api/guests/${guestId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({lodging})});
		if(!res.ok){ showMessage('Error hospedaje.'); return; }
		currentLodging=lodging; showMessage(lodging?'Hospedaje reservado.':'Sin hospedaje. ¡Gracias!');
	} catch(e){ showMessage('Error hospedaje.'); }
}

btnSi.addEventListener('click',()=>updateAttendance(true));btnNo.addEventListener('click',()=>updateAttendance(false));btnHospSi.addEventListener('click',()=>updateLodging(true));btnHospNo.addEventListener('click',()=>updateLodging(false));

document.addEventListener('supabase-ready',fetchGuest);
