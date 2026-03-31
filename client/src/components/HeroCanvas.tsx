import { useEffect, useRef } from "react";

const FRAME_COUNT = 192;

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const images = useRef<HTMLImageElement[]>([]);
  const currentFrame = useRef(0);

  // 🔥 Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();

      const num = String(i).padStart(5, "0"); // 00001 → 00192
      img.src = `/spiderman/${num}.png`;

      loadedImages.push(img);
    }

    images.current = loadedImages;

    // render first frame safely
    if (loadedImages[0]) {
      loadedImages[0].onload = () => render(0);
    }
  }, []);

  // 🎨 Render function (cover fit like CSS background)
  const render = (index: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const img = images.current[index];
    if (!img) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);

    // cover scaling
    const scale = Math.max(width / img.width, height / img.height);

    const x = width / 2 - (img.width / 2) * scale;
    const y = height / 2 - (img.height / 2) * scale;

    context.drawImage(
      img,
      x,
      y,
      img.width * scale,
      img.height * scale
    );
  };

  // 🧠 Smooth scroll animation (lerp for buttery feel)
  useEffect(() => {
    let targetFrame = 0;
    let rafId: number;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = window.innerHeight * 3;

      const progress = Math.min(scrollTop / maxScroll, 1);

      targetFrame = progress * (FRAME_COUNT - 1);
    };

    const animate = () => {
      const diff = targetFrame - currentFrame.current;

      // smooth interpolation
      currentFrame.current += diff * 0.1;

      const frameIndex = Math.floor(currentFrame.current);

      render(frameIndex);

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", handleScroll);
    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // 📱 Handle resize
  useEffect(() => {
    const handleResize = () => render(Math.floor(currentFrame.current));

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0"
    />
  );
}