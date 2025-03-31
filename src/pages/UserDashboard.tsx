
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MainLayoutWithFooter from "@/components/MainLayoutWithFooter";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { HistoryIcon, PencilIcon, CalendarIcon, PlusIcon } from "lucide-react";

const UserDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const actionCards = [
    {
      title: "הזמנה חדשה",
      icon: <PlusIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/new"),
    },
    {
      title: "ביצוע או עדכון הזמנה קיימת",
      icon: <PencilIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/current"),
    },
    {
      title: "עדכון הזמנה למחר",
      icon: <CalendarIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/tomorrow"),
    },
    {
      title: "צפייה בהיסטוריה",
      icon: <HistoryIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/history"),
    },
  ];

  return (
    <MainLayoutWithFooter>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-serif font-bold mb-6 text-right">
          {`שלום, ${user?.name || 'לקוח'}`}
        </h1>
        
        <div className="space-y-4 mb-20">
          {actionCards.map((card, index) => (
            <Card 
              key={index} 
              className="flex p-4 items-center justify-between cursor-pointer hover:bg-accent transition-colors"
              onClick={card.action}
            >
              <div className="flex items-center">
                <div className="ml-4">{card.icon}</div>
                <h3 className="text-lg font-medium">{card.title}</h3>
              </div>
              <Button variant="ghost" size="icon">
                <PencilIcon className="h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </MainLayoutWithFooter>
  );
};

export default UserDashboard;
