import { useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Athlete } from '@/types/game';

const BELT_OPTIONS = [
  { value: 'branca', label: 'Branca' },
  { value: 'amarela', label: 'Amarela' },
  { value: 'laranja', label: 'Laranja' },
  { value: 'verde', label: 'Verde' },
  { value: 'roxa', label: 'Roxa' },
  { value: 'marrom', label: 'Marrom' },
  { value: 'preta', label: 'Preta' },
  { value: 'vermelha', label: 'Vermelha' },
];

const CATEGORY_OPTIONS = [
  { value: 'mirim', label: 'Mirim (4-6 anos)' },
  { value: 'infantil', label: 'Infantil (7-10 anos)' },
  { value: 'infanto-juvenil', label: 'Infanto-Juvenil (11-14 anos)' },
  { value: 'juvenil', label: 'Juvenil (15-17 anos)' },
  { value: 'adulto', label: 'Adulto (18+)' },
  { value: 'master', label: 'Master (35+)' },
];

interface AddAthleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAthleteAdded: (athlete: Athlete) => void;
}

export function AddAthleteDialog({ open, onOpenChange, onAthleteAdded }: AddAthleteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [belt, setBelt] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from('athletes')
      .insert({
        academy_id: user.id,
        name: name.trim(),
        nickname: nickname.trim() || null,
        belt: belt || null,
        category: category || null,
      })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Atleta cadastrado!',
      description: `${data.name} foi adicionado com sucesso.`,
    });

    // Convert to Athlete type
    const newAthlete: Athlete = {
      id: data.id,
      name: data.name,
      nickname: data.nickname || undefined,
      belt: data.belt || undefined,
      category: data.category || undefined,
      avatarUrl: data.avatar_url || undefined,
      isActive: data.is_active ?? true,
    };

    onAthleteAdded(newAthlete);

    // Reset form
    setName('');
    setNickname('');
    setBelt('');
    setCategory('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-game-yellow" />
            Novo Atleta
          </DialogTitle>
          <DialogDescription>
            Cadastre um novo atleta para participar do ranking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido</Label>
            <Input
              id="nickname"
              placeholder="Opcional"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faixa</Label>
              <Select value={belt} onValueChange={setBelt}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BELT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
