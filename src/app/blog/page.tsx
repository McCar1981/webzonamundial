// src/app/blog/page.tsx
// ZonaMundial.app — Blog Premium de la Comunidad

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  team: string;
  content: string;
  time: string;
  likes: number;
}

interface BlogPost {
  id: number;
  author: string;
  avatar: string;
  team: string;
  role: string;
  content: string;
  image?: string;
  time: string;
  likes: number;
  comments: Comment[];
  tags: string[];
}

const POSTS: BlogPost[] = [
  {
    id: 1,
    author: "Marcos Analyst",
    avatar: "MA",
    team: "España",
    role: "Analista Táctico",
    content: "El 4-3-3 de Luis de la Fuente ha evolucionado hacia una presión ultraofensiva. Los mecanismos de recuperación en campo rival son brillantes. España tiene argumentos para pelear el Mundial 2026.",
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1200",
    time: "Hace 2 horas",
    likes: 234,
    tags: ["Táctica", "España", "Mundial2026"],
    comments: [
      { id: 1, author: "CarlosM", avatar: "CM", team: "Argentina", content: "Totalmente de acuerdo. El mediocampo español es de lo mejor del mundo.", time: "Hace 1 hora", likes: 45 },
      { id: 2, author: "LuciaF", avatar: "LF", team: "Francia", content: "Pedri y Gavi son el futuro", time: "Hace 45 min", likes: 23 },
    ]
  },
  {
    id: 2,
    author: "Sofía Sports",
    avatar: "SS",
    team: "Francia",
    role: "Periodista",
    content: "Kylian Mbappé llega al Mundial 2026 en su pico absoluto. Con 27 años y capitán de Francia, este puede ser el torneo que consagre su legado como uno de los grandes.",
    image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1200",
    time: "Hace 4 horas",
    likes: 567,
    tags: ["Mbappé", "Francia", "Jugadores"],
    comments: [
      { id: 3, author: "PedroG", avatar: "PG", team: "Brasil", content: "Es un crack, pero Brasil tiene a Vinicius Jr", time: "Hace 3 horas", likes: 89 },
    ]
  },
  {
    id: 3,
    author: "Rodrigo Editor",
    avatar: "RE",
    team: "México",
    role: "Editor Jefe",
    content: "48 equipos en el Mundial: ¿innovación o disolución del torneo? Analizamos los pros y contras del nuevo formato FIFA y qué significa para la calidad del fútbol.",
    time: "Hace 6 horas",
    likes: 189,
    tags: ["Opinión", "Formato", "FIFA"],
    comments: []
  },
  {
    id: 4,
    author: "Lars Corresponsal",
    avatar: "LC",
    team: "Noruega",
    role: "Europa",
    content: "Haaland tiene el peso de toda una nación sobre sus hombros. Noruega vuelve al Mundial tras 24 años gracias a sus 17 goles en eliminatorias. ¿Puede un solo jugador llevar a su equipo lejos?",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200",
    time: "Hace 8 horas",
    likes: 312,
    tags: ["Haaland", "Noruega", "Jugadores"],
    comments: [
      { id: 4, author: "MariaT", avatar: "MT", team: "España", content: "La historia dice que no, pero Haaland es diferente...", time: "Hace 7 horas", likes: 56 },
    ]
  },
];

function CommentCard({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border border-[#c9a84c]/30 flex items-center justify-center text-xs font-bold text-[#c9a84c] shrink-0">
        {comment.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-white text-sm">{comment.author}</span>
          <span className="text-xs text-[#c9a84c]">{comment.team}</span>
          <span className="text-xs text-gray-600">{comment.time}</span>
        </div>
        <p className="text-sm text-gray-300">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2">
          <button className="text-xs text-gray-500 hover:text-[#c9a84c] transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {comment.likes}
          </button>
          <button className="text-xs text-gray-500 hover:text-white transition-colors">Responder</button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, isTop }: { post: BlogPost; isTop?: boolean }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div className="group bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:border-[#c9a84c]/30 hover:shadow-[0_12px_40px_rgba(201,168,76,0.12)] hover:-translate-y-1 transition-all duration-300">
      {/* Header */}
      <div className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border-2 border-[#c9a84c]/30 flex items-center justify-center text-sm font-bold text-[#c9a84c]">
          {post.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{post.author}</span>
            {post.role && <span className="text-xs text-gray-500">· {post.role}</span>}
            {isTop && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#030712] animate-pulse">
                Top
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#c9a84c]">{post.team}</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500">{post.time}</span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-5 pb-4">
        <p className="text-gray-200 leading-relaxed text-lg">{post.content}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags.map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 hover:bg-[#c9a84c]/20 cursor-pointer transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Imagen */}
      {post.image && (
        <div className="px-5 pb-5">
          <div className="relative rounded-2xl overflow-hidden group/img">
            <img src={post.image} alt="Post" className="w-full h-64 lg:h-80 object-cover group-hover/img:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/50 to-transparent" />
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="px-5 py-4 border-t border-white/5 flex items-center gap-6">
        <button onClick={() => setLiked(!liked)} className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
          <svg className="w-6 h-6" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">{post.likes + (liked ? 1 : 0)}</span>
        </button>
        
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-500 hover:text-[#c9a84c] transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-medium">{post.comments.length}</span>
        </button>
      </div>

      {/* Comentarios */}
      {showComments && (
        <div className="px-5 py-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border border-[#c9a84c]/30 flex items-center justify-center text-xs font-bold text-[#c9a84c] shrink-0">
              YO
            </div>
            <input type="text" placeholder="Escribe un comentario..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a84c]/50" />
          </div>
          <div className="space-y-1">
            {post.comments.map(comment => <CommentCard key={comment.id} comment={comment} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlogPage() {
  const [newPost, setNewPost] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const bT = t.blogPage;

  useEffect(() => {
    if (!heroRef.current) return;
    gsap.fromTo(heroRef.current.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#030712]">
      <div className="h-1 bg-gradient-to-r from-[#c9a84c] via-[#e8d48b] to-[#c9a84c]" />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div ref={heroRef} className="mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse"></span>
            <span className="text-xs font-bold text-[#c9a84c] tracking-wider uppercase">{bT.badge}</span>
          </div>

          {/* Título */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">{bT.title1}</span>{' '}
            <span className="bg-gradient-to-r from-[#c9a84c] via-[#FDE68A] to-[#c9a84c] bg-clip-text text-transparent">
              {bT.title2}
            </span>
          </h1>

          {/* Descripción */}
          <p className="text-lg text-gray-400 max-w-2xl">
            {bT.subtitle}
          </p>
        </div>

        {/* Crear post */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 mb-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border-2 border-[#c9a84c]/30 flex items-center justify-center text-sm font-bold text-[#c9a84c]">
              YO
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="¿Qué opinas del Mundial 2026?"
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[80px] text-lg"
                rows={3}
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <button className="px-6 py-2.5 rounded-xl bg-[#c9a84c] text-black font-bold disabled:opacity-50 hover:bg-[#e8d48b] transition-colors">
                  {bT.publishBtn}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <AnimatedSection className="space-y-6" stagger={0.12} y={30}>
          {POSTS.map((post) => (
            <PostCard key={post.id} post={post} isTop={post.likes === Math.max(...POSTS.map(p => p.likes))} />
          ))}
        </AnimatedSection>
      </div>
    </div>
  );
}
