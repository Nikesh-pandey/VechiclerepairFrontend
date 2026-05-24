import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const stats = [
    { label: "Registered Customers", value: "24", change: "+8%" },
    { label: "Active Garages", value: "16", change: "+1%" },
    { label: "Completed Services", value: "20", change: "+25%" },
    { label: "Pending Requests", value: "14", change: "-2%" },
  ];

  const services = [
    {
      title: "Emergency Repair",
      desc: "Find nearby garages quickly when your vehicle breaks down.",
      icon: "🚨",
    },
    {
      title: "Garage Booking",
      desc: "Book trusted operators for vehicle servicing and maintenance.",
      icon: "🛠️",
    },
    {
      title: "Live Tracking",
      desc: "Track service status from request to completion in real time.",
      icon: "📍",
    },
    {
      title: "Secure Access",
      desc: "Role-based access for customers, operators, and admins.",
      icon: "🛡️",
    },
  ];



  const roles = [
    {
      title: "Customer Panel",
      desc: "Search garages, book services, track repair progress, and view service history.",
      icon: "👤",
      badge: "For customers",
    },
    {
      title: "Operator Panel",
      desc: "Accept repair requests, manage garage services, and update work status.",
      icon: "🔧",
      badge: "For garages",
    },
    {
      title: "Admin Panel",
      desc: "Monitor users, approve operators, view analytics, and manage the full system.",
      icon: "🛡️",
      badge: "For admins",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-600/20 blur-[130px]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
              <span className="text-xl">⚙️</span>
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight">AutoCare</h1>
              <p className="text-xs text-slate-400">Smart Vehicle Service</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#dashboard" className="hover:text-white transition">
              Dashboard
            </a>
            <a href="#roles" className="hover:text-white transition">
              Roles
            </a>
            <a href="#contact" className="hover:text-white transition">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:block"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Vehicle repair management made simple
          </div>

          <h2 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Manage vehicle repairs, garages, and users from one powerful
            system.
          </h2>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            AutoCare helps customers find garages, operators manage repair
            requests, and admins control the complete service platform with a
            clean and modern dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-2xl bg-blue-500 px-7 py-4 text-center font-bold text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-400"
            >
              Create Free Account
            </Link>

            <Link
              to="/login"
              className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-center font-bold text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Login Dashboard
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span>
              Real-time updates
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span>
              Role-based access
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span>
              Mobile friendly
            </div>
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-blue-500/20 blur-3xl" />

          <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.5rem] bg-slate-900 p-5">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Dashboard Overview</p>
                  <h3 className="text-2xl font-black">AutoCare Analytics</h3>
                </div>

                <div className="rounded-xl bg-green-400/10 px-3 py-2 text-sm font-bold text-green-300">
                  Live
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {stats.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <h4 className="text-2xl font-black">{item.value}</h4>
                      <span
                        className={`text-sm font-bold ${
                          item.change.startsWith("+")
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-bold">Monthly Service Requests</h4>
                  <span className="text-sm text-slate-400">2026</span>
                </div>

                <div className="flex h-40 items-end gap-3">
                  {[45, 70, 55, 90, 65, 100, 78, 110].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex flex-1 items-end rounded-t-xl bg-blue-500/20"
                        style={{ height: `${height}%` }}
                      >
                        <div className="h-full w-full rounded-t-xl bg-gradient-to-t from-blue-500 to-cyan-300" />
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  ["Ram Sharma", "Engine repair request", "Pending"],
                  ["AutoFix Garage", "Service completed", "Done"],
                  ["Admin", "New operator approval", "Review"],
                ].map((row, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">{row[0]}</p>
                      <p className="text-sm text-slate-400">{row[1]}</p>
                    </div>

                    <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">
                      {row[2]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section id="dashboard" className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <div key={index} className="rounded-2xl bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">{item.label}</p>
              <h3 className="mt-2 text-3xl font-black">{item.value}</h3>
              <p
                className={`mt-2 text-sm font-bold ${
                  item.change.startsWith("+")
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {item.change} from last month
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-bold text-blue-300">Core Features</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Everything needed for a smart repair platform
          </h2>
          <p className="mt-4 text-slate-400">
            Clean tools for customers, garage operators, and administrators.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item, index) => (
            <div
              key={index}
              className="group rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-6 transition hover:-translate-y-2 hover:bg-white/[0.1]"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
                {item.icon}
              </div>

              <h3 className="text-xl font-black">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section id="roles" className="bg-white py-20 text-slate-950">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-bold text-blue-600">User Roles</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                Designed separately for every system user
              </h2>
            </div>

            <p className="max-w-md text-slate-600">
              Each role gets a focused dashboard with the tools they actually
              need.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roles.map((role, index) => (
              <div
                key={index}
                className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-3xl">
                    {role.icon}
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {role.badge}
                  </span>
                </div>

                <h3 className="text-2xl font-black">{role.title}</h3>
                <p className="mt-4 leading-7 text-slate-600">{role.desc}</p>

                <Link
                  to="/register"
                  className="mt-7 inline-block rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-blue-600"
                >
                  Register Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl md:p-10">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-bold text-blue-300">How It Works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Simple flow from service request to completion
              </h2>
              <p className="mt-5 leading-8 text-slate-400">
                Customers submit a service request, operators accept and update
                the repair status, and admins monitor the whole platform.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                ["01", "Customer sends repair request"],
                ["02", "Nearby operator accepts the request"],
                ["03", "Service status is updated step by step"],
                ["04", "Admin monitors reports and users"],
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 font-black">
                    {step[0]}
                  </div>
                  <p className="font-semibold text-slate-200">{step[1]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-16 text-center shadow-2xl shadow-blue-500/20">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Ready to manage vehicle services smarter?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-50">
            Create your account and start using the AutoCare repair management
            platform.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-2xl bg-white px-7 py-4 font-black text-blue-700 transition hover:-translate-y-1"
            >
              Register Now
            </Link>

            <Link
              to="/login"
              className="rounded-2xl border border-white/40 px-7 py-4 font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500">
                ⚙️
              </div>

              <div>
                <h3 className="text-xl font-black">AutoCare</h3>
                <p className="text-sm text-slate-400">
                  Smart Vehicle Service Platform
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md leading-7 text-slate-400">
              A modern vehicle repair and garage management dashboard for
              customers, operators, and administrators.
            </p>
          </div>

          <div>
            <h4 className="font-black">Pages</h4>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              <a href="#features" className="hover:text-white">
                Features
              </a>
              <a href="#dashboard" className="hover:text-white">
                Dashboard
              </a>
              <a href="#roles" className="hover:text-white">
                Roles
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-black">Account</h4>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              <Link to="/login" className="hover:text-white">
                Login
              </Link>
              <Link to="/register" className="hover:text-white">
                Register
              </Link>
              <a href="#features" className="hover:text-white">
                Help Center
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-5 text-center text-sm text-slate-500">
          © 2026 AutoCare System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}