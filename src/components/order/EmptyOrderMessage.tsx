
import { AlertCircle } from "lucide-react";

export default function EmptyOrderMessage() {
  return (
    <div className="text-center py-4 space-y-2">
      <AlertCircle className="h-10 w-10 mx-auto text-amber-500" />
      <p className="text-center text-gray-500 font-medium">לא נבחרו פריטים להזמנה</p>
      <p className="text-sm text-muted-foreground">נא לבחור לפחות מוצר אחד להזמנה</p>
    </div>
  );
}
