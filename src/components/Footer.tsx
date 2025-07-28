import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border/50 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Dibuat dengan</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>untuk memudahkan grup order</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            © 2024 GoFood Grup Order
          </div>
        </div>
      </div>
    </footer>
  );
};