export function OctagonBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Octagon pattern */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-10" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        {/* Center octagon */}
        <polygon 
          points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.3"
          className="text-white"
        />
        {/* Inner octagon */}
        <polygon 
          points="35,15 65,15 85,35 85,65 65,85 35,85 15,65 15,35" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.2"
          className="text-white"
        />
        {/* Center lines */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.15" className="text-white" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.15" className="text-white" />
        {/* Diagonal lines */}
        <line x1="30" y1="5" x2="70" y2="95" stroke="currentColor" strokeWidth="0.1" className="text-white" />
        <line x1="70" y1="5" x2="30" y2="95" stroke="currentColor" strokeWidth="0.1" className="text-white" />
      </svg>
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-red-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-32 bg-blue-500/5 blur-3xl" />
    </div>
  );
}
