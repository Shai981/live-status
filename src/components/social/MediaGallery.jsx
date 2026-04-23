import { useState } from "react";
import { X, Volume2, VolumeX } from "lucide-react";

export default function MediaGallery({ urls = [], types = [], removable = false, onRemove }) {
  const [muted, setMuted] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  if (!urls || urls.length === 0) return null;

  const images = urls.filter((_, i) => types[i] !== "video");
  const video = urls.find((_, i) => types[i] === "video");
  const videoIdx = types.indexOf("video");

  return (
    <div className="mt-3">
      {/* Video */}
      {video && (
        <div className="relative rounded-2xl overflow-hidden bg-black mb-2">
          <video
            src={video}
            className="w-full max-h-80 object-cover"
            autoPlay
            loop
            muted={muted}
            playsInline
          />
          <button
            onClick={() => setMuted((m) => !m)}
            className="absolute bottom-3 end-3 bg-black/50 text-white p-1.5 rounded-full"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {removable && (
            <button onClick={() => onRemove(videoIdx)} className="absolute top-2 end-2 bg-black/60 text-white p-1 rounded-full">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Images */}
      {images.length === 1 && (
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src={images[0]}
            className="w-full max-h-96 object-cover cursor-pointer"
            onClick={() => setLightbox(images[0])}
            alt=""
          />
          {removable && (
            <button onClick={() => onRemove(urls.indexOf(images[0]))} className="absolute top-2 end-2 bg-black/60 text-white p-1 rounded-full">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {images.length > 1 && (
        <div className={`grid gap-1.5 rounded-2xl overflow-hidden ${images.length === 2 ? "grid-cols-2" : images.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {images.slice(0, 4).map((url, i) => {
            const realIdx = urls.indexOf(url);
            return (
              <div key={i} className="relative aspect-square">
                <img
                  src={url}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightbox(url)}
                  alt=""
                />
                {removable && (
                  <button onClick={() => onRemove(realIdx)} className="absolute top-1 end-1 bg-black/60 text-white p-0.5 rounded-full">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {i === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-w-full max-h-full rounded-xl object-contain" alt="" />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
}