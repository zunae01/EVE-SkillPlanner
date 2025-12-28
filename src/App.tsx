import { useEffect } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { SkillBrowser } from './components/SkillBrowser'
import { SkillQueue } from './components/SkillQueue'
import { AttributesPanel } from './components/AttributesPanel'
import { PlanManager } from './components/PlanManager'
import { useSkillStore } from './store/useSkillStore'
import { ESIService } from './lib/esi'
import { cn } from './lib/utils'

function App() {
  const { setAllSkills } = useSkillStore();

  useEffect(() => {
    // Initialize DB
    ESIService.fetchAllSkills().then(skills => {
      setAllSkills(skills);
    });
  }, [setAllSkills]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black text-foreground p-4 md:p-8 font-sans selection:bg-primary/20 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-100 to-cyan-300 bg-clip-text text-transparent">
                NEOCOM Planner
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">
                Skill Training Strategy V
              </p>
            </div>
          </div>
          
          {/* Plan Manager Toolbar */}
          <div className="flex-1 max-w-2xl w-full">
            <PlanManager />
          </div>

          <div className="hidden md:flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 opacity-80" />
          </div>
        </header>
        
        {/* Top Stats / Attributes */}
        <section>
          <AttributesPanel />
        </section>

        {/* Main Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Left Column: Browser (Now Full Height) */}
          <section className="lg:col-span-5 h-full flex flex-col">
            <SkillBrowser />
          </section>
          
          {/* Right Column: Queue */}
          <section className="lg:col-span-7 h-full flex flex-col">
            <SkillQueue />
          </section>
        </main>
      </div>
    </div>
  )
}

export default App