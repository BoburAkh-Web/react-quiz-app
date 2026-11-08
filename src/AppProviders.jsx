import { QueryClientProvider } from "@tanstack/react-query";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { StudentAuthProvider } from "./context/StudentAuthContext";
import { queryClient } from "./lib/queryClient";

// Ilova va testlar uchun umumiy provider'lar (router bundan tashqarida beriladi)
function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StudentAuthProvider>
        <AdminAuthProvider>
          {/* Faqat kerakli animatsiya imkoniyatlari: bundle yengilroq. strict — m.* dan boshqasiga ruxsat yo'q */}
          <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion="user">
              {children}
              <Toaster theme="dark" position="top-center" richColors closeButton />
            </MotionConfig>
          </LazyMotion>
        </AdminAuthProvider>
      </StudentAuthProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
