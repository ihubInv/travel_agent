
import React from "react";

const flights = [
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "08:30 – 10:55",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,036",
    tags: ["Best", "Cheapest"],
  },
  {
    airline: "Akasa Air",
    logo: "https://storage.googleapis.com/a1aa/image/15ad8ac3-9dd9-4c73-cfb1-ad578d779d97.jpg",
    time: "10:00 – 12:25",
    route: "DEL - BOM · 2h 25m · Direct",
    price: "₹ 5,043",
    tags: [],
  },
];

export default function TestPage() {
  return (
    <main className="bg-[#121916] text-[#e1e3e3] min-h-screen flex justify-center p-4 font-['Inter']">
      <section className="max-w-3xl w-full">
        <div className="flex items-center gap-2 mb-3">
          <i className="fas fa-plane-departure text-[#e1e3e3] text-base" />
          <h1 className="font-semibold text-white text-base leading-5">Flight results</h1>
        </div>

        <div className="bg-[#1f292b] rounded-xl p-5">
          <h2 className="font-semibold text-white text-lg leading-6 mb-1">
            Flights DEL <span className="text-[#9ca3af]">→</span> BOM
          </h2>
          <p className="text-[#9ca3af] text-sm leading-5 mb-1">
            New Delhi, India <span className="text-[#9ca3af]">→</span> Mumbai, India
          </p>
          <p className="text-[#6b7280] text-xs leading-4 mb-1">
            One-way · 20 Jun · 1 adult · Economy
          </p>
          <p className="text-[#9ca3af] text-xs leading-4 mb-4">3 of 336 matching flights</p>

          {flights.map((flight, index) => (
            <article
              key={index}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2a3a3c] py-4"
            >
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <img
                  src={flight.logo}
                  alt={`${flight.airline} logo`}
                  className="w-6 h-6 flex-shrink-0"
                  width="24"
                  height="24"
                />
                <span className="text-[#e1e3e3] text-sm font-normal">{flight.airline}</span>
              </div>

              <div className="font-semibold text-white text-sm leading-5 mb-3 sm:mb-0">
                {flight.time}
              </div>

              <div className="text-[#6b7280] text-xs leading-4 mb-3 sm:mb-0 sm:flex-1 sm:text-center">
                {flight.route}
              </div>

              <div className="flex items-center gap-2 mb-3 sm:mb-0">
                {flight.tags.includes("Best") && (
                  <span className="bg-[#00405e] text-xs font-semibold rounded px-2 py-0.5">Best</span>
                )}
                {flight.tags.includes("Cheapest") && (
                  <span className="bg-[#0f7f3e] text-xs font-semibold rounded px-2 py-0.5">Cheapest</span>
                )}
              </div>

              <div className="text-right">
                <p className="text-white font-semibold text-lg leading-6">{flight.price}</p>
                <p className="text-[#9ca3af] text-xs leading-4">Economy</p>
              </div>

              <button
                aria-label="Add to favorites"
                className="ml-4 text-[#9ca3af] hover:text-white transition-colors"
              >
                <i className="far fa-heart text-lg" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

