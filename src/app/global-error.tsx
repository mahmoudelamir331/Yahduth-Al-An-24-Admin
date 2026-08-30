"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ar" dir="rtl"><body><main className="error-page"><h1>حصل خطأ غير متوقع</h1><button onClick={() => reset()}>إعادة المحاولة</button></main></body></html>;
}
