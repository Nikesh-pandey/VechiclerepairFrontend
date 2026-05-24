import { getToken } from "../utils/auth.js";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080/";
const WS_URL = import.meta.env.VITE_WS_URL || "/ws/garage";
const GARAGE_SOCKET_EVENT = "garage-websocket-message";

let sharedSocket = null;
let closeTimer = null;
const subscribers = new Set();

const buildGarageWebSocketUrl = () => {
  const baseUrl = new URL(API_BASE_URL, window.location.origin);
  const wsProtocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = new URL(WS_URL, `${wsProtocol}//${baseUrl.host}`);
  const token = getToken();

  if (token) {
    wsUrl.searchParams.set("token", token);
  }

  return wsUrl.toString();
};

const notifySubscribers = (handlerName, value) => {
  subscribers.forEach((subscriber) => {
    subscriber?.[handlerName]?.(value);
  });
};

export const parseGarageSocketMessage = (message) => {
  const rawData = message?.data ?? message;

  try {
    const parsedData =
      typeof rawData === "string" ? JSON.parse(rawData) : rawData;

    const type =
      parsedData?.type ||
      parsedData?.event ||
      parsedData?.messageType ||
      parsedData?.action ||
      "";

    const payload =
      parsedData?.payload ??
      parsedData?.data ??
      parsedData?.request ??
      parsedData?.response ??
      parsedData;

    return {
      type,
      payload,
      raw: parsedData,
    };
  } catch {
    return {
      type: "",
      payload: rawData,
      raw: rawData,
    };
  }
};

export const connectGarageWebSocket = ({ onMessage, onOpen, onClose, onError }) => {
  const socket = new WebSocket(buildGarageWebSocketUrl());

  socket.onopen = onOpen;
  socket.onclose = onClose;
  socket.onerror = onError;
  socket.onmessage = (event) => {
    onMessage?.(parseGarageSocketMessage(event));
  };

  return socket;
};

export const isGarageWebSocketConnected = () => {
  return sharedSocket?.readyState === WebSocket.OPEN;
};

export const sendGarageWebSocketMessage = (message) => {
  ensureSharedGarageWebSocket();

  if (!isGarageWebSocketConnected()) {
    return false;
  }

  sharedSocket.send(
    typeof message === "string" ? message : JSON.stringify(message)
  );
  return true;
};

const ensureSharedGarageWebSocket = () => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  if (
    sharedSocket &&
    (sharedSocket.readyState === WebSocket.OPEN ||
      sharedSocket.readyState === WebSocket.CONNECTING)
  ) {
    return sharedSocket;
  }

  const socket = new WebSocket(buildGarageWebSocketUrl());
  sharedSocket = socket;

  socket.onopen = (event) => {
    if (sharedSocket !== socket) {
      return;
    }

    notifySubscribers("onOpen", event);
  };

  socket.onmessage = (event) => {
    if (sharedSocket !== socket) {
      return;
    }

    const message = parseGarageSocketMessage(event);

    window.dispatchEvent(
      new CustomEvent(GARAGE_SOCKET_EVENT, { detail: message })
    );

    notifySubscribers("onMessage", message);
  };

  socket.onclose = (event) => {
    if (sharedSocket !== socket) {
      return;
    }

    notifySubscribers("onClose", event);
    sharedSocket = null;
  };

  socket.onerror = (event) => {
    if (sharedSocket !== socket) {
      return;
    }

    notifySubscribers("onError", event);
  };

  return socket;
};

export const subscribeGarageWebSocket = (subscriber = {}) => {
  subscribers.add(subscriber);
  ensureSharedGarageWebSocket();

  return () => {
    subscribers.delete(subscriber);

    if (subscribers.size === 0 && sharedSocket && !closeTimer) {
      closeTimer = window.setTimeout(() => {
        closeTimer = null;

        if (subscribers.size > 0 || !sharedSocket) {
          return;
        }

        const socketToClose = sharedSocket;

        if (socketToClose.readyState === WebSocket.CONNECTING) {
          socketToClose.onopen = () => {
            socketToClose.close();
          };
          socketToClose.onmessage = null;
          socketToClose.onclose = null;
          socketToClose.onerror = null;
          sharedSocket = null;
          return;
        }

        socketToClose.onopen = null;
        socketToClose.onmessage = null;
        socketToClose.onclose = null;
        socketToClose.onerror = null;
        socketToClose.close();
        sharedSocket = null;
      }, 500);
    }
  };
};

export { GARAGE_SOCKET_EVENT };
