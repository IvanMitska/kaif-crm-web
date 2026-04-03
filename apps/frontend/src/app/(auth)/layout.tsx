"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useMemo } from "react";

// Статичный фон без blur - выносим в отдельный мемоизированный компонент
const Background = memo(function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Градиенты вместо blur - намного легче для GPU */}
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

// Варианты анимации
const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center max-w-2xl"
        >
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
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <motion.div
            className="lg:hidden flex justify-center mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src="/logo.png"
              alt="Sintara CRM"
              width={500}
              height={125}
              className="w-auto h-44 sm:h-48"
              priority
            />
          </motion.div>

          {/* Form card - без backdrop-blur, просто полупрозрачный фон */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-[#12121a]/90 rounded-3xl border border-white/[0.06] p-8 shadow-2xl shadow-black/50"
          >
            {children}
          </motion.div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-600">
            © 2026 Sintara CRM. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}
