import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CakeIcon, ShoppingCartIcon, UsersIcon, TrendingUpIcon } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground font-noto">ברוכים הבאים לפאנל הניהול של מאפיית אורבר</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ מוצרים</CardTitle>
            <CakeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              +3 מוצרים חדשים החודש
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              +5 הזמנות חדשות היום
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוחות</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              +7 לקוחות חדשים החודש
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪9,485</div>
            <p className="text-xs text-muted-foreground">
              +18% מהחודש שעבר
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>הזמנות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">פיתה אסלית קמח מלא</p>
                  <p className="text-sm text-muted-foreground">
                    הזמנה #438 - אבי כהן
                  </p>
                </div>
                <div className="mr-auto font-medium">₪160</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">לאפות מיוחדות</p>
                  <p className="text-sm text-muted-foreground">
                    הזמנה #437 - שרה לוי
                  </p>
                </div>
                <div className="mr-auto font-medium">₪220</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">בגט צרפתי</p>
                  <p className="text-sm text-muted-foreground">
                    הזמנה #436 - דוד נוימן
                  </p>
                </div>
                <div className="mr-auto font-medium">₪95</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>מוצרים פופולריים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">פיתה אסלית</p>
                  <p className="text-sm text-muted-foreground">
                    42 הזמנות החודש
                  </p>
                </div>
                <div className="mr-auto font-medium">₪15</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">בגט</p>
                  <p className="text-sm text-muted-foreground">
                    36 הזמנות החודש
                  </p>
                </div>
                <div className="mr-auto font-medium">₪10</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 space-y-1">
                  <p className="text-sm font-medium leading-none">לאפות</p>
                  <p className="text-sm text-muted-foreground">
                    28 הזמנות החודש
                  </p>
                </div>
                <div className="mr-auto font-medium">₪20</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
