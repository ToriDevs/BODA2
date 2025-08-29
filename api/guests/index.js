import { createClient } from '@supabase/supabase-js';

function json(res, status, obj){ res.status(status).setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify(obj)); }

function getServiceClient(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url, key, { auth:{autoRefreshToken:false,persistSession:false} });
}

export default async function handler(req,res){
  // Body parsing fallback (Vercel a veces deja body como string)
  if(typeof req.body === 'string'){
    try { req.body = req.body ? JSON.parse(req.body) : {}; } catch { req.body = {}; }
  }

  const supabase = getServiceClient();
  if(!supabase){
    return json(res,500,{error:'missing_server_env', details:'Define SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en Vercel'});
  }

  try {
    if(req.method==='GET'){
      const { data, error } = await supabase.from('guests').select('*').order('created_at',{ascending:false});
      if(error) return json(res,500,{error:error.message, stage:'select'});
      return json(res,200,data||[]);
    }
    if(req.method==='POST'){
      const { full_name } = req.body || {};
      if(!full_name) return json(res,400,{error:'full_name required'});
      const baseSlug = full_name.toLowerCase().normalize('NFD').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').replace(/--+/g,'-');
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2,8)}`;
      const { data, error } = await supabase.from('guests').insert({ full_name, slug }).select().single();
      if(error) return json(res,500,{error:error.message, stage:'insert'});
      return json(res,201,data);
    }
    res.setHeader('Allow','GET,POST');
    return res.status(405).end();
  } catch(e){
    console.error('API /guests error', e);
    return json(res,500,{error:'server', message:e.message});
  }
}
