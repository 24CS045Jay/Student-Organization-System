-- =============================================================================
-- CLUBSPHERE MULTI-TENANT DATABASE SCHEMA (PostgreSQL / MySQL Compatible)
-- Complete DDL for Student Organization Management, Centralized Auth, and Operations
-- =============================================================================

-- Enable UUID extension (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. ORGANIZATIONS / CLUBS TABLE (Tenant Boundary)
-- =============================================================================
CREATE TABLE IF NOT EXISTS clubs (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'techgenius', 'robotics'
    name VARCHAR(255) NOT NULL,                  -- e.g. 'TechGenius Club'
    short_name VARCHAR(64) NOT NULL,             -- e.g. 'TechGenius'
    prefix VARCHAR(10) NOT NULL,                 -- e.g. 'TG'
    category VARCHAR(100) NOT NULL,              -- e.g. 'Technical & Engineering'
    department VARCHAR(255) NOT NULL,            -- e.g. 'Computer Science Dept'
    faculty_advisor VARCHAR(255),               -- e.g. 'Dr. R. K. Sharma'
    email_domain VARCHAR(255) UNIQUE NOT NULL,   -- e.g. '@techgenius.com'
    contact_email VARCHAR(255),                  -- e.g. 'info@techgenius.com'
    brand_color VARCHAR(32) DEFAULT '#FFE853',   -- Neo-brutalist hex color
    accent_color VARCHAR(32) DEFAULT '#FFD24C',
    banner_text VARCHAR(255),
    tagline VARCHAR(255),
    description TEXT,
    tags JSON DEFAULT '[]',                      -- e.g. ["Coding", "AI", "Workshops"]
    membership_fee DECIMAL(10, 2) DEFAULT 500.00,
    initial_grant DECIMAL(12, 2) DEFAULT 10000.00,
    status VARCHAR(32) DEFAULT 'active',         -- 'active', 'suspended', 'archived'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. USERS & CREDENTIALS TABLE (Centralized Database Auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,                  -- UUID or prefixed ID e.g. 'usr-techgenius-001'
    club_id VARCHAR(64) NOT NULL,                -- Reference to club (Foreign Key)
    name VARCHAR(255) NOT NULL,                  -- Student/User Full Name
    personal_email VARCHAR(255) NOT NULL,        -- Signup Email (e.g. 'jay@gmail.com')
    assigned_club_email VARCHAR(255) UNIQUE NOT NULL, -- Platform Email (e.g. 'jayadmin@techgenius.com')
    password_hash VARCHAR(255) NOT NULL,         -- Bcrypt hashed password
    role VARCHAR(50) NOT NULL,                   -- 'admin', 'treasurer', 'event_manager', 'volunteer', 'student'
    student_roll_no VARCHAR(64),                 -- e.g. '24CS045'
    department VARCHAR(255),
    phone VARCHAR(32),
    avatar_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    password_changed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_club_email ON users(assigned_club_email);
CREATE INDEX idx_users_personal_email ON users(personal_email);
CREATE INDEX idx_users_club_id ON users(club_id);

-- =============================================================================
-- 3. MEMBERSHIP TIERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS membership_types (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'mt-techgenius-1'
    club_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,                  -- e.g. 'Standard Member', 'Premium Pro'
    price DECIMAL(10, 2) NOT NULL,               -- e.g. 500.00
    duration_months INT DEFAULT 12,
    ticket_discount_pct INT DEFAULT 15,
    merch_discount_pct INT DEFAULT 10,
    perks JSON DEFAULT '[]',                     -- e.g. ["Priority Seating", "Swag Bag"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_membership_types_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 4. CLUB MEMBERS ROSTER TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'TG-001'
    club_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),                         -- Linked User Account
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,                 -- Assigned club email
    personal_email VARCHAR(255),
    student_id VARCHAR(64),
    department VARCHAR(255),
    membership_type VARCHAR(100) DEFAULT 'Standard Member',
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT TRUE,
    status VARCHAR(32) DEFAULT 'Active',         -- 'Active', 'Expired', 'Suspended'
    attendance_count INT DEFAULT 0,
    phone VARCHAR(32),
    photo_avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_members_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_members_club_status ON members(club_id, status);

-- =============================================================================
-- 5. EVENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'ev-techgenius-101'
    club_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Workshop',    -- 'Hackathon', 'Workshop', 'Seminar', 'Cultural'
    event_date DATE NOT NULL,
    event_time VARCHAR(32) DEFAULT '10:00 AM',
    location VARCHAR(255) NOT NULL,
    capacity INT NOT NULL DEFAULT 100,
    sold_count INT DEFAULT 0,
    member_price DECIMAL(10, 2) DEFAULT 0.00,
    non_member_price DECIMAL(10, 2) DEFAULT 150.00,
    status VARCHAR(32) DEFAULT 'Draft',          -- 'Draft', 'Published', 'Completed', 'Cancelled'
    description TEXT,
    deadline TIMESTAMP,
    organizer VARCHAR(255),
    banner_gradient VARCHAR(255),
    budget JSON DEFAULT '{}',                    -- e.g. {"venue": 5000, "food": 8000, "prizes": 10000}
    tags JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_club_date ON events(club_id, event_date);

-- =============================================================================
-- 6. TICKETS & ATTENDANCE TABLE (Fast QR Check-In)
-- =============================================================================
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'TKT-TG-9821'
    club_id VARCHAR(64) NOT NULL,
    event_id VARCHAR(64) NOT NULL,
    member_id VARCHAR(64),
    user_id VARCHAR(64),
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    is_member BOOLEAN DEFAULT FALSE,
    price_paid DECIMAL(10, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Valid',          -- 'Valid', 'Attended', 'Refunded'
    seat_identifier VARCHAR(64),
    check_in_time TIMESTAMP NULL,
    qr_token TEXT NOT NULL,                      -- Cryptographically signed token
    payment_id VARCHAR(128),
    payment_provider VARCHAR(64) DEFAULT 'razorpay',
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_tickets_event_status ON tickets(event_id, status);
CREATE INDEX idx_tickets_qr_token ON tickets(qr_token);

-- =============================================================================
-- 7. MERCHANDISE & INVENTORY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS merchandise (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'merch-tg-1'
    club_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,                  -- e.g. 'Official Club Hoodie'
    category VARCHAR(100) DEFAULT 'Apparel',
    base_price DECIMAL(10, 2) NOT NULL,
    member_price DECIMAL(10, 2) NOT NULL,
    stock_variants JSON NOT NULL DEFAULT '{"S": 10, "M": 20, "L": 15, "XL": 5}',
    total_sold INT DEFAULT 0,
    image_url VARCHAR(512),
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_merch_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 8. MERCHANDISE ORDERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'ORD-TG-540'
    club_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    items JSON NOT NULL,                         -- Array of purchased items [{productId, size, qty, price}]
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Paid',           -- 'Paid', 'Ready for Pickup', 'Fulfilled', 'Refunded'
    payment_method VARCHAR(64) DEFAULT 'UPI',
    pickup_code VARCHAR(32),
    order_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 9. FINANCIAL TRANSACTIONS & AUDITED LEDGER
-- =============================================================================
CREATE TABLE IF NOT EXISTS financial_ledger (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'TXN-TG-001'
    club_id VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,                   -- 'INCOME' or 'EXPENSE'
    category VARCHAR(100) NOT NULL,              -- 'Membership Dues', 'Event Tickets', 'Venue', 'Equipment'
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by VARCHAR(255),
    receipt_url VARCHAR(512),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_finance_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_finance_club_date ON financial_ledger(club_id, transaction_date);

-- =============================================================================
-- 10. REIMBURSEMENTS TABLE (Volunteer Expense Claims)
-- =============================================================================
CREATE TABLE IF NOT EXISTS reimbursements (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'REIMB-TG-101'
    club_id VARCHAR(64) NOT NULL,
    volunteer_name VARCHAR(255) NOT NULL,
    volunteer_email VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    event_title VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    claim_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    receipt_url VARCHAR(512),
    status VARCHAR(32) DEFAULT 'Submitted',      -- 'Submitted', 'Treasurer Approved', 'Reimbursed', 'Rejected'
    approved_by VARCHAR(255),
    payment_reference VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reimb_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 11. VOLUNTEER TASKS TABLE (Kanban Board)
-- =============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'TSK-TG-201'
    club_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) DEFAULT 'Unassigned',
    deadline DATE NOT NULL,
    priority VARCHAR(32) DEFAULT 'Medium',       -- 'High', 'Medium', 'Low'
    status VARCHAR(32) DEFAULT 'Pending',        -- 'Pending', 'In Progress', 'Review', 'Done'
    progress_pct INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_club_status ON tasks(club_id, status);

-- =============================================================================
-- 12. VOLUNTEER GAMIFICATION & SERVICE HOURS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS volunteers (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'VOL-TG-01'
    club_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    role_title VARCHAR(100) DEFAULT 'Volunteer',
    service_hours INT DEFAULT 0,
    badge_tier VARCHAR(64) DEFAULT 'Bronze Contributor', -- 'Bronze', 'Silver', 'Gold Legend'
    rating DECIMAL(3, 2) DEFAULT 5.00,
    skills JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_volunteers_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 13. DONATIONS & 80G TAX EXEMPTION RECORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS donations (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'DON-TG-101'
    club_id VARCHAR(64) NOT NULL,
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    campaign_name VARCHAR(255) DEFAULT 'General Club Support',
    donation_date DATE DEFAULT CURRENT_DATE,
    receipt_number VARCHAR(64) UNIQUE NOT NULL,  -- e.g. '80G-TG-2026-001'
    pan_number VARCHAR(32),
    is_tax_exempt BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_donations_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 14. SPONSORSHIPS & CONTRACTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS sponsors (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'SPON-TG-01'
    club_id VARCHAR(64) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(32),
    tier VARCHAR(64) DEFAULT 'Title Sponsor',    -- 'Title Sponsor', 'Gold', 'Silver', 'Beverage Partner'
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Active',         -- 'Active', 'Pending Agreement', 'Completed'
    signed_date DATE DEFAULT CURRENT_DATE,
    deliverables JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sponsors_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 15. DIGITAL CERTIFICATES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'CERT-TG-8091'
    club_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(64),
    event_name VARCHAR(255) NOT NULL,
    certificate_type VARCHAR(100) DEFAULT 'Certificate of Excellence',
    issue_date DATE DEFAULT CURRENT_DATE,
    verification_code VARCHAR(64) UNIQUE NOT NULL,
    qr_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificates_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 16. EVENT FEEDBACK & RATINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'FDBK-TG-01'
    club_id VARCHAR(64) NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) DEFAULT 'Anonymous Student',
    author_email VARCHAR(255),
    overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
    category_ratings JSON DEFAULT '{}',          -- {"speaker": 5, "content": 5, "venue": 4}
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 17. ANNOUNCEMENTS & BROADCASTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'ANN-TG-01'
    club_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    audience VARCHAR(100) DEFAULT 'All Members',
    channels JSON DEFAULT '["Website", "Email"]',
    author VARCHAR(255) DEFAULT 'Club Executive',
    status VARCHAR(32) DEFAULT 'Published',
    published_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- =============================================================================
-- 18. IMMUTABLE SYSTEM & FINANCIAL AUDIT LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,                  -- e.g. 'AUD-TG-98214'
    club_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    details TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_club_time ON audit_logs(club_id, created_at DESC);

-- =============================================================================
-- 19. PERMISSIONS & ROW LEVEL SECURITY (RLS) CONFIGURATION
-- Allows full dynamic CRUD operations from the frontend/API client
-- =============================================================================
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Grant permissions to Supabase roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

