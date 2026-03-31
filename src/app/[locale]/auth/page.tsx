'use client';
export const runtime = 'edge';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authService } from '@/lib/auth';

export default function AuthPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('auth');

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = authService.login(email, password);
      if (user) {
        router.push(`/${locale}/dashboard`);
      } else {
        setError(t('loginError'));
      }
    } else {
      if (!name) {
        setError('请输入姓名');
        return;
      }
      authService.register(email, password, name);
      router.push(`/${locale}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          {isLogin ? t("loginBtn") : t("registerBtn")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2">{t("name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90"
          >
            {isLogin ? t("loginBtn") : t("registerBtn")}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 font-semibold ml-1"
          >
            {isLogin ? t("switchToRegister") : t("switchToLogin")}
          </button>
        </p>
      </div>
    </div>
  );
}
