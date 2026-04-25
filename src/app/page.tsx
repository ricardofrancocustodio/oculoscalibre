
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-zinc-100 font-sans">
      <main className="w-full max-w-2xl flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full flex flex-col items-center gap-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-6 w-full flex flex-col items-center">
            <Image
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"
              alt="Óculos Calibre MB-1572S"
              width={320}
              height={120}
              className="rounded-xl mb-6 shadow-lg border border-zinc-800"
              priority
            />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-center text-zinc-50">
              Calibre MB-1572S
            </h1>
            <p className="text-lg text-zinc-400 mb-4 text-center">
              Óculos masculino premium para cabeça grande<br />
              <span className="text-zinc-200">Acetato preto, frontal 150.7mm</span>
            </p>
            <div className="flex flex-col items-center gap-2 mb-6">
              <span className="text-2xl font-semibold text-emerald-400">R$ 299</span>
              <span className="text-xs text-zinc-500">Frete grátis para todo o Brasil</span>
            </div>
            <button
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black"
              disabled
              title="Pagamento Mercado Pago em breve"
            >
              Comprar agora
            </button>
            <span className="mt-2 text-xs text-zinc-500">Pagamento Mercado Pago em breve</span>
          </div>
          <div className="mt-8 text-center text-zinc-400 text-sm max-w-md">
            <p>
              A Calibre nasceu para quem sempre teve dificuldade em encontrar óculos estilosos e confortáveis para cabeças grandes. O modelo MB-1572S foi desenhado para proporcionar ajuste perfeito, qualidade premium e visual marcante.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
