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

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-3 group-hover:bg-primary/20 transition-colors">
                  <PlusCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Buat Sesi</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Pilih merchant GoFood dan buat sesi pemesanan grup baru
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-xl mb-3 group-hover:bg-secondary/20 transition-colors">
                  <Share2 className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Bagikan Link</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Kirim link pemesanan ke grup WhatsApp Anda
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-xl mb-3 group-hover:bg-success/20 transition-colors">
                  <ShoppingBag className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-lg">Kumpulkan Order</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Lihat semua pesanan dan pesan langsung ke GoFood
                </CardDescription>
              </CardContent>
            </Card>
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