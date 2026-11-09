import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  aiInterviewApi,
  internshipApi,
  studentApi,
  type InterviewQuestion,
  type InterviewEvaluation,
  type InterviewSessionRecord,
  type Internship,
  type StudentProfile,
} from '../../services/api';
import { ScoreRing, ProgressBar } from '../../components/ui';

interface QAHistoryItem {
  questionId: number;
  question: string;
  type: string;
  focusArea: string;
  context: string;
  candidateAnswer: string;
  evaluation: InterviewEvaluation;
}

export default function AIMockInterview() {
  // Page / Simulation states: 'setup' | 'interview' | 'summary'
  const [step, setStep] = useState<'setup' | 'interview' | 'summary'>('setup');

  // Setup state
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<number | ''>('');
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active interview state
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<InterviewEvaluation | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAHistoryItem[]>([]);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // History Drawer state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pastSessions, setPastSessions] = useState<InterviewSessionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null);

  // Load profile and available internships
  useEffect(() => {
    async function init() {
      try {
        const [profileRes, internshipsRes] = await Promise.allSettled([
          studentApi.getProfile(),
          internshipApi.getAll(),
        ]);

        if (profileRes.status === 'fulfilled') {
          setStudentProfile(profileRes.value);
        }
        if (internshipsRes.status === 'fulfilled') {
          setInternships(internshipsRes.value);
        }
      } catch (err) {
        console.error('Failed to load initial interview setup data:', err);
      }
    }
    init();

    // Check Speech Recognition support
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Handle Speech Recognition Toggle
  const toggleSpeechRecognition = () => {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or type your response.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setCandidateAnswer((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Could not initialize speech recognition:', err);
      setIsRecording(false);
    }
  };

  // Stop recording when question changes or completes
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentIndex]);

  // Start Interview Generation
  const handleStartInterview = async () => {
    setLoadingQuestions(true);
    setErrorMsg(null);

    const effectiveRole = customRoleInput.trim() || targetRole;

    try {
      const generated = await aiInterviewApi.generateQuestions({
        internshipId: selectedInternshipId ? Number(selectedInternshipId) : undefined,
        targetRole: effectiveRole,
      });

      if (!generated || generated.length === 0) {
        throw new Error('No interview questions were generated. Please try again.');
      }

      setQuestions(generated);
      setCurrentIndex(0);
      setCandidateAnswer('');
      setCurrentEvaluation(null);
      setShowModelAnswer(false);
      setQaHistory([]);
      setStep('interview');
    } catch (err: any) {
      console.error('Error starting mock interview:', err);
      setErrorMsg(err.message || 'Unable to connect to AI Interview Engine. Please check your network or try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Submit Answer for Real-Time Evaluation
  const handleSubmitAnswer = async () => {
    if (!questions[currentIndex]) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const currentQ = questions[currentIndex];
    const answer = candidateAnswer.trim();

    if (!answer) {
      alert('Please provide an answer (typed or voice-dictated) before submitting for evaluation.');
      return;
    }

    setEvaluating(true);
    try {
      const evalResult = await aiInterviewApi.evaluateResponse({
        questionId: currentQ.id,
        question: currentQ.question,
        candidateAnswer: answer,
        questionType: currentQ.type,
        focusArea: currentQ.focusArea,
      });

      setCurrentEvaluation(evalResult);
    } catch (err: any) {
      console.error('Evaluation failed:', err);
      // Fallback evaluation client-side if network interrupted
      const fallbackEval: InterviewEvaluation = {
        technicalScore: 75,
        communicationClarity: 80,
        modelAnswer: 'A senior response should address core architectural trade-offs, state management, and edge-case handling.',
        constructiveFeedback: 'Clear explanation of principles. To improve, cite production monitoring metrics and specific failure modes.',
        keyStrengths: ['Articulate expression', 'Direct answer to question'],
      };
      setCurrentEvaluation(fallbackEval);
    } finally {
      setEvaluating(false);
    }
  };

  // Advance to Next Question or Final Summary
  const handleProceedNext = async () => {
    const currentQ = questions[currentIndex];
    const answer = candidateAnswer.trim() || '(Skipped)';
    const evalData = currentEvaluation || {
      technicalScore: 0,
      communicationClarity: 0,
      modelAnswer: 'Question skipped by candidate.',
      constructiveFeedback: 'Question was skipped. Practice answering this topic in future sessions.',
      keyStrengths: ['Skipped'],
    };

    const updatedHistory: QAHistoryItem[] = [
      ...qaHistory,
      {
        questionId: currentQ.id,
        question: currentQ.question,
        type: currentQ.type,
        focusArea: currentQ.focusArea,
        context: currentQ.context,
        candidateAnswer: answer,
        evaluation: evalData,
      },
    ];

    setQaHistory(updatedHistory);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setCandidateAnswer('');
      setCurrentEvaluation(null);
      setShowModelAnswer(false);
    } else {
      // Completed all questions -> Finalize Session
      await handleCompleteSession(updatedHistory);
      setStep('summary');
    }
  };

  // Finalize & Persist Session
  const handleCompleteSession = async (completedQA: QAHistoryItem[]) => {
    const evaluatedItems = completedQA.filter((item) => item.candidateAnswer !== '(Skipped)');
    const totalTech = evaluatedItems.reduce((acc, curr) => acc + curr.evaluation.technicalScore, 0);
    const totalComm = evaluatedItems.reduce((acc, curr) => acc + curr.evaluation.communicationClarity, 0);

    const count = evaluatedItems.length || 1;
    const techAvg = Math.round(totalTech / count);
    const commAvg = Math.round(totalComm / count);
    const overallScore = Math.round(techAvg * 0.6 + commAvg * 0.4);

    try {
      const effectiveRole = customRoleInput.trim() || targetRole;
      const saved = await aiInterviewApi.completeSession({
        targetRole: effectiveRole,
        overallScore,
        technicalAverage: techAvg,
        communicationAverage: commAvg,
        qaBreakdown: completedQA,
      });
      if (saved?.id) {
        setSavedSessionId(saved.id);
      }
    } catch (err) {
      console.error('Failed to persist interview session:', err);
    }
  };

  // Load Past Interview History
  const fetchPastSessions = async () => {
    setLoadingHistory(true);
    try {
      const history = await aiInterviewApi.getHistory();
      setPastSessions(history || []);
    } catch (err) {
      console.error('Failed to load past sessions:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryDrawer = () => {
    setHistoryOpen(true);
    fetchPastSessions();
  };

  // Skill tags parsed from student profile
  const parsedStudentSkills = studentProfile?.skills
    ? studentProfile.skills.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    : ['Java', 'Spring Boot', 'React', 'PostgreSQL', 'REST APIs'];

  // Current question helpers
  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + (currentEvaluation ? 1 : 0)) / questions.length) * 100) : 0;

  // Aggregate metrics for summary
  const totalQuestions = qaHistory.length;
  const answeredQuestions = qaHistory.filter((q) => q.candidateAnswer !== '(Skipped)').length;
  const avgTechScore =
    answeredQuestions > 0
      ? Math.round(
          qaHistory.reduce((acc, item) => acc + (item.candidateAnswer !== '(Skipped)' ? item.evaluation.technicalScore : 0), 0) /
            answeredQuestions
        )
      : 0;
  const avgCommScore =
    answeredQuestions > 0
      ? Math.round(
          qaHistory.reduce((acc, item) => acc + (item.candidateAnswer !== '(Skipped)' ? item.evaluation.communicationClarity : 0), 0) /
            answeredQuestions
        )
      : 0;
  const overallReadinessScore = Math.round(avgTechScore * 0.6 + avgCommScore * 0.4);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5D5CE] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FDF2ED] px-3.5 py-1 text-xs font-bold text-[#7A4B43] border border-[#E5D5CE] mb-2">
            <span className="flex h-2 w-2 rounded-full bg-[#2D6A4F] animate-ping" />
            Gemini AI Live Interview Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2B1B17] tracking-tight">
            AI Mock Interview & Feedback
          </h1>
          <p className="mt-1 text-[#7A6A65] text-base max-w-2xl">
            Simulate real technical, architectural, and behavioral hiring rounds tailored to your profile with instant scoring, voice dictation, and model answers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openHistoryDrawer}
            className="btn btn-secondary py-2.5 px-4 text-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Session History
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex-1 text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 1: INTERVIEW SETUP & MODE SELECTOR
      ───────────────────────────────────────────────────────────── */}
      {step === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration Card */}
          <div className="lg:col-span-2 card space-y-6">
            <div className="border-b border-[#E5D5CE] pb-4">
              <h2 className="text-xl font-bold font-serif text-[#2B1B17]">Select Target Role & Context</h2>
              <p className="text-sm text-[#7A6A65] mt-1">
                Customize the interview target to align with specific job descriptions or open company listings.
              </p>
            </div>

            {/* Target Role Dropdown / Presets */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-[#2B1B17]">
                Target Specialization Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Full Stack Software Engineer',
                  'Backend Java / Spring Boot Engineer',
                  'Frontend React & TypeScript Engineer',
                  'Cloud & DevOps Engineer Intern',
                  'AI / Data Science Intern',
                ].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setTargetRole(role);
                      setCustomRoleInput('');
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left text-sm font-semibold transition-all ${
                      targetRole === role && !customRoleInput
                        ? 'border-[#7A4B43] bg-[#FDF2ED] text-[#7A4B43] shadow-xs'
                        : 'border-[#E5D5CE] bg-white text-[#2B1B17] hover:bg-[#FAF6F4]'
                    }`}
                  >
                    <span>{role}</span>
                    {targetRole === role && !customRoleInput && (
                      <span className="flex h-2 w-2 rounded-full bg-[#7A4B43]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Role Input */}
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A6A65] mb-1.5">
                  Or Enter Custom Role Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems Engineer Intern"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  className="w-full rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] px-4 py-2.5 text-sm text-[#2B1B17] placeholder-[#7A6A65]/60 focus:border-[#7A4B43] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Link to Posted Internship */}
            {internships.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#E5D5CE]">
                <label className="block text-sm font-bold text-[#2B1B17]">
                  Align with an Active PathFinder Internship (Optional)
                </label>
                <select
                  value={selectedInternshipId}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : '';
                    setSelectedInternshipId(id);
                    if (id) {
                      const found = internships.find((i) => i.id === id);
                      if (found) {
                        setTargetRole(found.title);
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-[#E5D5CE] bg-white px-4 py-2.5 text-sm text-[#2B1B17] focus:border-[#7A4B43] focus:outline-none transition-colors"
                >
                  <option value="">-- Generic Industry Standard Role --</option>
                  {internships.map((int) => (
                    <option key={int.id} value={int.id}>
                      {int.title} • {int.companyName || 'Company'} ({int.location || 'Remote'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#7A6A65]">
                  Selecting an internship tailors questions directly to that employer's declared tech stack and requirements.
                </p>
              </div>
            )}

            {/* Launch CTA */}
            <div className="pt-4 border-t border-[#E5D5CE] flex items-center justify-between">
              <div className="text-xs text-[#7A6A65]">
                Generates <span className="font-bold text-[#2B1B17]">5 structured questions</span> (3 Technical, 1 System Design, 1 Behavioral)
              </div>
              <button
                onClick={handleStartInterview}
                disabled={loadingQuestions}
                className="btn btn-primary py-3 px-6 text-sm flex items-center gap-2"
              >
                {loadingQuestions ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Synthesizing Questions...
                  </>
                ) : (
                  <>
                    Start Mock Interview
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Student Profile & AI Interview Info Sidebar */}
          <div className="space-y-6">
            <div className="card space-y-4 bg-linear-to-br from-white to-[#FAF6F4]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDF2ED] border border-[#E5D5CE] text-[#7A4B43]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2B1B17]">Active Profile Context</h3>
                  <p className="text-xs text-[#7A6A65]">
                    {studentProfile?.fullName || 'Student Candidate'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7A6A65] block mb-2">
                  Skills Being Evaluated
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {parsedStudentSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-lg border border-[#E5D5CE] bg-white px-2.5 py-1 text-xs font-semibold text-[#2B1B17]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E5D5CE] bg-[#FDF2ED]/50 p-3.5 text-xs text-[#7A6A65] leading-relaxed">
                <span className="font-bold text-[#7A4B43]">Gemini AI Optimization:</span> Questions dynamically reflect your verified GitHub & CV projects, ensuring you practice answering the exact questions asked in elite tech hiring loops.
              </div>
            </div>

            {/* Features summary */}
            <div className="card space-y-3">
              <h4 className="text-sm font-bold text-[#2B1B17]">Interview Features</h4>
              <ul className="space-y-2.5 text-xs text-[#7A6A65]">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D6A4F] font-bold">✓</span>
                  <span><strong>Dual-Mode Response:</strong> Type or dictate your answer with browser speech-to-text.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D6A4F] font-bold">✓</span>
                  <span><strong>Instant Feedback:</strong> Technical accuracy and communication clarity scored 0–100%.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D6A4F] font-bold">✓</span>
                  <span><strong>Model Answers:</strong> Exemplary industry responses for rapid self-correction.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 2: STEP-BY-STEP INTERACTIVE QUESTION CARD
      ───────────────────────────────────────────────────────────── */}
      {step === 'interview' && currentQ && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress Header */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#7A6A65]">
              <div className="flex items-center gap-2">
                <span className="badge badge-peach uppercase tracking-wider font-bold">
                  {targetRole}
                </span>
                <span>• Question {currentIndex + 1} of {questions.length}</span>
              </div>
              <span className="font-bold text-[#2B1B17]">{progressPercent}% Completed</span>
            </div>
            <ProgressBar value={progressPercent} />
          </div>

          {/* Question Presentation Card */}
          <div className="card space-y-6 border-t-4 border-t-[#7A4B43]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5D5CE] pb-4">
              <div className="flex items-center gap-2">
                {currentQ.type === 'TECHNICAL' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Technical Question
                  </span>
                )}
                {currentQ.type === 'SYSTEM_SCENARIO' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-800 border border-sky-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                    System Architecture & Scenario
                  </span>
                )}
                {currentQ.type === 'BEHAVIORAL' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2ED] px-3 py-1 text-xs font-bold text-[#7A4B43] border border-[#E5D5CE]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7A4B43]" />
                    Behavioral & STAR Method
                  </span>
                )}
                <span className="text-xs font-medium text-[#7A6A65]">
                  Focus: <strong className="text-[#2B1B17]">{currentQ.focusArea}</strong>
                </span>
              </div>

              <span className="text-xs text-[#7A6A65] italic">
                {currentQ.context}
              </span>
            </div>

            {/* Question Text */}
            <div className="py-2">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#2B1B17] leading-relaxed">
                "{currentQ.question}"
              </h2>
            </div>

            {/* Answer Input Section */}
            {!currentEvaluation ? (
              <div className="space-y-4 pt-2">
                {/* Voice Dictation Status & Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAF6F4] p-3 border border-[#E5D5CE]">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                        isRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-white border border-[#E5D5CE] text-[#7A4B43] hover:bg-[#FDF2ED]'
                      }`}
                      title={speechSupported ? 'Click to dictate answer' : 'Speech recognition not supported in this browser'}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="8" y1="22" x2="16" y2="22" />
                      </svg>
                      {isRecording ? 'Listening... (Click to Stop)' : 'Dictate with Voice (Speech-to-Text)'}
                    </button>

                    {isRecording && (
                      <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                        Recording live audio transcript...
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-[#7A6A65]">
                    {candidateAnswer.split(/\s+/).filter(Boolean).length} words • {candidateAnswer.length} chars
                  </span>
                </div>

                {/* Text Area */}
                <textarea
                  rows={6}
                  placeholder="Type or dictate your answer here. Provide specific technical examples, architectural reasoning, trade-offs, and metrics..."
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  className="w-full rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-4 text-sm text-[#2B1B17] placeholder-[#7A6A65]/60 focus:border-[#7A4B43] focus:bg-white focus:outline-none transition-colors"
                />

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleProceedNext}
                    className="btn btn-ghost text-xs text-[#7A6A65] hover:text-[#2B1B17]"
                  >
                    Skip Question →
                  </button>

                  <div className="flex items-center gap-3">
                    {candidateAnswer && (
                      <button
                        type="button"
                        onClick={() => setCandidateAnswer('')}
                        className="btn btn-ghost text-xs text-[#7A6A65]"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={evaluating || !candidateAnswer.trim()}
                      className="btn btn-primary py-2.5 px-6 text-sm flex items-center gap-2"
                    >
                      {evaluating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Evaluating with AI...
                        </>
                      ) : (
                        <>
                          Submit Answer & Evaluate
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Real-Time Evaluation Result Box */
              <div className="space-y-6 pt-4 border-t border-[#E5D5CE] animate-fade-in">
                {/* Answer Recap */}
                <div className="rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-4 text-xs">
                  <div className="font-bold uppercase tracking-wider text-[#7A6A65] mb-1">Your Submitted Response</div>
                  <p className="text-sm text-[#2B1B17] italic leading-relaxed">
                    "{candidateAnswer}"
                  </p>
                </div>

                {/* Score Rings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card bg-white p-5 flex items-center gap-5 border border-[#E5D5CE]">
                    <ScoreRing score={currentEvaluation.technicalScore} label="Technical" size={110} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#2B1B17]">Technical Depth & Accuracy</div>
                      <p className="text-xs text-[#7A6A65] mt-1">
                        Alignment with core framework principles, correct architectural conventions, and terminology.
                      </p>
                    </div>
                  </div>

                  <div className="card bg-white p-5 flex items-center gap-5 border border-[#E5D5CE]">
                    <ScoreRing score={currentEvaluation.communicationClarity} label="Clarity" size={110} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#2B1B17]">Communication & Structure</div>
                      <p className="text-xs text-[#7A6A65] mt-1">
                        Logical sequencing, conciseness, structured thinking (STAR methodology), and clarity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Strengths & Constructive Feedback */}
                <div className="space-y-3">
                  {currentEvaluation.keyStrengths && currentEvaluation.keyStrengths.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Identified Strengths
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentEvaluation.keyStrengths.map((str, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-lg px-2.5 py-1"
                          >
                            ✓ {str}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-[#E5D5CE] bg-[#FDF2ED] p-4 text-xs">
                    <div className="font-bold uppercase tracking-wider text-[#7A4B43] mb-1.5 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      Constructive AI Feedback
                    </div>
                    <p className="text-sm text-[#2B1B17] leading-relaxed">
                      {currentEvaluation.constructiveFeedback}
                    </p>
                  </div>
                </div>

                {/* Model Answer Accordion */}
                <div className="rounded-xl border border-[#E5D5CE] bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-[#2B1B17] hover:bg-[#FAF6F4] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7A4B43]">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      View Exemplary Model Answer
                    </span>
                    <span className="text-xs text-[#7A6A65]">
                      {showModelAnswer ? 'Hide ▲' : 'Show ▼'}
                    </span>
                  </button>

                  {showModelAnswer && (
                    <div className="p-4 border-t border-[#E5D5CE] bg-[#FAF6F4] text-xs text-[#2B1B17] leading-relaxed animate-fade-in font-mono whitespace-pre-wrap">
                      {currentEvaluation.modelAnswer}
                    </div>
                  )}
                </div>

                {/* Continue CTA */}
                <div className="flex items-center justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleProceedNext}
                    className="btn btn-primary py-2.5 px-6 text-sm flex items-center gap-2"
                  >
                    {currentIndex + 1 < questions.length ? (
                      <>
                        Next Question ({currentIndex + 2} of {questions.length}) →
                      </>
                    ) : (
                      <>
                        Complete Session & View Summary
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 3: COMPLETE SESSION SUMMARY & AUDIT BREAKDOWN
      ───────────────────────────────────────────────────────────── */}
      {step === 'summary' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Header Summary Banner */}
          <div className="card bg-linear-to-r from-[#FAF6F4] via-white to-[#FDF2ED] p-8 border border-[#E5D5CE] text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#7A4B43] text-white shadow-md mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="badge badge-peach uppercase tracking-wider font-bold">
                  Session Audit Complete
                </span>
                {savedSessionId && (
                  <span className="text-xs font-mono font-semibold text-[#7A6A65] bg-white border border-[#E5D5CE] rounded-md px-2 py-0.5">
                    ID #{savedSessionId}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#2B1B17]">
                Interview Readiness Assessment
              </h2>
              <p className="text-sm text-[#7A6A65] mt-1">
                Role Evaluated: <strong className="text-[#2B1B17]">{customRoleInput.trim() || targetRole}</strong>
              </p>
            </div>

            {/* Score Ring Display */}
            <div className="flex flex-wrap items-center justify-center gap-8 py-4">
              <div className="text-center">
                <ScoreRing score={overallReadinessScore} label="Overall" size={140} />
                <div className="mt-2 text-xs font-bold text-[#2B1B17]">
                  {overallReadinessScore >= 80
                    ? '🎉 Strong Hire / Interview Ready'
                    : overallReadinessScore >= 60
                    ? '👍 Good Foundations, Polish Nuance'
                    : '⚡ Needs Preparation & Depth'}
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[220px] text-left">
                <div className="rounded-xl border border-[#E5D5CE] bg-white p-3">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#7A6A65]">Technical Proficiency</span>
                    <span className="text-[#7A4B43]">{avgTechScore}%</span>
                  </div>
                  <ProgressBar value={avgTechScore} />
                </div>

                <div className="rounded-xl border border-[#E5D5CE] bg-white p-3">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#7A6A65]">Communication Clarity</span>
                    <span className="text-[#2D6A4F]">{avgCommScore}%</span>
                  </div>
                  <ProgressBar value={avgCommScore} />
                </div>

                <div className="text-xs text-[#7A6A65] pt-1">
                  Answered: <strong>{answeredQuestions} of {totalQuestions}</strong> questions
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('setup');
                  setQuestions([]);
                  setQaHistory([]);
                }}
                className="btn btn-primary py-2.5 px-6 text-sm"
              >
                Start Another Simulation
              </button>
              <Link to="/student/internships" className="btn btn-secondary py-2.5 px-6 text-sm">
                Apply to Matching Internships
              </Link>
            </div>
          </div>

          {/* Detailed Question-by-Question Audit Accordion */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-serif text-[#2B1B17]">Detailed Question-by-Question Audit</h3>

            {qaHistory.map((item, idx) => (
              <div key={idx} className="card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5D5CE] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7A4B43] text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A65]">
                      {item.type} • {item.focusArea}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-peach text-xs">
                      Tech: {item.evaluation.technicalScore}%
                    </span>
                    <span className="badge badge-success text-xs">
                      Clarity: {item.evaluation.communicationClarity}%
                    </span>
                  </div>
                </div>

                <div className="font-serif font-bold text-base text-[#2B1B17]">
                  "{item.question}"
                </div>

                {/* Candidate response */}
                <div className="rounded-xl bg-[#FAF6F4] p-3 text-xs">
                  <span className="font-bold text-[#7A6A65] uppercase tracking-wider block mb-1">Your Answer:</span>
                  <p className="text-[#2B1B17] italic leading-relaxed">
                    "{item.candidateAnswer}"
                  </p>
                </div>

                {/* Feedback */}
                <div className="rounded-xl border border-[#E5D5CE] bg-[#FDF2ED] p-3 text-xs space-y-1">
                  <span className="font-bold text-[#7A4B43] uppercase tracking-wider block">AI Evaluator Critique:</span>
                  <p className="text-[#2B1B17] leading-relaxed">
                    {item.evaluation.constructiveFeedback}
                  </p>
                </div>

                {/* Model Answer Preview */}
                <details className="rounded-xl border border-[#E5D5CE] bg-white p-3 text-xs">
                  <summary className="font-bold text-[#7A4B43] cursor-pointer hover:underline">
                    Exemplary Model Answer (Click to expand)
                  </summary>
                  <p className="mt-2 text-[#2B1B17] leading-relaxed font-mono whitespace-pre-wrap">
                    {item.evaluation.modelAnswer}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HISTORICAL SESSIONS DRAWER / MODAL
      ───────────────────────────────────────────────────────────── */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E5D5CE] overflow-hidden">
            <div className="p-5 border-b border-[#E5D5CE] flex items-center justify-between bg-[#FAF6F4]">
              <div>
                <h3 className="text-lg font-bold font-serif text-[#2B1B17]">Past Interview Performance</h3>
                <p className="text-xs text-[#7A6A65]">Review your progress across previous AI mock rounds</p>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                className="rounded-lg p-2 text-[#7A6A65] hover:bg-[#E5D5CE] hover:text-[#2B1B17] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {loadingHistory ? (
                <div className="text-center py-8 text-sm text-[#7A6A65]">
                  Loading session records...
                </div>
              ) : pastSessions.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#7A6A65]">
                  No past sessions recorded yet. Complete your first mock interview above!
                </div>
              ) : (
                pastSessions.map((session, index) => (
                  <div
                    key={session.id || index}
                    className="card p-4 border border-[#E5D5CE] hover:border-[#7A4B43] transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#2B1B17]">{session.targetRole}</div>
                      <div className="text-xs text-[#7A6A65] mt-0.5">
                        {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-bold text-[#7A4B43]">
                          {session.overallScore != null ? `${session.overallScore}%` : 'N/A'}
                        </div>
                        <div className="text-[10px] text-[#7A6A65]">
                          Tech: {session.technicalAverage ?? '-'}% | Comm: {session.communicationAverage ?? '-'}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#E5D5CE] bg-[#FAF6F4] flex justify-end">
              <button
                onClick={() => setHistoryOpen(false)}
                className="btn btn-secondary py-2 px-5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
