import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Waves,
  BedDouble,
  UtensilsCrossed,
  CalendarDays,
  MapPin,
  Sparkles,
  Wifi,
  Coffee,
  ShieldCheck,
  CircleCheck,
} from "lucide-react";

import "./App.css";
import AuthSection from "./components/AuthSection.jsx";

const roomImages = {
  SINGLE:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80",

  DOUBLE:
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",

  TRIPLE:
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",

  VIP: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
};

const experiences = [
  {
    icon: Waves,
    title: "Pool & Beach",
    description: "Unwind by the swimming pool and enjoy access to the sea.",
  },
  {
    icon: UtensilsCrossed,
    title: "Global Dining",
    description:
      "Discover Chinese, Italian, Indian and other food experiences.",
  },
  {
    icon: Coffee,
    title: "Bar & Room Service",
    description:
      "Enjoy convenient service during your stay, subject to hotel policies.",
  },
  {
    icon: CalendarDays,
    title: "Private Functions",
    description: "Plan celebrations, gatherings and exclusive hotel events.",
  },
];

function App() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function checkApi() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

        const response = await fetch(`${apiUrl}/api/health`);

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();

        if (active) {
          setApiStatus(data.status === "ok" ? "online" : "offline");
        }
      } catch {
        if (active) {
          setApiStatus("offline");
        }
      }
    }

    checkApi();

    return () => {
      active = false;
    };
  }, []);

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySearched, setAvailabilitySearched] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [bookingLoadingId, setBookingLoadingId] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRooms() {
      try {
        setRoomsLoading(true);
        setRoomsError("");

        const apiUrl = (
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        ).replace(/\/$/, "");

        const response = await fetch(`${apiUrl}/api/rooms`, {
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type");

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            `API returned HTML instead of JSON. Check URL: ${apiUrl}/api/rooms`,
          );
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load rooms.");
        }

        setRooms(result.data);

        console.log("Rooms loaded from database:", result.data);

        if (!response.ok || !result.success) {
          throw new Error("Unable to load rooms.");
        }

        setRooms(result.data);

        console.log("Rooms loaded from database:", result.data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Room loading error:", error);
          setRoomsError("Rooms could not be loaded. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setRoomsLoading(false);
        }
      }
    }

    fetchRooms();

    return () => {
      controller.abort();
    };
  }, []);

  async function handleAvailabilitySearch(event) {
    event.preventDefault();

    setAvailabilityError("");
    setAvailabilitySearched(true);

    if (!checkIn || !checkOut) {
      setRooms([]);
      setAvailabilityError("Please select check-in and check-out dates.");
      return;
    }

    if (checkOut <= checkIn) {
      setRooms([]);
      setAvailabilityError("Check-out date must be after check-in date.");
      return;
    }

    setAvailabilityLoading(true);
    setRoomsError("");

    try {
      const apiUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      ).replace(/\/$/, "");

      const params = new URLSearchParams({
        checkIn,
        checkOut,
        guests,
      });

      const response = await fetch(
        `${apiUrl}/api/rooms/availability?${params.toString()}`,
      );

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "The server did not return JSON. Please check the API URL.",
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to check room availability.");
      }

      setRooms(result.data);

      console.log("Available rooms:", result.data);
    } catch (error) {
      console.error("Availability search error:", error);

      setRooms([]);
      setAvailabilityError(
        error.message || "Unable to check room availability.",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function handleCreateBooking(room) {
    setBookingError("");
    setBookingMessage("");

    if (!checkIn || !checkOut) {
      setBookingError("Please select your check-in and check-out dates first.");
      document.getElementById("rooms")?.scrollIntoView({
        behavior: "smooth",
      });
      return;
    }

    if (checkOut <= checkIn) {
      setBookingError("Check-out must be after check-in.");
      return;
    }

    const token = sessionStorage.getItem("hotelToken");

    if (!token) {
      setBookingError("Please log in to book this room.");
      document.getElementById("account")?.scrollIntoView({
        behavior: "smooth",
      });
      window.location.hash = "account";
      return;
    }

    setBookingLoadingId(room.id);

    try {
      const apiUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      ).replace(/\/$/, "");

      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: room.id,
          checkIn,
          checkOut,
          guests: Number(guests),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to create your booking.");
      }

      setBookingMessage(
        `Booking request created successfully! Booking code: ${result.booking.bookingCode}. Status: ${result.booking.status}.`,
      );

      window.dispatchEvent(new CustomEvent("hotel:bookings-updated"));

      try {
        const apiUrl = (
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        ).replace(/\/$/, "");

        const params = new URLSearchParams({
          checkIn,
          checkOut,
          guests,
        });

        const availabilityResponse = await fetch(
          `${apiUrl}/api/rooms/availability?${params.toString()}`,
        );

        const availabilityResult = await availabilityResponse.json();

        if (availabilityResponse.ok && availabilityResult.success) {
          setRooms(availabilityResult.data);
        }
      } catch (refreshError) {
        console.error("Room availability refresh failed:", refreshError);
      }

      window.location.hash = "account";
      document.getElementById("account")?.scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      setBookingError(
        error.message || "Unable to create your booking. Please try again.",
      );
    } finally {
      setBookingLoadingId(null);
    }
  }

  return (
    <>
      <div className="announcement">
        A LITTLE MORE PARADISE, A LITTLE LESS EVERYDAY
      </div>

      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">
            <Waves size={25} />
          </span>
          <span>
            <strong>COASTLINE</strong>
            <small>RETREAT & RESORT</small>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#rooms">Stay</a>
          <a href="#dining">Dining</a>
          <a href="#experiences">Experiences</a>
          <a href="#events">Events</a>
          <a href="#account">Account</a>
        </nav>

        <a className="nav-cta" href="#rooms">
          Explore rooms <ArrowUpRight size={16} />
        </a>
      </header>

      <main>
        <section className="hero" id="home">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2200&q=90"
            alt="Beautiful tropical resort with a swimming pool"
          />

          <div className="hero-overlay" />

          <div className="hero-content">
            <span className="eyebrow">
              <Waves size={15} /> YOUR SEASIDE ESCAPE
            </span>

            <h1>
              Where the ocean
              <br />
              becomes part of
              <br />
              <em>your story.</em>
            </h1>

            <p>
              Wake up to sea views, slow down by the pool, and discover a stay
              made for memorable moments.
            </p>

            <div className="hero-actions">
              <a className="button button-light" href="#rooms">
                Explore our rooms <ArrowRight size={17} />
              </a>

              <a className="button button-outline" href="#experiences">
                Discover the resort
              </a>
            </div>
          </div>

          <div className="hero-bottom">
            <span>
              <MapPin size={16} /> A place by the sea
            </span>
            <span>STAY · DINE · CELEBRATE</span>
          </div>
        </section>

        <section className="welcome section-wrap">
          <div>
            <span className="eyebrow eyebrow-dark">WELCOME TO COASTLINE</span>
            <h2>
              Your own corner
              <br />
              of <em>the coast.</em>
            </h2>
          </div>

          <div className="welcome-copy">
            <p>
              From intimate rooms to VIP stays, delicious dining and special
              celebrations, bring all your favourite moments together in one
              seaside destination.
            </p>

            <div className="api-badge">
              <span
                className={`status-dot ${
                  apiStatus === "online" ? "status-online" : ""
                }`}
              />
              {apiStatus === "checking"
                ? "Checking backend connection..."
                : apiStatus === "online"
                  ? "Hotel API connected"
                  : "Hotel API offline — start the backend"}
            </div>
          </div>
        </section>

        <section className="rooms-section section-wrap" id="rooms">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow-dark">YOUR STAY, YOUR WAY</span>
              <h2>
                Find your <em>room.</em>
              </h2>
            </div>

            <p>
              Select your dates and guests to discover rooms available for your
              stay.
            </p>
          </div>

          <form
            className="availability-form"
            onSubmit={handleAvailabilitySearch}
          >
            <div className="availability-field">
              <label htmlFor="checkIn">Check-in</label>
              <input
                id="checkIn"
                type="date"
                required
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                min={
                  new Date().getFullYear() +
                  "-" +
                  String(new Date().getMonth() + 1).padStart(2, "0") +
                  "-" +
                  String(new Date().getDate()).padStart(2, "0")
                }
              />
            </div>

            <div className="availability-field">
              <label htmlFor="checkOut">Check-out</label>
              <input
                id="checkOut"
                type="date"
                required
                min={checkIn || undefined}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
              />
            </div>

            <div className="availability-field">
              <label htmlFor="guests">Guests</label>
              <select
                id="guests"
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>

            <button
              className="availability-button"
              type="submit"
              disabled={availabilityLoading}
            >
              {availabilityLoading ? "Checking..." : "Check Availability"}
              {!availabilityLoading && <ArrowRight size={17} />}
            </button>
          </form>

          {availabilityError && (
            <p className="availability-error" role="alert">
              {availabilityError}
            </p>
          )}

          {bookingError && (
            <p className="availability-error" role="alert">
              {bookingError}
            </p>
          )}

          {bookingMessage && (
            <p className="booking-success-message" role="status">
              {bookingMessage}
            </p>
          )}

          <div className="availability-results"></div>

          <div className="availability-results">
            {(roomsLoading || availabilityLoading) && (
              <p className="rooms-status">
                {availabilityLoading
                  ? "Checking available rooms..."
                  : "Loading rooms..."}
              </p>
            )}

            {!roomsLoading &&
              !availabilityLoading &&
              !availabilitySearched &&
              roomsError && (
                <p className="availability-error" role="alert">
                  {roomsError}
                </p>
              )}

            {!roomsLoading &&
              !availabilityLoading &&
              availabilitySearched &&
              !availabilityError &&
              rooms.length > 0 && (
                <p className="availability-results-note">
                  {rooms.length} room{rooms.length !== 1 ? "s" : ""} found for
                  your selected dates.
                </p>
              )}

            {!roomsLoading &&
              !availabilityLoading &&
              availabilitySearched &&
              !availabilityError &&
              rooms.length === 0 && (
                <p className="rooms-status">
                  No rooms are available for your selected dates and guest
                  count. Please try different dates.
                </p>
              )}

            {!roomsLoading &&
              rooms.map((room) => {
                const roomType =
                  room.type === "VIP"
                    ? "VIP"
                    : room.type.charAt(0) + room.type.slice(1).toLowerCase();

                const image = roomImages[room.type] || roomImages.SINGLE;

                return (
                  <article className="room-card" key={room.id}>
                    <div className="room-image-wrap">
                      <img
                        src={image}
                        alt={`${roomType} Room ${room.roomNumber}`}
                        loading="lazy"
                      />

                      <span className="room-number">{room.roomNumber}</span>
                    </div>

                    <div className="room-info">
                      <div className="room-meta">
                        <span>
                          <BedDouble size={15} />
                          {room.capacity}{" "}
                          {room.capacity === 1 ? "guest" : "guests"}
                        </span>

                        <span>{room.type} ROOM</span>
                      </div>

                      <h3>
                        {roomType} Room {room.roomNumber}
                      </h3>

                      <p>
                        {room.description ||
                          "A comfortable room for your stay."}
                      </p>

                      <p className="room-price">
                        <strong>
                          LKR{" "}
                          {Number(room.pricePerNight).toLocaleString("en-LK")}
                        </strong>{" "}
                        <span>/ night</span>
                      </p>

                      <button
                        type="button"
                        className="room-book-button"
                        onClick={() => handleCreateBooking(room)}
                        disabled={
                          bookingLoadingId !== null || availabilityLoading
                        }
                      >
                        {bookingLoadingId === room.id
                          ? "Submitting..."
                          : "Book This Room"}
                        {bookingLoadingId !== room.id && (
                          <ArrowRight size={16} />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        <section className="dining-section" id="dining">
          <div className="dining-image">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85"
              alt="Restaurant dining experience"
              loading="lazy"
            />
          </div>

          <div className="dining-content">
            <span className="eyebrow">A TABLE BY THE SEA</span>
            <h2>
              Good food.
              <br />
              <em>Great company.</em>
            </h2>

            <p>
              Explore flavours from around the world, from Indian favourites to
              Chinese classics and Italian-inspired dining. Reserve your table
              or enjoy room service during your stay.
            </p>

            <div className="cuisine-list">
              <span>Chinese</span>
              <span>Italian</span>
              <span>Indian</span>
              <span>More cuisines</span>
            </div>

            <a className="button button-light" href="#contact">
              Discover dining <ArrowRight size={17} />
            </a>
          </div>
        </section>

        <section className="experience-section section-wrap" id="experiences">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow-dark">MORE THAN A ROOM</span>
              <h2>
                Make it a <em>moment.</em>
              </h2>
            </div>
            <p>
              Add experiences and services to build the getaway that feels right
              for you.
            </p>
          </div>

          <div className="experience-grid">
            {experiences.map((item) => {
              const Icon = item.icon;

              return (
                <article className="experience-card" key={item.title}>
                  <div className="experience-icon">
                    <Icon size={24} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <ArrowUpRight className="experience-arrow" size={20} />
                </article>
              );
            })}
          </div>

          <div className="service-note">
            <Sparkles size={22} />
            <div>
              <strong>Your stay, your extras.</strong>
              <p>
                Airport transfers, additional beds, excursions and other hotel
                services will be available to add during the booking process
                where applicable.
              </p>
            </div>
          </div>
        </section>

        <section className="event-section" id="events">
          <div className="event-copy">
            <span className="eyebrow">A PLACE TO COME TOGETHER</span>
            <h2>
              Celebrate something <em>special.</em>
            </h2>
            <p>
              From birthdays and weddings to private gatherings, plan your event
              with tailored accommodation, dining and additional services.
            </p>

            <a href="#contact" className="button button-light">
              Enquire about an event <ArrowRight size={17} />
            </a>
          </div>

          <div className="event-feature">
            <ShieldCheck size={30} />
            <h3>Exclusive hotel bookings</h3>
            <p>
              Full-hotel function reservations will be managed alongside room
              and restaurant availability to help avoid double bookings.
            </p>
          </div>
        </section>

        <section className="trust-strip">
          <div>
            <CircleCheck size={20} />
            <span>Thoughtful hospitality</span>
          </div>
          <div>
            <Wifi size={20} />
            <span>Modern comforts</span>
          </div>
          <div>
            <Waves size={20} />
            <span>Seaside experiences</span>
          </div>
        </section>

        <AuthSection />
      </main>

      <footer className="footer" id="contact">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">
            <Waves size={25} />
          </span>
          <span>
            <strong>COASTLINE</strong>
            <small>RETREAT & RESORT</small>
          </span>
        </a>

        <p>A seaside escape for stays, dining and unforgettable occasions.</p>

        <a href="#home" className="text-link">
          Back to top ↑
        </a>

        <small className="copyright">
          © {new Date().getFullYear()} Coastline Retreat. Project preview.
        </small>
      </footer>
    </>
  );
}

export default App;
