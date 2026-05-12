import { useState } from "react";
import { getCategory, getService } from "../lib/data";

type IconSize = "sm" | "md" | "lg" | "xl" | "auto";

interface Props {
  serviceId?: string;
  iconPath?: string;
  size?: IconSize;
}

const SIZE_PX: Record<Exclude<IconSize, "auto">, number> = {
  sm: 36,
  md: 48,
  lg: 80,
  xl: 140,
};

export function ServiceIcon({ serviceId, iconPath, size = "md" }: Props) {
  const service = serviceId ? getService(serviceId) : undefined;
  const src = iconPath ?? service?.icon;
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    // size="auto" → let the parent control dimensions via CSS (used by
    // .bc-front .icon-wrap img and .flash-body .icon-frame img).
    if (size === "auto") {
      return (
        <img
          src={src}
          alt={service?.name ?? ""}
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      );
    }
    return (
      <span className={`svc-icon ${size}`}>
        <img
          src={src}
          alt={service?.name ?? ""}
          onError={() => setErrored(true)}
        />
      </span>
    );
  }

  const category = service ? getCategory(service.category) : undefined;
  const px = size === "auto" ? 48 : SIZE_PX[size];
  const fillParent = size === "auto";
  return (
    <span
      className={`svc-icon placeholder ${fillParent ? "" : size}`}
      style={{
        background: category?.color ?? "var(--paper-2)",
        color: "white",
        width: fillParent ? "100%" : px,
        height: fillParent ? "100%" : px,
        fontSize: Math.max(10, px * 0.32),
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
    >
      {service?.acronym ?? "?"}
    </span>
  );
}
