export const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
export const expired = m => new Date(m.exp) < new Date();
export const initialDb = {};
