'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface BackButtonProps {
  label?: string;
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function BackButton({
  label = 'Буцах',
  className = '',
  iconClassName = 'w-4 h-4 mr-2',
  children,
  onClick,
}: BackButtonProps) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      type="button"
      className={`group flex items-center ${className}`}
      onClick={onClick || (() => router.back())}
    >
      <ArrowLeft className={iconClassName + ' group-hover:-translate-x-0.5 transition-transform'} />
      {children || <span className="font-medium">{label}</span>}
    </Button>
  );
}
