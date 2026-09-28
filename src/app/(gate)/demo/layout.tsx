import Script from "next/script";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="/assets/lottie-js/lottie.min.js" strategy="afterInteractive" />
      <Script src="/assets/lottie-js/philia-trust-graph-modified.js" strategy="afterInteractive" />
      <Script src="/assets/lottie-js/signalLottieData.js" strategy="afterInteractive" />
      {children}
    </>
  );
}
