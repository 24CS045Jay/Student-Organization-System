// ==========================================================================
// ClubSphere In-Memory + LocalStorage Database
// Seed data for 3 distinct clubs + Platform Multi-Tenant SaaS
// ==========================================================================

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const STORAGE_KEY = 'clubsphere_mock_db_v2';

export const INITIAL_CLUBS_DATA = {
  tech: {
    id: 'tech',
    name: 'CHARUSAT Tech Club',
    short: 'Tech Club',
    prefix: 'TC',
    category: 'Technical',
    color: '#4CC9F0',
    accentColor: '#FFD24C',
    banner: '⚡ Innovate • Code • Disrupt',
    description: 'Premier technical club fostering hackathons, AI workshops, robotics, and developer ecosystems.',
    stats: { membersCount: 142, activeEvents: 2, totalRevenue: 215000, volunteersCount: 18 },
    membershipTypes: [
      { id: 'mt-tech-1', name: 'Standard Member', price: 499, durationMonths: 12, ticketDiscount: 15, merchDiscount: 10, perks: ['Discounted entry to workshops', 'Access to Discord VIP', 'Basic Certificate'] },
      { id: 'mt-tech-2', name: 'Premium Pro Clubber', price: 999, durationMonths: 12, ticketDiscount: 40, merchDiscount: 25, perks: ['Free 24h Hackathon Fastpass', 'Exclusive Swag Bag', 'Priority Mentorship', 'All Certificates'] }
    ],
    members: [
      { id: 'TC-001', name: 'Aarav Shah', email: 'aarav.shah@charusat.edu.in', studentId: '21IT089', dept: 'Information Technology', type: 'Premium Pro Clubber', exp: '2027-03-01', startDate: '2026-03-01', paid: 1, status: 'Active', photo: '👨‍💻', phone: '+91 98765 43210', attendanceCount: 7, history: [{ date: '2026-03-01', action: 'Joined as Premium', amt: 999 }] },
      { id: 'TC-002', name: 'Diya Patel', email: 'diya.p@charusat.edu.in', studentId: '22CE045', dept: 'Computer Engineering', type: 'Standard Member', exp: '2026-12-15', startDate: '2025-12-15', paid: 1, status: 'Active', photo: '👩‍💻', phone: '+91 98765 43211', attendanceCount: 4, history: [{ date: '2025-12-15', action: 'Joined as Standard', amt: 499 }] },
      { id: 'TC-003', name: 'Rahul Mehta', email: 'rahul.m@charusat.edu.in', studentId: '20EC012', dept: 'Electronics', type: 'Standard Member', exp: '2026-09-01', startDate: '2025-09-01', paid: 0, status: 'Expired', photo: '🧑‍💻', phone: '+91 98765 43212', attendanceCount: 2, history: [{ date: '2025-09-01', action: 'Registered (Unpaid)', amt: 0 }] },
      { id: 'TC-004', name: 'Priya Desai', email: 'priya.desai@charusat.edu.in', studentId: '23CS104', dept: 'Computer Science', type: 'Premium Pro Clubber', exp: '2027-01-20', startDate: '2026-01-20', paid: 1, status: 'Active', photo: '👩‍🔬', phone: '+91 98765 43213', attendanceCount: 9, history: [{ date: '2026-01-20', action: 'Upgraded to Premium', amt: 999 }] },
      { id: 'TC-005', name: 'Param Joshi', email: 'param.j@charusat.edu.in', studentId: '22IT033', dept: 'Information Technology', type: 'Standard Member', exp: '2026-11-30', startDate: '2025-11-30', paid: 1, status: 'Active', photo: '👨‍💼', phone: '+91 98765 43214', attendanceCount: 5, history: [{ date: '2025-11-30', action: 'Joined as Standard', amt: 499 }] }
    ],
    events: [
      {
        id: 'ev-tech-1',
        title: 'CHARUSAT 24h Hackathon 2026',
        category: 'Hackathon',
        date: '2026-10-18',
        time: '09:00 AM',
        location: 'Central Computing Lab, Building C',
        capacity: 120,
        sold: 114,
        memberPrice: 200,
        nonMemberPrice: 350,
        status: 'Published',
        description: 'Flagship 24-hour sprint building real-world AI and Web3 applications with ₹1,00,000 in cash prizes, mentors, free food, and exclusive sponsor swags.',
        deadline: '2026-10-16 23:59',
        organizer: 'Tech Club Executive Board',
        bannerGradient: 'linear-gradient(135deg, #FFD24C 0%, #FF70A6 100%)',
        budget: { venue: 25000, food: 35000, equipment: 15000, prizes: 50000, marketing: 10000 },
        tags: ['AI/ML', 'Web Dev', 'Cash Prizes']
      },
      {
        id: 'ev-tech-2',
        title: 'Generative AI & LLM Systems Workshop',
        category: 'Workshop',
        date: '2026-11-02',
        time: '02:00 PM',
        location: 'Auditorium 1, CSPIT',
        capacity: 60,
        sold: 45,
        memberPrice: 100,
        nonMemberPrice: 200,
        status: 'Published',
        description: 'Hands-on masterclass deploying local open-source LLMs, RAG pipelines, and agentic workflows with industry experts.',
        deadline: '2026-11-01 18:00',
        organizer: 'AI Research Wing',
        bannerGradient: 'linear-gradient(135deg, #74B9FF 0%, #C8B6FF 100%)',
        budget: { venue: 5000, food: 8000, equipment: 6000, prizes: 0, marketing: 3000 },
        tags: ['Hands-on', 'Certificate', 'Beginner Friendly']
      },
      {
        id: 'ev-tech-3',
        title: 'RoboWars Arena Championship',
        category: 'Competition',
        date: '2026-12-05',
        time: '10:00 AM',
        location: 'University Amphitheatre',
        capacity: 200,
        sold: 30,
        memberPrice: 150,
        nonMemberPrice: 250,
        status: 'Draft',
        description: 'Combat robotics spectacle featuring 15kg and 30kg wired/wireless fighting bots colliding in steel cage arenas.',
        deadline: '2026-12-01 23:59',
        organizer: 'Robotics Wing',
        bannerGradient: 'linear-gradient(135deg, #70E4A8 0%, #FFD24C 100%)',
        budget: { venue: 30000, food: 15000, equipment: 25000, prizes: 30000, marketing: 5000 },
        tags: ['Robotics', 'Combat', 'Trophy']
      }
    ],
    tickets: [
      { id: 'TKT-TC-9801', eventId: 'ev-tech-1', eventTitle: 'CHARUSAT 24h Hackathon 2026', memberId: 'TC-001', attendeeName: 'Aarav Shah', email: 'aarav.shah@charusat.edu.in', isMember: true, pricePaid: 200, status: 'Valid', checkInTime: null, seat: 'Table-A14', purchaseDate: '2026-10-01' },
      { id: 'TKT-TC-9802', eventId: 'ev-tech-1', eventTitle: 'CHARUSAT 24h Hackathon 2026', memberId: 'TC-002', attendeeName: 'Diya Patel', email: 'diya.p@charusat.edu.in', isMember: true, pricePaid: 200, status: 'Attended', checkInTime: '2026-10-18 08:45 AM', seat: 'Table-B02', purchaseDate: '2026-10-02' },
      { id: 'TKT-TC-9803', eventId: 'ev-tech-1', eventTitle: 'CHARUSAT 24h Hackathon 2026', memberId: null, attendeeName: 'Kunal Verma', email: 'kunal.v@gmail.com', isMember: false, pricePaid: 350, status: 'Valid', checkInTime: null, seat: 'Table-C09', purchaseDate: '2026-10-02' },
      { id: 'TKT-TC-9804', eventId: 'ev-tech-2', eventTitle: 'Generative AI & LLM Systems Workshop', memberId: 'TC-004', attendeeName: 'Priya Desai', email: 'priya.desai@charusat.edu.in', isMember: true, pricePaid: 100, status: 'Valid', checkInTime: null, seat: 'Row 3-Seat 12', purchaseDate: '2026-10-02' }
    ],
    merchandise: [
      {
        id: 'merch-tech-1',
        name: 'Official Cybernetic Club Hoodie',
        category: 'Hoodie',
        image: '🧥',
        memberPrice: 899,
        nonMemberPrice: 1099,
        description: 'Heavyweight 380 GSM fleece cotton hoodie with embroidered neon circuitry logo and fleece lined hood.',
        stock: { S: 10, M: 22, L: 14, XL: 6 },
        totalSold: 38
      },
      {
        id: 'merch-tech-2',
        name: 'Terminal Syntax Oversized T-Shirt',
        category: 'T-Shirt',
        image: '👕',
        memberPrice: 399,
        nonMemberPrice: 499,
        description: '240 GSM pure combed cotton tee featuring custom glow-in-dark monospace typography.',
        stock: { S: 8, M: 25, L: 12, XL: 5 },
        totalSold: 52
      },
      {
        id: 'merch-tech-3',
        name: 'Developer Vinyl Sticker & Cap Pack',
        category: 'Cap',
        image: '🧢',
        memberPrice: 249,
        nonMemberPrice: 349,
        description: 'Embroidered structured snapback cap plus 10 waterproof vinyl laptop stickers.',
        stock: { S: 0, M: 35, L: 0, XL: 0 },
        totalSold: 65
      }
    ],
    orders: [
      { id: 'ORD-TC-501', memberId: 'TC-001', customerName: 'Aarav Shah', email: 'aarav.shah@charusat.edu.in', items: [{ productId: 'merch-tech-1', name: 'Official Cybernetic Club Hoodie', size: 'L', qty: 1, price: 899 }], totalAmt: 899, status: 'Delivered', date: '2026-09-28', paymentMethod: 'UPI' },
      { id: 'ORD-TC-502', memberId: 'TC-004', customerName: 'Priya Desai', email: 'priya.desai@charusat.edu.in', items: [{ productId: 'merch-tech-2', name: 'Terminal Syntax Oversized T-Shirt', size: 'M', qty: 1, price: 399 }], totalAmt: 399, status: 'Ready', date: '2026-10-02', paymentMethod: 'Card' }
    ],
    fundraisers: [
      {
        id: 'fund-tech-1',
        title: 'Open Robotics Hardware & Drone Kit Fund',
        target: 100000,
        raised: 74500,
        donorCount: 42,
        startDate: '2026-09-01',
        endDate: '2026-11-15',
        status: 'Active',
        organizer: 'Aarav Shah & Hardware Team',
        description: 'Raising funds to purchase 6 DJI educational drone kits and 10 Arduino/ESP32 sensor lab crates for rural high school workshops.',
        tasksCount: 6,
        assignedVolunteers: ['Jay Barot', 'Param Joshi', 'Diya Patel']
      }
    ],
    tasks: [
      { id: 'tsk-1', title: 'Confirm 24h Hackathon Wi-Fi bandwidth with IT Admin', owner: 'Aarav Shah', deadline: '2026-10-10', priority: 'High', status: 'In Progress', progress: 65, notes: 'Dual 1Gbps dedicated fiber line requested.' },
      { id: 'tsk-2', title: 'Print 500 sponsor stickers & badges', owner: 'Jay Barot', deadline: '2026-10-14', priority: 'Medium', status: 'Done', progress: 100, notes: 'Received from PrintZone vendor.' },
      { id: 'tsk-3', title: 'Prepare Live Streaming equipment for Keynotes', owner: 'Param Joshi', deadline: '2026-10-17', priority: 'High', status: 'Pending', progress: 20, notes: 'Need 2 tripods and capture card from lab.' },
      { id: 'tsk-4', title: 'Coordinate catering dinner menu for 120 hackers', owner: 'Priya Desai', deadline: '2026-10-15', priority: 'Urgent', status: 'In Progress', progress: 50, notes: 'Midnight pizza & energy drinks sponsored.' },
      { id: 'tsk-5', title: 'Draft opening slide deck and keynote agenda', owner: 'Aarav Shah', deadline: '2026-10-16', priority: 'Low', status: 'Pending', progress: 0, notes: 'Include sponsor logos on slide 3.' }
    ],
    volunteers: [
      { id: 'vol-1', name: 'Jay Barot', email: 'jay.barot@charusat.edu.in', phone: '+91 94280 11223', skills: ['Event Logistics', 'Social Media', 'Stage Management'], hours: 48, badge: 'Silver Contributor', rating: 4.9, activeTasks: 2, tasksCompleted: 14 },
      { id: 'vol-2', name: 'Param Joshi', email: 'param.j@charusat.edu.in', phone: '+91 94280 11224', skills: ['Audio/Video', 'Hardware Lab', 'Registration'], hours: 62, badge: 'Silver Contributor', rating: 4.8, activeTasks: 1, tasksCompleted: 19 },
      { id: 'vol-3', name: 'Isha Nair', email: 'isha.nair@charusat.edu.in', phone: '+91 94280 11225', skills: ['Graphic Design', 'Hospitality', 'Catering'], hours: 105, badge: 'Gold Legend', rating: 5.0, activeTasks: 1, tasksCompleted: 31 }
    ],
    reimbursements: [
      { id: 'REIMB-TC-301', volunteerName: 'Jay Barot', volunteerEmail: 'jay.barot@charusat.edu.in', category: 'Supplies & Printing', event: 'CHARUSAT 24h Hackathon 2026', amount: 1800, date: '2026-10-01', description: 'Banner printing and vinyl lanyards', receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400', status: 'Treasurer Approved', approver: 'Treasurer Tech', notes: 'All receipts verified' },
      { id: 'REIMB-TC-302', volunteerName: 'Param Joshi', volunteerEmail: 'param.j@charusat.edu.in', category: 'Equipment & Cables', event: 'Generative AI Workshop', amount: 950, date: '2026-10-02', description: 'HDMI to Type-C splitters & extension cords', receiptUrl: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=400', status: 'Submitted', approver: null, notes: 'Pending Event Manager review' }
    ],
    finance: {
      totalIncome: 215000,
      totalExpenses: 78000,
      netBalance: 137000,
      incomeSources: [
        { source: 'Membership Dues', amount: 62000, count: 68 },
        { source: 'Event Tickets', amount: 84000, count: 210 },
        { source: 'Merchandise Sales', amount: 41000, count: 85 },
        { source: 'Fundraising & Donations', amount: 28000, count: 18 }
      ],
      expensesList: [
        { id: 'EXP-TC-101', title: 'Hackathon Venue Central Lab Air Conditioning & Power', category: 'Venue', amount: 30000, date: '2026-09-20', approvedBy: 'Admin Tech', receipt: 'INV-PWR-998' },
        { id: 'EXP-TC-102', title: 'Catering Advance for AI Workshop high tea', category: 'Food', amount: 22000, date: '2026-09-25', approvedBy: 'Treasurer Tech', receipt: 'INV-CAT-112' },
        { id: 'EXP-TC-103', title: 'Robotics Sensors and Microcontrollers', category: 'Equipment', amount: 18000, date: '2026-09-29', approvedBy: 'Treasurer Tech', receipt: 'INV-ROB-443' },
        { id: 'EXP-TC-104', title: 'Reimbursement: Jay Barot (Banners & Lanyards)', category: 'Reimbursement', amount: 1800, date: '2026-10-01', approvedBy: 'Treasurer Tech', receipt: 'REIMB-TC-301' }
      ],
      budgetAllocated: 150000,
      budgetSpent: 78000
    },
    sponsors: [
      { id: 'sp-1', company: 'DevMatrix Cloud Technologies', tier: 'Platinum Sponsor', amount: 50000, contact: 'contact@devmatrix.io', status: 'Confirmed', perks: ['Keynote presentation', 'Booth in hackathon arena', 'Logo on all hoodies', 'Resume access'], contractSigned: true },
      { id: 'sp-2', company: 'GitHub Student Campus', tier: 'Gold Sponsor', amount: 30000, contact: 'partnerships@github.com', status: 'Confirmed', perks: ['Swag pack distribute', 'Challenge sponsor prize', 'Logo on banners'], contractSigned: true }
    ],
    donations: [
      { id: 'don-1', donorName: 'Dr. R. K. Patel (Alumni 2012)', amount: 10000, date: '2026-09-18', campaign: 'Open Robotics Hardware Fund', anonymous: false, receiptNo: 'DON-REC-801' },
      { id: 'don-2', donorName: 'Anonymous Supporter', amount: 5000, date: '2026-09-22', campaign: 'General Tech Club Innovation Fund', anonymous: true, receiptNo: 'DON-REC-802' }
    ],
    certificates: [
      { id: 'CERT-TC-2026-01', studentName: 'Diya Patel', studentId: '22CE045', eventName: 'Web3 & Decentralized Systems Summit', issueDate: '2026-08-15', qrCode: 'CERT-TC-2026-01-VERIFIED', type: 'Certificate of Excellence' },
      { id: 'CERT-TC-2026-02', studentName: 'Priya Desai', studentId: '23CS104', eventName: 'Python for Data Science Bootcamp', issueDate: '2026-07-20', qrCode: 'CERT-TC-2026-02-VERIFIED', type: 'Certificate of Completion' }
    ],
    feedback: [
      { id: 'fb-1', eventTitle: 'Generative AI Workshop', ratings: { overall: 5, speaker: 5, content: 5, venue: 4, organization: 5 }, comment: 'Super practical hands-on examples. The mentor explained complex transformer architectures with extreme clarity!', author: 'Priya D.' },
      { id: 'fb-2', eventTitle: 'CHARUSAT 24h Hackathon 2025', ratings: { overall: 5, speaker: 4, content: 5, venue: 5, organization: 5 }, comment: 'Best organized hackathon in Gujarat. High speed Wi-Fi stayed 100% stable throughout the night.', author: 'Kunal V.' }
    ],
    announcements: [
      { id: 'ann-1', title: '🚨 Registration Open: CHARUSAT 24h Hackathon 2026!', date: '2026-10-01', audience: 'All Members & Students', channels: ['Website', 'Email', 'In-app'], status: 'Published', author: 'Tech Club Admin', content: 'Grab your early-bird hacker pass! ₹1,00,000 in cash prizes, mentors from top tech companies, and 24 hours of non-stop building.', reach: 450 },
      { id: 'ann-2', title: '📦 New Limited Edition Cybernetic Hoodies in Merch Shop', date: '2026-09-28', audience: 'Active Members', channels: ['In-app', 'Email'], status: 'Published', author: 'Merch Coordinator', content: 'Members get an exclusive 25% discount on all hoodies this week only. Check out the Merch tab.', reach: 142 }
    ],
    renewalReminders: [
      { id: 'rem-1', studentName: 'Rahul Mehta', daysLeft: 0, status: 'Sent (Expired Notification)', date: '2026-09-01' },
      { id: 'rem-2', studentName: 'Param Joshi', daysLeft: 58, status: 'Scheduled (60-day reminder)', date: '2026-10-01' }
    ]
  },

  cult: {
    id: 'cult',
    name: 'CHARUSAT Cultural Club',
    short: 'Cultural Club',
    prefix: 'CC',
    category: 'Cultural & Arts',
    color: '#FF70A6',
    accentColor: '#FFD24C',
    banner: '🎭 Rhythm • Drama • Expression',
    description: 'Celebrating arts, theatre, mega festivals, classical music, and cultural unity across the campus.',
    stats: { membersCount: 118, activeEvents: 2, totalRevenue: 178000, volunteersCount: 24 },
    membershipTypes: [
      { id: 'mt-cult-1', name: 'Cultural Pass Holder', price: 399, durationMonths: 12, ticketDiscount: 20, merchDiscount: 15, perks: ['Discounted entry to Garba Night & Open Mic', 'Audition priority pass'] },
      { id: 'mt-cult-2', name: 'VIP Arts Guild', price: 799, durationMonths: 12, ticketDiscount: 50, merchDiscount: 30, perks: ['VIP front row passes for all fests', 'Official Club Kurta Tee', 'Free Entry to Open Mic'] }
    ],
    members: [
      { id: 'CC-001', name: 'Meera Joshi', email: 'meera.j@charusat.edu.in', studentId: '21CL023', dept: 'Civil Engineering', type: 'VIP Arts Guild', exp: '2027-02-10', startDate: '2026-02-10', paid: 1, status: 'Active', photo: '💃', phone: '+91 97230 44551', attendanceCount: 6, history: [{ date: '2026-02-10', action: 'Joined VIP Arts Guild', amt: 799 }] },
      { id: 'CC-002', name: 'Kabir Rao', email: 'kabir.rao@charusat.edu.in', studentId: '22ME091', dept: 'Mechanical Engineering', type: 'Cultural Pass Holder', exp: '2026-08-01', startDate: '2025-08-01', paid: 1, status: 'Expired', photo: '🎭', phone: '+91 97230 44552', attendanceCount: 8, history: [{ date: '2025-08-01', action: 'Joined Pass Holder', amt: 399 }] },
      { id: 'CC-003', name: 'Isha Nair', email: 'isha.nair@charusat.edu.in', studentId: '23EC056', dept: 'Electronics', type: 'Cultural Pass Holder', exp: '2027-04-04', startDate: '2026-04-04', paid: 1, status: 'Active', photo: '🎨', phone: '+91 97230 44553', attendanceCount: 3, history: [{ date: '2026-04-04', action: 'Joined Pass Holder', amt: 399 }] }
    ],
    events: [
      {
        id: 'ev-cult-1',
        title: 'Grand Navratri Garba Utsav 2026',
        category: 'Fest',
        date: '2026-10-22',
        time: '07:00 PM',
        location: 'University Mega Cricket Ground',
        capacity: 400,
        sold: 340,
        memberPrice: 150,
        nonMemberPrice: 300,
        status: 'Published',
        description: 'Night of traditional folk beats, live dhol symphony, celebrity singer performances, and best-dressed prizes.',
        deadline: '2026-10-21 20:00',
        organizer: 'Cultural Exec Council',
        bannerGradient: 'linear-gradient(135deg, #FF70A6 0%, #FFD24C 100%)',
        budget: { venue: 45000, food: 20000, equipment: 35000, prizes: 20000, marketing: 8000 },
        tags: ['Traditional', 'Live Music', 'Food Stalls']
      },
      {
        id: 'ev-cult-2',
        title: 'Unplugged: Acoustic Night & Open Mic',
        category: 'Music',
        date: '2026-11-09',
        time: '06:00 PM',
        location: 'Open Air Amphitheatre',
        capacity: 80,
        sold: 35,
        memberPrice: 0,
        nonMemberPrice: 100,
        status: 'Published',
        description: 'Poetry, stand-up comedy, acoustic jamming sessions, and hot coffee under the starry night sky.',
        deadline: '2026-11-08 18:00',
        organizer: 'Music & Literary Guild',
        bannerGradient: 'linear-gradient(135deg, #C8B6FF 0%, #74B9FF 100%)',
        budget: { venue: 5000, food: 6000, equipment: 8000, prizes: 5000, marketing: 2000 },
        tags: ['Poetry', 'Acoustic', 'Free for Members']
      }
    ],
    tickets: [
      { id: 'TKT-CC-401', eventId: 'ev-cult-1', eventTitle: 'Grand Navratri Garba Utsav 2026', memberId: 'CC-001', attendeeName: 'Meera Joshi', email: 'meera.j@charusat.edu.in', isMember: true, pricePaid: 150, status: 'Valid', checkInTime: null, seat: 'General Arena', purchaseDate: '2026-10-01' }
    ],
    merchandise: [
      { id: 'merch-cult-1', name: 'Handcrafted Festive Kurta Tee', category: 'T-Shirt', image: '👘', memberPrice: 549, nonMemberPrice: 699, description: 'Traditional block print breathable cotton kurta tee.', stock: { S: 8, M: 16, L: 9, XL: 4 }, totalSold: 28 },
      { id: 'merch-cult-2', name: 'Canvas Bohemia Tote Bag', category: 'Other', image: '👜', memberPrice: 199, nonMemberPrice: 249, description: 'Eco-friendly organic canvas tote bag with artistic mandala graphics.', stock: { S: 0, M: 40, L: 0, XL: 0 }, totalSold: 46 }
    ],
    orders: [],
    fundraisers: [
      { id: 'fund-cult-1', title: 'Musical Instruments & Sound Stage Gear Fund', target: 60000, raised: 32000, donorCount: 19, startDate: '2026-09-10', endDate: '2026-11-30', status: 'Active', organizer: 'Kabir Rao', description: 'Acquiring professional studio microphones and acoustic cajons.', tasksCount: 3, assignedVolunteers: ['Meera Joshi', 'Isha Nair'] }
    ],
    tasks: [
      { id: 'tsk-c1', title: 'Finalize DJ and Live Dhol artists contract for Garba', owner: 'Kabir Rao', deadline: '2026-10-12', priority: 'Urgent', status: 'In Progress', progress: 80, notes: 'Advance token payment submitted.' },
      { id: 'tsk-c2', title: 'Design social media countdown carousel posters', owner: 'Isha Nair', deadline: '2026-10-14', priority: 'High', status: 'Done', progress: 100, notes: 'Published on Instagram.' }
    ],
    volunteers: [
      { id: 'vol-c1', name: 'Meera Joshi', email: 'meera.j@charusat.edu.in', phone: '+91 97230 44551', skills: ['Stage Decor', 'Choreography', 'Hospitality'], hours: 55, badge: 'Silver Contributor', rating: 4.9, activeTasks: 1, tasksCompleted: 12 },
      { id: 'vol-c2', name: 'Kabir Rao', email: 'kabir.rao@charusat.edu.in', phone: '+91 97230 44552', skills: ['Sound Engineering', 'Vendor Relations'], hours: 78, badge: 'Silver Contributor', rating: 4.8, activeTasks: 1, tasksCompleted: 22 }
    ],
    reimbursements: [
      { id: 'REIMB-CC-201', volunteerName: 'Nisha Vyas', volunteerEmail: 'nisha.v@charusat.edu.in', category: 'Decor Supplies', event: 'Grand Navratri Garba Utsav 2026', amount: 3200, date: '2026-09-30', description: 'Fairy lights, marigold garlands & stage fabric', receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400', status: 'Submitted', approver: null, notes: 'Original GST tax bill attached' }
    ],
    finance: {
      totalIncome: 178000,
      totalExpenses: 86000,
      netBalance: 92000,
      incomeSources: [
        { source: 'Membership Dues', amount: 38000, count: 42 },
        { source: 'Event Tickets', amount: 112000, count: 320 },
        { source: 'Merchandise Sales', amount: 19000, count: 50 },
        { source: 'Fundraising & Donations', amount: 9000, count: 8 }
      ],
      expensesList: [
        { id: 'EXP-CC-1', title: 'Stage Construction & Wooden Flooring', category: 'Venue', amount: 45000, date: '2026-09-21', approvedBy: 'Admin Cultural', receipt: 'INV-STG-10' },
        { id: 'EXP-CC-2', title: 'Concert Sound System & Line Arrays', category: 'Equipment', amount: 26000, date: '2026-09-24', approvedBy: 'Treasurer Cultural', receipt: 'INV-SND-88' },
        { id: 'EXP-CC-3', title: 'Floral Decor and Traditional Rangoli Setup', category: 'Operational', amount: 15000, date: '2026-09-28', approvedBy: 'Treasurer Cultural', receipt: 'INV-DEC-55' }
      ],
      budgetAllocated: 120000,
      budgetSpent: 86000
    },
    sponsors: [
      { id: 'sp-c1', company: 'Royal Beats Sound & Lights', tier: 'Gold Sponsor', amount: 35000, contact: 'info@royalbeats.com', status: 'Confirmed', perks: ['Stage side banners', 'Audio announcements'], contractSigned: true }
    ],
    donations: [],
    certificates: [],
    feedback: [],
    announcements: [
      { id: 'ann-c1', title: '🎉 Garba Utsav Passes Going Fast! 85% Sold Out', date: '2026-10-02', audience: 'All Members', channels: ['In-app', 'Website'], status: 'Published', author: 'Cultural Admin', content: 'Book your pass now to avoid last-minute rush at the registration desk.', reach: 300 }
    ],
    renewalReminders: []
  },

  sport: {
    id: 'sport',
    name: 'CHARUSAT Sports Club',
    short: 'Sports Club',
    prefix: 'SC',
    category: 'Sports & Athletics',
    color: '#70E4A8',
    accentColor: '#FFD24C',
    banner: '⚡ Strength • Teamwork • Glory',
    description: 'Empowering athletes across football, cricket, basketball, esports, and university tournaments.',
    stats: { membersCount: 96, activeEvents: 2, totalRevenue: 92000, volunteersCount: 15 },
    membershipTypes: [
      { id: 'mt-sport-1', name: 'Athlete Club Pass', price: 299, durationMonths: 12, ticketDiscount: 25, merchDiscount: 15, perks: ['Gym access priority', 'Free tournament trials', 'Discount on Team Jersey'] }
    ],
    members: [
      { id: 'SC-001', name: 'Vikram Singh', email: 'vikram.s@charusat.edu.in', studentId: '21ME110', dept: 'Mechanical Engineering', type: 'Athlete Club Pass', exp: '2027-05-01', startDate: '2026-05-01', paid: 1, status: 'Active', photo: '🏃‍♂️', phone: '+91 98111 22334', attendanceCount: 11, history: [{ date: '2026-05-01', action: 'Joined Athlete Pass', amt: 299 }] },
      { id: 'SC-002', name: 'Anaya Gupta', email: 'anaya.g@charusat.edu.in', studentId: '22BT014', dept: 'Biotechnology', type: 'Athlete Club Pass', exp: '2026-07-01', startDate: '2025-07-01', paid: 0, status: 'Expired', photo: '⚽', phone: '+91 98111 22335', attendanceCount: 3, history: [{ date: '2025-07-01', action: 'Registered', amt: 0 }] },
      { id: 'SC-003', name: 'Dev Patel', email: 'dev.patel@charusat.edu.in', studentId: '23IT077', dept: 'Information Technology', type: 'Athlete Club Pass', exp: '2027-01-01', startDate: '2026-01-01', paid: 1, status: 'Active', photo: '🏏', phone: '+91 98111 22336', attendanceCount: 8, history: [{ date: '2026-01-01', action: 'Joined Athlete Pass', amt: 299 }] }
    ],
    events: [
      {
        id: 'ev-sport-1',
        title: 'Inter-Department Cricket Premier League',
        category: 'Tournament',
        date: '2026-10-25',
        time: '08:00 AM',
        location: 'Main University Turf Stadium',
        capacity: 200,
        sold: 165,
        memberPrice: 50,
        nonMemberPrice: 100,
        status: 'Published',
        description: 'T20 Knockout tournament with 12 department teams battling for the Chancellor Trophy and cash awards.',
        deadline: '2026-10-23 18:00',
        organizer: 'Sports Advisory Committee',
        bannerGradient: 'linear-gradient(135deg, #70E4A8 0%, #74B9FF 100%)',
        budget: { venue: 24000, food: 8000, equipment: 12000, prizes: 15000, marketing: 4000 },
        tags: ['Cricket', 'T20', 'Trophy']
      },
      {
        id: 'ev-sport-2',
        title: 'Midnight 5v5 Futsal Championship',
        category: 'Tournament',
        date: '2026-11-14',
        time: '09:00 PM',
        location: 'Floodlit Astro-Turf Ground',
        capacity: 48,
        sold: 48,
        memberPrice: 80,
        nonMemberPrice: 160,
        status: 'Published',
        description: 'High-octane night tournament under LED floodlights with 16 premier squad registrations.',
        deadline: '2026-11-12 23:59',
        organizer: 'Football Club Captains',
        bannerGradient: 'linear-gradient(135deg, #FFD24C 0%, #70E4A8 100%)',
        budget: { venue: 12000, food: 5000, equipment: 6000, prizes: 10000, marketing: 2000 },
        tags: ['Futsal', 'Night Tournament', 'Sold Out']
      }
    ],
    tickets: [
      { id: 'TKT-SC-101', eventId: 'ev-sport-1', eventTitle: 'Inter-Department Cricket Premier League', memberId: 'SC-001', attendeeName: 'Vikram Singh', email: 'vikram.s@charusat.edu.in', isMember: true, pricePaid: 50, status: 'Valid', checkInTime: null, seat: 'Pavilion Stand A', purchaseDate: '2026-10-01' }
    ],
    merchandise: [
      { id: 'merch-sport-1', name: 'Athletic Dry-Fit Club Jersey', category: 'T-Shirt', image: '🎽', memberPrice: 699, nonMemberPrice: 849, description: 'Moisture-wicking breathable sports jersey with custom back number.', stock: { S: 5, M: 12, L: 10, XL: 4 }, totalSold: 42 },
      { id: 'merch-sport-2', name: 'Performance Sports Cap', category: 'Cap', image: '🧢', memberPrice: 249, nonMemberPrice: 299, description: 'Sweat-resistant UV-blocking curved brim sports cap.', stock: { S: 0, M: 30, L: 0, XL: 0 }, totalSold: 30 }
    ],
    orders: [],
    fundraisers: [],
    tasks: [
      { id: 'tsk-s1', title: 'Turf pitch rolling and line marking', owner: 'Dev Patel', deadline: '2026-10-24', priority: 'High', status: 'Pending', progress: 30, notes: 'White chalk and boundary ropes stored in shed.' }
    ],
    volunteers: [
      { id: 'vol-s1', name: 'Dev Patel', email: 'dev.patel@charusat.edu.in', phone: '+91 98111 22336', skills: ['Match Refereeing', 'Equipment Logistics'], hours: 42, badge: 'Bronze Contributor', rating: 4.7, activeTasks: 1, tasksCompleted: 9 }
    ],
    reimbursements: [
      { id: 'REIMB-SC-101', volunteerName: 'Rohan Shah', volunteerEmail: 'rohan.s@charusat.edu.in', category: 'Hydration & Ice', event: 'Cricket League Trials', amount: 900, date: '2026-09-29', description: 'Electrolyte packets and ice bags for injured players', receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400', status: 'Reimbursed', approver: 'Treasurer Sports', notes: 'Reimbursed via UPI' }
    ],
    finance: {
      totalIncome: 92000,
      totalExpenses: 44000,
      netBalance: 48000,
      incomeSources: [
        { source: 'Membership Dues', amount: 26000, count: 32 },
        { source: 'Event Tickets', amount: 21000, count: 80 },
        { source: 'Merchandise Sales', amount: 33000, count: 45 },
        { source: 'Fundraising & Donations', amount: 12000, count: 5 }
      ],
      expensesList: [
        { id: 'EXP-SC-1', title: 'Main Stadium Floodlights & Turf Booking', category: 'Venue', amount: 24000, date: '2026-09-20', approvedBy: 'Admin Sports', receipt: 'INV-TRF-01' },
        { id: 'EXP-SC-2', title: 'BCCI Certified Match Referees & Umpires', category: 'Volunteer', amount: 9000, date: '2026-09-25', approvedBy: 'Treasurer Sports', receipt: 'INV-REF-04' },
        { id: 'EXP-SC-3', title: 'Engraved Silver Trophies & Medals', category: 'Operational', amount: 11000, date: '2026-09-28', approvedBy: 'Treasurer Sports', receipt: 'INV-TRP-90' }
      ],
      budgetAllocated: 70000,
      budgetSpent: 44000
    },
    sponsors: [],
    donations: [],
    certificates: [],
    feedback: [],
    announcements: [],
    renewalReminders: []
  }
};

export const INITIAL_PLATFORM_DATA = {
  organizations: [
    { id: 'tech', name: 'CHARUSAT Tech Club', university: 'CHARUSAT University', college: 'CSPIT', dept: 'IT & CS', plan: 'Enterprise', status: 'Active', members: 142, admins: ['admin@tech.demo'] },
    { id: 'cult', name: 'CHARUSAT Cultural Club', university: 'CHARUSAT University', college: 'DEPSTAR', dept: 'Student Affairs', plan: 'Professional', status: 'Active', members: 118, admins: ['admin@cultural.demo'] },
    { id: 'sport', name: 'CHARUSAT Sports Club', university: 'CHARUSAT University', college: 'Sports Council', dept: 'Athletics', plan: 'Professional', status: 'Active', members: 96, admins: ['admin@sports.demo'] },
    { id: 'robotics', name: 'Robotics & Automation Society', university: 'CHARUSAT University', college: 'CSPIT', dept: 'Mechatronics', plan: 'Free', status: 'Trial', members: 34, admins: ['admin@robotics.demo'] },
    { id: 'ieee', name: 'IEEE Student Branch CHARUSAT', university: 'CHARUSAT University', college: 'CSPIT', dept: 'EC & EE', plan: 'Enterprise', status: 'Active', members: 210, admins: ['chair@ieee.demo'] }
  ],
  plans: [
    { id: 'plan-free', name: 'Community Free', price: 0, memberLimit: 50, eventLimit: 2, commissionPercent: 5, features: ['Basic Member Roster', '1 Event per month', 'Manual Tickets', 'Standard Support'], activeOrgs: 8 },
    { id: 'plan-pro', name: 'Professional Club', price: 1999, billing: '/month', memberLimit: 500, eventLimit: 10, commissionPercent: 2, features: ['Unlimited Members', 'QR Fast Check-in', 'Merchandise Shop', 'Kanban Task Board', 'Certificates & QR', 'Priority Email Support'], activeOrgs: 14 },
    { id: 'plan-ent', name: 'Enterprise SaaS', price: 4999, billing: '/month', memberLimit: 5000, eventLimit: 50, commissionPercent: 0.5, features: ['All Pro Features', 'Multi-College Hierarchy', 'AI Copilot & Event Planner', 'Financial Audit Ledger', 'Dedicated Tenant DB', 'Custom Domain & SSO'], activeOrgs: 4 }
  ],
  modules: [
    { id: 'mod-qr', name: 'Fast QR Check-in & Hardware Sync', category: 'Ticketing', enabled: true, tier: 'Professional' },
    { id: 'mod-merch', name: 'Variant Merchandise & Inventory POS', category: 'Commerce', enabled: true, tier: 'Professional' },
    { id: 'mod-ai', name: 'AI Financial Assistant & Event Planner', category: 'Intelligence', enabled: true, tier: 'Enterprise' },
    { id: 'mod-gamify', name: 'Volunteer Gamification & Badges', category: 'Engagement', enabled: true, tier: 'Professional' },
    { id: 'mod-sponsors', name: 'Sponsorship & Contract Management', category: 'Finance', enabled: true, tier: 'Enterprise' },
    { id: 'mod-audit', name: 'Immutable Financial Audit Trail', category: 'Compliance', enabled: true, tier: 'Enterprise' }
  ],
  analytics: {
    totalTenants: 28,
    activeStudents: 3420,
    grossPlatformTicketRevenue: 1420000,
    systemUptime: '99.98%',
    avgResponseTime: '180ms',
    serverLoad: '22%'
  }
};

export const INITIAL_AUDIT_LOGS = [
  { id: 'aud-001', orgId: 'tech', user: 'admin@tech.demo', role: 'Admin', action: 'Published Event', details: 'Created event "CHARUSAT 24h Hackathon 2026" with 120 seats capacity.', oldValue: 'Draft', newValue: 'Published', timestamp: '2026-10-01 09:15 AM' },
  { id: 'aud-002', orgId: 'tech', user: 'treasurer@tech.demo', role: 'Treasurer', action: 'Approved Reimbursement', details: 'Approved ₹1,800 to Jay Barot for banner printing.', oldValue: 'Submitted', newValue: 'Treasurer Approved', timestamp: '2026-10-01 10:42 AM' },
  { id: 'aud-003', orgId: 'tech', user: 'admin@tech.demo', role: 'Admin', action: 'Updated Event Budget', details: 'Increased Hackathon prizes allocation.', oldValue: '₹40,000', newValue: '₹50,000', timestamp: '2026-10-02 02:20 PM' },
  { id: 'aud-004', orgId: 'cult', user: 'admin@cultural.demo', role: 'Admin', action: 'Added Merch Item', details: 'Created "Festive Kurta Tee" with 37 total stock.', oldValue: 'None', newValue: 'Active SKU', timestamp: '2026-09-28 11:30 AM' },
  { id: 'aud-005', orgId: 'platform', user: 'root@clubsphere.demo', role: 'Super Admin', action: 'Updated Enterprise Tier Limits', details: 'Expanded storage quota for university tenants.', oldValue: '100GB', newValue: '500GB', timestamp: '2026-09-30 04:00 PM' }
];

// In-memory Database Instance
class MockDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage error, using seed', e);
    }
    return {
      clubs: JSON.parse(JSON.stringify(INITIAL_CLUBS_DATA)),
      platform: JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
      auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
      notifications: [
        { id: 'notif-1', title: '🎟️ New Ticket Sold', message: 'Diya Patel bought a ticket for 24h Hackathon.', time: '10m ago', unread: true, role: 'event_manager' },
        { id: 'notif-2', title: '💰 Reimbursement Requested', message: 'Param Joshi requested ₹950 for cables.', time: '1h ago', unread: true, role: 'treasurer' },
        { id: 'notif-3', title: '📢 Announcement Broadcast', message: 'Garba pass notice delivered to 300 members.', time: '3h ago', unread: false, role: 'student' }
      ]
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  reset() {
    this.data = {
      clubs: JSON.parse(JSON.stringify(INITIAL_CLUBS_DATA)),
      platform: JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
      auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
      notifications: []
    };
    this.save();
  }

  getClub(orgId) {
    if (!orgId || !this.data.clubs[orgId]) {
      throw new Error(`Club "${orgId}" not found or unauthorized (Tenant Isolation Rule).`);
    }
    return this.data.clubs[orgId];
  }

  logAudit(orgId, user, role, action, details, oldValue = '', newValue = '') {
    const entry = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      orgId,
      user: user || 'Anonymous',
      role: role || 'User',
      action,
      details,
      oldValue: String(oldValue),
      newValue: String(newValue),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today'
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 80) this.data.auditLogs.pop();
    this.save();
    return entry;
  }
}

export const dbInstance = new MockDatabase();
