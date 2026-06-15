"use client";

import { motion } from "framer-motion";

type CharRevealProps = {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
  y?: number;
  duration?: number;
  playAnimation?: boolean;
};

export const CharReveal = ({
  text,
  className,
  stagger = 0.025,
  delay = 0,
  y = 0,
  duration = 0.5,
  playAnimation = true,
}: CharRevealProps) => {
  const words = text.split(" ");

  if (!playAnimation) {
    return (
      <span className={className} aria-label={text}>
        {text}
      </span>
    );
  }

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      className={className}
      aria-label={text}
    >
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block whitespace-nowrap">
          {word.split("").map((char, charIdx) => (
            <motion.span
              key={charIdx}
              variants={{ hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0, transition: { duration, ease: [0.25, 0.1, 0.25, 1] } } }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          {wordIdx < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </motion.span>
  );
};
