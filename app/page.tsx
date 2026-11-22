import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <h1>
        <Image
          src="/brand/logo-full.svg"
          alt="PlanWise"
          width={440}
          height={100}
          loading="eager"
        />
      </h1>
    </main>
  );
}
