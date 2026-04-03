"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px]" />

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
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
            </motion.div>
          </AnimatePresence>

        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <motion.div
            className="lg:hidden flex justify-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
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

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.08] p-8 shadow-2xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-gray-600"
          >
            © 2026 Sintara CRM. Все права защищены.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
