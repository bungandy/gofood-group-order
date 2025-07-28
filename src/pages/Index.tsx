import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, Share2, ShoppingBag, Utensils, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [merchants, setMerchants] = useState([{ name: "", link: "" }]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const addMerchant = () => {
    setMerchants([...merchants, { name: "", link: "" }]);
  };

  const removeMerchant = (index: number) => {
    if (merchants.length > 1) {
      setMerchants(merchants.filter((_, i) => i !== index));
    }
  };

  const updateMerchant = (index: number, field: "name" | "link", value: string) => {
    const updated = merchants.map((merchant, i) => 
      i === index ? { ...merchant, [field]: value } : merchant
    );
    setMerchants(updated);
  };

  const handleCreateSession = () => {
    // Validate that at least one merchant has both name and link
    const validMerchants = merchants.filter(m => m.name.trim() && m.link.trim());
    
    if (validMerchants.length === 0) {
      toast({
        title: "Form tidak lengkap",
        description: "Silakan isi minimal satu merchant dengan nama dan link GoFood",
        variant: "destructive",
      });
      return;
    }
    
    // Generate session ID and redirect to ordering page
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // Store session data in localStorage for demo purposes
    // In real app, this would be stored in backend/database
    localStorage.setItem(`session_${sessionId}`, JSON.stringify({
      merchants: validMerchants,
      sessionName: validMerchants.length === 1 ? validMerchants[0].name : `${validMerchants.length} Merchant`,
      createdAt: new Date().toISOString()
    }));
    
    toast({
      title: "Sesi pemesanan dibuat!",
      description: "Anda akan diarahkan ke halaman pemesanan",
    });
    
    // Navigate to ordering page
    setTimeout(() => {
      navigate(`/order/${sessionId}`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <div className="h-full w-full bg-gradient-to-br from-primary/5 to-transparent"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6 shadow-lg">
              <Utensils className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              GoFood Group Order
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Bikin acara makan bareng jadi lebih seru! Kumpulkan pesanan GoFood dari semua teman dengan mudah dan efisien.
            </p>
          </div>

          {/* How it Works */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Cara Kerja</h2>
              <p className="text-muted-foreground">Tiga langkah sederhana untuk memulai</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-4 p-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center border border-primary/20">
                      <PlusCircle className="w-7 h-7 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      1
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Buat Sesi</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      Tambahkan merchant GoFood favorit dan buat sesi pemesanan grup
                    </p>
                  </div>
                </div>
                {/* Connection line to next step */}
                <div className="hidden md:block absolute top-12 left-full w-8 h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-4 p-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-full flex items-center justify-center border border-secondary/20">
                      <Share2 className="w-7 h-7 text-secondary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      2
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Bagikan Link</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      Kirim link ke grup WhatsApp dan ajak teman untuk pesan bersama
                    </p>
                  </div>
                </div>
                {/* Connection line to next step */}
                <div className="hidden md:block absolute top-12 left-full w-8 h-px bg-gradient-to-r from-secondary/30 to-transparent"></div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-4 p-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-success/10 to-success/5 rounded-full flex items-center justify-center border border-success/20">
                      <ShoppingBag className="w-7 h-7 text-success" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      3
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Kumpulkan Order</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      Lihat ringkasan semua pesanan dan pesan langsung ke GoFood
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create Session Form */}
          <Card className="max-w-lg mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Buat Sesi Pemesanan
              </CardTitle>
              <CardDescription>
                Tambahkan satu atau lebih merchant GoFood untuk sesi grup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {merchants.map((merchant, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg bg-background/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Merchant {index + 1}
                    </Label>
                    {merchants.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMerchant(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Contoh: Warteg Bahari"
                      value={merchant.name}
                      onChange={(e) => updateMerchant(index, "name", e.target.value)}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="https://gofood.co.id/restaurant/..."
                      value={merchant.link}
                      onChange={(e) => updateMerchant(index, "link", e.target.value)}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addMerchant}
                className="w-full border-dashed border-primary/30 hover:border-primary hover:bg-primary/10 hover:scale-[1.02] transition-all duration-300 text-primary hover:text-primary"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Tambah Merchant
              </Button>
              
              <Button 
                onClick={handleCreateSession}
                className="w-full bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                size="lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Buat Sesi Pemesanan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;