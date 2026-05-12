import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiService } from "../Services/ApiServices";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
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

    if (
      !formData.name ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setMessage("Please fill all required fields.");
      setSuccess(false);
      return;
    }

    if (formData.phoneNumber.length !== 10) {
      setMessage("Phone number must be exactly 10 digits.");
      setSuccess(false);
      return;
    }

    if (formData.password.length < 7) {
      setMessage("Password must be at least 7 characters.");
      setSuccess(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Password and confirm password do not match.");
      setSuccess(false);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      };

      const response = await ApiService.register(payload);

      if (!response) {
        setMessage("Registration failed. Please try again.");
        setSuccess(false);
        return;
      }

      if (response.error) {
        setMessage(
          response.status
            ? `Registration failed (${response.status}): ${response.message}`
            : response.message
        );
        setSuccess(false);
        return;
      }

      setMessage("Registration successful. Redirecting to login...");
      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong during registration.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-blue-600/30 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[150px]" />
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
            to="/login"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.1]"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-78px)] max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-2">
        <section>
          <div className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
            Create your account
          </div>

          <h2 className="max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Start using AutoCare for smarter vehicle repair management.
          </h2>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Register as a customer, operator, or admin and manage vehicle
            repair services from one clean dashboard.
          </p>

          <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-2">
            {[
              ["🚗", "Book Services"],
              ["🔧", "Find Garages"],
              ["📍", "Track Repairs"],
              ["🛡️", "Secure Access"],
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"
              >
                <div className="text-3xl">{item[0]}</div>
                <p className="mt-3 font-bold">{item[1]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black">Register</h2>
              <p className="mt-2 text-sm text-slate-400">
                Fill your details to create an account
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
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
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
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    maxLength="10"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Register As
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-400"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 7 characters"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-500 px-5 py-3.5 font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-blue-300 hover:text-blue-200"
              >
                Login here
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
