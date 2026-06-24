import React, { useEffect, useState, useRef } from "react";
import Logo from "../assets/Logo.png";

// Inject keyframes once into the document head
const STYLES = `
@keyframes mo-ring-pulse {
  0%   { transform: scale(0.7);  opacity: 0.7; }
  70%  { transform: scale(1.6);  opacity: 0;   }
  100% { transform: scale(1.6);  opacity: 0;   }
}
@keyframes mo-logo-in {
  0%   { opacity: 0; transform: scale(0.6) translateY(12px); }
  60%  { opacity: 1; transform: scale(1.04) translateY(0);    }
  100% { opacity: 1; transform: scale(1)   translateY(0);    }
}
@keyframes mo-glow-breathe {
  0%,100% { opacity: 0.25; transform: scale(1);    }
  50%      { opacity: 0.55; transform: scale(1.15); }
}
@keyframes mo-text-fade {
  0%   { opacity: 0; letter-spacing: 0.35em; }
  100% { opacity: 1; letter-spacing: 0.25em; }
}
@keyframes mo-dot {
  0%,80%,100% { transform: scale(0); opacity: 0; }
  40%          { transform: scale(1); opacity: 1; }
}
@keyframes mo-progress {
  0%   { width: 0%;   }
  15%  { width: 22%;  }
  40%  { width: 51%;  }
  70%  { width: 74%;  }
  90%  { width: 92%;  }
  100% { width: 100%; }
}
@keyframes mo-orbit {
  from { transform: rotate(0deg)   translateX(72px) rotate(0deg);   }
  to   { transform: rotate(360deg) translateX(72px) rotate(-360deg); }
}
@keyframes mo-orbit-r {
  from { transform: rotate(0deg)   translateX(56px) rotate(0deg);   }
  to   { transform: rotate(-360deg) translateX(56px) rotate(360deg); }
}
@keyframes mo-overlay-out {
  0%   { opacity: 1;  }
  100% { opacity: 0;  }
}
@keyframes mo-particle-float {
  0%   { transform: translateY(0px)   scale(1);   opacity: 0.6; }
  50%  { transform: translateY(-18px) scale(1.3); opacity: 1;   }
  100% { transform: translateY(0px)   scale(1);   opacity: 0.6; }
}
`;

function injectStyles() {
  if (document.getElementById("mo-loader-styles")) return;
  const el = document.createElement("style");
  el.id = "mo-loader-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── Particle dot ─────────────────────────────────────────────────────────────
interface ParticleProps {
  x: number; y: number; delay: number; size: number; color: string;
}
const Particle: React.FC<ParticleProps> = ({ x, y, delay, size, color }) => (
  <div
    style={{
      position: "absolute",
      left: x + "%",
      top: y + "%",
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: color,
      animation: `mo-particle-float ${2.2 + delay * 0.4}s ease-in-out ${delay * 0.3}s infinite`,
      opacity: 0.5,
    }}
  />
);

const PARTICLES = [
  { x: 12, y: 20, delay: 0,   size: 5,  color: "#00AEEF" },
  { x: 85, y: 15, delay: 0.7, size: 4,  color: "#1A5FA8" },
  { x: 22, y: 75, delay: 1.2, size: 3,  color: "#00AEEF" },
  { x: 78, y: 72, delay: 0.4, size: 6,  color: "#1A5FA8" },
  { x: 50, y: 88, delay: 0.9, size: 4,  color: "#00AEEF" },
  { x: 8,  y: 50, delay: 1.5, size: 3,  color: "#1A5FA8" },
  { x: 92, y: 45, delay: 0.2, size: 5,  color: "#00AEEF" },
  { x: 40, y: 10, delay: 1.1, size: 4,  color: "#1A5FA8" },
];

// ─── Main loader ──────────────────────────────────────────────────────────────
interface AppLoaderProps {
  duration?: number; // ms before starting fade
  onDone?: () => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ duration = 2800, onDone }) => {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    injectStyles();

    // After `duration` ms, switch to exit
    timerRef.current = setTimeout(() => setPhase("exit"), duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration]);

  // After exit animation (600 ms) fires onDone
  useEffect(() => {
    if (phase !== "exit") return;
    const t = setTimeout(() => onDone?.(), 600);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  const navy = "#0A1628";
  const cyan = "#00AEEF";
  const blue = "#1A5FA8";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: navy,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        animation: phase === "exit" ? "mo-overlay-out 0.6s ease forwards" : undefined,
        pointerEvents: phase === "exit" ? "none" : "all",
      }}
    >
      {/* ── Background grid lines ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${cyan}12 1px, transparent 1px),
            linear-gradient(90deg, ${cyan}12 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* ── Corner gradient splashes ── */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300,
        borderRadius: "50%", background: `radial-gradient(circle, ${blue}55 0%, transparent 70%)` }} />
      <div style={{ position: "absolute", bottom: -80, right: -80, width: 260, height: 260,
        borderRadius: "50%", background: `radial-gradient(circle, ${cyan}33 0%, transparent 70%)` }} />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── Centre stage ── */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>

        {/* Pulse rings */}
        {[0, 0.55, 1.1].map((delay, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 140,
              height: 140,
              marginTop: -70,
              marginLeft: -70,
              borderRadius: "50%",
              border: `2px solid ${cyan}`,
              animation: `mo-ring-pulse 2.4s ease-out ${delay}s infinite`,
            }}
          />
        ))}

        {/* Glow blob behind logo */}
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${cyan}55 0%, transparent 70%)`,
            animation: "mo-glow-breathe 2s ease-in-out infinite",
          }}
        />

        {/* Orbiting dot 1 */}
        <div style={{ position: "absolute", width: 0, height: 0, top: "50%", left: "50%" }}>
          <div style={{
            width: 10, height: 10,
            borderRadius: "50%",
            backgroundColor: cyan,
            boxShadow: `0 0 10px ${cyan}`,
            animation: "mo-orbit 3s linear infinite",
          }} />
        </div>

        {/* Orbiting dot 2 (reverse, smaller) */}
        <div style={{ position: "absolute", width: 0, height: 0, top: "50%", left: "50%" }}>
          <div style={{
            width: 7, height: 7,
            borderRadius: "50%",
            backgroundColor: blue,
            boxShadow: `0 0 8px ${blue}`,
            animation: "mo-orbit-r 2s linear infinite",
          }} />
        </div>

        {/* Logo */}
        <img
          src={Logo}
          alt="MoRental"
          style={{
            width: 100,
            height: "auto",
            position: "relative",
            zIndex: 10,
            animation: "mo-logo-in 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s both",
            filter: "drop-shadow(0 0 18px rgba(0,174,239,0.5))",
          }}
        />

        {/* Status text */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          animation: "mo-text-fade 0.8s ease 0.8s both",
          zIndex: 10,
        }}>
          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            fontWeight: 600,
          }}>
            Initializing MoRental
          </p>

          {/* Loading dots */}
          <div style={{ display: "flex", gap: 7 }}>
            {[0, 0.2, 0.4].map((d, i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: cyan,
                  animation: `mo-dot 1.2s ease-in-out ${d}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: `${cyan}20`,
        }}
      >
        <div
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${blue}, ${cyan})`,
            boxShadow: `0 0 12px ${cyan}`,
            animation: `mo-progress ${duration}ms cubic-bezier(0.1,0,0.4,1) forwards`,
          }}
        />
      </div>

      {/* ── Bottom brand text ── */}
      <p style={{
        position: "absolute",
        bottom: 28,
        fontSize: 11,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: "0.15em",
        fontFamily: "sans-serif",
        textTransform: "uppercase",
        animation: "mo-text-fade 1s ease 1s both",
      }}>
        by Codico Software Solutions
      </p>
    </div>
  );
};

export default AppLoader;
