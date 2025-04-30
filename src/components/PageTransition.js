'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const PageTransition = ({ children }) => {
  useEffect(() => {
    window.requestIdleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    requestIdleCallback(() => {
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        if (link.href) {
          const url = new URL(link.href);
          if (url.origin === window.location.origin) {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = url.pathname;
            document.head.appendChild(prefetchLink);
          }
        }
      });
    });
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.75 }}
        transition={{ 
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;