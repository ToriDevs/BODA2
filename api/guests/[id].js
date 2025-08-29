import { createClient } from '@supabase/supabase-js';
function getServiceClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; if(!url||!key) return null;
  return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

function json(res,status,obj){res.status(status).setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(obj));}

export default async function handler(req,res){
  if(typeof req.body==='string'){ try { req.body=JSON.parse(req.body);} catch { req.body={}; } }
  const supabase=getServiceClient();
  if(!supabase) return json(res,500,{error:'missing_server_env'});
  const { id } = req.query;
  if(!id) return json(res,400,{error:'id required'});
  try{
    if(req.method==='PATCH'){
      const { full_name, attending, lodging } = req.body || {};
      const payload={};
      if(full_name!==undefined) payload.full_name=full_name;
      if(attending!==undefined) payload.attending=attending;
      if(lodging!==undefined) payload.lodging=lodging;
      if(Object.keys(payload).length===0) return json(res,400,{error:'no fields'});
      const { data, error } = await supabase.from('guests').update(payload).eq('id',id).select().single();
      if(error) return json(res,500,{error:error.message, stage:'update'});
      return json(res,200,data);
    }
    if(req.method==='DELETE'){
      const { error } = await supabase.from('guests').delete().eq('id',id);
      if(error) return json(res,500,{error:error.message, stage:'delete'});
      return json(res,200,{ok:true});
    }
    return res.status(405).end();
  }catch(e){ console.error(e); return res.status(500).json({error:'server'}); }
}
