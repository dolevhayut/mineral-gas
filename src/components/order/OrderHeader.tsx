import { AlertTriangle } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export default function OrderHeader() {
  const { getSetting } = useSystemSettings();
  const openTime = getSetting('order_open_time', '06:00');
  const cutoffTime = getSetting('order_cutoff_time', '02:00');
  
  // בדיקה אם אנחנו בשעות הלילה המיוחדות (00:00-02:00)
  const now = new Date();
  const currentHour = now.getHours();
  const isNightHours = currentHour >= 0 && currentHour < 2;
  
  return (
    <>
      <div className="text-center py-4 space-y-1">
        <h1 className="text-xl font-bold">הזמנת מוצרי גז</h1>
        <p className="text-sm text-gray-600">
          בחר את המוצרים הרצויים ותאריכי המשלוח
        </p>
      </div>
    </>
  );
}
