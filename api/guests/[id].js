import { createClient } from '@supabase/supabase-js';
function getServiceClient(){ return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}}); }

export default async function handler(req,res){
  const supabase=getServiceClient();
  const { id } = req.query;
  if(!id) return res.status(400).json({error:'id required'});
  try{
    if(req.method==='PATCH'){
      const { full_name, attending, lodging } = req.body || {};
      const payload={};
      if(full_name!==undefined) payload.full_name=full_name;
      if(attending!==undefined) payload.attending=attending;
      if(lodging!==undefined) payload.lodging=lodging;
      if(Object.keys(payload).length===0) return res.status(400).json({error:'no fields'});
      const { data, error } = await supabase.from('guests').update(payload).eq('id',id).select().single();
      if(error) return res.status(500).json({error:error.message});
      return res.json(data);
    }
    if(req.method==='DELETE'){
      const { error } = await supabase.from('guests').delete().eq('id',id);
      if(error) return res.status(500).json({error:error.message});
      return res.json({ok:true});
    }
    return res.status(405).end();
  }catch(e){ console.error(e); return res.status(500).json({error:'server'}); }
}
