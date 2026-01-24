import React, { useState } from "react";

const FAQ = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeAccordion, setActiveAccordion] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all");

    const faqs = [
        {
            category: "Shipping & Delivery",
            icon: "bi-truck",
            color: "primary",
            questions: [
                {
                    q: "How long does delivery take?",
                    a: "Standard delivery within Kisii University typically takes 2-4 hours. Deliveries outside the campus may take 1-2 business days.",
                    popular: true
                },
                {
                    q: "What are the delivery fees?",
                    a: "Delivery within the main campus is KES 50. Off-campus deliveries range from KES 100 to KES 300 depending on the distance."
                },
                {
                    q: "Do you offer same-day delivery?",
                    a: "Yes! Orders placed before 12 PM are eligible for same-day delivery within Kisii University premises. Orders after 12 PM will be delivered the next day."
                },
                {
                    q: "Can I track my delivery?",
                    a: "Yes, you can track your delivery in real-time through the 'My Orders' section. You'll receive SMS notifications at each stage of the delivery process."
                },
                {
                    q: "What are your delivery hours?",
                    a: "We deliver from 8:00 AM to 8:00 PM daily, including weekends and public holidays."
                }
            ]
        },
        {
            category: "Payments",
            icon: "bi-credit-card",
            color: "success",
            questions: [
                {
                    q: "Which payment methods do you accept?",
                    a: "We currently accept M-Pesa (Direct STK Push) and Cash on Delivery for select items. Bank transfers are also accepted for bulk orders.",
                    popular: true
                },
                {
                    q: "Is my payment information secure?",
                    a: "Yes, all M-Pesa transactions are handled through secure encrypted channels and we do not store your PIN or any sensitive payment information."
                },
                {
                    q: "Can I pay on delivery?",
                    a: "Cash on Delivery is available for orders above KES 500 within Kisii University. A small COD fee of KES 20 applies."
                },
                {
                    q: "Do you offer installment payments?",
                    a: "Currently, we only accept full payments. However, we're working on installment payment options for high-value items."
                }
            ]
        },
        {
            category: "Returns & Refunds",
            icon: "bi-arrow-left-right",
            color: "warning",
            questions: [
                {
                    q: "Can I return a product?",
                    a: "Yes, products can be returned within 24 hours of delivery if they are damaged, defective, or not as described. Some items may have different return policies.",
                    popular: true
                },
                {
                    q: "How do I get a refund?",
                    a: "Refunds are processed back to your M-Pesa number within 24 hours after a return is approved. For cash payments, refunds are processed within 3-5 business days."
                },
                {
                    q: "What items cannot be returned?",
                    a: "Perishable goods, personalized items, and opened software/media cannot be returned unless defective. Please check individual product pages for specific return policies."
                },
                {
                    q: "Who pays for return shipping?",
                    a: "If the return is due to our error or a defective product, we cover the return shipping costs. Otherwise, the customer is responsible for return shipping."
                }
            ]
        },
        {
            category: "Account & Orders",
            icon: "bi-person-circle",
            color: "info",
            questions: [
                {
                    q: "How do I create an account?",
                    a: "Click the 'Sign Up' button at the top right corner and follow the simple registration process. You'll need a valid email address and phone number."
                },
                {
                    q: "Can I modify or cancel my order?",
                    a: "Orders can be modified or cancelled within 30 minutes of placement. After that, please contact our support team for assistance."
                },
                {
                    q: "How do I track my order?",
                    a: "Go to 'My Orders' in your dashboard to see real-time tracking information. You'll also receive SMS updates."
                },
                {
                    q: "Why was my order declined?",
                    a: "Orders may be declined due to insufficient stock, payment issues, or delivery restrictions in your area. Check your email for specific details."
                }
            ]
        },
        {
            category: "Product & Quality",
            icon: "bi-box-seam",
            color: "purple",
            questions: [
                {
                    q: "Are your products genuine?",
                    a: "Yes, we source all products directly from authorized distributors and manufacturers. We guarantee the authenticity of all items sold."
                },
                {
                    q: "Do you offer warranties?",
                    a: "Most electronic products come with a manufacturer's warranty. Warranty details are listed on individual product pages."
                },
                {
                    q: "Can I see product specifications?",
                    a: "Complete specifications are available on each product page. You can also download PDF specifications for many products."
                }
            ]
        }
    ];

    const popularQuestions = faqs.flatMap(cat =>
        cat.questions.filter(q => q.popular).map(q => ({ ...q, category: cat.category, icon: cat.icon }))
    );

    const filteredFaqs = selectedCategory === "all"
        ? faqs.map(cat => ({
            ...cat,
            questions: cat.questions.filter(f =>
                f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.a.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0)
        : faqs.filter(cat => cat.category === selectedCategory).map(cat => ({
            ...cat,
            questions: cat.questions.filter(f =>
                f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.a.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0);

    const toggleAccordion = (index) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    return (
        <div className="container-fluid py-4 px-lg-5">
            {/* Hero Section */}
            <div className="text-center mb-5">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                    <i className="bi bi-question-circle text-primary display-4"></i>
                </div>
                <h1 className="fw-bold display-6 mb-3">Help & Support Center</h1>
                <p className="lead text-muted mb-4">
                    Find answers to common questions or contact our support team
                </p>
                <div className="mx-auto mt-4" style={{ maxWidth: "600px" }}>
                    <div className="input-group input-group-lg shadow-sm">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search text-primary"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="What can we help you with today?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="btn btn-outline-secondary border-start-0"
                                onClick={() => setSearchTerm("")}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>
                    <small className="text-muted mt-2 d-block">
                        Try searching for: "delivery time", "payment methods", "return policy"
                    </small>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="row mb-5">
                <div className="col-md-3">
                    <div className="text-center p-4 bg-white rounded shadow-sm border">
                        <i className="bi bi-headset display-4 text-primary mb-3"></i>
                        <h4 className="fw-bold">24/7 Support</h4>
                        <p className="text-muted mb-0">Always here to help</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="text-center p-4 bg-white rounded shadow-sm border">
                        <i className="bi bi-check-circle display-4 text-success mb-3"></i>
                        <h4 className="fw-bold">98% Solved</h4>
                        <p className="text-muted mb-0">Issues resolved instantly</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="text-center p-4 bg-white rounded shadow-sm border">
                        <i className="bi bi-lightning display-4 text-warning mb-3"></i>
                        <h4 className="fw-bold">Instant Response</h4>
                        <p className="text-muted mb-0">Avg. reply time: 15min</p>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="text-center p-4 bg-white rounded shadow-sm border">
                        <i className="bi bi-emoji-smile display-4 text-info mb-3"></i>
                        <h4 className="fw-bold">99% Satisfaction</h4>
                        <p className="text-muted mb-0">Happy customers</p>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Categories Sidebar */}
                <div className="col-lg-3 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0">
                            <h5 className="fw-bold mb-0">Categories</h5>
                        </div>
                        <div className="list-group list-group-flush">
                            <button
                                className={`list-group-item list-group-item-action border-0 ${selectedCategory === "all" ? "active bg-primary text-white" : ""}`}
                                onClick={() => setSelectedCategory("all")}
                            >
                                <i className="bi bi-grid me-2"></i>
                                All Questions
                                <span className="badge bg-light text-dark ms-auto">
                                    {faqs.reduce((sum, cat) => sum + cat.questions.length, 0)}
                                </span>
                            </button>
                            {faqs.map((cat, idx) => (
                                <button
                                    key={idx}
                                    className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${selectedCategory === cat.category ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat.category)}
                                >
                                    <div className={`bg-${cat.color} bg-opacity-10 rounded-circle p-2 me-3`}>
                                        <i className={`bi ${cat.icon} text-${cat.color}`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-medium">{cat.category}</div>
                                        <small className={`${selectedCategory === cat.category ? "text-white" : "text-muted"}`}>
                                            {cat.questions.length} questions
                                        </small>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-lg-9">
                    {/* Popular Questions */}
                    {searchTerm === "" && selectedCategory === "all" && (
                        <div className="mb-5">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="fw-bold mb-0">
                                    <i className="bi bi-star-fill text-warning me-2"></i>
                                    Most Popular Questions
                                </h4>
                                <span className="badge bg-warning">Frequently Asked</span>
                            </div>
                            <div className="row g-3">
                                {popularQuestions.map((q, idx) => (
                                    <div key={idx} className="col-md-6">
                                        <div className="card border-0 shadow-sm h-100 hover-lift">
                                            <div className="card-body">
                                                <div className="d-flex align-items-start mb-3">
                                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                                        <i className={`bi ${q.icon} text-primary`}></i>
                                                    </div>
                                                    <div>
                                                        <h6 className="fw-bold mb-1">{q.q}</h6>
                                                        <small className="text-muted">{q.category}</small>
                                                    </div>
                                                </div>
                                                <p className="text-muted small mb-0">{q.a.substring(0, 100)}...</p>
                                                <button
                                                    className="btn btn-link text-decoration-none p-0 mt-2"
                                                    onClick={() => {
                                                        setSelectedCategory(q.category);
                                                        // You could add logic to automatically open this specific question
                                                    }}
                                                >
                                                    Read full answer <i className="bi bi-arrow-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FAQ Accordions */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold mb-0">
                                {selectedCategory === "all" ? "All Questions" : selectedCategory}
                            </h4>
                            <span className="badge bg-light text-dark">
                                {filteredFaqs.reduce((sum, cat) => sum + cat.questions.length, 0)} questions
                            </span>
                        </div>

                        {filteredFaqs.length === 0 ? (
                            <div className="text-center py-5 my-5">
                                <i className="bi bi-search display-1 text-muted mb-3"></i>
                                <h5 className="fw-bold text-muted mb-2">No results found</h5>
                                <p className="text-muted mb-4">
                                    We couldn't find any questions matching "{searchTerm}"
                                </p>
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedCategory("all");
                                    }}
                                >
                                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                                    Clear search
                                </button>
                                <button
                                    className="btn btn-primary ms-2"
                                    onClick={() => {
                                        // Triggering the global chatbot toggle would be better, 
                                        // but for now we can just show a message.
                                        // In a real app, you'd use a context or a custom event.
                                        window.dispatchEvent(new CustomEvent('open-ai-chat'));
                                    }}
                                >
                                    <i className="bi bi-robot me-2"></i>
                                    Ask AI Assistant
                                </button>
                            </div>
                        ) : (
                            <div className="accordion" id="faqAccordion">
                                {filteredFaqs.map((cat, catIdx) => (
                                    <div key={catIdx} className="mb-4">
                                        {selectedCategory === "all" && (
                                            <div className="d-flex align-items-center mb-3">
                                                <div className={`bg-${cat.color} bg-opacity-10 rounded-circle p-2 me-3`}>
                                                    <i className={`bi ${cat.icon} text-${cat.color}`}></i>
                                                </div>
                                                <h5 className="fw-bold text-dark mb-0">{cat.category}</h5>
                                                <span className="badge bg-light text-dark ms-2">
                                                    {cat.questions.length}
                                                </span>
                                            </div>
                                        )}
                                        <div className="accordion-wrapper">
                                            {cat.questions.map((faq, faqIdx) => {
                                                const uniqueId = `${catIdx}-${faqIdx}`;
                                                const isActive = activeAccordion === uniqueId;
                                                return (
                                                    <div
                                                        key={faqIdx}
                                                        className="card border-0 shadow-sm mb-3"
                                                    >
                                                        <div
                                                            className={`card-header bg-white border-0 py-3 ${isActive ? 'border-bottom-0' : ''}`}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => toggleAccordion(uniqueId)}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div className="d-flex align-items-center">
                                                                    <div className={`bg-${cat.color} bg-opacity-10 rounded-circle p-2 me-3`}>
                                                                        <i className={`bi ${isActive ? 'bi-dash' : 'bi-plus'} text-${cat.color}`}></i>
                                                                    </div>
                                                                    <h6 className="fw-bold mb-0 me-3">{faq.q}</h6>
                                                                    {faq.popular && (
                                                                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning">
                                                                            Popular
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <i className={`bi bi-chevron-${isActive ? 'up' : 'down'} text-muted`}></i>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`collapse ${isActive ? 'show' : ''}`}>
                                                            <div className="card-body pt-0">
                                                                <div className="border-start border-3 border-primary ps-3 py-2">
                                                                    <p className="text-muted mb-0">{faq.a}</p>
                                                                </div>
                                                                {faqIdx === cat.questions.length - 1 && (
                                                                    <div className="mt-3 pt-3 border-top">
                                                                        <small className="text-muted">
                                                                            <i className="bi bi-info-circle me-1"></i>
                                                                            This information was last updated on {new Date().toLocaleDateString()}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contact CTA */}
            <div className="row mt-5">
                <div className="col-12">
                    <div className="card border-0 bg-gradient-primary text-white overflow-hidden rounded-4 shadow-lg">
                        <div className="card-body p-5">
                            <div className="row align-items-center">
                                <div className="col-lg-8">
                                    <h2 className="fw-bold mb-3">Still need help?</h2>
                                    <p className="mb-4 opacity-75">
                                        Can't find what you're looking for? Our dedicated support team is ready to assist you
                                        with any questions or concerns you may have.
                                    </p>
                                    <div className="d-flex flex-wrap gap-3">
                                        <a href="tel:+254700000000" className="btn btn-light text-primary fw-bold">
                                            <i className="bi bi-telephone me-2"></i> Call Support
                                        </a>
                                        <a href="mailto:support@kustore.com" className="btn btn-outline-light">
                                            <i className="bi bi-envelope me-2"></i> Email Support
                                        </a>
                                        <a
                                            href="https://wa.me/254700000000"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-light"
                                        >
                                            <i className="bi bi-whatsapp me-2"></i> WhatsApp
                                        </a>
                                    </div>
                                </div>
                                <div className="col-lg-4 text-center d-none d-lg-block">
                                    <i className="bi bi-headset display-1 opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-5">
                <small className="text-muted">
                    <i className="bi bi-shield-check me-1"></i>
                    All information is kept up-to-date and accurate to the best of our knowledge.
                </small>
            </div>

            <style jsx>{`
                .hover-lift:hover {
                    transform: translateY(-5px);
                    transition: all 0.3s ease;
                }
                
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
                }
                
                .accordion-wrapper .card {
                    transition: all 0.3s ease;
                }
                
                .accordion-wrapper .card:hover {
                    border-color: var(--bs-primary) !important;
                }
                
                .accordion-wrapper .card-header {
                    transition: all 0.3s ease;
                }
                
                .accordion-wrapper .card-header:hover {
                    background-color: rgba(13, 110, 253, 0.05);
                }
                
                /* Smooth accordion animation */
                .collapse {
                    transition: all 0.3s ease;
                }
                
                .text-purple {
                    color: #6f42c1 !important;
                }
                
                .bg-purple {
                    background-color: #6f42c1 !important;
                }
            `}</style>
        </div>
    );
};

export default FAQ;