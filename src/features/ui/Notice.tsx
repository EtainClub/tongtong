/** 불러오는 중·오류처럼 화면 전체를 대신하는 한 줄. */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="fade-in-late mx-auto max-w-xl px-5 py-24 text-center text-graphite">
      {children}
    </main>
  );
}
