import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Popover,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Wifi,
  Link as LinkIcon,
  Email,
  Phone,
  Home,
  Favorite,
  Star,
  Person,
  ShoppingCart,
  Store,
  Language,
  Restaurant,
  MusicNote,
  Flight,
  Lock,
  LocationOn,
  Work,
  LocalHospital,
} from "@mui/icons-material";
import { QRCodeCanvas } from "qrcode.react";
import jsQR from "jsqr";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";

// ── Icon definitions ──

const ICONS = [
  { key: "wifi", label: "WiFi", Component: Wifi, svgPath: "M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" },
  { key: "link", label: "Link", Component: LinkIcon, svgPath: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" },
  { key: "email", label: "Email", Component: Email, svgPath: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
  { key: "phone", label: "Phone", Component: Phone, svgPath: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" },
  { key: "home", label: "Home", Component: Home, svgPath: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
  { key: "favorite", label: "Heart", Component: Favorite, svgPath: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
  { key: "star", label: "Star", Component: Star, svgPath: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" },
  { key: "person", label: "Person", Component: Person, svgPath: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" },
  { key: "cart", label: "Cart", Component: ShoppingCart, svgPath: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" },
  { key: "store", label: "Store", Component: Store, svgPath: "M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" },
  { key: "language", label: "Globe", Component: Language, svgPath: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" },
  { key: "restaurant", label: "Food", Component: Restaurant, svgPath: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" },
  { key: "music", label: "Music", Component: MusicNote, svgPath: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" },
  { key: "flight", label: "Flight", Component: Flight, svgPath: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" },
  { key: "lock", label: "Lock", Component: Lock, svgPath: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" },
  { key: "location", label: "Location", Component: LocationOn, svgPath: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
  { key: "work", label: "Work", Component: Work, svgPath: "M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" },
  { key: "medical", label: "Medical", Component: LocalHospital, svgPath: "M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" },
];

function iconToDataUrl(svgPath: string, color: string, pixelSize: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${pixelSize}" height="${pixelSize}"><path d="${svgPath}" fill="${color}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ── Frame definitions ──

type FrameKey = "none" | "simple" | "bold" | "circle" | "phone" | "clipboard" | "bag"
  | "banner-top" | "banner-bottom" | "dashed" | "stripe" | "badge" | "minimal" | "ticket";

const FRAMES: { key: FrameKey; label: string }[] = [
  { key: "none", label: "None" },
  { key: "simple", label: "Simple" },
  { key: "bold", label: "Bold" },
  { key: "banner-top", label: "Top Banner" },
  { key: "banner-bottom", label: "Bottom Bar" },
  { key: "dashed", label: "Dashed" },
  { key: "stripe", label: "Stripe" },
  { key: "badge", label: "Badge" },
  { key: "minimal", label: "Minimal" },
  { key: "ticket", label: "Ticket" },
  { key: "circle", label: "Circle" },
  { key: "phone", label: "Phone" },
  { key: "clipboard", label: "Clipboard" },
  { key: "bag", label: "Bag" },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Frame thumbnail component ──

function FrameThumb({ type }: { type: FrameKey }) {
  const c = "currentColor";
  const qr = (
    <g opacity="0.4">
      <rect x="16" y="16" width="7" height="7" fill={c} />
      <rect x="29" y="16" width="7" height="7" fill={c} />
      <rect x="16" y="29" width="7" height="7" fill={c} />
      <rect x="23" y="23" width="6" height="6" fill={c} opacity="0.5" />
    </g>
  );
  switch (type) {
    case "none":
      return (
        <svg width="52" height="52" viewBox="0 0 52 52">
          <line x1="16" y1="16" x2="36" y2="36" stroke={c} strokeWidth="3" strokeLinecap="round" />
          <line x1="36" y1="16" x2="16" y2="36" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "simple":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <rect x="3" y="3" width="46" height="42" rx="4" stroke={c} strokeWidth="1.5" fill="none" />
          {qr}
          <text x="26" y="56" textAnchor="middle" fontSize="7" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "bold":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <rect x="3" y="3" width="46" height="42" rx="6" stroke={c} strokeWidth="4" fill="none" />
          {qr}
          <text x="26" y="56" textAnchor="middle" fontSize="7" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "circle":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <circle cx="26" cy="24" r="21" stroke={c} strokeWidth="2" fill="none" />
          {qr}
          <text x="26" y="56" textAnchor="middle" fontSize="7" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "phone":
      return (
        <svg width="52" height="64" viewBox="0 0 52 64">
          <rect x="6" y="3" width="40" height="54" rx="8" stroke={c} strokeWidth="2" fill="none" />
          <circle cx="26" cy="10" r="2" fill={c} />
          <line x1="20" y1="51" x2="32" y2="51" stroke={c} strokeWidth="2" strokeLinecap="round" />
          <g transform="translate(0,2)">{qr}</g>
          <text x="26" y="44" textAnchor="middle" fontSize="6" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "clipboard":
      return (
        <svg width="52" height="64" viewBox="0 0 52 64">
          <rect x="5" y="10" width="42" height="50" rx="4" stroke={c} strokeWidth="2" fill="none" />
          <rect x="16" y="4" width="20" height="12" rx="4" stroke={c} strokeWidth="1.5" fill="white" />
          <circle cx="26" cy="10" r="3" stroke={c} strokeWidth="1.5" fill="none" />
          <g transform="translate(0,6)">{qr}</g>
          <text x="26" y="54" textAnchor="middle" fontSize="6" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "bag":
      return (
        <svg width="52" height="64" viewBox="0 0 52 64">
          <rect x="5" y="20" width="42" height="40" rx="4" stroke={c} strokeWidth="2" fill="none" />
          <path d="M17 20 C17 8 35 8 35 20" stroke={c} strokeWidth="2" fill="none" />
          <g transform="translate(0,8)">{qr}</g>
          <text x="26" y="54" textAnchor="middle" fontSize="6" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "banner-top":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <rect x="3" y="3" width="46" height="52" rx="4" stroke={c} strokeWidth="1.5" fill="none" />
          <rect x="3" y="3" width="46" height="12" rx="4" fill={c} />
          <rect x="3" y="11" width="46" height="4" fill={c} />
          <text x="26" y="12" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">SCAN ME</text>
          <g transform="translate(0,4)">{qr}</g>
        </svg>
      );
    case "banner-bottom":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <rect x="3" y="3" width="46" height="52" rx="4" stroke={c} strokeWidth="1.5" fill="none" />
          <rect x="3" y="43" width="46" height="12" rx="4" fill={c} />
          <rect x="3" y="43" width="46" height="4" fill={c} />
          {qr}
          <text x="26" y="52" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "dashed":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <rect x="3" y="3" width="46" height="42" rx="4" stroke={c} strokeWidth="2" strokeDasharray="4 3" fill="none" />
          {qr}
          <text x="26" y="56" textAnchor="middle" fontSize="7" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "stripe":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <defs><clipPath id="st"><rect x="3" y="3" width="14" height="14" /></clipPath></defs>
          <rect x="3" y="3" width="46" height="42" rx="4" stroke={c} strokeWidth="1.5" fill="none" />
          <g clipPath="url(#st)" opacity="0.5">
            <line x1="3" y1="17" x2="17" y2="3" stroke={c} strokeWidth="2" />
            <line x1="3" y1="13" x2="13" y2="3" stroke={c} strokeWidth="2" />
            <line x1="3" y1="9" x2="9" y2="3" stroke={c} strokeWidth="2" />
            <line x1="3" y1="5" x2="5" y2="3" stroke={c} strokeWidth="2" />
          </g>
          {qr}
          <text x="26" y="56" textAnchor="middle" fontSize="7" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "badge":
      return (
        <svg width="52" height="64" viewBox="0 0 52 64">
          <rect x="3" y="3" width="46" height="42" rx="4" stroke={c} strokeWidth="1.5" fill="none" />
          {qr}
          <circle cx="10" cy="45" r="8" fill={c} />
          <path d="M7 45 l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="30" y="52" textAnchor="middle" fontSize="7" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
    case "minimal":
      return (
        <svg width="52" height="52" viewBox="0 0 52 52">
          <rect x="3" y="3" width="46" height="46" rx="2" stroke={c} strokeWidth="1" fill="none" />
          {qr}
        </svg>
      );
    case "ticket":
      return (
        <svg width="52" height="60" viewBox="0 0 52 60">
          <rect x="3" y="3" width="46" height="42" rx="4" stroke={c} strokeWidth="1.5" fill="none" />
          <circle cx="3" cy="24" r="4" fill="white" stroke={c} strokeWidth="1.5" />
          <circle cx="49" cy="24" r="4" fill="white" stroke={c} strokeWidth="1.5" />
          {qr}
          <text x="26" y="56" textAnchor="middle" fontSize="7" fill={c} fontWeight="bold">SCAN ME</text>
        </svg>
      );
  }
}

// ── QR decode helper ──

function decodeQRFromImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, canvas.width, canvas.height);
      resolve(result?.data ?? null);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

// ── App ──

type Mode = "create" | "read";
type TitlePosition = "top" | "bottom" | "none";

function App() {
  const [mode, setMode] = useState<Mode>("create");
  const [text, setText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxQrSize, setMaxQrSize] = useState(512);
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [title, setTitle] = useState("QR Code Title");
  const [titlePosition, setTitlePosition] = useState<TitlePosition>("none");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLElement | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameKey>("none");
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDecode = useCallback(async (file: File) => {
    setDecodeError(false);
    setDecodedText(null);
    setPreviewUrl(URL.createObjectURL(file));
    const result = await decodeQRFromImage(file);
    if (result) setDecodedText(result);
    else setDecodeError(true);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleDecode(file);
    e.target.value = "";
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (mode !== "read") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await handleDecode(file);
            return;
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleDecode, mode]);

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      // Account for Paper padding (24px*2) and frame padding (~48px*2)
      const available = el.clientWidth - 96;
      const capped = Math.max(128, Math.min(512, Math.floor(available / 8) * 8));
      setMaxQrSize(capped);
      setSize((prev) => Math.min(prev, capped));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handleFrameChange = (frame: FrameKey) => {
    if (frame !== "none" && selectedFrame === "none") {
      if (title === "QR Code Title" || title === "") setTitle("SCAN ME");
    } else if (frame === "none" && selectedFrame !== "none") {
      if (title === "SCAN ME" || title === "") setTitle("QR Code Title");
    }
    setSelectedFrame(frame);
  };

  // Computed values
  const hasFrame = selectedFrame !== "none";
  const titleText = title && titlePosition !== "none" ? title : "";
  const frameText = hasFrame ? (title || "SCAN ME") : "";
  const titleHeight = !hasFrame && titleText ? 48 : 0;

  const iconSize = Math.round(size * 0.2);
  const iconDataUrl = useMemo(() => {
    if (!selectedIcon) return null;
    const icon = ICONS.find((i) => i.key === selectedIcon);
    if (!icon) return null;
    return iconToDataUrl(icon.svgPath, fgColor, iconSize);
  }, [selectedIcon, fgColor, iconSize]);

  const SelectedIconComp = selectedIcon
    ? ICONS.find((i) => i.key === selectedIcon)?.Component ?? null
    : null;

  // ── Export canvas builders ──

  const buildExportCanvas = (): HTMLCanvasElement | null => {
    const srcCanvas = qrRef.current?.querySelector("canvas");
    if (!srcCanvas) return null;

    if (hasFrame) return buildFramedCanvas(srcCanvas);

    // No frame — original logic
    const padding = 24;
    const totalWidth = size + padding * 2;
    const totalHeight = size + padding * 2 + titleHeight;
    const out = document.createElement("canvas");
    out.width = totalWidth;
    out.height = totalHeight;
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    const qrY = titlePosition === "top" && titleText ? padding + titleHeight : padding;
    ctx.drawImage(srcCanvas, padding, qrY, size, size);

    if (titleText) {
      ctx.fillStyle = fgColor;
      ctx.textAlign = "center";
      ctx.font = `bold ${Math.max(16, size / 12)}px -apple-system, system-ui, sans-serif`;
      const textY = titlePosition === "top"
        ? padding + titleHeight / 2 + 6
        : padding + size + titleHeight / 2 + 6;
      ctx.fillText(titleText, totalWidth / 2, textY, size);
    }
    return out;
  };

  const buildFramedCanvas = (srcCanvas: HTMLCanvasElement): HTMLCanvasElement | null => {
    const pad = 24;
    const textH = 36;
    const fontSize = Math.max(14, size / 14);
    let canvasW: number, canvasH: number, qrX: number, qrY: number, textY: number;

    // Default (simple)
    const cp = 24;
    canvasW = size + (pad + cp) * 2;
    canvasH = size + (pad + cp) * 2 + textH;
    qrX = pad + cp;
    qrY = pad + cp;
    textY = canvasH - 12;

    switch (selectedFrame) {
      case "bold":
        break; // same layout, different stroke
      case "circle": {
        const ep = Math.round(size * 0.18);
        canvasW = size + (pad + ep) * 2;
        canvasH = size + (pad + ep) * 2 + textH;
        qrX = pad + ep;
        qrY = pad + ep;
        textY = canvasH - 12;
        break;
      }
      case "phone": {
        const sp = 22, tp = 34, bp = 38;
        canvasW = size + (pad + sp) * 2;
        canvasH = size + pad * 2 + tp + bp;
        qrX = pad + sp;
        qrY = pad + tp;
        textY = canvasH - pad - 10;
        break;
      }
      case "clipboard": {
        const sp = 18, tp = 46, bp = 42;
        canvasW = size + (pad + sp) * 2;
        canvasH = size + pad * 2 + tp + bp;
        qrX = pad + sp;
        qrY = pad + tp;
        textY = canvasH - pad - 10;
        break;
      }
      case "bag": {
        const sp = 22, tp = 46, bp = 42;
        canvasW = size + (pad + sp) * 2;
        canvasH = size + pad * 2 + tp + bp;
        qrX = pad + sp;
        qrY = pad + tp;
        textY = canvasH - pad - 10;
        break;
      }
      case "banner-top": {
        const barH = 32;
        canvasW = size + (pad + cp) * 2;
        canvasH = size + (pad + cp) * 2 + barH;
        qrX = pad + cp;
        qrY = pad + cp + barH;
        textY = pad + cp + barH / 2 + 5;
        break;
      }
      case "banner-bottom":
        // same layout as simple, text drawn inside bar
        break;
      case "dashed":
      case "stripe":
      case "badge":
        break; // same layout as simple
      case "minimal": {
        const mp = 8;
        canvasW = size + (pad + mp) * 2;
        canvasH = size + (pad + mp) * 2 + textH;
        qrX = pad + mp;
        qrY = pad + mp;
        textY = canvasH - 12;
        break;
      }
      case "ticket":
        break; // same layout as simple
    }

    const out = document.createElement("canvas");
    out.width = canvasW;
    out.height = canvasH;
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.strokeStyle = fgColor;
    ctx.fillStyle = fgColor;

    switch (selectedFrame) {
      case "simple": {
        ctx.lineWidth = 2;
        roundRect(ctx, pad, pad, canvasW - pad * 2, canvasH - pad * 2 - textH, 8);
        ctx.stroke();
        break;
      }
      case "bold": {
        ctx.lineWidth = 5;
        roundRect(ctx, pad, pad, canvasW - pad * 2, canvasH - pad * 2 - textH, 14);
        ctx.stroke();
        break;
      }
      case "circle": {
        ctx.lineWidth = 3;
        const cx = canvasW / 2;
        const cy = (canvasH - textH) / 2;
        const radius = (Math.min(canvasW, canvasH - textH) - pad * 2) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "phone": {
        ctx.lineWidth = 3;
        roundRect(ctx, pad, pad, canvasW - pad * 2, canvasH - pad * 2, 22);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(canvasW / 2, pad + 17, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(canvasW / 2 - 24, canvasH - pad - 15);
        ctx.lineTo(canvasW / 2 + 24, canvasH - pad - 15);
        ctx.stroke();
        break;
      }
      case "clipboard": {
        ctx.lineWidth = 3;
        const boardY = pad + 22;
        roundRect(ctx, pad, boardY, canvasW - pad * 2, canvasH - pad * 2 - 22, 10);
        ctx.stroke();
        const clipW = 52, clipH = 22;
        const clipX = canvasW / 2 - clipW / 2;
        const clipY = boardY - clipH / 2;
        ctx.fillStyle = bgColor;
        ctx.fillRect(clipX - 2, boardY - 2, clipW + 4, 5);
        ctx.fillStyle = fgColor;
        ctx.strokeStyle = fgColor;
        roundRect(ctx, clipX, clipY, clipW, clipH, 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(canvasW / 2, boardY, 7, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case "bag": {
        ctx.lineWidth = 3;
        const bagY = pad + 32;
        roundRect(ctx, pad, bagY, canvasW - pad * 2, canvasH - pad * 2 - 32, 8);
        ctx.stroke();
        const spread = (canvasW - pad * 2) * 0.28;
        ctx.beginPath();
        ctx.moveTo(canvasW / 2 - spread, bagY);
        ctx.quadraticCurveTo(canvasW / 2 - spread, bagY - 30, canvasW / 2, bagY - 30);
        ctx.quadraticCurveTo(canvasW / 2 + spread, bagY - 30, canvasW / 2 + spread, bagY);
        ctx.stroke();
        break;
      }
      case "banner-top": {
        ctx.lineWidth = 2;
        const fw = canvasW - pad * 2, barH = 32;
        roundRect(ctx, pad, pad, fw, canvasH - pad * 2, 8);
        ctx.stroke();
        // Filled top bar
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pad + 8, pad);
        ctx.lineTo(pad + fw - 8, pad);
        ctx.quadraticCurveTo(pad + fw, pad, pad + fw, pad + 8);
        ctx.lineTo(pad + fw, pad + barH);
        ctx.lineTo(pad, pad + barH);
        ctx.lineTo(pad, pad + 8);
        ctx.quadraticCurveTo(pad, pad, pad + 8, pad);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Banner text drawn separately below (white on dark)
        break;
      }
      case "banner-bottom": {
        ctx.lineWidth = 2;
        const fw2 = canvasW - pad * 2, fh2 = canvasH - pad * 2 - textH;
        roundRect(ctx, pad, pad, fw2, fh2, 8);
        ctx.stroke();
        // Filled bottom bar
        ctx.save();
        const barTop = pad + fh2 - 32;
        ctx.beginPath();
        ctx.moveTo(pad, barTop);
        ctx.lineTo(pad + fw2, barTop);
        ctx.lineTo(pad + fw2, pad + fh2 - 8);
        ctx.quadraticCurveTo(pad + fw2, pad + fh2, pad + fw2 - 8, pad + fh2);
        ctx.lineTo(pad + 8, pad + fh2);
        ctx.quadraticCurveTo(pad, pad + fh2, pad, pad + fh2 - 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case "dashed": {
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        roundRect(ctx, pad, pad, canvasW - pad * 2, canvasH - pad * 2 - textH, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      case "stripe": {
        ctx.lineWidth = 2;
        const sw = canvasW - pad * 2, sh = canvasH - pad * 2 - textH;
        roundRect(ctx, pad, pad, sw, sh, 8);
        ctx.stroke();
        // Diagonal stripes in top-left corner
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, pad, pad, sw, sh, 8);
        ctx.clip();
        const stripeSize = Math.min(sw, sh) * 0.3;
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < stripeSize * 2; i += 6) {
          ctx.beginPath();
          ctx.moveTo(pad + i, pad);
          ctx.lineTo(pad, pad + i);
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case "badge": {
        ctx.lineWidth = 2;
        roundRect(ctx, pad, pad, canvasW - pad * 2, canvasH - pad * 2 - textH, 8);
        ctx.stroke();
        // Badge circle with checkmark at bottom-left
        const bcx = pad + 20, bcy = canvasH - pad - textH + 4;
        ctx.beginPath();
        ctx.arc(bcx, bcy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bgColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(bcx - 5, bcy);
        ctx.lineTo(bcx - 1, bcy + 4);
        ctx.lineTo(bcx + 6, bcy - 4);
        ctx.stroke();
        ctx.strokeStyle = fgColor;
        break;
      }
      case "minimal": {
        ctx.lineWidth = 1;
        roundRect(ctx, pad, pad, canvasW - pad * 2, canvasH - pad * 2 - textH, 4);
        ctx.stroke();
        break;
      }
      case "ticket": {
        ctx.lineWidth = 2;
        const tw = canvasW - pad * 2, th = canvasH - pad * 2 - textH;
        roundRect(ctx, pad, pad, tw, th, 8);
        ctx.stroke();
        // Cutout semicircles on left and right
        const cutY = pad + th / 2;
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(pad, cutY, 8, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pad + tw, cutY, 8, Math.PI / 2, -Math.PI / 2);
        ctx.fill();
        ctx.fillStyle = fgColor;
        // Redraw cutout borders
        ctx.strokeStyle = fgColor;
        ctx.beginPath();
        ctx.arc(pad, cutY, 8, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pad + tw, cutY, 8, Math.PI / 2, -Math.PI / 2);
        ctx.stroke();
        break;
      }
    }

    ctx.drawImage(srcCanvas, qrX, qrY, size, size);

    // Draw frame text
    const isBannerTop = selectedFrame === "banner-top";
    const isBannerBottom = selectedFrame === "banner-bottom";
    if (isBannerTop) {
      // White text on filled banner
      ctx.fillStyle = bgColor;
      ctx.textAlign = "center";
      ctx.font = `bold ${fontSize}px -apple-system, system-ui, sans-serif`;
      ctx.fillText(frameText, canvasW / 2, textY, canvasW - pad * 2);
    } else if (isBannerBottom) {
      // White text on filled bar
      const fh2 = canvasH - pad * 2 - textH;
      ctx.fillStyle = bgColor;
      ctx.textAlign = "center";
      ctx.font = `bold ${fontSize}px -apple-system, system-ui, sans-serif`;
      ctx.fillText(frameText, canvasW / 2, pad + fh2 - 10, canvasW - pad * 2);
    } else if (selectedFrame === "minimal") {
      // No text for minimal
    } else {
      ctx.fillStyle = fgColor;
      ctx.textAlign = "center";
      ctx.font = `bold ${fontSize}px -apple-system, system-ui, sans-serif`;
      ctx.fillText(frameText, canvasW / 2, textY, canvasW - pad * 2);
    }

    return out;
  };

  const handleSave = async () => {
    const canvas = buildExportCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    if (!base64) return;
    try {
      await invoke("save_qr_to_photos", { base64Data: base64 });
    } catch {
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = dataUrl;
      link.click();
    }
  };

  const handleShare = async () => {
    const canvas = buildExportCanvas();
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) return;
    const file = new File([blob], "qrcode.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
    }
  };

  // ── Frame preview wrapper ──

  const renderFramePreview = (qrElement: React.ReactNode) => {
    const ft = frameText;
    const framePad = 3;
    const textSx = { color: fgColor, fontWeight: "bold", mt: 1, textAlign: "center", fontSize: Math.max(12, size / 16) };

    switch (selectedFrame) {
      case "simple":
        return (
          <Box sx={{ border: `2px solid ${fgColor}`, borderRadius: 1, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            {qrElement}
            <Typography sx={textSx}>{ft}</Typography>
          </Box>
        );
      case "bold":
        return (
          <Box sx={{ border: `4px solid ${fgColor}`, borderRadius: 2, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            {qrElement}
            <Typography sx={textSx}>{ft}</Typography>
          </Box>
        );
      case "circle":
        return (
          <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ border: `3px solid ${fgColor}`, borderRadius: "50%", p: `${size * 0.22}px`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {qrElement}
            </Box>
            <Typography sx={textSx}>{ft}</Typography>
          </Box>
        );
      case "phone":
        return (
          <Box sx={{ border: `3px solid ${fgColor}`, borderRadius: "20px", p: framePad, pt: 4, pb: 4, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: fgColor, mb: 1 }} />
            {qrElement}
            <Typography sx={textSx}>{ft}</Typography>
            <Box sx={{ width: 48, height: 4, borderRadius: 2, bgcolor: fgColor, mt: 1 }} />
          </Box>
        );
      case "clipboard":
        return (
          <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ width: 48, height: 20, border: `2px solid ${fgColor}`, borderRadius: 1.5, bgcolor: bgColor, zIndex: 1, mb: "-10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${fgColor}` }} />
            </Box>
            <Box sx={{ border: `3px solid ${fgColor}`, borderRadius: 1, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              {qrElement}
              <Typography sx={textSx}>{ft}</Typography>
            </Box>
          </Box>
        );
      case "bag":
        return (
          <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ width: size * 0.45, height: 28, borderTop: `3px solid ${fgColor}`, borderLeft: `3px solid ${fgColor}`, borderRight: `3px solid ${fgColor}`, borderRadius: "24px 24px 0 0", mb: "-2px" }} />
            <Box sx={{ border: `3px solid ${fgColor}`, borderRadius: 1, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              {qrElement}
              <Typography sx={textSx}>{ft}</Typography>
            </Box>
          </Box>
        );
      case "banner-top":
        return (
          <Box sx={{ border: `2px solid ${fgColor}`, borderRadius: 1, overflow: "hidden", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ bgcolor: fgColor, width: "100%", py: 0.75 }}>
              <Typography sx={{ ...textSx, color: bgColor, mt: 0 }}>{ft}</Typography>
            </Box>
            <Box sx={{ p: framePad }}>{qrElement}</Box>
          </Box>
        );
      case "banner-bottom":
        return (
          <Box sx={{ border: `2px solid ${fgColor}`, borderRadius: 1, overflow: "hidden", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ p: framePad }}>{qrElement}</Box>
            <Box sx={{ bgcolor: fgColor, width: "100%", py: 0.75 }}>
              <Typography sx={{ ...textSx, color: bgColor, mt: 0 }}>{ft}</Typography>
            </Box>
          </Box>
        );
      case "dashed":
        return (
          <Box sx={{ border: `3px dashed ${fgColor}`, borderRadius: 1, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            {qrElement}
            <Typography sx={textSx}>{ft}</Typography>
          </Box>
        );
      case "stripe":
        return (
          <Box sx={{ border: `2px solid ${fgColor}`, borderRadius: 1, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, width: "30%", height: "30%", opacity: 0.1, background: `repeating-linear-gradient(-45deg, ${fgColor}, ${fgColor} 3px, transparent 3px, transparent 8px)` }} />
            {qrElement}
            <Typography sx={textSx}>{ft}</Typography>
          </Box>
        );
      case "badge":
        return (
          <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <Box sx={{ border: `2px solid ${fgColor}`, borderRadius: 1, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              {qrElement}
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: fgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ color: bgColor, fontSize: 12, fontWeight: "bold", lineHeight: 1 }}>✓</Typography>
              </Box>
              <Typography sx={{ ...textSx, mt: 0 }}>{ft}</Typography>
            </Stack>
          </Box>
        );
      case "minimal":
        return (
          <Box sx={{ border: `1px solid ${fgColor}`, borderRadius: 0.5, p: 2, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            {qrElement}
          </Box>
        );
      case "ticket":
        return (
          <Box sx={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ border: `2px solid ${fgColor}`, borderRadius: 1, p: framePad, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
              {qrElement}
              <Typography sx={textSx}>{ft}</Typography>
            </Box>
            <Box sx={{ position: "absolute", left: -6, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", bgcolor: "background.paper", border: `2px solid ${fgColor}` }} />
            <Box sx={{ position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", bgcolor: "background.paper", border: `2px solid ${fgColor}` }} />
          </Box>
        );
      default:
        return qrElement;
    }
  };

  // ── Render ──

  return (
    <Container maxWidth="sm" sx={{ pt: "env(safe-area-inset-top, 16px)", pb: 4, px: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Only QR Code
      </Typography>

      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && setMode(v)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <ToggleButton value="create">Create</ToggleButton>
        <ToggleButton value="read">Read</ToggleButton>
      </ToggleButtonGroup>

      {mode === "create" ? (
        <Stack ref={containerRef} spacing={3}>
          <TextField
            label="Enter text or URL"
            variant="filled"
            multiline
            minRows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
          />

          {/* Title position — only when no frame */}
          {!hasFrame && (
            <ToggleButtonGroup
              value={titlePosition}
              exclusive
              onChange={(_, v) => v && setTitlePosition(v)}
              fullWidth
              size="small"
            >
              <ToggleButton value="top">Title on Top</ToggleButton>
              <ToggleButton value="bottom">Title on Bottom</ToggleButton>
              <ToggleButton value="none">No Title</ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* Title / frame text input */}
          {(hasFrame || titlePosition !== "none") && (
            <TextField
              label={hasFrame ? "Frame Text" : "Title"}
              variant="filled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
          )}

          <Box>
            <Typography gutterBottom>Size</Typography>
            <Slider
              value={size}
              onChange={(_, v) => setSize(v as number)}
              min={128}
              max={maxQrSize}
              step={8}
            />
          </Box>

          <Stack direction="row" spacing={2} alignItems="flex-end">
            <Box>
              <Typography variant="caption">Foreground</Typography>
              <Box
                component="input"
                type="color"
                value={fgColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFgColor(e.target.value)}
                sx={{
                  width: 80, height: 40, border: "1px solid", borderColor: "divider",
                  borderRadius: 1, padding: 0, cursor: "pointer", display: "block",
                  WebkitAppearance: "none",
                  "&::-webkit-color-swatch-wrapper": { padding: 0 },
                  "&::-webkit-color-swatch": { border: "none", borderRadius: 1 },
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption">Background</Typography>
              <Box
                component="input"
                type="color"
                value={bgColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgColor(e.target.value)}
                sx={{
                  width: 80, height: 40, border: "1px solid", borderColor: "divider",
                  borderRadius: 1, padding: 0, cursor: "pointer", display: "block",
                  WebkitAppearance: "none",
                  "&::-webkit-color-swatch-wrapper": { padding: 0 },
                  "&::-webkit-color-swatch": { border: "none", borderRadius: 1 },
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption">Center Icon</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => setIconPickerAnchor(e.currentTarget)}
                sx={{ display: "flex", height: 40, gap: 0.5 }}
              >
                {SelectedIconComp && <SelectedIconComp fontSize="small" />}
                {selectedIcon ? "Change" : "Add"}
              </Button>
            </Box>
            {selectedIcon && (
              <Button variant="text" size="small" color="error" onClick={() => setSelectedIcon(null)} sx={{ height: 40 }}>
                Remove
              </Button>
            )}
          </Stack>

          <Popover
            open={Boolean(iconPickerAnchor)}
            anchorEl={iconPickerAnchor}
            onClose={() => setIconPickerAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Box sx={{ p: 1.5, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0.5, maxWidth: 300 }}>
              {ICONS.map((icon) => (
                <IconButton
                  key={icon.key}
                  onClick={() => { setSelectedIcon(icon.key); setIconPickerAnchor(null); }}
                  color={selectedIcon === icon.key ? "primary" : "default"}
                  title={icon.label}
                  size="small"
                >
                  <icon.Component />
                </IconButton>
              ))}
            </Box>
          </Popover>

          {/* ── Frame selector ── */}
          <Box>
            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>Frame</Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}
            >
              {FRAMES.map((f) => (
                <Box
                  key={f.key}
                  onClick={() => handleFrameChange(f.key)}
                  sx={{
                    border: 2,
                    borderColor: selectedFrame === f.key ? "primary.main" : "divider",
                    borderRadius: 2,
                    p: 0.5,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 60,
                    flexShrink: 0,
                    bgcolor: selectedFrame === f.key ? "action.selected" : "transparent",
                    color: selectedFrame === f.key ? "primary.main" : "text.secondary",
                  }}
                >
                  <FrameThumb type={f.key} />
                </Box>
              ))}
            </Stack>
          </Box>

          {/* ── QR Preview ── */}
          <Paper
            elevation={2}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              p: 3,
              minHeight: size + (hasFrame ? 100 : 48 + titleHeight),
            }}
          >
            {text ? (
              <>
                {/* Title above — only when no frame */}
                {!hasFrame && titleText && titlePosition === "top" && (
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1, color: fgColor, textAlign: "center", maxWidth: size, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {titleText}
                  </Typography>
                )}

                {hasFrame ? (
                  renderFramePreview(
                    <Box ref={qrRef} sx={{ maxWidth: "100%", "& canvas": { maxWidth: "100%", height: "auto", display: "block", aspectRatio: "1 / 1" } }}>
                      <QRCodeCanvas
                        value={text}
                        size={size}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        level="H"
                        imageSettings={
                          iconDataUrl
                            ? { src: iconDataUrl, width: iconSize, height: iconSize, excavate: true }
                            : undefined
                        }
                      />
                    </Box>
                  )
                ) : (
                  <div ref={qrRef}>
                    <QRCodeCanvas
                      value={text}
                      size={size}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level="H"
                      imageSettings={
                        iconDataUrl
                          ? { src: iconDataUrl, width: iconSize, height: iconSize, excavate: true }
                          : undefined
                      }
                    />
                  </div>
                )}

                {/* Title below — only when no frame */}
                {!hasFrame && titleText && titlePosition === "bottom" && (
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mt: 1, color: fgColor, textAlign: "center", maxWidth: size, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {titleText}
                  </Typography>
                )}
              </>
            ) : (
              <Typography color="text.secondary">
                Type something above to generate a QR code
              </Typography>
            )}
          </Paper>

          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleSave} disabled={!text} size="large" fullWidth>
              Save to Photos
            </Button>
            <Button variant="contained" onClick={handleShare} disabled={!text} size="large" fullWidth>
              Share
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" size="large" onClick={() => fileInputRef.current?.click()} fullWidth>
              Select Image
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={async () => {
                try {
                  const items = await navigator.clipboard.read();
                  for (const item of items) {
                    const imageType = item.types.find((t) => t.startsWith("image/"));
                    if (imageType) {
                      const blob = await item.getType(imageType);
                      const file = new File([blob], "paste.png", { type: imageType });
                      await handleDecode(file);
                      return;
                    }
                  }
                } catch { /* clipboard access denied or empty */ }
              }}
              fullWidth
            >
              Paste Image
            </Button>
          </Stack>

          {previewUrl && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Stack spacing={2} alignItems="center">
                <Box component="img" src={previewUrl} sx={{ maxWidth: "100%", maxHeight: 200, borderRadius: 1 }} />
                {decodeError && (
                  <Alert severity="error" sx={{ width: "100%" }}>No QR code found in this image.</Alert>
                )}
                {decodedText && (
                  <>
                    <Alert severity="success" sx={{ width: "100%", wordBreak: "break-all" }}>{decodedText}</Alert>
                    <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                      {/^https?:\/\//i.test(decodedText) && (
                        <Button variant="contained" onClick={() => openUrl(decodedText)} fullWidth>Open Link</Button>
                      )}
                      <Button variant="outlined" onClick={() => navigator.clipboard.writeText(decodedText)} fullWidth>Copy Text</Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Container>
  );
}

export default App;
