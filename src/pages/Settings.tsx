
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { UserIcon } from "lucide-react";

const Settings = () => {
  const { isAuthenticated, user, updateUserProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
  }, [user]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Call the updateUserProfile function from AuthContext
      await updateUserProfile({ name: fullName });
      
      toast({
        title: "הגדרות נשמרו",
        description: "הפרטים האישיים שלך עודכנו בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לעדכן את הפרטים. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-right">הגדרות משתמש</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-right">פרטים אישיים</CardTitle>
              </div>
              <CardDescription className="text-right">
                עדכן את הפרטים האישיים שלך כאן
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Label htmlFor="fullName">שם מלא</Label>
                  </div>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-right"
                    placeholder="הזן את שמך המלא"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-bakery-600 hover:bg-bakery-700"
                  disabled={isLoading}
                >
                  {isLoading ? "מעדכן..." : "שמור שינויים"}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          {/* Additional settings cards could be added here in the future */}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
