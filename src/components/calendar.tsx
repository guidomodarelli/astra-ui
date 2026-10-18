"use client";

/**
 * Arc's Calendar (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) as a closed component: one month for
 * picking one date, with a sliding month change, a gliding selected disc and an optional Today button. It renders on
 * the internal react-day-picker composition, which keeps keyboard navigation and accessible day labels.
 */
import * as React from "react";
import { enUS, es } from "react-day-picker/locale";
import type { DayPickerLocale, Formatters, Matcher } from "react-day-picker";

import {
  CALENDAR_COPY,
  CALENDAR_DEFAULT_LOCALE,
  CALENDAR_LOCALE_SEPARATOR,
  CALENDAR_TRANSLATED_LANGUAGE,
} from "../constants/calendar.js";
import { useToday } from "../hooks/use-today.js";
import { Calendar as CalendarPrimitive } from "./primitives/calendar.js";

export { useToday };

/** Returns `true` for a day that cannot be picked, such as a weekend. */
type CalendarDateMatcher = (date: Date) => boolean;

/** Props of {@link Calendar}: Arc's calendar API plus the @astra-kit/ui extensions marked below. */
type CalendarProps = {
  /** Selected date. Controlled only: the calendar shows what it receives. */
  value?: Date | null;
  /** Called with the day the viewer picks, including from the Today button. */
  onChange?: (date: Date) => void;
  /** Controlled visible month. Without it the calendar opens on the month of `value`, or on today's. */
  month?: Date;
  /** Called with the first day of the month the viewer navigates to. */
  onMonthChange?: (month: Date) => void;
  /** Earliest selectable day; navigation stops at its month. */
  minDate?: Date;
  /** Latest selectable day; navigation stops at its month. */
  maxDate?: Date;
  /** Return `true` to block a day, such as weekends. */
  disabledDates?: CalendarDateMatcher;
  /**
   * BCP 47 locale for month, weekday and day names. Defaults to `"es-AR"`, with weeks starting on Monday. Spanish and
   * English locales are fully translated; any other keeps English accessible labels with `Intl` month and weekday names.
   */
  locale?: string;
  /** Class of the calendar root. */
  className?: string;
  /** Adds a Today button that returns to the current month and selects today when it is allowed. */
  showToday?: boolean;
  /** @astra-kit/ui: copy of the Today button. Defaults to "Hoy". */
  todayLabel?: string;
};

/** react-day-picker settings that localize the calendar for one BCP 47 locale. */
type ResolvedCalendarLocale = {
  dayPickerLocale: Partial<DayPickerLocale>;
  formatters?: Partial<Formatters>;
};

/**
 * Maps a BCP 47 locale to react-day-picker's localization. Only Spanish and English locale data ship with @astra-kit/ui,
 * so other languages take their month and weekday names from `Intl` and keep English accessible labels.
 * @param locale - BCP 47 locale such as `es-AR`.
 * @returns The react-day-picker locale and, for untranslated languages, `Intl` formatters.
 */
function resolveCalendarLocale(locale: string): ResolvedCalendarLocale {
  const language = locale.split(CALENDAR_LOCALE_SEPARATOR)[0]?.toLowerCase();
  if (language === CALENDAR_TRANSLATED_LANGUAGE.spanish) return { dayPickerLocale: es };
  if (language === CALENDAR_TRANSLATED_LANGUAGE.english) return { dayPickerLocale: enUS };
  const captionFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return {
    dayPickerLocale: enUS,
    formatters: {
      formatCaption: (month) => captionFormat.format(month),
      formatWeekdayName: (weekday) => weekdayFormat.format(weekday),
    },
  };
}

/**
 * A month grid for picking one date. Days before `minDate`, after `maxDate` or matched by `disabledDates` are blocked,
 * and navigation stops at the months of `minDate` and `maxDate`.
 * @param props - Arc's calendar props plus `todayLabel`.
 * @returns The calendar, in Spanish by default.
 */
function Calendar({
  value,
  onChange,
  month,
  onMonthChange,
  minDate,
  maxDate,
  disabledDates,
  locale = CALENDAR_DEFAULT_LOCALE,
  className,
  showToday = false,
  todayLabel = CALENDAR_COPY.today,
}: CalendarProps) {
  // The live day moves the today dot and the Today button at the viewer's midnight. Before hydration it is
  // `undefined`, so react-day-picker keeps its own today and the server and hydration renders stay the same.
  const today = useToday();
  const { dayPickerLocale, formatters } = React.useMemo(() => resolveCalendarLocale(locale), [locale]);
  // An uncontrolled month opens on the selected date once; later selections never move it.
  const [initialMonth] = React.useState(() => value ?? undefined);
  const disabled = React.useMemo(() => {
    const matchers: Matcher[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    if (disabledDates) matchers.push(disabledDates);
    return matchers;
  }, [minDate, maxDate, disabledDates]);

  return (
    <CalendarPrimitive
      mode="single"
      // `onSelect` keeps the selection controlled: an absent value shows no selected day.
      selected={value ?? undefined}
      // The picked day is the trigger date, so a click on the selected day reports it again instead of clearing it.
      onSelect={(_selected, triggerDate) => onChange?.(triggerDate)}
      today={today}
      month={month}
      defaultMonth={initialMonth}
      onMonthChange={onMonthChange}
      startMonth={minDate}
      endMonth={maxDate}
      disabled={disabled}
      locale={dayPickerLocale}
      lang={locale}
      formatters={formatters}
      className={className}
      showToday={showToday}
      todayLabel={todayLabel}
    />
  );
}

export { Calendar };
export type { CalendarDateMatcher, CalendarProps };
