'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

interface FilterSidebarProps {
  className?: string;
  productsCount?: number;
  isLoading?: boolean;
}

export function FilterSidebarMobile({ className }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Зөвхөн categoryId байгаа үед л харуулна
  const categoryId = searchParams.get('categoryId');
  if (!categoryId) return null;

  // ...existing code...
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';

  // ...existing code...
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset pagination when filter changes
    params.delete('page');

    router.push(`/products?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    updateFilters({
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    });
  };

  return (
    <Card
      className={`mb-4 flex w-full items-center justify-between rounded-2xl border border-gray-100 shadow-sm transition hover:shadow-md ${className}`}
    >
      <CardHeader className="p-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="rounded-md bg-primary/10 p-1.5">
            <ArrowUpDown className="h-4 w-4 text-primary" />
          </div>
          Эрэмбэлэх
        </CardTitle>
      </CardHeader>

      <CardContent className="w-1/2 p-3">
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full rounded-xl border-gray-300 px-3 py-2.5 text-sm font-medium">
            <SelectValue placeholder="Эрэмбэлэх" />
          </SelectTrigger>

          <SelectContent>
            <SelectGroup>
              <SelectLabel>Үнэ</SelectLabel>
              <SelectItem value="price-asc">Хямд → Үнэтэй</SelectItem>
              <SelectItem value="price-desc">Үнэтэй → Хямд</SelectItem>
            </SelectGroup>

            <SelectGroup>
              <SelectLabel>Огноо</SelectLabel>
              <SelectItem value="createdAt-desc">Шинэ эхэнд</SelectItem>
              <SelectItem value="createdAt-asc">Хуучин эхэнд</SelectItem>
            </SelectGroup>

            <SelectGroup>
              <SelectLabel>Нэр</SelectLabel>
              <SelectItem value="name-asc">А → Я</SelectItem>
              <SelectItem value="name-desc">Я → А</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
