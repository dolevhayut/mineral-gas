import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Navigation, Package, Clock, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Define starting points by day of week
const STARTING_POINTS = {
  default: {
    name: "אילון",
    lat: 33.062496506108666,
    lng: 35.21928128639784
  },
  sunday: { name: "חיפה", lat: 32.7940, lng: 34.9896 },
  monday: { name: "נהריה", lat: 33.0094, lng: 35.0947 },
  tuesday: { name: "חיפה", lat: 32.7940, lng: 34.9896 },
  wednesday: { name: "נהריה", lat: 33.0094, lng: 35.0947 },
  thursday: { name: "אילון", lat: 33.062496506108666, lng: 35.21928128639784 },
  friday: { name: "אילון", lat: 33.062496506108666, lng: 35.21928128639784 },
  saturday: { name: "אילון", lat: 33.062496506108666, lng: 35.21928128639784 }
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [orders, setOrders] = useState<OrderWithLocation[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OrderWithLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [algorithmType, setAlgorithmType] = useState<'nearest' | '2opt'>('2opt');
  
  // Get starting point based on selected date
  const getStartingPoint = () => {
    const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase();
    return STARTING_POINTS[dayOfWeek as keyof typeof STARTING_POINTS] || STARTING_POINTS.default;
  };
  
  const startingPoint = getStartingPoint();
  const [mapCenter, setMapCenter] = useState<[number, number]>([startingPoint.lat, startingPoint.lng]);

  // Fetch orders for the selected date
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // First, get orders with customer info
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_address,
          delivery_date,
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
        .eq('delivery_date', format(selectedDate, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);

      if (ordersError) throw ordersError;

      // Get unique customer IDs
      const customerIds = [...new Set(ordersData?.map(order => order.customer_id).filter(Boolean) || [])];

      // Fetch customer details
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, city, address')
        .in('id', customerIds);

      if (customersError) throw customersError;

      // Create customer lookup map
      const customerMap = new Map(customersData?.map(c => [c.id, c]) || []);

      // Transform the data
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
      }) || [];

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

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ניהול מסלולים יומיים</h1>
        <Badge variant="outline" className="text-lg">
          <Navigation className="w-4 h-4 ml-2" />
          נקודת התחלה: {startingPoint.name}
        </Badge>
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
                נמצאו {orders.length} הזמנות לתאריך זה
              </p>
              
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
                onClick={optimizeRoute} 
                disabled={orders.length === 0 || loading}
                className="w-full"
              >
                {loading ? 'טוען...' : 'חשב מסלול אופטימלי'}
              </Button>
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
                <Button 
                  onClick={exportRoute}
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  <Package className="w-4 h-4 ml-2" />
                  ייצא מסלול
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-2 h-[600px]">
          <CardContent className="p-0 h-full">
            <MapContainer 
              center={mapCenter} 
              zoom={10} 
              style={{ height: '100%', width: '100%' }}
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
                  color="blue" 
                  weight={3}
                  opacity={0.7}
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
                <div key={order.id} className="flex items-start gap-4 p-4 border rounded-lg">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
