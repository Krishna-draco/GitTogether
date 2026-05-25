import React from "react";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import "../styles/notification.css";

export const Notification = ({
  type = "info",
  title,
  message,
  onClose,
  autoClose = 5000,
}) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        {icons[type]}
        <div className="notification-text">
          {title && <div className="notification-title">{title}</div>}
          {message && <div className="notification-message">{message}</div>}
        </div>
      </div>
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export const ErrorBanner = ({ errors = [], onClose }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="error-banner">
      <div className="error-content">
        <XCircle size={20} />
        <div className="error-list">
          <h3>Verification Failed</h3>
          <ul>
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
      <button className="error-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};
