import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ImageIcon, XIcon, Loader2Icon, Construction } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("/assets/logo.png");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [vatPercentage, setVatPercentage] = useState(18);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("/assets/logo.png");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    setIsLoading(true);
    
    // כאן תהיה הלוגיקה לשמירת הלוגו החדש לשרת
    // לדוגמה, באמצעות Supabase Storage
    
    // סימולציה של העלאת קובץ
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "הגדרות נשמרו",
        description: "ההגדרות עודכנו בהצלחה",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות מערכת</h1>
        <p className="text-muted-foreground">נהל את הגדרות המערכת</p>
      </div>

      <Alert className="bg-yellow-50 border-yellow-200">
        <Construction className="h-4 w-4 ml-2" />
        <AlertDescription>
          עמוד זה נמצא בפיתוח. השינויים אינם נשמרים במסד הנתונים בשלב זה.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>הגדרות חנות</CardTitle>
            <CardDescription>הגדרות כלליות של החנות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="store-name">שם החנות</Label>
              <Input id="store-name" defaultValue="מינרל גז" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-description">תיאור החנות</Label>
              <Input id="store-description" defaultValue="אספקת גז ביתי" />
            </div>
            <div className="space-y-2">
              <Label>לוגו החנות</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-32 w-32 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="לוגו" 
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-100">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto"
                    >
                      בחר לוגו חדש
                    </Button>
                  </div>
                  {logoFile && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="w-full sm:w-auto"
                    >
                      <XIcon className="h-4 w-4 ml-2" />
                      הסר לוגו חדש
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    מומלץ להעלות תמונה בגודל 200x200 פיקסלים או יותר, בפורמט PNG עם רקע שקוף
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">מטבע</Label>
              <Select defaultValue="ILS">
                <SelectTrigger id="currency">
                  <SelectValue placeholder="בחר מטבע" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">₪ שקל חדש</SelectItem>
                  <SelectItem value="USD">$ דולר אמריקאי</SelectItem>
                  <SelectItem value="EUR">€ אירו</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הגדרות מס</CardTitle>
            <CardDescription>הגדרות מע"מ ומיסים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vat-percentage">אחוז מע"מ</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="vat-percentage" 
                  type="number" 
                  value={vatPercentage}
                  onChange={(e) => setVatPercentage(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                אחוז המע"מ הנוכחי בישראל הוא 17%
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>הצג פירוט מע"מ בהזמנות</Label>
                <p className="text-sm text-muted-foreground">
                  הצג את סכום המע"מ בנפרד בסיכום ההזמנה
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="relative">
            <div className="absolute right-0 top-0 w-full h-full bg-gray-100/50 flex items-center justify-center z-10 rounded-t-lg">
              <div className="bg-yellow-100 px-4 py-2 rounded-md flex items-center">
                <Construction className="h-4 w-4 ml-2" />
                <span>בפיתוח</span>
              </div>
            </div>
            <CardTitle>הגדרות הזמנות</CardTitle>
            <CardDescription>הגדרות הקשורות להזמנות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <div className="absolute right-0 top-0 w-full h-full bg-gray-100/50 z-10 rounded-b-lg"></div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>אפשר הזמנות</Label>
                <p className="text-sm text-muted-foreground">
                  האם לאפשר ללקוחות להזמין מוצרים
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>דרוש אימות טלפון</Label>
                <p className="text-sm text-muted-foreground">
                  האם לדרוש אימות טלפון בעת הזמנה
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-order">סכום מינימום להזמנה</Label>
              <Input id="min-order" type="number" defaultValue="100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="relative">
            <div className="absolute right-0 top-0 w-full h-full bg-gray-100/50 flex items-center justify-center z-10 rounded-t-lg">
              <div className="bg-yellow-100 px-4 py-2 rounded-md flex items-center">
                <Construction className="h-4 w-4 ml-2" />
                <span>בפיתוח</span>
              </div>
            </div>
            <CardTitle>הגדרות התראות</CardTitle>
            <CardDescription>הגדרות התראות ועדכונים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <div className="absolute right-0 top-0 w-full h-full bg-gray-100/50 z-10 rounded-b-lg"></div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>התראות SMS</Label>
                <p className="text-sm text-muted-foreground">
                  שלח התראות SMS ללקוחות
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>התראות WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  שלח התראות WhatsApp ללקוחות
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>התראות מערכת</Label>
                <p className="text-sm text-muted-foreground">
                  הצג התראות מערכת למנהלים
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
            שמור הגדרות
          </Button>
        </div>
      </div>
    </div>
  );
} 