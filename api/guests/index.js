import { createClient } from '@supabase/supabase-js';

function getServiceClient(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth:{autoRefreshToken:false,persistSession:false}
  });
}

export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const supabase=getServiceClient();
  try{
    if(req.method==='GET'){
      const { data, error } = await supabase.from('guests').select('*').order('created_at',{ascending:false});
      if(error) return res.status(500).json({error:error.message, stage:'select'});
      return res.status(200).end(JSON.stringify(data||[]));
    }
    if(req.method==='POST'){
      const { full_name } = req.body || {};
      if(!full_name) return res.status(400).json({error:'full_name required'});
      // slug simple; colisión improbable con sufijo
      const baseSlug = full_name.toLowerCase().normalize('NFD').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').replace(/--+/g,'-');
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2,8)}`;
      const { data, error } = await supabase.from('guests').insert({ full_name, slug }).select().single();
      if(error) return res.status(500).json({error:error.message, stage:'insert'});
      return res.status(201).end(JSON.stringify(data));
    }
    return res.status(405).end();
  }catch(e){
    console.error(e);
    return res.status(500).end(JSON.stringify({error:'server', message:e.message}));
  }
}
