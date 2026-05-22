import Navbar from '../components/Navbar'
import { useTranslation } from '../i18n/LanguageContext'

export default function LandingPage() {
  const { t } = useTranslation()

  const features = [
    t('landing.feature1'),
    t('landing.feature2'),
    t('landing.feature3')
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <img 
            src="/assets/hero.png" 
            alt="Iron Gym" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 animate-fadeIn"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10 text-white">
            <div className="inline-block px-4 py-1.5 mb-6 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-500 text-xs font-bold tracking-widest uppercase animate-fadeIn">
              {t('landing.badge')}
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase mb-8 leading-[0.85] animate-slideUp">
              {t('landing.heroTitle1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]">{t('landing.heroTitle2')}</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              {t('landing.heroSubtitle')}
            </p>

            <button
              onClick={() => document.querySelector('nav button').click()}
              className="group relative px-12 py-6 bg-orange-500 rounded-2xl font-black text-xl uppercase transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] overflow-hidden"
            >
              <span className="relative z-10">{t('landing.cta')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="animate-fadeIn">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-6">
                {t('landing.equipmentTitle')} <span className="text-orange-500">{t('landing.equipmentHighlight')}</span>
              </h2>
              <p className="text-slate-500 dark:text-gray-400 text-lg mb-8">
                {t('landing.equipmentDesc')}
              </p>
              <ul className="space-y-4">
                {features.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold">
                    <span className="text-orange-500">✔</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative group overflow-hidden rounded-[3rem] border-2 border-orange-500/20 shadow-2xl animate-slideUp">
              <img src="/assets/equipment.png" alt="Equipamiento" className="w-full aspect-square object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-orange-500/10 group-hover:bg-transparent transition duration-700"></div>
            </div>
          </div>
        </section>

        <section className="py-32 px-6 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center flex-row-reverse">
             <div className="relative order-2 md:order-1 group overflow-hidden rounded-[3rem] border-2 border-orange-500/20 shadow-2xl animate-slideUp">
              <img src="/assets/training.png" alt="Entrenamiento" className="w-full aspect-square object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-orange-500/10 group-hover:bg-transparent transition duration-700"></div>
            </div>
            <div className="order-1 md:order-2 animate-fadeIn">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-6">
                {t('landing.trainersTitle')} <span className="text-orange-500">{t('landing.trainersHighlight')}</span>
              </h2>
              <p className="text-slate-500 dark:text-gray-400 text-lg mb-8">
                {t('landing.trainersDesc')}
              </p>
              <button className="px-8 py-4 border-2 border-orange-500 text-orange-500 font-bold rounded-xl hover:bg-orange-500 hover:text-white transition">
                {t('landing.meetTeam')}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


