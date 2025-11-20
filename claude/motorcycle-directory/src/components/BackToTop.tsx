'use client';

import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-pointer shadow-[0_6px_20px_rgba(102,126,234,0.4)] transition-all duration-300 text-2xl border-none z-[1000] ${
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
      } hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(102,126,234,0.5)] md:bottom-8 md:right-8 md:w-[50px] md:h-[50px] max-md:bottom-5 max-md:right-5 max-md:w-[45px] max-md:h-[45px]`}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
