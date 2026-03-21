import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  BookOpen, 
  CheckSquare, 
  BarChart3, 
  Calendar,
  Heart,
  ChevronRight,
  Star,
  Clock,
  Target,
  Timer,
  ArrowRight
} from "lucide-react";

const HeroOrb = lazy(() => import("@/components/HeroOrb"));

const FeatureCard = ({ icon: Icon, title, description, href, gradient, iconColor, iconBg }) => (
  <Link
    to={href}
    className="group relative overflow-hidden rounded-2xl bg-card/50 border border-border/50 p-6 hover:bg-card/80 w-full h-full block feature-card-hover"
    aria-label={`Navigate to ${title} - ${description}`}
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`} aria-hidden="true" />
    <div className="relative z-10 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg} transition-all duration-300`} aria-hidden="true">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed flex-grow">
        {description}
      </p>
    </div>
  </Link>
);

const StatCard = ({ icon: Icon, value, label, iconColor, iconBg }) => (
  <div className="bg-card/30 border border-border/50 rounded-xl p-4 hover:bg-card/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02]" role="region" aria-label={`${label}: ${value}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBg} transition-transform duration-300 hover:scale-110`} aria-hidden="true">
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold" aria-label={value}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

const Index = () => {
  const { currentUser } = useUser();

  // If user is not logged in, show hero with 3D orb
  if (!currentUser) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl bg-gradient-to-br from-primary/40 to-purple-500/30 dark:from-primary/25 dark:to-purple-500/20 animate-float-slow" />
          <div className="absolute bottom-[-6rem] right-[-6rem] w-[28rem] h-[28rem] rounded-full blur-3xl bg-gradient-to-br from-cyan-400/30 to-teal-500/30 dark:from-cyan-400/20 dark:to-teal-500/20 animate-float-slower" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl bg-gradient-to-br from-amber-400/20 to-pink-500/20 dark:from-amber-400/10 dark:to-pink-500/10 animate-float-slowest" />
        </div>

        {/* Top bar */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold">S</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">Sentience</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/login" className="hub-button">Sign in</Link>
            </div>
          </div>
        </div>

        {/* Hero — two column */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-8 md:mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">

            {/* Left: text */}
            <div className="flex flex-col gap-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium w-fit">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Student Productivity Hub
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Think clearly.<br />
                <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                  Study smarter.
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Track your studies, tasks, mood, and focus — all in one place. Built for students who want to perform at their best.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to="/signup"
                  className="hub-button group relative overflow-hidden transition-all duration-300 hover:scale-[1.03] px-6 py-2.5"
                >
                  <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 bg-gradient-to-r from-primary to-purple-500 blur-xl transition-opacity duration-300" />
                  <span className="relative flex items-center gap-2">
                    Get started
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="hub-button-outline px-5 py-2.5 rounded-md border border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] text-sm font-medium"
                >
                  Sign in
                </Link>
              </div>

              {/* Mini feature pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                {['Notes Hub', 'Focus Mode', 'Mood Tracker', 'Analytics'].map((f) => (
                  <span key={f} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border/50">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: 3D orb */}
            <div className="relative flex items-center justify-center h-[420px] lg:h-[540px] animate-fade-in-scale">
              {/* Glow halo — visible in both light and dark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 rounded-full bg-indigo-500/30 dark:bg-indigo-500/20 blur-[70px]" />
              </div>
              <Suspense fallback={
                <div className="w-48 h-48 rounded-full bg-primary/10 border border-primary/20 animate-pulse" />
              }>
                <HeroOrb />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in experience (dashboard)
  const features = [
    {
      icon: BookOpen,
      title: "Notes Hub",
      description: "Create, share, and collaborate on notes with other students. Build a knowledge base together.",
      href: "/notes",
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-500",
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-500/15"
    },
    {
      icon: Calendar,
      title: "Study Planner",
      description: "Plan your study sessions, set goals, and track your progress with detailed analytics.",
      href: "/study-planner",
      gradient: "bg-gradient-to-br from-purple-500 to-violet-500",
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-100 dark:bg-violet-500/15"
    },
    {
      icon: CheckSquare,
      title: "Task Tracker",
      description: "Organize your academic tasks, set deadlines, and track completion with smart reminders.",
      href: "/tasks",
      gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/15"
    },
    {
      icon: Timer,
      title: "Focus Mode",
      description: "Stay focused with Pomodoro technique, ambient sounds, and distraction blocking.",
      href: "/focus",
      gradient: "bg-gradient-to-br from-orange-500 to-red-500",
      iconColor: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-100 dark:bg-orange-500/15"
    },
    {
      icon: Heart,
      title: "Mood Tracker",
      description: "Monitor your mental well-being and track patterns to maintain a healthy study-life balance.",
      href: "/mood",
      gradient: "bg-gradient-to-br from-pink-500 to-rose-500",
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-100 dark:bg-rose-500/15"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Get insights into your study habits, productivity patterns, and academic performance.",
      href: "/analytics",
      gradient: "bg-gradient-to-br from-teal-500 to-cyan-500",
      iconColor: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-100 dark:bg-teal-500/15"
    },
  ];

  const stats = [
    { icon: Target, value: "Welcome", label: `Hi, ${currentUser.name.split(' ')[0]}`, iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-500/15" },
    { icon: Clock, value: "—", label: "Keep up the great work!", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-500/15" },
    { icon: Star, value: "—", label: "Tip: Try Focus Mode", iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-500/15" },
    { icon: BookOpen, value: "—", label: "Add a new note today", iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-500/15" }
  ];

  return (
    <div className="page-container">
      {/* Welcome */}
      <header className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Quick links and stats to help you get started.</p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <StatCard key={i} icon={s.icon} value={s.value} label={s.label} iconColor={s.iconColor} iconBg={s.iconBg} />
        ))}
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} href={f.href} gradient={f.gradient} iconColor={f.iconColor} iconBg={f.iconBg} />)
        )}
      </section>
    </div>
  );
};

export default Index;