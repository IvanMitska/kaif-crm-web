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
import { Mail, Lock, User, Phone, Sparkles, CheckCircle2, Shield, Rocket } from "lucide-react";

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Введите имя"),
  lastName: z.string().min(1, "Введите фамилию"),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const register = useAuthStore((state) => state.register);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      });

      toast.success("Регистрация успешна!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Ошибка регистрации");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#050508]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-violet-600/10 to-transparent" />

        {/* Animated circles */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

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
              Начните работу<br />
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                прямо сейчас
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-md">
              Создайте аккаунт и получите доступ ко всем возможностям современной CRM-системы
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: Rocket, text: "Быстрый старт за 5 минут" },
              { icon: Shield, text: "Безопасное хранение данных" },
              { icon: CheckCircle2, text: "Бесплатный пробный период" },
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-300">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-purple-400" />
                </div>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
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

          {/* Form card */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Создать аккаунт</h2>
              <p className="text-gray-400">Заполните форму для регистрации</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm font-medium">Имя</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                              placeholder="Иван"
                              disabled={isLoading}
                              className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm font-medium">Фамилия</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                              placeholder="Иванов"
                              disabled={isLoading}
                              className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

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
                            className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm font-medium">
                        Телефон <span className="text-gray-500">(необязательно)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type="tel"
                            placeholder="+7 999 123-45-67"
                            disabled={isLoading}
                            className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
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
                            className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm font-medium">Подтвердите пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled={isLoading}
                            className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200 mt-2"
                >
                  {isLoading ? (
                    <Icons.spinner className="h-5 w-5 animate-spin" />
                  ) : (
                    "Зарегистрироваться"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Уже есть аккаунт?{" "}
                <Link
                  href="/login"
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Войти
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Регистрируясь, вы соглашаетесь с{" "}
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              условиями использования
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
