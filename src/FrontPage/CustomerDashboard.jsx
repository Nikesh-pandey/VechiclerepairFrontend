import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../Services/ApiServices";
import {
  sendGarageWebSocketMessage,
  subscribeGarageWebSocket,
} from "../Services/GarageWebSocket.js";
import { getDecodedToken, logout } from "../utils/auth.js";

const getResponseList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.responses)) {
    return response.responses;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.operatorResponses)) {
    return response.operatorResponses;
  }

  if (response && typeof response === "object") {
    return [response];
  }

  return [];
};

const getOperatorResponseStorageKey = () => {
  const decodedToken = getDecodedToken();
  const userKey =
    decodedToken?.customerid ||
    decodedToken?.customerId ||
    decodedToken?.id ||
    decodedToken?.userId ||
    decodedToken?.sub;

  return userKey
    ? `operatorCustomerResponses:${userKey}`
    : "operatorCustomerResponses";
};

const getSavedOperatorResponses = () => {
  try {
    return JSON.parse(
      localStorage.getItem(getOperatorResponseStorageKey()) || "[]"
    );
  } catch {
    return [];
  }
};

const saveOperatorResponses = (responses) => {
  localStorage.setItem(
    getOperatorResponseStorageKey(),
    JSON.stringify(responses)
  );
};

const getCustomerIdFromToken = (decodedToken) => {
  return (
    decodedToken?.customerid ||
    decodedToken?.customerId ||
    decodedToken?.id ||
    decodedToken?.userId ||
    null
  );
};

const getCustomerEmailFromToken = (decodedToken) => {
  return decodedToken?.email || decodedToken?.sub || null;
};

const getResponseCustomerId = (response) => {
  return (
    response?.customerid ||
    response?.customerId ||
    response?.customer?.id ||
    response?.user?.id ||
    null
  );
};

const getResponseCustomerEmail = (response) => {
  return (
    response?.customerEmail ||
    response?.email ||
    response?.customer?.email ||
    response?.user?.email ||
    null
  );
};

const isUsableSocketUserId = (value) => {
  return Boolean(value) && !String(value).includes("@");
};

const normalizeOperatorResponse = (response) => {
  const requestId =
    response.requestId ||
    response.id ||
    response.customerRequestId ||
    response.serviceRequestId;
  const operatorId = response.operatorId || response.operatorid;
  const customerId = response.customerId || response.customerid;

  return {
    ...response,
    requestId: requestId ? String(requestId) : response.requestId,
    operatorId: operatorId ? String(operatorId) : response.operatorId,
    operatorid: operatorId ? String(operatorId) : response.operatorid,
    customerId: customerId ? String(customerId) : response.customerId,
    customerid: customerId ? String(customerId) : response.customerid,
    operatorName:
      response.operatorName ||
      response.name ||
      (operatorId ? `Operator ${operatorId}` : undefined),
    status: response.status || "ACCEPTED",
    message:
      response.message || "Your request has been accepted by the operator.",
    source: response.source || "api",
    respondedAt:
      response.respondedAt ||
      response.createdAt ||
      response.updatedAt ||
      (response.source === "websocket" ? new Date().toISOString() : undefined),
  };
};

const sortResponsesByTime = (responses) => {
  return [...responses].sort((a, b) => {
    const aTime = new Date(a.respondedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.respondedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
};

const toCoordinate = (value) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

const getRouteCoordinates = (response) => {
  const customerLat = toCoordinate(response?.customerLat);
  const customerLng = toCoordinate(response?.customerLng);
  const garageLat = toCoordinate(response?.garageLat);
  const garageLng = toCoordinate(response?.garageLng);

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

const RouteMap = ({ response }) => {
  const route = getRouteCoordinates(response);

  if (!route) {
    return null;
  }

  const latPadding = Math.max(
    Math.abs(route.customerLat - route.garageLat) * 0.45,
    0.01
  );
  const lngPadding = Math.max(
    Math.abs(route.customerLng - route.garageLng) * 0.45,
    0.01
  );
  const south = Math.min(route.customerLat, route.garageLat) - latPadding;
  const north = Math.max(route.customerLat, route.garageLat) + latPadding;
  const west = Math.min(route.customerLng, route.garageLng) - lngPadding;
  const east = Math.max(route.customerLng, route.garageLng) + lngPadding;
  const latRange = north - south;
  const lngRange = east - west;

  const getPoint = (lat, lng) => ({
    x: ((lng - west) / lngRange) * 100,
    y: ((north - lat) / latRange) * 100,
  });

  const garagePoint = getPoint(route.garageLat, route.garageLng);
  const customerPoint = getPoint(route.customerLat, route.customerLng);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${route.garageLat},${route.garageLng}&destination=${route.customerLat},${route.customerLng}`;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-black">Garage to Customer Route</h3>
          <p className="mt-1 text-sm text-slate-400">
            Start from operator garage and go to customer location
          </p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-blue-500 px-4 py-2 text-center text-sm font-black text-white hover:bg-blue-400"
        >
          Open Directions
        </a>
      </div>

      <div className="relative h-80 bg-slate-800">
        <iframe
          title="Garage to customer map"
          src={mapUrl}
          className="h-full w-full border-0"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1={garagePoint.x}
            y1={garagePoint.y}
            x2={customerPoint.x}
            y2={customerPoint.y}
            stroke="#2563eb"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="3 2"
          />
        </svg>
        <div
          className="absolute -translate-x-1/2 -translate-y-full rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-lg"
          style={{ left: `${garagePoint.x}%`, top: `${garagePoint.y}%` }}
        >
          Garage
        </div>
        <div
          className="absolute -translate-x-1/2 translate-y-1 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-lg"
          style={{ left: `${customerPoint.x}%`, top: `${customerPoint.y}%` }}
        >
          Customer
        </div>
      </div>

      <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white/[0.04] px-4 py-3">
          <span className="block text-slate-500">Garage Location</span>
          <span className="font-semibold">
            {route.garageLat}, {route.garageLng}
          </span>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-4 py-3">
          <span className="block text-slate-500">Customer Location</span>
          <span className="font-semibold">
            {route.customerLat}, {route.customerLng}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [operatorResponses, setOperatorResponses] = useState(
    getSavedOperatorResponses
  );
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responsesMessage, setResponsesMessage] = useState(() =>
    getSavedOperatorResponses().length === 0
      ? "Listening for live operator response."
      : ""
  );
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatStatus, setChatStatus] = useState("");

  const decodedToken = getDecodedToken();
  const currentCustomerId = getCustomerIdFromToken(decodedToken);
  const currentCustomerEmail = getCustomerEmailFromToken(decodedToken);

  const visibleResponses = useMemo(() => {
    if (!currentCustomerId && !currentCustomerEmail) {
      return operatorResponses;
    }

    return operatorResponses.filter((response) => {
      if (response.source === "websocket") {
        return true;
      }

      const responseCustomerId = getResponseCustomerId(response);
      const responseCustomerEmail = getResponseCustomerEmail(response);

      if (currentCustomerId && responseCustomerId) {
        return String(responseCustomerId) === String(currentCustomerId);
      }

      if (currentCustomerEmail && responseCustomerEmail) {
        return String(responseCustomerEmail) === String(currentCustomerEmail);
      }

      if (!responseCustomerId && !responseCustomerEmail) {
        return true;
      }

      return !responseCustomerId && !responseCustomerEmail;
    });
  }, [currentCustomerEmail, currentCustomerId, operatorResponses]);

  const latestResponse = visibleResponses[0];
  const latestOperatorId =
    latestResponse?.operatorId || latestResponse?.operatorid || null;
  const latestChatMessage = chatMessages[chatMessages.length - 1];
  const chatCustomerId =
    latestResponse?.customerId ||
    latestResponse?.customerid ||
    currentCustomerId ||
    latestChatMessage?.receiverId ||
    "customer";
  const latestAcceptedOperatorId =
    isUsableSocketUserId(latestOperatorId) ? latestOperatorId : null;
  const latestIncomingOperatorId =
    latestChatMessage &&
    String(latestChatMessage.senderId) !== String(chatCustomerId)
      ? latestChatMessage.senderId
      : null;
  const previousReplyOperatorId =
    latestChatMessage &&
    String(latestChatMessage.senderId) === String(chatCustomerId) &&
    isUsableSocketUserId(latestChatMessage.receiverId)
      ? latestChatMessage.receiverId
      : null;
  const chatOperatorId =
    (isUsableSocketUserId(latestIncomingOperatorId)
      ? latestIncomingOperatorId
      : null) ||
    latestAcceptedOperatorId ||
    previousReplyOperatorId ||
    null;

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

  const mergeOperatorResponses = useCallback((incomingResponses) => {
    if (incomingResponses.length === 0) {
      return;
    }

    setOperatorResponses((prev) => {
      const nextResponses = [...prev];

      incomingResponses.forEach((incomingResponse) => {
        const normalizedResponse = normalizeOperatorResponse({
          ...incomingResponse,
          source: "websocket",
        });
        const incomingId = normalizedResponse.requestId;

        const existingIndex = nextResponses.findIndex((response) => {
          const responseId =
            response.requestId ||
            response.id ||
            response.customerRequestId ||
            response.serviceRequestId;

          return (
            incomingId &&
            responseId &&
            String(responseId) === String(incomingId)
          );
        });

        if (existingIndex >= 0) {
          nextResponses[existingIndex] = {
            ...nextResponses[existingIndex],
            ...normalizedResponse,
          };
        } else {
          nextResponses.unshift(normalizedResponse);
        }
      });

      const sortedResponses = sortResponsesByTime(nextResponses);

      saveOperatorResponses(sortedResponses);
      return sortedResponses;
    });

    setResponsesLoading(false);
    setResponsesMessage("");
  }, []);

  const refreshResponses = async () => {
    setResponsesLoading(true);
    setResponsesMessage("");

    /*
      Previous REST response loader. WebSocket now delivers
      REQUEST_ACCEPTED_BY_OPERATOR messages from /ws/garage in real time.
      Refresh keeps this REST call as a fallback when the socket message is
      missed or the dashboard was opened after the DB update.
    */

    const response = await ApiService.getOperatorResponse();

    if (response?.error) {
      const savedResponses = getSavedOperatorResponses();

      setOperatorResponses(savedResponses);
      setResponsesMessage(
        savedResponses.length === 0
          ? response.message || "Waiting for live operator response."
          : ""
      );
      setResponsesLoading(false);
      return;
    }

    const responseList = getResponseList(response).map((operatorResponse) =>
      normalizeOperatorResponse({
        ...operatorResponse,
        source: "api",
      })
    );
    const customerScopedResponses = responseList.filter((operatorResponse) => {
      const responseCustomerId = getResponseCustomerId(operatorResponse);
      const responseCustomerEmail = getResponseCustomerEmail(operatorResponse);

      if (currentCustomerId && responseCustomerId) {
        return String(responseCustomerId) === String(currentCustomerId);
      }

      if (currentCustomerEmail && responseCustomerEmail) {
        return String(responseCustomerEmail) === String(currentCustomerEmail);
      }

      return !responseCustomerId && !responseCustomerEmail;
    });

    if (responseList.length > 0 && customerScopedResponses.length === 0) {
      const savedResponses = getSavedOperatorResponses();

      setOperatorResponses(savedResponses);
      setResponsesMessage(
        "Live accepted updates are shown here. The response API did not return customer-specific rows for this login."
      );
      setResponsesLoading(false);
      return;
    }

    const sortedResponses = sortResponsesByTime(customerScopedResponses);

    setOperatorResponses(sortedResponses);
    saveOperatorResponses(sortedResponses);
    setResponsesMessage(
      customerScopedResponses.length === 0
        ? "No response has been received for this customer account."
        : ""
    );
    setResponsesLoading(false);
  };

  useEffect(() => {
    const savedResponses = getSavedOperatorResponses();

    const unsubscribe = subscribeGarageWebSocket({
      onOpen: () => {
        if (savedResponses.length === 0) {
          setResponsesMessage("Listening for live operator response.");
        }
      },
      onMessage: ({ type, payload }) => {
        if (
          type &&
          type !== "REQUEST_ACCEPTED_BY_OPERATOR" &&
          type !== "NEW_CHAT_MESSAGE"
        ) {
          return;
        }

        if (type === "NEW_CHAT_MESSAGE") {
          addChatMessage({
            ...payload,
            direction: "incoming",
          });
          return;
        }

        const responseList = getResponseList(payload);

        if (responseList.length > 0) {
          mergeOperatorResponses(responseList);
        }
      },
      onClose: () => {
        setResponsesMessage("Live operator response connection closed.");
      },
      onError: () => {
        setResponsesMessage("Live operator response connection failed.");
      },
    });

    return () => {
      unsubscribe();
    };
  }, [addChatMessage, mergeOperatorResponses]);

  const handleSendChatMessage = () => {
    if (!chatText.trim()) {
      return;
    }

    if (!chatOperatorId) {
      setChatStatus("Cannot send yet because the operator id was not received.");
      return;
    }

    const chatPayload = {
      type: "CHAT_MESSAGE",
      senderId: String(chatCustomerId),
      receiverId: String(chatOperatorId),
      message: chatText.trim(),
    };

    if (sendGarageWebSocketMessage(chatPayload)) {
      addChatMessage({
        ...chatPayload,
        direction: "outgoing",
      });
      setChatText("");
      setChatStatus("");
    } else {
      setChatStatus("Message not sent because the live connection is offline.");
    }
  };

  /*
    Previous initial REST load for operator responses. Kept commented because
    /ws/garage now sends REQUEST_ACCEPTED_BY_OPERATOR in real time.

    useEffect(() => {
      let isMounted = true;

      const loadResponses = async () => {
        const response = await ApiService.getOperatorResponse();

        if (!isMounted) {
          return;
        }

        if (response?.error) {
          setOperatorResponses([]);
          setResponsesMessage(
            response.message || "Failed to load operator responses."
          );
          setResponsesLoading(false);
          return;
        }

        const responseList = getResponseList(response);
        setOperatorResponses(responseList);
        setResponsesMessage(
          responseList.length === 0
            ? "No response has been received for this customer account."
            : ""
        );
        setResponsesLoading(false);
      };

      loadResponses();

      return () => {
        isMounted = false;
      };
    }, []);
  */

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatStatus = (status) => {
    if (status === "APPROVED") {
      return "ACCEPTED";
    }

    return status || "PENDING";
  };

  const getStatusStyles = (status) => {
    if (status === "APPROVED" || status === "ACCEPTED") {
      return "border-green-400/30 bg-green-400/10 text-green-100";
    }

    if (status === "REJECTED") {
      return "border-red-400/30 bg-red-400/10 text-red-100";
    }

    return "border-blue-400/30 bg-blue-400/10 text-blue-100";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.16),transparent_30%)]" />

      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">Customer Dashboard</h1>
            <p className="text-sm text-slate-400">
              Service requests and operator responses
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refreshResponses}
              disabled={responsesLoading}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.1]"
            >
              {responsesLoading ? "Loading..." : "Refresh"}
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

      <main className="mx-auto max-w-7xl px-5 py-10">
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100">
                  Latest service update
                </span>
                <h2 className="mt-5 text-4xl font-black">
                  {latestResponse
                    ? formatStatus(latestResponse.status)
                    : "No operator response yet"}
                </h2>
                <p className="mt-3 max-w-2xl text-slate-300">
                  {latestResponse?.message ||
                    "When an operator accepts or rejects your request, the response appears here."}
                </p>
              </div>

              {latestResponse && (
                <span
                  className={`w-fit rounded-xl border px-4 py-2 text-sm font-black ${getStatusStyles(
                    latestResponse.status
                  )}`}
                >
                  {formatStatus(latestResponse.status)}
                </span>
              )}
            </div>

            {latestResponse && (
              <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Operator
                  </p>
                  <p className="mt-1 font-semibold text-slate-100">
                    {latestResponse.name || latestResponse.operatorName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Phone
                  </p>
                  <p className="mt-1 font-semibold text-slate-100">
                    {latestResponse.phoneNumber || latestResponse.phnumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Status
                  </p>
                  <p className="mt-1 font-semibold text-slate-100">
                    {formatStatus(latestResponse.status)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Message
                  </p>
                  <p className="mt-1 font-semibold text-slate-100">
                    {latestResponse.message || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {latestResponse && <RouteMap response={latestResponse} />}

            {latestResponse &&
              (latestResponse.status === "APPROVED" ||
                latestResponse.status === "ACCEPTED") && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black">Chat with Operator</h3>
                    <span className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-300">
                      {latestResponse.operatorName || "Operator"}
                    </span>
                  </div>

                  <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-xl bg-black/20 p-4">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No chat messages yet.
                      </p>
                    ) : (
                      chatMessages.map((chat) => {
                        const isMine = chat.direction === "outgoing";

                        return (
                          <div
                            key={chat.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                                isMine
                                  ? "bg-blue-500 text-white"
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
                      value={chatText}
                      onChange={(event) => setChatText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                          handleSendChatMessage();
                        }
                      }}
                      placeholder={
                        chatCustomerId && chatOperatorId
                          ? "Type a message"
                          : "Chat needs customer and operator ids"
                      }
                      rows="3"
                      className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={handleSendChatMessage}
                      disabled={!chatText.trim()}
                      className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                  {chatStatus && (
                    <p className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-100">
                      {chatStatus}
                    </p>
                  )}
                </div>
              )}

            <button
              onClick={() => navigate("/customer/find-garage")}
              className="mt-6 rounded-2xl bg-blue-500 px-6 py-3 font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
            >
              Find Nearby Garage
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-xl font-black">Request Summary</h3>
            <div className="mt-5 grid gap-4">
              <div className="rounded-xl bg-white/[0.05] p-4">
                <p className="text-sm text-slate-400">Operator responses</p>
                <p className="mt-1 text-3xl font-black">{visibleResponses.length}</p>
              </div>
              <div className="rounded-xl bg-white/[0.05] p-4">
                <p className="text-sm text-slate-400">Current customer ID</p>
                <p className="mt-1 break-all text-lg font-bold">
                  {currentCustomerId || "Not found in token"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black">Operator Response History</h2>
              <p className="mt-1 text-sm text-slate-400">
                Accepted and rejected service request responses
              </p>
            </div>
          </div>

          {visibleResponses.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-8 text-center text-slate-300">
              {responsesLoading
                ? "Loading operator responses..."
                : responsesMessage ||
                  "No response has been received for this customer account."}
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {visibleResponses.map((response, index) => (
                <div
                  key={response.id || response.responseId || index}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black">
                          {response.name || response.operatorName || "Operator response"}
                        </h3>
                        <span
                          className={`rounded-xl border px-3 py-1.5 text-xs font-black ${getStatusStyles(
                            response.status
                          )}`}
                        >
                          {formatStatus(response.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {response.message}
                      </p>
                    </div>

                    {response.respondedAt && (
                      <p className="text-sm text-slate-500">
                        {new Date(response.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                      <span className="block text-slate-500">Phone</span>
                      <span className="font-semibold">
                        {response.phoneNumber || response.phnumber || "N/A"}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                      <span className="block text-slate-500">Status</span>
                      <span className="font-semibold">
                        {formatStatus(response.status)}
                      </span>
                    </div>
                  </div>

                  <RouteMap response={response} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
