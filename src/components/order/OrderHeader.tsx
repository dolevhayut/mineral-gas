
import { AlertTriangle } from "lucide-react";

export default function OrderHeader() {
  return (
    <>
      <div className="text-center py-4 space-y-1">
        <h1 className="text-xl font-bold">הזמנת מוצרי מאפייה</h1>
        <p className="text-sm text-gray-600">ניתן להזמין עד השעה 00:00</p>
      </div>

      <div className="bg-amber-50 p-3 mb-4 rounded-md border border-amber-300">
        <div className="flex items-start gap-2">
          <p className="text-amber-700 text-sm">
            לחץ על מוצר כדי לבחור כמות רצויה עבור כל יום. בסיום הבחירה לחץ על "המשך לסיכום הזמנה"
          </p>
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
        </div>
      </div>
    </>
  );
}
