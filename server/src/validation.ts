const NICKNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

export function validateNickname(v: unknown): string {
  if (typeof v !== "string") throw new ApiError(400, "nickname requerido");
  const trimmed = v.trim();
  if (!NICKNAME_RE.test(trimmed)) {
    throw new ApiError(400, "Apodo: 3-24 caracteres, solo letras/números/_/-");
  }
  return trimmed;
}

export function validateFullName(v: unknown): string {
  if (typeof v !== "string") throw new ApiError(400, "Nombre requerido");
  const trimmed = v.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    throw new ApiError(400, "Nombre: 2-80 caracteres");
  }
  return trimmed;
}

export function validatePassword(v: unknown): string {
  if (typeof v !== "string") throw new ApiError(400, "Contraseña requerida");
  if (v.length < 8 || v.length > 200) {
    throw new ApiError(400, "Contraseña: 8-200 caracteres");
  }
  return v;
}

export function validateInviteCode(v: unknown): string {
  if (typeof v !== "string") throw new ApiError(400, "Código de invitación requerido");
  const trimmed = v.trim().toUpperCase();
  if (trimmed.length < 4 || trimmed.length > 32) {
    throw new ApiError(400, "Código inválido");
  }
  return trimmed;
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
