// Finds a title-specific trailer from TMDB video metadata.
// Set TMDB_API_KEY in Vercel environment variables; never expose it in frontend code.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "TMDB is not configured." });

  const id = String(req.query?.id || "");
  const type = String(req.query?.type || "").toLowerCase();
  if (!/^\d+$/.test(id) || !["movie", "tv"].includes(type)) {
    return res.status(400).json({ error: "A valid title ID and type are required." });
  }

  try {
    const url = new URL(`https://api.themoviedb.org/3/${type}/${id}/videos`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "en-US");
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: "Could not retrieve trailer details." });

    const data = await response.json();
    const videos = (data.results || []).filter(video =>
      video.site === "YouTube" && video.key && ["Trailer", "Teaser"].includes(video.type)
    );
    videos.sort((a, b) =>
      Number(Boolean(b.official)) - Number(Boolean(a.official)) ||
      Number(b.type === "Trailer") - Number(a.type === "Trailer")
    );
    const trailer = videos[0];
    if (!trailer) return res.status(200).json({ url: null });
    return res.status(200).json({
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`,
      name: trailer.name || "Official trailer"
    });
  } catch {
    return res.status(502).json({ error: "Unable to reach TMDB right now." });
  }
}
