import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, Share2, ShoppingBag, Utensils, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
              Buat halaman pemesanan grup untuk merchant GoFood favorit. Bagikan ke WhatsApp dan kumpulkan pesanan dengan mudah!
            </p>
          </div>

          {/* How it Works */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Cara Kerja</h2>
              <p className="text-muted-foreground">Tiga langkah mudah untuk memulai grup order</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary via-secondary to-success opacity-20"></div>
              
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  1
                </div>
                <Card className="relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-6 text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-4 shadow-lg group-hover:shadow-primary/25 transition-shadow duration-500">
                      <PlusCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Buat Sesi</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Tambahkan merchant GoFood favorit dan buat sesi pemesanan grup baru
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  2
                </div>
                <Card className="relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-6 text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl mb-4 shadow-lg group-hover:shadow-secondary/25 transition-shadow duration-500">
                      <Share2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Bagikan Link</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Kirim link ke grup WhatsApp dan ajak teman untuk pesan bersama
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-success rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  3
                </div>
                <Card className="relative overflow-hidden border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-6 text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-success to-success/80 rounded-2xl mb-4 shadow-lg group-hover:shadow-success/25 transition-shadow duration-500">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Kumpulkan Order</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Lihat ringkasan semua pesanan dan pesan langsung ke GoFood
                    </p>
                  </CardContent>
                </Card>
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
    </div>
  );
};

export default Index;