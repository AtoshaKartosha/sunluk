"use client";

import { motion } from "framer-motion";

export const CharReveal = ({ text, className, stagger = 0.025, delay = 0, y = 24, duration = 0.5 }: { text: string; className?: string; stagger?: number; delay?: number; y?: number; duration?: number }) => (
  <motion.span
    initial="hidden"
    animate="visible"
    variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    className={className}
    aria-label={text}
  >
    {text.split("").map((char, i) => (
      <motion.span
        key={i}
        variants={{ hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0, transition: { duration, ease: [0.25, 0.1, 0.25, 1] } } }}
        className="inline-block"
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </motion.span>
);
