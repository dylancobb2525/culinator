'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Emoji = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
};

interface AnimatedBackgroundProps {
  emojis: string[];
}

export function AnimatedBackground({ emojis }: AnimatedBackgroundProps) {
  const [emojiElements, setEmojiElements] = useState<Emoji[]>([]);

  useEffect(() => {
    const elements: Emoji[] = [];
    
    // Create 15-25 emoji elements
    const count = Math.floor(Math.random() * 11) + 15;
    
    for (let i = 0; i < count; i++) {
      elements.push({
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 100, // random position as percentage of viewport
        y: Math.random() * 100,
        size: Math.floor(Math.random() * 30) + 20, // random size between 20-50px
        rotation: Math.random() * 360, // random rotation
        duration: Math.floor(Math.random() * 40) + 60, // random duration for floating animation
      });
    }
    
    setEmojiElements(elements);
  }, [emojis]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {emojiElements.map((item) => (
        <motion.div
          key={item.id}
          className="absolute opacity-20"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            fontSize: `${item.size}px`,
          }}
          animate={{
            y: [0, -20, 0, 20, 0],
            x: [0, 15, 0, -15, 0],
            rotate: [item.rotation, item.rotation + 10, item.rotation - 10, item.rotation],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
} 