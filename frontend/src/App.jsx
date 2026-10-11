
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

const rooms = [
  {
    name: "Ocean View Single",
    capacity: "1 guest",
    description: "A peaceful private retreat with beautiful ocean views.",
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Deluxe Double",
    capacity: "2 guests",
    description: "A comfortable stay designed for couples and friends.",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Family Triple",
    capacity: "3 guests",
    description: "Extra space for a relaxed family seaside getaway.",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "VIP Ocean Suite",
    capacity: "Suite accommodation",
    description: "An elevated stay with a little more privacy and comfort.",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
  },
];

const experiences = [
  {
    icon: Waves,
    title: "Pool & Beach",
    description:
      "Unwind by the swimming pool and enjoy access to the sea.",
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
    description:
      "Plan celebrations, gatherings and exclusive hotel events.",
  },
];

function App() {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function checkApi() {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:5000";

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
              Wake up to sea views, slow down by the pool,
              and discover a stay made for memorable moments.
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
              From intimate rooms to VIP stays, delicious dining and
              special celebrations, bring all your favourite moments
              together in one seaside destination.
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
              <h2>Find your <em>room.</em></h2>
            </div>

            <p>
              Four ways to make yourself at home.
              Room rates and live availability will be added in the
              booking stage.
            </p>
          </div>

          <div className="room-grid">
            {rooms.map((room, index) => (
              <article className="room-card" key={room.name}>
                <div className="room-image-wrap">
                  <img
                    src={room.image}
                    alt={room.name}
                    loading="lazy"
                  />
                  <span className="room-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="room-info">
                  <div className="room-meta">
                    <span>
                      <BedDouble size={15} /> {room.capacity}
                    </span>
                    <span>ROOM / SUITE</span>
                  </div>

                  <h3>{room.name}</h3>
                  <p>{room.description}</p>

                  <a href="#contact" className="text-link">
                    Enquire about this room <ArrowRight size={16} />
                  </a>
                </div>
              </article>
            ))}
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
            <h2>Good food.<br /><em>Great company.</em></h2>

            <p>
              Explore flavours from around the world, from Indian
              favourites to Chinese classics and Italian-inspired dining.
              Reserve your table or enjoy room service during your stay.
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
              <h2>Make it a <em>moment.</em></h2>
            </div>
            <p>
              Add experiences and services to build the getaway
              that feels right for you.
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
                Airport transfers, additional beds, excursions and
                other hotel services will be available to add during
                the booking process where applicable.
              </p>
            </div>
          </div>
        </section>

        <section className="event-section" id="events">
          <div className="event-copy">
            <span className="eyebrow">A PLACE TO COME TOGETHER</span>
            <h2>Celebrate something <em>special.</em></h2>
            <p>
              From birthdays and weddings to private gatherings,
              plan your event with tailored accommodation,
              dining and additional services.
            </p>

            <a href="#contact" className="button button-light">
              Enquire about an event <ArrowRight size={17} />
            </a>
          </div>

          <div className="event-feature">
            <ShieldCheck size={30} />
            <h3>Exclusive hotel bookings</h3>
            <p>
              Full-hotel function reservations will be managed
              alongside room and restaurant availability to help
              avoid double bookings.
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

        <p>
          A seaside escape for stays, dining and unforgettable occasions.
        </p>

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
