import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  targetDate: Date | undefined;
  setTargetDate: (date: Date | undefined) => void;
}

export default function DateSelector({ targetDate, setTargetDate }: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleDateSelect = (date: Date | undefined) => {
    console.log("DateSelector: Date selected:", date);
    setTargetDate(date);
    setIsOpen(false); // סגירת הפופאובר אחרי בחירת תאריך
  };

  const handleOpenChange = (open: boolean) => {
    console.log("DateSelector: Popover open state:", open);
    setIsOpen(open);
  };

  return (
    <div className="w-full flex justify-end">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-right",
              !targetDate && "text-muted-foreground"
            )}
            onClick={() => {
              console.log("DateSelector: Button clicked");
              setIsOpen(!isOpen);
            }}
          >
            {targetDate ? format(targetDate, "dd/MM/yyyy") : "בחר תאריך יעד"}
            <CalendarIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={targetDate}
            onSelect={handleDateSelect}
            initialFocus
            className={cn("p-3")}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isDisabled = date < today;
              console.log("DateSelector: Date check:", date, "disabled:", isDisabled);
              return isDisabled;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
