"use client";

import { useState, useEffect, useCallback } from "react";

const photos = [
  // Outdoor/Lifestyle
  "Photos/Tommy-og-photos/240322105621-tcv-reese.jpg",
  "Photos/Tommy-og-photos/240322105632-tcv-reese.jpg",
  "Photos/Tommy-og-photos/240322105650-tcv-reese.jpg",
  "Photos/Tommy-og-photos/240322105704-tcv-reese.jpg",
  "Photos/IMG_1070 (1).jpg",
  "Photos/IMG_1674 (1).jpg",
  "Photos/IMG_1861 (1).jpg",
  "Photos/IMG_1594 (1).jpg",
  "Photos/IMG_1420.jpg",
  // Exterior
  "Photos/IMG_4772.jpg",
  "Photos/IMG_4771.jpg",
  "Photos/IMG_4769.jpg",
  "Photos/IMG_4775.jpg",
  "Photos/IMG_4777 (1).jpg",
  "Photos/IMG_4778.jpg",
  "Photos/IMG_2212.jpg",
  "Photos/IMG_4765.jpg",
  "Photos/IMG_4766.jpg",
  "Photos/IMG_4767.jpg",
  "Photos/IMG_4768 (1).jpg",
  "Photos/IMG_4779.jpg",
  "Photos/IMG_4780.jpg",
  "Photos/IMG_4781.jpg",
  "Photos/IMG_4782.jpg",
  "Photos/IMG_4817.jpg",
  "Photos/IMG_4770.jpg",
  "Photos/IMG_4818.jpg",
  "Photos/IMG_4774.jpg",
  // Interior
  "Photos/Tommy-og-photos/240322110615-tcv-reese-2.jpg",
  "Photos/IMG_4792.jpg",
  "Photos/IMG_4761 (1).jpg",
  "Photos/IMG_4762.jpg",
  "Photos/IMG_4763.jpg",
  "Photos/IMG_4793.jpg",
  "Photos/IMG_4794.jpg",
  "Photos/IMG_4795.jpg",
  "Photos/IMG_4797.jpg",
  "Photos/IMG_4799.jpg",
  "Photos/IMG_4798.jpg",
  "Photos/IMG_4796.jpg",
  "Photos/IMG_4800.jpg",
  "Photos/IMG_1586 (1).jpg",
  "Photos/Tommy-og-photos/240322110201-tcv-reese-4-HDR.jpg",
  "Photos/Tommy-og-photos/240322110149-tcv-reese-3-HDR.jpg",
  "Photos/Tommy-og-photos/240322110209-tcv-reese-3-HDR.jpg",
  "Photos/Tommy-og-photos/240322110040-tcv-reese-2-HDR.jpg",
  "Photos/Tommy-og-photos/240322110114-tcv-reese-3-HDR.jpg",
  "Photos/Tommy-og-photos/240322110133-tcv-reese-HDR.jpg",
  "Photos/IMG_4807.jpg",
  "Photos/IMG_4805.jpg",
  "Photos/Tommy-og-photos/240322110140-tcv-reese-HDR.jpg",
  "Photos/IMG_4806.jpg",
  "Photos/IMG_4804 (1).jpg",
  "Photos/Tommy-og-photos/240322110047-tcv-reese-3-HDR.jpg",
  "Photos/IMG_4808.jpg",
  "Photos/IMG_4813.jpg",
  "Photos/IMG_4814.jpg",
  "Photos/IMG_4759.jpg",
  "Photos/IMG_4785 (1).jpg",
  "Photos/IMG_4758.jpg",
  "Photos/IMG_4760.jpg",
  "Photos/IMG_4784.jpg",
];

export default function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);

  const open = (i: number) => {
    setLightboxIndex(i);
    document.body.style.overflow = "hidden";
  };

  const close = useCallback(() => {
    setLightboxIndex(null);
    document.body.style.overflow = "";
  }, []);

  const next = useCallback(
    () => setLightboxIndex((i) => ((i ?? 0) + 1) % photos.length),
    []
  );

  const prev = useCallback(
    () =>
      setLightboxIndex(
        (i) => ((i ?? 0) - 1 + photos.length) % photos.length
      ),
    []
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxIndex, close, next, prev]);

  return (
    <>
      <section id="gallery" className="gallery">
        <div className="container">
          <h2 className="section-title">Photo Gallery</h2>
          <p className="section-subtitle">
            Explore every detail of this exceptional adventure van
          </p>
          <div className="gallery-grid">
            {photos.map((src, i) => (
              <div
                className="gallery-item"
                key={src}
                onClick={() => open(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/${src}`}
                  alt={`Van photo ${i + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <div
          className="lightbox active"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("lightbox"))
              close();
          }}
          onTouchStart={(e) => setTouchStartX(e.changedTouches[0].screenX)}
          onTouchEnd={(e) => {
            const diff = e.changedTouches[0].screenX - touchStartX;
            if (diff < -50) next();
            else if (diff > 50) prev();
          }}
        >
          <button className="lightbox-close" onClick={close}>
            &times;
          </button>
          <button className="lightbox-prev" onClick={prev}>
            &#8249;
          </button>
          <button className="lightbox-next" onClick={next}>
            &#8250;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="lightbox-image"
            src={`/${photos[lightboxIndex]}`}
            alt="Gallery image"
          />
          <div className="lightbox-counter">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
