
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
  return (
    <div className="w-full flex justify-end">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-right",
              !targetDate && "text-muted-foreground"
            )}
          >
            {targetDate ? format(targetDate, "dd/MM/yyyy") : "בחר תאריך יעד"}
            <CalendarIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={targetDate}
            onSelect={setTargetDate}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            disabled={(date) => date < new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
