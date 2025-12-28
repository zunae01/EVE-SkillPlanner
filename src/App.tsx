import { useEffect, useState } from 'react'
import { LayoutDashboard, LogIn, LogOut, Sliders } from 'lucide-react'
import { SkillBrowser } from './components/SkillBrowser'
import { SkillQueue } from './components/SkillQueue'
import { AttributesModal } from './components/AttributesModal'
import { PlanManager } from './components/PlanManager'
import { AuthCallback } from './components/AuthCallback'
import { useSkillStore } from './store/useSkillStore'
import { ESIService } from './lib/esi'
import { AuthService } from './lib/auth'

function App() {
  const { setAllSkills, user, logout } = useSkillStore();
  const [isCallback] = useState(window.location.pathname === '/callback');
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);

  useEffect(() => {
    if (!isCallback) {
      // Initialize DB only on main app
      ESIService.fetchAllSkills().then(skills => {
        setAllSkills(skills);
      });
    }
  }, [setAllSkills, isCallback]);

  if (isCallback) {
    return <AuthCallback />;
  }

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
          <div className="flex-1 max-w-2xl w-full flex items-center gap-2">
            <div className="flex-1 min-w-0">
                <PlanManager />
            </div>
            <button
                onClick={() => setIsAttrModalOpen(true)}
                className="h-12 w-12 flex items-center justify-center bg-card/50 backdrop-blur-md border border-white/5 rounded-lg text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors"
                title="Character Attributes"
            >
                <Sliders className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
             {user ? (
               <div className="flex items-center gap-3 bg-white/5 rounded-full pl-1 pr-3 py-1 border border-white/10">
                 <img 
                   src={`https://images.evetech.net/characters/${user.characterId}/portrait?size=64`} 
                   alt={user.characterName}
                   className="w-8 h-8 rounded-full border border-white/20"
                 />
                 <div className="text-sm">
                   <div className="font-medium leading-none">{user.characterName}</div>
                   <div className="text-[10px] text-green-400">Omega (Simulated)</div>
                 </div>
                 <button 
                   onClick={logout}
                   className="ml-2 p-1.5 hover:bg-white/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                   title="Logout"
                 >
                   <LogOut className="w-4 h-4" />
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => AuthService.initiateLogin()}
                 className="flex items-center gap-2 px-4 py-2 bg-[#F7D453] text-black font-bold rounded hover:bg-[#F7D453]/90 transition-colors text-sm"
               >
                 <LogIn className="w-4 h-4" />
                 Log in with EVE
               </button>
             )}
          </div>
        </header>
        
        <AttributesModal isOpen={isAttrModalOpen} onClose={() => setIsAttrModalOpen(false)} />

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