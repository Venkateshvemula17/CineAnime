// Vercel serverless endpoint for trending TMDB movies and TV.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "TMDB is not configured." });
  const type = String(req.query?.type || "all").toLowerCase();
  const endpoint = type === "anime"
    ? "https://api.themoviedb.org/3/trending/tv/week"
    : type === "movie"
      ? "https://api.themoviedb.org/3/trending/movie/week"
      : "https://api.themoviedb.org/3/trending/all/week";
  const url = new URL(endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: "TMDB request failed." });
    const data = await response.json();
    const results = (data.results || [])
      .filter(item => item.media_type !== "person")
      .map(item => {
        const mediaType = item.media_type || (type === "movie" ? "movie" : type === "anime" ? "tv" : "movie");
        const isTv = mediaType === "tv";
        return {
          id: "tmdb-" + mediaType + "-" + item.id,
          tmdbId: item.id,
          title: item.title || item.name || "Untitled",
          kind: isTv ? (type === "anime" ? "Anime" : "TV Series") : "Movie",
          year: Number(String(item.release_date || item.first_air_date || "").slice(0, 4)) || "",
          genre: isTv ? "TV Series" : "Movie",
          rating: Number(item.vote_average || 0).toFixed(1),
          image: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : "",
          description: item.overview || "No description is available yet.",
          mediaType
        };
      });
    return res.status(200).json({ results });
  } catch {
    return res.status(502).json({ error: "Unable to reach TMDB right now." });
  }
}
