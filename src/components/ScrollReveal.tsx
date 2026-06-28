import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  yOffset?: number;
  duration?: number;
  delay?: number;
  triggerOffset?: string;
}

const ScrollReveal = ({
  children,
  className = '',
  yOffset = 30,
  duration = 0.6,
  delay = 0,
  triggerOffset = 'top 85%'
}: ScrollRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: yOffset },
        {
          opacity: 1,
          y: 0,
          duration: duration * 1.5,
          delay: delay,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: triggerOffset,
            toggleActions: 'play none none none'
          }
        }
      );
    });

    return () => ctx.revert();
  }, [yOffset, duration, delay, triggerOffset]);

  return (
    <div ref={containerRef} className={`will-change-[opacity,transform] ${className}`}>
      {children}
    </div>
  );
};

export default ScrollReveal;
