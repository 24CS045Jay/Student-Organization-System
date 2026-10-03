import { Router } from 'express';
import { authenticate, resolveOrg, requirePermission } from '../middleware/auth';
import { membershipService } from '../services/membershipService';
import {
  RegisterMembershipSchema,
  RenewMembershipSchema,
  CreateMemberSchema,
  UpdateMemberSchema,
  CreateMembershipTypeSchema,
  VerifyMemberSchema
} from 'shared';

export const membershipRouter = Router();

// 1. Membership Types
membershipRouter.get('/membership-types', authenticate, resolveOrg, requirePermission('membership_types:read'), (req, res) => {
  try {
    const orgKey = req.org?.slug || 'tech-club';
    const types = membershipService.listMembershipTypes(orgKey);
    res.json({ types });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

membershipRouter.post('/membership-types', authenticate, resolveOrg, requirePermission('membership_types:write'), (req, res) => {
  try {
    const parsed = CreateMembershipTypeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.issues } });
    }
    const orgKey = req.org?.slug || 'tech-club';
    const created = membershipService.createMembershipType(orgKey, parsed.data);
    res.status(201).json({ type: created });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// 2. Members Listing & CRUD
membershipRouter.get('/members', authenticate, resolveOrg, requirePermission('members:read'), (req, res) => {
  try {
    const orgKey = req.org?.slug || 'tech-club';
    const { search, status, typeId, page, limit } = req.query;
    const result = membershipService.listMembers(orgKey, {
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
      typeId: typeof typeId === 'string' ? typeId : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

membershipRouter.get('/members/:id', authenticate, resolveOrg, requirePermission('members:read'), (req, res) => {
  try {
    const orgKey = req.org?.slug || 'tech-club';
    const member = membershipService.getMemberById(orgKey, req.params.id);
    if (!member) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found' } });
    }
    res.json({ member });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// 3. Register Member (with Payment)
membershipRouter.post('/memberships', authenticate, resolveOrg, requirePermission('members:write'), (req, res) => {
  try {
    const parsed = RegisterMembershipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.issues } });
    }
    const orgKey = req.org?.slug || 'tech-club';
    const result = membershipService.registerMembership(orgKey, parsed.data);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'REGISTRATION_FAILED', message: err.message } });
  }
});

// 4. Renew Membership
membershipRouter.post('/memberships/:id/renew', authenticate, resolveOrg, requirePermission('members:write'), (req, res) => {
  try {
    const parsed = RenewMembershipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.issues } });
    }
    const orgKey = req.org?.slug || 'tech-club';
    const result = membershipService.renewMembership(orgKey, req.params.id, parsed.data);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'RENEWAL_FAILED', message: err.message } });
  }
});

// 5. Membership History
membershipRouter.get('/memberships/:id/history', authenticate, resolveOrg, requirePermission('members:read'), (req, res) => {
  try {
    const orgKey = req.org?.slug || 'tech-club';
    const history = membershipService.getMembershipHistory(orgKey, req.params.id);
    res.json(history);
  } catch (err: any) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
  }
});

// 6. Verify Member (QR / ID Scanner Endpoint with Strict Tenant Isolation)
membershipRouter.post('/verify/member', authenticate, resolveOrg, requirePermission('members:verify'), (req, res) => {
  try {
    const parsed = VerifyMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: parsed.error.issues } });
    }
    const orgKey = req.org?.slug || 'tech-club';
    const verification = membershipService.verifyMember(orgKey, parsed.data.query);
    res.json(verification);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'VERIFICATION_ERROR', message: err.message } });
  }
});

// 7. Student Digital Pass / Card
membershipRouter.get('/me/membership-card', authenticate, resolveOrg, (req, res) => {
  try {
    const orgKey = req.org?.slug || 'tech-club';
    const userEmail = req.user?.email;
    const card = membershipService.getDigitalCard(orgKey, userEmail);
    res.json({ card });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// 8. Daily Expiry & Reminders Background Trigger Endpoint
membershipRouter.post('/jobs/check-reminders', authenticate, resolveOrg, (req, res) => {
  try {
    const orgKey = req.org?.slug || 'tech-club';
    const jobResult = membershipService.processDailyReminders(orgKey);
    res.json({
      success: true,
      message: `Processed membership expiries and reminders for ${orgKey}`,
      ...jobResult
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'JOB_FAILED', message: err.message } });
  }
});
