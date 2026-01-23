export interface LockoutState {
  failedAttempts: number;
  lockedUntil: Date | null;
  permanentlyLocked: boolean;
}

export interface LockoutCheckResult {
  isLocked: boolean;
  lockType: 'none' | 'temporary' | 'permanent';
  minutesRemaining?: number;
  message?: string;
}

export interface LockoutUpdateResult {
  newAttempts: number;
  lockoutUpdate: {
    failedAttempts: number;
    lockedUntil?: Date | null;
    permanentlyLocked?: boolean;
  };
  response: {
    statusCode: number;
    error: string;
    attemptsRemaining?: number;
    lockedFor?: number;
    permanentlyLocked?: boolean;
    warning?: string;
  };
}

export const LOCKOUT_TIERS = {
  TIER_1: { attempts: 3, lockoutMinutes: 5 },
  TIER_2: { attempts: 6, lockoutMinutes: 60 },
  PERMANENT: { attempts: 9 },
} as const;

export function checkLockoutStatus(state: LockoutState): LockoutCheckResult {
  if (state.permanentlyLocked) {
    return {
      isLocked: true,
      lockType: 'permanent',
      message: "This access code has been permanently locked due to too many failed attempts. Please contact your healthcare provider to request new access.",
    };
  }
  
  const now = new Date();
  if (state.lockedUntil && state.lockedUntil > now) {
    const minutesRemaining = Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 60000);
    return {
      isLocked: true,
      lockType: 'temporary',
      minutesRemaining,
      message: `Too many failed attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}.`,
    };
  }
  
  return { isLocked: false, lockType: 'none' };
}

export function calculateLockoutUpdate(currentAttempts: number): LockoutUpdateResult {
  const newAttempts = currentAttempts + 1;
  
  const lockoutUpdate: LockoutUpdateResult['lockoutUpdate'] = {
    failedAttempts: newAttempts,
  };
  
  if (newAttempts >= LOCKOUT_TIERS.PERMANENT.attempts) {
    lockoutUpdate.permanentlyLocked = true;
    return {
      newAttempts,
      lockoutUpdate,
      response: {
        statusCode: 403,
        error: "This access code has been permanently locked due to too many failed attempts. Please contact your healthcare provider to request new access.",
        permanentlyLocked: true,
      },
    };
  }
  
  if (newAttempts >= LOCKOUT_TIERS.TIER_2.attempts) {
    lockoutUpdate.lockedUntil = new Date(Date.now() + LOCKOUT_TIERS.TIER_2.lockoutMinutes * 60 * 1000);
    return {
      newAttempts,
      lockoutUpdate,
      response: {
        statusCode: 401,
        error: "Invalid email or access code. You have been locked out for 1 hour. 3 more failed attempts will permanently lock this access code.",
        attemptsRemaining: LOCKOUT_TIERS.PERMANENT.attempts - newAttempts,
        lockedFor: LOCKOUT_TIERS.TIER_2.lockoutMinutes,
      },
    };
  }
  
  if (newAttempts >= LOCKOUT_TIERS.TIER_1.attempts) {
    lockoutUpdate.lockedUntil = new Date(Date.now() + LOCKOUT_TIERS.TIER_1.lockoutMinutes * 60 * 1000);
    return {
      newAttempts,
      lockoutUpdate,
      response: {
        statusCode: 401,
        error: "Invalid email or access code. You have been locked out for 5 minutes. 3 more failed attempts will result in a 1-hour lockout.",
        attemptsRemaining: LOCKOUT_TIERS.TIER_2.attempts - newAttempts,
        lockedFor: LOCKOUT_TIERS.TIER_1.lockoutMinutes,
      },
    };
  }
  
  const warning = newAttempts === 2 
    ? "Warning: 1 more failed attempt will result in a 5-minute lockout." 
    : undefined;
  
  return {
    newAttempts,
    lockoutUpdate,
    response: {
      statusCode: 401,
      error: "Invalid email or access code.",
      attemptsRemaining: LOCKOUT_TIERS.TIER_1.attempts - newAttempts,
      warning,
    },
  };
}

export function verifyEmailMatch(storedEmail: string, providedEmail: string): boolean {
  return storedEmail.toLowerCase() === providedEmail.toLowerCase();
}

export function createSuccessLockoutReset(): LockoutUpdateResult['lockoutUpdate'] {
  return {
    failedAttempts: 0,
    lockedUntil: null,
  };
}

export const SESSION_DURATION_HOURS = 24;

export function calculateSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
}
