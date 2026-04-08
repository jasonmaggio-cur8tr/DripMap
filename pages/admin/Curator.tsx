import React, { useState } from 'react';
import * as curatorService from '../../services/curatorService';
import { useToast } from '../../context/ToastContext';

const Curator: React.FC = () => {
    const [city, setCity] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const { toast } = useToast();

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const handleRunScout = async () => {
        if (!city) {
            toast.error('Please enter a city name');
            return;
        }

        setIsRunning(true);
        setLogs([]);
        addLog(`Starting City Scout for ${city}...`);

        try {
            // 1. Create Run Record
            addLog('Initializing run record in database...');
            const run = await curatorService.createRun('CITY_SCOUT', { city });
            if (!run) throw new Error('Failed to create run');

            // 2. Search (Mock Gemini)
            addLog('Querying AI for top spots...');
            const results = await curatorService.searchGooglePlaces(city);
            addLog(`Found ${results.length} candidates.`);

            // 3. Process & Draft
            for (const place of results) {
                addLog(`Analyzing: ${place.name}...`);
                // Mock scoring
                const analysis = await curatorService.analyzeShopAesthetic(place.name, []);
                addLog(`Score: ${analysis.score}/100. Verdict: ${analysis.score > 70 ? 'DRAFTING' : 'SKIPPED'}`);

                if (analysis.score > 70) {
                    await curatorService.createDraft(run.id, place, analysis);
                }
            }

            // 4. Complete
            await curatorService.updateRunStatus(run.id, 'COMPLETED', { candidates_found: results.length, drafted: results.length, rejected: 0 });
            addLog('Run Complete! Check the Drafts Queue.');
            toast.success('Scout Run Complete!');
            setCity('');

        } catch (error: any) {
            addLog(`Error: ${error.message}`);
            toast.error('Run Failed');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm">
                <h2 className="text-xl font-bold text-coffee-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-robot text-volt-600"></i> Auto-Listing Curator
                </h2>
                <p className="text-coffee-600 mb-6">
                    Launch an AI Scout to find and draft coffee shops in a specific city.
                </p>

                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Enter City (e.g., Tokyo, Austin)..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="flex-1 bg-sand-50 border border-coffee-200 rounded-lg px-4 py-3 focus:outline-none focus:border-coffee-500 font-serif"
                        disabled={isRunning}
                    />
                    <button
                        onClick={handleRunScout}
                        disabled={isRunning}
                        className={`px-6 py-3 rounded-lg font-bold text-white transition-colors flex items-center gap-2 ${isRunning ? 'bg-coffee-400 cursor-not-allowed' : 'bg-coffee-900 hover:bg-black'}`}
                    >
                        {isRunning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-play"></i>}
                        {isRunning ? 'Scouting...' : 'Start Scout'}
                    </button>
                </div>
            </div>

            {/* Terminal / Logs */}
            <div className="bg-coffee-900 rounded-xl p-6 shadow-inset min-h-[300px] font-mono text-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-coffee-400 uppercase tracking-widest text-xs">System Logs</span>
                    <span className="text-volt-400 text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-volt-400 animate-pulse"></span>
                        {isRunning ? 'Active' : 'Idle'}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                    {logs.length === 0 ? (
                        <p className="text-coffee-600 italic">Ready to initialize...</p>
                    ) : (
                        logs.map((log, i) => (
                            <p key={i} className="text-coffee-100 border-l-2 border-coffee-700 pl-2">
                                {log}
                            </p>
                        ))
                    )}
                    {/* Scroll anchor */}
                    <div id="log-end"></div>
                </div>
            </div>
        </div>
    );
};

export default Curator;
