'use client';
import { Users, Download, ExternalLink } from 'lucide-react';

export default function Home() {
  // HIER DEINE LINKS EINFÜGEN
  const googleGroupLink = "https://groups.google.com/g/oneoff-tester"; 
  const androidLink = "https://play.google.com/store/apps/details?id=com.musicimposter.app"; 

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full shadow-lg shadow-purple-500/30">
            <Users className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Werde Beta-Tester
          </h1>
          <p className="text-slate-300 text-sm">
            Teste die neuesten Features von <strong>OneOff</strong> vor allen anderen und hilf uns, das Spiel besser zu machen!
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Step 1 */}
          <div className="bg-slate-700/50 p-4 rounded-xl text-left space-y-3 border border-slate-600/50 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="bg-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <h3 className="font-bold text-white">Gruppe beitreten</h3>
            </div>
            <p className="text-xs text-slate-400 pl-9">
              Tritt der Google Group bei, um für den Test freigeschaltet zu werden.
            </p>
            <a 
              href={googleGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-9 block py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all text-center shadow-lg hover:shadow-blue-500/25"
            >
              Google Group beitreten
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-700/50 p-4 rounded-xl text-left space-y-3 border border-slate-600/50 hover:border-green-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="bg-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <h3 className="font-bold text-white">App laden</h3>
            </div>
            <p className="text-xs text-slate-400 pl-9">
              Lade die App über den Play Store (Testing Track) herunter.
            </p>
            <a 
              href={androidLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-9 block py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-all text-center shadow-lg hover:shadow-green-500/25"
            >
              Im Play Store laden
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-500 pt-2">
          Danke für deine Unterstützung! ❤️
        </p>
      </div>
    </main>
  );
}
