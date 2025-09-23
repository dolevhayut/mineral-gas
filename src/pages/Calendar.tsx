import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package2 as PackageIcon, CircleDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  orders: OrderLineItem[];
}

interface OrdersByDate {
  [dateKey: string]: OrderLineItem[];
}

type ViewType = 'daily' | 'weekly' | 'monthly';

const Calendar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all | Open | Closed | Canceled
  const [orders, setOrders] = useState<OrderLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersByDate, setOrdersByDate] = useState<OrdersByDate>({});
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Hebrew month names
  const hebrewMonths = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];

  // Hebrew day names
  const hebrewDays = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
  const hebrewFullDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  // Load orders for the current date range based on view type
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        
        // Calculate date range based on view type
        let startDate: Date, endDate: Date;
        
        if (viewType === 'daily') {
          startDate = new Date(currentDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(currentDate);
          endDate.setHours(23, 59, 59, 999);
        } else if (viewType === 'weekly') {
          // Get start of week (Sunday)
          startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - currentDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          // Get end of week (Saturday)
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Monthly view - extend range for better performance
          startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
          endDate = new Date(currentDate.getFullYear() + 1, 11, 31);
        }
        
        console.log(`Fetching orders for ${viewType} view from ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        // Convert status filter to the correct type
        const orderStatus = statusFilter === "all" ? undefined : statusFilter as 'Open' | 'Closed' | 'Canceled';
        const orderItems = await getOpenOrders(startDate, endDate, orderStatus);
        
        if (orderItems && orderItems.length > 0) {
          setOrders(orderItems);
          
          // Group orders by date
          const groupedOrders: OrdersByDate = {};
          orderItems.forEach(order => {
            // Fix date format if needed
            let fixedDate = order.dueDate;
            if (fixedDate.startsWith('0')) {
              fixedDate = fixedDate.substring(1);
            }
            
            // Parse the date and create a normalized date key
            try {
              const parts = fixedDate.split('-').map(Number);
              const date = new Date(parts[0], parts[1] - 1, parts[2]);
              
              // Ensure valid date
              if (!isNaN(date.getTime())) {
                const dateKey = date.toISOString().split('T')[0];
                
                if (!groupedOrders[dateKey]) {
                  groupedOrders[dateKey] = [];
                }
                groupedOrders[dateKey].push(order);
              } else {
                console.warn(`Invalid date format for order ${order.docEntry}: ${order.dueDate}`);
              }
            } catch (error) {
              console.warn(`Error parsing date for order ${order.docEntry}: ${order.dueDate}`, error);
            }
          });
          
          setOrdersByDate(groupedOrders);
          console.log(`Calendar: Loaded ${orderItems.length} orders`, groupedOrders);
        } else {
          setOrders([]);
          setOrdersByDate({});
        }
      } catch (error) {
        console.error("Error fetching orders for calendar:", error);
        toast({
          title: "שגיאה בטעינת ההזמנות",
          description: "אירעה שגיאה בטעינת ההזמנות עבור היומן",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentDate, viewType, statusFilter]);

  // Generate calendar days based on view type
  const generateCalendarDays = (isMobile: boolean = false): CalendarDay[] => {
    if (isMobile) {
      // Mobile: Show only 3 days (today + 2 next days)
      const days: CalendarDay[] = [];
      const today = new Date();
      
      for (let i = 0; i < 3; i++) {
        const currentDay = new Date(today);
        currentDay.setDate(today.getDate() + i);
        
        const dateKey = currentDay.toISOString().split('T')[0];
        const dayOrders = ordersByDate[dateKey] || [];
        
        days.push({
          date: new Date(currentDay),
          isCurrentMonth: true, // Always true for mobile view
          orders: dayOrders
        });
      }
      
      return days;
    } else {
      // Desktop: Different views based on viewType
      const days: CalendarDay[] = [];
      
      if (viewType === 'daily') {
        // Daily view: Show only the selected day
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayOrders = ordersByDate[dateKey] || [];
        
        days.push({
          date: new Date(currentDate),
          isCurrentMonth: true,
          orders: dayOrders
        });
      } else if (viewType === 'weekly') {
        // Weekly view: Show 7 days starting from Sunday of the current week
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        
        for (let i = 0; i < 7; i++) {
          const currentDay = new Date(startOfWeek);
          currentDay.setDate(startOfWeek.getDate() + i);
          
          const dateKey = currentDay.toISOString().split('T')[0];
          const dayOrders = ordersByDate[dateKey] || [];
          
          days.push({
            date: new Date(currentDay),
            isCurrentMonth: true, // Always true for weekly view
            orders: dayOrders
          });
        }
      } else {
        // Monthly view: Full month calendar
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        
        // Start from Sunday of the week containing the first day
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());
        
        // End on Saturday of the week containing the last day
        const endDate = new Date(lastDay);
        endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
        
        const currentDay = new Date(startDate);
        
        while (currentDay <= endDate) {
          const dateKey = currentDay.toISOString().split('T')[0];
          const dayOrders = ordersByDate[dateKey] || [];
          
          days.push({
            date: new Date(currentDay),
            isCurrentMonth: currentDay.getMonth() === month,
            orders: dayOrders
          });
          
          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
      
      return days;
    }
  };

  // Navigate based on view type
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    
    if (viewType === 'daily') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (viewType === 'weekly') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
      newDate.setDate(1);
    }
    
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    
    if (viewType === 'daily') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (viewType === 'weekly') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
      newDate.setDate(1);
    }
    
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get unit type info
  const getUnitTypeInfo = (uom: string) => {
    const isFrozen = uom === "קר";
    const unitText = isFrozen ? "קרטון" : "יחידה";
    
    return (
      <Badge variant={isFrozen ? "secondary" : "outline"} className="text-xs">
        {isFrozen ? (
          <PackageIcon className="h-3 w-3 mr-1" />
        ) : (
          <CircleDot className="h-3 w-3 mr-1" />
        )}
        {unitText}
      </Badge>
    );
  };

  // Handle order click - navigate to edit order page
  const handleOrderClick = (order: OrderLineItem) => {
    setOpenPopover(null); // Close popover before navigating
    navigate(`/orders/edit/${order.docEntry}`);
  };

  // Handle popover toggle
  const handlePopoverToggle = (orderKey: string, isOpen: boolean) => {
    setOpenPopover(isOpen ? orderKey : null);
  };

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const calendarDays = generateCalendarDays(isMobile);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-center items-center mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              יומן הזמנות
            </h1>
            <p className="text-muted-foreground mt-1">
              {isMobile ? "הזמנות ל-3 הימים הקרובים" : 
               viewType === 'daily' ? "תצוגה יומית של הזמנות" :
               viewType === 'weekly' ? "תצוגה שבועית של הזמנות" :
               "תצוגה חודשית של הזמנות"}
            </p>
          </div>
        </div>

        {/* Calendar Navigation and View Selection - Only show for desktop */}
        {!isMobile && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              {/* View Type Selection */}
              <div className="flex justify-center gap-4 mb-4">
                <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">תצוגה יומית</SelectItem>
                    <SelectItem value="weekly">תצוגה שבועית</SelectItem>
                    <SelectItem value="monthly">תצוגה חודשית</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                    <SelectItem value="Open">פתוחות</SelectItem>
                    <SelectItem value="Closed">סגורות</SelectItem>
                    <SelectItem value="Canceled">מבוטלות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigatePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="h-4 w-4" />
                  {viewType === 'daily' ? 'יום קודם' : viewType === 'weekly' ? 'שבוע קודם' : 'חודש קודם'}
                </Button>
                
                <div className="text-center">
                  <CardTitle className="text-xl">
                    {viewType === 'daily' ? (
                      `${hebrewFullDays[currentDate.getDay()]}, ${currentDate.getDate()} ${hebrewMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    ) : viewType === 'weekly' ? (
                      (() => {
                        const startOfWeek = new Date(currentDate);
                        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        
                        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${hebrewMonths[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
                      })()
                    ) : (
                      `${hebrewMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    )}
                  </CardTitle>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateNext}
                  className="flex items-center gap-2"
                >
                  {viewType === 'daily' ? 'יום הבא' : viewType === 'weekly' ? 'שבוע הבא' : 'חודש הבא'}
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-blue-600 hover:text-blue-700"
                >
                  חזור להיום
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : isMobile ? (
              /* Mobile View - 3 columns for 3 days */
              <div className="grid grid-cols-3 gap-0">
                {/* Day headers for mobile */}
                {calendarDays.map((day, index) => (
                  <div key={`header-${index}`} className="p-2 text-center font-medium bg-muted/50 border-b border-r last:border-r-0">
                    <div className="text-sm">{hebrewDays[day.date.getDay()]}</div>
                    <div className="text-xs text-muted-foreground">{day.date.getDate()}/{day.date.getMonth() + 1}</div>
                  </div>
                ))}
                
                {/* Calendar days for mobile */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[200px] p-2 border-b border-r last:border-r-0 ${
                      isToday(day.date) ? 'bg-blue-50 border-blue-200' : 'bg-background'
                    }`}
                  >
                    {/* Orders count badge */}
                    {day.orders.length > 0 && (
                      <div className="mb-2 flex justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {day.orders.length} הזמנות
                        </Badge>
                      </div>
                    )}
                    
                    {/* Orders for this day */}
                    <div className="space-y-2">
                      {day.orders.map((order, orderIndex) => {
                        const orderKey = `${order.docEntry}-${order.lineNum}`;
                        return (
                          <Popover
                            key={orderKey}
                            open={openPopover === orderKey}
                            onOpenChange={(isOpen) => handlePopoverToggle(orderKey, isOpen)}
                          >
                            <PopoverTrigger asChild>
                              <div className="text-xs p-2 rounded bg-amber-100 border border-amber-200 hover:bg-amber-200 transition-colors cursor-pointer">
                                <div className="text-center">
                                  <div className="font-medium text-amber-800 mb-1 leading-tight">
                                    {order.description.length > 20 
                                      ? order.description.substring(0, 20) + "..." 
                                      : order.description}
                                  </div>
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-amber-700 font-bold">
                                      {order.quantity}
                                    </span>
                                    {getUnitTypeInfo(order.uom)}
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs mt-1 ${
                                      order.orderStatus === 'Open' ? 'bg-blue-50 text-blue-700' :
                                      order.orderStatus === 'Closed' ? 'bg-green-50 text-green-700' :
                                      order.orderStatus === 'Canceled' ? 'bg-red-50 text-red-700' :
                                      'bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    {order.orderStatus === 'Open' ? 'פתוח' :
                                     order.orderStatus === 'Closed' ? 'סגור' :
                                     order.orderStatus === 'Canceled' ? 'מבוטל' :
                                     order.orderStatus}
                                  </Badge>
                                </div>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="center">
                              <div className="space-y-3">
                                <div className="text-center">
                                  <h4 className="font-semibold text-base mb-2">{order.description}</h4>
                                  <div className="text-sm text-muted-foreground mb-3">
                                    הזמנה מספר: {order.docNum}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="font-medium text-muted-foreground">כמות</div>
                                    <div className="text-lg font-bold">{order.quantity}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-muted-foreground">יחידת מידה</div>
                                    <div className="mt-1">{getUnitTypeInfo(order.uom)}</div>
                                  </div>
                                </div>
                                
                                <div className="text-center text-sm">
                                  <div className="font-medium text-muted-foreground mb-1">מק"ט מוצר</div>
                                  <div className="font-mono bg-muted px-2 py-1 rounded">{order.itemCode}</div>
                                </div>
                                
                                <Button 
                                  onClick={() => handleOrderClick(order)}
                                  className="w-full bg-orange-600 hover:bg-orange-700"
                                >
                                  עריכת הזמנה
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                      
                      {day.orders.length === 0 && (
                        <div className="text-center text-muted-foreground text-xs py-4">
                          אין הזמנות
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : viewType === 'daily' ? (
              /* Desktop Daily View - Single day card */
              <div className="p-6">
                {calendarDays.length > 0 && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">
                        {hebrewFullDays[calendarDays[0].date.getDay()]}, {calendarDays[0].date.getDate()} {hebrewMonths[calendarDays[0].date.getMonth()]}
                      </h3>
                      <div className="flex justify-center">
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                          {calendarDays[0].orders.length} הזמנות
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Orders for the day */}
                    <div className="space-y-4">
                      {calendarDays[0].orders.map((order, orderIndex) => {
                        const orderKey = `daily-${order.docEntry}-${order.lineNum}`;
                        return (
                          <Popover
                            key={orderKey}
                            open={openPopover === orderKey}
                            onOpenChange={(isOpen) => handlePopoverToggle(orderKey, isOpen)}
                          >
                            <PopoverTrigger asChild>
                              <div className="p-4 rounded-lg bg-amber-100 border border-amber-200 hover:bg-amber-200 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-amber-800 mb-2">{order.description}</h4>
                                    <div className="text-sm text-amber-700">
                                      הזמנה מספר: {order.docNum} | מק"ט: {order.itemCode}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-amber-700">{order.quantity}</span>
                                    {getUnitTypeInfo(order.uom)}
                                  </div>
                                </div>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="center">
                              <div className="space-y-3">
                                <div className="text-center">
                                  <h4 className="font-semibold text-base mb-2">{order.description}</h4>
                                  <div className="text-sm text-muted-foreground mb-3">
                                    הזמנה מספר: {order.docNum}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="font-medium text-muted-foreground">כמות</div>
                                    <div className="text-lg font-bold">{order.quantity}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-muted-foreground">יחידת מידה</div>
                                    <div className="mt-1">{getUnitTypeInfo(order.uom)}</div>
                                  </div>
                                </div>
                                
                                <div className="text-center text-sm">
                                  <div className="font-medium text-muted-foreground mb-1">מק"ט מוצר</div>
                                  <div className="font-mono bg-muted px-2 py-1 rounded">{order.itemCode}</div>
                                </div>
                                
                                <Button 
                                  onClick={() => handleOrderClick(order)}
                                  className="w-full bg-orange-600 hover:bg-orange-700"
                                >
                                  עריכת הזמנה
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                      
                      {calendarDays[0].orders.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>אין הזמנות ליום זה</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Desktop Weekly/Monthly View - Grid layout */
              <div className={`grid gap-0 ${viewType === 'weekly' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                {/* Day headers */}
                {hebrewDays.map((day, index) => (
                  <div
                    key={index}
                    className="p-3 text-center font-medium bg-muted/50 border-b border-r last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`${viewType === 'weekly' ? 'min-h-[180px]' : 'min-h-[120px]'} p-2 border-b border-r last:border-r-0 ${
                      !day.isCurrentMonth && viewType === 'monthly' ? 'bg-muted/20 text-muted-foreground' : 'bg-background'
                    } ${
                      isToday(day.date) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    {/* Date number */}
                    <div className={`text-sm font-medium mb-2 flex items-center justify-between ${
                      isToday(day.date) ? 'text-blue-600' : ''
                    }`}>
                      <span>{day.date.getDate()}</span>
                      {day.orders.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {day.orders.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Orders for this day */}
                    <div className="space-y-1">
                      {day.orders.slice(0, 3).map((order, orderIndex) => {
                        const orderKey = `desktop-${order.docEntry}-${order.lineNum}`;
                        return (
                          <Popover
                            key={orderKey}
                            open={openPopover === orderKey}
                            onOpenChange={(isOpen) => handlePopoverToggle(orderKey, isOpen)}
                          >
                            <PopoverTrigger asChild>
                              <div className="text-xs p-1 rounded bg-amber-100 border border-amber-200 hover:bg-amber-200 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="truncate text-amber-800 font-medium">
                                    {order.description.length > 15 
                                      ? order.description.substring(0, 15) + "..." 
                                      : order.description}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-amber-700 font-bold">
                                      {order.quantity}
                                    </span>
                                    {getUnitTypeInfo(order.uom)}
                                  </div>
                                </div>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="center">
                              <div className="space-y-3">
                                <div className="text-center">
                                  <h4 className="font-semibold text-base mb-2">{order.description}</h4>
                                  <div className="text-sm text-muted-foreground mb-3">
                                    הזמנה מספר: {order.docNum}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="text-center">
                                    <div className="font-medium text-muted-foreground">כמות</div>
                                    <div className="text-lg font-bold">{order.quantity}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-muted-foreground">יחידת מידה</div>
                                    <div className="mt-1">{getUnitTypeInfo(order.uom)}</div>
                                  </div>
                                </div>
                                
                                <div className="text-center text-sm">
                                  <div className="font-medium text-muted-foreground mb-1">מק"ט מוצר</div>
                                  <div className="font-mono bg-muted px-2 py-1 rounded">{order.itemCode}</div>
                                </div>
                                
                                <Button 
                                  onClick={() => handleOrderClick(order)}
                                  className="w-full bg-orange-600 hover:bg-orange-700"
                                >
                                  עריכת הזמנה
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                      
                      {/* Show count if there are more than 3 orders */}
                      {day.orders.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center mt-1">
                          +{day.orders.length - 3} נוספים
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend and Info - Only show for desktop */}
        {!isMobile && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">מקרא ומידע</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Visual Legend */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                    <span>היום</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
                    <span>יום עם הזמנות</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <PackageIcon className="h-3 w-3 mr-1" />
                      קרטון
                    </Badge>
                    <span>מוצרים קפואים</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <CircleDot className="h-3 w-3 mr-1" />
                      יחידה
                    </Badge>
                    <span>מוצרים טריים</span>
                  </div>
                </div>
                
                {/* View Types Info */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">סוגי תצוגה:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <strong>תצוגה יומית:</strong><br />
                      מציגה יום אחד עם כל ההזמנות בפירוט
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <strong>תצוגה שבועית:</strong><br />
                      מציגה שבוע מלא (7 ימים) עם סיכום ההזמנות
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <strong>תצוגה חודשית:</strong><br />
                      מציגה חודש מלא עם תצוגה כוללת של ההזמנות
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Mobile-specific instructions */}
        {isMobile && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-2">לחץ על הזמנה לצפייה בפרטים ועריכה</p>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <PackageIcon className="h-3 w-3 mr-1" />
                      קרטון
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <CircleDot className="h-3 w-3 mr-1" />
                      יחידה
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Calendar; 