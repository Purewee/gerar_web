import { Metadata } from 'next';
import LoyaltyStoreClient from './gift-store-client';
import GiftStoreClient from './gift-store-client';

export const metadata: Metadata = {
  title: 'Урамшууллын онооны дэлгүүр',
  description: 'Цуглуулсан оноогоороо бүтээгдэхүүн худалдан аваарай.',
};

export default function GiftStorePage() {
  return <GiftStoreClient />;
}
