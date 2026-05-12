import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth.js";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Customer Dashboard</h1>
            <p className="text-sm text-slate-400">
              Search garages and manage your vehicle services
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-500 px-5 py-2 font-bold text-white hover:bg-red-400"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-4xl font-black">Welcome Customer</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Find nearby garages, book repair services, and track your vehicle
            repair progress from one place.
          </p>

          <button
            onClick={() => navigate("/customer/find-garage")}
            className="mt-8 rounded-2xl bg-blue-500 px-7 py-4 font-black text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-1 hover:bg-blue-400"
          >
            Find Nearby Garage
          </button>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div
            onClick={() => navigate("/customer/find-garage")}
            className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.06] p-6 transition hover:-translate-y-1 hover:bg-white/[0.1]"
          >
            <div className="text-4xl">🔍</div>
            <h3 className="mt-4 text-xl font-bold">Find Garage</h3>
            <p className="mt-2 text-slate-400">
              Search nearby garages by vehicle type and location.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
            <div className="text-4xl">🛠️</div>
            <h3 className="mt-4 text-xl font-bold">Book Service</h3>
            <p className="mt-2 text-slate-400">
              Request vehicle repair service from available operators.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
            <div className="text-4xl">📍</div>
            <h3 className="mt-4 text-xl font-bold">Track Repair</h3>
            <p className="mt-2 text-slate-400">
              View repair status and service progress.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}