// Vercel serverless endpoint for TMDB search.
// Set TMDB_API_KEY in Vercel Project Settings > Environment Variables.
// Never put the key in frontend JavaScript or commit it to GitHub.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TMDB is not configured yet. Add TMDB_API_KEY in Vercel environment variables." });
  }

  const query = String(req.query?.q || "").trim().slice(0, 100);
  const category = String(req.query?.category || "multi").toLowerCase();
  if (!query) return res.status(200).json({ results: [] });

  const endpoint = category === "anime"
    ? "https://api.themoviedb.org/3/search/tv"
    : category === "movie"
      ? "https://api.themoviedb.org/3/search/movie"
      : "https://api.themoviedb.org/3/search/multi";

  const url = new URL(endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: "TMDB request failed." });
    }

    const data = await response.json();
    const results = (data.results || [])
      .filter(item => item.media_type !== "person")
      .map(item => {
        const isTv = item.media_type === "tv" || category === "anime";
        const title = item.title || item.name || "Untitled";
        return {
          id: "tmdb-" + (item.media_type || (isTv ? "tv" : "movie")) + "-" + item.id,
          tmdbId: item.id,
          title,
          kind: isTv ? "Anime" : "Movie",
          year: Number(String(item.release_date || item.first_air_date || "").slice(0, 4)) || "",
          genre: isTv ? "TV Series" : "Movie",
          rating: Number(item.vote_average || 0).toFixed(1),
          image: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : "",
          description: item.overview || "No description is available yet.",
          mediaType: item.media_type || (isTv ? "tv" : "movie")
        };
      });

    return res.status(200).json({ results });
  } catch {
    return res.status(502).json({ error: "Unable to reach TMDB right now." });
  }
}
