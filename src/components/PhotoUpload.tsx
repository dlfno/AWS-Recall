import { useRef, useState } from "react";
import { ApiError, uploadFile } from "../lib/api";
import { useAuth, type CurrentUser } from "../lib/auth-context";

export function PhotoUpload() {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const onPick = () => fileRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const { user: updated } = await uploadFile<{ user: CurrentUser }>(
        "/api/me/photo",
        file,
      );
      setUser(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error subiendo foto");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="photo-upload">
      <button type="button" className="avatar-btn" onClick={onPick} disabled={busy} aria-label="Cambiar foto">
        <Avatar user={user} size={88} />
        <span className="avatar-overlay">{busy ? "…" : "📷"}</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        style={{ display: "none" }}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function Avatar({
  user,
  size = 32,
}: {
  user: { nickname: string; photoUrl: string | null };
  size?: number;
}) {
  if (user.photoUrl) {
    return (
      <img
        src={user.photoUrl}
        alt={user.nickname}
        width={size}
        height={size}
        className="avatar"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = user.nickname.charAt(0).toUpperCase();
  return (
    <span
      className="avatar avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-label={user.nickname}
    >
      {initial}
    </span>
  );
}
