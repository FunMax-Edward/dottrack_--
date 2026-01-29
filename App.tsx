import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  Calendar as CalendarIcon, 
  ListRestart, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { 
  Project, 
  Attempt, 
  ReviewItem, 
  QuestionStatus, 
  ViewState, 
  ProjectUnit 
} from './types';
import { 
  loadProject, 
  saveProject, 
  loadAttempts, 
  saveAttempts, 
  loadReviews, 
  saveReviews,
  getTodayStr,
  calculateNextReview,
  getStatusMap,
  getQuestionKey
} from './services/storage';
import ProjectSetup from './components/ProjectSetup';
import DotGrid from './components/DotGrid';
import { CalendarDayCell } from './components/StatsComponents';

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const App: React.FC = () => {
  // --- Global State ---
  const [project, setProject] = useState<Project | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  
  // --- UI State ---
  const [view, setView] = useState<ViewState>('setup');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // --- Filters ---
  const [practiceFilter, setPracticeFilter] = useState<'all' | 'incorrect' | 'unattempted'>('all');
  const [activeUnitId, setActiveUnitId] = useState<string | 'all'>('all');

  // --- Initialization ---
  useEffect(() => {
    const p = loadProject();
    if (p) {
      setProject(p);
      setAttempts(loadAttempts());
      setReviews(loadReviews());
      setView('dashboard');
    } else {
      setView('setup');
    }
  }, []);

  // --- Derived State ---
  const statusMap = useMemo(() => getStatusMap(attempts), [attempts]);
  
  const todaysReviews = useMemo(() => {
    const today = getTodayStr();
    return reviews.filter(r => r.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [reviews]);

  // --- Actions ---

  const handleProjectCreate = (newProject: Project) => {
    setProject(newProject);
    saveProject(newProject);
    setView('dashboard');
  };

  const handleStatusToggle = (unitId: string, qIndex: number, currentStatus: QuestionStatus) => {
    if (!project) return;

    // Cycle: Unattempted -> Correct -> Incorrect -> Unattempted
    let nextStatus: QuestionStatus = 'correct';
    if (currentStatus === 'correct') nextStatus = 'incorrect';
    if (currentStatus === 'incorrect') nextStatus = 'unattempted';

    const today = getTodayStr();
    const now = Date.now();

    // 1. Record Attempt
    const newAttempt: Attempt = {
      projectId: project.id,
      unitId,
      questionIndex: qIndex,
      status: nextStatus,
      timestamp: now,
      dateStr: today
    };

    const updatedAttempts = [...attempts, newAttempt];
    setAttempts(updatedAttempts);
    saveAttempts(updatedAttempts);

    // 2. Handle SRS (Review Queue)
    const key = getQuestionKey(unitId, qIndex);
    const existingReviewIndex = reviews.findIndex(r => getQuestionKey(r.unitId, r.questionIndex) === key);
    
    let updatedReviews = [...reviews];
    const prevReview = existingReviewIndex >= 0 ? reviews[existingReviewIndex] : undefined;
    
    // If setting to unattempted, remove any reviews? 
    // Usually if we clear status, we might want to clear review history too, or keep it. 
    // Let's remove it for simplicity.
    if (nextStatus === 'unattempted') {
      if (existingReviewIndex >= 0) {
        updatedReviews.splice(existingReviewIndex, 1);
      }
    } else {
      const nextReviewItem = calculateNextReview(nextStatus, prevReview, today);
      
      // Remove old review entry first
      if (existingReviewIndex >= 0) {
        updatedReviews.splice(existingReviewIndex, 1);
      }

      // Add new one if needed
      if (nextReviewItem) {
        nextReviewItem.projectId = project.id;
        nextReviewItem.unitId = unitId;
        nextReviewItem.questionIndex = qIndex;
        updatedReviews.push(nextReviewItem);
      }
    }

    setReviews(updatedReviews);
    saveReviews(updatedReviews);
  };

  // --- Render Helpers ---

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const days = [];
    // Padding
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-24 bg-transparent" />);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday = date.toISOString().split('T')[0] === getTodayStr();
      days.push(
        <CalendarDayCell 
          key={d} 
          date={date} 
          attempts={attempts} 
          onClick={(ds) => {
            setSelectedDate(ds);
            setView('practice');
          }}
          isToday={isToday}
        />
      );
    }

    return (
      <div className="p-4 overflow-y-auto h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-2 rounded hover:bg-gray-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => {
                setSelectedDate(getTodayStr());
                setView('practice');
              }}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-2 rounded hover:bg-gray-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
              {d}
            </div>
          ))}
          {days}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-8 grid grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="text-sm text-gray-500">Scheduled Reviews</div>
             <div className="text-2xl font-bold text-rose-500">{todaysReviews.length}</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="text-sm text-gray-500">Questions Done</div>
             <div className="text-2xl font-bold text-emerald-600">
               {Array.from(statusMap.values()).filter(s => s !== 'unattempted').length}
             </div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="text-sm text-gray-500">Accuracy</div>
             <div className="text-2xl font-bold text-blue-600">
               {(() => {
                  const done = Array.from(statusMap.values()).filter(s => s !== 'unattempted').length;
                  const correct = Array.from(statusMap.values()).filter(s => s === 'correct').length;
                  return done ? Math.round((correct / done) * 100) + '%' : '-';
               })()}
             </div>
           </div>
        </div>
      </div>
    );
  };

  const renderPracticeView = () => {
    if (!project) return null;

    const filteredUnits = activeUnitId === 'all' 
      ? project.units 
      : project.units.filter(u => u.id === activeUnitId);

    // For date context in header
    const dateObj = new Date(selectedDate);
    const isToday = selectedDate === getTodayStr();

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex-none">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {!isToday && <span className="text-gray-400 text-sm font-normal">History:</span>}
                {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
              </h2>
            </div>
            {/* Unit Filter Dropdown */}
            <div className="relative">
              <select 
                value={activeUnitId}
                onChange={(e) => setActiveUnitId(e.target.value)}
                className="appearance-none bg-gray-100 border-none text-sm font-medium py-2 pl-4 pr-8 rounded-full outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="all">All Units</option>
                {project.units.map(u => (
                  <option key={u.id} value={u.id}>Unit {u.name}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex gap-2 text-sm">
            <button 
              onClick={() => setPracticeFilter('all')}
              className={`px-3 py-1 rounded-full transition-colors ${practiceFilter === 'all' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              All
            </button>
            <button 
              onClick={() => setPracticeFilter('unattempted')}
              className={`px-3 py-1 rounded-full transition-colors ${practiceFilter === 'unattempted' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Unattempted
            </button>
             <button 
              onClick={() => setPracticeFilter('incorrect')}
              className={`px-3 py-1 rounded-full transition-colors ${practiceFilter === 'incorrect' ? 'bg-rose-100 text-rose-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Incorrect
            </button>
          </div>
        </div>

        {/* Scrollable Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
          {filteredUnits.map(unit => (
            <div key={unit.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-baseline gap-3 mb-3 border-b border-gray-100 pb-2">
                 <h3 className="text-lg font-bold text-gray-800">Unit {unit.name}</h3>
                 <span className="text-xs text-gray-400 font-mono">{unit.count} Questions</span>
              </div>
              <DotGrid 
                unit={unit} 
                statusMap={statusMap} 
                onToggle={handleStatusToggle} 
                filter={practiceFilter}
              />
            </div>
          ))}
          {filteredUnits.length === 0 && (
             <div className="text-center py-20 text-gray-400">No units found.</div>
          )}
        </div>
      </div>
    );
  };

  const renderReviewQueue = () => {
    if (todaysReviews.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">All Caught Up!</h2>
          <p className="text-gray-500 mt-2 max-w-xs">You have no pending reviews for today. Great job keeping the queue clean.</p>
          <button 
            onClick={() => setView('dashboard')}
            className="mt-6 text-primary-600 font-medium hover:underline"
          >
            Go back to Dashboard
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2">Review Queue</h2>
        <p className="text-gray-500 mb-6">Spaced repetition items due today or earlier.</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {todaysReviews.map((review, idx) => {
            const unit = project?.units.find(u => u.id === review.unitId);
            return (
              <div key={idx} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col justify-between hover:border-primary-300 transition-colors group">
                <div>
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                        {review.dueDate === getTodayStr() ? 'Due Today' : 'Overdue'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        +{review.interval} days
                      </span>
                   </div>
                   <div className="text-xl font-bold text-gray-800 mb-1">
                     Unit {unit?.name || '?'} <span className="text-gray-400">#</span>{review.questionIndex}
                   </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleStatusToggle(review.unitId, review.questionIndex, 'incorrect')} // Toggle incorrect to reset/keep
                    className="flex-1 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded"
                  >
                    Still Wrong
                  </button>
                   <button 
                    onClick={() => {
                        // Force correct
                        const newAttempt: Attempt = {
                            projectId: project!.id,
                            unitId: review.unitId,
                            questionIndex: review.questionIndex,
                            status: 'correct',
                            timestamp: Date.now(),
                            dateStr: getTodayStr()
                        };
                        setAttempts(prev => [...prev, newAttempt]);
                        saveAttempts([...attempts, newAttempt]);
                        
                        // Remove from review queue
                        const newReviews = reviews.filter(r => r !== review);
                        setReviews(newReviews);
                        saveReviews(newReviews);
                    }}
                    className="flex-1 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Main Render ---

  if (view === 'setup') {
    return <ProjectSetup onSave={handleProjectCreate} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="
        fixed bottom-0 left-0 right-0 h-16 bg-white border-t z-50 flex justify-around items-center
        md:relative md:h-full md:w-20 md:flex-col md:justify-start md:pt-8 md:border-t-0 md:border-r md:gap-8
      ">
        <button 
          onClick={() => setView('dashboard')}
          className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          title="Dashboard"
        >
          <CalendarIcon size={24} />
          <span className="text-[10px] md:hidden">Home</span>
        </button>

        <button 
           onClick={() => {
             setSelectedDate(getTodayStr());
             setView('practice');
           }}
          className={`p-3 rounded-xl transition-all ${view === 'practice' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          title="Practice"
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] md:hidden">Grid</span>
        </button>

        <button 
          onClick={() => setView('review')}
          className={`relative p-3 rounded-xl transition-all ${view === 'review' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
          title="Review Queue"
        >
          <ListRestart size={24} />
          <span className="text-[10px] md:hidden">Review</span>
          {todaysReviews.length > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white"></span>
          )}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative pb-16 md:pb-0">
        {view === 'dashboard' && renderCalendar()}
        {view === 'practice' && renderPracticeView()}
        {view === 'review' && renderReviewQueue()}
      </main>
    </div>
  );
};

export default App;