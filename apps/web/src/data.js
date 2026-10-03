export const inr=n=>'₹'+n.toLocaleString('en-IN')
export const expired=m=>new Date(m.exp)<new Date()
const M=(id,name,exp,paid)=>({id,name,exp,paid})
export const initialDb={
tech:{name:'CHARUSAT Tech Club',short:'Tech',color:'#4CC9F0',prefix:'TC',
 members:[M('TC-001','Aarav Shah','2027-03-01',1),M('TC-002','Diya Patel','2026-12-15',1),M('TC-003','Rahul Mehta','2026-09-01',0),M('TC-004','Priya Desai','2027-01-20',1)],
 events:[{t:'24h Hackathon',d:'18 Oct',cap:120,sold:118,pm:200,pn:350},{t:'AI Workshop',d:'2 Nov',cap:60,sold:41,pm:100,pn:200}],
 merch:[{n:'Club Hoodie',pm:899,pn:1099,st:{S:10,M:20,L:15}},{n:'T-Shirt',pm:399,pn:499,st:{M:25,L:12}}],
 income:{Membership:62000,Tickets:84000,Merch:41000,Fundraiser:28000},expenses:[['Venue',30000],['Food',22000],['Equipment',18000]],
 reimb:[{who:'Jay',what:'Banner printing',amt:1800,s:1}],
 tasks:[['Book venue','Rahul',2],['Print banners','Jay',1],['Run registration desk','Param',0],['Handle payments','Priya',0]],ann:[],tickets:[]},
cult:{name:'CHARUSAT Cultural Club',short:'Cultural',color:'#FF5FA2',prefix:'CC',
 members:[M('CC-001','Meera Joshi','2027-02-10',1),M('CC-002','Kabir Rao','2026-08-01',1),M('CC-003','Isha Nair','2027-04-04',1)],
 events:[{t:'Garba Night',d:'22 Oct',cap:400,sold:310,pm:150,pn:300},{t:'Open Mic',d:'9 Nov',cap:80,sold:20,pm:0,pn:100}],
 merch:[{n:'Kurta Tee',pm:549,pn:699,st:{S:8,M:14,L:9}},{n:'Tote Bag',pm:199,pn:249,st:{M:40}}],
 income:{Membership:38000,Tickets:112000,Merch:19000,Fundraiser:9000},expenses:[['Stage',45000],['Sound',26000],['Decor',15000]],
 reimb:[{who:'Nisha',what:'Decor supplies',amt:3200,s:0}],
 tasks:[['Stage setup','Kabir',1],['Costume desk','Meera',0],['Photo booth','Isha',0]],ann:[],tickets:[]},
sport:{name:'CHARUSAT Sports Club',short:'Sports',color:'#B6FF3B',prefix:'SC',
 members:[M('SC-001','Vikram Singh','2027-05-01',1),M('SC-002','Anaya Gupta','2026-07-01',0),M('SC-003','Dev Patel','2027-01-01',1),M('SC-004','Zoya Khan','2027-06-15',1)],
 events:[{t:'Inter-Dept Cricket',d:'25 Oct',cap:200,sold:150,pm:50,pn:100},{t:'Futsal Cup',d:'14 Nov',cap:48,sold:48,pm:80,pn:160}],
 merch:[{n:'Team Jersey',pm:699,pn:849,st:{M:6,L:11,XL:4}},{n:'Sports Cap',pm:249,pn:299,st:{M:30}}],
 income:{Membership:26000,Tickets:21000,Merch:33000,Fundraiser:12000},expenses:[['Turf',24000],['Referees',9000],['Trophies',11000]],
 reimb:[{who:'Rohan',what:'Water & ice',amt:900,s:2}],
 tasks:[['Mark the pitch','Dev',2],['Scorekeeping','Zoya',0]],ann:[],tickets:[]}}
// Tenant guard: a session can only read its own club. Replace with real API auth later.
export function getClub(db,session,id){if(id!==session)throw new Error('403 Forbidden');return db[id]}
