import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../Services/ApiServices";
import { logout } from "../utils/auth.js";

export default function FindGarage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vechicleType: "",
    latitude: "",
    longitude: "",
    range: "",
  });

  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedGarage, setSelectedGarage] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestData, setRequestData] = useState({
    description: "",
    image: "",
  });

  const vehicleTypes = ["TWO_WHEELER", "FOUR_WHEELER"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
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
        setMessage("Current location added successfully.");
      },
      () => {
        setLocationLoading(false);
        setMessage("Unable to get your location. Please enter it manually.");
      }
    );
  };

  const normalizeGarageResponse = (response) => {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.result)) {
      return response.result;
    }

    if (Array.isArray(response.garages)) {
      return response.garages;
    }

    if (Array.isArray(response.operators)) {
      return response.operators;
    }

    return [];
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!formData.vechicleType) {
      setMessage("Please select vehicle type.");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setMessage("Please enter latitude and longitude.");
      return;
    }

    if (!formData.range) {
      setMessage("Please enter search range.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setGarages([]);

      const payload = {
        vechicleType: formData.vechicleType,
        vehicleType: formData.vechicleType,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        range: Number(formData.range),
      };

      console.log("Find Garage Payload:", payload);

      const response = await ApiService.findGarage(payload);

      if (!response) {
        setMessage("No response from server. Please try again.");
        return;
      }

      if (response.error) {
        setMessage(
          response.status
            ? `Garage search failed (${response.status}): ${response.message}`
            : response.message
        );
        return;
      }

      const garageList = normalizeGarageResponse(response);

      if (garageList.length === 0) {
        setMessage("No nearby garage/operator found for this search.");
        return;
      }

      setGarages(garageList);
      setMessage(`${garageList.length} nearby garage/operator found.`);
    } catch (error) {
      console.error("Find Garage Error:", error);
      setMessage("Something went wrong while searching garage.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequestModal = (garage) => {
    setSelectedGarage(garage);
    setRequestData({
      description: "",
      image: "",
    });
    setRequestModalOpen(true);
    setMessage("");
  };

  const handleSendRequest = async () => {
    if (!selectedGarage) {
      setMessage("Please select a garage first.");
      return;
    }

    if (!requestData.description.trim()) {
      setMessage("Please describe your vehicle problem.");
      return;
    }

    const operatorId = getOperatorId(selectedGarage);

    console.log(operatorId)
    if (!operatorId) {
      setMessage("Operator id not found in selected garage.");
      return;
    }

    try {
      setRequestLoading(true);
      setMessage("");

      const payload = {
        vechicleType: formData.vechicleType,
        vehicleType: formData.vechicleType,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        description: requestData.description.trim(),
        image: requestData.image.trim() || null,
      };

      console.log("Confirm Request Operator ID:", operatorId);
      console.log("Confirm Request Payload:", payload);

      const response = await ApiService.customerConfirmRequest(
        operatorId,
        payload
      );

      if (!response) {
        setMessage("No response from server.");
        return;
      }

      if (response.error) {
        setMessage(
          response.status
            ? `Request failed (${response.status}): ${response.message}`
            : response.message
        );
        return;
      }

      setMessage(getResponseMessage(response, "Service request sent successfully."));

      setRequestModalOpen(false);
      setSelectedGarage(null);
      setRequestData({
        description: "",
        image: "",
      });
    } catch (error) {
      console.error("Send Request Error:", error);
      setMessage("Something went wrong while sending service request.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getGarageName = (garage, index) => {
    return (
      garage.garageName ||
      garage.operatorName ||
      garage.name ||
      garage.fullName ||
      `Operator ${index + 1}`
    );
  };

  const getOperatorId = (garage) => {
    return garage?.operatorId || garage?.operator?.id || garage?.id;
  };

  const getResponseMessage = (response, fallbackMessage) => {
    if (typeof response === "string") {
      return response;
    }

    return response?.message || response?.data?.message || fallbackMessage;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[150px]" />
      </div>

      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-2xl font-black">Find Nearby Garage</h1>
            <p className="text-sm text-slate-400">
              Search operators based on vehicle type and location
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.1]"
            >
              Dashboard
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="fixed right-5 top-24 z-40 max-w-md rounded-2xl border border-blue-400/30 bg-slate-900 px-5 py-4 text-sm font-semibold text-blue-50 shadow-2xl shadow-black/30">
          {message}
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black">Search Garage</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your vehicle type, location, and range.
          </p>

          {message && (
            <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
              {message}
            </div>
          )}

          <form onSubmit={handleSearch} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Vehicle Type
              </label>

              <select
                name="vechicleType"
                value={formData.vechicleType}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                <option value="">Select vehicle type</option>
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
                Range
              </label>

              <input
                type="number"
                step="any"
                name="range"
                value={formData.range}
                onChange={handleChange}
                placeholder="Example: 5"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use the same unit your backend expects, usually kilometers.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-500 px-5 py-3.5 font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching..." : "Find Nearby Garage"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-black">Nearby Operators</h2>
              <p className="mt-2 text-slate-400">
                Matching garages/operators will appear here after search.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm text-slate-300">
              Results:{" "}
              <span className="font-bold text-white">{garages.length}</span>
            </div>
          </div>

          {garages.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-10 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-4xl">
                🔍
              </div>

              <h3 className="mt-5 text-2xl font-black">No garage listed yet</h3>
              <p className="mx-auto mt-3 max-w-md text-slate-400">
                Search using vehicle type, latitude, longitude, and range to
                find nearby operators.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {garages.map((garage, index) => {
                const operatorId = getOperatorId(garage);

                return (
                  <div
                    key={operatorId || index}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.1]"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black">
                          {getGarageName(garage, index)}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {garage.address ||
                            garage.location ||
                            garage.city ||
                            "Location not provided"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-400/10 px-3 py-2 text-xs font-bold text-green-300">
                        Available
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                        <span className="text-slate-400">Phone</span>
                        <span className="font-semibold">
                          {garage.phoneNumber || garage.phone || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                        <span className="text-slate-400">Vehicle Type</span>
                        <span className="font-semibold">
                          {garage.vechicleType ||
                            garage.vehicleType ||
                            garage.supportedVehicleType ||
                            formData.vechicleType}
                        </span>
                      </div>

                      <div className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                        <span className="text-slate-400">Distance</span>
                        <span className="font-semibold">
                          {garage.distance !== undefined
                            ? `${Number(garage.distance).toFixed(2)} km away`
                            : "Distance not available"}
                        </span>
                      </div>

                      <div className="flex justify-between rounded-xl bg-white/[0.04] px-4 py-3">
                        <span className="text-slate-400">Status</span>
                        <span className="font-semibold">
                          {garage.status || garage.activeStatus || "Active"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button className="flex-1 rounded-2xl bg-blue-500 px-4 py-3 font-bold text-white hover:bg-blue-400">
                        View Details
                      </button>

                      <button
                        onClick={() => handleOpenRequestModal(garage)}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-bold text-white hover:bg-white/[0.1]"
                      >
                        Request Service
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {requestModalOpen && selectedGarage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Request Service</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Sending request to{" "}
                  <span className="font-bold text-white">
                    {selectedGarage.operatorName ||
                      selectedGarage.garageName ||
                      selectedGarage.name ||
                      "Selected Garage"}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setRequestModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold hover:bg-white/[0.1]"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-white/[0.04] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle Type</span>
                <span className="font-semibold">{formData.vechicleType}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Latitude</span>
                <span className="font-semibold">{formData.latitude}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Longitude</span>
                <span className="font-semibold">{formData.longitude}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Distance</span>
                <span className="font-semibold">
                  {selectedGarage.distance !== undefined
                    ? `${Number(selectedGarage.distance).toFixed(2)} km`
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Problem Description
              </label>

              <textarea
                rows="4"
                value={requestData.description}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your vehicle problem..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Image URL
              </label>

              <input
                type="text"
                value={requestData.image}
                onChange={(e) =>
                  setRequestData((prev) => ({
                    ...prev,
                    image: e.target.value,
                  }))
                }
                placeholder="Optional image URL/path"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRequestModalOpen(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-bold text-white hover:bg-white/[0.1]"
              >
                Cancel
              </button>

              <button
                onClick={handleSendRequest}
                disabled={requestLoading}
                className="flex-1 rounded-2xl bg-blue-500 px-5 py-3 font-black text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
