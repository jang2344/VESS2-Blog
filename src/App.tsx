/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BlogPost, SupabaseConfigProps } from './types';
import { STARTER_POSTS } from './data';
import { getSupabaseClient } from './lib/supabaseClient';
import SupabaseSetup from './components/SupabaseSetup';
import EditorView from './components/EditorView';
import PostReader from './components/PostReader';

// Icons
import { 
  BookOpen, 
  Plus, 
  Database, 
  Search, 
  SlidersHorizontal,
  Cloud,
  ChevronRight,
  Trash2,
  Edit,
  Sparkles,
  Info,
  ExternalLink,
  Tag
} from 'lucide-react';

export default function App() {
  // Current active view: 'list' | 'read' | 'edit' | 'setup'
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'setup'>('list');
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Supabase Configurations from LocalStorage or default
  const [dbConfig, setDbConfig] = useState<SupabaseConfigProps>(() => {
    try {
      const saved = localStorage.getItem('vess2_supabase_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      url: '',
      anonKey: '',
      useSupabase: false
    };
  });

  // Post states
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Sync Supabase settings to localStorage on update
  useEffect(() => {
    localStorage.setItem('vess2_supabase_config', JSON.stringify(dbConfig));
  }, [dbConfig]);

  // Load all posts (from Supabase if configured & connected, otherwise default local storage)
  const loadPosts = async () => {
    setDbLoading(true);
    let loaded: BlogPost[] = [];

    if (dbConfig.useSupabase && dbConfig.url && dbConfig.anonKey) {
      try {
        const supabase = getSupabaseClient(dbConfig.url, dbConfig.anonKey);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          loaded = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt || '',
            content: p.content,
            status: p.status,
            tags: Array.isArray(p.tags) ? p.tags : [],
            cover_image: p.cover_image || '',
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
            read_time: p.read_time || 5
          }));
        }
      } catch (err: any) {
        console.error("Supabase load error, falling back to LocalStorage:", err);
        alert(`Supabase 연동 오류가 발생하여 안전을 위해 '로컬 저장소' 데이터가 로드되었습니다: ${err.message || err}`);
        // Fallback to local
        loaded = getLocalPosts();
      }
    } else {
      loaded = getLocalPosts();
    }

    setPosts(loaded);
    setDbLoading(false);
  };

  const getLocalPosts = (): BlogPost[] => {
    try {
      const saved = localStorage.getItem('vess2_local_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    // Initialize Local Storage with Starter posts on first load
    localStorage.setItem('vess2_local_posts', JSON.stringify(STARTER_POSTS));
    return STARTER_POSTS;
  };

  // Run on start and whenever DB toggle switches
  useEffect(() => {
    loadPosts();
  }, [dbConfig.useSupabase]);

  // Update localStorage helper
  const saveLocalPosts = (newPosts: BlogPost[]) => {
    localStorage.setItem('vess2_local_posts', JSON.stringify(newPosts));
    if (!dbConfig.useSupabase) {
      setPosts(newPosts);
    }
  };

  // Create or Update Blog Post
  const handleSavePost = async (postData: Partial<BlogPost>) => {
    setSaveLoading(true);
    
    const now = new Date().toISOString();
    const isNew = !postData.id;
    const postId = postData.id || `vess2-uuid-${Date.now()}`;

    const completePost: BlogPost = {
      id: postId,
      title: postData.title || 'Untitled',
      slug: postData.slug || `post-${Date.now()}`,
      excerpt: postData.excerpt || '',
      content: postData.content || '',
      status: postData.status || 'draft',
      tags: postData.tags || [],
      cover_image: postData.cover_image || '',
      read_time: postData.read_time || 5,
      created_at: isNew ? now : (postData.created_at || now),
      updated_at: now
    };

    if (dbConfig.useSupabase && dbConfig.url && dbConfig.anonKey) {
      try {
        const supabase = getSupabaseClient(dbConfig.url, dbConfig.anonKey);
        
        let error;
        if (isNew) {
          // SQL columns should match model
          const { error: insertErr } = await supabase
            .from('posts')
            .insert([{
              id: completePost.id,
              title: completePost.title,
              slug: completePost.slug,
              excerpt: completePost.excerpt,
              content: completePost.content,
              status: completePost.status,
              tags: completePost.tags,
              cover_image: completePost.cover_image,
              read_time: completePost.read_time,
              created_at: completePost.created_at,
              updated_at: completePost.updated_at
            }]);
          error = insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('posts')
            .update({
              title: completePost.title,
              slug: completePost.slug,
              excerpt: completePost.excerpt,
              content: completePost.content,
              status: completePost.status,
              tags: completePost.tags,
              cover_image: completePost.cover_image,
              read_time: completePost.read_time,
              updated_at: completePost.updated_at
            })
            .eq('id', completePost.id);
          error = updateErr;
        }

        if (error) throw error;

        // Sync local cache
        const locals = getLocalPosts();
        const index = locals.findIndex(p => p.id === completePost.id);
        if (index > -1) {
          locals[index] = completePost;
        } else {
          locals.unshift(completePost);
        }
        localStorage.setItem('vess2_local_posts', JSON.stringify(locals));

        await loadPosts(); // Reload from cloud
        setActiveTab('list');
        setReadingPost(completePost); // Show post detail after save
        setEditingPost(null);
      } catch (err: any) {
        console.error("Supabase Save Error, saving to local instead:", err);
        alert(`Supabase 저장 오류가 발생하였습니다: ${err.message || err}\n안전을 위해 글이 '로컬 브라우저 디바이스'에 보존되었습니다.`);
        
        // Save to local storage cache anyway so writing is never lost!
        const locals = getLocalPosts();
        saveLocalPostAndSwitch(locals, completePost);
      }
    } else {
      // Local Database Only
      const locals = getLocalPosts();
      saveLocalPostAndSwitch(locals, completePost);
    }
    
    setSaveLoading(false);
  };

  const saveLocalPostAndSwitch = (locals: BlogPost[], completePost: BlogPost) => {
    const index = locals.findIndex(p => p.id === completePost.id);
    if (index > -1) {
      locals[index] = completePost;
    } else {
      locals.unshift(completePost);
    }
    saveLocalPosts(locals);
    setActiveTab('list');
    setReadingPost(completePost);
    setEditingPost(null);
  };

  // Delete Post
  const handleDeletePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click
    
    if (!confirm("정말 이 블로그 글을 영구 삭제하시겠습니까?")) {
      return;
    }

    if (dbConfig.useSupabase && dbConfig.url && dbConfig.anonKey) {
      try {
        const supabase = getSupabaseClient(dbConfig.url, dbConfig.anonKey);
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err: any) {
        console.error("Supabase Delete Error:", err);
        alert(`Supabase 클라우드 삭제 진행 중 에러 발생: ${err.message || err}`);
      }
    }

    // Always exclude from local list
    const locals = getLocalPosts();
    const updated = locals.filter(p => p.id !== id);
    saveLocalPosts(updated);
    
    if (readingPost?.id === id) {
      setReadingPost(null);
    }
    await loadPosts();
  };

  // Bulk migration tool: takes all local posts and uploads them to Supabase
  const handleMigratePosts = async () => {
    if (!dbConfig.url || !dbConfig.anonKey) {
      return { success: false, count: 0, error: "Supabase URL과 Key를 설정해 주세요." };
    }

    try {
      const supabase = getSupabaseClient(dbConfig.url, dbConfig.anonKey);
      const locals = getLocalPosts();

      let successCount = 0;
      for (const post of locals) {
        // UPSERT so we don't duplicate on same IDs
        const { error } = await supabase
          .from('posts')
          .upsert({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            status: post.status,
            tags: post.tags,
            cover_image: post.cover_image,
            read_time: post.read_time,
            created_at: post.created_at,
            updated_at: post.updated_at
          });

        if (error) {
          console.error(`Post ${post.title} migration error:`, error);
        } else {
          successCount++;
        }
      }

      await loadPosts(); // Reload list
      return { success: true, count: successCount };
    } catch (err: any) {
      console.error("Migration fatal error:", err);
      return { success: false, count: 0, error: err.message || err };
    }
  };

  // Filter lists based on search keys and tags
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  // Extract all distinct tags for filtering
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  // Navigation handlers
  const handleWriteBtn = () => {
    setEditingPost(null);
    setReadingPost(null);
    setActiveTab('edit');
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      
      {/* Editorial Domain Title Rail (blog.vess2.com Banner) */}
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Elegant Header Pairings */}
            <div 
              onClick={() => { setActiveTab('list'); setReadingPost(null); }} 
              className="flex items-baseline gap-2 cursor-pointer select-none"
            >
              <h1 className="font-serif text-xl tracking-tight font-extrabold text-slate-950 hover:opacity-80 transition">
                blog.vess2.com
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase hidden sm:inline">
                EDITORIAL
              </span>
            </div>

            {/* Main Tabs Navigation */}
            <nav className="flex items-center gap-1">
              <button
                id="tab-feed"
                onClick={() => { setActiveTab('list'); setReadingPost(null); }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                  activeTab === 'list' && !readingPost
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> 글 목록
              </button>

              <button
                id="tab-write"
                onClick={handleWriteBtn}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                  activeTab === 'edit'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> 새 글 작성
              </button>

              <button
                id="tab-setup"
                onClick={() => { setActiveTab('setup'); setReadingPost(null); }}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition ${
                  activeTab === 'setup'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> Supabase 백엔드
              </button>
            </nav>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2">
              <div className={`text-[10px] items-center gap-1.5 font-bold font-mono px-2.5 py-1 rounded-full border hidden md:flex ${
                dbConfig.useSupabase 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                <Cloud className={`w-3 h-3 ${dbConfig.useSupabase ? 'text-emerald-500' : 'text-slate-400'}`} />
                {dbConfig.useSupabase ? 'SUPABASE ACTIVE' : 'LOCAL ENGINE'}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        
        {/* Dynamic Display Router */}
        {readingPost ? (
          /* Reader View */
          <PostReader 
            post={readingPost} 
            onBack={() => setReadingPost(null)}
            onEdit={() => {
              setEditingPost(readingPost);
              setReadingPost(null);
              setActiveTab('edit');
            }}
          />
        ) : activeTab === 'edit' ? (
          /* Create or Edit Post View */
          <EditorView 
            post={editingPost}
            onSave={handleSavePost}
            onCancel={() => {
              setActiveTab('list');
              setEditingPost(null);
            }}
            isSaving={saveLoading}
          />
        ) : activeTab === 'setup' ? (
          /* Supabase Settings Dashboard */
          <SupabaseSetup 
            config={dbConfig}
            onChange={setDbConfig}
            localPostsCount={posts.length}
            onMigratePosts={handleMigratePosts}
          />
        ) : (
          /* List Feed View */
          <div className="space-y-8 animate-fade-in">
            
            {/* Large Welcome Slogan Hero */}
            <div className="border-b border-slate-100 pb-8 flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
              <div>
                <p className="text-xs font-mono font-bold tracking-widest text-[#3B82F6] uppercase">blog.vess2.com</p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 mt-1 tracking-tight">
                  심플함과 몰입을 위한 기록 정원
                </h2>
                <p className="text-slate-500 text-sm mt-2 max-w-2xl font-serif">
                  세련된 스타일의 타이포그래피 설계로 독서의 품질을 보존하고, Supabase 오픈소스 데이터베이스 연동 및 Gemini 고성능 인공지능 글쓰기 솔루션이 통합된 차세대 에디토리얼 허브입니다.
                </p>
              </div>

              <button
                id="hero-write-btn"
                onClick={handleWriteBtn}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black self-start md:self-end flex items-center gap-1 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> 새로운 생각 올리기
              </button>
            </div>

            {/* Quick Banner showing if user has API key and instructions */}
            {!dbConfig.useSupabase && (
              <div className="p-3 bg-indigo-50 border border-indigo-100/60 rounded-xl flex items-center justify-between text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>현재 <strong>로컬 브라우저 임시보관함</strong> 상태입니다. 완벽한 백엔드 운영을 원하시면 상단의 <strong>Supabase 백엔드</strong> 연동 탭을 활성화하세요!</span>
                </div>
                <button 
                  onClick={() => setActiveTab('setup')} 
                  className="px-2.5 py-1 bg-white hover:bg-indigo-100 rounded-md font-semibold text-indigo-700 font-mono text-[10px] transition border border-indigo-200"
                >
                  기입하기
                </button>
              </div>
            )}

            {/* Filtering Control Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
              
              {/* Search Element */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="feed-search-input"
                  type="text"
                  placeholder="작성한 내용이나 제목 태그 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 transition"
                />
              </div>

              {/* Tag filtering pills scroll list */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono uppercase font-bold flex-shrink-0 ml-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filtering
                </span>
                
                <button
                  id="tag-all-btn"
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    !selectedTag 
                      ? 'bg-slate-950 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>

                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition ${
                      selectedTag === tag 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-zinc-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

            </div>

            {/* Blog Post List Rendering (Main Grid) */}
            {dbLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-mono text-slate-500 font-medium">데이터 로드 중...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-900 mt-4">조건에 부합하는 글을 찾을 수 없습니다</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">검색어 철자를 변경하시거나 새 글을 작성하여 기사를 발행해 보세요.</p>
                <button
                  id="empty-action-write-btn"
                  onClick={handleWriteBtn}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  첫번째 수필 작성하러 가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setReadingPost(post)}
                    className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-400 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
                  >
                    
                    {/* Cover image wrap */}
                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden leading-none select-none">
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                          <BookOpen className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      
                      {/* Interactive Edit / Trash badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPost(post);
                            setActiveTab('edit');
                          }}
                          className="p-1.5 bg-white/95 rounded-lg border border-slate-200 text-slate-700 hover:bg-white hover:text-indigo-600 transition shadow-xs"
                          title="글 수정"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1.5 bg-white/95 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition shadow-xs"
                          title="글 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Pill indicating drafted vs published status */}
                      <span className={`absolute bottom-3 left-3 px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md text-white ${post.status === 'published' ? 'bg-emerald-600/90' : 'bg-amber-600/90'}`}>
                        {post.status}
                      </span>

                    </div>

                    {/* Article content info block */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-2">
                        {/* Tags list */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[9px] font-mono font-semibold text-slate-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {post.excerpt || post.title}
                        </p>
                      </div>

                      {/* Footer Metadata */}
                      <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 text-slate-500 font-bold group-hover:text-indigo-600 transition-colors">
                          READ ARTICLE <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                    </div>

                  </article>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Shared Footer block */}
      <footer className="border-t border-slate-200/80 bg-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-slate-800">blog.vess2.com</span>
            <span>•</span>
            <span>All ideas catalogued organically.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Powering React, Tailwind CSS, Supabase & Gemini API</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
