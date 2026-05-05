import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  const isSecure = isSecureRequest(req);
  const hostname = req.hostname;
  const isLocalhost = LOCAL_HOSTS.has(hostname) || hostname === "localhost";

  return {
    httpOnly: true,
    path: "/",
    // Use 'lax' for localhost, 'none' for production with HTTPS
    sameSite: isLocalhost ? "lax" : "none",
    secure: isSecure,
  };
}
