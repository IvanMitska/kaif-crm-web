"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
} from "lucide-react";
import { invitationsApi } from "@/lib/api";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  invitedBy: {
    firstName: string;
    lastName: string;
  };
}

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  SUPERVISOR: "Супервайзер",
  MANAGER: "Менеджер",
  OPERATOR: "Оператор",
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        setLoading(true);
        const response = await invitationsApi.getByToken(token);
        setInvitation(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Приглашение не найдено или недействительно");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = "Введите имя";
    }
    if (!lastName.trim()) {
      errors.lastName = "Введите фамилию";
    }
    if (!password) {
      errors.password = "Введите пароль";
    } else if (password.length < 6) {
      errors.password = "Пароль должен содержать минимум 6 символов";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      await invitationsApi.accept({
        token,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка при регистрации");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-gray-400">Загрузка приглашения...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Приглашение недействительно</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-purple-500"
          >
            Перейти к входу
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Регистрация успешна!</h1>
          <p className="text-gray-400 mb-6">
            Ваш аккаунт создан. Сейчас вы будете перенаправлены на страницу входа...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Перенаправление...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-2xl font-bold text-white">KAIF CRM</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Завершите регистрацию</h1>
          <p className="text-gray-400 mt-2">
            Вас пригласил {invitation?.invitedBy.firstName} {invitation?.invitedBy.lastName}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {/* Email & Role info */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-violet-400" />
              <span className="text-white">{invitation?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-violet-400" />
              <span className="text-gray-400">
                Роль: <span className="text-white">{roleLabels[invitation?.role || ""] || invitation?.role}</span>
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Имя</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-white border ${
                    validationErrors.firstName ? "border-red-500" : "border-white/10"
                  } focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-500`}
                />
              </div>
              {validationErrors.firstName && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Фамилия</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Петров"
                  className={`w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-white border ${
                    validationErrors.lastName ? "border-red-500" : "border-white/10"
                  } focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-500`}
                />
              </div>
              {validationErrors.lastName && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.lastName}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Телефон <span className="text-gray-500">(необязательно)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 999 123 4567"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-xl text-white border border-white/10 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 rounded-xl text-white border ${
                    validationErrors.password ? "border-red-500" : "border-white/10"
                  } focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Подтвердите пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 rounded-xl text-white border ${
                    validationErrors.confirmPassword ? "border-red-500" : "border-white/10"
                  } focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-gray-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Регистрация...
                </>
              ) : (
                <>
                  Завершить регистрацию
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-violet-400 hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
