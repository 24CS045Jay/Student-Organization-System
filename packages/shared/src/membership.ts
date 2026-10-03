import { z } from 'zod';

export const MemberStatusSchema = z.enum(['pending', 'active', 'expired', 'inactive']);
export type MemberStatus = z.infer<typeof MemberStatusSchema>;

export const DuesStatusSchema = z.enum(['unpaid', 'paid', 'waived', 'refunded']);
export type DuesStatus = z.infer<typeof DuesStatusSchema>;

// Membership Type
export const MembershipTypeSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  price: z.number().int().nonnegative(), // in paise
  duration_months: z.number().int().positive().default(12),
  benefits: z.string().optional().nullable(),
  ticket_discount_pct: z.number().int().min(0).max(100).default(0),
  merch_discount_pct: z.number().int().min(0).max(100).default(0),
  active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type MembershipType = z.infer<typeof MembershipTypeSchema>;

export const CreateMembershipTypeSchema = MembershipTypeSchema.omit({
  id: true,
  org_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateMembershipTypeInput = z.infer<typeof CreateMembershipTypeSchema>;

// Member Profile
export const MemberSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  student_id: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  skills: z.array(z.string()).default([]),
  availability: z.record(z.any()).default({}),
  mailing_subscribed: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Member = z.infer<typeof MemberSchema>;

export const CreateMemberSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  student_id: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
  availability: z.record(z.any()).optional().default({}),
  mailing_subscribed: z.boolean().optional().default(true),
});
export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;

export const UpdateMemberSchema = CreateMemberSchema.partial();
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;

// Membership
export const MembershipSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  member_id: z.string().uuid(),
  type_id: z.string().uuid(),
  membership_no: z.string(),
  status: MemberStatusSchema.default('pending'),
  dues: DuesStatusSchema.default('unpaid'),
  starts_on: z.string(),
  expires_on: z.string(),
  renewal_of: z.string().uuid().optional().nullable(),
  qr_secret: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Membership = z.infer<typeof MembershipSchema>;

// Register new membership (combines member creation + membership activation)
export const RegisterMembershipSchema = z.object({
  // Member details
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  student_id: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
  
  // Membership choices
  type_id: z.string().uuid().optional(),
  type_name: z.string().optional(), // fallback if specifying by name
  is_paid: z.boolean().default(true),
  starts_on: z.string().optional(), // defaults to today
});
export type RegisterMembershipInput = z.infer<typeof RegisterMembershipSchema>;

// Renew membership
export const RenewMembershipSchema = z.object({
  duration_months: z.number().int().positive().default(12),
  type_id: z.string().uuid().optional(),
  is_paid: z.boolean().default(true),
});
export type RenewMembershipInput = z.infer<typeof RenewMembershipSchema>;

// Verification
export const VerifyMemberSchema = z.object({
  query: z.string().min(1, 'QR token or Member ID is required'),
});
export type VerifyMemberInput = z.infer<typeof VerifyMemberSchema>;

export interface MemberVerificationResult {
  valid: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'UNPAID' | 'INVALID' | 'WRONG_CLUB';
  message: string;
  membership?: {
    membership_no: string;
    status: MemberStatus;
    dues: DuesStatus;
    starts_on: string;
    expires_on: string;
    type_name: string;
    ticket_discount_pct: number;
    merch_discount_pct: number;
  };
  member?: {
    full_name: string;
    email: string;
    student_id?: string | null;
    phone?: string | null;
    org_id: string;
    club_name?: string;
  };
}

// Digital Card
export interface DigitalCardData {
  membership_no: string;
  full_name: string;
  email: string;
  student_id?: string | null;
  phone?: string | null;
  club_name: string;
  club_slug: string;
  type_name: string;
  starts_on: string;
  expires_on: string;
  status: MemberStatus;
  dues: DuesStatus;
  qr_token: string;
  ticket_discount_pct: number;
  merch_discount_pct: number;
  benefits?: string | null;
  is_active: boolean;
}
