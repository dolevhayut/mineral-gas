import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Navigation, Package, Clock, Phone, User, Map as MapIcon, ExternalLink, Plus, Settings } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { supabase } from '@/integrations/supabase/client';
import { getAllDeliveryDays } from '@/lib/deliveryDays';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix z-index issues for leaflet popups and other overlapping elements
const globalStyles = `
  /* Leaflet map container should be at base level */
  .leaflet-container {
    z-index: 1 !important;
  }
  
  /* Leaflet popups should be above map but below dialogs */
  .leaflet-popup {
    z-index: 1000 !important;
  }
  .leaflet-tooltip {
    z-index: 1000 !important;
  }
  .leaflet-top,
  .leaflet-bottom {
    z-index: 999 !important;
  }
  
  /* Ensure select dropdowns appear above everything */
  [role="listbox"] {
    z-index: 99999 !important;
  }
  
  /* Dialog overlay should cover everything including map */
  [data-state="open"][style*="pointer-events: auto"] {
    z-index: 50 !important;
  }
  
  /* Dialog content above overlay */
  [role="dialog"] {
    z-index: 51 !important;
  }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('route-optimization-styles');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'route-optimization-styles';
    style.innerHTML = globalStyles;
    document.head.appendChild(style);
  }
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Fix for default markers in React-Leaflet
interface IconDefault extends L.Icon.Default {
  _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define starting points
const STARTING_POINTS: { [key: string]: { name: string; lat: number; lng: number } } = {
  'חורפיש': {
    name: "חורפיש",
    lat: 33.017083,
    lng: 35.348421
  },
  'אילון': {
    name: "אילון",
    lat: 33.062496363441625,
    lng: 35.21917304766881
  },
  'צוריאל': {
    name: "צוריאל",
    lat: 33.00650324998519,
    lng: 35.314795280087864
  },
  'פסוטה': {
    name: "פסוטה",
    lat: 33.04766403229962,
    lng: 35.308441722568695
  },
  'חיפה': { 
    name: "חיפה", 
    lat: 32.7940, 
    lng: 34.9896 
  },
  'נהריה': { 
    name: "נהריה", 
    lat: 33.0094, 
    lng: 35.0947 
  },
  'עכו': {
    name: "עכו",
    lat: 32.9283,
    lng: 35.0823
  },
  'כרמיאל': {
    name: "כרמיאל",
    lat: 32.9196,
    lng: 35.2951
  },
  'קריית שמונה': {
    name: "קריית שמונה",
    lat: 33.2075,
    lng: 35.5697
  },
  default: {
    name: "חורפיש",
    lat: 33.017083,
    lng: 35.348421
  }
};

interface OrderWithLocation {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  items: string[];
  total: number;
  lat?: number;
  lng?: number;
  distance?: number;
  order?: number;
}

export default function RouteOptimization() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [orders, setOrders] = useState<OrderWithLocation[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OrderWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [algorithmType, setAlgorithmType] = useState<'nearest' | '2opt'>('2opt');
  const [customStartPoint, setCustomStartPoint] = useState<string | null>(null);
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [customLocationName, setCustomLocationName] = useState('');
  const [customLocationLat, setCustomLocationLat] = useState('');
  const [customLocationLng, setCustomLocationLng] = useState('');
  const [deliveryDaysConfig, setDeliveryDaysConfig] = useState<Array<{ day_of_week: number; cities: string[] }>>([]);
  
  // Get starting point based on selection
  const getStartingPoint = () => {
    if (customStartPoint && STARTING_POINTS[customStartPoint]) {
      return STARTING_POINTS[customStartPoint];
    }
    return STARTING_POINTS.default;
  };
  
  const startingPoint = getStartingPoint();
  const [mapCenter, setMapCenter] = useState<[number, number]>([startingPoint.lat, startingPoint.lng]);

  // Fetch orders for the selected date
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Get the day of week for the selected date
      const dayOfWeek = selectedDate.getDay();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      console.log('=== Route Optimization Debug ===');
      console.log(`Selected date: ${formattedDate} (day of week: ${dayOfWeek})`);
      
      // Get delivery days configuration
      const deliveryDays = await getAllDeliveryDays();
      console.log('All delivery days config:', deliveryDays);
      
      const dayConfig = deliveryDays.find(d => d.day_of_week === dayOfWeek);
      console.log('Day config for selected day:', dayConfig);
      
      // Get cities that have delivery on this day
      const allowedCities = dayConfig?.cities || [];
      console.log(`Allowed cities for this day:`, allowedCities);
      
      if (allowedCities.length === 0) {
        console.warn('⚠️ No cities configured for delivery on this day');
        setOrders([]);
        setLoading(false);
        return;
      }
      
      // First, get ALL orders to debug
      console.log('Fetching orders with target_date =', formattedDate);
      const { data: allOrdersDebug, error: debugError } = await supabase
        .from('orders')
        .select('id, target_date, delivery_date, status, customer_id')
        .not('target_date', 'is', null);
      
      console.log('All orders in DB with target_date:', allOrdersDebug);
      
      // Now get orders with customer info for the selected date
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_address,
          target_date,
          total,
          customer_id,
          status,
          order_items (
            quantity,
            products (
              name
            )
          )
        `)
        .eq('target_date', formattedDate)
        .in('status', ['pending', 'confirmed']);

      console.log('Orders matching date and status:', ordersData);
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Get unique customer IDs
      const customerIds = [...new Set(ordersData?.map(order => order.customer_id).filter(Boolean) || [])];

      if (customerIds.length === 0) {
        console.log('No orders found for this date');
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch customer details
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, city, address')
        .in('id', customerIds);

      if (customersError) throw customersError;

      // Create customer lookup map
      const customerMap = new Map(customersData?.map(c => [c.id, c]) || []);

      // Transform the data and filter by allowed cities
      const ordersWithLocation = ordersData?.map(order => {
        const customer = customerMap.get(order.customer_id || '');
        return {
          id: order.id,
          customer_name: customer?.name || 'לקוח לא ידוע',
          customer_phone: customer?.phone || '',
          delivery_address: order.delivery_address || customer?.address || '',
          city: customer?.city || '',
          items: order.order_items?.map(item => 
            `${item.quantity}x ${item.products?.name}`
          ) || [],
          total: order.total || 0,
        };
      }).filter(order => {
        // Only include orders from cities that have delivery on this day
        const isAllowed = allowedCities.includes(order.city);
        if (!isAllowed) {
          console.log(`Filtering out order from ${order.city} - not configured for this day`);
        }
        return isAllowed;
      }) || [];

      console.log(`Found ${ordersWithLocation.length} orders after filtering by delivery days`);

      // Geocode addresses
      const geocodedOrders = await geocodeOrders(ordersWithLocation);
      setOrders(geocodedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced geocoding function with more cities
  const geocodeOrders = async (orders: OrderWithLocation[]): Promise<OrderWithLocation[]> => {
    // In a real application, you would use a geocoding service like Google Maps API
    // or Nominatim to convert addresses to coordinates
    
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      // צפון
      'חיפה': { lat: 32.7940, lng: 34.9896 },
      'נהריה': { lat: 33.0094, lng: 35.0947 },
      'עכו': { lat: 32.9283, lng: 35.0823 },
      'כרמיאל': { lat: 32.9196, lng: 35.2951 },
      'טבריה': { lat: 32.7897, lng: 35.5319 },
      'צפת': { lat: 32.9648, lng: 35.4960 },
      'קריית שמונה': { lat: 33.2075, lng: 35.5697 },
      'ראש פינה': { lat: 32.9689, lng: 35.5496 },
      'נצרת': { lat: 32.7018, lng: 35.2978 },
      'טמרה': { lat: 32.8526, lng: 35.1968 },
      'שפרעם': { lat: 32.8056, lng: 35.1694 },
      'סחנין': { lat: 32.8639, lng: 35.2969 },
      'מעלות': { lat: 33.0167, lng: 35.2833 },
      'יקנעם': { lat: 32.6584, lng: 35.1103 },
      'קריית ביאליק': { lat: 32.8381, lng: 35.0856 },
      'קריית מוצקין': { lat: 32.8336, lng: 35.0747 },
      'קריית ים': { lat: 32.8497, lng: 35.0647 },
      'קריית אתא': { lat: 32.8006, lng: 35.1069 },
      'נשר': { lat: 32.7667, lng: 35.0408 },
      'טירת כרמל': { lat: 32.7608, lng: 34.9717 },
      // קרוב לאילון
      'אילון': { lat: 33.062496506108666, lng: 35.21928128639784 },
      'מגאר': { lat: 32.8867, lng: 35.2639 },
      'בית ג\'ן': { lat: 32.9978, lng: 35.3817 },
      'ירכא': { lat: 33.0514, lng: 35.2142 },
      'ג\'וליס': { lat: 32.9439, lng: 35.1775 },
      'כפר יאסיף': { lat: 32.9547, lng: 35.1619 },
      'אבו סנאן': { lat: 32.9575, lng: 35.1761 },
      'ג\'דיידה-מכר': { lat: 32.9250, lng: 35.1542 },
    };

    return orders.map(order => {
      const coords = cityCoordinates[order.city];
      if (coords) {
        return {
          ...order,
          lat: coords.lat + (Math.random() - 0.5) * 0.005, // Smaller random offset
          lng: coords.lng + (Math.random() - 0.5) * 0.005,
        };
      }
      // Default to area near starting point if city not found
      return {
        ...order,
        lat: STARTING_POINTS.default.lat + (Math.random() - 0.5) * 0.2,
        lng: STARTING_POINTS.default.lng + (Math.random() - 0.5) * 0.2,
      };
    });
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Nearest neighbor algorithm
  const nearestNeighbor = (ordersToOptimize: OrderWithLocation[]) => {
    const unvisited = [...ordersToOptimize];
    const route: OrderWithLocation[] = [];
    let currentLocation = { lat: startingPoint.lat, lng: startingPoint.lng };

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      unvisited.forEach((order, index) => {
        if (order.lat && order.lng) {
          const distance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            order.lat,
            order.lng
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        }
      });

      const nearest = unvisited[nearestIndex];
      route.push(nearest);

      if (nearest.lat && nearest.lng) {
        currentLocation = { lat: nearest.lat, lng: nearest.lng };
      }
      unvisited.splice(nearestIndex, 1);
    }

    return route;
  };

  // 2-opt algorithm for route improvement
  const twoOpt = (route: OrderWithLocation[]) => {
    const improvedRoute = [...route];
    let improved = true;

    while (improved) {
      improved = false;
      for (let i = 0; i < improvedRoute.length - 1; i++) {
        for (let j = i + 2; j < improvedRoute.length; j++) {
          // Calculate current distance
          const currentDist = 
            calculateDistance(
              improvedRoute[i].lat!,
              improvedRoute[i].lng!,
              improvedRoute[i + 1].lat!,
              improvedRoute[i + 1].lng!
            ) +
            calculateDistance(
              improvedRoute[j].lat!,
              improvedRoute[j].lng!,
              improvedRoute[(j + 1) % improvedRoute.length]?.lat || startingPoint.lat,
              improvedRoute[(j + 1) % improvedRoute.length]?.lng || startingPoint.lng
            );

          // Calculate new distance after swap
          const newDist = 
            calculateDistance(
              improvedRoute[i].lat!,
              improvedRoute[i].lng!,
              improvedRoute[j].lat!,
              improvedRoute[j].lng!
            ) +
            calculateDistance(
              improvedRoute[i + 1].lat!,
              improvedRoute[i + 1].lng!,
              improvedRoute[(j + 1) % improvedRoute.length]?.lat || startingPoint.lat,
              improvedRoute[(j + 1) % improvedRoute.length]?.lng || startingPoint.lng
            );

          // If improvement found, reverse the segment
          if (newDist < currentDist) {
            const segment = improvedRoute.slice(i + 1, j + 1);
            segment.reverse();
            improvedRoute.splice(i + 1, j - i, ...segment);
            improved = true;
          }
        }
      }
    }

    return improvedRoute;
  };

  // Main route optimization function
  const optimizeRoute = () => {
    if (orders.length === 0) return;

    // First, use nearest neighbor
    let route = nearestNeighbor(orders);

    // Then, apply 2-opt if selected
    if (algorithmType === '2opt' && route.length > 3) {
      route = twoOpt(route);
    }

    // Calculate total distance and assign order numbers
    let totalDist = 0;
    let currentLocation = { lat: startingPoint.lat, lng: startingPoint.lng };

    route.forEach((order, index) => {
      if (order.lat && order.lng) {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          order.lat,
          order.lng
        );
        order.distance = distance;
        order.order = index + 1;
        totalDist += distance;
        currentLocation = { lat: order.lat, lng: order.lng };
      }
    });

    // Add return distance
    if (route.length > 0 && route[route.length - 1].lat && route[route.length - 1].lng) {
      totalDist += calculateDistance(
        route[route.length - 1].lat!,
        route[route.length - 1].lng!,
        startingPoint.lat,
        startingPoint.lng
      );
    }

    // Calculate estimated time (40 km/h average + 5 minutes per stop)
    const drivingTime = totalDist / 40; // hours
    const stopTime = route.length * 5 / 60; // hours
    const totalTime = drivingTime + stopTime;

    setOptimizedRoute(route);
    setTotalDistance(totalDist);
    setEstimatedTime(totalTime);
  };

  // Load delivery days configuration on mount
  useEffect(() => {
    const loadDeliveryDays = async () => {
      const days = await getAllDeliveryDays();
      setDeliveryDaysConfig(days);
    };
    loadDeliveryDays();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map center when starting point changes
  useEffect(() => {
    setMapCenter([startingPoint.lat, startingPoint.lng]);
    // Clear optimized route when starting point changes
    setOptimizedRoute([]);
    setTotalDistance(0);
    setEstimatedTime(0);
  }, [startingPoint.lat, startingPoint.lng]);

  const getPolylinePoints = (): [number, number][] => {
    if (optimizedRoute.length === 0) return [];

    const points: [number, number][] = [[startingPoint.lat, startingPoint.lng]];
    
    optimizedRoute.forEach(order => {
      if (order.lat && order.lng) {
        points.push([order.lat, order.lng]);
      }
    });

    // Return to starting point
    points.push([startingPoint.lat, startingPoint.lng]);

    return points;
  };

  // Export route to clipboard
  const exportRoute = () => {
    const routeText = optimizedRoute.map((order, index) => 
      `${index + 1}. ${order.customer_name} - ${order.city}, ${order.delivery_address} - טל: ${order.customer_phone}`
    ).join('\n');
    
    const fullText = `מסלול חלוקה ליום ${format(selectedDate, 'dd/MM/yyyy', { locale: he })}
נקודת התחלה: ${startingPoint.name}
מרחק כולל: ${totalDistance.toFixed(1)} ק"מ
זמן משוער: ${Math.floor(estimatedTime)} שעות ו-${Math.round((estimatedTime % 1) * 60)} דקות

${routeText}

חזרה ל: ${startingPoint.name}`;

    navigator.clipboard.writeText(fullText);
    alert('המסלול הועתק ללוח');
  };

  // Export to Waze
  const exportToWaze = () => {
    if (optimizedRoute.length === 0) return;
    
    // Waze supports multiple stops via navigate URL
    // First stop
    const firstStop = optimizedRoute[0];
    if (firstStop.lat && firstStop.lng) {
      const wazeUrl = `https://www.waze.com/ul?ll=${firstStop.lat},${firstStop.lng}&navigate=yes&zoom=17`;
      window.open(wazeUrl, '_blank');
    }
  };

  // Export to Google Maps
  const exportToGoogleMaps = () => {
    if (optimizedRoute.length === 0) return;
    
    // Google Maps directions with waypoints
    let url = 'https://www.google.com/maps/dir/';
    
    // Starting point
    url += `${startingPoint.lat},${startingPoint.lng}/`;
    
    // Add all stops
    optimizedRoute.forEach(order => {
      if (order.lat && order.lng) {
        url += `${order.lat},${order.lng}/`;
      }
    });
    
    // Return to starting point
    url += `${startingPoint.lat},${startingPoint.lng}`;
    
    // Add parameters
    url += '?travelmode=driving';
    
    window.open(url, '_blank');
  };

  // Export all stops as individual Waze links
  const exportWazeStops = () => {
    const wazeLinks = optimizedRoute.map((order, index) => {
      if (order.lat && order.lng) {
        return `${index + 1}. ${order.customer_name} - ${order.city}
https://www.waze.com/ul?ll=${order.lat},${order.lng}&navigate=yes&zoom=17`;
      }
      return '';
    }).filter(link => link).join('\n\n');
    
    const fullText = `רשימת עצירות ל-Waze
${format(selectedDate, 'dd/MM/yyyy', { locale: he })}

נקודת התחלה - ${startingPoint.name}:
https://www.waze.com/ul?ll=${startingPoint.lat},${startingPoint.lng}&navigate=yes&zoom=17

${wazeLinks}`;
    
    navigator.clipboard.writeText(fullText);
    alert('קישורי Waze הועתקו ללוח');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">ניהול מסלולים יומיים</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">נקודת התחלה:</span>
          <Select 
            value={customStartPoint || 'חורפיש'} 
            onValueChange={setCustomStartPoint}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[99999]" style={{ zIndex: 99999 }}>
              {Object.entries(STARTING_POINTS)
                .filter(([key]) => key !== 'default')
                .map(([key, point]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {point.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowCustomLocation(true)}
            variant="outline"
            size="icon"
            title="הוסף נקודת התחלה מותאמת"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>הגדרות מסלול</CardTitle>
            <CardDescription>בחר תאריך וחשב מסלול אופטימלי</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">תאריך חלוקה</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right font-normal"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(selectedDate, "PPP", { locale: he })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {loading ? 'טוען הזמנות...' : `נמצאו ${orders.length} הזמנות לתאריך זה`}
              </p>
              
              {/* Show which cities have delivery on this day */}
              {(() => {
                const dayOfWeek = selectedDate.getDay();
                const dayConfig = deliveryDaysConfig.find(d => d.day_of_week === dayOfWeek);
                const allowedCities = dayConfig?.cities || [];
                
                if (allowedCities.length > 0) {
                  return (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">
                        ערים מוגדרות ליום זה:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {allowedCities.map(city => (
                          <Badge key={city} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                } else if (!loading) {
                  return (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-900 mb-2">
                        ⚠️ אין ערים מוגדרות ליום זה
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigate('/admin/delivery-days')}
                      >
                        <Settings className="w-3 h-3 ml-1" />
                        הגדר ימי חלוקה
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
              
              
              <div>
                <label className="text-sm font-medium">אלגוריתם אופטימיזציה</label>
                <Select value={algorithmType} onValueChange={(value: 'nearest' | '2opt') => setAlgorithmType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nearest">Nearest Neighbor (מהיר)</SelectItem>
                    <SelectItem value="2opt">2-Opt (מדויק יותר)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => {
                  console.log('Button clicked, orders:', orders.length);
                  if (orders.length > 0) {
                    optimizeRoute();
                  }
                }}
                disabled={orders.length === 0 || loading}
                className="w-full"
              >
                {loading ? 'טוען...' : orders.length === 0 ? 'אין הזמנות' : 'חשב מסלול אופטימלי'}
              </Button>
              
              {orders.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground text-center">
                  אין הזמנות לתאריך זה. נסה לבחור תאריך אחר או צור הזמנות חדשות.
                </p>
              )}
            </div>

            {optimizedRoute.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">מרחק כולל:</span>
                  <span className="text-sm">{totalDistance.toFixed(1)} ק"מ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">זמן משוער:</span>
                  <span className="text-sm">
                    {Math.floor(estimatedTime)}:{String(Math.round((estimatedTime % 1) * 60)).padStart(2, '0')} שעות
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">עצירות:</span>
                  <span className="text-sm">{optimizedRoute.length}</span>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={exportRoute}
                    variant="outline" 
                    className="w-full"
                    size="sm"
                  >
                    <Package className="w-4 h-4 ml-2" />
                    העתק רשימת מסלול
                  </Button>
                  
                  <Button 
                    onClick={exportToGoogleMaps}
                    variant="outline" 
                    className="w-full"
                    size="sm"
                  >
                    <MapIcon className="w-4 h-4 ml-2" />
                    פתח ב-Google Maps
                  </Button>
                  
                  <Button 
                    onClick={exportToWaze}
                    variant="outline" 
                    className="w-full"
                    size="sm"
                  >
                    <i className="fab fa-waze ml-2" />
                    נווט ב-Waze
                  </Button>
                  
                  <Button 
                    onClick={exportWazeStops}
                    variant="outline" 
                    className="w-full"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    קישורי Waze לכל עצירה
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2 h-[400px] sm:h-[500px] lg:h-[600px]" style={{ position: 'relative', zIndex: 1 }}>
          <CardContent className="p-0 h-full" style={{ position: 'relative', zIndex: 1 }}>
            <MapContainer 
              center={mapCenter} 
              zoom={10} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              className="rounded-lg"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Starting point marker */}
              <Marker 
                position={[startingPoint.lat, startingPoint.lng]}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="text-right">
                    <strong>נקודת התחלה</strong><br />
                    {startingPoint.name}
                  </div>
                </Popup>
              </Marker>

              {/* Order markers */}
              {(optimizedRoute.length > 0 ? optimizedRoute : orders).map((order, index) => (
                order.lat && order.lng && (
                  <Marker 
                    key={order.id}
                    position={[order.lat, order.lng]}
                  >
                    <Popup>
                      <div className="text-right space-y-1">
                        {order.order && <Badge className="mb-2">עצירה {order.order}</Badge>}
                        <p><strong>{order.customer_name}</strong></p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.city}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.join(', ')}
                        </p>
                        <p className="font-medium">₪{order.total}</p>
                        {order.distance && (
                          <p className="text-sm text-muted-foreground">
                            מרחק: {order.distance.toFixed(1)} ק"מ
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}

              {/* Route polyline */}
              {optimizedRoute.length > 0 && (
                <Polyline 
                  positions={getPolylinePoints()} 
                  color="#2563eb" 
                  weight={4}
                  opacity={0.8}
                  smoothFactor={1}
                  dashArray="10, 5"
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapContainer>
          </CardContent>
        </Card>
      </div>

      {/* Route Details */}
      {optimizedRoute.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>פרטי המסלול</CardTitle>
            <CardDescription>סדר העצירות האופטימלי</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium">התחלה: {startingPoint.name}</span>
              </div>

              {optimizedRoute.map((order, index) => (
                <div key={order.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg">
                  <Badge variant="outline" className="mt-1">
                    {order.order}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.city} - {order.delivery_address}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">₪{order.total}</p>
                        {order.distance && (
                          <p className="text-sm text-muted-foreground">
                            {order.distance.toFixed(1)} ק"מ
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.items.map((item, i) => (
                        <Badge key={i} variant="secondary">
                          <Package className="w-3 h-3 ml-1" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium">סיום: חזרה ל{startingPoint.name}</span>
              </div>
            </div>
            
            {/* Navigation Actions */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">אפשרויות ניווט</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button 
                  onClick={exportToGoogleMaps}
                  variant="default" 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MapIcon className="w-4 h-4 ml-2" />
                  Google Maps
                </Button>
                
                <Button 
                  onClick={exportToWaze}
                  variant="default" 
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <i className="fab fa-waze ml-2" />
                  Waze
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground text-center">
                * Google Maps יציג את כל המסלול עם כל העצירות<br/>
                * Waze יתחיל ניווט לעצירה הראשונה
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Location Dialog */}
      <Dialog open={showCustomLocation} onOpenChange={setShowCustomLocation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>הוסף נקודת התחלה מותאמת</DialogTitle>
            <DialogDescription>
              הזן את פרטי הנקודה החדשה. ניתן למצוא קואורדינטות ב-Google Maps
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                שם המקום
              </Label>
              <Input
                id="name"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                className="col-span-3"
                placeholder="לדוגמה: מחסן ראשי"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="lat" className="text-right">
                קו רוחב
              </Label>
              <Input
                id="lat"
                value={customLocationLat}
                onChange={(e) => setCustomLocationLat(e.target.value)}
                className="col-span-3"
                placeholder="33.062496"
                type="number"
                step="0.000001"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="lng" className="text-right">
                קו אורך
              </Label>
              <Input
                id="lng"
                value={customLocationLng}
                onChange={(e) => setCustomLocationLng(e.target.value)}
                className="col-span-3"
                placeholder="35.219173"
                type="number"
                step="0.000001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCustomLocation(false);
                setCustomLocationName('');
                setCustomLocationLat('');
                setCustomLocationLng('');
              }}
            >
              ביטול
            </Button>
            <Button 
              onClick={() => {
                if (customLocationName && customLocationLat && customLocationLng) {
                  // Add custom location temporarily
                  const tempKey = `custom_${Date.now()}`;
                  STARTING_POINTS[tempKey] = {
                    name: customLocationName,
                    lat: parseFloat(customLocationLat),
                    lng: parseFloat(customLocationLng)
                  };
                  setCustomStartPoint(tempKey);
                  setShowCustomLocation(false);
                  setCustomLocationName('');
                  setCustomLocationLat('');
                  setCustomLocationLng('');
                }
              }}
              disabled={!customLocationName || !customLocationLat || !customLocationLng}
            >
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
