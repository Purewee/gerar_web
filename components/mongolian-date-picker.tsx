'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mongolian month names
const MONTHS_MN = [
  '1 сар',
  '2 сар',
  '3 сар',
  '4 сар',
  '5 сар',
  '6 сар',
  '7 сар',
  '8 сар',
  '9 сар',
  '10 сар',
  '11 сар',
  '12 сар',
];

// Day names in Mongolian (abbreviated), week starts Monday: Mon, Tue, Wed, Thu, Fri, Sat, Sun
const DAYS_MN = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];

interface MongolianDatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  minDate?: string; // ISO date string
  /** If provided, dates for which this returns true are disabled (e.g. off-delivery days). */
  isDateDisabled?: (dateString: string) => boolean;
  className?: string;
}

export function MongolianDatePicker({
  value,
  onChange,
  minDate,
  isDateDisabled,
  className,
}: MongolianDatePickerProps) {
  // Today and max date (7 days from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDateObj = new Date(today);
  maxDateObj.setDate(today.getDate() + 7);

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Parse value or use today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : today;

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Set current month to selected date or today when value changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Adjust for Mongolian week (Monday = 0)
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const selected = new Date(year, month, day);
    selected.setHours(0, 0, 0, 0);
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if date is before minDate or after maxDate
    if (selected < minDateObj || selected > maxDateObj) {
      return;
    }

    if (isDateDisabled?.(dateString)) {
      return;
    }

    onChange(dateString);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    // Only allow going back if the month contains selectable dates
    const lastDayOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0);
    if (lastDayOfNewMonth >= minDateObj) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    // Only allow going forward if the month contains selectable dates
    if (newMonth <= maxDateObj) {
      setCurrentMonth(newMonth);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Огноо сонгох';
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const month = MONTHS_MN[date.getMonth()];
    const year = date.getFullYear();
    return `${year} оны ${month} ${day}`;
  };

  const days = getDaysInMonth(currentMonth);
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  return (
    <div className={cn('relative', className)} ref={pickerRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full sm:w-auto max-w-xs justify-start text-left font-normal',
          !value && 'text-gray-500'
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDisplayDate(value)}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 rounded-lg border bg-white p-4 shadow-lg">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
              disabled={
                (() => {
                  const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                  const lastDayOfNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0);
                  return lastDayOfNewMonth < minDateObj;
                })()
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold">
              {currentYear} оны {MONTHS_MN[currentMonthIndex]}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
              disabled={
                (() => {
                  const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                  return newMonth > maxDateObj;
                })()
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day names */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAYS_MN.map((day, index) => (
              <div
                key={index}
                className="flex h-8 items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-8" />;
              }

              const date = new Date(currentYear, currentMonthIndex, day);
              date.setHours(0, 0, 0, 0);
              const dateString = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isBeforeMin = date < minDateObj;
              const isAfterMax = date > maxDateObj;
              const isOffDay = isDateDisabled?.(dateString) ?? false;
              const isDisabled = isBeforeMin || isAfterMax || isOffDay;
              const isSelected =
                selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();
              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    'h-8 rounded-md text-sm transition-colors',
                    isDisabled && 'cursor-not-allowed text-gray-300',
                    !isDisabled && 'hover:bg-gray-100',
                    isSelected && 'bg-primary text-white hover:bg-primary/90',
                    !isSelected && !isDisabled && isToday && 'bg-primary/10 font-semibold',
                    !isSelected && !isDisabled && !isToday && 'text-gray-700'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
