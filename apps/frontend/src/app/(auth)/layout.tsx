"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { memo, useMemo } from "react";

// Статичный фон - мемоизированный компонент
const Background = memo(function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Градиенты вместо blur */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 60%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 50% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)
          `
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  const content = useMemo(() => ({
    headline: isLogin ? "Управляйте бизнесом" : "Начните работу",
    subheadline: isLogin ? "эффективно" : "прямо сейчас",
    description: isLogin
      ? "Современная CRM-система для автоматизации продаж и управления клиентами"
      : "Создайте аккаунт и получите доступ ко всем возможностям платформы"
  }), [isLogin]);

  return (
    <div className="min-h-screen flex bg-[#0A0A0F] relative overflow-hidden">
      <Background />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative z-10 flex-col items-center justify-center px-8 xl:px-12 pb-16">
        <div className="text-center max-w-2xl animate-fade-in-up">
          {/* Logo */}
          <div className="mb-10">
            <Image
              src="/logo.png"
              alt="Sintara CRM"
              width={600}
              height={150}
              className="w-auto h-44 xl:h-52 2xl:h-60 mx-auto"
              priority
            />
          </div>

          {/* Headline */}
          <h1 className="text-5xl xl:text-6xl font-bold text-white mb-6 leading-snug">
            <span className="whitespace-nowrap">{content.headline}</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              {content.subheadline}
            </span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            {content.description}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10 animate-fade-in">
            <Image
              src="/logo.png"
              alt="Sintara CRM"
              width={500}
              height={125}
              className="w-auto h-44 sm:h-48"
              priority
            />
          </div>

          {/* Form card */}
          <div className="bg-[#12121a]/90 rounded-3xl border border-white/[0.06] p-8 shadow-2xl shadow-black/50 animate-slide-up">
            {children}
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-600 animate-fade-in-delay">
            © 2026 Sintara CRM. Все права защищены.
          </p>
        </div>
      </div>

      {/* Global CSS animations - GPU accelerated */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes staggerFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-fade-in-delay {
          opacity: 0;
          animation: fadeIn 0.5s ease-out 0.4s forwards;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }

        /* Stagger animation for form fields */
        .animate-stagger > * {
          opacity: 0;
          animation: staggerFadeIn 0.4s ease-out forwards;
        }

        .animate-stagger > *:nth-child(1) { animation-delay: 0.05s; }
        .animate-stagger > *:nth-child(2) { animation-delay: 0.1s; }
        .animate-stagger > *:nth-child(3) { animation-delay: 0.15s; }
        .animate-stagger > *:nth-child(4) { animation-delay: 0.2s; }
        .animate-stagger > *:nth-child(5) { animation-delay: 0.25s; }
        .animate-stagger > *:nth-child(6) { animation-delay: 0.3s; }
        .animate-stagger > *:nth-child(7) { animation-delay: 0.35s; }
        .animate-stagger > *:nth-child(8) { animation-delay: 0.4s; }
        .animate-stagger > *:nth-child(9) { animation-delay: 0.45s; }
        .animate-stagger > *:nth-child(10) { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
}
