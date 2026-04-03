import { Metadata } from 'next';
import LoyaltyStoreClient from './loyalty-store-client';

export const metadata: Metadata = {
  title: 'Урамшууллын онооны дэлгүүр',
  description: 'Цуглуулсан оноогоороо бүтээгдэхүүн худалдан аваарай.',
};

export default function LoyaltyStorePage() {
  return <LoyaltyStoreClient />;
}
