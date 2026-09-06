import Script from 'next/script'

export function MobileBanner320x50() {
  return (
    <div className="flex justify-center my-6 w-full">
      <Script id="adsterra-mobile-config" strategy="afterInteractive">
        {`
          atOptions = {
            'key' : '5857abbf9515619a371c38758a4e2461',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        `}
      </Script>
      <Script
        src="https://www.highrevenueformat.com/5857abbf9515619a371c38758a4e2461/invoke.js"
        strategy="afterInteractive"
      />
    </div>
  )
}

export function NativeBanner() {
  return (
    <div className="my-6 w-full flex justify-center">
      <Script
        src="https://pl31218662.profitableratecpmnetwork.com/fb65e70ebb201c3fe329914b0de99570/invoke.js"
        strategy="afterInteractive"
        async
        data-cfasync="false"
      />
      <div id="container-fb65e70ebb201c3fe329914b0de99570"></div>
    </div>
  )
}