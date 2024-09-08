import Image from "next/image";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function onSubmit(event){
  event.preventDefault();
  console.log(event);
}

export default function Home() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
       <h1>Generate Change Log</h1>
      <form action='/api/summarize' 
            onSubmit={onSubmit} 
            method='POST'>
        <input name='repo' placeholder='repo'/>
        <input name='date' placeholder='date' />
        <br/>
        <input type='submit' />
      </form>
    </div>
  );
}
