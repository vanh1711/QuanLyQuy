import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Trạng thái mở khóa vào xem Web Quỹ (Group Access)
  const [isGroupUnlocked, setIsGroupUnlocked] = useState(() => {
    return (
      localStorage.getItem('group_access_unlocked') === 'true' ||
      sessionStorage.getItem('group_access_unlocked') === 'true'
    );
  });

  // Trạng thái quyền Thủ Quỹ (Admin)
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('is_admin_unlocked') === 'true';
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Auto-lock quyền Admin sau 30 phút không hoạt động
  useEffect(() => {
    if (!isAdmin) return;

    const AUTO_LOCK_TIME = 30 * 60 * 1000; // 30 phút
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > AUTO_LOCK_TIME) {
        lockAdmin();
      }
    }, 60000);

    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [isAdmin, lastActivity]);

  // Mở khóa toàn bộ Web bằng Mật khẩu nhóm (hoặc mã PIN Thủ Quỹ)
  const unlockGroupAccess = async (password, rememberMe = true) => {
    const result = await dataService.verifyAccess(password);
    if (result.verified) {
      setIsGroupUnlocked(true);
      if (rememberMe) {
        localStorage.setItem('group_access_unlocked', 'true');
      } else {
        sessionStorage.setItem('group_access_unlocked', 'true');
      }

      // Nếu nhập trực tiếp mã PIN Thủ Quỹ -> Mở luôn quyền Admin
      if (result.isAdmin) {
        setIsAdmin(true);
        sessionStorage.setItem('is_admin_unlocked', 'true');
        setLastActivity(Date.now());
      }

      return { success: true, isAdmin: result.isAdmin };
    }

    return { 
      success: false, 
      message: result.message || 'Mật khẩu không đúng. Vui lòng hỏi Thủ Quỹ để lấy mật khẩu vào web!' 
    };
  };

  // Mở khóa quyền Thủ Quỹ (khi đã vào trong web)
  const unlockWithPin = async (pin) => {
    const isValid = await dataService.verifyPin(pin);
    if (isValid) {
      setIsAdmin(true);
      sessionStorage.setItem('is_admin_unlocked', 'true');
      setIsPinModalOpen(false);
      setLastActivity(Date.now());
      return { success: true };
    }
    return { success: false, message: 'Mã PIN không đúng. Vui lòng thử lại!' };
  };

  // Khóa quyền Thủ Quỹ
  const lockAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('is_admin_unlocked');
  };

  // Khóa hoàn toàn Web (Đăng xuất ra màn hình mật khẩu)
  const lockGroupAccess = () => {
    setIsGroupUnlocked(false);
    setIsAdmin(false);
    localStorage.removeItem('group_access_unlocked');
    sessionStorage.removeItem('group_access_unlocked');
    sessionStorage.removeItem('is_admin_unlocked');
  };

  return (
    <AuthContext.Provider
      value={{
        isGroupUnlocked,
        isAdmin,
        isPinModalOpen,
        openPinModal: () => setIsPinModalOpen(true),
        closePinModal: () => setIsPinModalOpen(false),
        unlockGroupAccess,
        unlockWithPin,
        lockAdmin,
        lockGroupAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
