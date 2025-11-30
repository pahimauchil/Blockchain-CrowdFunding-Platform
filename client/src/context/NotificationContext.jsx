import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "info",
  });

  const showToast = useCallback((message, type = "info") => {
    setToast({
      isVisible: true,
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const showSuccess = useCallback(
    (message) => showToast(message, "success"),
    [showToast]
  );

  const showError = useCallback(
    (message) => showToast(message, "error"),
    [showToast]
  );

  const showInfo = useCallback(
    (message) => showToast(message, "info"),
    [showToast]
  );

  const showWarning = useCallback(
    (message) => showToast(message, "warning"),
    [showToast]
  );

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

