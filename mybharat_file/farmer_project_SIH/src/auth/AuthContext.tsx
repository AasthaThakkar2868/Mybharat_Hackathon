import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole, Language, UserProfile } from '../types';
import { dbService } from '../services/dbService';
import { otpService, type RequestOtpResult } from '../services/otpService';

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  accountType: 'farmer' | 'fpo' | 'buyer' | 'admin';
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  pinCode?: string;
  pickupAddress?: string;
  preferredLanguage?: Language;
  isVerified?: boolean;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected' | 'More Information Required';
  rejectionReason?: string;
  // Farmer specific
  fpoName?: string;
  crops?: string[];
  farmSize?: string;
  storageAvailable?: boolean;
  transportNeeded?: boolean;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  upiId?: string;
  identityDocType?: string;
  identityDocUrl?: string;
  identityDocNumber?: string;
  // Buyer specific
  company?: string;
  companyName?: string;
  buyerType?: string;
  gstNumber?: string;
  panNumber?: string;
  requiredCommodities?: string[];
  deliveryAddress?: string;
  password?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  requestOtp: (mobile: string, role: UserRole, isRegistration?: boolean) => Promise<RequestOtpResult>;
  loginWithOtp: (
    mobile: string,
    otp: string,
    role: UserRole
  ) => Promise<{ success: boolean; errorKey?: string; attemptsRemaining?: number }>;
  registerWithOtp: (
    userData: Omit<AuthUser, 'id'>,
    otp: string
  ) => Promise<{ success: boolean; errorKey?: string; attemptsRemaining?: number }>;
  loginWithAdminCredentials: (
    phone: string,
    password: string
  ) => Promise<{ success: boolean; errorKey?: string; message?: string }>;
  loginAsDemoFarmer: () => void;
  loginAsDemoBuyer: () => void;
  loginAsDemoAdmin: () => void;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  logout: () => void;
}

export const DEMO_FARMER_USER: AuthUser = {
  id: 'USER-FAR-9142',
  name: 'Ramesh Patil (रमेश पाटील)',
  mobile: '9825143210',
  email: 'ramesh.farmer@krishisetu.in',
  role: 'farmer',
  accountType: 'farmer',
  state: 'Maharashtra',
  district: 'Pune',
  taluka: 'Baramati',
  village: 'Baramati Rural',
  pinCode: '413102',
  pickupAddress: 'Gat No. 42, Baramati-Phaltan Road, Baramati',
  preferredLanguage: 'mr',
  isVerified: true,
  verificationStatus: 'Verified',
  fpoName: 'Baramati Agro Farmers Producer Co.',
  crops: ['Soybean', 'Onion', 'Sugarcane', 'Cotton'],
  farmSize: '8.5 Acres',
  storageAvailable: true,
  transportNeeded: true,
  bankAccountName: 'Ramesh J Patil',
  bankAccountNumber: '39482910482',
  bankIfscCode: 'MAHB0000123',
  upiId: 'rameshpatil@mahb',
  identityDocType: '7/12 Land Record (Satbara)',
  identityDocNumber: 'GAT-42-BARAMATI',
  identityDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
};

export const DEMO_BUYER_USER: AuthUser = {
  id: 'USER-BUY-5021',
  name: 'Rohan Deshmukh (रोहन देशमुख)',
  mobile: '9724012345',
  email: 'rohan.procurement@chitaleagro.com',
  role: 'buyer',
  accountType: 'buyer',
  state: 'Maharashtra',
  district: 'Pune',
  taluka: 'Haveli',
  village: 'Hadapsar Industrial Estate',
  company: 'Chitale Agro & Dairy Foods Ltd',
  companyName: 'Chitale Agro & Dairy Foods Ltd',
  buyerType: 'Food Processor',
  gstNumber: '27AAACB1234F1Z8',
  panNumber: 'AAACB1234F',
  requiredCommodities: ['Soybean', 'Onion', 'Sugarcane', 'Grapes'],
  deliveryAddress: 'Plot 45-48, Hadapsar Industrial Estate, Pune',
  preferredLanguage: 'mr',
  isVerified: true,
  verificationStatus: 'Verified',
};

export const DEMO_ADMIN_USER: AuthUser = {
  id: 'ADMIN-MAHA-01',
  name: 'Dr. Suresh Patil (MSAMB Nodal Officer)',
  mobile: '9274288006',
  email: 'admin.verify@msamb.maharashtra.gov.in',
  role: 'admin',
  accountType: 'admin',
  state: 'Maharashtra',
  district: 'Pune',
  taluka: 'Pune',
  village: 'MSAMB Market Bhavan, Gultekadi',
  company: 'Maharashtra State Agricultural Marketing Board (MSAMB)',
  companyName: 'Maharashtra State Agricultural Marketing Board (MSAMB)',
  preferredLanguage: 'mr',
  isVerified: true,
  verificationStatus: 'Verified',
};

const AUTH_STORAGE_KEY = 'krishisetu_auth_session_v6';
const AUTH_TOKEN_KEY = 'krishisetu_jwt_token_v6';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return null;
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch (_) {}
  }, [user]);

  // Load fresh profile data from dbService when user session exists
  useEffect(() => {
    if (user?.id) {
      dbService.getProfile(user.id).then((profile) => {
        if (profile) {
          setUser((prev) => (prev ? { ...prev, ...profile, role: profile.role || prev.role } : null));
        }
      });
    }
  }, []);

  /**
   * Request OTP for a phone number & role
   */
  const requestOtp = async (
    mobile: string,
    role: UserRole,
    isRegistration: boolean = false
  ): Promise<RequestOtpResult> => {
    return otpService.requestOtp(mobile, role, isRegistration);
  };

  /**
   * Verify OTP and Login
   */
  const loginWithOtp = async (
    mobile: string,
    otp: string,
    role: UserRole
  ): Promise<{ success: boolean; errorKey?: string; attemptsRemaining?: number }> => {
    const cleanMobile = otpService.normalizeMobile(mobile);
    if (!cleanMobile) {
      return { success: false, errorKey: 'errorInvalidMobile' };
    }

    if (role === 'admin') {
      return { success: false, errorKey: 'errorAdminAccessDenied' };
    }

    const verification = await otpService.verifyOtp(cleanMobile, otp, role);
    if (!verification.isValid) {
      return {
        success: false,
        errorKey: verification.errorKey || 'errorInvalidOtp',
        attemptsRemaining: verification.attemptsRemaining,
      };
    }

    // Look for matching user profile
    const allProfiles = await dbService.getAllProfiles();
    let matchedProfile = allProfiles.find(
      (p) => (p.mobile === cleanMobile || p.id.includes(cleanMobile)) && p.role === role
    );

    let authUser: AuthUser;
    if (matchedProfile) {
      authUser = {
        ...matchedProfile,
        role,
        accountType: matchedProfile.accountType || (role === 'buyer' ? 'buyer' : 'farmer'),
      };
    } else if (cleanMobile === '9825143210' && role === 'farmer') {
      authUser = DEMO_FARMER_USER;
    } else if (cleanMobile === '9724012345' && role === 'buyer') {
      authUser = DEMO_BUYER_USER;
    } else {
      // Must be registered before logging in
      return { success: false, errorKey: 'errorAccountNotFound' };
    }

    setUser(authUser);
    await dbService.saveProfile(authUser as UserProfile);

    // Update URL hash to role dashboard
    const targetHash = role === 'buyer' ? '#/buyer' : '#/seller';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }

    return { success: true };
  };

  /**
   * Register with OTP verification
   */
  const registerWithOtp = async (
    userData: Omit<AuthUser, 'id'>,
    otp: string
  ): Promise<{ success: boolean; errorKey?: string; attemptsRemaining?: number }> => {
    const cleanMobile = otpService.normalizeMobile(userData.mobile);
    if (!cleanMobile) {
      return { success: false, errorKey: 'errorInvalidMobile' };
    }

    if (!userData.name || !userData.name.trim()) {
      return { success: false, errorKey: 'errorMissingFields' };
    }

    if (userData.role === 'admin') {
      return { success: false, errorKey: 'errorAdminAccessDenied' };
    }

    // Check duplicate
    const allProfiles = await dbService.getAllProfiles();
    const existing = allProfiles.find(
      (p) => p.mobile === cleanMobile && p.role === userData.role
    );
    if (existing) {
      return { success: false, errorKey: 'errorMobileAlreadyRegistered' };
    }

    // Verify OTP
    const verification = await otpService.verifyOtp(cleanMobile, otp, userData.role);
    if (!verification.isValid) {
      return {
        success: false,
        errorKey: verification.errorKey || 'errorInvalidOtp',
        attemptsRemaining: verification.attemptsRemaining,
      };
    }

    const newId = `USER-${userData.role.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: AuthUser = {
      ...userData,
      id: newId,
      mobile: cleanMobile,
      state: userData.state || 'Maharashtra',
      isVerified: true,
      verificationStatus: 'Verified',
    };

    // Save profile
    await dbService.saveProfile(newUser as UserProfile);
    setUser(newUser);

    // Notify Admin of registration
    await dbService.createNotification({
      userId: 'ADMIN_ALL',
      type: 'system',
      titleEn: 'New User Registration',
      titleMr: 'नवीन वापरकर्ता नोंदणी',
      titleHi: 'नया उपयोगकर्ता पंजीकरण',
      titleGu: 'નવું વપરાશકર્તા રજીસ્ટ્રેશન',
      messageEn: `${newUser.name} registered as a new ${newUser.role}.`,
      messageMr: `${newUser.name} यांनी नवीन ${newUser.role === 'farmer' ? 'शेतकरी' : 'खरेदीदार'} म्हणून नोंदणी केली.`,
      messageHi: `${newUser.name} ने नए ${newUser.role === 'farmer' ? 'किसान' : 'खरीदार'} के रूप में पंजीकरण किया।`,
      messageGu: `${newUser.name} દ્વારા નવું ખાતું બનાવવામાં આવ્યું છે.`,
      linkTarget: 'admin-users',
      recipientRole: 'admin',
      isAdminOnly: true,
    });

    const targetHash = userData.role === 'buyer' ? '#/buyer' : '#/seller';
    window.location.hash = targetHash;

    return { success: true };
  };

  /**
   * Protected Admin Portal Authentication (Credential based)
   */
  const loginWithAdminCredentials = async (
    phone: string,
    password: string
  ): Promise<{ success: boolean; errorKey?: string; message?: string }> => {
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          errorKey: 'errorAdminAccessDenied',
          message: data.error || 'Invalid Admin credentials.',
        };
      }

      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      }

      const adminUser: AuthUser = {
        ...DEMO_ADMIN_USER,
        id: data.user?.id || DEMO_ADMIN_USER.id,
        name: data.user?.name || DEMO_ADMIN_USER.name,
        mobile: data.user?.phone || cleanPhone,
        role: 'admin',
        accountType: 'admin',
      };

      setUser(adminUser);
      await dbService.saveProfile(adminUser as UserProfile);
      window.location.hash = '#/admin';
      return { success: true };
    } catch {
      return {
        success: false,
        errorKey: 'errorAdminAccessDenied',
        message: 'Could not connect to backend server. Please verify the server is running.',
      };
    }
  };

  const loginAsDemoFarmer = () => {
    setUser(DEMO_FARMER_USER);
    dbService.saveProfile(DEMO_FARMER_USER as UserProfile);
    window.location.hash = '#/seller';
  };

  const loginAsDemoBuyer = () => {
    setUser(DEMO_BUYER_USER);
    dbService.saveProfile(DEMO_BUYER_USER as UserProfile);
    window.location.hash = '#/buyer';
  };

  const loginAsDemoAdmin = () => {
    setUser(DEMO_ADMIN_USER);
    dbService.saveProfile(DEMO_ADMIN_USER as UserProfile);
    window.location.hash = '#/admin';
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await dbService.saveProfile(updated as UserProfile);
  };

  /**
   * Logout clears all sessions and redirects directly to Role Selection
   */
  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (_) {}
    window.location.hash = '#/role-selection';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole: user?.role ?? null,
        isAuthenticated: !!user,
        requestOtp,
        loginWithOtp,
        registerWithOtp,
        loginWithAdminCredentials,
        loginAsDemoFarmer,
        loginAsDemoBuyer,
        loginAsDemoAdmin,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
