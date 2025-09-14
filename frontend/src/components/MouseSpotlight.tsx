import { useEffect, useState } from 'react';

export function MouseSpotlight() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <div className="spotlight-container" aria-hidden="true">
      <div
        className="spotlight"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        role="presentation"
      />
    </div>
  );
}