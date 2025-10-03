// shared core logic
async function core(u, opts = {}) {
  if (!u) return { error: "no url" };
  if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(u)) u = "http://" + u;

  // defaults
  let {
    sanitize = false, // change to true if u want to sanitize whatever the fuck your sanitizing
    maxLength = 1_000_000, // 1 mb, change if u want
    stripScripts = true, // strip <script> tags
  } = opts;

  // basic ssrf guard
  if (sanitize) {
    const bad = ["localhost", "127.", "0.", "169.254.", "192.168.", "10.", "::1"];
    if (bad.some(b => u.includes(b))) {
      return { error: "blocked url" };
    }
  }

  try {
    let r = await fetch(u);
    let text = await r.text();

    // truncate if too large
    if (sanitize && text.length > maxLength) {
      text = text.slice(0, maxLength) + "...[truncated]";
    }

    // strip <script> tags if enabled
    if (sanitize && stripScripts) {
      text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
    }

    return { url: u, status: r.status, length: text.length, html: text };
  } catch (e) {
    return { error: String(e) };
  }
}

/* ─────────── Vercel ─────────── */
export default async (req, res) => {
  let url = (req.query && req.query.url) || (req.body && req.body.url);
  let sanitize = (req.query && req.query.sanitize) || (req.body && req.body.sanitize);
  let out = await core(url, { sanitize: !!sanitize });
  if (res) {
    res.setHeader("Content-Type", "application/json");
    res.status(out.error ? 400 : 200).json(out);
  } else return out;
};

/* ─────────── Netlify ─────────── */
exports.handler = async (event) => {
  let url = event.queryStringParameters && event.queryStringParameters.url;
  let sanitize = event.queryStringParameters && event.queryStringParameters.sanitize;
  let out = await core(url, { sanitize: !!sanitize });
  return {
    statusCode: out.error ? 400 : 200,
    body: JSON.stringify(out),
    headers: { "Content-Type": "application/json" },
  };
};

/* ─────────── AWS Lambda ─────────── */
exports.lambdaHandler = async (event) => {
  let url = event.queryStringParameters && event.queryStringParameters.url;
  let sanitize = event.queryStringParameters && event.queryStringParameters.sanitize;
  let out = await core(url, { sanitize: !!sanitize });
  return {
    statusCode: out.error ? 400 : 200,
    body: JSON.stringify(out),
    headers: { "Content-Type": "application/json" },
  };
};

/* ─────────── Cloudflare Workers ─────────── */
export async function fetch(req) {
  let params = new URL(req.url).searchParams;
  let u = params.get("url");
  let sanitize = params.get("sanitize");
  let out = await core(u, { sanitize: !!sanitize });
  return new Response(JSON.stringify(out), {
    status: out.error ? 400 : 200,
    headers: { "content-type": "application/json" },
  });
}
