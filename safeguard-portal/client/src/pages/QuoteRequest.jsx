import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuoteRequest.css";

// Create a form at https://formspree.io (sign up with gurjotsafeguardsolutions@gmail.com)
// and replace this with your form's endpoint, e.g. "https://formspree.io/f/abcdwxyz".
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwvdegzl";

export default function QuoteRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    locationType: "",
    address: "",
    serviceType: "Choose one",
    notes: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field if user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);

      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(formData)
      })
        .then((res) => {
          if (res.ok) {
            alert("Request submitted successfully");
            setFormData({
              name: "",
              email: "",
              phone: "",
              locationType: "",
              address: "",
              serviceType: "Choose one",
              notes: ""
            });
          } else {
            res.json().then((data) => {
              console.error("Error:", data);
              alert("Something went wrong");
            });
          }
        })
        .catch((err) => {
          console.error("Error:", err);
          alert("Something went wrong");
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      setErrors(validationErrors);
    }
  };

  return (
    <div className="quote-request-page">
      {/* Navigation */}
      <nav className="quote-nav">
        <div className="quote-nav-inner">
          <button 
            className="back-button"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>
          <div className="quote-nav-title">SafeGuard Solutions</div>
        </div>
      </nav>

      <div className="quote-container">
        <div className="quote-header">
          <h1>Request a Quote</h1>
          <p className="quote-subtitle">
            Fill out the form below and we'll get back to you with a personalized quote for your security needs.
          </p>
        </div>

        <div className="quote-form-card">
          <form onSubmit={handleSubmit} className="quote-form">
            <div className="form-group">
              <label htmlFor="name">
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="locationType">Business or Home Location</label>
              <input
                type="text"
                id="locationType"
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                placeholder="e.g., Business, Residential Home, Office Building"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="serviceType">Type of Service</label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
              >
                <option value="">Choose one</option>
                <option value="Security Cameras">Security Cameras</option>
                <option value="Alarm Systems">Alarm Systems</option>
                <option value="Access Control">Access Control</option>
                <option value="Security Consultation">Security Consultation</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Tell us more about your security needs, specific requirements, or any questions you have..."
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>

        <div className="quote-footer">
          <p className="disclaimer">
            By submitting this form, you agree to our <a href="/privacy">Privacy Policy</a>. 
            We'll contact you within 1-2 business days.
          </p>
          <p className="contact-info">
            Need immediate assistance? Call us at <strong>(236) 808-4666</strong> or email <strong>info@safeguardsolutions.ca</strong>
          </p>
        </div>
      </div>
    </div>
  );
}