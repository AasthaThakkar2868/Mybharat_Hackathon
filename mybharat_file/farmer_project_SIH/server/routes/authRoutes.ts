import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User, FarmerProfile, BuyerProfile } from '../models';
import { otpService } from '../services/otpService';
import { authenticate, generateToken, type AuthRequest } from '../middleware/auth';
import { isDatabaseConnected } from '../db/connection';

const router = Router();

// In-memory fallback for local dev & testing when Atlas is temporarily offline/degraded
interface DevUserRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  passwordHash?: string;
  role: 'farmer' | 'buyer' | 'admin';
  district?: string;
  village?: string;
  isVerified: boolean;
}

const defaultAdminPhone = (process.env.ADMIN_PHONE || '9274288006').trim();
const defaultAdminPassword = (process.env.ADMIN_PASSWORD || '123456789').trim();
const devAdminPasswordHash = bcrypt.hashSync(defaultAdminPassword, 10);

const devUsersMap = new Map<string, DevUserRecord>([
  ['9825012345', { id: 'DEV-FAR-001', name: 'રમેશભાઈ પટેલ', phone: '9825012345', role: 'farmer', isVerified: true, district: 'Bhavnagar', village: 'Mahuva' }],
  ['9825143210', { id: 'DEV-FAR-002', name: 'Ramesh Patil', phone: '9825143210', role: 'farmer', isVerified: true, district: 'Pune', village: 'Baramati' }],
  ['9724012345', { id: 'DEV-BUY-001', name: 'Vilas Shinde', phone: '9724012345', role: 'buyer', isVerified: true, district: 'Nashik', village: 'Dindori' }],
  [defaultAdminPhone, {
    id: 'DEV-ADM-001',
    name: 'કૃષિસેતુ નોડલ એડમિનિસ્ટ્રેટર (GSAMB Director)',
    phone: defaultAdminPhone,
    passwordHash: devAdminPasswordHash,
    role: 'admin',
    isVerified: true,
    district: 'Gandhinagar',
    village: 'Sachivalay',
  }],
]);

// Zod Validation Schemas
const RequestOtpSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  isRegistration: z.boolean().optional(),
  role: z.enum(['farmer', 'buyer', 'admin']).optional(),
});

const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().min(4, 'OTP must be at least 4 digits'),
  isRegistration: z.boolean().optional(),
  name: z.string().optional(),
  role: z.enum(['farmer', 'buyer', 'admin']).optional(),
  district: z.string().optional(),
  village: z.string().optional(),
});

const PasswordLoginSchema = z.object({
  phoneOrEmail: z.string().min(3),
  password: z.string().min(4),
  role: z.enum(['farmer', 'buyer', 'admin']).optional(),
});

const AdminLoginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(4).optional(),
  role: z.enum(['farmer', 'buyer', 'admin']),
  accountType: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  taluka: z.string().optional(),
  village: z.string().optional(),
  preferredLanguage: z.enum(['gu', 'en', 'hi', 'mr']).optional(),
  crops: z.array(z.string()).optional(),
  farmSize: z.string().optional(),
  storageAvailable: z.boolean().optional(),
  transportNeeded: z.boolean().optional(),
  company: z.string().optional(),
  buyerType: z.string().optional(),
  requiredCommodities: z.array(z.string()).optional(),
  deliveryAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  fpoName: z.string().optional(),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountHolderName: z.string().optional(),
    bankName: z.string().optional(),
    upiId: z.string().optional(),
  }).optional(),
});

/**
 * 1. Request Mobile OTP
 */
router.post('/request-otp', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, isRegistration, role } = RequestOtpSchema.parse(req.body);
    const normalizedPhone = phone.replace(/\s+/g, '').replace('+91', '');

    if (role === 'admin') {
      res.status(403).json({ error: 'Admin portal requires username & password credentials. OTP login not permitted.' });
      return;
    }

    let existingUser = null;
    if (isDatabaseConnected()) {
      existingUser = await User.findOne({ phone: normalizedPhone });
    } else {
      existingUser = devUsersMap.get(normalizedPhone) || null;
    }

    // Enforce register before login: unregistered users cannot request login OTP
    if (!isRegistration && !existingUser) {
      res.status(404).json({
        error: 'No account found. Please register first',
        code: 'ACCOUNT_NOT_FOUND',
      });
      return;
    }

    // Uniqueness check for registration
    if (isRegistration && existingUser) {
      res.status(409).json({
        error: 'An account with this mobile number already exists. Please login instead.',
        code: 'MOBILE_ALREADY_REGISTERED',
      });
      return;
    }

    const result = await otpService.generateAndSendOtp(normalizedPhone);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true, message: `OTP sent to +91 ${normalizedPhone}` });
  } catch (err: unknown) {
    const msg = err instanceof z.ZodError ? (err.errors?.[0]?.message || 'Validation error') : (err as Error).message;
    res.status(400).json({ error: msg });
  }
});

/**
 * 2. Verify OTP & Issue Session Token
 */
router.post('/verify-otp', async (req: AuthRequest, res: Response) => {
  try {
    const data = VerifyOtpSchema.parse(req.body);
    const normalizedPhone = data.phone.replace(/\s+/g, '').replace('+91', '');

    const verification = await otpService.verifyOtp(normalizedPhone, data.otp);
    if (!verification.isValid) {
      res.status(400).json({ error: verification.message || 'Invalid or expired OTP' });
      return;
    }

    // Role safety: cannot login as admin via general OTP
    const targetRole = data.role && data.role !== 'admin' ? data.role : 'farmer';

    // Verify existing user in MongoDB Atlas or Dev Store
    let user: any = null;
    if (isDatabaseConnected()) {
      user = await User.findOne({ phone: normalizedPhone });
    } else {
      user = devUsersMap.get(normalizedPhone) || null;
    }

    if (!user) {
      res.status(404).json({
        error: 'No account found. Please register first',
        code: 'ACCOUNT_NOT_FOUND',
      });
      return;
    }

    const tokenPayload = {
      userId: user._id ? user._id.toString() : user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
    };
    const token = generateToken(tokenPayload);
    res.json({
      success: true,
      token,
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        district: user.district,
        village: user.village,
        isVerified: user.isVerified,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof z.ZodError ? (err.errors?.[0]?.message || 'Validation error') : (err as Error).message;
    res.status(400).json({ error: msg });
  }
});

/**
 * 3. Full Role-Based Registration Endpoint (Farmers & Buyers)
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const phoneInput = data.mobile || data.phone || '';
    const normalizedPhone = phoneInput.replace(/\s+/g, '').replace('+91', '');

    // Prevent direct registering as admin through public registration
    if (data.role === 'admin') {
      res.status(403).json({ error: 'એડમિન રજીસ્ટ્રેશન માટે અધિકૃત મંજૂરી જરૂરી છે.' });
      return;
    }

    if (isDatabaseConnected()) {
      // Uniqueness validation on phone and email in MongoDB
      const existingPhone = await User.findOne({ phone: normalizedPhone });
      if (existingPhone) {
        res.status(409).json({
          error: 'An account with this mobile number already exists. Please login.',
          code: 'MOBILE_ALREADY_REGISTERED',
        });
        return;
      }

      if (data.email && data.email.trim()) {
        const existingEmail = await User.findOne({ email: data.email.trim().toLowerCase() });
        if (existingEmail) {
          res.status(409).json({
            error: 'An account with this email address already exists. Please login.',
            code: 'EMAIL_ALREADY_REGISTERED',
          });
          return;
        }
      }

      let passwordHash: string | undefined = undefined;
      if (data.password && data.password.trim().length >= 4) {
        passwordHash = await bcrypt.hash(data.password.trim(), 10);
      }

      const user = new User({
        name: data.name.trim(),
        phone: normalizedPhone,
        email: data.email?.trim().toLowerCase() || undefined,
        passwordHash,
        role: data.role,
        district: data.district || (data.role === 'buyer' ? 'Pune' : 'Nashik'),
        taluka: data.taluka || '',
        village: data.village || (data.role === 'buyer' ? 'Hadapsar' : 'Lasalgaon'),
        preferredLanguage: data.preferredLanguage || 'mr',
        isVerified: true,
      });
      await user.save();

      if (data.role === 'farmer') {
        await FarmerProfile.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            farmerCode: `FAR-${Date.now().toString().slice(-4)}`,
            primaryCrops: data.crops || ['Onion', 'Potato'],
            totalLandAcres: data.farmSize ? parseFloat(data.farmSize) || 5 : 5,
            fpoAffiliation: data.fpoName,
            bankDetails: data.bankDetails,
            pickupLocation: {
              district: data.district || 'Bhavnagar',
              village: data.village || 'Mahuva',
              address: `${data.village || 'Mahuva'}, ${data.district || 'Bhavnagar'}`,
            },
          },
          { upsert: true, new: true }
        );
      } else if (data.role === 'buyer') {
        await BuyerProfile.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            buyerCode: `BUY-${Date.now().toString().slice(-4)}`,
            companyName: data.company || 'Agro Foods Ltd',
            procurementInterests: data.requiredCommodities || ['Potato', 'Onion'],
            headquartersDistrict: data.district || 'Ahmedabad',
            officeAddress: data.deliveryAddress || `${data.district || 'Ahmedabad'}, Gujarat`,
            gstNumber: data.gstNumber,
            panNumber: data.panNumber,
          },
          { upsert: true, new: true }
        );
      }

      const token = generateToken(user);
      res.status(201).json({
        success: true,
        message: 'Account successfully registered',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          district: user.district,
          village: user.village,
          isVerified: user.isVerified,
        },
      });
    } else {
      // Degraded / Offline Dev Store
      if (devUsersMap.has(normalizedPhone)) {
        res.status(409).json({
          error: 'An account with this mobile number already exists. Please login.',
          code: 'MOBILE_ALREADY_REGISTERED',
        });
        return;
      }

      const newId = `DEV-USER-${Date.now()}`;
      const devRecord: DevUserRecord = {
        id: newId,
        name: data.name.trim(),
        phone: normalizedPhone,
        email: data.email?.trim().toLowerCase(),
        role: data.role,
        district: data.district || 'Bhavnagar',
        village: data.village || 'Mahuva',
        isVerified: true,
      };
      devUsersMap.set(normalizedPhone, devRecord);

      const token = generateToken({
        userId: newId,
        name: devRecord.name,
        role: devRecord.role,
        phone: devRecord.phone,
      });

      res.status(201).json({
        success: true,
        message: 'Account successfully registered',
        token,
        user: {
          id: newId,
          name: devRecord.name,
          phone: devRecord.phone,
          email: devRecord.email,
          role: devRecord.role,
          district: devRecord.district,
          village: devRecord.village,
          isVerified: devRecord.isVerified,
        },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof z.ZodError ? err.errors?.[0]?.message || 'Validation error' : (err as Error).message;
    res.status(400).json({ error: msg });
  }
});

/**
 * 4. Protected Admin Login Endpoint
 */
router.post('/admin-login', async (req: AuthRequest, res: Response) => {
  try {
    const { phone, password } = AdminLoginSchema.parse(req.body);
    const normalizedPhone = phone.replace(/\s+/g, '').replace('+91', '');
    const configuredAdminPhone = (process.env.ADMIN_PHONE || '9274288006').trim();
    const configuredAdminPassword = (process.env.ADMIN_PASSWORD || '123456789').trim();

    if (normalizedPhone !== configuredAdminPhone) {
      res.status(403).json({ error: 'અધિકૃત એડમિન ફોન નંબર નથી (Unauthorized Admin Phone)' });
      return;
    }

    if (isDatabaseConnected()) {
      let adminUser = await User.findOne({ phone: normalizedPhone }).select('+passwordHash');
      if (!adminUser) {
        // Auto-seed with bcrypt hash
        const initialHash = await bcrypt.hash(configuredAdminPassword, 10);
        adminUser = new User({
          name: 'કૃષિસેતુ નોડલ એડમિનિસ્ટ્રેટર (GSAMB Director)',
          phone: normalizedPhone,
          passwordHash: initialHash,
          role: 'admin',
          isVerified: true,
          district: 'Gandhinagar',
          village: 'Sachivalay',
        });
        await adminUser.save();
      }

      // Verify role
      if (adminUser.role !== 'admin') {
        res.status(403).json({ error: 'This account does not have administrator privileges.' });
        return;
      }

      // Verify password via bcrypt hash
      let isMatch = false;
      if (adminUser.passwordHash) {
        isMatch = await bcrypt.compare(password.trim(), adminUser.passwordHash);
      } else {
        // If passwordHash was not populated, compare with configured and update hash
        isMatch = (password.trim() === configuredAdminPassword);
        if (isMatch) {
          adminUser.passwordHash = await bcrypt.hash(password.trim(), 10);
          await adminUser.save();
        }
      }

      if (!isMatch) {
        res.status(401).json({ error: 'અમાન્ય એડમિન પાસવર્ડ (Invalid Admin Password)' });
        return;
      }

      const token = generateToken(adminUser);
      res.json({
        success: true,
        token,
        user: {
          id: adminUser._id.toString(),
          name: adminUser.name,
          phone: adminUser.phone,
          role: 'admin',
          isVerified: true,
          district: adminUser.district || 'Gandhinagar',
          village: adminUser.village || 'Sachivalay',
        },
      });
    } else {
      // Degraded / Offline Dev Fallback
      const devRecord = devUsersMap.get(normalizedPhone);
      if (!devRecord || devRecord.role !== 'admin') {
        res.status(403).json({ error: 'અધિકૃત એડમિન ફોન નંબર નથી (Unauthorized Admin Phone)' });
        return;
      }

      let isMatch = false;
      if (devRecord.passwordHash) {
        isMatch = await bcrypt.compare(password.trim(), devRecord.passwordHash);
      } else {
        isMatch = (password.trim() === configuredAdminPassword);
      }

      if (!isMatch) {
        res.status(401).json({ error: 'અમાન્ય એડમિન પાસવર્ડ (Invalid Admin Password)' });
        return;
      }

      const token = generateToken({
        id: devRecord.id,
        name: devRecord.name,
        phone: devRecord.phone,
        role: devRecord.role,
      });

      res.json({
        success: true,
        token,
        user: {
          id: devRecord.id,
          name: devRecord.name,
          phone: devRecord.phone,
          role: devRecord.role,
          isVerified: true,
          district: devRecord.district || 'Gandhinagar',
          village: devRecord.village || 'Sachivalay',
        },
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof z.ZodError ? (err.errors?.[0]?.message || 'Validation error') : (err as Error).message;
    res.status(400).json({ error: msg });
  }
});

/**
 * 5. Password Login (Farmer & Buyer)
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { phoneOrEmail, password, role } = PasswordLoginSchema.parse(req.body);
    const cleanInput = phoneOrEmail.trim().replace(/\s+/g, '');

    const user = await User.findOne({
      $or: [{ phone: cleanInput }, { email: cleanInput.toLowerCase() }],
    }).select('+passwordHash');

    if (!user) {
      res.status(401).json({ error: 'ખાતું મળ્યું નથી. કૃપા કરીને રજીસ્ટ્રેશન કરો.' });
      return;
    }

    // Role check: prevent logging in with mismatched role
    if (role && user.role !== role && user.role !== 'admin') {
      res.status(403).json({ error: `આ એકાઉન્ટ ${user.role === 'farmer' ? 'ખેડૂત' : 'ખરીદદાર'} તરીકે નોંધાયેલ છે.` });
      return;
    }

    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'ખોટો પાસવર્ડ દાખલ કર્યો છે.' });
        return;
      }
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        district: user.district,
        village: user.village,
        isVerified: user.isVerified,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof z.ZodError ? (err.errors?.[0]?.message || 'Validation error') : (err as Error).message;
    res.status(400).json({ error: msg });
  }
});

/**
 * 6. Get Current Authenticated Profile
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (isDatabaseConnected()) {
      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      let extraProfile = null;
      if (user.role === 'farmer') {
        extraProfile = await FarmerProfile.findOne({ userId: user._id });
      } else if (user.role === 'buyer') {
        extraProfile = await BuyerProfile.findOne({ userId: user._id });
      }

      res.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          district: user.district,
          village: user.village,
          isVerified: user.isVerified,
          profileDetails: extraProfile,
        },
      });
    } else {
      // Degraded / Offline Dev Store Fallback
      const devRecord = Array.from(devUsersMap.values()).find(
        (u) => u.id === req.user?.userId || u.phone === req.user?.phone
      );
      if (!devRecord) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({
        user: {
          id: devRecord.id,
          name: devRecord.name,
          phone: devRecord.phone,
          role: devRecord.role,
          district: devRecord.district,
          village: devRecord.village,
          isVerified: devRecord.isVerified,
        },
      });
    }
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
