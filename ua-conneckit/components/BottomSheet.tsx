"use client";

import { useState, useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullScreen?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  fullScreen = false,
}: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      currentYRef.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!sheetRef.current) return;
    if (currentYRef.current > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = "";
    }
    startYRef.current = null;
    currentYRef.current = 0;
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center touch-none"
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${isAnimating ? "opacity-80" : "opacity-0"}`}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div
        ref={sheetRef}
        className={`relative bg-[#1a1a1a] ${fullScreen ? "h-full" : "max-h-[90vh]"} w-full max-w-md rounded-t-3xl overflow-hidden touch-auto`}
        style={{
          transform: isAnimating ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingTop: "env(safe-area-inset-top)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-14 h-1.5 bg-gray-500 rounded-full" />
        </div>
        <div
          className={`overflow-auto ${fullScreen ? "h-[calc(100%-40px)]" : "max-h-[calc(90vh-40px)]"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
