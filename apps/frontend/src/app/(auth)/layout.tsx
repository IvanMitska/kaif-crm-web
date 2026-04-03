"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="min-h-screen flex bg-[#0A0A0F] relative overflow-hidden">
      {/* Background effects - simplified for performance */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs - reduced blur for better performance */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[60px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative z-10 flex-col items-center justify-center px-8 xl:px-12 pb-16">
        <div className="text-center max-w-2xl animate-fade-in">
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
            <span className="whitespace-nowrap">{isLogin ? "Управляйте бизнесом" : "Начните работу"}</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              {isLogin ? "эффективно" : "прямо сейчас"}
            </span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            {isLogin
              ? "Современная CRM-система для автоматизации продаж и управления клиентами"
              : "Создайте аккаунт и получите доступ ко всем возможностям платформы"
            }
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

          {/* Form card - using CSS backdrop-filter with GPU acceleration */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl border border-white/[0.08] p-8 shadow-2xl animate-slide-up will-change-transform">
            {children}
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-600 animate-fade-in-delayed">
            © 2026 Sintara CRM. Все права защищены.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-delayed {
          animation: fadeIn 0.5s ease-out 0.3s forwards;
          opacity: 0;
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
