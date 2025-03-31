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

export default function Settings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "הגדרות נשמרו",
      description: "ההגדרות עודכנו בהצלחה",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות מערכת</h1>
        <p className="text-muted-foreground">נהל את הגדרות המערכת</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>הגדרות חנות</CardTitle>
            <CardDescription>הגדרות כלליות של החנות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="store-name">שם החנות</Label>
              <Input id="store-name" defaultValue="מאפיית אורבר" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-description">תיאור החנות</Label>
              <Input id="store-description" defaultValue="קונדיטוריה מתוקה" />
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
            <CardTitle>הגדרות הזמנות</CardTitle>
            <CardDescription>הגדרות הקשורות להזמנות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          <CardHeader>
            <CardTitle>הגדרות התראות</CardTitle>
            <CardDescription>הגדרות התראות ועדכונים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
          <Button onClick={handleSave}>שמור הגדרות</Button>
        </div>
      </div>
    </div>
  );
} 