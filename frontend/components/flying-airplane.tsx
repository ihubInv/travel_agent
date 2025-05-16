"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";

const NUM_PLANES = 15; // Number of planes

export default function FlyingAirplanes() {
  const [planes, setPlanes] = useState<
    { id: number; x: number; y: number; speed: number; delay: number }[]
  >([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Generate plane positions only after component is mounted
      setPlanes(
        Array.from({ length: NUM_PLANES }, (_, i) => ({
          id: i,
          x: -200, // Start off-screen on the left
          y: Math.random() * window.innerHeight * 0.8, // Random height
          speed: Math.random() * 8 + 6, // Different speeds for each plane
          delay: Math.random() * 5, // Staggered start times
        }))
      );
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {planes.map((plane) => (
        <motion.div
          key={plane.id}
          className="absolute"
          initial={{ x: plane.x, y: plane.y, rotate: 0 }}
          animate={{
            x: window.innerWidth + 100, // Move right
            y: [plane.y, plane.y - 40, plane.y + 20, plane.y - 10, plane.y], // Smooth up/down flight pattern
            rotate: [15, 10, 5, 0, -5, -10, -15], // Adjusts for a natural tilt forward
          }}
          transition={{
            duration: plane.speed,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: plane.delay,
            y: {
              duration: plane.speed / 2,
              times: [0, 0.2, 0.5, 0.8, 1],
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            },
          }}
        >
          <div className="relative">
            {/* Glowing Effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary to-secondary blur-2xl opacity-40"></div>

            {/* Plane Icon (Facing Right) */}
            <div className="relative bg-white dark:bg-gray-900 rounded-full p-3 shadow-xl">
              <Plane className="h-10 w-10 text-primary transform rotate-[45deg]" />
            </div>

            {/* Airplane Trail */}
            <motion.div
              className="absolute left-[-30px] top-5 h-1 w-24 bg-gradient-to-r from-primary/50 to-transparent rounded-full"
              initial={{ opacity: 0.7, width: 0 }}
              animate={{ opacity: [0.7, 0.3, 0.7], width: [0, 100, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
        </motion.div>
      ))}

      {/* Cloud elements moving in the same direction */}
      <CloudElement className="top-[10%] left-[5%]" delay={2} duration={100} size="lg" />
      <CloudElement className="top-[25%] left-[15%]" delay={0} duration={120} size="md" />
      <CloudElement className="top-[18%] left-[50%]" delay={4} duration={110} size="sm" />
      <CloudElement className="top-[35%] left-[75%]" delay={6} duration={140} size="lg" />
      <CloudElement className="top-[45%] left-[90%]" delay={8} duration={160} size="md" />
    </div>
  );
}

// Cloud animation component
function CloudElement({
  className,
  delay,
  duration,
  size,
}: {
  className: string;
  delay: number;
  duration: number;
  size: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-16 h-6",
    md: "w-24 h-8",
    lg: "w-32 h-10",
  };

  return (
    <motion.div
      className={`absolute ${className} ${sizeClasses[size]} bg-white dark:bg-gray-700 rounded-full opacity-30 dark:opacity-20`}
      initial={{ x: "-100vw" }}
      animate={{ x: "100vw" }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    />
  );
}
