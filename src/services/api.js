import { createClient } from '@supabase/supabase-js';

const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE || 'local_api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/QuanLyQuy/api';
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const cleanSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_URL = cleanSupabaseUrl;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let supabase = null;
if (STORAGE_MODE === 'supabase' && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Fallback Mock Local Data (chạy khi không kết nối được backend)
const DEFAULT_SETTINGS = {
  admin_pin: '888888',
  group_password: '123456',
  bank_id: 'MBBank',
  bank_account_no: '',
  bank_account_name: 'THU QUY',
  weekly_amount: '10000',
  monthly_amount: '40000',
  qr_template: 'compact2',
  custom_qr_url: '',
};

const DEFAULT_MEMBERS = [
  { id: 1, name: 'Thành viên 1', phone: '', bank_id: 'MBBank', bank_account_no: '', bank_account_name: '' },
  { id: 2, name: 'Thành viên 2', phone: '', bank_id: 'Vietcombank', bank_account_no: '', bank_account_name: '' },
  { id: 3, name: 'Thành viên 3', phone: '', bank_id: 'Techcombank', bank_account_no: '', bank_account_name: '' },
  { id: 4, name: 'Thành viên 4', phone: '', bank_id: 'ACB', bank_account_no: '', bank_account_name: '' },
  { id: 5, name: 'Thành viên 5', phone: '', bank_id: 'BIDV', bank_account_no: '', bank_account_name: '' },
  { id: 6, name: 'Thành viên 6', phone: '', bank_id: 'TPBank', bank_account_no: '', bank_account_name: '' },
  { id: 7, name: 'Thành viên 7', phone: '', bank_id: 'VPBank', bank_account_no: '', bank_account_name: '' },
  { id: 8, name: 'Thành viên 8', phone: '', bank_id: 'VietinBank', bank_account_no: '', bank_account_name: '' },
  { id: 9, name: 'Thành viên 9', phone: '', bank_id: 'MBBank', bank_account_no: '', bank_account_name: '' },
  { id: 10, name: 'Thành viên 10', phone: '', bank_id: 'Sacombank', bank_account_no: '', bank_account_name: '' },
];

export const dataService = {
  getStorageMode: () => STORAGE_MODE,

  // ===================== ACCESS GATE & AUTH =====================
  verifyAccess: async (password) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/verify-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        return {
          verified: data.verified === true,
          isAdmin: data.role === 'admin',
          message: data.message || '',
        };
      } catch (e) {
        console.warn('API không phản hồi, kiểm tra access local fallback', e);
        const storedAdminPin = localStorage.getItem('local_admin_pin') || '888888';
        const storedGroupPwd = localStorage.getItem('local_group_password') || '123456';
        if (password === storedAdminPin) {
          return { verified: true, isAdmin: true };
        }
        if (password === storedGroupPwd) {
          return { verified: true, isAdmin: false };
        }
        return { verified: false, isAdmin: false, message: 'Mật khẩu không đúng' };
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      const { data } = await supabase.from('settings').select('key, value');
      const map = {};
      data?.forEach((r) => { map[r.key] = r.value; });
      const adminPin = map.admin_pin || '888888';
      const groupPwd = map.group_password || '123456';
      if (password === adminPin) return { verified: true, isAdmin: true };
      if (password === groupPwd) return { verified: true, isAdmin: false };
      return { verified: false, isAdmin: false, message: 'Mật khẩu không đúng' };
    } else {
      const storedAdminPin = localStorage.getItem('local_admin_pin') || '888888';
      const storedGroupPwd = localStorage.getItem('local_group_password') || '123456';
      if (password === storedAdminPin) return { verified: true, isAdmin: true };
      if (password === storedGroupPwd) return { verified: true, isAdmin: false };
      return { verified: false, isAdmin: false, message: 'Mật khẩu không đúng' };
    }
  },

  verifyPin: async (pin) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/verify-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        });
        const data = await res.json();
        return data.verified === true;
      } catch (e) {
        console.warn('API không phản hồi, kiểm tra mã PIN local fallback', e);
        const stored = localStorage.getItem('local_admin_pin') || '888888';
        return pin === stored;
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      const { data } = await supabase.from('settings').select('value').eq('key', 'admin_pin').single();
      return (data?.value || '888888') === pin;
    } else {
      const stored = localStorage.getItem('local_admin_pin') || '888888';
      return pin === stored;
    }
  },

  // ===================== SETTINGS =====================
  getSettings: async () => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          return { ...DEFAULT_SETTINGS, ...json.data };
        }
      } catch (e) {
        console.warn('Fallback settings to localStorage', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const map = {};
        data.forEach((r) => {
          if (r.key !== 'admin_pin') map[r.key] = r.value;
        });
        return { ...DEFAULT_SETTINGS, ...map };
      }
    }
    const local = localStorage.getItem('app_settings');
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  },

  updateSettings: async (settings) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
      } catch (e) {
        console.warn('Lưu settings local fallback', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from('settings').upsert({ key, value });
      }
    }
    if (settings.admin_pin) {
      localStorage.setItem('local_admin_pin', settings.admin_pin);
    }
    localStorage.setItem('app_settings', JSON.stringify(settings));
    return true;
  },

  // ===================== DASHBOARD SUMMARY =====================
  getDashboardSummary: async (month, year) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard?month=${month}&year=${year}`);
        const json = await res.json();
        if (json.status === 'success') {
          return json.data;
        }
      } catch (e) {
        console.warn('Fallback dashboard to local calculations', e);
      }
    }

    // Local Calculation Fallback
    const txs = await dataService.getTransactions();
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    txs.forEach((t) => {
      const amt = Number(t.amount);
      const d = new Date(t.transaction_date);
      const isThisMonth = d.getMonth() + 1 === month && d.getFullYear() === year;

      if (t.type === 'income') {
        totalIncome += amt;
        if (isThisMonth) monthIncome += amt;
      } else {
        totalExpense += amt;
        if (isThisMonth) monthExpense += amt;
      }
    });

    // 6 months chart
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(year, month - 1 - i, 1);
      const m = targetDate.getMonth() + 1;
      const y = targetDate.getFullYear();

      let inc = 0;
      let exp = 0;
      txs.forEach((t) => {
        const td = new Date(t.transaction_date);
        if (td.getMonth() + 1 === m && td.getFullYear() === y) {
          if (t.type === 'income') inc += Number(t.amount);
          else exp += Number(t.amount);
        }
      });

      chartData.push({
        name: `Tháng ${m}`,
        month: m,
        year: y,
        income: inc,
        expense: exp,
      });
    }

    return {
      total_balance: totalIncome - totalExpense,
      month_income: monthIncome,
      month_expense: monthExpense,
      prev_month_income: 0,
      prev_month_expense: 0,
      chart_data: chartData,
    };
  },

  // ===================== MEMBERS & CONTRIBUTIONS =====================
  getMembers: async () => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/members`);
        const json = await res.json();
        if (json.status === 'success' && json.data) return json.data;
      } catch (e) {
        console.warn('Fallback getMembers', e);
      }
    }
    const local = localStorage.getItem('app_members');
    return local ? JSON.parse(local) : DEFAULT_MEMBERS;
  },

  getContributions: async (month, year) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/contributions?month=${month}&year=${year}`);
        const json = await res.json();
        if (json.status === 'success' && json.data) return json.data;
      } catch (e) {
        console.warn('Fallback getContributions', e);
      }
    }

    // Local Storage Fallback
    const members = await dataService.getMembers();
    const storageKey = `contributions_${year}_${month}`;
    const local = localStorage.getItem(storageKey);
    if (local) return JSON.parse(local);

    const initial = members.map((m, idx) => ({
      id: idx + 1,
      member_id: m.id,
      member_name: m.name,
      member_phone: m.phone,
      month,
      year,
      amount: 100000,
      is_paid: idx % 2 === 0 ? 1 : 0,
      paid_at: idx % 2 === 0 ? new Date().toISOString() : null,
    }));
    localStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
  },

  updateMember: async (id, memberData) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/members?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData),
        });
        return true;
      } catch (e) {
        console.warn('Fallback updateMember', e);
      }
    }
    const members = await dataService.getMembers();
    const updated = members.map((m) => (m.id === id ? { ...m, ...memberData } : m));
    localStorage.setItem('app_members', JSON.stringify(updated));
    return true;
  },

  submitPayment: async ({ member_id, month, year, amount, note }) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/contributions/submit-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id, month, year, amount, note }),
        });
        const json = await res.json();
        return json.status === 'success';
      } catch (e) {
        console.warn('Fallback submitPayment', e);
      }
    }

    // Local fallback
    const members = await dataService.getMembers();
    const mem = members.find((m) => m.id === member_id);
    const memberName = mem ? mem.name : 'Thành viên';
    const fullNote = note ? note : `Thành viên ${memberName} nộp quỹ T${month}/${year}`;

    // 1. Update contribution
    const storageKey = `contributions_${year}_${month}`;
    const list = await dataService.getContributions(month, year);
    const updated = list.map((item) =>
      item.member_id === member_id
        ? { ...item, is_paid: 1, paid_at: new Date().toISOString(), note: fullNote }
        : item
    );
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // 2. Add transaction
    await dataService.createTransaction({
      type: 'income',
      amount: Number(amount),
      category: 'Thu quỹ định kỳ',
      member_name: memberName,
      description: fullNote,
      transaction_date: new Date().toISOString().slice(0, 10),
    });

    return true;
  },

  toggleWeekContribution: async (id, isPaid, note = null) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/contributions/toggle-week`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_paid: isPaid ? 1 : 0, note }),
        });
        return true;
      } catch (e) {
        console.warn('Fallback toggleWeekContribution', e);
      }
    }
    return true;
  },

  toggleMonthContribution: async (memberId, month, year, isPaid, note = null) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/contributions/toggle-month`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: memberId, month, year, is_paid: isPaid ? 1 : 0, note }),
        });
        return true;
      } catch (e) {
        console.warn('Fallback toggleMonthContribution', e);
      }
    }
    return true;
  },

  toggleContribution: async (id, isPaid, month, year, note = null) => {
    return dataService.toggleWeekContribution(id, isPaid, note);
  },

  // ===================== TRANSACTIONS =====================
  getTransactions: async (filter = {}) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const params = new URLSearchParams();
        if (filter.month) params.append('month', filter.month);
        if (filter.year) params.append('year', filter.year);
        if (filter.type && filter.type !== 'all') params.append('type', filter.type);
        if (filter.category && filter.category !== 'all') params.append('category', filter.category);
        if (filter.search) params.append('search', filter.search);

        const res = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`);
        const json = await res.json();
        if (json.status === 'success' && json.data) return json.data;
      } catch (e) {
        console.warn('Fallback getTransactions', e);
      }
    }

    // Local Storage Fallback
    const local = localStorage.getItem('app_transactions');
    let list = local ? JSON.parse(local) : [
      {
        id: 1,
        type: 'income',
        amount: 1000000,
        category: 'Thu quỹ định kỳ',
        member_name: 'Thủ quỹ',
        description: 'Thu tiền quỹ tháng 9 cho 10 thành viên',
        transaction_date: '2026-09-01',
        receipt_url: '',
      },
      {
        id: 2,
        type: 'income',
        amount: 500000,
        category: 'Tài trợ',
        member_name: 'Lê Hoàng Cường',
        description: 'Tài trợ thêm nước ngọt cho buổi liên hoan',
        transaction_date: '2026-09-02',
        receipt_url: '',
      },
      {
        id: 3,
        type: 'expense',
        amount: 450000,
        category: 'Ăn uống',
        member_name: 'Nguyễn Văn An',
        description: 'Mua đồ ăn nhẹ và bánh ngọt',
        transaction_date: '2026-09-03',
        receipt_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60',
      },
      {
        id: 4,
        type: 'expense',
        amount: 300000,
        category: 'Thuê sân/địa điểm',
        member_name: 'Đặng Quốc Phong',
        description: 'Đặt sân đá bóng tuần 1',
        transaction_date: '2026-09-04',
        receipt_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60',
      },
    ];

    if (!local) localStorage.setItem('app_transactions', JSON.stringify(list));

    // Filter local list
    return list.filter((t) => {
      const d = new Date(t.transaction_date);
      if (filter.month && d.getMonth() + 1 !== Number(filter.month)) return false;
      if (filter.year && d.getFullYear() !== Number(filter.year)) return false;
      if (filter.type && filter.type !== 'all' && t.type !== filter.type) return false;
      if (filter.category && filter.category !== 'all' && t.category !== filter.category) return false;
      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matchDesc = (t.description || '').toLowerCase().includes(s);
        const matchMember = (t.member_name || '').toLowerCase().includes(s);
        const matchCat = (t.category || '').toLowerCase().includes(s);
        if (!matchDesc && !matchMember && !matchCat) return false;
      }
      return true;
    });
  },

  createTransaction: async (tx) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx),
        });
        const json = await res.json();
        return json.id;
      } catch (e) {
        console.warn('Fallback createTransaction', e);
      }
    }

    const txs = await dataService.getTransactions();
    const newTx = { ...tx, id: Date.now(), created_at: new Date().toISOString() };
    txs.unshift(newTx);
    localStorage.setItem('app_transactions', JSON.stringify(txs));
    return newTx.id;
  },

  updateTransaction: async (id, tx) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/transactions?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tx),
        });
        return true;
      } catch (e) {
        console.warn('Fallback updateTransaction', e);
      }
    }

    const txs = await dataService.getTransactions();
    const updated = txs.map((t) => (t.id === id ? { ...t, ...tx } : t));
    localStorage.setItem('app_transactions', JSON.stringify(updated));
    return true;
  },

  deleteTransaction: async (id) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/transactions?id=${id}`, {
          method: 'DELETE',
        });
        return true;
      } catch (e) {
        console.warn('Fallback deleteTransaction', e);
      }
    }

    const txs = await dataService.getTransactions();
    const updated = txs.filter((t) => t.id !== id);
    localStorage.setItem('app_transactions', JSON.stringify(updated));
    return true;
  },
};
