import { FC, useRef, useState, useEffect } from "react";

interface JoystickProps {
  onMove: (dir: { x: number; y: number }) => void;
}

export const Joystick: FC<JoystickProps> = ({ onMove }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);
  
  const handleStart = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setIsDragging(true);
    handleMove(clientX, clientY, centerX, centerY);
  };
  
  const handleMove = (clientX: number, clientY: number, centerX?: number, centerY?: number) => {
    if (!joystickRef.current || !isDragging) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const cX = centerX || rect.left + rect.width / 2;
    const cY = centerY || rect.top + rect.height / 2;
    
    const deltaX = clientX - cX;
    const deltaY = clientY - cY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * 1;
      normalizedY = (deltaY / distance) * 1;
    }
    
    // Clamp values between -1 and 1
    normalizedX = Math.max(-1, Math.min(1, normalizedX));
    normalizedY = Math.max(-1, Math.min(1, normalizedY));
    
    setPosition({ x: normalizedX * 30, y: normalizedY * 30 });
    onMove({ x: normalizedX, y: normalizedY });
  };
  
  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDragging) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMobile && isDragging) {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    }
  };
  
  useEffect(() => {
    if (!isMobile) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          handleMove(e.clientX, e.clientY);
        }
      };
      
      const handleGlobalMouseUp = () => {
        if (isDragging) {
          handleEnd();
        }
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, isMobile]);
  
  return (
    <div
      ref={joystickRef}
      className="fixed bottom-8 left-8 z-30 w-32 h-32 rounded-full bg-black/50 flex items-center justify-center touch-none select-none cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      style={{
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '2px solid rgba(255,255,255,0.3)'
      }}
    >
      <div 
        className="w-12 h-12 rounded-full bg-white/80 border-2 border-blue-400 transition-all duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};
