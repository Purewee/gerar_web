// UnifiedAuthModal.tsx
'use client';

import { useState } from 'react';
import { RegisterModal } from './register-modal';
import { RegisterVerifyModal } from './register-verify-modal';
import { LoginModal } from './login-modal';
import { ResetPasswordModal } from './reset-password-modal';
import { OTPModal } from './otp-modal';

export function UnifiedAuthModal({
  open,
  onOpenChange,
  initialMode = 'login',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'login' | 'register' | 'otp' | 'reset';
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'reset'>(initialMode);
  const [registrationData, setRegistrationData] = useState<{
    phoneNumber: string;
    pin: string;
    name: string;
  } | null>(null);
  const [resetPasswordOtp, setResetPasswordOtp] = useState<{
    phoneNumber: string;
  } | null>(null);
  const [resetPasswordData, setResetPasswordData] = useState<{
    phoneNumber: string;
    otpCode: string;
  } | null>(null);

  // Modal open/close logic
  const handleClose = () => {
    onOpenChange(false);
    // Reset all modal state only when closing
    setMode(initialMode);
    setRegistrationData(null);
    setResetPasswordOtp(null);
    setResetPasswordData(null);
  };

  // Helper to switch modes and clear all other modal states
  const switchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setRegistrationData(null);
    setResetPasswordOtp(null);
    setResetPasswordData(null);
  };

  return (
    <>
      <LoginModal
        open={open && mode === 'login'}
        onOpenChange={open => {
          if (!open) handleClose();
        }}
        onSwitchToRegister={() => switchMode('register')}
        onSwitchToOTP={() => {
          // For login OTP, show OTP modal with LOGIN purpose (if needed in future)
          // switchMode('otp');
        }}
        onSwitchToResetPassword={(phoneNumber: string) => {
          setResetPasswordOtp({ phoneNumber });
          setRegistrationData(null);
          setResetPasswordData(null);
          setMode('otp');
        }}
      />
      {/* OTP Modal for password reset only */}
      {resetPasswordOtp && mode === 'otp' && (
        <OTPModal
          open={open && mode === 'otp'}
          onOpenChange={open => {
            if (!open) handleClose();
          }}
          purpose="PASSWORD_RESET"
          onOTPVerified={(phoneNumber, otpCode) => {
            setResetPasswordData({ phoneNumber, otpCode });
            setResetPasswordOtp(null);
            setMode('reset');
          }}
          onSwitchToLogin={() => switchMode('login')}
        />
      )}
      <RegisterModal
        open={open && mode === 'register'}
        onOpenChange={open => {
          if (!open && mode === 'register') handleClose();
        }}
        onOTPSent={(phoneNumber, pin, name) => {
          setRegistrationData({ phoneNumber, pin, name });
          setResetPasswordOtp(null);
          setResetPasswordData(null);
          setMode('otp');
        }}
        onSwitchToLogin={() => switchMode('login')}
      />
      {registrationData && mode === 'otp' && (
        <RegisterVerifyModal
          open={open && mode === 'otp'}
          onOpenChange={open => {
            if (!open) handleClose();
          }}
          phoneNumber={registrationData.phoneNumber}
          pin={registrationData.pin}
          name={registrationData.name}
          onSwitchToLogin={() => switchMode('login')}
        />
      )}
      {resetPasswordData && mode === 'reset' && (
        <ResetPasswordModal
          open={open && mode === 'reset'}
          onOpenChange={open => {
            if (!open) handleClose();
          }}
          phoneNumber={resetPasswordData.phoneNumber}
          otpCode={resetPasswordData.otpCode}
          onSwitchToLogin={() => switchMode('login')}
        />
      )}
    </>
  );
}
