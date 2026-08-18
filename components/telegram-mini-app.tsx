'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  Home,
  ListChecks,
  Menu,
  Plus,
  Send,
  Settings2,
  Users,
  X,
  Copy,
  CheckCheck,
  Trash2,
  AlertCircle,
  FolderSync
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// 1. 타입 정의
type Role = 'admin' | 'user'
type Screen = 'home' | 'tasks' | 'attendance' | 'settings'
type FieldType = 'select' | 'chips' | 'text'

export interface CustomField {
  id: string
  label: string
  type: FieldType
  options?: string[]
  showIfFieldId?: string
  showIfValue?: string
}

type ZoneResponses = Record<string, Record<string, Record<string, string>>>
type SubmissionStatus = 'not_started' | 'draft' | 'submitted'

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const formatDeadline = (deadlineStr: string) => {
  try {
    const parts = deadlineStr.split(' ')
    if (parts.length === 2 && parts[0].includes('-')) {
      const [datePart, timePart] = parts
      const todayStr = getTodayString()
      if (datePart === todayStr) {
        return `오늘 ${timePart}`
      }
      return `${datePart} ${timePart}`
    }
  } catch (e) {}
  return deadlineStr
}

// 2. 초기 데이터 정의
const zones = ['가나안', '갈릴리', '베레아', '사마리아']

const membersPerZone: Record<string, string[]> = {
  '가나안': ['김민준', '박서연', '이도윤', '최하은', '정예은', '한지우'],
  '갈릴리': ['강지훈', '서현우', '윤소희', '임민지'],
  '베레아': ['김도현', '박준서', '최지아', '황민우'],
  '사마리아': ['이지원', '조민수', '백지현', '송태양']
}

const presets = [
  {
    id: 'regular',
    title: '정기 모임 출석',
    notice: '오늘 모임 참석 가능 여부와 도착 시각을 남겨주세요.',
    fields: [
      { id: 'status', label: '참석 여부', type: 'select', options: ['참여', '불참', '미정'] },
      { id: 'time', label: '도착 시각', type: 'chips', options: ['18:00', '18:30', '19:00'], showIfFieldId: 'status', showIfValue: '참여' },
      { id: 'reason', label: '불참 사유', type: 'text', showIfFieldId: 'status', showIfValue: '불참' },
      { id: 'note', label: '짧은 메모', type: 'text' }
    ] as CustomField[]
  },
  {
    id: 'visit',
    title: '방문 일정 확인',
    notice: '방문 심방 일정 참석 여부를 기재해 주세요.',
    fields: [
      { id: 'status', label: '참석 여부', type: 'select', options: ['참여', '불참', '미정'] },
      { id: 'reason', label: '불참 사유', type: 'text', showIfFieldId: 'status', showIfValue: '불참' },
      { id: 'note', label: '짧은 메모', type: 'text' }
    ] as CustomField[]
  },
  {
    id: 'simple',
    title: '간단 응답',
    notice: '참석 상태만 빠르게 취합합니다.',
    fields: [
      { id: 'status', label: '참석 여부', type: 'select', options: ['참여', '불참', '미정'] }
    ] as CustomField[]
  }
]

const initialResponses: ZoneResponses = {
  '가나안': {
    '김민준': { 'status': '참여', 'time': '18:00', 'note': '약간 늦을 수도 있습니다' },
    '박서연': { 'status': '참여', 'time': '18:30', 'note': '' },
    '이도윤': { 'status': '불참', 'reason': '회사 야근', 'note': '' },
    '최하은': { 'status': '참여', 'time': '18:00', 'note': '' },
    '정예은': { 'status': '참여', 'time': '19:00', 'note': '' },
    '한지우': { 'status': '참여', 'time': '18:00', 'note': '' }
  },
  '갈릴리': {
    '강지훈': { 'status': '참여', 'time': '18:00', 'note': '' },
    '서현우': { 'status': '미정', 'time': '', 'note': '' },
    '윤소희': { 'status': '불참', 'reason': '가족 모임', 'note': '' },
    '임민지': { 'status': '미정', 'time': '', 'note': '' }
  },
  '베레아': {
    '김도현': { 'status': '미정', 'time': '', 'note': '' },
    '박준서': { 'status': '미정', 'time': '', 'note': '' },
    '최지아': { 'status': '미정', 'time': '', 'note': '' },
    '황민우': { 'status': '미정', 'time': '', 'note': '' }
  },
  '사마리아': {
    '이지원': { 'status': '미정', 'time': '', 'note': '' },
    '조민수': { 'status': '미정', 'time': '', 'note': '' },
    '백지현': { 'status': '미정', 'time': '', 'note': '' },
    '송태양': { 'status': '미정', 'time': '', 'note': '' }
  }
}

const initialStatus: Record<string, SubmissionStatus> = {
  '가나안': 'submitted',
  '갈릴리': 'draft',
  '베레아': 'not_started',
  '사마리아': 'not_started'
}

export function TelegramMiniApp() {
  const [role, setRole] = useState<Role>('admin')
  const [screen, setScreen] = useState<Screen>('home')
  const [detail, setDetail] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<string>('베레아')
  const [published, setPublished] = useState(false)

  // 취합 환경설정 상태 (관리자가 생성하는 템플릿)
  const [config, setConfig] = useState({
    title: '정기 모임 출석',
    notice: '오늘 모임 참석 가능 여부와 도착 시각을 남겨주세요.',
    targets: ['가나안', '갈릴리', '베레아', '사마리아'],
    deadline: `${getTodayString()} 18:00`,
    fields: [
      { id: 'status', label: '참석 여부', type: 'select', options: ['참여', '불참', '미정'] },
      { id: 'time', label: '도착 시각', type: 'chips', options: ['18:00', '18:30', '19:00'], showIfFieldId: 'status', showIfValue: '참여' },
      { id: 'reason', label: '불참 사유', type: 'text', showIfFieldId: 'status', showIfValue: '불참' },
      { id: 'note', label: '짧은 메모', type: 'text' }
    ] as CustomField[]
  })

  // 각 구역별 구역원들의 입력 데이터
  const [responses, setResponses] = useState<ZoneResponses>(initialResponses)
  // 각 구역별 제출/작성 상태
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, SubmissionStatus>>(initialStatus)

  // 출석 탭용 단순 터치 상태 기록
  const [attendance, setAttendance] = useState<Record<string, number>>({})
  const toggleAttendance = (member: string) => {
    setAttendance((current) => ({ ...current, [member]: (current[member] ?? 0) + 1 }))
  }

  // 상단 헤더 타이틀 결정
  const screenTitle = useMemo(() => {
    if (detail === 'new') return '새 취합 만들기'
    if (detail === 'active') return '진행 중인 취합'
    if (detail === 'closed') return '마감된 취합'
    if (detail === 'answers') return `${selectedZone} 구역 응답`
    if (detail === 'submit') return '출석 및 답변 제출'
    
    if (screen === 'home') return '대시보드'
    if (screen === 'tasks') return role === 'admin' ? '취합 관리' : '내 응답함'
    if (screen === 'attendance') return '출석 관리'
    return '설정'
  }, [detail, screen, role, selectedZone])

  const roleLabel = role === 'admin' ? '총괄 관리자 · 서기' : '구역장 · 베레아'

  // 취합 게시(생성) 처리 함수
  const handlePublish = (newConfig: typeof config) => {
    setConfig(newConfig)
    setPublished(true)

    // 새로운 취합이 생성되면 대상 구역의 응답 데이터를 초기화합니다.
    const updatedResponses = { ...responses }
    const updatedStatus = { ...submissionStatus }

    newConfig.targets.forEach((zone) => {
      const zoneMembers = membersPerZone[zone] || []
      updatedResponses[zone] = Object.fromEntries(
        zoneMembers.map((member) => [
          member,
          Object.fromEntries(newConfig.fields.map((f) => [f.id, f.id === 'status' ? '미정' : '']))
        ])
      )
      updatedStatus[zone] = 'not_started'
    })

    setResponses(updatedResponses)
    setSubmissionStatus(updatedStatus)
    setDetail(null)
    setScreen('tasks')
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col overflow-hidden bg-muted/35 shadow-[0_0_60px_rgba(15,23,42,0.08)]">
        
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background/95 px-5 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur">
          <div className="flex items-center gap-3">
            {detail && (
              <Button
                aria-label="뒤로가기"
                size="icon"
                variant="ghost"
                onClick={() => setDetail(null)}
                className="rounded-full"
              >
                <ArrowLeft />
              </Button>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">ORG HUB</p>
              <h1 className="text-lg font-bold tracking-tight">{screenTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
              {roleLabel}
            </Badge>
            <Button aria-label="알림" size="icon" variant="ghost" className="rounded-full">
              <Bell className="size-5" />
            </Button>
          </div>
        </header>

        {/* 바디 섹션 */}
        <section className="flex-1 px-4 pb-28 pt-5 overflow-y-auto">
          {!detail && screen === 'home' && (
            <HomeView
              role={role}
              setDetail={setDetail}
              setScreen={setScreen}
              published={published}
              config={config}
              responses={responses}
              submissionStatus={submissionStatus}
            />
          )}
          {!detail && screen === 'tasks' && (
            <TasksView
              role={role}
              setDetail={setDetail}
              published={published}
              config={config}
              submissionStatus={submissionStatus}
              setSelectedZone={setSelectedZone}
            />
          )}
          {!detail && screen === 'attendance' && (
            <AttendanceView
              role={role}
              attendance={attendance}
              toggleAttendance={toggleAttendance}
              completed={Object.keys(attendance).length}
              setDetail={setDetail}
            />
          )}
          {!detail && screen === 'settings' && (
            <SettingsView role={role} setRole={setRole} />
          )}

          {/* 서브 뷰들 */}
          {detail === 'new' && (
            <NewAggregation
              config={config}
              onPublish={handlePublish}
            />
          )}
          {detail === 'active' && (
            <ActiveAggregation
              setDetail={setDetail}
              config={config}
              submissionStatus={submissionStatus}
              setSelectedZone={setSelectedZone}
              responses={responses}
            />
          )}
          {detail === 'closed' && <ClosedAggregation />}
          {detail === 'answers' && (
            <AnswersDetail
              selectedZone={selectedZone}
              config={config}
              responses={responses}
            />
          )}
          {detail === 'submit' && (
            <SubmissionDetail
              config={config}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              responses={responses}
              setResponses={setResponses}
              submissionStatus={submissionStatus}
              setSubmissionStatus={setSubmissionStatus}
              onBack={() => setDetail(null)}
            />
          )}
        </section>

        {/* 하단 탭 네비게이션 */}
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-lg -translate-x-1/2 justify-around border-t border-border/70 bg-background/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          {([
            ['home', Home, '홈'],
            ['tasks', ListChecks, '취합'],
            ['attendance', ClipboardCheck, '출석'],
            ['settings', Settings2, '설정']
          ] as const).map(([value, Icon, label]) => (
            <button
              key={value}
              className={`flex min-w-16 flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                screen === value && !detail ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setScreen(value)
                setDetail(null)
              }}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  )
}

// ==========================================
// 3. 서브 뷰 컴포넌트 구현
// ==========================================

// --- 홈 대시보드 뷰 ---
interface HomeViewProps {
  role: Role
  setDetail: (v: string) => void
  setScreen: (v: Screen) => void
  published: boolean
  config: any
  responses: ZoneResponses
  submissionStatus: Record<string, SubmissionStatus>
}

function HomeView({
  role,
  setDetail,
  setScreen,
  published,
  config,
  responses,
  submissionStatus
}: HomeViewProps) {
  // 응답 현황 계산
  const targetZones = config.targets
  const submittedCount = targetZones.filter((z: string) => submissionStatus[z] === 'submitted').length
  const totalZones = targetZones.length
  
  // 전체 구역원 수 대비 응답 완료 비율 계산
  let totalMembers = 0
  let answeredMembers = 0
  targetZones.forEach((zone: string) => {
    const members = membersPerZone[zone] || []
    totalMembers += members.length
    members.forEach((m) => {
      const status = responses[zone]?.[m]?.['status']
      if (status && status !== '미정') {
        answeredMembers++
      }
    })
  })
  
  const completionRate = totalMembers > 0 ? Math.round((answeredMembers / totalMembers) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      {/* 상태 보드 카드 */}
      <div className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/15">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-primary-foreground/75 font-medium">좋은 하루예요</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">운영 현황을 한눈에</h2>
          </div>
          <div className="rounded-2xl bg-primary-foreground/15 p-3 text-primary-foreground">
            <Menu className="size-5" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <Stat label="진행 중인 취합" value="1건" />
          <Stat label="구역 완료율" value={`${submittedCount}/${totalZones}구역`} />
          <Stat label="구역원 응답률" value={`${completionRate}%`} />
        </div>
      </div>

      {/* 빠른 작업 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">빠른 작업</p>
          <h2 className="mt-1 text-xl font-bold">오늘 할 일</h2>
        </div>
        <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px]">
          {role === 'admin' ? '관리자 모드' : '내 구역'}
        </Badge>
      </div>

      {/* 빠른 작업 버튼 카드 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {role === 'admin' ? (
          <>
            <QuickCard
              icon={FilePlus2}
              title="새 취합 만들기"
              text="구글 폼처럼 자유롭게 양식을 만듭니다"
              onClick={() => setDetail('new')}
            />
            <QuickCard
              icon={Users}
              title="응답 현황 확인"
              text="구역장들의 실시간 임시저장 내역 조회"
              onClick={() => setDetail('active')}
            />
          </>
        ) : (
          <>
            <QuickCard
              icon={Send}
              title="취합 응답하기"
              text="구역별 인원 참석 현황 제출 및 저장"
              onClick={() => {
                setScreen('tasks')
                setDetail('submit')
              }}
            />
            <QuickCard
              icon={ClipboardCheck}
              title="오늘 출석 기록"
              text="베레아 구역 4명 개별 터치 기록"
              onClick={() => setScreen('attendance')}
            />
          </>
        )}
      </div>

      {/* 최근 활동 카드 */}
      <Card className="rounded-2xl border-0 shadow-sm bg-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs">가장 최근 등록된 요청</CardDescription>
              <CardTitle className="mt-1 text-base font-bold">{config.title}</CardTitle>
            </div>
            <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-medium">
              진행 중
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>구역원 응답률 ({answeredMembers} / {totalMembers}명)</span>
            <span className="font-semibold text-foreground">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="mt-3.5 h-2" />
          <button
            className="mt-4 flex w-full items-center justify-between text-xs font-semibold text-primary group"
            onClick={() => setDetail(role === 'admin' ? 'active' : 'submit')}
          >
            상세 현황 보고 수정하기
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-3">
      <p className="text-lg font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] text-primary-foreground/70 font-medium">{label}</p>
    </div>
  )
}

function QuickCard({
  icon: Icon,
  title,
  text,
  onClick
}: {
  icon: any
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3.5 rounded-2xl border border-border/50 bg-background p-4 text-left shadow-sm hover:border-primary/20 active:scale-[0.98] transition-all"
    >
      <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-sm tracking-tight">{title}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{text}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

// --- 취합 관리 및 목록 뷰 ---
interface TasksViewProps {
  role: Role
  setDetail: (v: string) => void
  published: boolean
  config: any
  submissionStatus: Record<string, SubmissionStatus>
  setSelectedZone: (zone: string) => void
}

function TasksView({
  role,
  setDetail,
  published,
  config,
  submissionStatus,
  setSelectedZone
}: TasksViewProps) {
  // 응답율 계산
  const targetZones = config.targets
  const submittedCount = targetZones.filter((z: string) => submissionStatus[z] === 'submitted').length
  const overallProgress = targetZones.length > 0 ? Math.round((submittedCount / targetZones.length) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-muted-foreground">조직의 모든 요청을 관리하고 응답합니다.</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {role === 'admin' ? '취합 관리' : '내 응답함'}
          </h2>
        </div>
      </div>

      {role === 'admin' && (
        <Button className="h-12 rounded-xl text-sm font-semibold" onClick={() => setDetail('new')}>
          <Plus className="mr-2 size-4" /> 새 취합 양식 만들기
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {/* 메인 취합 카드 */}
        <button
          onClick={() => {
            if (role === 'admin') {
              setDetail('active')
            } else {
              setSelectedZone('베레아') // 구역장 데모 구역
              setDetail('submit')
            }
          }}
          className="rounded-2xl border border-border/50 bg-background p-4 text-left shadow-sm hover:border-primary/20 transition-all flex flex-col"
        >
          <div className="flex items-start justify-between gap-3 w-full">
            <div>
              <p className="font-bold text-base tracking-tight">{config.title}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" /> 마감: {formatDeadline(config.deadline)}
              </p>
            </div>
            <Badge variant="default" className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
              진행 중
            </Badge>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground w-full">
            <span>구역 제출 진척도 ({submittedCount} / {targetZones.length} 구역)</span>
            <span className="font-semibold text-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="mt-2 h-2 w-full" />
        </button>

        {/* 마감된 모의 취합 카드 */}
        <button
          onClick={() => setDetail('closed')}
          className="rounded-2xl border border-border/50 bg-background p-4 text-left shadow-sm hover:border-primary/20 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-base tracking-tight text-muted-foreground">다음 달 운영 아이디어</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" /> 마감됨 · 8월 12일
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
              마감됨
            </Badge>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>전체 구역 완료</span>
            <span className="font-semibold text-foreground">100%</span>
          </div>
          <Progress value={100} className="mt-2 h-2" />
        </button>
      </div>
    </div>
  )
}

// --- [신규 기능] 구글 폼 스타일의 "새 취합 만들기" 뷰 ---
interface NewAggregationProps {
  config: any
  onPublish: (newConfig: any) => void
}

function NewAggregation({ config, onPublish }: NewAggregationProps) {
  const [title, setTitle] = useState(config.title)
  const [notice, setNotice] = useState(config.notice)
  const [targets, setTargets] = useState<string[]>(config.targets)
  const [fields, setFields] = useState<CustomField[]>(config.fields)

  const initialParts = useMemo(() => {
    try {
      const parts = config.deadline.split(' ')
      if (parts.length === 2 && parts[0].includes('-')) {
        return { date: parts[0], time: parts[1] }
      }
    } catch (e) {}
    return { date: getTodayString(), time: '18:00' }
  }, [config.deadline])

  const [deadlineDate, setDeadlineDate] = useState(initialParts.date)
  const [deadlineTime, setDeadlineTime] = useState(initialParts.time)

  const timeOptions = useMemo(() => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      const hh = String(hour).padStart(2, '0')
      options.push(`${hh}:00`)
      options.push(`${hh}:30`)
    }
    return options
  }, [])

  // 신규 필드 추가 임시 상태
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<FieldType>('chips')
  const [newOptionsText, setNewOptionsText] = useState('')
  const [useCondition, setUseCondition] = useState(false)
  const [condParentId, setCondParentId] = useState('status')
  const [condValue, setCondValue] = useState('참여')

  // 프리셋 적용
  const handleApplyPreset = (preset: typeof presets[number]) => {
    setTitle(preset.title)
    setNotice(preset.notice)
    setFields(preset.fields)
  }

  // 대상 구역 토글
  const toggleTarget = (zone: string) => {
    setTargets((current) =>
      current.includes(zone) ? current.filter((z) => z !== zone) : [...current, zone]
    )
  }

  // 필드 삭제
  const deleteField = (id: string) => {
    // 참석 여부(status)는 지울 수 없게 제한 (필수 핵심 필드)
    if (id === 'status') {
      alert('참석 여부 필드는 취합에 필수적이며 삭제할 수 없습니다.')
      return
    }
    setFields((current) => current.filter((f) => f.id !== id))
  }

  // 커스텀 필드 신규 등록
  const addCustomField = () => {
    if (!newLabel.trim()) {
      alert('질문 제목(라벨)을 입력해 주세요.')
      return
    }

    const newId = `custom_${Date.now()}`
    const options = (newType === 'chips' || newType === 'select')
      ? newOptionsText.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined

    if ((newType === 'chips' || newType === 'select') && (!options || options.length === 0)) {
      alert('옵션을 쉼표(,)로 구분해서 1개 이상 입력해 주세요.')
      return
    }

    const fieldToAdd: CustomField = {
      id: newId,
      label: newLabel,
      type: newType,
      options,
      ...(useCondition ? { showIfFieldId: condParentId, showIfValue: condValue } : {})
    }

    setFields((current) => [...current, fieldToAdd])

    // 입력 상태 리셋
    setNewLabel('')
    setNewOptionsText('')
    setUseCondition(false)
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <p className="text-xs text-muted-foreground">구글 폼을 채우듯 필요한 항목을 설정합니다.</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">새 취합 양식 만들기</h2>
      </div>

      {/* 1. 기본 설정 카드 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground uppercase">
            취합 제목
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 주말 모임 참석 조사"
              className="h-11 rounded-xl text-sm border-border/80 text-foreground font-semibold"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground uppercase">
            안내 공지 문구
            <Textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="구역장들에게 전달될 공지사항을 기재해 주세요."
              className="min-h-20 rounded-xl text-sm border-border/80 text-foreground"
            />
          </label>
          <div className="flex flex-col gap-2 text-xs font-bold text-muted-foreground uppercase">
            대상 구역
            <div className="flex flex-wrap gap-2 pt-1">
              {zones.map((zone) => {
                const isSelected = targets.includes(zone)
                return (
                  <button
                    type="button"
                    key={zone}
                    onClick={() => toggleTarget(zone)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {zone}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">응답 마감 시간</span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="h-11 rounded-xl text-sm border-border/80 text-foreground"
              />
              <select
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="h-11 rounded-xl text-sm border border-border/80 bg-background px-3 text-foreground"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 빠른 시작 프리셋 템플릿 */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">빠른 시작</p>
          <h3 className="mt-0.5 text-lg font-bold">기본 프리셋 템플릿</h3>
        </div>
        <div className="grid gap-2 grid-cols-3">
          {presets.map((preset) => {
            const isActive = preset.title === title
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`rounded-xl border p-3 text-left transition-all hover:bg-background/80 ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border/60 bg-background'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">{preset.title}</span>
                  {isActive && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                  {preset.fields.map((f) => f.label).join(' · ')}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. 구글 폼 스타일 설문 항목 편집 카드 */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">질문 및 입력 항목 구성</CardTitle>
          <CardDescription className="text-xs">
            구역원별로 응답을 받을 설문 질문 항목 리스트입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* 활성화된 설문 항목 리스트 */}
          <div className="flex flex-col gap-2">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">Q{idx + 1}</span>
                    <span className="text-sm font-semibold tracking-tight">{field.label}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md font-normal text-muted-foreground">
                      {field.type === 'select' ? '목록형' : field.type === 'chips' ? '선택형' : '텍스트'}
                    </Badge>
                  </div>
                  {field.options && (
                    <p className="mt-1 text-[10px] text-muted-foreground truncate">
                      선택지: {field.options.join(', ')}
                    </p>
                  )}
                  {field.showIfFieldId && (
                    <p className="mt-0.5 text-[9px] text-amber-600 font-medium">
                      조건부 노출: [{fields.find((f) => f.id === field.showIfFieldId)?.label}] 가 '{field.showIfValue}' 일 때만 노출
                    </p>
                  )}
                </div>
                {field.id !== 'status' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteField(field.id)}
                    className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="필드 삭제"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-2" />

          {/* 설문 질문 항목 추가 양식 */}
          <div className="rounded-xl border border-dashed border-border/90 bg-muted/10 p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="size-4 text-primary" /> 항목 추가하기
            </h4>
            
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted-foreground">
              질문 라벨 (이름)
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="예: 식사 참여 여부, 셔틀 탑승 장소"
                className="h-9 text-xs rounded-lg border-border/80"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 text-[11px] font-semibold text-muted-foreground">
                입력 방식
                <ToggleGroup
                  type="single"
                  value={newType}
                  onValueChange={(v) => v && setNewType(v as FieldType)}
                  className="grid grid-cols-3 border border-border rounded-lg overflow-hidden h-9 bg-background"
                >
                  <ToggleGroupItem value="chips" className="text-[10px] font-medium h-full border-0">선택형</ToggleGroupItem>
                  <ToggleGroupItem value="select" className="text-[10px] font-medium h-full border-0">목록형</ToggleGroupItem>
                  <ToggleGroupItem value="text" className="text-[10px] font-medium h-full border-0">텍스트</ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="flex flex-col gap-1 text-[11px] font-semibold text-muted-foreground">
                선택 옵션 목록 (쉼표구분)
                <Input
                  value={newOptionsText}
                  onChange={(e) => setNewOptionsText(e.target.value)}
                  disabled={newType === 'text'}
                  placeholder="예: 신청함, 신청안함"
                  className="h-9 text-xs rounded-lg border-border/80 bg-background"
                />
              </div>
            </div>

            {/* 조건부 질문 노출 토글 */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="condition-toggle"
                  checked={useCondition}
                  onChange={(e) => setUseCondition(e.target.checked)}
                  className="rounded border-border/80 size-3.5 accent-primary"
                />
                <label htmlFor="condition-toggle" className="text-[11px] font-semibold text-muted-foreground cursor-pointer">
                  특정 답변 시에만 이 질문 노출하기 (조건부 질문)
                </label>
              </div>

              {useCondition && (
                <div className="grid grid-cols-2 gap-2 bg-background p-2 rounded-lg border border-border/50">
                  <label className="flex flex-col gap-1 text-[10px] font-semibold text-muted-foreground">
                    대상 상위 질문
                    <select
                      value={condParentId}
                      onChange={(e) => setCondParentId(e.target.value)}
                      className="h-8 text-xs rounded border border-border bg-background px-1.5"
                    >
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[10px] font-semibold text-muted-foreground">
                    보여줄 조건 답변 값
                    <Input
                      value={condValue}
                      onChange={(e) => setCondValue(e.target.value)}
                      placeholder="예: 참여"
                      className="h-8 text-xs rounded border-border/80"
                    />
                  </label>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCustomField}
              className="mt-1 h-9 rounded-lg text-xs font-semibold"
            >
              목록에 질문 추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. 취합 생성 버튼 */}
      <Button
        className="h-12 rounded-xl text-sm font-semibold tracking-wide"
        onClick={() => {
          if (!title.trim()) {
            alert('취합 제목을 입력해 주세요.')
            return
          }
          if (fields.length === 0) {
            alert('최소 1개 이상의 설문 항목을 추가해 주세요.')
            return
          }
          onPublish({ title, notice, targets, deadline: `${deadlineDate} ${deadlineTime}`, fields })
        }}
      >
        <Send className="mr-2 size-4" /> 커스텀 취합 게시하기
      </Button>
    </div>
  )
}

// --- 진행 중인 취합 상세 (관리자 뷰) ---
interface ActiveAggregationProps {
  setDetail: (v: string) => void
  config: any
  submissionStatus: Record<string, SubmissionStatus>
  setSelectedZone: (zone: string) => void
  responses: ZoneResponses
}

function ActiveAggregation({
  setDetail,
  config,
  submissionStatus,
  setSelectedZone,
  responses
}: ActiveAggregationProps) {
  const targetZones = config.targets

  // 전체 대비 응답 완료 비율 계산
  let totalMembers = 0
  let answeredMembers = 0
  targetZones.forEach((zone: string) => {
    const members = membersPerZone[zone] || []
    totalMembers += members.length
    members.forEach((m) => {
      const status = responses[zone]?.[m]?.['status']
      if (status && status !== '미정') {
        answeredMembers++
      }
    })
  })
  
  const completionRate = totalMembers > 0 ? Math.round((answeredMembers / totalMembers) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-2xl border-0 shadow-sm bg-background">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardDescription>응답 마감 · {formatDeadline(config.deadline)}</CardDescription>
              <CardTitle className="mt-1 text-xl font-bold tracking-tight">{config.title}</CardTitle>
            </div>
            <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-medium">
              진행 중
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{config.notice}</p>
          <div className="mt-5 flex items-end justify-between">
            <span className="text-xs text-muted-foreground">구역원 응답 현황</span>
            <span className="text-2xl font-black tracking-tight">
              {answeredMembers}
              <span className="text-sm font-medium text-muted-foreground"> / {totalMembers}명</span>
            </span>
          </div>
          <Progress value={completionRate} className="mt-3 h-3" />
        </CardContent>
      </Card>

      {/* 구역별 진행도 리스트 */}
      <div className="flex flex-col gap-2.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">구역별 진행률</p>
        </div>
        {targetZones.map((zone: string, index: number) => {
          const zoneMembers = membersPerZone[zone] || []
          const totalCount = zoneMembers.length
          const completedCount = zoneMembers.filter(
            (m) => responses[zone]?.[m]?.['status'] && responses[zone]?.[m]?.['status'] !== '미정'
          ).length
          const status = submissionStatus[zone] || 'not_started'

          return (
            <button
              key={zone}
              onClick={() => {
                setSelectedZone(zone)
                setDetail('answers')
              }}
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-background p-4 text-left shadow-sm hover:border-primary/20 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <span className="block font-bold text-sm tracking-tight">{zone} 구역</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    응답 완료: {completedCount} / {totalCount}명
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status === 'submitted' ? (
                  <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] font-semibold border-0">
                    제출 완료
                  </Badge>
                ) : status === 'draft' ? (
                  <Badge variant="secondary" className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] font-semibold border-0">
                    임시 저장
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full text-[10px] font-semibold text-muted-foreground border-border/60">
                    작성 전
                  </Badge>
                )}
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- 마감된 취합 뷰 (대시보드 피드백) ---
function ClosedAggregation() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted-foreground">최종 결과 조회</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">다음 달 운영 아이디어</h2>
      </div>
      <Card className="rounded-2xl border-0 shadow-sm bg-background">
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground font-semibold">총 참여인원</p>
              <p className="mt-1 text-2xl font-black tracking-tight">32명</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground font-semibold">제출 구역율</p>
              <p className="mt-1 text-2xl font-black tracking-tight">100%</p>
            </div>
          </div>
          <Separator className="my-5" />
          <p className="text-xs font-bold text-muted-foreground uppercase">가장 많이 기록된 핵심 피드백</p>
          <p className="mt-2 text-sm leading-6 text-foreground font-medium">
            “구역 간 경험을 공유할 수 있는 친목 행사를 정기적으로 마련하면 좋겠습니다.”
          </p>
        </CardContent>
      </Card>
      <Button variant="outline" className="h-12 rounded-xl text-xs font-bold border-border/60">
        결과 CSV/엑셀 내보내기
      </Button>
    </div>
  )
}

// --- 특정 구역의 상세 응답 결과 조회 (관리자 뷰) ---
interface AnswersDetailProps {
  selectedZone: string
  config: any
  responses: ZoneResponses
}

function AnswersDetail({ selectedZone, config, responses }: AnswersDetailProps) {
  const zoneMembers = membersPerZone[selectedZone] || []
  const zoneResponses = responses[selectedZone] || {}

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted-foreground">{selectedZone} 구역 · {zoneMembers.length}명 구역원</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">구역 상세 응답 결과</h2>
      </div>

      <div className="flex flex-col gap-3">
        {zoneMembers.map((member) => {
          const memberResponse = zoneResponses[member] || {}
          const isRegistered = memberResponse['status'] && memberResponse['status'] !== '미정'

          return (
            <Card key={member} className="rounded-2xl border-0 shadow-sm bg-background">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${
                        memberResponse['status'] === '참여'
                          ? 'bg-emerald-100 text-emerald-700'
                          : memberResponse['status'] === '불참'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {member.slice(0, 1)}
                    </span>
                    <div>
                      <p className="font-bold text-sm tracking-tight">{member}</p>
                      <p className="text-[10px] text-muted-foreground">구역원</p>
                    </div>
                  </div>
                  {isRegistered ? (
                    <Badge
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 ${
                        memberResponse['status'] === '참여'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {memberResponse['status']}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full text-[10px] font-semibold text-muted-foreground border-0 bg-muted">
                      미확정
                    </Badge>
                  )}
                </div>

                {/* 입력된 커스텀 필드값 목록 동적 렌더링 */}
                {isRegistered && (
                  <div className="mt-2 pl-12 flex flex-col gap-1.5 border-l-2 border-primary/10">
                    {config.fields.map((field: CustomField) => {
                      // 1차 'status'는 위 배지에서 표기하므로 패스
                      if (field.id === 'status') return null

                      // 조건 체크
                      if (field.showIfFieldId) {
                        const depVal = memberResponse[field.showIfFieldId]
                        if (depVal !== field.showIfValue) return null
                      }

                      const value = memberResponse[field.id]
                      if (!value) return null

                      return (
                        <div key={field.id} className="text-xs flex items-baseline gap-2">
                          <span className="font-semibold text-muted-foreground min-w-16">
                            {field.label}:
                          </span>
                          <span className="text-foreground font-medium">{value}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// --- [신규 구현] 구역장/부구역장의 "취합 응답하기" 및 "임시 저장/최종 제출" 상세 뷰 ---
interface SubmissionDetailProps {
  config: any
  selectedZone: string
  setSelectedZone: (zone: string) => void
  responses: ZoneResponses
  setResponses: (r: ZoneResponses) => void
  submissionStatus: Record<string, SubmissionStatus>
  setSubmissionStatus: (s: Record<string, SubmissionStatus>) => void
  onBack: () => void
}

function SubmissionDetail({
  config,
  selectedZone,
  setSelectedZone,
  responses,
  setResponses,
  submissionStatus,
  setSubmissionStatus,
  onBack
}: SubmissionDetailProps) {
  const zoneMembers = membersPerZone[selectedZone] || []
  const [copied, setCopied] = useState(false)
  const [saveToast, setSaveToast] = useState<'idle' | 'draft' | 'final'>('idle')

  // 개별 멤버의 특정 필드 값 업데이트
  const handleUpdateField = (member: string, fieldId: string, value: string) => {
    setResponses({
      ...responses,
      [selectedZone]: {
        ...responses[selectedZone],
        [member]: {
          ...(responses[selectedZone]?.[member] || {}),
          [fieldId]: value
        }
      }
    })
  }

  // 전체 상태 일괄 제어 기능
  const handleApplyStatusToAll = (statusVal: '참여' | '불참' | '미정') => {
    const updatedZone = Object.fromEntries(
      zoneMembers.map((member) => {
        const prev = responses[selectedZone]?.[member] || {}
        return [
          member,
          {
            ...prev,
            status: statusVal,
            // 다른 조건부 필드들은 초기화
            time: '',
            reason: '',
            note: prev.note || ''
          }
        ]
      })
    )
    setResponses({
      ...responses,
      [selectedZone]: updatedZone
    })
  }

  // 필수 데이터 작성 완료 현황 계산
  const completedCount = zoneMembers.filter((m) => {
    const mResp = responses[selectedZone]?.[m]
    return mResp && mResp['status'] && mResp['status'] !== '미정'
  }).length

  // 1. 임시 저장 핸들러
  const handleSaveDraft = () => {
    setSubmissionStatus({
      ...submissionStatus,
      [selectedZone]: 'draft'
    })
    setSaveToast('draft')
    setTimeout(() => setSaveToast('idle'), 2500)
  }

  // 2. 최종 제출 핸들러
  const handleSubmitFinal = () => {
    setSubmissionStatus({
      ...submissionStatus,
      [selectedZone]: 'submitted'
    })
    setSaveToast('final')
    setTimeout(() => {
      setSaveToast('idle')
      onBack() // 이전 대시보드로 이동
    }, 2500)
  }

  // 3. 텔레그램 메세지 복사 핸들러
  const handleCopyTelegramText = async () => {
    const lines: string[] = []
    lines.push(`[${selectedZone} 구역 - ${config.title}]`)
    lines.push(`공지: ${config.notice}`)
    lines.push(`-----------------------`)
    
    zoneMembers.forEach((member) => {
      const resp = responses[selectedZone]?.[member] || {}
      const statusText = resp['status'] || '미정'
      
      let details: string[] = []
      config.fields.forEach((field: CustomField) => {
        if (field.id === 'status') return
        if (field.showIfFieldId) {
          if (resp[field.showIfFieldId] !== field.showIfValue) return
        }
        
        const val = resp[field.id]
        if (val) {
          details.push(`${field.label}: ${val}`)
        }
      })

      const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : ''
      lines.push(`- ${member}: ${statusText}${detailsStr}`)
    })

    lines.push(`-----------------------`)
    const currentStatus = submissionStatus[selectedZone] === 'submitted' ? '제출 완료' : '임시 저장'
    lines.push(`작성 상태: ${currentStatus} (완료율: ${completedCount}/${zoneMembers.length})`)

    const copyText = lines.join('\n')
    await navigator.clipboard?.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* 토스트 피드백 */}
      {saveToast !== 'idle' && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-primary text-primary-foreground px-4 py-3 shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
          <FolderSync className="size-4 animate-spin" />
          <span className="text-xs font-semibold">
            {saveToast === 'draft'
              ? '진행상황이 임시 저장되었습니다 (관리자 실시간 확인 가능).'
              : '최종 제출 완료! 대시보드로 이동합니다.'}
          </span>
        </div>
      )}

      {/* 헤더 정보 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">마감 시간: {formatDeadline(config.deadline)}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">구역 선택:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="h-8 text-xs font-bold rounded-lg border border-border bg-background px-2"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>{zone} 구역</option>
              ))}
            </select>
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
        <p className="text-xs leading-5 text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10">
          📢 {config.notice}
        </p>
      </div>

      {/* 간이 상태 요약 및 일괄 작업 */}
      <div className="grid grid-cols-4 gap-2">
        <Summary label="참석" value={zoneMembers.filter((m) => responses[selectedZone]?.[m]?.['status'] === '참여').length} />
        <Summary label="불참" value={zoneMembers.filter((m) => responses[selectedZone]?.[m]?.['status'] === '불참').length} />
        <Summary label="미정" value={zoneMembers.filter((m) => !responses[selectedZone]?.[m]?.['status'] || responses[selectedZone]?.[m]?.['status'] === '미정').length} />
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-2 text-center flex flex-col justify-center">
          <p className="text-xs font-semibold text-primary">제출 현황</p>
          <p className="text-[10px] font-bold mt-0.5 text-muted-foreground">
            {submissionStatus[selectedZone] === 'submitted' ? '제출됨' : submissionStatus[selectedZone] === 'draft' ? '임시저장' : '작성전'}
          </p>
        </div>
      </div>

      {/* 전체 제어 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1 select-none">
        <Button size="sm" variant="outline" className="shrink-0 rounded-full text-[11px] h-8" onClick={() => handleApplyStatusToAll('참여')}>전체 참여</Button>
        <Button size="sm" variant="outline" className="shrink-0 rounded-full text-[11px] h-8" onClick={() => handleApplyStatusToAll('불참')}>전체 불참</Button>
        <Button size="sm" variant="outline" className="shrink-0 rounded-full text-[11px] h-8" onClick={() => handleApplyStatusToAll('미정')}>전체 초기화</Button>
      </div>

      {/* 구역원 명단 폼 리스트 */}
      <div className="flex flex-col gap-3">
        {zoneMembers.map((member) => {
          const memberResponse = responses[selectedZone]?.[member] || {}

          return (
            <Card key={member} className="rounded-2xl border-0 shadow-sm bg-background">
              <CardContent className="flex flex-col gap-3.5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        memberResponse['status'] === '참여'
                          ? 'bg-emerald-100 text-emerald-700'
                          : memberResponse['status'] === '불참'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {member.slice(0, 1)}
                    </span>
                    <span className="font-bold text-sm tracking-tight">{member}</span>
                  </div>
                  <Badge
                    variant={memberResponse['status'] === '미정' || !memberResponse['status'] ? 'secondary' : 'default'}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 ${
                      memberResponse['status'] === '참여'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : memberResponse['status'] === '불참'
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                        : ''
                    }`}
                  >
                    {memberResponse['status'] || '미정'}
                  </Badge>
                </div>

                {/* 질문 항목 기반 동적 입력 필드 렌더링 */}
                <div className="flex flex-col gap-3 pl-1 pt-1 border-t border-border/40">
                  {config.fields.map((field: CustomField) => {
                    // 1. 조건부 렌더링 검사 (showIfFieldId가 지정된 경우 부모 값과 일치해야 함)
                    if (field.showIfFieldId) {
                      const dependencyValue = memberResponse[field.showIfFieldId]
                      if (dependencyValue !== field.showIfValue) {
                        return null
                      }
                    }

                    // 2. 타입에 맞춰 인풋 컴포넌트 출력
                    return (
                      <div key={field.id} className="flex flex-col gap-1.5 w-full">
                        <label className="text-[11px] font-bold text-muted-foreground">
                          {field.label}
                        </label>
                        
                        {field.type === 'select' && (
                          <ToggleGroup
                            type="single"
                            value={memberResponse[field.id] || '미정'}
                            onValueChange={(val) => {
                              if (val) handleUpdateField(member, field.id, val)
                            }}
                            className="grid grid-cols-3 border border-border/80 rounded-lg overflow-hidden h-9 bg-background"
                          >
                            {field.options?.map((opt) => (
                              <ToggleGroupItem
                                key={opt}
                                value={opt}
                                className="text-[10px] font-semibold h-full border-0 rounded-none"
                              >
                                {opt}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        )}

                        {field.type === 'chips' && (
                          <div className="flex flex-wrap gap-1.5">
                            {field.options?.map((opt) => {
                              const isSelected = memberResponse[field.id] === opt
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleUpdateField(member, field.id, opt)}
                                  className={`rounded-full px-3.5 py-1 text-xs font-semibold border transition-all ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/70'
                                  }`}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {field.type === 'text' && (
                          <Input
                            placeholder={`${field.label} 입력`}
                            value={memberResponse[field.id] || ''}
                            onChange={(e) => handleUpdateField(member, field.id, e.target.value)}
                            className="h-9 text-xs rounded-lg border-border/80"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 하단 고정 제어 바 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex w-full max-w-lg gap-2 bg-background/95 border-t border-border/60 p-3 shadow-lg backdrop-blur rounded-t-2xl">
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-xl text-xs font-bold text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
          onClick={handleSaveDraft}
        >
          임시 저장
        </Button>
        <Button
          className="h-11 flex-2 rounded-xl text-xs font-bold"
          onClick={handleSubmitFinal}
        >
          최종 제출 ({completedCount}/{zoneMembers.length}명)
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-xl shrink-0 border-border/80 hover:bg-muted"
          onClick={handleCopyTelegramText}
          aria-label="텔레그램 결과 텍스트 복사"
        >
          {copied ? <CheckCheck className="text-emerald-500" /> : <Copy />}
        </Button>
      </div>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-background p-3 text-center shadow-sm border border-border/40">
      <p className="text-lg font-black tracking-tight text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{label}</p>
    </div>
  )
}

// --- 개별 일반 출석표 뷰 ---
interface AttendanceViewProps {
  role: Role
  attendance: Record<string, number>
  toggleAttendance: (member: string) => void
  completed: number
  setDetail: (v: string) => void
}

function AttendanceView({
  role,
  attendance,
  toggleAttendance,
  completed,
  setDetail
}: AttendanceViewProps) {
  // 베레아 구역 명단
  const bereaMembers = membersPerZone['베레아']

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted-foreground">오늘 · 8월 18일 화요일</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">출석 관리</h2>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm bg-background">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">베레아 구역 출석율</p>
              <p className="mt-1 text-2xl font-black tracking-tight">
                {completed} <span className="text-sm font-medium text-muted-foreground"> / {bereaMembers.length}명</span>
              </p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <CalendarDays className="size-6" />
            </div>
          </div>
          <Progress value={(completed / bereaMembers.length) * 100} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {role === 'user' && (
        <Button className="h-12 rounded-xl text-xs font-bold" onClick={() => setDetail('submit')}>
          유연한 출석 및 커스텀 취합표 열기
        </Button>
      )}

      {/* 구역원 목록 */}
      <div className="flex flex-col gap-2.5">
        {bereaMembers.map((member) => {
          const isChecked = !!attendance[member]

          return (
            <button
              key={member}
              onClick={() => toggleAttendance(member)}
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-background p-4 text-left shadow-sm hover:border-primary/20 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ${
                    isChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {member.slice(0, 1)}
                </span>
                <div>
                  <span className="block font-bold text-sm tracking-tight">{member}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {isChecked ? `${attendance[member]}단계 완료됨` : '미체크 · 탭하여 기록'}
                  </span>
                </div>
              </div>
              {isChecked ? (
                <Check className="size-5 text-emerald-500 shrink-0" />
              ) : (
                <span className="text-[10px] text-muted-foreground font-semibold">체크 안함</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- 설정 뷰 ---
interface SettingsViewProps {
  role: Role
  setRole: (role: Role) => void
}

function SettingsView({ role, setRole }: SettingsViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-muted-foreground">앱 환경 및 권한 관리</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">설정</h2>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm bg-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">개발용 시뮬레이터 역할 전환</CardTitle>
          <CardDescription className="text-xs">
            실제 서비스 배치 시 텔레그램 고유 계정 ID로 자동 권한 처리가 동작합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={role}
            onValueChange={(value) => value && setRole(value as Role)}
            className="grid grid-cols-2 border border-border rounded-xl overflow-hidden bg-background h-10"
          >
            <ToggleGroupItem value="admin" className="text-xs font-semibold h-full border-0 rounded-none">
              총괄 관리자 (서기)
            </ToggleGroupItem>
            <ToggleGroupItem value="user" className="text-xs font-semibold h-full border-0 rounded-none">
              구역장 (베레아)
            </ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm bg-background">
        <CardContent className="flex items-center gap-3.5 p-5">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground font-extrabold text-sm">
            김
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm tracking-tight">김도현</p>
            <p className="text-xs text-muted-foreground">
              {role === 'admin' ? '총괄 관리자 · 서기' : '베레아 구역 · 구역장'}
            </p>
          </div>
          <ChevronRight className="ml-auto size-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  )
}
