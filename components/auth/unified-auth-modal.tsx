// UnifiedAuthModal.tsx
'use client';

import { useState } from 'react';
import { RegisterModal } from './register-modal';
import { RegisterVerifyModal } from './register-verify-modal';
import { LoginModal } from './login-modal';

export function UnifiedAuthModal({
  open,
  onOpenChange,
  initialMode = 'login',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'login' | 'register' | 'otp';
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>(initialMode);
  const [registrationData, setRegistrationData] = useState<{
    phoneNumber: string;
    pin: string;
    name: string;
  } | null>(null);

  // Modal open/close logic
  const handleClose = () => {
    onOpenChange(false);
    setMode(initialMode);
    setRegistrationData(null);
  };

  return (
    <>
      <LoginModal
        open={open && mode === 'login'}
        onOpenChange={open => {
          if (!open) handleClose();
        }}
        onSwitchToRegister={() => setMode('register')}
        onSwitchToOTP={() => setMode('otp')}
      />
      <RegisterModal
        open={open && mode === 'register'}
        onOpenChange={open => {
          // Зөвхөн modal-ыг хаах үед handleClose дуудах
          if (!open && mode === 'register') handleClose();
        }}
        onOTPSent={(phoneNumber, pin, name) => {
          setRegistrationData({ phoneNumber, pin, name });
          setMode('otp');
        }}
        onSwitchToLogin={() => setMode('login')}
      />
      {registrationData && (
        <RegisterVerifyModal
          open={open && mode === 'otp'}
          onOpenChange={open => {
            if (!open) handleClose();
          }}
          phoneNumber={registrationData.phoneNumber}
          pin={registrationData.pin}
          name={registrationData.name}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </>
  );
}
