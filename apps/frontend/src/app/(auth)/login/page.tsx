"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useAuthStore } from "@/store/auth";
import { Mail, Lock, Shield, Sparkles, BarChart3, Users, Zap } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const login = useAuthStore((state) => state.login);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password, data.twoFactorCode);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast.info("Введите код двухфакторной аутентификации");
      } else {
        toast.success("Вход выполнен успешно");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#050508]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-transparent" />

        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                KAIF CRM
              </span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              Управляйте бизнесом<br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                эффективно
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-md">
              Современная CRM-система для автоматизации продаж, управления клиентами и аналитики
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: BarChart3, text: "Аналитика в реальном времени" },
              { icon: Users, text: "Управление контактами и сделками" },
              { icon: Zap, text: "Автоматизация рутинных задач" },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-300">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-violet-400" />
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">KAIF CRM</span>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Добро пожаловать</h2>
              <p className="text-gray-400">Войдите в свой аккаунт</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type="email"
                            placeholder="user@example.com"
                            disabled={isLoading}
                            className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm font-medium">Пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled={isLoading}
                            className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                {requiresTwoFactor && (
                  <FormField
                    control={form.control}
                    name="twoFactorCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm font-medium">Код 2FA</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                              type="text"
                              placeholder="123456"
                              maxLength={6}
                              disabled={isLoading}
                              className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 tracking-widest text-center text-lg"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Забыли пароль?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200"
                >
                  {isLoading ? (
                    <Icons.spinner className="h-5 w-5 animate-spin" />
                  ) : (
                    "Войти"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Нет аккаунта?{" "}
                <Link
                  href="/register"
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            © 2024 KAIF CRM. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}
