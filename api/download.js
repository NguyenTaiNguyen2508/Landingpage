const GATEWAY = "https://fonez.duckdns.org";

// Resolve metadata only; both EXE and MSI files are served directly by Oracle.
module.exports = async function download(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    response.statusCode = 405;
    return response.end();
  }
  const params = new URL(request.url, "https://landing.invalid").searchParams;
  const metadata = params.get("metadata") === "1";
  const edition = params.get("format") || "portable";
  if (!["portable", "msi"].includes(edition)) {
    response.statusCode = 400;
    return response.end("Định dạng tải không hợp lệ.");
  }
  const msi = edition === "msi";
  const path = msi ? "app-installers" : "app-updates";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(`${GATEWAY}/v1/${path}/stable`, {
      headers: { Accept: "application/json" }, cache: "no-store", redirect: "error", signal: controller.signal,
    });
    if (msi && upstream.status === 204) {
      response.statusCode = metadata ? 204 : 404;
      return response.end(metadata || request.method === "HEAD" ? undefined : "Chưa có bộ cài MSI được phát hành.");
    }
    if (upstream.status !== 200) throw new Error("Release unavailable");
    const data = await upstream.json();
    const payload = msi ? data : data.payload;
    const version = msi ? payload?.installer_version : payload?.version;
    const extension = msi ? "msi" : "exe";
    if (payload?.schema !== 1 || payload.app !== "fonez" || payload.channel !== "stable" ||
        payload.platform !== "windows-x86_64" || (msi && payload.format !== "msi") ||
        !/^[a-f0-9]{64}$/.test(payload.sha256) ||
        payload.download_path !== `/v1/${path}/artifacts/${payload.sha256}.${extension}` ||
        typeof version !== "string" || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version) ||
        !Number.isSafeInteger(payload.size) || payload.size <= 0) throw new Error("Invalid release");
    const release = { url: GATEWAY + payload.download_path, format: edition, version, size: payload.size };
    if (metadata) {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.statusCode = 200;
      return response.end(request.method === "HEAD" ? undefined : JSON.stringify(release));
    }
    response.setHeader("Location", release.url);
    response.statusCode = 302;
    return response.end();
  } catch {
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.statusCode = 503;
    return response.end(request.method === "HEAD" ? undefined : "Chưa lấy được bản tải Fonez. Vui lòng thử lại sau hoặc nhắn Zalo để được hỗ trợ.");
  } finally {
    clearTimeout(timeout);
  }
};
