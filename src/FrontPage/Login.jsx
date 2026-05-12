import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiService } from "../Services/ApiServices";
import { getDashboardPathByRole } from "../utils/auth.js";
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setMessage("Please enter email and password.");
      setSuccess(false);
      return;
    }

    if (formData.password.length < 7) {
      setMessage("Password must be at least 7 characters.");
      setSuccess(false);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: formData.email,
        password: formData.password,
      };

      const response = await ApiService.login(payload);

      if (!response) {
        setMessage("Login failed. Please check your credentials.");
        setSuccess(false);
        return;
      }

      if (response.error) {
        setMessage(
          response.status
            ? `Login failed (${response.status}): ${response.message}`
            : response.message
        );
        setSuccess(false);
        return;
      }

      /*
        Your backend sends:
        {
          "Jwt": "eyJ..."
        }

        So we must read response.Jwt.
      */
      const token =
        response.Jwt ||
        response.jwt ||
        response.token ||
        response.accessToken;

      if (!token) {
        setMessage("Login successful, but JWT was not found in response.");
        setSuccess(false);
        return;
      }

      localStorage.setItem("token", token);

      const decodedToken = jwtDecode(token);

      console.log("Decoded JWT:", decodedToken);

      let role =
        decodedToken.role ||
        decodedToken.authority ||
        decodedToken.authorities?.[0] ||
        decodedToken.roles?.[0];

      if (!role) {
        setMessage("Login successful, but role was not found in JWT.");
        setSuccess(false);
        return;
      }

      if (!role.startsWith("ROLE_")) {
        role = `ROLE_${role}`;
      }

      localStorage.setItem("role", role);

      const dashboardPath = getDashboardPathByRole(role);

      setMessage("Login successful. Redirecting...");
      setSuccess(true);

      setTimeout(() => {
        navigate(dashboardPath);
      }, 700);
    } catch (error) {
      console.error("Login Error:", error);
      setMessage("Something went wrong during login.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-blue-600/30 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[150px]" />
      </div>

      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
              ⚙️
            </div>

            <div>
              <h1 className="text-xl font-black">AutoCare</h1>
              <p className="text-xs text-slate-400">
                Smart Vehicle Service
              </p>
            </div>
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-400"
          >
            Create Account
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-78px)] max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-2">
        <section className="hidden lg:block">
          <div className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
            Welcome back
          </div>

          <h2 className="max-w-xl text-5xl font-black leading-tight tracking-tight">
            Login to manage your vehicle service dashboard.
          </h2>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Access your account to manage repair requests, garage services,
            customer data, and admin controls.
          </p>

          <div className="mt-10 grid max-w-lg gap-4">
            {[
              "Secure role-based access",
              "Customer, operator, and admin dashboard",
              "Fast repair request management",
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-400/15 text-green-300">
                  ✓
                </div>
                <p className="font-semibold text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black">Login</h2>
              <p className="mt-2 text-sm text-slate-400">
                Enter your details to continue
              </p>
            </div>

            {message && (
              <div
                className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                  success
                    ? "border-green-400/20 bg-green-400/10 text-green-100"
                    : "border-red-400/20 bg-red-400/10 text-red-100"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-500 px-5 py-3.5 font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Do not have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-blue-300 hover:text-blue-200"
              >
                Register here
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
