import { BlogPost } from './types';

export const STARTER_POSTS: BlogPost[] = [
  {
    id: "vess2-post-1",
    title: "심플함의 미학: 복잡한 세상에서 직관적인 웹사이트 설계하기",
    slug: "aesthetics-of-simplicity",
    excerpt: "복잡도가 늘어나는 현대 웹 디자인 시장에서 미니멀리즘과 간결하고 직관적인 레이아웃이 왜 여전히 가장 강력한 사용자 경험(UX)을 제공하는지 알아봅니다.",
    status: "published",
    tags: ["디자인", "미니멀리즘", "UIUX", "인사이트"],
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    cover_image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    read_time: 5,
    content: `# 심플함의 미학: 직관적인 웹사이트 설계하기

현대 웹 트렌드는 수많은 모션 그래픽, 화려한 스크롤 인터랙션, 그리고 화려한 색감으로 전개되곤 합니다. 하지만 정보의 양이 폭발적으로 늘어나는 오늘날, 사용자가 진정으로 머무르고 싶어 하는 곳은 **시각적인 정돈과 온전한 몰입**을 선사하는 단순한 평면의 레이아웃인 경우가 많습니다.

오늘날의 미니멀리즘은 단순히 "요소를 줄이는 것"을 넘어, **사용자가 가장 중요한 메시지에 집중할 수 있도록 장애물을 치워주는 설계 공학**입니다.

## 1. 타이포그래피의 밀도와 여백의 균형
타이포그래피는 웹사이트의 얼굴이자 음성입니다. 어떠한 서체를 선택하느냐에 따라 블로그가 전하는 호흡과 품격이 달라집니다.
*   **충분한 여백(Negative Space):** 화면을 글꼴과 장식으로 꽉 채울 필요는 없습니다. 텍스트 주위의 넉넉한 공백은 눈의 피로를 덜어주고 콘텐츠에 대한 집중도를 극대화합니다.
*   **고대비 그리드:** 깔끔한 오프화이트 배경에 딥차콜 그레이 텍스트 조합은 편안한 가독성을 제공하며, 스크롤을 내릴 때 기사의 구조를 시각적으로 빠르게 인지하도록 돕습니다.

> "완벽함이란 더 이상 추가할 것이 없을 때가 아니라, 더 이상 뺄 것이 없을 때 완성된다." — 앙투안 드 생텍쥐페리

## 2. 편집하기 쉬운 구조의 설계
웹사이트가 본연의 힘을 가지려면, 글을 쓰는 발행자 역시 구조에 신경을 덜 써야 합니다. 마크다운(Markdown)과 같은 자연스러운 문법은 작성자가 레이아웃 마우스 드래그질에 에너지를 낭비하는 대신, 타이핑 그 자체에 몰입할 수 있도록 돕습니다.

vess2 블로그는 마크다운 렌더링 환경을 제공하여 언제 어디서나 미드센추리 모던 풍의 글을 빠르게 발행할 수 있도록 최적화되었습니다.

## 3. 백엔드와 유연한 결합 (Supabase)
이 블로그는 완벽한 분산형 데이터 아키텍처를 지지합니다.
*   로컬 스토리지를 이용한 **비로그인 편집 및 임시 저장**
*   **Supabase PostgreSQL 연동**을 통한 실시간 영구 데이터베이스 시너지

당신의 생각을 빠르고 간결하게 인터넷 세상에 공유해 보세요.`
  },
  {
    id: "vess2-post-2",
    title: "Supabase와 React를 활용한 무중단 가벼운 백엔드 연동 가이드",
    slug: "supabase-react-lightweight-backend",
    excerpt: "무겁고 복잡한 서버 가상화 플랫폼 없이도 초고속 DB와 실시간 반응 시스템을 완성하는 초간단 Supabase 데이터 연동 방식을 살펴봅니다.",
    status: "published",
    tags: ["Supabase", "개발", "React", "백엔드"],
    created_at: "2026-05-22T04:15:00Z",
    updated_at: "2026-05-22T04:15:00Z",
    cover_image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    read_time: 4,
    content: `# Supabase와 React를 활용한 초고속 백엔드 연동

블로그를 호스팅할 때 가장 부담스러운 일 중 하나는 데이터베이스서버를 구축하고 관리하는 일입니다. 복잡한 API 서버를 만들고, 데이터 유효성을 검사하며, CORS 설정을 씨름하는 사이 글을 쓰겠다는 초심은 희미해지죠.

**Supabase**는 PostgreSQL에 세련된 API 래퍼를 씌운 오픈소스 백앤드 서비스(BaaS)로, 프론트엔드 코드 몇 줄만으로도 뛰어난 속도의 CRUD(생성, 읽기, 수정, 삭제)를 가능케 합니다.

## Supabase는 왜 블로그에 이상적인가요?

1.  **서버리스 아키텍처:** 직접 관리할 서버가 없으므로 무중단 구동이 보장됩니다.
2.  **보안 규칙(RLS) 지원:** 데이터베이스 행 단위 보안(Row Level Security)으로 무단 조작을 강력히 차단합니다.
3.  **PostgreSQL의 신뢰성:** NoSQL 계열과 비교할 수 없을 정도로 데이터의 일관성과 쿼리 확장성이 뛰어납니다.

---

## 1단계: Supabase 테이블 생성하기
Supabase 대시보드의 **SQL Editor**에 들어가 아래 SQL을 붙여넣으면 몇 초 만에 블로그 구동에 필요한 고성능 테이블이 완성됩니다.

\`\`\`sql
-- vess2 블로그 전용 posts 테이블 생성
create table posts (
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

-- 인덱스 추가로 검색 성능 향상
create index posts_slug_idx on posts (slug);
create index posts_status_idx on posts (status);
\`\`\`

---

## 2단계: React 앱에서 실시간 연동하기
Vite 환경변수에 Supabase 자격증명을 입력해 주기만 하면, 아래와 같이 로컬 스토리지 데이터가 즉각 클라우드 데이터베이스와 양방향 동기화(Sync)됩니다.

\`\`\`typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
\`\`\`

이제 완벽하게 구축된 Supabase 연동 패널을 통해 클릭 한 번으로 모든 로컬 포스트를 클라우드로 정적 마이그레이션해 보세요.`
  },
  {
    id: "vess2-post-3",
    title: "글쓰기는 생각의 정원 가꾸기와 같다",
    slug: "writing-is-gardening-thoughts",
    excerpt: "많은 글들이 파편화되어 사라지는 SNS의 시대 속에서, 나만의 독립된 도메인인 블로그를 가지고 진지하게 생각을 가공해나가는 것의 일상적 의미.",
    status: "published",
    tags: ["글쓰기", "미니멀리즘", "인플루언스"],
    created_at: "2026-05-23T08:30:00Z",
    updated_at: "2026-05-23T08:30:00Z",
    cover_image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    read_time: 3,
    content: `# 글쓰기는 생각의 정원 가꾸기와 같다

우리는 매일 트위터, 인스타그램, 슬랙 같은 플랫폼에 수천 자의 텍스트를 기화시키듯 날려 보냅니다. 피드형 플랫폼의 글쓰기는 마치 잡초처럼 빠르게 돋았다가, 채 몇 시간이 지나기 전에 타임라인 아래로 영영 묻혀 버립니다.

이에 반해 **나만의 독자적인 도메인과 블로그**를 소유하고 글을 채우는 행위는 타임라인을 채우는 것과는 근본적으로 다릅니다. 이는 마치 일년 내내 자라나는 여러해살이 정원수를 키우는 것과 같습니다.

## 정원사로서의 블로거

정원에 서 있는 나무들은 계절에 따라 자리를 지키며, 다듬어질수록 더 곧고 아름다운 윤택을 냅니다. 마찬가지로 독립 블로그에 올린 글은 일주일 뒤에도, 반년 뒤에도 그 자리에 독립적인 주소(slug)를 가진 채 존재합니다.

*   **생각의 숙성:** 처음에는 투박한 드래프트(Draft)였던 글이, 퇴고(Edit)를 거치며 날카로운 통찰을 담은 완성된 포스트(Published)로 거듭납니다.
*   **지식의 구조화:** 관련된 글들에 고유한 태그(Tags)를 달아 연결고리를 엮는 과정은, 파편화된 내 머릿속 뉴런을 질서정연한 라이브러리로 승화시킵니다.

## 간편한 도구의 조력
정원사에게 잘 연마된 양손 가위가 필요하듯, 블로거에겐 생각의 몰입을 깨지 않는 극독의 단순한 에디터 인터페이스가 최고의 무기입니다.

**blog.vess2.com** 프로젝트는 가볍게 입력하고, 필요할 땐 AI 어시스턴트의 조력을 받아 고밀도의 타이포그래피 정원을 손쉽게 가꾸도록 만들어진 전용 도구입니다.

오늘 당신의 생각 하나를 정원에 심어보는 건 어떨까요?`
  }
];
