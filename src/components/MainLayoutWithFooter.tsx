
import { ReactNode } from "react";
import MainLayout from "./MainLayout";
import StickyFooter from "./StickyFooter";

interface MainLayoutWithFooterProps {
  children: ReactNode;
}

export default function MainLayoutWithFooter({ children }: MainLayoutWithFooterProps) {
  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <MainLayout>
        {children}
      </MainLayout>
      <StickyFooter />
    </div>
  );
}
