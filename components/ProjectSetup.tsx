import React, { useState } from 'react';
import { Project, ProjectUnit } from '../types';
import { Plus, Trash2, ArrowRight, Save } from 'lucide-react';

interface ProjectSetupProps {
  onSave: (project: Project) => void;
}

const ProjectSetup: React.FC<ProjectSetupProps> = ({ onSave }) => {
  const [name, setName] = useState('My Practice Project');
  const [unitCount, setUnitCount] = useState(10);
  const [defaultCount, setDefaultCount] = useState(20);
  const [step, setStep] = useState(1);
  
  // Staging state for units
  const [units, setUnits] = useState<ProjectUnit[]>([]);

  const handleGenerateStructure = () => {
    const newUnits: ProjectUnit[] = Array.from({ length: unitCount }).map((_, i) => ({
      id: `u${i + 1}`,
      name: `${i + 1}`,
      count: defaultCount,
    }));
    setUnits(newUnits);
    setStep(2);
  };

  const handleUnitCountChange = (index: number, val: string) => {
    const num = parseInt(val, 10) || 0;
    const newUnits = [...units];
    newUnits[index].count = num;
    setUnits(newUnits);
  };

  const handleSave = () => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      units
    };
    onSave(project);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Welcome to DotTrack</h1>
        <p className="text-gray-600">Let's set up your practice structure. You only need to do this once.</p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Calculus 101, GRE Math"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
              <input 
                type="number" 
                value={unitCount}
                onChange={(e) => setUnitCount(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Questions / Unit</label>
              <input 
                type="number" 
                value={defaultCount}
                onChange={(e) => setDefaultCount(parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <button 
            onClick={handleGenerateStructure}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
          >
            Next: Customize Structure <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Fine-tune Structure</h2>
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 underline">Back</button>
           </div>
           
           <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
             {units.map((u, idx) => (
               <div key={u.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                 <div className="w-16 font-mono text-gray-500 font-bold">U-{u.name}</div>
                 <div className="flex-1">
                    <label className="text-xs text-gray-400 block">Question Count</label>
                    <input 
                      type="number"
                      value={u.count}
                      onChange={(e) => handleUnitCountChange(idx, e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1"
                    />
                 </div>
               </div>
             ))}
           </div>

           <button 
            onClick={handleSave}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            Create Project <Save size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectSetup;