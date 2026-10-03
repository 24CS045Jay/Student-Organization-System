import { Router } from 'express';
import { authenticate, resolveOrg } from '../middleware/auth';

export const syncRouter = Router();

// In-memory central sync store
let centralState: Record<string, any> = {};

/**
 * GET /api/v1/sync/state
 * Retrieves the latest synchronized state for an organization
 */
syncRouter.get('/state', (req: any, res: any) => {
  const orgId = req.headers['x-org-id'] || 'tech';
  res.json({
    success: true,
    orgId,
    state: centralState[orgId as string] || null,
    syncedAt: new Date().toISOString()
  });
});

/**
 * POST /api/v1/sync/state
 * Reconciles and stores full organization ledger snapshot from web client
 */
syncRouter.post('/state', (req: any, res: any) => {
  const orgId = req.headers['x-org-id'] || req.body?.id || 'tech';
  centralState[orgId as string] = {
    ...req.body,
    lastSyncedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: `Organization ${orgId} ledger synchronized with central backend API.`,
    orgId,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/sync/mutation
 * Real-time event mutation stream (tickets, members, checkins, expenses)
 */
syncRouter.post('/mutation', (req: any, res: any) => {
  const { type, orgId, payload } = req.body;
  const targetOrg = orgId || req.headers['x-org-id'] || 'tech';

  if (!centralState[targetOrg]) {
    centralState[targetOrg] = { mutations: [] };
  }
  if (!centralState[targetOrg].mutations) {
    centralState[targetOrg].mutations = [];
  }

  const mutationRecord = {
    id: `mut-${Date.now()}`,
    type,
    payload,
    timestamp: new Date().toISOString()
  };

  centralState[targetOrg].mutations.unshift(mutationRecord);

  console.log(`[API Central Sync] Received mutation "${type}" for org "${targetOrg}"`);

  res.json({
    success: true,
    mutation: mutationRecord
  });
});
