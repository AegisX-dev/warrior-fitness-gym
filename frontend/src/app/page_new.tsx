import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-yellow-400">
            WARRIOR FITNESS GYM
          </div>
          <div className="space-x-4">
            <Link 
              href="/auth/login" 
              className="bg-yellow-400 text-black px-6 py-2 rounded-md font-medium hover:bg-yellow-300 transition-colors"
            >
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            UNLEASH YOUR
            <span className="text-yellow-400 block">INNER WARRIOR</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            Transform your body, mind, and spirit at the ultimate fitness destination
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register" 
              className="bg-yellow-400 text-black px-8 py-3 rounded-md font-bold text-lg hover:bg-yellow-300 transition-colors"
            >
              Join Now
            </Link>
            <Link 
              href="/auth/login" 
              className="border-2 border-yellow-400 text-yellow-400 px-8 py-3 rounded-md font-bold text-lg hover:bg-yellow-400 hover:text-black transition-colors"
            >
              Member Login
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">💪</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Professional Training</h3>
            <p className="text-gray-400">Expert trainers to guide your fitness journey</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🏋️</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Modern Equipment</h3>
            <p className="text-gray-400">State-of-the-art gym equipment and facilities</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Flexible Plans</h3>
            <p className="text-gray-400">Choose from Basic, Premium, or VIP memberships</p>
          </div>
        </div>
      </main>
    </div>
  );
}
