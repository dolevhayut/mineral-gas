
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MainLayoutWithFooter from "@/components/MainLayoutWithFooter";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { HistoryIcon, PencilIcon, CalendarIcon, PlusIcon, BellIcon } from "lucide-react";

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

  // Sample system updates - in a real app, these would come from the backend
  const systemUpdates = [
    {
      id: 1,
      date: "24/07/2023",
      content: "המאפייה תהיה סגורה בתאריך 30/07 עקב שיפוצים."
    },
    {
      id: 2,
      date: "18/07/2023",
      content: "מוצר חדש! לחם כוסמין מלא זמין עכשיו להזמנה."
    }
  ];

  return (
    <MainLayoutWithFooter>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-serif font-bold mb-6 text-right">
          {`שלום, ${user?.name || 'לקוח'}`}
        </h1>
        
        <div className="space-y-4 mb-8">
          {actionCards.map((card, index) => (
            <Card 
              key={index} 
              className="flex p-4 items-center justify-between cursor-pointer hover:bg-accent transition-colors"
              onClick={card.action}
            >
              <Button variant="ghost" size="icon">
                <PencilIcon className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <h3 className="text-lg font-medium">{card.title}</h3>
                <div className="mr-4">{card.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-3 text-right flex items-center">
          <BellIcon className="ml-2 h-5 w-5 text-bakery-600" />
          עדכוני מערכת
        </h2>
        
        <div className="space-y-3 mb-20">
          {systemUpdates.length > 0 ? (
            systemUpdates.map((update) => (
              <Card key={update.id} className="p-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">{update.date}</span>
                  <p className="text-right flex-1 mr-4">{update.content}</p>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-4">
              <p className="text-center text-muted-foreground">אין עדכונים חדשים</p>
            </Card>
          )}
        </div>
      </div>
    </MainLayoutWithFooter>
  );
};

export default UserDashboard;
