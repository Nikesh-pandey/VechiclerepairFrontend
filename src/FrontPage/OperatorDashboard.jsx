import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../Services/ApiServices";
import { logout } from "../utils/auth.js";

export default function OperatorDashboard() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    latitude: "",
    longitude: "",
    type: "",
    phNumber: "",
    shopImageUrl: null,
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  /*
    IMPORTANT:
    These values must exactly match your Java enum VechicleType.
    Change these if your enum names are different.
  */
  const vehicleTypes = ["TWO_WHEELER","FOUR_WHEELER"];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setSuccess(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    setFormData((prev) => ({
      ...prev,
      shopImageUrl: file,
    }));

    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setPreviewImage(null);
    }

    setMessage("");
    setSuccess(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support location access.");
      setSuccess(false);
      return;
    }

    setLocationLoading(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));

        setLocationLoading(false);
        setMessage("Location added successfully.");
        setSuccess(true);
      },
      () => {
        setLocationLoading(false);
        setMessage("Unable to get location. Please enter it manually.");
        setSuccess(false);
      }
    );
  };

  const validateForm = () => {
    if (!formData.shopName.trim()) {
      setMessage("Shop name is required.");
      setSuccess(false);
      return false;
    }

    if (!formData.address.trim()) {
      setMessage("Address is required.");
      setSuccess(false);
      return false;
    }

    if (!formData.latitude) {
      setMessage("Latitude is required.");
      setSuccess(false);
      return false;
    }

    if (!formData.longitude) {
      setMessage("Longitude is required.");
      setSuccess(false);
      return false;
    }

    if (!formData.type) {
      setMessage("Vehicle type is required.");
      setSuccess(false);
      return false;
    }

    if (!formData.phNumber.trim()) {
      setMessage("Phone number is required.");
      setSuccess(false);
      return false;
    }

    if (formData.phNumber.length !== 10) {
      setMessage("Phone number must be 10 digits.");
      setSuccess(false);
      return false;
    }

    if (!formData.shopImageUrl) {
      setMessage("Shop image is required.");
      setSuccess(false);
      return false;
    }

    return true;
  };

const handleRegisterOperator = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  try {
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const payload = new FormData();

    const body = {
      shopName: formData.shopName,
      address: formData.address,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      type: formData.type,
      phNumber: formData.phNumber,
    };

    payload.append(
      "body",
      new Blob([JSON.stringify(body)], {
        type: "application/json",
      })
    );

    payload.append("file", formData.shopImageUrl);

    const response = await ApiService.registerOperator(payload);

    if (!response) {
      setMessage("No response from server.");
      setSuccess(false);
      return;
    }

    if (response.error) {
      setMessage(
        response.status
          ? `Operator registration failed (${response.status}): ${response.message}`
          : response.message
      );
      setSuccess(false);
      return;
    }

    setMessage(
      typeof response === "string"
        ? response
        : "Your request is submitted. You will be notified within 2 hours."
    );

    setSuccess(true);

    setFormData({
      shopName: "",
      address: "",
      latitude: "",
      longitude: "",
      type: "",
      phNumber: "",
      shopImageUrl: null,
    });

    setPreviewImage(null);
  } catch (error) {
    console.error("Operator Register Error:", error);
    setMessage("Something went wrong while submitting operator request.");
    setSuccess(false);
  } finally {
    setLoading(false);
  }
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
            <h1 className="text-2xl font-black">Operator Dashboard</h1>
            <p className="text-sm text-slate-400">
              Register and manage your garage profile
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-500 px-5 py-2 font-bold text-white transition hover:bg-red-400"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black">Register Garage</h2>
          <p className="mt-2 text-sm text-slate-400">
            Submit your garage details for admin approval.
          </p>

          {message && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                success
                  ? "border-green-400/20 bg-green-400/10 text-green-100"
                  : "border-red-400/20 bg-red-400/10 text-red-100"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleRegisterOperator} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Shop Name
              </label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="Enter garage/shop name"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter shop address"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Example: 27.7172"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Example: 85.3240"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-bold text-white transition hover:bg-white/[0.1] disabled:opacity-60"
            >
              {locationLoading ? "Getting Location..." : "Use Current Location"}
            </button>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Vehicle Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                <option value="">Select vehicle type</option>
                {vehicleTypes.map((vehicleType) => (
                  <option key={vehicleType} value={vehicleType}>
                    {vehicleType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Phone Number
              </label>
              <input
                type="text"
                name="phNumber"
                value={formData.phNumber}
                onChange={handleChange}
                maxLength="10"
                placeholder="98XXXXXXXX"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Shop Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:font-bold file:text-white hover:file:bg-blue-400"
              />
            </div>

            {previewImage && (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <img
                  src={previewImage}
                  alt="Shop preview"
                  className="h-48 w-full object-cover"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-500 px-5 py-3.5 font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Registration Request"}
            </button>
          </form>
        </section>

        <section>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
              Operator Approval Required
            </div>

            <h2 className="text-4xl font-black">
              Register your garage and wait for admin approval.
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-slate-400">
              After submitting your garage details, the admin will review your
              request. Once approved, your garage can appear in customer nearby
              garage searches.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["1", "Submit Garage Details"],
                ["2", "Admin Reviews Request"],
                ["3", "Garage Becomes Available"],
              ].map((step) => (
                <div
                  key={step[0]}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 font-black">
                    {step[0]}
                  </div>
                  <h3 className="mt-4 font-bold">{step[1]}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Repair Requests", "View and accept customer requests"],
              ["Garage Profile", "Update garage details and services"],
              ["Service Status", "Update repair progress"],
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-6"
              >
                <h3 className="text-xl font-bold">{item[0]}</h3>
                <p className="mt-2 text-slate-400">{item[1]}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
