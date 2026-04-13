"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGSAPAnimations() {
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const creatorsRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const screenshotsRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const albumRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animations - Staggered entrance
      const heroElements = heroRef.current?.querySelectorAll(".gsap-hero-item");
      if (heroElements && heroElements.length > 0) {
        gsap.fromTo(
          heroElements,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out",
          }
        );
      }

      // Stats counter animation
      const statNumbers = statsRef.current?.querySelectorAll(".stat-number");
      statNumbers?.forEach((stat) => {
        const target = parseInt(stat.getAttribute("data-value") || "0");
        gsap.fromTo(
          stat,
          { innerText: 0 },
          {
            innerText: target,
            duration: 2,
            ease: "power2.out",
            snap: { innerText: 1 },
            scrollTrigger: {
              trigger: stat,
              start: "top 85%",
              once: true,
            },
          }
        );
      });

      // Features cards stagger
      const featureCards = featuresRef.current?.querySelectorAll(".feature-card");
      if (featureCards && featureCards.length > 0) {
        gsap.fromTo(
          featureCards,
          { y: 80, opacity: 0, rotateX: 15 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }

      // App cards 3D flip entrance
      const appCards = cardsRef.current?.querySelectorAll(".app-card");
      if (appCards && appCards.length > 0) {
        gsap.fromTo(
          appCards,
          { 
            y: 100, 
            opacity: 0, 
            rotateY: -30,
            transformPerspective: 1000 
          },
          {
            y: 0,
            opacity: 1,
            rotateY: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 70%",
              once: true,
            },
          }
        );
      }

      // Creators wave animation
      const creatorCards = creatorsRef.current?.querySelectorAll(".creator-card");
      if (creatorCards && creatorCards.length > 0) {
        gsap.fromTo(
          creatorCards,
          { y: 50, opacity: 0, scale: 0.8 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: {
              each: 0.08,
              from: "center",
            },
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: creatorsRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // Explore cards stagger
      const exploreCards = exploreRef.current?.querySelectorAll(".explore-card");
      if (exploreCards && exploreCards.length > 0) {
        gsap.fromTo(
          exploreCards,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: exploreRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // Screenshot cards stagger
      const screenshotCards = screenshotsRef.current?.querySelectorAll(".screenshot-card");
      if (screenshotCards && screenshotCards.length > 0) {
        gsap.fromTo(
          screenshotCards,
          { y: 80, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: screenshotsRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }

      // How it works stagger
      const howCards = howItWorksRef.current?.querySelectorAll(".howitworks-card");
      if (howCards && howCards.length > 0) {
        gsap.fromTo(
          howCards,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: howItWorksRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // Album cards stagger
      const albumCards = albumRef.current?.querySelectorAll(".album-card");
      if (albumCards && albumCards.length > 0) {
        gsap.fromTo(
          albumCards,
          { y: 70, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: albumRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // CTA dramatic entrance
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { scale: 0.9, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Parallax effects for background elements
      gsap.utils.toArray<HTMLElement>(".parallax-slow").forEach((el) => {
        gsap.to(el, {
          yPercent: -20,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });

      // Floating animation for icons
      gsap.utils.toArray<HTMLElement>(".float-animation").forEach((el) => {
        gsap.to(el, {
          y: -10,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        });
      });

    });

    return () => ctx.revert();
  }, []);

  return { heroRef, statsRef, featuresRef, cardsRef, creatorsRef, exploreRef, screenshotsRef, howItWorksRef, albumRef, ctaRef };
}

// Hook for hover animations
export function useHoverAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onEnter = () => {
      gsap.to(element, {
        scale: 1.03,
        y: -5,
        boxShadow: "0 20px 40px rgba(201, 168, 76, 0.2)",
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const onLeave = () => {
      gsap.to(element, {
        scale: 1,
        y: 0,
        boxShadow: "0 0 0 rgba(201, 168, 76, 0)",
        duration: 0.3,
        ease: "power2.out",
      });
    };

    element.addEventListener("mouseenter", onEnter);
    element.addEventListener("mouseleave", onLeave);

    return () => {
      element.removeEventListener("mouseenter", onEnter);
      element.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return ref;
}

// Hook for magnetic button effect
export function useMagneticButton() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const button = ref.current;
    if (!button) return;

    const onMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(button, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const onLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)",
      });
    };

    button.addEventListener("mousemove", onMove as EventListener);
    button.addEventListener("mouseleave", onLeave as EventListener);

    return () => {
      button.removeEventListener("mousemove", onMove as EventListener);
      button.removeEventListener("mouseleave", onLeave as EventListener);
    };
  }, []);

  return ref;
}
