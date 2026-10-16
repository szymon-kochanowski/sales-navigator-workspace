import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'leads.json');
const LOCAL_TEMPLATE_FILE = path.join(process.cwd(), 'data', 'demo-template.json');
const VERCEL_TMP_FILE = path.join('/tmp', 'sn_leads_store.json');

export interface StorageState {
  leads: any[];
  deletedIds: string[];
  updatedAt: string;
}

let memoryCache: StorageState | null = null;

export async function readStorageState(): Promise<StorageState> {
  if (memoryCache !== null) {
    return memoryCache;
  }

  const targetFile = isVercel ? VERCEL_TMP_FILE : LOCAL_DATA_FILE;

  try {
    const raw = await fs.readFile(targetFile, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) {
      memoryCache = {
        leads: parsed,
        deletedIds: [],
        updatedAt: new Date().toISOString(),
      };
      return memoryCache;
    } else if (parsed && Array.isArray(parsed.leads)) {
      memoryCache = {
        leads: parsed.leads,
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
      return memoryCache;
    }
  } catch (err) {
    // If target file doesn't exist, try template file
    try {
      const templateRaw = await fs.readFile(LOCAL_TEMPLATE_FILE, 'utf-8');
      const templateParsed = JSON.parse(templateRaw || '[]');
      if (Array.isArray(templateParsed)) {
        memoryCache = {
          leads: templateParsed,
          deletedIds: [],
          updatedAt: new Date().toISOString(),
        };
        return memoryCache;
      }
    } catch {}
  }

  memoryCache = {
    leads: [],
    deletedIds: [],
    updatedAt: new Date().toISOString(),
  };
  return memoryCache;
}

export async function writeStorageState(
  leads: any[],
  deletedIds?: string[]
): Promise<StorageState> {
  const current = await readStorageState();
  const nextDeleted = deletedIds !== undefined ? deletedIds : current.deletedIds;
  const deletedSet = new Set(nextDeleted);

  const cleanLeads = (Array.isArray(leads) ? leads : []).filter(
    (l) => l && l.id && !deletedSet.has(l.id)
  );

  const nextState: StorageState = {
    leads: cleanLeads,
    deletedIds: Array.from(deletedSet),
    updatedAt: new Date().toISOString(),
  };

  memoryCache = nextState;

  const targetFile = isVercel ? VERCEL_TMP_FILE : LOCAL_DATA_FILE;
  try {
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, JSON.stringify(cleanLeads, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Storage File] Pominięto zapis lokalny:', err?.message);
  }

  return nextState;
}

export async function readLeads(): Promise<any[]> {
  const state = await readStorageState();
  return state.leads;
}

export async function writeLeads(leads: any[]): Promise<void> {
  await writeStorageState(leads);
}

export async function deleteLeadById(leadId: string): Promise<any[]> {
  const state = await readStorageState();
  const updatedLeads = state.leads.filter((l) => l && l.id !== leadId);
  const updatedDeleted = Array.from(new Set([...state.deletedIds, leadId]));
  const next = await writeStorageState(updatedLeads, updatedDeleted);
  return next.leads;
}

export async function syncLeadsWithClient(
  clientLeads: any[],
  clientDeletedIds: string[] = []
): Promise<StorageState> {
  const serverState = await readStorageState();
  const mergedDeletedSet = new Set<string>([
    ...serverState.deletedIds,
    ...(Array.isArray(clientDeletedIds) ? clientDeletedIds : []),
  ]);

  const leadMap = new Map<string, any>();
  for (const sLead of serverState.leads) {
    if (sLead && sLead.id && !mergedDeletedSet.has(sLead.id)) {
      leadMap.set(sLead.id, sLead);
    }
  }

  for (const cLead of Array.isArray(clientLeads) ? clientLeads : []) {
    if (!cLead || !cLead.id || mergedDeletedSet.has(cLead.id)) continue;
    const existing = leadMap.get(cLead.id);
    if (!existing) {
      leadMap.set(cLead.id, cLead);
    } else {
      const serverTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const clientTime = cLead.updatedAt ? new Date(cLead.updatedAt).getTime() : 0;
      const winner = clientTime >= serverTime ? cLead : existing;
      const loser = clientTime >= serverTime ? existing : cLead;
      leadMap.set(cLead.id, {
        ...loser,
        ...winner,
        status:
          existing.status === 'Oferta zaakceptowana'
            ? 'Oferta zaakceptowana'
            : winner.status,
        acceptedProposal: existing.acceptedProposal || winner.acceptedProposal,
        audit: winner.audit || loser.audit,
        demoSiteHtml: winner.demoSiteHtml || loser.demoSiteHtml,
        outreachBody: winner.outreachBody || loser.outreachBody,
        updatedAt: new Date(Math.max(serverTime, clientTime, Date.now())).toISOString(),
      });
    }
  }

  return await writeStorageState(
    Array.from(leadMap.values()),
    Array.from(mergedDeletedSet)
  );
}
