import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/api';

const FundContext = createContext();

export const FundProvider = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  
  const [summary, setSummary] = useState({
    total_balance: 0,
    month_income: 0,
    month_expense: 0,
    prev_month_income: 0,
    prev_month_expense: 0,
    chart_data: [],
  });

  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    bank_id: 'MBBank',
    bank_account_no: '0988888888',
    bank_account_name: 'NGUYEN VAN THU QUY',
    weekly_amount: '10000',
    monthly_amount: '40000',
    qr_template: 'compact2',
    custom_qr_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('quickpay'); // 'quickpay', 'dashboard', 'members', 'transactions'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load all data for current month/year
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [sumRes, memRes, conRes, txRes, setRes] = await Promise.all([
        dataService.getDashboardSummary(currentMonth, currentYear),
        dataService.getMembers(),
        dataService.getContributions(currentMonth, currentYear),
        dataService.getTransactions({ month: currentMonth, year: currentYear }),
        dataService.getSettings(),
      ]);

      if (sumRes) setSummary(sumRes);
      if (memRes) setMembers(memRes);
      if (conRes) setContributions(conRes);
      if (txRes) setTransactions(txRes);
      if (setRes) setSettings(setRes);
    } catch (err) {
      console.error('Error fetching fund data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const toggleWeek = async (weekId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    await dataService.toggleWeekContribution(weekId, newStatus);
    fetchAllData(true);
  };

  const toggleFullMonth = async (memberId, currentFullMonthPaid) => {
    const newStatus = currentFullMonthPaid ? 0 : 1;
    await dataService.toggleMonthContribution(memberId, currentMonth, currentYear, newStatus);
    fetchAllData(true);
  };

  const toggleMemberPaid = async (contributionId, currentStatus) => {
    return toggleWeek(contributionId, currentStatus);
  };

  const addTransaction = async (txData) => {
    await dataService.createTransaction(txData);
    fetchAllData(true);
  };

  const editTransaction = async (id, txData) => {
    await dataService.updateTransaction(id, txData);
    fetchAllData(true);
  };

  const removeTransaction = async (id) => {
    await dataService.deleteTransaction(id);
    fetchAllData(true);
  };

  const submitMemberPayment = async ({ member_id, amount, note }) => {
    await dataService.submitPayment({
      member_id,
      month: currentMonth,
      year: currentYear,
      amount,
      note,
    });
    fetchAllData(true);
  };

  const addNewMember = async (memberData) => {
    const id = await dataService.createMember(memberData);
    fetchAllData(true);
    return id;
  };

  const removeMember = async (id) => {
    await dataService.deleteMember(id);
    fetchAllData(true);
  };

  const updateMemberBankInfo = async (id, memberData) => {
    await dataService.updateMember(id, memberData);
    fetchAllData(true);
  };

  const updateAppSettings = async (newSettings) => {
    await dataService.updateSettings(newSettings);
    setSettings((prev) => ({ ...prev, ...newSettings }));
    fetchAllData(true);
  };

  return (
    <FundContext.Provider
      value={{
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        summary,
        members,
        contributions,
        transactions,
        settings,
        loading,
        isRefreshing,
        activeTab,
        setActiveTab,
        isSettingsOpen,
        openSettingsModal: () => setIsSettingsOpen(true),
        closeSettingsModal: () => setIsSettingsOpen(false),
        refreshData: () => fetchAllData(true),
        toggleWeek,
        toggleFullMonth,
        toggleMemberPaid,
        submitMemberPayment,
        addNewMember,
        removeMember,
        updateMemberBankInfo,
        addTransaction,
        editTransaction,
        removeTransaction,
        updateAppSettings,
      }}
    >
      {children}
    </FundContext.Provider>
  );
};

export const useFund = () => {
  const context = useContext(FundContext);
  if (!context) throw new Error('useFund must be used within a FundProvider');
  return context;
};
