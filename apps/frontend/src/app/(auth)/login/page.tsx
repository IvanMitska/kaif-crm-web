"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
import { Mail, Lock, Shield } from "lucide-react";

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
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/20">
      <div className="text-center mb-8">
        <motion.h2
          className="text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Добро пожаловать
        </motion.h2>
        <motion.p
          className="text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Войдите в свой аккаунт
        </motion.p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
                        className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
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
                        className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          {requiresTwoFactor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
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
                          className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 tracking-widest text-center text-lg transition-all"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </motion.div>
          )}

          <motion.div
            className="flex items-center justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/forgot-password"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Забыли пароль?
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <Icons.spinner className="h-5 w-5 animate-spin" />
              ) : (
                "Войти"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-gray-400">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Зарегистрироваться
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
