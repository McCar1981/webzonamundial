"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Post } from "@/sanity/types";
import { useLanguage } from "@/i18n/LanguageContext";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14",
  BG2 = "#0F1D32",
  GOLD = "#c9a84c",
  DIM = "#6a7a9a";
const flagUrl = (c: string, w = 80) =>
  c ? `https://flagcdn.com/w${w}/${c}.png` : null;

const CATEGORY_COLORS = {
  all: GOLD,
  analisis: "#3b82f6",
  datos: "#22c55e",
  historia: "#f59e0b",
  sedes: "#e879f9",
  selecciones: "#ef4444",
  plataforma: "#06b6d4",
};

const MONTHS_ES: Record<string, string> = {
  "01": "Ene",
  "02": "Feb",
  "03": "Mar",
  "04": "Abr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dic",
};

const fmtBlogDate = (d: string) => {
  const p = d.split("-");
  return `${parseInt(p[2])} ${MONTHS_ES[p[1]]} ${p[0]}`;
};

function AnimatedBadge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{
        background: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {children}
    </span>
  );
}

function FeaturedCard({
  post,
  onClick,
  index,
  categories,
  readTimeLabel,
  sourcePrefix,
}: {
  post: Post;
  onClick: (p: Post) => void;
  index: number;
  categories: { id: string; label: string; color: string }[];
  readTimeLabel: string;
  sourcePrefix: string;
}) {
  const cat = categories.find((c) => c.id === post.cat);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 60, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        delay: index * 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
          once: true,
        },
      }
    );
  }, [index]);

  return (
    <div ref={cardRef} onClick={() => onClick(post)} className="group cursor-pointer">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/5 hover:border-[var(--cat-color)]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        style={{ "--cat-color": cat?.color } as React.CSSProperties}
      >
        <div
          className="absolute inset-0"
          style={
            post.realImage
              ? {
                  backgroundImage: `url(${post.realImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: `linear-gradient(135deg,${cat?.color}20,#0F1D32)` }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--cat-color)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative p-8 min-h-[280px] flex flex-col justify-end">
          <div className="flex items-center gap-3 mb-4">
            {post.flags.length > 0 && (
              <div className="flex gap-1.5">
                {post.flags.slice(0, 5).map((f) => (
                  <img
                    key={f}
                    src={flagUrl(f, 40) || ""}
                    alt=""
                    className="w-6 h-4 rounded object-cover shadow-lg border border-white/10"
                  />
                ))}
              </div>
            )}
            <AnimatedBadge color={cat?.color || GOLD}>{cat?.label}</AnimatedBadge>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 group-hover:text-[#C9A84C] transition-colors leading-tight">
            {post.title}
          </h3>
          <p className="text-sm text-[#8a94b0] mb-4 line-clamp-2">{post.excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-[#6a7a9a]">
            <span>{fmtBlogDate(post.date)}</span>
            <span className="w-1 h-1 rounded-full bg-[#6a7a9a]" />
            <span>{post.readTime} {readTimeLabel}</span>
          </div>
          {post.imageCaption && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] text-[#4a5570] italic">{post.imageCaption}</p>
              {post.imageSource && (
                <p className="text-[9px] text-[#4a5570] mt-1">{sourcePrefix} {post.imageSource}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({
  post,
  onClick,
  index,
  categories,
}: {
  post: Post;
  onClick: (p: Post) => void;
  index: number;
  categories: { id: string; label: string; color: string }[];
}) {
  const cat = categories.find((c) => c.id === post.cat);
  const cardRef = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay: index * 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 90%",
          once: true,
        },
      }
    );
  }, [index]);

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(post)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="group cursor-pointer"
    >
      <div
        className="relative p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
        style={{
          background: hov ? `${cat?.color}08` : BG2,
          borderColor: hov ? `${cat?.color}40` : "rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-2.5 py-1 rounded-md text-[10px] font-bold"
            style={{ background: `${cat?.color}15`, color: cat?.color }}
          >
            {cat?.label}
          </span>
          {post.flags.slice(0, 3).map((f) => (
            <img
              key={f}
              src={flagUrl(f, 30) || ""}
              alt=""
              className="w-4 h-3 rounded object-cover"
            />
          ))}
          <span className="text-[10px] text-[#4a5570] ml-auto">{post.readTime} min</span>
        </div>
        <h3
          className="text-base font-bold mb-2 transition-colors"
          style={{ color: hov ? GOLD : "#fff" }}
        >
          {post.title}
        </h3>
        <p className="text-xs text-[#6a7a9a] line-clamp-2">{post.excerpt}</p>
        <div className="text-[10px] text-[#4a5570] mt-3">{fmtBlogDate(post.date)}</div>
      </div>
    </div>
  );
}

function PostDetail({ post, onBack, categories, labels }: {
  post: Post;
  onBack: () => void;
  categories: { id: string; label: string; color: string }[];
  labels: { backBtn: string; readTime: string; fullArticle: string; ctaQ: string; ctaBtn: string; shareLabel: string; sourcePrefix: string };
}) {
  const cat = categories.find((c) => c.id === post.cat);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
    );
  }, [post.id]);

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#C9A84C] text-sm font-semibold mb-6 hover:gap-3 transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {labels.backBtn}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <AnimatedBadge color={cat?.color || GOLD}>{cat?.label}</AnimatedBadge>
        <span className="text-sm text-[#4a5570]">{fmtBlogDate(post.date)}</span>
        <span className="text-[#4a5570]">·</span>
        <span className="text-sm text-[#4a5570]">{post.readTime} {labels.readTime}</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black mb-6 leading-tight">{post.title}</h1>

      {post.realImage && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-white/10">
          <img
            src={post.realImage}
            alt={post.title}
            className="w-full h-auto max-h-[400px] object-cover"
          />
          {post.imageCaption && (
            <div className="p-3 bg-[#0B1825] border-t border-white/5">
              <p className="text-xs text-[#6a7a9a] italic">{post.imageCaption}</p>
              {post.imageSource && (
                <p className="text-[10px] text-[#4a5570] mt-1">{labels.sourcePrefix} {post.imageSource}</p>
              )}
            </div>
          )}
        </div>
      )}

      {post.flags.length > 0 && (
        <div className="flex gap-2 mb-8">
          {post.flags.map((f) => (
            <img
              key={f}
              src={flagUrl(f, 80) || ""}
              alt=""
              className="w-10 h-7 rounded object-cover shadow-lg border border-white/10"
            />
          ))}
        </div>
      )}

      <div className="p-8 rounded-2xl bg-[#0F1D32] border border-white/5 mb-8">
        <p className="text-[#d0d4de] text-lg leading-relaxed mb-6">{post.excerpt}</p>
        <div className="h-px bg-white/5 my-6" />
        <p className="text-[#8a94b0] leading-relaxed">
          {labels.fullArticle}
        </p>
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-[#c9a84c]/10 to-transparent border border-[#c9a84c]/20 text-center">
          <p className="text-sm text-[#8a94b0] mb-4">{labels.ctaQ}</p>
          <Link
            href="/registro"
            className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#060B14] font-bold text-sm hover:shadow-lg hover:shadow-[#c9a84c]/25 transition-all"
          >
            {labels.ctaBtn}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-10">
        <span className="text-xs text-[#6a7a9a]">{labels.shareLabel}</span>
        {["Twitter", "WhatsApp", "Copiar"].map((s) => (
          <button
            key={s}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#c9a84c]/20 bg-[#c9a84c]/5 text-[#c9a84c] hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/30 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NoticiasClient({ posts }: { posts: Post[] }) {
  const [cat, setCat] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const nT = t.noticiasPage;

  const CATEGORIES = [
    { id: "all", label: nT.catAll, color: CATEGORY_COLORS.all },
    { id: "analisis", label: nT.catAnalisis, color: CATEGORY_COLORS.analisis },
    { id: "datos", label: nT.catDatos, color: CATEGORY_COLORS.datos },
    { id: "historia", label: nT.catHistoria, color: CATEGORY_COLORS.historia },
    { id: "sedes", label: nT.catSedes, color: CATEGORY_COLORS.sedes },
    { id: "selecciones", label: nT.catSelecciones, color: CATEGORY_COLORS.selecciones },
    { id: "plataforma", label: nT.catPlataforma, color: CATEGORY_COLORS.plataforma },
  ];

  const filtered = cat === "all" ? posts : posts.filter((p) => p.cat === cat);
  const featured = filtered.filter((p) => p.featured);
  const regular = filtered.filter((p) => !p.featured);

  useEffect(() => {
    if (!heroRef.current) return;
    gsap.fromTo(
      heroRef.current.children,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    if (!categoriesRef.current) return;
    gsap.fromTo(
      categoriesRef.current.children,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
        scrollTrigger: {
          trigger: categoriesRef.current,
          start: "top 90%",
          once: true,
        },
      }
    );
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-4 pt-0 pb-12 sm:pb-16">
        {selectedPost ? (
          <PostDetail
            post={selectedPost}
            onBack={() => setSelectedPost(null)}
            categories={CATEGORIES}
            labels={{
              backBtn: nT.backBtn,
              readTime: nT.readTime,
              fullArticle: nT.fullArticle,
              ctaQ: nT.ctaQ,
              ctaBtn: nT.ctaBtn,
              shareLabel: nT.shareLabel,
              sourcePrefix: nT.sourcePrefix,
            }}
          />
        ) : (
          <>
            <div ref={heroRef} className="mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
                <span className="text-[#c9a84c] text-xs font-bold tracking-wider uppercase">
                  {nT.badge}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                {nT.title1}
                <br />
                <span className="bg-gradient-to-r from-[#c9a84c] via-[#e8d48b] to-[#c9a84c] bg-clip-text text-transparent">
                  {nT.title2}
                </span>
              </h1>
              <p className="text-lg text-[#8a94b0] max-w-xl leading-relaxed">
                {nT.subtitle}
              </p>
            </div>

            <div
              ref={categoriesRef}
              className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide"
            >
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300"
                  style={{
                    background: cat === c.id ? `${c.color}15` : "transparent",
                    border: `1px solid ${cat === c.id ? `${c.color}40` : "rgba(255,255,255,0.05)"}`,
                    color: cat === c.id ? c.color : DIM,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {featured.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {featured.map((p, i) => (
                  <FeaturedCard key={p.id} post={p} onClick={setSelectedPost} index={i} categories={CATEGORIES} readTimeLabel={nT.readTime} sourcePrefix={nT.sourcePrefix} />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regular.map((p, i) => (
                <ArticleCard key={p.id} post={p} onClick={setSelectedPost} index={i} categories={CATEGORIES} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 text-[#6a7a9a]">
                {nT.noArticles}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
