// Same custom icon set as apps/web/src/components/ui/icons, ported to
// react-native-svg (RN has no native <svg>). Kept 1:1 visually with the
// web versions -- gradients, two-tone leaf/harvest fills, soft
// highlights -- so the brand doesn't fork between platforms.
import Svg, { Path, Circle, Rect, Defs, LinearGradient, RadialGradient, Stop } from "react-native-svg";

interface IconProps {
  size?: number;
}

export function LeafIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="leafGrad" x1="3" y1="21" x2="21" y2="3">
          <Stop offset="0" stopColor="#1B5A2C" />
          <Stop offset="1" stopColor="#57AC64" />
        </LinearGradient>
      </Defs>
      <Path d="M4 20c0-8 4-14 15-15 0 11-6 15-13 15-1 0-2-1-2 0z" fill="url(#leafGrad)" />
      <Path d="M6.5 18.5c3-4 6-7 11.5-11" stroke="rgba(255,255,255,0.55)" strokeWidth={1.1} strokeLinecap="round" />
    </Svg>
  );
}

export function FarmIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="farmGrad" x1="2" y1="20" x2="22" y2="4">
          <Stop offset="0" stopColor="#164825" />
          <Stop offset="1" stopColor="#87C98E" />
        </LinearGradient>
      </Defs>
      <Path d="M3 20V11l6-5 6 5v9H3z" fill="url(#farmGrad)" />
      <Path d="M13 20v-6l4-3.2 4 3.2V20h-8z" fill="url(#farmGrad)" opacity={0.85} />
      <Rect x="8" y="15" width="2.4" height="5" rx="0.4" fill="rgba(255,255,255,0.7)" />
    </Svg>
  );
}

export function CoinIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <RadialGradient id="coinGrad" cx="0.35" cy="0.3" r="0.9">
          <Stop offset="0" stopColor="#F3D98A" />
          <Stop offset="1" stopColor="#A96F16" />
        </RadialGradient>
      </Defs>
      <Circle cx="12" cy="12" r="9" fill="url(#coinGrad)" />
      <Path
        d="M12 7.2c-2 0-3 1-3 2.2 0 3 6 1.4 6 4.4 0 1.3-1.2 2.3-3 2.3s-3.1-1-3.2-2.4"
        stroke="#5C3A1A"
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M12 6v1.4M12 16.6V18" stroke="#5C3A1A" strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function ChartIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="chartGrad" x1="3" y1="20" x2="21" y2="4">
          <Stop offset="0" stopColor="#1B5A2C" />
          <Stop offset="1" stopColor="#F3D98A" />
        </LinearGradient>
      </Defs>
      <Rect x="3.5" y="12" width="4" height="8" rx="1" fill="url(#chartGrad)" />
      <Rect x="10" y="7" width="4" height="13" rx="1" fill="url(#chartGrad)" opacity={0.9} />
      <Rect x="16.5" y="3.5" width="4" height="16.5" rx="1" fill="url(#chartGrad)" opacity={0.8} />
    </Svg>
  );
}

export function UserIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="userGrad" x1="4" y1="20" x2="20" y2="4">
          <Stop offset="0" stopColor="#164825" />
          <Stop offset="1" stopColor="#E3A82E" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="8.3" r="3.6" fill="url(#userGrad)" />
      <Path d="M4.5 20c0-4.4 3.4-6.8 7.5-6.8s7.5 2.4 7.5 6.8" fill="url(#userGrad)" opacity={0.9} />
    </Svg>
  );
}

export function ShieldCheckIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="shGrad" x1="4" y1="20" x2="20" y2="3">
          <Stop offset="0" stopColor="#237236" />
          <Stop offset="1" stopColor="#B5DFB8" />
        </LinearGradient>
      </Defs>
      <Path d="M12 2.5 20 6v6c0 5-3.5 8.3-8 9.5-4.5-1.2-8-4.5-8-9.5V6l8-3.5z" fill="url(#shGrad)" />
      <Path
        d="M8.5 12.2 11 14.7l5-5.4"
        stroke="#F1F8F1"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function PhoneUssdIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="phGrad" x1="6" y1="21" x2="18" y2="3">
          <Stop offset="0" stopColor="#5A3B26" />
          <Stop offset="1" stopColor="#87C98E" />
        </LinearGradient>
      </Defs>
      <Rect x="6.5" y="2.5" width="11" height="19" rx="2.4" fill="url(#phGrad)" />
      <Rect x="8.3" y="5" width="7.4" height="12.5" rx="0.6" fill="rgba(255,255,255,0.85)" />
      <Circle cx="12" cy="19.2" r="0.9" fill="rgba(255,255,255,0.85)" />
    </Svg>
  );
}

export function HandshakeIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="hsGrad" x1="2" y1="18" x2="22" y2="8">
          <Stop offset="0" stopColor="#1B5A2C" />
          <Stop offset="1" stopColor="#E3A82E" />
        </LinearGradient>
      </Defs>
      <Path
        d="M3 11.5 8 8l3 2.2L14 8l7 4-3 4.5-3.3-2-2.4 1.8a2 2 0 0 1-2.6-.1L7 14 3 11.5z"
        fill="url(#hsGrad)"
      />
    </Svg>
  );
}

export function TruckIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="truckGrad" x1="2" y1="19" x2="22" y2="6">
          <Stop offset="0" stopColor="#5A3B26" />
          <Stop offset="1" stopColor="#E3A82E" />
        </LinearGradient>
      </Defs>
      <Rect x="2.5" y="8" width="11" height="8" rx="1.2" fill="url(#truckGrad)" />
      <Path d="M13.5 11h4l3 3.2V16h-7v-5z" fill="url(#truckGrad)" opacity={0.85} />
      <Circle cx="7" cy="17.5" r="1.7" fill="#3D2A1D" />
      <Circle cx="17.5" cy="17.5" r="1.7" fill="#3D2A1D" />
      <Circle cx="7" cy="17.5" r="0.6" fill="rgba(255,255,255,0.8)" />
      <Circle cx="17.5" cy="17.5" r="0.6" fill="rgba(255,255,255,0.8)" />
    </Svg>
  );
}
