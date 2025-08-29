// Inicializa Supabase (solo lectura/updates básicas con anon key)
const SUPABASE_URL = window.env?.SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL || (typeof process!=='undefined'?process.env.NEXT_PUBLIC_SUPABASE_URL:undefined);
const SUPABASE_ANON_KEY = window.env?.SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof process!=='undefined'?process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY:undefined);

if(!SUPABASE_URL || !SUPABASE_ANON_KEY){ console.warn('Faltan variables de entorno de Supabase'); }

// Carga dinámica del SDK si no existe
(async ()=>{ if(!window.supabase){ const script=document.createElement('script'); script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'; script.onload=()=>{ window.sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); document.dispatchEvent(new Event('supabase-ready')); }; document.head.appendChild(script); } else { window.sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); document.dispatchEvent(new Event('supabase-ready')); } })();
