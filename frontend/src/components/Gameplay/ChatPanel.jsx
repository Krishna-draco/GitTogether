import React, { useEffect, useRef, useState } from "react";
import { Send, ChevronUp, ChevronDown, MessageSquare } from "lucide-react";
import { formatTime } from "../../utils/helpers";
import "../../styles/chat.css";

export const ChatPanel = ({ messages = [], onSendMessage, playerUsername }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendMessage?.(messageInput);
      setMessageInput("");
    }
  };

  const unreadCount = messages.length;

  return (
    <div className={`chat-panel ${isExpanded ? "expanded" : "collapsed"}`}>
      <div className="chat-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="chat-title">
          <MessageSquare size={18} />
          <h3>Live Chat</h3>
          {!isExpanded && unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <button className="chat-toggle">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet. Start collaborating!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-message ${msg.type} ${
                    msg.username === playerUsername ? "own" : "other"
                  }`}
                >
                  {msg.type === "alert" ? (
                    <div className="alert-content">
                      <span className="alert-icon">ℹ️</span>
                      <span className="alert-text">{msg.content}</span>
                      <span className="message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  ) : (
                    <div className="message-content">
                      <span className="message-user">{msg.username}</span>
                      <span className="message-text">{msg.content}</span>
                      <span className="message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!messageInput.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
