import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { axiosPrivate } from "../../api/axios";

const AIChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMsg = { role: "user", content: message };
        setHistory((prev) => [...prev, userMsg]);
        setMessage("");
        setLoading(true);

        try {
            const response = await axiosPrivate.post("/api/ai/chat", {
                message,
                history,
            });

            const aiMsg = { role: "assistant", content: response.data.response };
            setHistory((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat Error Context:", error.response?.data || error.message);
            const backendError = error.response?.data?.error || error.response?.data?.Message || error.message;
            const displayError = typeof backendError === 'string' ? backendError : "Connection issue. Please try again.";
            setHistory((prev) => [...prev, { role: "assistant", content: displayError }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-chatbot-container" style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
            {/* Chat Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-primary rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center"
                    style={{ width: "60px", height: "60px", border: "none", transition: "transform 0.3s ease" }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                    <i className="bi bi-chat-dots-fill fs-2"></i>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="card shadow-lg border-0" style={{ width: "350px", height: "500px", display: "flex", flexDirection: "column", borderRadius: "15px", overflow: "hidden" }}>
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
                        <div className="d-flex align-items-center">
                            <div className="bg-white rounded-circle p-1 me-2 d-flex align-items-center justify-content-center" style={{ width: "32px", height: "32px" }}>
                                <i className="bi bi-robot text-primary"></i>
                            </div>
                            <h6 className="mb-0 fw-bold">KuStore Assistant</h6>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="btn-close btn-close-white" aria-label="Close"></button>
                    </div>

                    <div className="card-body p-3 overflow-auto" style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
                        {history.length === 0 && (
                            <div className="text-center mt-4">
                                <i className="bi bi-stars text-primary display-4 opacity-25"></i>
                                <h6 className="mt-3 text-muted">How can I help you today?</h6>
                                <p className="small text-muted px-3">Ask me about delivery, payments, or returns!</p>
                            </div>
                        )}
                        {history.map((msg, idx) => (
                            <div key={idx} className={`d-flex mb-3 ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}>
                                <div
                                    className={`p-3 rounded-4 shadow-sm ${msg.role === "user" ? "bg-primary text-white" : "bg-white text-dark"}`}
                                    style={{
                                        maxWidth: "80%",
                                        borderRadius: msg.role === "user" ? "18px 18px 0 18px" : "18px 18px 18px 0",
                                        fontSize: "0.9rem",
                                        lineHeight: "1.4"
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="d-flex mb-3 justify-content-start align-items-center">
                                <div className="bg-white p-3 rounded-4 shadow-sm d-flex gap-1" style={{ borderRadius: "18px 18px 18px 0" }}>
                                    <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDuration: "0.6s" }}></div>
                                    <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDuration: "0.8s" }}></div>
                                    <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDuration: "1s" }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="card-footer bg-white border-0 p-3">
                        <form onSubmit={handleSendMessage} className="input-group">
                            <input
                                type="text"
                                className="form-control border-0 bg-light shadow-none"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                style={{ borderRadius: "10px 0 0 10px", padding: "12px" }}
                            />
                            <button
                                className="btn btn-primary px-3"
                                type="submit"
                                disabled={loading}
                                style={{ borderRadius: "0 10px 10px 0" }}
                            >
                                <i className="bi bi-send-fill"></i>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatBot;
