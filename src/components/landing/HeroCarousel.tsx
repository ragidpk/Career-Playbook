import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
  '/images/home-img-1.webp',
  '/images/home-img-2.webp',
  '/images/home-img-3.webp',
];

interface HeroCarouselProps {
  autoPlayInterval?: number;
}

export default function HeroCarousel({
  autoPlayInterval = 5000,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Auto-play
  useEffect(() => {
    const timer = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [goToNext, autoPlayInterval]);

  return (
    <div className="relative group">
      {/* Main Image Container */}
      <div className="aspect-[4/3] relative rounded-3xl shadow-elevated overflow-hidden bg-gray-100">
        {images.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 rounded-3xl overflow-hidden transition-all duration-500 ease-out ${
              index === currentIndex
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            }`}
          >
            <img
              src={src}
              alt={`Career professionals ${index + 1}`}
              className="w-full h-full object-cover rounded-3xl"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* Gradient overlay for text readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-3xl" />
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      <button
        type="button"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
