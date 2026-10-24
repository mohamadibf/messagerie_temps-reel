import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

interface LogoutConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirm = ({ onConfirm, onCancel }: LogoutConfirmProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl shadow-2xl shadow-primary/20 max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">Déconnexion</h3>
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};
