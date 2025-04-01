import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2Icon, User as UserIcon, Phone, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import MainLayoutWithFooter from "@/components/MainLayoutWithFooter";

export default function UserSettings() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsLoading(true);
    
    // כאן תהיה הלוגיקה לשמירת המידע לשרת
    
    // סימולציה של שמירת נתונים
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "הגדרות נשמרו",
        description: "פרטי החשבון עודכנו בהצלחה",
      });
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <MainLayoutWithFooter>
      <div className="container py-8 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">הגדרות חשבון</h1>
            <p className="text-muted-foreground">ניהול פרטי החשבון שלך</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>פרטים אישיים</CardTitle>
                <CardDescription>עדכן את פרטי החשבון שלך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <div className="relative">
                    <Input 
                      id="name" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10" 
                    />
                    <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">מספר טלפון</Label>
                  <div className="relative">
                    <Input 
                      id="phone" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10" 
                    />
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
                  שמור שינויים
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-red-100">
              <CardHeader>
                <CardTitle className="text-red-600">התנתקות</CardTitle>
                <CardDescription>התנתק מהחשבון שלך</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  לחץ על הכפתור למטה כדי להתנתק מהחשבון שלך. תצטרך להתחבר שוב כדי לגשת לחשבון שלך.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto flex items-center justify-center"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  התנתקות
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayoutWithFooter>
  );
} 