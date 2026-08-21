// AgroFlow's custom icon set. Deliberately NOT a generic outline-icon
// library (Lucide/Feather etc.) dropped in flat -- each icon is drawn
// with a two-tone leaf/harvest gradient fill and a soft inner highlight,
// so on its own it already has dimension. Wrap in <IconTile> for the
// full soft-shadow neumorphic-glass treatment (embossed into frosted
// glass); use bare for smaller inline contexts (nav, list rows).
//
// One <svg> per icon, 24x24 viewBox, currentColor-free (gradients are
// self-contained via a unique id per icon so multiple instances on one
// page don't clash).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size = 24) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none" } as const;
}

export function LeafIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="leafGrad" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B5A2C" />
          <stop offset="1" stopColor="#57AC64" />
        </linearGradient>
      </defs>
      <path
        d="M4 20c0-8 4-14 15-15 0 11-6 15-13 15-1 0-2-1-2 0z"
        fill="url(#leafGrad)"
      />
      <path d="M6.5 18.5c3-4 6-7 11.5-11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function FarmIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="farmGrad" x1="2" y1="20" x2="22" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#164825" />
          <stop offset="1" stopColor="#87C98E" />
        </linearGradient>
      </defs>
      <path d="M3 20V11l6-5 6 5v9H3z" fill="url(#farmGrad)" />
      <path d="M13 20v-6l4-3.2 4 3.2V20h-8z" fill="url(#farmGrad)" opacity="0.85" />
      <rect x="8" y="15" width="2.4" height="5" rx="0.4" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

export function TruckIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="truckGrad" x1="2" y1="19" x2="22" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5A3B26" />
          <stop offset="1" stopColor="#E3A82E" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="8" width="11" height="8" rx="1.2" fill="url(#truckGrad)" />
      <path d="M13.5 11h4l3 3.2V16h-7v-5z" fill="url(#truckGrad)" opacity="0.85" />
      <circle cx="7" cy="17.5" r="1.7" fill="#3D2A1D" />
      <circle cx="17.5" cy="17.5" r="1.7" fill="#3D2A1D" />
      <circle cx="7" cy="17.5" r="0.6" fill="rgba(255,255,255,0.8)" />
      <circle cx="17.5" cy="17.5" r="0.6" fill="rgba(255,255,255,0.8)" />
    </svg>
  );
}

export function WarehouseIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="whGrad" x1="2" y1="20" x2="22" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5A3B26" />
          <stop offset="1" stopColor="#C29E7C" />
        </linearGradient>
      </defs>
      <path d="M2.5 10 12 4l9.5 6v10h-19V10z" fill="url(#whGrad)" />
      <rect x="10" y="14" width="4" height="6" rx="0.3" fill="rgba(255,255,255,0.75)" />
      <path d="M2.5 10 12 4l9.5 6" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function HandshakeIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="hsGrad" x1="2" y1="18" x2="22" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B5A2C" />
          <stop offset="1" stopColor="#E3A82E" />
        </linearGradient>
      </defs>
      <path
        d="M3 11.5 8 8l3 2.2L14 8l7 4-3 4.5-3.3-2-2.4 1.8a2 2 0 0 1-2.6-.1L7 14 3 11.5z"
        fill="url(#hsGrad)"
      />
      <path d="M8 8v7.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function CoinIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <radialGradient id="coinGrad" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#F3D98A" />
          <stop offset="1" stopColor="#A96F16" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#coinGrad)" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <path
        d="M12 7.2c-2 0-3 1-3 2.2 0 3 6 1.4 6 4.4 0 1.3-1.2 2.3-3 2.3s-3.1-1-3.2-2.4"
        stroke="#5C3A1A"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M12 6v1.4M12 16.6V18" stroke="#5C3A1A" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldCheckIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="shGrad" x1="4" y1="20" x2="20" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#237236" />
          <stop offset="1" stopColor="#B5DFB8" />
        </linearGradient>
      </defs>
      <path d="M12 2.5 20 6v6c0 5-3.5 8.3-8 9.5-4.5-1.2-8-4.5-8-9.5V6l8-3.5z" fill="url(#shGrad)" />
      <path d="M8.5 12.2 11 14.7l5-5.4" stroke="#F1F8F1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function UserIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="userGrad" x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#164825" />
          <stop offset="1" stopColor="#E3A82E" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="8.3" r="3.6" fill="url(#userGrad)" />
      <path d="M4.5 20c0-4.4 3.4-6.8 7.5-6.8s7.5 2.4 7.5 6.8" fill="url(#userGrad)" opacity="0.9" />
    </svg>
  );
}

export function PhoneUssdIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="phGrad" x1="6" y1="21" x2="18" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5A3B26" />
          <stop offset="1" stopColor="#87C98E" />
        </linearGradient>
      </defs>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.4" fill="url(#phGrad)" />
      <rect x="8.3" y="5" width="7.4" height="12.5" rx="0.6" fill="rgba(255,255,255,0.85)" />
      <circle cx="12" cy="19.2" r="0.9" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}

export function ChartIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="chartGrad" x1="3" y1="20" x2="21" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B5A2C" />
          <stop offset="1" stopColor="#F3D98A" />
        </linearGradient>
      </defs>
      <rect x="3.5" y="12" width="4" height="8" rx="1" fill="url(#chartGrad)" />
      <rect x="10" y="7" width="4" height="13" rx="1" fill="url(#chartGrad)" opacity="0.9" />
      <rect x="16.5" y="3.5" width="4" height="16.5" rx="1" fill="url(#chartGrad)" opacity="0.8" />
    </svg>
  );
}

export function StackIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="stackGrad" x1="2" y1="20" x2="22" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5A3B26" />
          <stop offset="1" stopColor="#E3A82E" />
        </linearGradient>
      </defs>
      <rect x="4" y="14" width="16" height="6" rx="1.4" fill="url(#stackGrad)" />
      <rect x="5.5" y="8.5" width="13" height="6" rx="1.4" fill="url(#stackGrad)" opacity="0.85" />
      <rect x="7" y="3.5" width="10" height="6" rx="1.4" fill="url(#stackGrad)" opacity="0.7" />
      <path d="M6 17h2M6 11.5h2" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function SwitchIcon({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <defs>
        <linearGradient id="switchGrad" x1="3" y1="19" x2="21" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#164825" />
          <stop offset="1" stopColor="#87C98E" />
        </linearGradient>
      </defs>
      <path
        d="M4 9h13.5M17.5 9 14 5.5M20 15H6.5M6.5 15 10 18.5"
        stroke="url(#switchGrad)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
