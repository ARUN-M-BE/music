import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { Logo } from "../assets/image";
import { baseURLL } from "../config/config";
import Map from "./Map"

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [activeShape, setActiveShape] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveShape((prev) => (prev + 1) % shapes.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message should be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${baseURLL}send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        const data = await response.json();
        setSubmitStatus("error");
        console.error("Error:", data.message);
      }
    } catch (error) {
      setSubmitStatus("error");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-primary dark:bg-gray-900 dark:text-white">
      <Header />
      <main className="@container w-full max-w-7xl mt-[60px] mb-16 px-4 md:px-6 py-4 flex flex-col items-center">
        <div className="relative p-6 my-4 md:my-6 w-full flex flex-col items-center justify-center rounded-md border border-gray-300">
          <Map/>
        </div>
        <div className="min-h-screen bg-gradient-to-br p-6 from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 dark:text-white rounded-md border border-gray-300">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Left Side - Animation */}
              <motion.div
                className="w-full md:w-1/2 flex flex-col items-center justify-center p-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                  Let's Get In Touch
                </h1>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  {shapes.map((shape, index) => (
                    <motion.div
                      key={index}
                      className={`absolute ${shape.size} ${shape.color} ${
                        shape.shape === "triangle"
                          ? "clip-triangle"
                          : shape.shape === "hexagon"
                          ? "clip-hexagon"
                          : shape.shape
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: activeShape === index ? 1 : 0,
                        opacity: activeShape === index ? 1 : 0,
                        rotate: activeShape === index ? [0, 360] : 0,
                      }}
                      transition={{
                        duration: 1,
                        ease: "easeInOut",
                      }}
                    />
                  ))}

                  <motion.div
                    className="absolute text-2xl font-semibold text-gray-700"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    {activeShape === 0 && "Hello!"}
                    {activeShape === 1 && "Contact Us"}
                    {activeShape === 2 && "Get in Touch"}
                    {activeShape === 3 && "We're Here"}
                  </motion.div>
                </div>

                <motion.div
                  className="mt-8 text-gray-600 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p>Have questions or want to work together?</p>
                  <p>Fill out the form and we'll get back to you soon!</p>
                </motion.div>
              </motion.div>

              {/* Right Side - Form */}
              <motion.div
                className="w-full md:w-1/2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative p-8 bg-white rounded-xl shadow-2xl border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                  <div className="absolute -top-3 -right-3 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800 mb-6">
                    Send us a message
                  </h2>

                  {submitStatus === "success" && (
                    <motion.div
                      className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      Thank you! Your message has been sent successfully.
                    </motion.div>
                  )}

                  {submitStatus === "error" && (
                    <motion.div
                      className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      There was an error sending your message. Please try again
                      later.
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                          errors.name
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder=" "
                      />
                      <label
                        htmlFor="name"
                        className={`absolute left-4 px-1 transition-all duration-200 bg-white pointer-events-none ${
                          formData.name || errors.name
                            ? "-top-2 text-xs"
                            : "top-3 text-gray-500"
                        } ${
                          errors.name
                            ? "text-red-500"
                            : "peer-focus:text-blue-500"
                        }`}
                      >
                        Name
                      </label>
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder=" "
                      />
                      <label
                        htmlFor="email"
                        className={`absolute left-4 px-1 transition-all duration-200 bg-white pointer-events-none ${
                          formData.email || errors.email
                            ? "-top-2 text-xs"
                            : "top-3 text-gray-500"
                        } ${
                          errors.email
                            ? "text-red-500"
                            : "peer-focus:text-blue-500"
                        }`}
                      >
                        Email
                      </label>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="relative">
                      <textarea
                        id="message"
                        name="message"
                        rows="4"
                        value={formData.message}
                        onChange={handleChange}
                        className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                          errors.message ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder=" "
                      ></textarea>
                      <label
                        htmlFor="message"
                        className={`absolute left-4 px-1 transition-all duration-200 bg-white pointer-events-none ${
                          formData.message || errors.message
                          ? "-top-2 text-xs"
                          : "top-3 text-gray-500"
                      } ${
                        errors.message
                          ? "text-red-500"
                          : "peer-focus:text-blue-500"
                      }`}
                      >
                        Message
                      </label>
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.message}
                        </p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 px-6 rounded-lg text-white font-bold transition-all duration-300 ${
                        isSubmitting
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
                      }`}
                      whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    >
                      <span className="flex items-center justify-center">
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="ml-2 h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>

          {/* CSS for custom shapes */}
          <style jsx>{`
            .clip-triangle {
              clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            }
            .clip-hexagon {
              clip-path: polygon(
                25% 0%,
                75% 0%,
                100% 50%,
                75% 100%,
                25% 100%,
                0% 50%
              );
            }
          `}</style>
        </div>
      </main>
      <Footer />
    </div>
  );
};
const shapes = [
  // Circle
  {
    shape: "rounded-full",
    color: "bg-purple-300",
    size: "w-32 h-32",
  },
  // Triangle
  {
    shape: "triangle",
    color: "bg-blue-300",
    size: "w-32 h-32",
  },
  // Square
  {
    shape: "rounded-none",
    color: "bg-green-300",
    size: "w-32 h-32",
  },
  // Hexagon
  {
    shape: "hexagon",
    color: "bg-yellow-300",
    size: "w-32 h-32",
  },
];

export default Contact;
