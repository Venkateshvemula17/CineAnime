const titles = [
  {id:"orbit",title:"Beyond the Orbit",kind:"Movie",year:2025,genre:"Sci-Fi · Adventure",rating:"8.4",image:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=80",description:"A lone explorer follows a mysterious signal into the quiet edges of space. A fictional title for the CineAnime interface demo."},
  {id:"moonlit",title:"Moonlit Letters",kind:"Animation",year:2024,genre:"Fantasy · Drama",rating:"8.1",image:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=80",description:"A gentle animated journey through a village where letters arrive from the stars. Illustrative catalogue entry."},
  {id:"neon",title:"Neon Ronin",kind:"Anime",year:2025,genre:"Action · Cyberpunk",rating:"9.0",image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80",description:"In a glowing city of tomorrow, a wandering swordsman searches for the truth behind a vanished district. Fictional anime entry."},
  {id:"wild",title:"Wild Horizon",kind:"Movie",year:2023,genre:"Adventure · Nature",rating:"7.8",image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80",description:"A journey into untamed landscapes becomes a discovery of courage and connection. Fictional catalogue entry."},
  {id:"echo",title:"Echoes of Aether",kind:"Anime",year:2025,genre:"Fantasy · Mystery",rating:"8.8",image:"https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=700&q=80",description:"Two unlikely friends uncover an ancient sky map that changes everything they know. Fictional anime entry."},
  {id:"blue",title:"Blue Hour",kind:"Movie",year:2024,genre:"Drama · Romance",rating:"7.9",image:"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=700&q=80",description:"Two strangers meet at the shoreline every evening, each carrying a story they have never told. Fictional catalogue entry."},
  {id:"spirit",title:"Spirit of the Valley",kind:"Animation",year:2022,genre:"Family · Fantasy",rating:"8.5",image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80",description:"A young traveller befriends the guardian of a hidden green valley. Fictional animated title."},
  {id:"afterglow",title:"Afterglow Protocol",kind:"Anime",year:2024,genre:"Sci-Fi · Thriller",rating:"8.7",image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80",description:"A rookie engineer finds a message hidden inside the city's artificial sunrise. Fictional anime entry."},
  {id:"deep",title:"The Deep Blue",kind:"Movie",year:2023,genre:"Documentary · Ocean",rating:"8.2",image:"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=700&q=80",description:"An illustrative ocean-themed catalogue card celebrating the wonders of the sea."},
  {id:"paper",title:"Paper Skies",kind:"Anime",year:2022,genre:"Slice of Life · Drama",rating:"8.6",image:"https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=700&q=80",description:"A quiet story about friendship, growing up, and the dreams we fold into paper planes. Fictional anime entry."}
];
const grid = document.querySelector("#trendingGrid");
const watchlistGrid = document.querySelector("#watchlistGrid");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");
const emptyList = document.querySelector("#emptyList");
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#detailDialog");
const dialogContent = document.querySelector("#dialogContent");
let activeFilter = "All";
let searchTerm = "";
let remoteTitles = null;
let trendingTitles = null;
let searchRequestId = 0;
let toastTimer;
const saved = new Set(readSaved());

function readSaved(){try{return JSON.parse(localStorage.getItem("cineanime-watchlist")||"[]")}catch{return []}}
function persistSaved(){try{localStorage.setItem("cineanime-watchlist",JSON.stringify([...saved]))}catch{showToast("Browser storage is unavailable in this session.")}}
function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2400)}
function matches(item){const kindMatch=activeFilter==="All"||item.kind===activeFilter;const haystack=(item.title+" "+item.kind+" "+item.genre+" "+item.year).toLowerCase();return kindMatch&&haystack.includes(searchTerm.toLowerCase())}
function createCard(item){
  const card=document.createElement("article");card.className="poster-card";
  const art=document.createElement("div");art.className="poster-art";art.tabIndex=0;art.setAttribute("role","button");art.setAttribute("aria-label","View details for "+item.title);
  const img=document.createElement("img");if(item.image)img.src=item.image;else img.style.display="none";img.alt=item.title+" poster";img.loading="lazy";img.onerror=()=>{img.style.display="none";art.style.background="linear-gradient(145deg,#51406d,#171b2c)"};
  const badge=document.createElement("span");badge.className="poster-badge";badge.textContent=item.kind.toUpperCase();
  const save=document.createElement("button");save.className="save-button"+(saved.has(item.id)?" saved":"");save.textContent=saved.has(item.id)?"♥":"♡";save.setAttribute("aria-label",(saved.has(item.id)?"Remove ":"Save ")+item.title);save.addEventListener("click",e=>{e.stopPropagation();toggleSaved(item.id)});
  const bottom=document.createElement("div");bottom.className="poster-bottom";const title=document.createElement("h3");title.textContent=item.title;const sub=document.createElement("p");sub.textContent=item.year+" · ★ "+item.rating;bottom.append(title,sub);art.append(img,badge,save,bottom);
  const info=document.createElement("div");info.className="poster-info";const name=document.createElement("strong");name.textContent=item.title;const rating=document.createElement("span");rating.textContent="★ "+item.rating;info.append(name,rating);card.append(art,info);
  const open=()=>showDetails(item);art.addEventListener("click",open);art.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
  return card;
}
function renderTitles(){grid.replaceChildren();const source=searchTerm?(remoteTitles===null?titles:remoteTitles):(trendingTitles===null?titles:trendingTitles);const filtered=source.filter(matches);filtered.forEach(item=>grid.append(createCard(item)));emptyState.hidden=filtered.length>0}
function renderWatchlist(){watchlistGrid.replaceChildren();const items=titles.filter(item=>saved.has(item.id));items.forEach(item=>watchlistGrid.append(createCard(item)));emptyList.hidden=items.length>0}
function render(){renderTitles();renderWatchlist()}
function toggleSaved(id){if(saved.has(id)){saved.delete(id);showToast("Removed from My List")}else{saved.add(id);showToast("Saved to My List ♡")}persistSaved();render()}
function showDetails(item){
  dialogContent.replaceChildren();
  const art=document.createElement("div");art.className="dialog-art";art.style.backgroundImage="linear-gradient(0deg,#12152100,#12152100),url('"+item.image+"')";
  const body=document.createElement("div");body.className="dialog-body";
  const meta=document.createElement("div");meta.className="dialog-meta";meta.textContent=item.kind+"  ·  "+item.year+"  ·  ★ "+item.rating+"  ·  "+item.genre;
  const h=document.createElement("h2");h.textContent=item.title;
  const p=document.createElement("p");p.textContent=item.description;
  const note=document.createElement("p");note.textContent=String(item.id).startsWith("tmdb-")?"Metadata provided by TMDB. CineAnime does not host this title; use licensed services to watch it.":"This is a demo catalogue entry. The sample player below uses a public CC0 video clip, not this title.";
  const actions=document.createElement("div");actions.className="dialog-actions";
  const save=document.createElement("button");save.className="btn btn-primary";save.textContent=saved.has(item.id)?"♥ Saved to My List":"♡ Add to My List";save.addEventListener("click",()=>{toggleSaved(item.id);save.textContent=saved.has(item.id)?"♥ Saved to My List":"♡ Add to My List"});
  const play=document.createElement("button");play.className="btn btn-glass";play.textContent="▶ Try sample player";play.addEventListener("click",()=>{dialog.close();document.querySelector("#player").scrollIntoView({behavior:"smooth"});showToast("Playing a legal sample clip below.")});
  actions.append(save,play);body.append(meta,h,p,note,actions);dialogContent.append(art,body);if(typeof dialog.showModal==="function")dialog.showModal();else showToast(item.title+" — "+item.description);
}
async function searchTmdb(){
  const requestId=++searchRequestId;
  const query=searchTerm.trim();
  if(query.length<2||activeFilter==="Animation"){remoteTitles=null;renderTitles();return}
  try{
    const category=activeFilter==="Anime"?"anime":activeFilter==="Movie"?"movie":"multi";
    const response=await fetch("/api/search?q="+encodeURIComponent(query)+"&category="+category);
    const data=await response.json();
    if(requestId!==searchRequestId)return;
    if(!response.ok)throw new Error(data.error||"TMDB search failed");
    remoteTitles=Array.isArray(data.results)?data.results:[];
    renderTitles();
    showToast("TMDB results loaded");
  }catch(error){
    if(requestId!==searchRequestId)return;
    remoteTitles=null;
    renderTitles();
    showToast("TMDB unavailable; showing demo titles.");
  }
}
async function loadTrending(){
  try{
    const response=await fetch("/api/trending?type=all");
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Could not load trending titles");
    trendingTitles=Array.isArray(data.results)?data.results:null;
    renderTitles();
    if(trendingTitles)showToast("Trending titles updated from TMDB");
  }catch{
    trendingTitles=null;
    renderTitles();
    showToast("Showing demo titles; trending data is unavailable.");
  }
}
searchInput.addEventListener("input",()=>{searchTerm=searchInput.value.trim();if(!searchTerm){remoteTitles=null;renderTitles();return}searchTmdb();});
document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{activeFilter=button.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("selected",b===button));if(searchTerm)searchTmdb();else{remoteTitles=null;renderTitles()}}));
document.querySelector("#scrollLeft").addEventListener("click",()=>grid.scrollBy({left:-300,behavior:"smooth"}));
document.querySelector("#scrollRight").addEventListener("click",()=>grid.scrollBy({left:300,behavior:"smooth"}));
document.querySelector("#animeExplore").addEventListener("click",()=>{activeFilter="Anime";document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("selected",b.dataset.filter==="Anime"));renderTitles();document.querySelector("#trending").scrollIntoView({behavior:"smooth"})});
document.querySelector("[data-anime-link]").addEventListener("click",()=>{activeFilter="Anime";document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("selected",b.dataset.filter==="Anime"));renderTitles()});
document.querySelector("#clearList").addEventListener("click",()=>{if(!saved.size){showToast("Your list is already empty.");return}saved.clear();persistSaved();render();showToast("My List cleared")});
document.querySelector("#dialogClose").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
document.querySelector("#profileButton").addEventListener("click",()=>showToast("Welcome! This demo does not require an account."));
document.querySelector("#year").textContent=new Date().getFullYear();
render();
loadTrending();
