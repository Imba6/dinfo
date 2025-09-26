//import { base44 } from './base44Client';


const API_BASE = import.meta.env.VITE_API_BASE ?? '/diablo';

export async function listClans() {
  const r = await fetch(`${API_BASE}/clans`);
  if (!r.ok) throw new Error('Failed to list clans');
  return r.json();
}

export async function getClan(id) {
  const r = await fetch(`${API_BASE}/clan?id=${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error('Clan not found');
  return r.json();
}



// auth sdk:
//export const User = base44.auth;