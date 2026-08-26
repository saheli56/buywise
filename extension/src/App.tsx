import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  
  const availableAllergies = ["dairy", "peanut", "tree_nut", "gluten", "soy"];
  const availableDiets = ["vegan", "keto", "paleo"];

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['userProfile'], (result: any) => {
            if (result.userProfile) {
                setAllergies(result.userProfile.allergies || []);
                setDiets(result.userProfile.diets || []);
            }
        });
    }
  }, []);

  const saveProfile = (newAllergies: string[], newDiets: string[]) => {
    const profile = { allergies: newAllergies, diets: newDiets, goals: [] };
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ userProfile: profile });
    }
  };

  const toggleAllergy = (allergy: string) => {
    const updated = allergies.includes(allergy) ? allergies.filter(a => a !== allergy) : [...allergies, allergy];
    setAllergies(updated);
    saveProfile(updated, diets);
  };

  const toggleDiet = (diet: string) => {
    const updated = diets.includes(diet) ? diets.filter(d => d !== diet) : [...diets, diet];
    setDiets(updated);
    saveProfile(allergies, updated);
  };

  return (
    <div className="w-[380px] min-h-[480px] bg-[#0A0A0A] text-white font-sans antialiased overflow-hidden selection:bg-indigo-500/30">
      <div className="relative px-6 pt-8 pb-6 border-b border-white/5 bg-gradient-to-b from-indigo-500/10 to-transparent">
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white/90">Buywise</h1>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            Active
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <section>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Health Profile</h2>
          <div className="space-y-2">
            {availableAllergies.map(a => (
              <label key={a} className="group relative flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] cursor-pointer hover:bg-white/[0.06] transition-all duration-300">
                <span className="text-sm font-medium text-white/80 capitalize tracking-wide group-hover:text-white transition-colors">{a.replace("_", " ")}</span>
                <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out ${allergies.includes(a) ? 'bg-indigo-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out shadow-sm ${allergies.includes(a) ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <input type="checkbox" className="hidden" checked={allergies.includes(a)} onChange={() => toggleAllergy(a)} />
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Dietary Goals</h2>
          <div className="space-y-2">
            {availableDiets.map(d => (
              <label key={d} className="group relative flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] cursor-pointer hover:bg-white/[0.06] transition-all duration-300">
                <span className="text-sm font-medium text-white/80 capitalize tracking-wide group-hover:text-white transition-colors">{d}</span>
                <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out ${diets.includes(d) ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ease-in-out shadow-sm ${diets.includes(d) ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <input type="checkbox" className="hidden" checked={diets.includes(d)} onChange={() => toggleDiet(d)} />
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App;
