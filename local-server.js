// Simple servidor local para desarrollo sin `vercel dev`.
// Sirve /public como estático y expone las rutas API equivalentes bajo /api.

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());

// Static
const publicDir = path.join(__dirname,'public');
app.use(express.static(publicDir));

function serviceClient(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}

// GET/POST guests
app.get('/api/guests', async (req,res)=>{
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase.from('guests').select('*').order('created_at',{ascending:false});
    if(error) return res.status(500).json({error:error.message});
    res.json(data || []);
  } catch(e){ res.status(500).json({error:e.message}); }
});
app.post('/api/guests', async (req,res)=>{
  try {
    const { full_name } = req.body || {}; if(!full_name) return res.status(400).json({error:'full_name required'});
    const baseSlug = full_name.toLowerCase().normalize('NFD')
      .replace(/[^\w\s-]/g,'')
      .trim()
      .replace(/\s+/g,'-')
      .replace(/--+/g,'-');
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2,8)}`;
    const supabase = serviceClient();
    const { data, error } = await supabase.from('guests').insert({ full_name, slug }).select().single();
    if(error) return res.status(500).json({error:error.message});
    res.status(201).json(data);
  } catch(e){ res.status(500).json({error:e.message}); }
});

// PATCH / DELETE guest by id
app.patch('/api/guests/:id', async (req,res)=>{
  try {
    const { id } = req.params; const { full_name, attending, lodging } = req.body || {};
    const payload = {};
    if(full_name!==undefined) payload.full_name=full_name;
    if(attending!==undefined) payload.attending=attending;
    if(lodging!==undefined) payload.lodging=lodging;
    if(Object.keys(payload).length===0) return res.status(400).json({error:'no fields'});
    const supabase = serviceClient();
    const { data, error } = await supabase.from('guests').update(payload).eq('id',id).select().single();
    if(error) return res.status(500).json({error:error.message});
    res.json(data);
  } catch(e){ res.status(500).json({error:e.message}); }
});
app.delete('/api/guests/:id', async (req,res)=>{
  try {
    const { id } = req.params; const supabase = serviceClient();
    const { error } = await supabase.from('guests').delete().eq('id',id);
    if(error) return res.status(500).json({error:error.message});
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});

// track-open
app.post('/api/track-open', async (req,res)=>{
  try {
    const { slug } = req.body || {}; if(!slug) return res.status(400).json({error:'slug required'});
    const supabase = serviceClient();
    const { data:guest, error } = await supabase.from('guests').select('id').eq('slug',slug).single();
    if(error) return res.status(500).json({error:error.message});
    if(!guest) return res.status(404).json({error:'not found'});
    await supabase.from('guest_opens').insert({ guest_id: guest.id });
    res.json({ok:true});
  } catch(e){ res.status(500).json({error:e.message}); }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Local server listo: http://localhost:${port}`));