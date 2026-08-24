import React, { useState, useEffect } from 'react';
import './index.css'; // Import Tailwind

function App() {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  
  const availableAllergies = ["dairy", "peanut", "tree_nut", "gluten", "soy"];
  const availableDiets = ["vegan", "keto", "paleo"];

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['userProfile'], (result) => {
            if (result.userProfile) {
                setAllergies(result.userProfile.allergies || []);
                setDiets(result.userProfile.diets || []);
                setGoals(result.userProfile.goals || []);
            }
        });
    }
  }, []);

  const saveProfile = (newAllergies: string[], newDiets: string[], newGoals: string[]) => {
    const profile = { allergies: newAllergies, diets: newDiets, goals: newGoals };
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ userProfile: profile });
    }
  };

  const toggleAllergy = (allergy: string) => {
    const updated = allergies.includes(allergy) ? allergies.filter(a => a !== allergy) : [...allergies, allergy];
    setAllergies(updated);
    saveProfile(updated, diets, goals);
  };

  const toggleDiet = (diet: string) => {
    const updated = diets.includes(diet) ? diets.filter(d => d !== diet) : [...diets, diet];
    setDiets(updated);
    saveProfile(allergies, updated, goals);
  };

  return (
    <div className="w-[350px] min-h-[400px] bg-slate-50 text-slate-800 font-sans shadow-lg">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Buywise</h1>
        <span className="text-xs bg-emerald-500 px-2 py-1 rounded-full font-medium shadow-inner">Smart Assistant</span>
      </div>

      <div className="p-5 space-y-6">
        {/* Allergies Section */}
        <section>
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Allergies & Intolerances</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableAllergies.map(a => (
              <label key={a} className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-all ${allergies.includes(a) ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                  checked={allergies.includes(a)} 
                  onChange={() => toggleAllergy(a)} 
                />
                <span className="text-sm font-medium capitalize">{a.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Diets Section */}
        <section>
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Dietary Preferences</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableDiets.map(d => (
              <label key={d} className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${diets.includes(d) ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  checked={diets.includes(d)} 
                  onChange={() => toggleDiet(d)} 
                />
                <span className="text-sm font-medium capitalize">{d}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-100 p-4 border-t border-slate-200 text-xs text-slate-500 flex items-start space-x-2">
        <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p>Your preferences are saved locally. Visit an Amazon grocery product to see Buywise in action.</p>
      </div>
    </div>
  )
}

export default App;
