"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BarChart3, Users, Zap, Rocket, Shield, CheckCircle2 } from "lucide-react";

const features = {
  login: [
    { icon: BarChart3, text: "Аналитика в реальном времени" },
    { icon: Users, text: "Управление контактами и сделками" },
    { icon: Zap, text: "Автоматизация рутинных задач" },
  ],
  register: [
    { icon: Rocket, text: "Быстрый старт за 5 минут" },
    { icon: Shield, text: "Безопасное хранение данных" },
    { icon: CheckCircle2, text: "Бесплатный пробный период" },
  ],
};

const headlines = {
  login: {
    title: "Управляйте бизнесом",
    highlight: "эффективно",
    description: "Современная CRM-система для автоматизации продаж, управления клиентами и аналитики",
  },
  register: {
    title: "Начните работу",
    highlight: "прямо сейчас",
    description: "Создайте аккаунт и получите доступ ко всем возможностям современной CRM-системы",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const currentFeatures = isLogin ? features.login : features.register;
  const headline = isLogin ? headlines.login : headlines.register;

  return (
    <div className="min-h-screen flex bg-[#050508]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: isLogin
              ? "linear-gradient(to bottom right, rgba(139, 92, 246, 0.2), rgba(147, 51, 234, 0.1), transparent)"
              : "linear-gradient(to bottom right, rgba(147, 51, 234, 0.2), rgba(139, 92, 246, 0.1), transparent)",
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Static gradient circles - no animation for performance */}
        <div
          className="absolute w-96 h-96 bg-violet-500/15 rounded-full blur-2xl top-1/4 left-1/4"
          style={{ willChange: 'transform' }}
        />
        <div
          className="absolute w-80 h-80 bg-purple-500/15 rounded-full blur-2xl bottom-1/4 right-1/4"
          style={{ willChange: 'transform' }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                KAIF CRM
              </span>
            </div>

            {/* Headline */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                  {headline.title}
                  <br />
                  <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                    {headline.highlight}
                  </span>
                </h1>
                <p className="text-lg text-gray-400 max-w-md">
                  {headline.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Features */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname + "-features"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-4"
            >
              {currentFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.1 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">KAIF CRM</span>
          </div>

          {/* Form with animation */}
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

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center text-sm text-gray-500"
          >
            © 2024 KAIF CRM. Все права защищены.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
