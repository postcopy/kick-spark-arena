import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MatchState, MatchSide } from '@/types/championship';
import { Plus, Minus } from 'lucide-react';

interface ScoreAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: MatchState;
  onAdjust: (side: MatchSide, roundScore: number, gamjeom: number) => void;
}

export function ScoreAdjustDialog({ open, onOpenChange, state, onAdjust }: ScoreAdjustDialogProps) {
  const [blueScore, setBlueScore] = useState(state.roundScoreBlue);
  const [blueGamjeom, setBlueGamjeom] = useState(state.gamjeomBlue);
  const [redScore, setRedScore] = useState(state.roundScoreRed);
  const [redGamjeom, setRedGamjeom] = useState(state.gamjeomRed);
  
  // Reset values when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setBlueScore(state.roundScoreBlue);
      setBlueGamjeom(state.gamjeomBlue);
      setRedScore(state.roundScoreRed);
      setRedGamjeom(state.gamjeomRed);
    }
    onOpenChange(open);
  };
  
  const handleSave = () => {
    if (blueScore !== state.roundScoreBlue || blueGamjeom !== state.gamjeomBlue) {
      onAdjust('BLUE', blueScore, blueGamjeom);
    }
    if (redScore !== state.roundScoreRed || redGamjeom !== state.gamjeomRed) {
      onAdjust('RED', redScore, redGamjeom);
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Alterar Placar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Blue */}
          <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-500/30">
            <h4 className="text-blue-400 font-bold mb-3">AZUL (CHUNG)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs">Pontuação</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setBlueScore(Math.max(0, blueScore - 1))}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={blueScore}
                    onChange={(e) => setBlueScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-8 w-16 text-center bg-zinc-800 border-zinc-600 text-white"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setBlueScore(blueScore + 1)}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Gam-jeom</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setBlueGamjeom(Math.max(0, blueGamjeom - 1))}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={blueGamjeom}
                    onChange={(e) => setBlueGamjeom(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-8 w-16 text-center bg-zinc-800 border-zinc-600 text-white"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setBlueGamjeom(blueGamjeom + 1)}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Red */}
          <div className="p-4 rounded-lg bg-red-600/10 border border-red-500/30">
            <h4 className="text-red-400 font-bold mb-3">VERMELHO (HONG)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 text-xs">Pontuação</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setRedScore(Math.max(0, redScore - 1))}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={redScore}
                    onChange={(e) => setRedScore(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-8 w-16 text-center bg-zinc-800 border-zinc-600 text-white"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setRedScore(redScore + 1)}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Gam-jeom</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setRedGamjeom(Math.max(0, redGamjeom - 1))}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={redGamjeom}
                    onChange={(e) => setRedGamjeom(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-8 w-16 text-center bg-zinc-800 border-zinc-600 text-white"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setRedGamjeom(redGamjeom + 1)}
                    className="h-8 w-8 border-zinc-600"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-600 text-zinc-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
