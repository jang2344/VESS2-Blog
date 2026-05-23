import React, { useState } from 'react';
import { BlogPost } from '../types';
import { Save, Sparkles, Wand2, Eye, FileText, Check, AlertCircle, ArrowLeft, Image, Tag, Link } from 'lucide-react';

interface EditorViewProps {
  post: BlogPost | null;
  onSave: (post: Partial<BlogPost>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function EditorView({ post, onSave, onCancel, isSaving }: EditorViewProps) {
  // Post Details
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(', ') || '');
  const [coverImage, setCoverImage] = useState(post?.cover_image || '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft');
  const [readTime, setReadTime] = useState<number>(post?.read_time || 5);

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStyle, setAiStyle] = useState('polished, natural, storytelling');
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Calculate estimated read time based on text length (approx 400 words per min for Korean)
  const calculateWordCountAndReadTime = (text: string) => {
    const chars = text.length;
    const minutes = Math.max(1, Math.ceil(chars / 400));
    setReadTime(minutes);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    calculateWordCountAndReadTime(val);
  };

  const generateSlugFromTitle = () => {
    if (!title) return;
    const generated = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9가-힣\s-]/g, '') // Keep Korean, alphanumeric, and spaces/dashes
      .trim()
      .replace(/\s+/g, '-');
    setSlug(generated);
  };

  const triggerSearchGroundingAndPostGeneration = async (task: 'draft' | 'improve' | 'excerpt' | 'tags' | 'titles') => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    const requestBody: any = { task };

    if (task === 'draft' || task === 'titles') {
      if (!aiPrompt) {
        setAiError('AI 조력을 위해 프롬프트나 아이디어를 기입해 주세요.');
        setAiLoading(false);
        return;
      }
      requestBody.prompt = aiPrompt;
      requestBody.style = aiStyle;
    } else {
      if (!content) {
        setAiError('현재 작성 중인 본문 내용이 없습니다.');
        setAiLoading(false);
        return;
      }
      requestBody.text = content;
      requestBody.style = aiStyle;
    }

    try {
      const response = await fetch('/api/assistant/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '콘텐츠 작성 도중 서버 오류가 발생하였습니다.');
      }

      setAiResult(data.result);
    } catch (err: any) {
      setAiError(err.message || 'AI 어시스턴트 로드 실패. Settings > Secrets에서 GEMINI_API_KEY 상태를 확인해 주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiResult = (task: string) => {
    if (!aiResult) return;
    
    if (task === 'draft' || task === 'improve') {
      setContent(aiResult);
      calculateWordCountAndReadTime(aiResult);
    } else if (task === 'excerpt') {
      setExcerpt(aiResult);
    } else if (task === 'tags') {
      try {
        // Try parsing JSON list if dynamic
        let parsed = JSON.parse(aiResult);
        if (Array.isArray(parsed)) {
          setTagsInput(parsed.join(', '));
        } else {
          setTagsInput(aiResult.replace(/[\[\]"]/g, ''));
        }
      } catch (e) {
        setTagsInput(aiResult.replace(/[\[\]"]/g, ''));
      }
    } else if (task === 'titles') {
      // Prompt user to pick one or prefill title
      const cleanTitles = aiResult.split('\n').map(t => t.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
      if (cleanTitles.length > 0) {
        setTitle(cleanTitles[0]);
      }
    }
    setAiResult(null);
    setAiPrompt('');
  };

  const handleSaveClick = () => {
    if (!title.trim()) {
      alert('어귀 글의 제목을 작성해주세요.');
      return;
    }
    if (!slug.trim()) {
      alert('접근 경로 주소(slug)를 설정해주세요.');
      return;
    }

    const processedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onSave({
      id: post?.id,
      title,
      slug,
      excerpt: excerpt || title,
      content,
      tags: processedTags,
      cover_image: coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      status,
      read_time: readTime || 5,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <button
          id="editor-back-btn"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors py-1.5 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> 목록돌아가기
        </button>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              id="draft-status-btn"
              onClick={() => setStatus('draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${status === 'draft' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Draft (임시)
            </button>
            <button
              id="publish-status-btn"
              onClick={() => setStatus('published')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${status === 'published' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Publish (발행)
            </button>
          </div>
          <button
            id="editor-save-btn"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-black rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main form section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div>
              <input
                id="post-title-input"
                type="text"
                placeholder="글의 멋진 제목을 적어주세요..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={generateSlugFromTitle}
                className="w-full text-2xl lg:text-3xl font-serif font-bold text-slate-900 placeholder:text-slate-300 border-b border-slate-200 focus:border-slate-800 focus:ring-0 pb-2 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Link className="w-3.5 h-3.5" /> URL 슬러그 (Slug)
                </label>
                <input
                  id="post-slug-input"
                  type="text"
                  placeholder="aesthetics-of-simplicity"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Image className="w-3.5 h-3.5" /> 타이틀 커버 이미지 URL (선택)
                </label>
                <input
                  id="post-image-input"
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> 태그 (반점 ',' 구분)
                </label>
                <input
                  id="post-tags-input"
                  type="text"
                  placeholder="디자인, 미니멀리즘, 인사이트"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> 글 요약문 (Excerpt)
                </label>
                <input
                  id="post-excerpt-input"
                  type="text"
                  placeholder="기사 목록 카드에 노출되는 기사 핵심 요약문입니다..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold text-slate-500 uppercase">에디터 본문 (마크다운 지원)</label>
              <span className="text-[10px] font-mono text-slate-400">읽는 시간 약 {readTime}분 ({content.length}자)</span>
            </div>
            <textarea
              id="post-content-textarea"
              placeholder="# 본문 제목 작성&#10;&#10;마크다운 문법으로 아름다운 수필, 기술 기사를 자유롭게 타이핑하세요.&#10;오른쪽의 AI 글쓰기 교정 비서를 활용하여 더욱 미려한 어휘로 다듬을 수 있습니다."
              value={content}
              rows={22}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm leading-relaxed focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 outline-none transition"
            />
          </div>
        </div>

        {/* Gemini AI Smart Assistant Module */}
        <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-lg text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-slate-950">Gemini AI 스마트 비서</h4>
              <p className="text-[10px] text-slate-400">blog.vess2.com 집필 생산성 솔루션</p>
            </div>
          </div>

          {/* AI Task list */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">1단계: 영감의 단초 (기사 아이디어 / 주제 키워드 기입)</label>
              <textarea
                id="ai-prompt-input"
                placeholder="예: '블로그 마크다운의 중요성', '심플한 라이프 스타일을 유지하기 위한 가이드라인'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">2단계: 글쓰기 지향 어조 (어법)</label>
              <select
                id="ai-tone-select"
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="polished, warm, poetic, philosophical (인문학적 어조)">인문학적 / 따뜻한 명상풍</option>
                <option value="minimalist, direct, concise, logical (직설적 어조)">간결하고 정밀한 논리풍</option>
                <option value="professional developer, clean technical writer (개발 트렌드 스타일)">기술 전문성 블로거 스타일</option>
                <option value="witty, interactive, engaging (감각적 스타일)">트렌디하고 위트있는 대화형</option>
              </select>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium pt-1">
              <button
                id="ai-draft-btn"
                onClick={() => triggerSearchGroundingAndPostGeneration('draft')}
                disabled={aiLoading}
                className="py-2.5 px-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-semibold"
                title="기입한 주제로 마크다운 기사 한 편 전체 구성"
              >
                ✨ 초안 편필하기
              </button>
              <button
                id="ai-improve-btn"
                onClick={() => triggerSearchGroundingAndPostGeneration('improve')}
                disabled={aiLoading}
                className="py-2.5 px-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                title="에디터 본문의 문법을 교정하고 세련되게 다듬음"
              >
                ✏️ 본문 윤색/다듬기
              </button>
              <button
                id="ai-excerpt-btn"
                onClick={() => triggerSearchGroundingAndPostGeneration('excerpt')}
                disabled={aiLoading}
                className="py-2.5 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg disabled:opacity-50 transition"
                title="본문을 기조로 요약문 자동 생성"
              >
                📝 한글 요약 생성
              </button>
              <button
                id="ai-tags-btn"
                onClick={() => triggerSearchGroundingAndPostGeneration('tags')}
                disabled={aiLoading}
                className="py-2.5 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg disabled:opacity-50 transition"
                title="본문 내용에 적확한 해시태그 추출"
              >
                🏷️ 스마트 태깅추출
              </button>
            </div>
          </div>

          {/* AI Response Output Block */}
          {(aiLoading || aiResult || aiError) && (
            <div className="mt-4 p-4 bg-white border border-indigo-100 rounded-xl space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-indigo-50/60 pb-1.5">
                <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 animate-pulse" />
                  Gemini 처리 상태 결과
                </span>
                {aiResult && (
                  <button
                    id="ai-apply-btn"
                    onClick={() => handleApplyAiResult(aiPrompt ? (aiPrompt.includes('제목') ? 'titles' : 'draft') : 'draft')}
                    className="p-1 px-2.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md hover:bg-emerald-700 cursor-pointer"
                  >
                    에디터에 즉각 적용
                  </button>
                )}
              </div>

              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500 space-y-2">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[11px] font-semibold text-slate-500 animate-pulse">
                    Gemini AI 어시스턴트가 텍스트 가공을 진행하고 있습니다...
                  </p>
                </div>
              )}

              {aiError && (
                <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 text-[11px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{aiError}</p>
                </div>
              )}

              {aiResult && (
                <div className="text-xs text-slate-700 leading-relaxed max-h-[220px] overflow-y-auto bg-slate-50 p-2.5 rounded border border-slate-100 font-mono select-text">
                  <pre className="whitespace-pre-wrap">{aiResult}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
