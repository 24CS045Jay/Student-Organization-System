-- ==============================================================================
-- Migration 04: Digital Tickets, QR Check-in & Attendance (Phase 4: FR-05, FR-06, FR-19)
-- ==============================================================================

-- Create index on tickets for high-speed scanner queries
create index if not exists idx_tickets_checkin on tickets (org_id, event_id, status);
create index if not exists idx_tickets_ticket_no on tickets (ticket_no);
create index if not exists idx_tickets_qr_token on tickets (qr_token);

-- Atomic Check-in Function with Deduplication & Explanatory Return Codes
create or replace function check_in_ticket(
  p_ticket_identifier text,
  p_org_id uuid,
  p_scanner_id uuid default null
) returns jsonb
language plpgsql security definer as $$
declare
  tkt tickets%rowtype;
  ev events%rowtype;
begin
  -- 1. Find ticket by ticket_no or qr_token
  select * into tkt from tickets
  where (ticket_no = upper(trim(p_ticket_identifier)) or qr_token = trim(p_ticket_identifier));

  if tkt.id is null then
    return jsonb_build_object(
      'status', 'INVALID',
      'message', 'Ticket not found in the database. Please verify barcode.'
    );
  end if;

  -- 2. Enforce Multi-tenant isolation (NFR-03)
  if tkt.org_id <> p_org_id then
    return jsonb_build_object(
      'status', 'WRONG_ORGANIZATION',
      'message', 'Cross-tenant security violation: This ticket belongs to another club!',
      'ticket_no', tkt.ticket_no
    );
  end if;

  -- 3. Check duplicate scans (FR-05)
  if tkt.status = 'used' then
    return jsonb_build_object(
      'status', 'ALREADY_USED',
      'message', 'Ticket has already been scanned!',
      'ticket_no', tkt.ticket_no,
      'checked_in_at', tkt.checked_in_at,
      'attendee_name', tkt.attendee_name
    );
  end if;

  -- 4. Check if ticket was cancelled or refunded
  if tkt.status = 'cancelled' or tkt.status = 'refunded' then
    return jsonb_build_object(
      'status', 'CANCELLED',
      'message', 'Entry denied: This ticket has been cancelled or refunded.',
      'ticket_no', tkt.ticket_no
    );
  end if;

  -- 5. Atomic Update with condition status = 'valid' (guards against parallel scanning races)
  update tickets
  set status = 'used',
      checked_in_at = now(),
      checked_in_by = p_scanner_id
  where id = tkt.id and status in ('valid', 'reserved')
  returning * into tkt;

  if not found then
    return jsonb_build_object(
      'status', 'RACE_CONDITION_DETECTED',
      'message', 'Simultaneous check-in detected. Duplicate entry rejected.'
    );
  end if;

  -- Fetch Event Title for check-in response
  select * into ev from events where id = tkt.event_id;

  return jsonb_build_object(
    'status', 'VALID',
    'message', 'Check-in successful! Welcome ' || tkt.attendee_name,
    'ticket_no', tkt.ticket_no,
    'attendee_name', tkt.attendee_name,
    'attendee_email', tkt.attendee_email,
    'event_title', ev.title,
    'kind', tkt.kind,
    'seat_number', tkt.seat_number,
    'checked_in_at', tkt.checked_in_at
  );
end;
$$;

-- View for real-time attendance statistics
create or replace view view_event_attendance_stats as
select
  e.id as event_id,
  e.org_id,
  e.title as event_title,
  e.capacity,
  e.tickets_sold,
  count(t.id) filter (where t.status = 'used') as attended_count,
  count(t.id) filter (where t.status = 'valid') as expected_count,
  count(t.id) filter (where t.kind = 'member' and t.status = 'used') as member_attendees,
  count(t.id) filter (where t.kind = 'non_member' and t.status = 'used') as non_member_attendees,
  round((count(t.id) filter (where t.status = 'used')::numeric / nullif(e.tickets_sold, 0)) * 100, 1) as attendance_rate_pct
from events e
left join tickets t on t.event_id = e.id
group by e.id, e.org_id, e.title, e.capacity, e.tickets_sold;
