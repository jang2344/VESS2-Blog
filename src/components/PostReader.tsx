import React from 'react';
import { BlogPost } from '../types';
import Markdown from 'react-markdown';
import { Calendar, Clock, Bookmark, ArrowLeft, Tag, Globe, Settings, PenTool, Edit3 } from 'lucide-react';

interface PostReaderProps {
  post: BlogPost;
  onBack: () => void;
  onEdit: () => void;
}

export default function PostReader({ post, onBack, onEdit }: PostReaderProps) {
  // Format dates: ISO to readable text
  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <article id="editorial-post-reader" className="max-w-3xl mx-auto py-4 space-y-6 animate-fade-in text-slate-900 leading-relaxed">
      {/* Back to Blog Button / Quick Edit controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <button
          id="reader-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 py-1.5 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> 글 목록가기
        </button>

        <button
          id="reader-edit-btn"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-black transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" /> 글 편집하기
        </button>
      </div>

      {/* Meta Headers */}
      <header className="space-y-4">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-mono tracking-widest uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mt-2 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 border-t border-b border-slate-100/80 py-3.5 mt-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {formatDate(post.created_at)}
          </span>
          <span className="h-3.5 w-px bg-slate-200" />
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 읽는 시간 약 {post.read_time || 5}분
          </span>
          <span className="h-3.5 w-px bg-slate-200" />
          <span className={`flex items-center gap-1.5 font-bold ${post.status === 'published' ? 'text-emerald-600' : 'text-amber-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {post.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
          </span>
        </div>
      </header>

      {/* Hero Banner Cover Image */}
      {post.cover_image && (
        <div className="rounded-2xl overflow-hidden aspect-[16/9] border border-slate-100 shadow-sm leading-none bg-slate-100/50">
          <img
            id="reader-cover-img"
            src={post.cover_image}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
          />
        </div>
      )}

      {/* Excerpt Summary Alert Block */}
      {post.excerpt && post.excerpt !== post.title && (
        <div className="p-4 bg-slate-50 border-l border-slate-300 rounded-r-xl text-sm italic text-slate-600 font-serif leading-relaxed">
          {post.excerpt}
        </div>
      )}

      {/* Main post Markdown rendering container */}
      <div id="reader-content-body" className="markdown-body prose max-w-none pt-4 select-text">
        <Markdown>{post.content}</Markdown>
      </div>

      {/* Custom elegant footer footer signoff */}
      <footer className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4 mt-8 font-mono">
        <div>
          <span>Published on <strong>blog.vess2.com</strong> editorial network</span>
        </div>
        <div className="flex gap-4">
          <span>{post.content.length} characters parsed</span>
          <span>•</span>
          <button onClick={onBack} className="hover:text-slate-900 underline transition-colors">
            Back to feed
          </button>
        </div>
      </footer>
    </article>
  );
}
