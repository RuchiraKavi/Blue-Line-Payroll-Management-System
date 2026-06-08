import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Logo from "../assets/Logo.png";
import loginBackground from "../assets/background.jpeg";

const MailIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [showChoice, setShowChoice] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const user = response.data.user;

        login(user);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", user.role);

        const hasAdminAccess =
          user.role === "admin" ||
          user.role === "hr" ||
          user.role === "accountant" ||
          (user.permissions &&
            Object.values(user.permissions).some((section) => section?.read));

        if (user.role === "admin") {
          navigate("/admin-dashboard");
        } else if (user.role === "employee" || user.role === "intern") {
          navigate("/employee-dashboard");
        } else if (user.role === "hr" || user.role === "accountant") {
          setShowChoice(true);
        } else if (hasAdminAccess) {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      }
    } catch (error) {
      if (error.response?.data) {
        setErr(
          error.response.data.msg ||
            error.response.data.error ||
            "Login failed"
        );
      } else {
        setErr("Server error. Please try again.");
      }
    }
  };

  const goAdmin = () => {
    setShowChoice(false);
    navigate("/admin-dashboard");
  };

  const goEmployee = () => {
    setShowChoice(false);
    navigate("/employee-dashboard");
  };

  return (
    <div className="relative min-h-dvh min-h-screen overflow-hidden font-sans antialiased">
      {/* Full-viewport cover — object-cover + dvh fits any aspect ratio / mobile chrome */}
      <img
        src={loginBackground}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="pointer-events-none fixed inset-0 z-0 h-dvh min-h-dvh w-full min-w-full object-cover object-center motion-safe:animate-[login-bg-drift_28s_ease-in-out_infinite_alternate] motion-reduce:animate-none select-none"
      />
      <div
        className="pointer-events-none fixed inset-0 z-[1] min-h-dvh min-h-screen bg-linear-to-br from-slate-950/72 via-sky-950/48 to-cyan-950/42"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-[1] min-h-dvh min-h-screen bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgba(15,23,42,0.35)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 grid min-h-dvh min-h-screen grid-cols-1 md:grid-cols-2">
        {/* Left half — brand */}
        <section className="flex min-h-[38vh] flex-col items-center justify-center px-6 py-10 text-center md:min-h-dvh md:min-h-screen md:py-8 motion-safe:animate-fade-in-slide-up motion-reduce:animate-none motion-reduce:opacity-100">
          <div className="relative w-full max-w-2xl px-2">
            <div aria-hidden className="absolute -inset-24 rounded-[3rem] bg-sky-400/20 blur-3xl" />
            <div
              className="relative mx-auto w-fit max-w-full motion-safe:animate-[login-logo-enter_0.9s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none motion-reduce:opacity-100"
            >
              <img
                src={Logo}
                alt="Blue Line"
                className="relative mx-auto h-[min(52vh,26rem)] w-auto max-w-full object-contain drop-shadow-[0_16px_48px_rgba(0,0,0,0.55)] sm:h-[min(56vh,30rem)] md:h-[min(60vh,34rem)] lg:h-[min(64vh,38rem)] xl:h-[min(68vh,44rem)] 2xl:h-[min(72vh,50rem)] motion-safe:animate-[login-logo-float_5s_ease-in-out_infinite] motion-reduce:animate-none"
              />
            </div>
          </div>
        </section>

        {/* Right half — login box vertically & horizontally centered */}
        <div className="flex min-h-[62vh] items-center justify-center px-5 py-10 sm:px-8 md:min-h-dvh md:min-h-screen md:px-10 lg:px-14">
          <div className="w-full max-w-104 motion-safe:animate-[login-card-enter_0.95s_cubic-bezier(0.16,1,0.3,1)_0.22s_both] motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100">
            <div className="rounded-[1.75rem] border border-white/20 bg-white/12 backdrop-blur-2xl p-8 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-[transform,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1 motion-safe:hover:border-white/28 motion-safe:hover:bg-white/14 motion-safe:hover:shadow-[0_32px_72px_-18px_rgba(0,0,0,0.55)] motion-reduce:hover:translate-y-0">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-white/65 leading-relaxed">Sign in with your work email to continue.</p>
            </div>

            {err && (
              <div
                key={err}
                role="alert"
                className="mb-6 rounded-2xl border border-red-400/35 bg-red-500/15 px-4 py-3 text-center text-sm text-red-100 motion-safe:animate-[login-shake_0.55s_ease-in-out] motion-reduce:animate-none"
              >
                {err}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
                  Email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    id="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-[0.9375rem] text-white placeholder:text-white/35 outline-none transition-all duration-300 focus:border-sky-400/50 focus:bg-white/15 focus:ring-2 focus:ring-sky-400/30 motion-safe:focus:scale-[1.01] hover:border-white/30 hover:bg-white/14"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <LockIcon />
                  </span>
                  <input
                    type="password"
                    id="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-[0.9375rem] text-white placeholder:text-white/35 outline-none transition-all duration-300 focus:border-sky-400/50 focus:bg-white/15 focus:ring-2 focus:ring-sky-400/30 motion-safe:focus:scale-[1.01] hover:border-white/30 hover:bg-white/14"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-2xl bg-linear-to-r from-sky-500 to-blue-600 py-3.5 text-[0.9375rem] font-semibold text-white shadow-lg shadow-sky-950/40 transition-all duration-300 hover:from-sky-400 hover:to-blue-500 hover:shadow-xl hover:shadow-sky-900/35 hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]"
              >
                Sign in
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-white/40">Secure access · Authorized personnel only</p>
            </div>
          </div>
        </div>
      </div>

      {showChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-title"
            className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-900/20 motion-safe:animate-[login-modal-pop_0.45s_cubic-bezier(0.22,1,0.36,1)_0.05s_both] motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:scale-100"
          >
            <div className="mb-8 text-center">
              <h3 id="workspace-title" className="text-xl font-semibold tracking-tight text-slate-900">
                Choose workspace
              </h3>
              <p className="mt-2 text-sm text-slate-500">You have access to both dashboards</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={goAdmin}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/80 hover:shadow-md motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.99]"
              >
                <div>
                  <p className="font-semibold text-slate-800">Admin</p>
                  <p className="mt-0.5 text-xs text-slate-500">Employees, departments &amp; reports</p>
                </div>
                <span className="text-2xl opacity-90" aria-hidden>
                  🛠️
                </span>
              </button>

              <button
                type="button"
                onClick={goEmployee}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-left transition-all duration-200 hover:border-sky-300 hover:bg-sky-50/80 hover:shadow-md motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.99]"
              >
                <div>
                  <p className="font-semibold text-slate-800">Employee</p>
                  <p className="mt-0.5 text-xs text-slate-500">Profile, leaves &amp; activities</p>
                </div>
                <span className="text-2xl opacity-90" aria-hidden>
                  👤
                </span>
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">You can switch later from the menu</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
