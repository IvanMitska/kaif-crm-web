"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const countries = [
  // СНГ
  { code: "RU", dialCode: "+7", flag: "🇷🇺", name: "Россия" },
  { code: "KZ", dialCode: "+7", flag: "🇰🇿", name: "Казахстан" },
  { code: "BY", dialCode: "+375", flag: "🇧🇾", name: "Беларусь" },
  { code: "UA", dialCode: "+380", flag: "🇺🇦", name: "Украина" },
  { code: "UZ", dialCode: "+998", flag: "🇺🇿", name: "Узбекистан" },
  { code: "AZ", dialCode: "+994", flag: "🇦🇿", name: "Азербайджан" },
  { code: "GE", dialCode: "+995", flag: "🇬🇪", name: "Грузия" },
  { code: "AM", dialCode: "+374", flag: "🇦🇲", name: "Армения" },
  { code: "KG", dialCode: "+996", flag: "🇰🇬", name: "Кыргызстан" },
  { code: "TJ", dialCode: "+992", flag: "🇹🇯", name: "Таджикистан" },
  { code: "TM", dialCode: "+993", flag: "🇹🇲", name: "Туркменистан" },
  { code: "MD", dialCode: "+373", flag: "🇲🇩", name: "Молдова" },
  // Азия
  { code: "TH", dialCode: "+66", flag: "🇹🇭", name: "Таиланд" },
  { code: "VN", dialCode: "+84", flag: "🇻🇳", name: "Вьетнам" },
  { code: "ID", dialCode: "+62", flag: "🇮🇩", name: "Индонезия" },
  { code: "MY", dialCode: "+60", flag: "🇲🇾", name: "Малайзия" },
  { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Сингапур" },
  { code: "PH", dialCode: "+63", flag: "🇵🇭", name: "Филиппины" },
  { code: "CN", dialCode: "+86", flag: "🇨🇳", name: "Китай" },
  { code: "HK", dialCode: "+852", flag: "🇭🇰", name: "Гонконг" },
  { code: "JP", dialCode: "+81", flag: "🇯🇵", name: "Япония" },
  { code: "KR", dialCode: "+82", flag: "🇰🇷", name: "Южная Корея" },
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "Индия" },
  { code: "PK", dialCode: "+92", flag: "🇵🇰", name: "Пакистан" },
  { code: "BD", dialCode: "+880", flag: "🇧🇩", name: "Бангладеш" },
  { code: "LK", dialCode: "+94", flag: "🇱🇰", name: "Шри-Ланка" },
  { code: "NP", dialCode: "+977", flag: "🇳🇵", name: "Непал" },
  { code: "MM", dialCode: "+95", flag: "🇲🇲", name: "Мьянма" },
  { code: "KH", dialCode: "+855", flag: "🇰🇭", name: "Камбоджа" },
  { code: "LA", dialCode: "+856", flag: "🇱🇦", name: "Лаос" },
  // Ближний Восток
  { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "ОАЭ" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Саудовская Аравия" },
  { code: "QA", dialCode: "+974", flag: "🇶🇦", name: "Катар" },
  { code: "KW", dialCode: "+965", flag: "🇰🇼", name: "Кувейт" },
  { code: "BH", dialCode: "+973", flag: "🇧🇭", name: "Бахрейн" },
  { code: "OM", dialCode: "+968", flag: "🇴🇲", name: "Оман" },
  { code: "IL", dialCode: "+972", flag: "🇮🇱", name: "Израиль" },
  { code: "TR", dialCode: "+90", flag: "🇹🇷", name: "Турция" },
  // Европа
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "Великобритания" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Германия" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "Франция" },
  { code: "IT", dialCode: "+39", flag: "🇮🇹", name: "Италия" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸", name: "Испания" },
  { code: "PT", dialCode: "+351", flag: "🇵🇹", name: "Португалия" },
  { code: "NL", dialCode: "+31", flag: "🇳🇱", name: "Нидерланды" },
  { code: "BE", dialCode: "+32", flag: "🇧🇪", name: "Бельгия" },
  { code: "CH", dialCode: "+41", flag: "🇨🇭", name: "Швейцария" },
  { code: "AT", dialCode: "+43", flag: "🇦🇹", name: "Австрия" },
  { code: "PL", dialCode: "+48", flag: "🇵🇱", name: "Польша" },
  { code: "CZ", dialCode: "+420", flag: "🇨🇿", name: "Чехия" },
  { code: "GR", dialCode: "+30", flag: "🇬🇷", name: "Греция" },
  { code: "SE", dialCode: "+46", flag: "🇸🇪", name: "Швеция" },
  { code: "NO", dialCode: "+47", flag: "🇳🇴", name: "Норвегия" },
  { code: "FI", dialCode: "+358", flag: "🇫🇮", name: "Финляндия" },
  { code: "DK", dialCode: "+45", flag: "🇩🇰", name: "Дания" },
  // Америка
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "США" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Канада" },
  { code: "MX", dialCode: "+52", flag: "🇲🇽", name: "Мексика" },
  { code: "BR", dialCode: "+55", flag: "🇧🇷", name: "Бразилия" },
  { code: "AR", dialCode: "+54", flag: "🇦🇷", name: "Аргентина" },
  // Океания
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Австралия" },
  { code: "NZ", dialCode: "+64", flag: "🇳🇿", name: "Новая Зеландия" },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  value = "",
  onChange,
  disabled,
  placeholder = "999 123-45-67",
  className,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const country = countries.find((c) => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.slice(country.dialCode.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setIsOpen(false);
    const fullNumber = phoneNumber ? `${country.dialCode} ${phoneNumber}` : "";
    onChange?.(fullNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhoneNumber(newPhone);
    const fullNumber = newPhone ? `${selectedCountry.dialCode} ${newPhone}` : "";
    onChange?.(fullNumber);
  };

  return (
    <div className={cn("relative flex", className)} ref={dropdownRef}>
      {/* Country selector */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 h-11 bg-white/5 border border-white/10 border-r-0 rounded-l-xl text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm text-gray-400">{selectedCountry.dialCode}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {/* Phone input */}
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 h-11 px-4 bg-white/5 border border-white/10 rounded-r-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-50">
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors",
                selectedCountry.code === country.code && "bg-violet-500/20"
              )}
            >
              <span className="text-lg">{country.flag}</span>
              <span className="flex-1 text-sm text-white">{country.name}</span>
              <span className="text-sm text-gray-500">{country.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
