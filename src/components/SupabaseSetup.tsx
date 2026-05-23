import React, { useState } from 'react';
import { Database, ShieldCheck, Check, AlertCircle, Copy, ArrowUpRight, CloudLightning, Info } from 'lucide-react';
import { SupabaseConfigProps, BlogPost } from '../types';
import { testSupabaseConnection } from '../lib/supabaseClient';

interface SupabaseSetupProps {
  config: SupabaseConfigProps;
  onChange: (newConfig: SupabaseConfigProps) => void;
  localPostsCount: number;
  onMigratePosts: () => Promise<{ success: boolean; count: number; error?: string }>;
}

export default function SupabaseSetup({ config, onChange, localPostsCount, onMigratePosts }: SupabaseSetupProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; count: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlSetupCode = `-- 1. vess2 블로그용 posts 테이블 및 인덱스 생성
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  status text default 'draft' check (status in ('draft', 'published')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  tags text[] default '{}'::text[],
  cover_image text,
  read_time integer default 5
);

-- 2. 검색 및 슬러그 정렬 인덱스 구축
create index if not exists posts_slug_idx on posts (slug);
create index if not exists posts_status_idx on posts (status);

-- 3. 익명 사용자(Anon Key) CRUD 허용을 위한 RLS 임시 비활성화 또는 허용 정책 수립
alter table posts disable row level security;`;

  const handleTest = async () => {
    if (!config.url || !config.anonKey) {
      alert("URL과 Anon Key를 모두 입력해야 합니다.");
      return;
    }
    setTesting(true);
    setTestResult(null);
    const ok = await testSupabaseConnection(config.url, config.anonKey);
    setTesting(false);
    setTestResult(ok ? 'success' : 'failed');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetupCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const startMigration = async () => {
    if (!config.url || !config.anonKey) {
      alert("Supabase 연결 설정을 먼저 완료해 주세요!");
      return;
    }
    setMigrating(true);
    setMigrationResult(null);
    const res = await onMigratePosts();
    setMigrating(false);
    if (res.success) {
      setMigrationResult({ success: true, count: res.count });
    } else {
      setMigrationResult({ success: false, count: 0 });
      alert(`마이그레이션 실패: ${res.error}`);
    }
  };

  return (
    <div id="supabase-setup-container" className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Dynamic Status Dashboard */}
      <div className={`p-6 rounded-2xl border ${config.useSupabase ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900' : 'bg-slate-50/80 border-slate-200 text-slate-800'} transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${config.useSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <h3 className="font-serif text-lg font-semibold">
                {config.useSupabase ? 'Supabase 클라우드 데이터베이스 모드 활성화됨' : 'IDLE: 로컬 브라우저 디바이스 모드'}
              </h3>
            </div>
            <p className="text-sm mt-1 text-slate-600">
              {config.useSupabase 
                ? '원격 고성능 PostgreSQL 서버와 양방향 동기화 및 글 배포 상태입니다.' 
                : '로컬 스토리지 데이터베이스 상태입니다. 자격증명을 연동하면 클라우드 백엔드로 전환됩니다.'}
            </p>
          </div>
          <button
            id="toggle-supabase-mode-btn"
            onClick={() => onChange({ ...config, useSupabase: !config.useSupabase })}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
              config.useSupabase 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
          >
            {config.useSupabase ? '로컬 저장소 모드로 전환' : 'Supabase 클라우드 연동 켜기'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h4 className="font-serif text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Supabase 클라우드 자격증명 설정
            </h4>
            <p className="text-sm text-slate-500 mt-1">블로그 글을 영구 저장하고 배포하기 위해 Supabase 정보를 입력하세요.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase">Supabase Project URL</label>
              <input
                id="supabase-url-input"
                type="text"
                placeholder="https://your-project.supabase.co"
                value={config.url}
                onChange={(e) => onChange({ ...config, url: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-600 mb-1.5 uppercase">API Anon Public KEY</label>
              <input
                id="supabase-key-input"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.anonKey}
                onChange={(e) => onChange({ ...config, anonKey: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              id="test-supabase-conn-btn"
              onClick={handleTest}
              disabled={testing || !config.url || !config.anonKey}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-sm font-medium rounded-lg flex items-center gap-2"
            >
              {testing ? '연동 테스트 중...' : '연동 상태 진단 테스트'}
            </button>

            {testResult === 'success' && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 animate-fade-in">
                <ShieldCheck className="w-4 h-4" /> 연결 성공! Supabase 연결 가능합니다.
              </span>
            )}
            {testResult === 'failed' && (
              <span className="text-sm text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                <AlertCircle className="w-4 h-4" /> 자격증명이 올바르지 않거나 테이블이 로드되지 않았습니다.
              </span>
            )}
          </div>

          {/* Quick Database Sync/Migration tool */}
          <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-xl">
            <h5 className="font-medium text-sm text-slate-900 flex items-center gap-1.5">
              <CloudLightning className="w-4 h-4 text-amber-500" />
              로컬 포스트 원클릭 마이그레이션 ({localPostsCount}개 포스트)
            </h5>
            <p className="text-xs text-slate-500 mt-1">
              현재 브라우저 캐시에 보유 중인 포스트들을 Supabase 원격 DB의 <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-amber-800">posts</code> 테이블로 한꺼번에 저장 및 동기화합니다.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                id="migrate-posts-btn"
                onClick={startMigration}
                disabled={migrating || !config.url || !config.anonKey}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold disabled:opacity-50"
              >
                {migrating ? '마이그레이션 업로드 진행중...' : 'Supabase 클라우드로 모두 업로드'}
              </button>
              {migrationResult?.success && (
                <span className="text-xs font-medium text-emerald-600">
                  ✓ {migrationResult.count}개의 포스트가 안정적으로 원격 DB로 복제되었습니다!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: DB SQL Schema Helper instruction */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-serif text-base font-semibold text-white flex items-center gap-2">
                자동 생성용 SQL 쿼리 스트림
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Supabase에 처음 접속했다면 아래 SQL 스크립트를 복사하여 대시보드 <strong>SQL Editor</strong>에서 실행해 주세요.
              </p>
            </div>
            <button
              id="copy-sql-btn"
              onClick={handleCopySql}
              className="p-1 px-2.5 rounded-md hover:bg-slate-700 bg-slate-800 text-xs text-slate-300 flex items-center gap-1 border border-slate-700 transition"
              title="코드 복사"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? '복사 완료' : '복사'}
            </button>
          </div>

          <div className="relative font-mono text-[11px] leading-relaxed bg-black/50 p-4 rounded-xl border border-slate-800 overflow-y-auto max-h-[320px]">
            <pre className="text-slate-300 whitespace-pre-wrap">{sqlSetupCode}</pre>
          </div>

          <div className="p-3.5 bg-slate-800/50 rounded-xl flex items-start gap-2.5 border border-slate-800">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-normal">
              <strong>테이블 생성 팁:</strong> Supabase 프로젝트 생성 후 왼쪽 사이드바의 **SQL Editor** → **New query**를 만들고 복사한 코드를 기입한 후 <strong>Run</strong> 버튼을 클릭하십시오.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
