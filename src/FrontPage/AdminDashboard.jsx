import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../Services/ApiServices";
import { logout } from "../utils/auth.js";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080/";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedMessages, setSelectedMessages] = useState({});

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchOperatorRequests = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await ApiService.getOperatorData();

      if (!response) {
        setOperators([]);
        setMessage("No operator request found.");
        return;
      }

      if (response.error) {
        setOperators([]);
        setMessage(
          response.status
            ? `Failed to load operator requests (${response.status}): ${response.message}`
            : response.message
        );
        return;
      }

      if (Array.isArray(response)) {
        setOperators(response);
      } else if (Array.isArray(response.data)) {
        setOperators(response.data);
      } else {
        setOperators([]);
      }
    } catch (error) {
      console.error("Fetch Operator Error:", error);
      setMessage("Failed to load operator requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperatorRequests();
  }, []);

  const handleMessageChange = (id, value) => {
    setSelectedMessages((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleOperatorResponse = async (operatorId, status) => {
    try {
      setActionLoadingId(operatorId);
      setMessage("");

      const payload = {
        status: status,
        message:
          selectedMessages[operatorId] ||
          (status === "APPROVED"
            ? "Your garage registration request has been approved."
            : "Your garage registration request has been rejected."),
      };

      const response = await ApiService.respondToOperator(operatorId, payload);

      if (!response) {
        setMessage("Failed to update operator status.");
        return;
      }

      if (response.error) {
        setMessage(
          response.status
            ? `Failed to update operator status (${response.status}): ${response.message}`
            : response.message
        );
        return;
      }

      setMessage(`Operator request ${status.toLowerCase()} successfully.`);

      setOperators((prev) =>
        prev.filter((operator) => operator.id !== operatorId)
      );
    } catch (error) {
      console.error("Admin Response Error:", error);
      setMessage("Something went wrong while updating operator status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getOperatorName = (operator) => {
    return (
      operator?.operator?.name ||
      operator?.operator?.email ||
      operator?.name ||
      "Unknown Operator"
    );
  };

  const getOperatorEmail = (operator) => {
    return operator?.operator?.email || "No email";
  };

  const getOperatorImageSrc = (operator) => {
    const imagePath =
      operator?.shopImageUrl ||
      operator?.shopImage ||
      operator?.imageUrl ||
      operator?.image ||
      operator?.fileUrl ||
      operator?.photoUrl;

    if (!imagePath || typeof imagePath !== "string") {
      return null;
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://") ||
      imagePath.startsWith("data:") ||
      imagePath.startsWith("blob:")
    ) {
      return imagePath;
    }

    return new URL(imagePath.replace(/^\/+/, ""), BASE_URL).toString();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[150px]" />
      </div>

      <header className="border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">
              Manage operator approvals and system requests
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchOperatorRequests}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2 font-bold text-white transition hover:bg-white/[0.1]"
            >
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-5 py-2 font-bold text-white transition hover:bg-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
                Operator Approval Panel
              </div>

              <h2 className="text-4xl font-black">
                Pending garage registration requests
              </h2>

              <p className="mt-3 max-w-2xl text-slate-400">
                Review operator details, verify their garage information, then
                approve or reject the request.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4">
              <p className="text-sm text-slate-400">Pending Requests</p>
              <h3 className="mt-1 text-3xl font-black">{operators.length}</h3>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
              {message}
            </div>
          )}
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-10 text-center">
              <p className="text-lg font-bold">Loading operator requests...</p>
            </div>
          ) : operators.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-4xl">
                ✅
              </div>

              <h3 className="mt-5 text-2xl font-black">
                No pending operator requests
              </h3>

              <p className="mx-auto mt-3 max-w-md text-slate-400">
                When operators submit garage registration requests, they will
                appear here for admin approval.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {operators.map((operator) => {
                const imageSrc = getOperatorImageSrc(operator);

                return (
                  <div
                    key={operator.id}
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-xl backdrop-blur-xl"
                  >
                    <div className="relative h-56 bg-slate-900">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={operator.shopName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          🏪
                        </div>
                      )}

                      <div className="absolute left-5 top-5 rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-slate-950">
                        {operator.status || "PENDING"}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <h3 className="text-2xl font-black">
                            {operator.shopName || "Unnamed Garage"}
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            Submitted by {getOperatorName(operator)}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {getOperatorEmail(operator)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-200">
                          {operator.type || "Vehicle Type N/A"}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 text-sm">
                        <div className="flex justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
                          <span className="text-slate-400">Address</span>
                          <span className="text-right font-semibold">
                            {operator.address || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
                          <span className="text-slate-400">Phone</span>
                          <span className="font-semibold">
                            {operator.phNumber || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
                          <span className="text-slate-400">Latitude</span>
                          <span className="font-semibold">
                            {operator.latitude ?? "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
                          <span className="text-slate-400">Longitude</span>
                          <span className="font-semibold">
                            {operator.longitude ?? "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
                          <span className="text-slate-400">Created At</span>
                          <span className="text-right font-semibold">
                            {operator.createdAt
                              ? new Date(operator.createdAt).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Admin Message
                        </label>

                        <textarea
                          rows="3"
                          value={selectedMessages[operator.id] || ""}
                          onChange={(e) =>
                            handleMessageChange(operator.id, e.target.value)
                          }
                          placeholder="Write approval/rejection message..."
                          className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                        />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={() =>
                            handleOperatorResponse(operator.id, "APPROVED")
                          }
                          disabled={actionLoadingId === operator.id}
                          className="rounded-2xl bg-green-500 px-5 py-3 font-black text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoadingId === operator.id
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() =>
                            handleOperatorResponse(operator.id, "REJECTED")
                          }
                          disabled={actionLoadingId === operator.id}
                          className="rounded-2xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoadingId === operator.id
                            ? "Processing..."
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
