import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiService } from "../Services/ApiServices";
import {
  sendGarageWebSocketMessage,
  subscribeGarageWebSocket,
} from "../Services/GarageWebSocket.js";
import { getDecodedToken, logout } from "../utils/auth.js";

const toCoordinate = (value) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const getRouteCoordinates = (response) => {
  const routeResponse = response?.data || response;
  const customerLat = toCoordinate(routeResponse?.customerLat);
  const customerLng = toCoordinate(routeResponse?.customerLng);
  const garageLat = toCoordinate(routeResponse?.garageLat);
  const garageLng = toCoordinate(routeResponse?.garageLng);

  if (
    customerLat === null ||
    customerLng === null ||
    garageLat === null ||
    garageLng === null
  ) {
    return null;
  }

  return {
    customerLat,
    customerLng,
    garageLat,
    garageLng,
  };
};

const OperatorRouteMap = ({ response, requestId }) => {
  const route = getRouteCoordinates(response);
  const routeResponse = response?.data || response;

  if (!route) {
    return null;
  }

  const origin = `${route.garageLat},${route.garageLng}`;
  const destination = `${route.customerLat},${route.customerLng}`;
  const mapUrl = `https://www.google.com/maps?output=embed&saddr=${origin}&daddr=${destination}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  const sameLocation =
    route.customerLat === route.garageLat && route.customerLng === route.garageLng;

  return (
    <div
      id={requestId ? `route-map-${requestId}` : undefined}
      className="overflow-hidden rounded-2xl border border-green-400/20 bg-slate-900/80"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-black">Route to Customer</h3>
          <p className="mt-1 text-sm text-slate-400">
            Driving route from your garage to {routeResponse?.name || "customer"}.
          </p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-green-500 px-4 py-2 text-center text-sm font-black text-white hover:bg-green-400"
        >
          Start Navigation
        </a>
      </div>

      {sameLocation && (
        <div className="border-b border-yellow-400/20 bg-yellow-400/10 px-5 py-3 text-sm font-semibold text-yellow-100">
          Garage and customer coordinates are the same, so the route starts and
          ends at one point.
        </div>
      )}

      <div className="h-96 bg-slate-800">
        <iframe
          title="Driving route from garage to customer"
          src={mapUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white/[0.04] px-4 py-3">
          <span className="block text-slate-500">Source Garage</span>
          <span className="font-semibold">{origin}</span>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-4 py-3">
          <span className="block text-slate-500">Destination Customer</span>
          <span className="font-semibold">{destination}</span>
        </div>
      </div>
    </div>
  );
};

const getRequestId = (request) => {
  return (
    request?.id ||
    request?.longId ||
    request?.requestId ||
    request?.customerRequestId ||
    request?.confirmRequestId ||
    request?.bookingId ||
    request?.serviceRequestId ||
    request?.request?.id ||
    request?.customerRequest?.id ||
    request?.confirmRequest?.id ||
    request?.booking?.id ||
    request?.serviceRequest?.id
  );
};

const getCustomerId = (request) => {
  return (
    request?.customerid ||
    request?.customerId ||
    request?.customer?.id ||
    request?.user?.id ||
    request?.customerRequest?.customerId ||
    request?.request?.customerId
  );
};

const getOperatorId = (request, decodedToken) => {
  return (
    request?.operatorId ||
    request?.operatorid ||
    request?.operator?.id ||
    decodedToken?.operatorid ||
    decodedToken?.operatorId ||
    decodedToken?.id ||
    decodedToken?.userId ||
    null
  );
};

const getOperatorResponseStorageKey = (request) => {
  const customerId = getCustomerId(request);
  return customerId
    ? `operatorCustomerResponses:${customerId}`
    : "operatorCustomerResponses";
};

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const decodedToken = getDecodedToken();

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
  const [customerRequests, setCustomerRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsMessage, setRequestsMessage] = useState(
    "Connecting for live customer requests..."
  );
  const [requestsLoaded, setRequestsLoaded] = useState(true);
  const [requestActionLoadingId, setRequestActionLoadingId] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDrafts, setChatDrafts] = useState({});
  const [chatStatusByRequestId, setChatStatusByRequestId] = useState({});


  /*
    IMPORTANT:
    These values must exactly match your Java enum VechicleType.
    Change these if your enum names are different.
  */
 
  const vehicleTypes = ["TWO_WHEELER","FOUR_WHEELER"];

  const addChatMessage = useCallback((message) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        senderId: message.senderId,
        receiverId: message.receiverId,
        message: message.message,
        direction: message.direction || "incoming",
        sentAt: message.sentAt || new Date().toISOString(),
      },
    ]);
  }, []);

  const normalizeCustomerRequests = (response) => {
    if (!response) {
      return [];
    }

    const isRequestObject = (value) => {
      return Boolean(
        value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          (value.name ||
            value.customerName ||
            value.phoneNumber ||
            value.phone ||
            value.phNumber ||
            value.latitude ||
            value.lat ||
            value.description)
      );
    };

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.content)) {
      return response.content;
    }

    if (Array.isArray(response.data?.content)) {
      return response.data.content;
    }

    if (Array.isArray(response.result)) {
      return response.result;
    }

    if (Array.isArray(response.body)) {
      return response.body;
    }

    if (Array.isArray(response.requests)) {
      return response.requests;
    }

    if (Array.isArray(response.customerRequests)) {
      return response.customerRequests;
    }

    if (isRequestObject(response.data)) {
      return [response.data];
    }

    if (isRequestObject(response.result)) {
      return [response.result];
    }

    if (isRequestObject(response.body)) {
      return [response.body];
    }

    if (isRequestObject(response)) {
      return [response];
    }

    return [];
  };

  const mergeCustomerRequests = useCallback((incomingRequests) => {
    const pendingRequests = incomingRequests.filter(
      (request) => !request.status || request.status === "PENDING"
    );

    if (pendingRequests.length === 0) {
      return;
    }

    setCustomerRequests((prev) => {
      const nextRequests = [...prev];

      pendingRequests.forEach((incomingRequest) => {
        const incomingRequestId = getRequestId(incomingRequest);
        const existingIndex = nextRequests.findIndex((request) => {
          const requestId = getRequestId(request);
          return (
            incomingRequestId &&
            requestId &&
            String(requestId) === String(incomingRequestId)
          );
        });

        if (existingIndex >= 0) {
          nextRequests[existingIndex] = {
            ...nextRequests[existingIndex],
            ...incomingRequest,
          };
        } else {
          nextRequests.unshift(incomingRequest);
        }
      });

      return nextRequests;
    });

    setRequestsLoaded(true);
    setRequestsMessage("");
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeGarageWebSocket({
      onOpen: () => {
        setRequestsMessage("Listening for live customer requests.");
      },
      onMessage: ({ type, payload }) => {
        if (type && type !== "REQUEST_RECEIVED" && type !== "NEW_CHAT_MESSAGE") {
          return;
        }

        if (type === "NEW_CHAT_MESSAGE") {
          addChatMessage({
            ...payload,
            direction: "incoming",
          });
          return;
        }

        const requests = normalizeCustomerRequests(payload);

        if (requests.length > 0) {
          mergeCustomerRequests(requests);
        }
      },
      onClose: () => {
        setRequestsMessage("Live request connection closed.");
      },
      onError: () => {
        setRequestsMessage("Live request connection failed.");
      },
    });

    return () => {
      unsubscribe();
    };
  }, [addChatMessage, mergeCustomerRequests]);

  const fetchCustomerRequests = async () => {
  try {
    setRequestsLoading(true);
    setRequestsMessage("");
    setRequestsLoaded(true);

    /*
      Previous REST request loader. WebSocket now delivers REQUEST_RECEIVED
      messages from /ws/garage in real time. The Live Listening button keeps
      this REST call as a manual fallback when the socket is offline or a
      request was missed before the operator connected.
    */

    const response = await ApiService.customerRequest();

    if (response?.error) {
      setCustomerRequests([]);
      setRequestsMessage(response.message || "Failed to load customer requests.");
      return;
    }

    const requests = normalizeCustomerRequests(response).filter(
      (request) => !request.status || request.status === "PENDING"
    );

    setCustomerRequests(requests);
    setRequestsMessage(
      requests.length === 0
        ? "No pending customer requests found. Still listening for live requests."
        : ""
    );
  } catch (error) {
    console.error("Customer Request Load Error:", error);
    setCustomerRequests([]);
    setRequestsMessage("Something went wrong while loading customer requests.");
  } finally {
    setRequestsLoading(false);
  }
};
const handleSelectCustomerRequest = (request) => {
  const requestId = getRequestId(request);

  if (!requestId) {
    setRequestsMessage("Request ID not found for this request.");
    return;
  }

  setSelectedRequestId(requestId);
  setSearchParams({ requestid: String(requestId) });
};

const saveOperatorResponseForCustomer = (request, status, apiResponse) => {
  const requestId = getRequestId(request);
  const customerId = getCustomerId(request);

  if (!requestId) {
    return;
  }

  const savedResponses = JSON.parse(
    localStorage.getItem(getOperatorResponseStorageKey(request)) || "[]"
  );

  const operatorResponse = {
    id: `${requestId}-${Date.now()}`,
    requestId: String(requestId),
    customerid: customerId ? String(customerId) : "",
    customerId: customerId ? String(customerId) : "",
    customerName:
      request.name ||
      request.customerName ||
      request.fullName ||
      "Unknown Customer",
    phoneNumber: request.phoneNumber || request.phone || request.phNumber || "N/A",
    vehicleType: request.type || request.vechicleType || request.vehicleType || "N/A",
    latitude: request.latitude ?? request.lat ?? null,
    longitude: request.longitude ?? request.long ?? request.lng ?? null,
    description: request.description || "No description provided.",
    image: request.image || request.imageUrl || request.customerImage || null,
    status,
    message:
      apiResponse?.message ||
      apiResponse?.data?.message ||
      (status === "APPROVED" || status === "ACCEPTED"
        ? "Your request has been accepted by the operator."
        : "Your request has been rejected by the operator."),
    respondedAt: new Date().toISOString(),
  };

  const nextResponses = [
    operatorResponse,
    ...savedResponses.filter(
      (response) => String(response.requestId || response.id) !== String(requestId)
    ),
  ];

  localStorage.setItem(
    getOperatorResponseStorageKey(request),
    JSON.stringify(nextResponses)
  );
};

const handleCustomerRequestResponse = async (request, status) => {
  const requestId = getRequestId(request);
  const customerId = getCustomerId(request);
  const operatorId = getOperatorId(request, decodedToken);

  if (!requestId) {
    setRequestsMessage("Request ID not found.");
    return;
  }

  try {
    setRequestActionLoadingId(requestId);
    setSelectedRequestId(requestId);
    setSearchParams({ requestid: String(requestId) });

    const payload = {
      status,
      message:
        status === "APPROVED" || status === "ACCEPTED"
          ? "Your request has been accepted by the operator."
          : "Your request has been rejected by the operator.",
    };

    const response = await ApiService.operatorResponseStatus(requestId, payload);

    if (response?.error) {
      setRequestsMessage(response.message || "Update failed");
      return;
    }

    saveOperatorResponseForCustomer(request, status, response);

    let customerNotified = true;

    if (status === "APPROVED" || status === "ACCEPTED") {
      if (!customerId || !operatorId) {
        customerNotified = false;
      } else {
        customerNotified = sendGarageWebSocketMessage({
          type: "ACCEPT",
          requestId,
          customerId: String(customerId),
          operatorId: operatorId ? String(operatorId) : "",
          status: "ACCEPTED",
        });
      }
    }

    setRequestsMessage(
      status === "APPROVED" || status === "ACCEPTED"
        ? customerNotified
          ? "Request accepted and customer notified."
          : "Request accepted, but live customer notification could not be sent."
        : "Request rejected"
    );

    setCustomerRequests((prev) => {
      if (status === "APPROVED" || status === "ACCEPTED") {
        return prev.map((r) =>
          String(getRequestId(r)) === String(requestId)
            ? {
                ...r,
                status,
                operatorRouteResponse: response,
              }
            : r
        );
      }

      return prev.filter((r) => String(getRequestId(r)) !== String(requestId));
    });

    if (status === "APPROVED" || status === "ACCEPTED") {
      setTimeout(() => {
        document
          .getElementById(`route-map-${requestId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  } catch (err) {
    console.error(err);
    setRequestsMessage("Something went wrong");
  } finally {
    setRequestActionLoadingId(null);
  }
};

const handleSendChatMessage = (request) => {
  const requestId = getRequestId(request);
  const customerId = getCustomerId(request);
  const operatorId = getOperatorId(request, decodedToken);
  const message = chatDrafts[requestId] || "";

  if (!message.trim()) {
    return;
  }

  if (!customerId) {
    setChatStatusByRequestId((prev) => ({
      ...prev,
      [requestId]: "Cannot send because this request has no customer id.",
    }));
    return;
  }

  const chatPayload = {
    type: "CHAT_MESSAGE",
    senderId: operatorId ? String(operatorId) : "operator",
    receiverId: String(customerId),
    message: message.trim(),
  };

  if (sendGarageWebSocketMessage(chatPayload)) {
    addChatMessage({
      ...chatPayload,
      direction: "outgoing",
    });
    setChatDrafts((prev) => ({
      ...prev,
      [requestId]: "",
    }));
    setChatStatusByRequestId((prev) => ({
      ...prev,
      [requestId]: "",
    }));
  } else {
    setChatStatusByRequestId((prev) => ({
      ...prev,
      [requestId]: "Message not sent because the live connection is offline.",
    }));
  }
};

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

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black">New Customer Request</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Live service requests sent to your garage appear here.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchCustomerRequests}
                disabled={requestsLoading}
                className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestsLoading ? "Checking..." : "Live Listening"}
              </button>
	            </div>

	            {chatMessages.length > 0 && (
	              <div className="mb-6 rounded-2xl border border-green-400/20 bg-green-400/10 p-5">
	                <div className="flex items-center justify-between gap-3">
	                  <h3 className="font-black text-green-100">
	                    Live Chat Inbox
	                  </h3>
	                  <span className="rounded-lg bg-black/20 px-3 py-1.5 text-xs font-bold text-green-100">
	                    {chatMessages.length} messages
	                  </span>
	                </div>
	                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-black/20 p-4">
	                  {chatMessages.map((chat) => {
	                    const isMine = chat.direction === "outgoing";

	                    return (
	                      <div
	                        key={chat.id}
	                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
	                      >
	                        <div
	                          className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
	                            isMine
	                              ? "bg-green-500 text-white"
	                              : "bg-white/[0.08] text-slate-100"
	                          }`}
	                        >
	                          <p>{chat.message}</p>
	                          <p className="mt-1 text-[11px] opacity-70">
	                            {isMine
	                              ? `To ${chat.receiverId || "customer"}`
	                              : `From ${chat.senderId || "customer"}`}
	                          </p>
	                        </div>
	                      </div>
	                    );
	                  })}
	                </div>
	              </div>
	            )}

	            {!requestsLoaded && customerRequests.length === 0 && (
	              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-sm text-slate-300">
	                Customer request data will appear here in real time.
              </div>
            )}

	            {requestsLoaded && requestsMessage && customerRequests.length === 0 && (
	              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-sm text-slate-300">
	                {requestsMessage}
	              </div>
	            )}

	            {customerRequests.length > 0 && (
	              <div className="grid gap-5">
                {customerRequests.map((request, index) => {
                  const backendRequestId = getRequestId(request);
                  const requestId = backendRequestId || index;
                  const customerName =
                    request.name ||
                    request.customerName ||
                    request.fullName ||
                    "Unknown Customer";
                  const phoneNumber =
                    request.phoneNumber ||
                    request.phone ||
                    request.phNumber ||
                    "N/A";
                  const vehicleType =
                    request.type ||
                    request.vechicleType ||
                    request.vehicleType ||
                    "N/A";
                  const latitude = request.latitude ?? request.lat ?? "N/A";
                  const longitude = request.longitude ?? request.long ?? request.lng ?? "N/A";
                  const imageUrl = request.image || request.imageUrl || request.customerImage;

                  return (
                    <div
                      key={requestId}
                      onClick={() => handleSelectCustomerRequest(request)}
                      className={`cursor-pointer rounded-2xl border p-5 transition hover:bg-slate-900 ${
                        String(selectedRequestId) === String(backendRequestId)
                          ? "border-blue-400/50 bg-blue-500/10"
                          : "border-white/10 bg-slate-900/70"
                      }`}
                    >
                      <div className="flex flex-col gap-5 md:flex-row">
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={`${customerName} request`}
                            className="h-36 w-full rounded-xl object-cover md:w-44"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <h3 className="text-xl font-black">{customerName}</h3>
                              <p className="mt-1 text-sm text-slate-400">
                                {phoneNumber}
                              </p>
                            </div>

                            <span className="w-fit rounded-xl bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200">
                              {vehicleType}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg bg-white/[0.05] px-3 py-1.5 font-semibold text-slate-300">
                              Request ID: {backendRequestId || "N/A"}
                            </span>
                            <span className="rounded-lg bg-yellow-400/10 px-3 py-1.5 font-semibold text-yellow-100">
                              {request.status || "PENDING"}
                            </span>
                          </div>

                          <p className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-200">
                            {request.description || "No description provided."}
                          </p>

                          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                              <span className="block text-slate-400">Latitude</span>
                              <span className="font-semibold">{latitude}</span>
                            </div>

                            <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                              <span className="block text-slate-400">Longitude</span>
                              <span className="font-semibold">{longitude}</span>
                            </div>
                          </div>

	                          {request.status === "APPROVED" ? (
	                            <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-green-400/20 bg-green-400/10 px-5 py-4 sm:flex-row sm:items-center">
	                              <div>
	                                <p className="font-black text-green-100">
	                                  Request accepted
	                                </p>
	                                <p className="mt-1 text-sm text-green-100/80">
	                                  Navigation is ready from your garage to the customer.
	                                </p>
	                              </div>
	                              <button
	                                type="button"
	                                onClick={(event) => {
	                                  event.stopPropagation();
	                                  document
	                                    .getElementById(`route-map-${requestId}`)
	                                    ?.scrollIntoView({
	                                      behavior: "smooth",
	                                      block: "start",
	                                    });
	                                }}
	                                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-black text-white hover:bg-green-400"
	                              >
	                                View Route
	                              </button>
	                            </div>
	                          ) : (
	                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
	                              <button
	                                type="button"
	                                onClick={(event) => {
	                                  event.stopPropagation();
	                                  handleCustomerRequestResponse(request, "APPROVED");
	                                }}
	                                disabled={requestActionLoadingId === backendRequestId}
	                                className="rounded-2xl bg-green-500 px-5 py-3 font-black text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
	                              >
	                                {requestActionLoadingId === backendRequestId
	                                  ? "Processing..."
	                                  : "Approve"}
	                              </button>

	                              <button
	                                type="button"
	                                onClick={(event) => {
	                                  event.stopPropagation();
	                                  handleCustomerRequestResponse(request, "REJECTED");
	                                }}
	                                disabled={requestActionLoadingId === backendRequestId}
	                                className="rounded-2xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
	                              >
	                                {requestActionLoadingId === backendRequestId
	                                  ? "Processing..."
	                                  : "Decline"}
	                              </button>
	                            </div>
	                          )}
	                          {request.operatorRouteResponse && (
	                            <div className="mt-5">
	                              <OperatorRouteMap
	                                response={request.operatorRouteResponse}
	                                requestId={requestId}
	                              />
	                            </div>
	                          )}
                            {(request.status === "APPROVED" ||
                              request.status === "ACCEPTED") && (
                              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="font-black">Chat with Customer</h4>
                                  <span className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-300">
                                    {customerName}
                                  </span>
                                </div>

                                <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-xl bg-black/20 p-4">
                                  {chatMessages.length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                      No chat messages yet.
                                    </p>
                                  ) : (
                                    chatMessages.map((chat) => {
                                      const isMine =
                                        chat.direction === "outgoing";

                                      return (
                                        <div
                                          key={chat.id}
                                          className={`flex ${
                                            isMine
                                              ? "justify-end"
                                              : "justify-start"
                                          }`}
                                        >
                                          <div
                                            className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                                              isMine
                                                ? "bg-green-500 text-white"
                                                : "bg-white/[0.08] text-slate-100"
                                            }`}
                                          >
                                            {chat.message}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="mt-4 flex gap-3">
                                  <textarea
                                    value={chatDrafts[backendRequestId] || ""}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(event) =>
                                      setChatDrafts((prev) => ({
                                        ...prev,
                                        [backendRequestId]: event.target.value,
                                      }))
                                    }
                                    onKeyDown={(event) => {
                                      if (
                                        event.key === "Enter" &&
                                        (event.ctrlKey || event.metaKey)
                                      ) {
                                        event.stopPropagation();
                                        handleSendChatMessage(request);
                                      }
                                    }}
                                    placeholder="Type a message"
                                    rows="3"
                                    className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-green-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleSendChatMessage(request);
                                    }}
                                    disabled={!chatDrafts[backendRequestId]?.trim()}
                                    className="rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-white hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Send
                                  </button>
                                </div>
                                {chatStatusByRequestId[backendRequestId] && (
                                  <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-100">
                                    {chatStatusByRequestId[backendRequestId]}
                                  </p>
                                )}
                              </div>
                            )}
	                        </div>
	                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
