/**
 * ฟังก์ชันสำหรับการ Logout
 * ล้างข้อมูล Authentication สองฝั่ง ทั้ง LocalStorage และ Server Session/Cookie
 */

interface LogoutOptions {
  redirectUrl?: string; // URL ที่ต้องการส่งผู้ใช้ไปหลังจาก Logout สำเร็จ
  onSuccess?: () => void; // Callback function เมื่อ Logout สำเร็จ
  onError?: (error: Error) => void; // Callback function เมื่อเกิดข้อผิดพลาด
}

export const handleLogout = async (options: LogoutOptions = {}): Promise<void> => {
  const { redirectUrl = '/login', onSuccess, onError } = options;

  try {
    // 1. ส่ง Request ไปบอก Server ให้ Revoke Token หรือลบ Session Cookie
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // หากส่ง Bearer Token สามารถใส่ Authorization Header ที่นี่ได้
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      },
    });

    if (!response.ok) {
      console.warn('Server logout failed, clearing local session anyway.');
    }
  } catch (error) {
    console.error('Network error during logout:', error);
    if (onError) {
      onError(error as Error);
    }
  } finally {
    // 2. ล้างข้อมูล Auth ทั้งหมดใน Client Storage (ทำเสมอแม้ว่า API จะ Fail)
    clearLocalAuthData();

    // 3. เรียก Callback ถ้ามี
    if (onSuccess) {
      onSuccess();
    }

    // 4. Redirect ไปยังหน้า Login หรือหน้าที่กำหนด
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  }
};

/**
 * ฟังก์ชันช่วยล้างข้อมูล Auth ใน Web Storage
 */
export const clearLocalAuthData = (): void => {
  if (typeof window === 'undefined') return;

  // ลบ Tokens / User Data ออกจาก LocalStorage และ SessionStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.clear();

  // (Optional) หากใช้ Cookie ที่ Client ลบเองได้
  document.cookie = 'token=; Max-Age=0; path=/;';
};