'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <motion.div
        className="text-3xl font-bold text-primary"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360],
          opacity: [1, 0.5, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <span className='text-9xl'>₹</span>
      </motion.div>
    </div>
  );
}