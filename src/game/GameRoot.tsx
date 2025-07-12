import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { MainScene } from "./MainScene";
import { useJoystick } from "./ui/useJoystick";

export function GameRoot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { x, y } = useJoystick();
  
  useEffect(() => {
    let game: Phaser.Game | null = null;
    
    if (containerRef.current) {
      // Detectar se é mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      game = new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: containerRef.current,
        physics: { 
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        scene: [MainScene],
        backgroundColor: "#2e7d32",
        scale: { 
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: window.innerWidth,
          height: window.innerHeight
        },
        input: {
          touch: true,
          mouse: true
        }
      });
      
      // Atualizar tamanho quando a janela for redimensionada
      const handleResize = () => {
        if (game) {
          game.scale.resize(window.innerWidth, window.innerHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Prevenir zoom em mobile
      if (isMobile) {
        document.addEventListener('touchstart', (e) => {
          if (e.touches.length > 1) {
            e.preventDefault();
          }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
          if (e.touches.length > 1) {
            e.preventDefault();
          }
        }, { passive: false });
      }
      
      return () => {
        window.removeEventListener('resize', handleResize);
        game?.destroy(true);
      };
    }
  }, []);
  
  // Joystick para Phaser
  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).phaserScene && (x !== 0 || y !== 0)) {
        (window as any).phaserScene.joystickInput = { x, y };
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [x, y]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100vw", 
        height: "100vh",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1
      }} 
    />
  );
}
