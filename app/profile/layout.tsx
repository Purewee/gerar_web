import { Metadata } from 'next';
import ProfileClientLayout from './profile-client-layout';

export const metadata: Metadata = {
  title: 'Миний профайл',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ProfileClientLayout>{children}</ProfileClientLayout>;
}
