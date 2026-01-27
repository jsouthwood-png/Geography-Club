
import React, { useState } from 'react';
import { GeographyTopic, Question, Feedback, HistoryItem } from './types';
import { generateQuestion, gradeAnswer } from './services/geminiService';

// Reusable Components
const Header = () => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-green-700 p-2 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Sandhurst Geography</h1>
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mt-0.5">3-Mark Pro Expert</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500">
        <span>Edexcel Spec A</span>
        <span className="h-4 w-px bg-slate-200"></span>
        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black uppercase">Department App</span>
      </div>
    </div>
  </header>
);

interface TopicCardProps {
  topic: GeographyTopic;
  selected: boolean;
  onClick: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-xl text-left transition-all border-2 ${
      selected 
      ? 'border-green-600 bg-green-50 text-green-800 shadow-sm' 
      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:shadow-sm'
    }`}
  >
    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Topic</p>
    <p className="font-semibold text-xs sm:text-sm leading-snug">{topic}</p>
  </button>
);

export default function App() {
  const [activeTopic, setActiveTopic] = useState<GeographyTopic>(GeographyTopic.COASTS);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchQuestion = async () => {
    setLoading(true);
    setFeedback(null);
    setUserAnswer('');
    try {
      const q = await generateQuestion(activeTopic);
      setCurrentQuestion(q);
    } catch (error) {
      console.error("Question fetch error:", error);
      alert("Failed to generate question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToMenu = () => {
    setCurrentQuestion(null);
    setFeedback(null);
    setUserAnswer('');
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    setGrading(true);
    try {
      const f = await gradeAnswer(currentQuestion, userAnswer);
      setFeedback(f);
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        question: currentQuestion,
        userAnswer,
        feedback: f,
        date: new Date().toLocaleString()
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (error) {
      console.error("Grading error:", error);
      alert("Grading failed. Please try submitting again.");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {!currentQuestion && !loading && (
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <div className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
              Sandhurst School Geography Department
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">3-Mark Structure Practice</h2>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              Master the Edexcel Spec A technique: 
              <span className="block font-bold mt-2 text-green-700">Point &rarr; Explanation &rarr; Development</span>
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {(Object.values(GeographyTopic) as GeographyTopic[]).map(t => (
                <TopicCard 
                  key={t} 
                  topic={t} 
                  selected={activeTopic === t} 
                  onClick={() => setActiveTopic(t)} 
                />
              ))}
            </div>

            <button 
              onClick={fetchQuestion}
              className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 mx-auto"
            >
              <span>Start Practice Session</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium italic">Fetching spec-aligned question...</p>
          </div>
        )}

        {currentQuestion && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={handleReturnToMenu}
                  className="text-slate-500 hover:text-slate-900 text-sm font-bold flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Return to Menu
                </button>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Question Mode</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {currentQuestion.topic.split(':')[0]}
                  </span>
                  <span className="text-slate-400 font-bold text-sm">[3 Marks]</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 leading-snug mb-2">
                  {currentQuestion.questionText}
                </h3>
                <p className="text-sm text-slate-500 italic">Structure: Make a point, explain it, then develop that explanation.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Student Answer Area</label>
                <textarea 
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full min-h-[160px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all resize-none text-slate-800"
                  disabled={grading || !!feedback}
                />
                <div className="flex justify-between items-center mt-4">
                  <button 
                    onClick={fetchQuestion}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Skip to New Question
                  </button>
                  {!feedback ? (
                    <button 
                      onClick={handleSubmit}
                      disabled={!userAnswer.trim() || grading}
                      className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-800 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {grading ? 'Marking...' : 'Submit Response'}
                      {!grading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setFeedback(null); setUserAnswer(''); }}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all"
                    >
                      Retry This Question
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {feedback ? (
                <div className="bg-white rounded-2xl shadow-md border-2 border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className={`p-6 text-center ${feedback.score === 3 ? 'bg-green-600' : feedback.score >= 2 ? 'bg-amber-500' : 'bg-rose-500'} text-white`}>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Examiner Score</p>
                    <div className="text-5xl font-black">{feedback.score}<span className="text-2xl opacity-60">/3</span></div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">Detailed Feedback</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">{feedback.comments}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-xs font-bold text-green-700 uppercase mb-2">Strengths</p>
                        <ul className="text-sm text-green-800 space-y-1">
                          {feedback.strengths.map((s, i) => <li key={i} className="flex gap-2"><span>✓</span> {s}</li>)}
                        </ul>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-xs font-bold text-amber-700 uppercase mb-2">Development Needs</p>
                        <ul className="text-sm text-amber-800 space-y-1">
                          {feedback.improvements.map((s, i) => <li key={i} className="flex gap-2"><span>→</span> {s}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Model Phrasing</p>
                      <p className="text-sm text-slate-700 italic bg-slate-50 p-3 rounded-lg border-l-4 border-green-600 leading-relaxed">"{feedback.suggestedAnswer}"</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm sticky top-24">
                  <h4 className="font-bold text-lg mb-4 text-green-400">Sandhurst "Chain of Reasoning"</h4>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold border border-green-500/30">1</div>
                      <div>
                        <p className="font-bold text-sm">Identify</p>
                        <p className="text-slate-400 text-xs mt-1">State your reason/point clearly.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold border border-green-500/30">2</div>
                      <div>
                        <p className="font-bold text-sm">Explain</p>
                        <p className="text-slate-400 text-xs mt-1">"This is because..." or "This means that..."</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold border border-green-500/30">3</div>
                      <div>
                        <p className="font-bold text-sm">Develop</p>
                        <p className="text-slate-400 text-xs mt-1">"Which leads to..." or "Consequently..."</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold text-green-400 uppercase mb-2">Geography Connectives</p>
                    <div className="flex flex-wrap gap-2">
                      {['Consequently', 'As a result', 'Meaning that', 'Therefore'].map(w => (
                        <span key={w} className="text-[10px] bg-white/10 px-2 py-1 rounded text-slate-300">{w}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
            >
              <svg className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              View History ({history.length})
            </button>
            {showHistory && (
              <div className="mt-6 space-y-4">
                {history.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-green-700 mb-1">{item.question.topic}</p>
                      <h5 className="font-bold text-slate-800 text-sm">{item.question.questionText}</h5>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.feedback.score === 3 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.feedback.score}/3 Marks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-8 text-center mt-12">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Sandhurst School Geography Department • Spec A Toolkit</p>
      </footer>
    </div>
  );
}
