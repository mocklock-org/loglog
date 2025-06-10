import NpmButton from "./components/NpmButton";
import ClientButton from "./components/ClientButton";
import ServerButton from "./components/ServerButton";
import CopyableCode from "./components/CopyableCode";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl py-10 sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-300 mb-6">
          NextJs example with LogLog Core
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl">
          This is a simple example of how to use LogLog Core in a NextJs
          application. Experience seamless logging integration with our powerful
          toolkit.
        </p>
        <div className="mt-10 flex gap-4">
          <ClientButton />
          <ServerButton />
          <NpmButton />
        </div>

        <div className="mt-16 w-full max-w-2xl">
          <div className="bg-zinc-800 rounded-lg p-6 text-left">
            <h2 className="text-2xl font-semibold text-zinc-100 mb-4">
              Installation
            </h2>
            <CopyableCode />
          </div>
        </div>
      </div>
    </main>
  );
}
