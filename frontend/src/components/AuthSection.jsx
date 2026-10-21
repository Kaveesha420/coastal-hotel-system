import { useEffect, useState } from "react";
import { UserRound, LogIn, UserPlus, LogOut, BedDouble } from "lucide-react";
import "./AuthSection.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function AuthSection() {
  const [mode, setMode] = useState("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [bookingActionError, setBookingActionError] = useState("");
  const [bookingActionMessage, setBookingActionMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const token = sessionStorage.getItem("hotelToken");

      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          sessionStorage.removeItem("hotelToken");
          return;
        }

        if (active) {
          setUser(result.user);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        // Keep the token so a temporary network issue does not
        // immediately log the customer out.
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      setBookingsError("");
      setBookingsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadMyBookings() {
      const token = sessionStorage.getItem("hotelToken");

      if (!token) {
        setBookingsError("Please log in again to view your bookings.");
        return;
      }

      try {
        setBookingsLoading(true);
        setBookingsError("");

        const response = await fetch(`${API_URL}/api/bookings/my-bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load your bookings.");
        }

        setBookings(result.data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("My bookings error:", error);
          setBookingsError(error.message || "Unable to load your bookings.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setBookingsLoading(false);
        }
      }
    }

    loadMyBookings();

    function handleBookingsUpdated() {
      loadMyBookings();
    }

    window.addEventListener("hotel:bookings-updated", handleBookingsUpdated);

    return () => {
      window.removeEventListener(
        "hotel:bookings-updated",
        handleBookingsUpdated,
      );

      controller.abort();
    };
  }, [user]);

  async function handleCancelBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) return;

    const token = sessionStorage.getItem("hotelToken");

    if (!token) {
      setBookingActionError("Please log in again to cancel your booking.");
      return;
    }

    setCancellingBookingId(bookingId);
    setBookingActionError("");
    setBookingActionMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to cancel this booking.");
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "CANCELLED" }
            : booking,
        ),
      );

      setBookingActionMessage(
        result.message || "Booking cancelled successfully.",
      );
    } catch (error) {
      setBookingActionError(
        error.message || "Unable to cancel this booking. Please try again.",
      );
    } finally {
      setCancellingBookingId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";

      const payload =
        mode === "register"
          ? { fullName, email, password, phone }
          : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Authentication failed.");
      }

      sessionStorage.setItem("hotelToken", result.token);
      setUser(result.user);
      setPassword("");
      setMessage(result.message);
    } catch (error) {
      setError(error.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("hotelToken");

    setUser(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setError("");
    setMessage("You have been logged out.");
    setMode("login");
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
  }

  return (
    <section className="account-section section-wrap" id="account">
      <div className="account-heading">
        <span className="eyebrow eyebrow-dark">YOUR COASTLINE ACCOUNT</span>

        <h2>
          Your stay starts <em>here.</em>
        </h2>

        <p>
          Create an account or log in to prepare for your next seaside stay.
        </p>
      </div>

      <div className="account-card">
        {user ? (
          <>
            <div className="account-profile">
              <div className="account-icon">
                <UserRound size={30} />
              </div>

              <span className="eyebrow eyebrow-dark">ACCOUNT CONNECTED</span>

              <h3>Welcome, {user.fullName}!</h3>
              <p>{user.email}</p>

              {user.phone && <p>{user.phone}</p>}

              <span className="account-role">{user.role}</span>

              {message && (
                <p className="account-success" role="status">
                  {message}
                </p>
              )}

              <button
                type="button"
                className="account-submit"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Log Out
              </button>
            </div>

            <section
              className="my-bookings"
              aria-labelledby="my-bookings-title"
            >
              <div className="my-bookings-heading">
                <div>
                  <span className="eyebrow eyebrow-dark">
                    YOUR RESERVATIONS
                  </span>
                  <h3 id="my-bookings-title">My Bookings</h3>
                </div>

                {!bookingsLoading && !bookingsError && (
                  <span className="booking-count">
                    {bookings.length}{" "}
                    {bookings.length === 1 ? "booking" : "bookings"}
                  </span>
                )}
              </div>

              {bookingsLoading && (
                <p className="booking-message" role="status">
                  Loading your bookings...
                </p>
              )}

              {bookingsError && (
                <p className="account-error" role="alert">
                  {bookingsError}
                </p>
              )}

              {bookingActionError && (
                <p className="account-error" role="alert">
                  {bookingActionError}
                </p>
              )}

              {bookingActionMessage && (
                <p className="account-success" role="status">
                  {bookingActionMessage}
                </p>
              )}

              {!bookingsLoading && !bookingsError && bookings.length === 0 && (
                <p className="booking-message">
                  You have no bookings yet. Explore our rooms to plan your stay.
                </p>
              )}

              <div className="booking-list">
                {!bookingsLoading &&
                  !bookingsError &&
                  bookings.map((booking) => {
                    const checkInDate = new Date(
                      booking.checkIn,
                    ).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    });

                    const checkOutDate = new Date(
                      booking.checkOut,
                    ).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    });

                    const totalAmount = Number(
                      booking.totalAmount,
                    ).toLocaleString("en-LK");

                    const statusClass = booking.status
                      .toLowerCase()
                      .replace(/_/g, "-");

                    return (
                      <article className="booking-card" key={booking.id}>
                        <div className="booking-card-top">
                          <div>
                            <span className="booking-label">BOOKING CODE</span>
                            <strong className="booking-code">
                              {booking.bookingCode}
                            </strong>
                          </div>

                          <span
                            className={`booking-status status-${statusClass}`}
                          >
                            {booking.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="booking-room">
                          <BedDouble size={21} />
                          <div>
                            <h4>
                              {booking.room
                                ? `${booking.room.type} Room ${booking.room.roomNumber}`
                                : booking.eventName || "Hotel Event"}
                            </h4>

                            <p>
                              {booking.type === "FULL_HOTEL_EVENT"
                                ? "Full-hotel event"
                                : `${booking.guests} ${
                                    booking.guests === 1 ? "guest" : "guests"
                                  }`}
                            </p>
                          </div>
                        </div>

                        <div className="booking-dates">
                          <div>
                            <span className="booking-label">CHECK-IN</span>
                            <strong>{checkInDate}</strong>
                          </div>

                          <div>
                            <span className="booking-label">CHECK-OUT</span>
                            <strong>{checkOutDate}</strong>
                          </div>
                        </div>

                        <div className="booking-total">
                          <span>Total amount</span>
                          <strong>LKR {totalAmount}</strong>
                        </div>

                        {["PENDING", "CONFIRMED"].includes(booking.status) && (
                          <div className="booking-actions">
                            <button
                              type="button"
                              className="booking-cancel-button"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingBookingId !== null}
                            >
                              {cancellingBookingId === booking.id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="account-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => changeMode("login")}
              >
                <LogIn size={17} />
                Login
              </button>

              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => changeMode("register")}
              >
                <UserPlus size={17} />
                Register
              </button>
            </div>

            <form className="account-form" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="account-field">
                  <label htmlFor="account-name">Full Name</label>

                  <input
                    id="account-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>
              )}

              <div className="account-field">
                <label htmlFor="account-email">Email Address</label>

                <input
                  id="account-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              {mode === "register" && (
                <div className="account-field">
                  <label htmlFor="account-phone">Phone Number (Optional)</label>

                  <input
                    id="account-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    maxLength={30}
                  />
                </div>
              )}

              <div className="account-field">
                <label htmlFor="account-password">Password</label>

                <input
                  id="account-password"
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  placeholder={
                    mode === "register"
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={mode === "register" ? 8 : undefined}
                  maxLength={72}
                  required
                />
              </div>

              {error && (
                <p className="account-error" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="account-success" role="status">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="account-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "register"
                    ? "Create Account"
                    : "Login to Your Account"}

                {!loading &&
                  (mode === "register" ? (
                    <UserPlus size={17} />
                  ) : (
                    <LogIn size={17} />
                  ))}
              </button>
            </form>

            <p className="account-switch">
              {mode === "login"
                ? "New to Coastline? "
                : "Already have an account? "}

              <button
                type="button"
                onClick={() =>
                  changeMode(mode === "login" ? "register" : "login")
                }
              >
                {mode === "login" ? "Create an account" : "Login"}
              </button>
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default AuthSection;
