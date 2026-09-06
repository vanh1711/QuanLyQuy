import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://bhcosxwmbogjjkcdlbdp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoY29zeHdtYm9namprY2RsYmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDI5NzAsImV4cCI6MjEwNDI3ODk3MH0.Jp7PrlB2NzX_mqPBjsZVrX_prytP5w1hxseG4cPYxr0';

const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const cleanSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_URL = cleanSupabaseUrl;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

// Tự động kích hoạt chế độ 'supabase' khi có thông tin kết nối Supabase
const STORAGE_MODE = import.meta.env.VITE_STORAGE_MODE || (SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : 'local_api');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/QuanLyQuy/api';

let supabase = null;
if (STORAGE_MODE === 'supabase' && SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('⚡ Supabase Cloud Connected:', SUPABASE_URL);
}

// Fallback Mock Local Data
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
        console.warn('API không phản hồi, fallback verifyAccess', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        const { data } = await supabase.from('settings').select('key, value');
        const map = {};
        data?.forEach((r) => { map[r.key] = r.value; });
        const adminPin = map.admin_pin || '888888';
        const groupPwd = map.group_password || '123456';
        if (password === adminPin) return { verified: true, isAdmin: true };
        if (password === groupPwd) return { verified: true, isAdmin: false };
        return { verified: false, isAdmin: false, message: 'Mật khẩu truy cập không đúng. Vui lòng hỏi Thủ Quỹ!' };
      } catch (e) {
        console.warn('Lỗi kiểm tra Supabase verifyAccess', e);
      }
    }

    const storedAdminPin = localStorage.getItem('local_admin_pin') || '888888';
    const storedGroupPwd = localStorage.getItem('local_group_password') || '123456';
    if (password === storedAdminPin) return { verified: true, isAdmin: true };
    if (password === storedGroupPwd) return { verified: true, isAdmin: false };
    return { verified: false, isAdmin: false, message: 'Mật khẩu không đúng' };
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
        console.warn('API không phản hồi, fallback verifyPin', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'admin_pin').single();
        return (data?.value || '888888') === pin;
      } catch (e) {
        console.warn('Lỗi kiểm tra Supabase verifyPin', e);
      }
    }

    const stored = localStorage.getItem('local_admin_pin') || '888888';
    return pin === stored;
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
        console.warn('Fallback getSettings', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        const { data } = await supabase.from('settings').select('*');
        if (data && data.length > 0) {
          const map = {};
          data.forEach((r) => {
            if (r.key !== 'admin_pin') map[r.key] = r.value;
          });
          return { ...DEFAULT_SETTINGS, ...map };
        }
      } catch (e) {
        console.warn('Lỗi Supabase getSettings', e);
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
        console.warn('Lỗi lưu settings local_api', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        for (const [key, value] of Object.entries(settings)) {
          await supabase.from('settings').upsert({ key, value });
        }
      } catch (e) {
        console.warn('Lỗi lưu settings Supabase', e);
      }
    }

    if (settings.admin_pin) {
      localStorage.setItem('local_admin_pin', settings.admin_pin);
    }
    if (settings.group_password) {
      localStorage.setItem('local_group_password', settings.group_password);
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
        console.warn('Fallback dashboard summary', e);
      }
    }

    const txs = await dataService.getTransactions({});
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    txs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const d = new Date(t.transaction_date);
      const isThisMonth = d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);

      if (t.type === 'income') {
        totalIncome += amt;
        if (isThisMonth) monthIncome += amt;
      } else {
        totalExpense += amt;
        if (isThisMonth) monthExpense += amt;
      }
    });

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

  // ===================== MEMBERS =====================
  getMembers: async () => {
    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/members`);
        const json = await res.json();
        if (json.status === 'success' && json.data && json.data.length > 0) return json.data;
      } catch (e) {
        console.warn('Fallback getMembers local_api', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('id', { ascending: true });
        
        if (!error && data && data.length > 0) {
          localStorage.setItem('app_members', JSON.stringify(data));
          return data;
        }

        // Nếu bảng members trống, tự động nạp 10 thành viên mẫu
        if (!error && data && data.length === 0) {
          await supabase.from('members').insert(DEFAULT_MEMBERS);
          localStorage.setItem('app_members', JSON.stringify(DEFAULT_MEMBERS));
          return DEFAULT_MEMBERS;
        }
      } catch (e) {
        console.warn('Lỗi Supabase getMembers', e);
      }
    }

    const local = localStorage.getItem('app_members');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_MEMBERS;
  },

  updateMember: async (id, memberData) => {
    const memberIdNum = Number(id) || id;
    const payload = {
      name: memberData.name,
      phone: memberData.phone || '',
      bank_id: memberData.bank_id || 'MBBank',
      bank_account_no: memberData.bank_account_no || '',
      bank_account_name: memberData.bank_account_name || '',
      avatar_url: memberData.qr_url || memberData.avatar_url || '',
    };

    // 1. Cập nhật bộ nhớ đệm Local Storage ngay lập tức để UI phản hồi tức thì
    try {
      const localStr = localStorage.getItem('app_members');
      const currentList = localStr ? JSON.parse(localStr) : DEFAULT_MEMBERS;
      const updated = currentList.map((m) =>
        String(m.id) === String(id)
          ? {
              ...m,
              ...memberData,
              ...payload,
              qr_url: memberData.qr_url || memberData.avatar_url || m.qr_url || m.avatar_url || '',
            }
          : m
      );
      localStorage.setItem('app_members', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error in updateMember', e);
    }

    // 2. Gửi lệnh cập nhật lên Backend / Supabase
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/members?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...memberData, ...payload }),
        });
      } catch (e) {
        console.warn('Fallback updateMember local_api', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .update(payload)
          .eq('id', memberIdNum)
          .select();

        if (error) {
          console.error('Lỗi Supabase updateMember (Kiểm tra RLS permissions):', error);
        } else {
          console.log('Đã cập nhật Supabase thành công:', data);
        }
      } catch (e) {
        console.error('Ngoại lệ Supabase updateMember', e);
      }
    }

    return true;
  },

  createMember: async (memberData) => {
    const payload = {
      name: memberData.name,
      phone: memberData.phone || '',
      bank_id: memberData.bank_id || 'MBBank',
      bank_account_no: memberData.bank_account_no || '',
      bank_account_name: memberData.bank_account_name || '',
      avatar_url: memberData.qr_url || memberData.avatar_url || '',
    };

    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        return json.id;
      } catch (e) {
        console.warn('Fallback createMember', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        const { data, error } = await supabase.from('members').insert(payload).select().single();
        if (!error && data?.id) return data.id;
      } catch (e) {
        console.warn('Lỗi Supabase createMember', e);
      }
    }

    try {
      const localStr = localStorage.getItem('app_members');
      const members = localStr ? JSON.parse(localStr) : [...DEFAULT_MEMBERS];
      const newMember = { ...payload, id: Date.now() };
      members.push(newMember);
      localStorage.setItem('app_members', JSON.stringify(members));
      return newMember.id;
    } catch (e) {
      return Date.now();
    }
  },

  deleteMember: async (id) => {
    const memberIdNum = Number(id) || id;
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/members?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Fallback deleteMember', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        await supabase.from('members').delete().eq('id', memberIdNum);
      } catch (e) {
        console.warn('Lỗi Supabase deleteMember', e);
      }
    }

    try {
      const localStr = localStorage.getItem('app_members');
      const members = localStr ? JSON.parse(localStr) : DEFAULT_MEMBERS;
      const updated = members.filter((m) => String(m.id) !== String(id));
      localStorage.setItem('app_members', JSON.stringify(updated));
    } catch (e) {}
    return true;
  },

  // ===================== CONTRIBUTIONS =====================
  getContributions: async (month, year) => {
    const settings = await dataService.getSettings();
    const weeklyAmount = Number(settings.weekly_amount) || 10000;
    let members = await dataService.getMembers();
    if (!members || members.length === 0) {
      members = DEFAULT_MEMBERS;
    }

    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/contributions?month=${month}&year=${year}`);
        const json = await res.json();
        if (json.status === 'success' && json.data && json.data.length > 0) return json.data;
      } catch (e) {
        console.warn('Fallback getContributions local_api', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        // 1. Đảm bảo 4 tuần tồn tại trong DB Supabase
        const { data: existingWeeks, error: selectErr } = await supabase
          .from('fund_contributions')
          .select('*')
          .eq('month', month)
          .eq('year', year);

        if (!selectErr) {
          const existingMap = new Set((existingWeeks || []).map((w) => `${w.member_id}_${w.week}`));
          const toInsert = [];

          for (const m of members) {
            for (let w = 1; w <= 4; w++) {
              if (!existingMap.has(`${m.id}_${w}`)) {
                toInsert.push({
                  member_id: Number(m.id) || m.id,
                  year,
                  month,
                  week: w,
                  amount: weeklyAmount,
                  is_paid: 0,
                });
              }
            }
          }

          if (toInsert.length > 0) {
            try {
              await supabase
                .from('fund_contributions')
                .upsert(toInsert, { onConflict: 'member_id,year,month,week', ignoreDuplicates: true });
            } catch (insErr) {
              console.warn('Lỗi upsert fund_contributions', insErr);
            }
          }

          // 2. Lấy lại danh sách 4 tuần đã nạp
          const { data: allWeeks } = await supabase
            .from('fund_contributions')
            .select('*')
            .eq('month', month)
            .eq('year', year)
            .order('member_id', { ascending: true })
            .order('week', { ascending: true });

          const grouped = {};
          (allWeeks || []).forEach((w) => {
            const key = String(w.member_id);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(w);
          });

          return members.map((m) => {
            let weeks = grouped[String(m.id)] || [];
            if (weeks.length === 0) {
              weeks = [1, 2, 3, 4].map((w) => ({
                id: `${m.id}_${w}`,
                member_id: m.id,
                week: w,
                amount: weeklyAmount,
                is_paid: 0,
                paid_at: null,
                note: null,
              }));
            }

            let paidCount = 0;
            let totalPaid = 0;
            const notes = [];

            weeks.forEach((w) => {
              if (w.is_paid === 1 || w.is_paid === true) {
                paidCount++;
                totalPaid += Number(w.amount);
              }
              if (w.note) notes.push(w.note);
            });

            return {
              member_id: m.id,
              member_name: m.name,
              member_phone: m.phone || '',
              member_bank_id: m.bank_id || 'MBBank',
              member_bank_account_no: m.bank_account_no || '',
              member_bank_account_name: m.bank_account_name || '',
              member_qr_url: m.qr_url || m.avatar_url || '',
              month,
              year,
              weeks,
              paid_weeks_count: paidCount,
              total_paid: totalPaid,
              is_month_fully_paid: paidCount >= 4,
              note: notes.length > 0 ? Array.from(new Set(notes)).join(', ') : '',
            };
          });
        }
      } catch (e) {
        console.warn('Lỗi Supabase getContributions', e);
      }
    }

    // Local Storage fallback an toàn
    const storageKey = `contributions_${year}_${month}`;
    const local = localStorage.getItem(storageKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    const initial = members.map((m) => {
      const weeks = [1, 2, 3, 4].map((w) => ({
        id: `${m.id}_${w}`,
        member_id: m.id,
        week: w,
        amount: weeklyAmount,
        is_paid: 0,
        paid_at: null,
        note: null,
      }));

      return {
        member_id: m.id,
        member_name: m.name,
        member_phone: m.phone || '',
        member_bank_id: m.bank_id || 'MBBank',
        member_bank_account_no: m.bank_account_no || '',
        member_bank_account_name: m.bank_account_name || '',
        member_qr_url: m.qr_url || m.avatar_url || '',
        month,
        year,
        weeks,
        paid_weeks_count: 0,
        total_paid: 0,
        is_month_fully_paid: false,
        note: '',
      };
    });

    localStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
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
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        await supabase
          .from('fund_contributions')
          .update({
            is_paid: isPaid ? 1 : 0,
            paid_at: isPaid ? new Date().toISOString() : null,
            ...(note ? { note } : {}),
          })
          .eq('id', id);
        return true;
      } catch (e) {
        console.warn('Lỗi Supabase toggleWeekContribution', e);
      }
    }
    return true;
  },

  toggleMonthContribution: async (memberId, month, year, isPaid, note = null) => {
    const fullNote = isPaid ? (note || `Đóng cả tháng ${month}/${year}`) : null;

    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/contributions/toggle-month`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: memberId, month, year, is_paid: isPaid ? 1 : 0, note: fullNote }),
        });
        return true;
      } catch (e) {
        console.warn('Fallback toggleMonthContribution', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        await supabase
          .from('fund_contributions')
          .update({
            is_paid: isPaid ? 1 : 0,
            paid_at: isPaid ? new Date().toISOString() : null,
            note: fullNote,
          })
          .eq('member_id', memberId)
          .eq('month', month)
          .eq('year', year);
        return true;
      } catch (e) {
        console.warn('Lỗi Supabase toggleMonthContribution', e);
      }
    }
    return true;
  },

  submitPayment: async ({ member_id, month, year, amount, note }) => {
    const settings = await dataService.getSettings();
    const weeklyAmount = Number(settings.weekly_amount) || 10000;
    const monthlyAmount = Number(settings.monthly_amount) || weeklyAmount * 4;

    const weeksToPay = amount >= monthlyAmount ? 4 : Math.max(1, Math.min(4, Math.floor(amount / weeklyAmount)));
    const fullNote = note?.trim() || `Nộp ${weeksToPay} tuần T${month}/${year}`;

    if (STORAGE_MODE === 'local_api') {
      try {
        const res = await fetch(`${API_BASE_URL}/contributions/submit-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id, month, year, amount, note: fullNote }),
        });
        const json = await res.json();
        return json.status === 'success';
      } catch (e) {
        console.warn('Fallback submitPayment', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        // 1. Tích các tuần tương ứng
        if (weeksToPay >= 4) {
          await supabase
            .from('fund_contributions')
            .update({ is_paid: 1, paid_at: new Date().toISOString(), note: fullNote })
            .eq('member_id', member_id)
            .eq('month', month)
            .eq('year', year);
        } else {
          const { data: unpaidWeeks } = await supabase
            .from('fund_contributions')
            .select('id')
            .eq('member_id', member_id)
            .eq('month', month)
            .eq('year', year)
            .eq('is_paid', 0)
            .order('week', { ascending: true })
            .limit(weeksToPay);

          if (unpaidWeeks && unpaidWeeks.length > 0) {
            const ids = unpaidWeeks.map((w) => w.id);
            await supabase
              .from('fund_contributions')
              .update({ is_paid: 1, paid_at: new Date().toISOString(), note: fullNote })
              .in('id', ids);
          }
        }

        // 2. Lấy tên thành viên & tạo transaction thu
        const { data: member } = await supabase.from('members').select('name').eq('id', member_id).single();
        const memberName = member?.name || 'Thành viên';

        await supabase.from('transactions').insert({
          type: 'income',
          amount: Number(amount),
          category: 'Thu quỹ định kỳ',
          member_id,
          member_name: memberName,
          description: fullNote,
          transaction_date: new Date().toISOString().slice(0, 10),
        });

        return true;
      } catch (e) {
        console.warn('Lỗi Supabase submitPayment', e);
      }
    }

    // Local fallback
    const members = await dataService.getMembers();
    const mem = members.find((m) => m.id === member_id);
    const memberName = mem ? mem.name : 'Thành viên';

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
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .order('transaction_date', { ascending: false })
          .order('id', { ascending: false });

        if (filter.type && filter.type !== 'all') {
          query = query.eq('type', filter.type);
        }
        if (filter.category && filter.category !== 'all') {
          query = query.eq('category', filter.category);
        }

        const { data } = await query;
        if (data) {
          return data.filter((t) => {
            const d = new Date(t.transaction_date);
            if (filter.month && d.getMonth() + 1 !== Number(filter.month)) return false;
            if (filter.year && d.getFullYear() !== Number(filter.year)) return false;
            if (filter.search) {
              const s = filter.search.toLowerCase();
              const matchDesc = (t.description || '').toLowerCase().includes(s);
              const matchMember = (t.member_name || '').toLowerCase().includes(s);
              const matchCat = (t.category || '').toLowerCase().includes(s);
              if (!matchDesc && !matchMember && !matchCat) return false;
            }
            return true;
          });
        }
      } catch (e) {
        console.warn('Lỗi Supabase getTransactions', e);
      }
    }

    const local = localStorage.getItem('app_transactions');
    let list = local ? JSON.parse(local) : [];

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
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        const { data } = await supabase.from('transactions').insert(tx).select().single();
        return data?.id;
      } catch (e) {
        console.warn('Lỗi Supabase createTransaction', e);
      }
    }

    const txs = await dataService.getTransactions({});
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
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        await supabase.from('transactions').update(tx).eq('id', id);
        return true;
      } catch (e) {
        console.warn('Lỗi Supabase updateTransaction', e);
      }
    }

    const txs = await dataService.getTransactions({});
    const updated = txs.map((t) => (t.id === id ? { ...t, ...tx } : t));
    localStorage.setItem('app_transactions', JSON.stringify(updated));
    return true;
  },

  deleteTransaction: async (id) => {
    if (STORAGE_MODE === 'local_api') {
      try {
        await fetch(`${API_BASE_URL}/transactions?id=${id}`, { method: 'DELETE' });
        return true;
      } catch (e) {
        console.warn('Fallback deleteTransaction', e);
      }
    } else if (STORAGE_MODE === 'supabase' && supabase) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
        return true;
      } catch (e) {
        console.warn('Lỗi Supabase deleteTransaction', e);
      }
    }

    const txs = await dataService.getTransactions({});
    const updated = txs.filter((t) => t.id !== id);
    localStorage.setItem('app_transactions', JSON.stringify(updated));
    return true;
  },
};
